import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { encrypt, decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

interface AhliRow extends RowDataPacket {
  id: number;
  nama: string;
  no_kp: string;
  alamat: string | null;
  no_hp: string;
  email: string | null;
  tarikh_daftar: string | null;
  status: string;
  tanggungan_count: number;
}

interface MatchedAhli {
  id: number;
  nama: string;
  no_kp: string;
  alamat: string | null;
  no_hp: string;
  email: string | null;
  tarikh_daftar: string | null;
  status: string;
  tanggungan_count: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const noKp = searchParams.get('no_kp');

    if (!noKp) {
      return NextResponse.json({ error: 'No K/P is required' }, { status: 400 });
    }

    // Clean IC number - remove dashes and spaces
    const cleanNoKp = noKp.replace(/[-\s]/g, '').trim();

    if (cleanNoKp.length < 6) {
      return NextResponse.json({ error: 'No K/P tidak sah' }, { status: 400 });
    }

    // First, search in khairat_ahli (new system with encryption) for approved members
    const [ahliRecords] = await pool.query<AhliRow[]>(
      `SELECT ka.*,
        (SELECT COUNT(*) FROM khairat_tanggungan WHERE khairat_ahli_id = ka.id) as tanggungan_count
       FROM khairat_ahli ka
       WHERE ka.status = 'approved'`
    );

    // Find matching ahli by decrypting and comparing
    let matchedAhli: MatchedAhli | null = null;
    for (const ahli of ahliRecords) {
      try {
        const decryptedNoKp = decrypt(ahli.no_kp);
        if (decryptedNoKp === cleanNoKp) {
          matchedAhli = {
            id: ahli.id,
            nama: ahli.nama,
            no_kp: decryptedNoKp,
            alamat: ahli.alamat,
            no_hp: ahli.no_hp,
            email: ahli.email,
            tarikh_daftar: ahli.tarikh_daftar,
            status: ahli.status,
            tanggungan_count: ahli.tanggungan_count
          };
          break;
        }
      } catch (e) {
        // Skip if decryption fails
        continue;
      }
    }

    // If found in khairat_ahli, return with payment info from both systems
    if (matchedAhli) {
      // Check if this ahli is linked to an old member
      const [linkedMemberRows] = await pool.query<RowDataPacket[]>(
        `SELECT linked_member_id FROM khairat_ahli WHERE id = ?`,
        [matchedAhli.id]
      );
      const linkedMemberId = linkedMemberRows[0]?.linked_member_id;

      // Get tanggungan from new system
      const [tanggunganRows] = await pool.query<RowDataPacket[]>(
        `SELECT nama_penuh, pertalian FROM khairat_tanggungan WHERE khairat_ahli_id = ?`,
        [matchedAhli.id]
      );

      let tanggungan = tanggunganRows.map(t => ({
        hubungan: t.pertalian === 'isteri' ? 'Isteri' : t.pertalian === 'anak' ? 'Anak' : t.pertalian === 'anak_oku' ? 'Anak OKU' : t.pertalian,
        nama: t.nama_penuh
      }));

      // If linked to old member, also get tanggungan from old system
      let oldMember = null;
      if (linkedMemberId) {
        const [oldMemberRows] = await pool.query<RowDataPacket[]>(
          `SELECT * FROM khairat_members WHERE id = ?`,
          [linkedMemberId]
        );
        if (oldMemberRows.length > 0) {
          oldMember = oldMemberRows[0];
          // Build dependents list from old system if new system has none
          if (tanggungan.length === 0) {
            if (oldMember.pasangan) tanggungan.push({ hubungan: 'Pasangan', nama: oldMember.pasangan });
            if (oldMember.anak1) tanggungan.push({ hubungan: 'Anak', nama: oldMember.anak1 });
            if (oldMember.anak2) tanggungan.push({ hubungan: 'Anak', nama: oldMember.anak2 });
            if (oldMember.anak3) tanggungan.push({ hubungan: 'Anak', nama: oldMember.anak3 });
            if (oldMember.anak4) tanggungan.push({ hubungan: 'Anak', nama: oldMember.anak4 });
            if (oldMember.anak5) tanggungan.push({ hubungan: 'Anak', nama: oldMember.anak5 });
            if (oldMember.anak6) tanggungan.push({ hubungan: 'Anak', nama: oldMember.anak6 });
            if (oldMember.anak7) tanggungan.push({ hubungan: 'Anak', nama: oldMember.anak7 });
            if (oldMember.anak8) tanggungan.push({ hubungan: 'Anak', nama: oldMember.anak8 });
            if (oldMember.bapa) tanggungan.push({ hubungan: 'Bapa', nama: oldMember.bapa });
            if (oldMember.ibu) tanggungan.push({ hubungan: 'Ibu', nama: oldMember.ibu });
            if (oldMember.bapa_mertua) tanggungan.push({ hubungan: 'Bapa Mertua', nama: oldMember.bapa_mertua });
            if (oldMember.mak_mertua) tanggungan.push({ hubungan: 'Ibu Mertua', nama: oldMember.mak_mertua });
          }
        }
      }

      // Get payment history from khairat_bayaran (new system)
      const [newPayments] = await pool.query<RowDataPacket[]>(
        `SELECT tahun, amaun as jumlah, no_resit, status
         FROM khairat_bayaran
         WHERE khairat_ahli_id = ?
         ORDER BY tahun DESC`,
        [matchedAhli.id]
      );

      // Get payment history from khairat_payments (old system) if linked
      let oldPayments: RowDataPacket[] = [];
      if (linkedMemberId) {
        const [oldPaymentRows] = await pool.query<RowDataPacket[]>(
          `SELECT tahun, jumlah, no_resit, status
           FROM khairat_payments
           WHERE member_id = ?
           ORDER BY tahun DESC`,
          [linkedMemberId]
        );
        oldPayments = oldPaymentRows;
      }

      // Combine payments from both systems
      const allPayments = [
        ...newPayments.map(p => ({
          tahun: p.tahun,
          jumlah: p.jumlah,
          no_resit: p.no_resit,
          status: p.status === 'approved' ? 'paid' : p.status,
          source: 'new'
        })),
        ...oldPayments.map(p => ({
          tahun: p.tahun,
          jumlah: p.jumlah,
          no_resit: p.no_resit,
          status: p.status,
          source: 'old'
        }))
      ].sort((a, b) => b.tahun - a.tahun);

      // Calculate payment summary
      const currentYear = new Date().getFullYear();
      const paidPayments = allPayments.filter(p => p.status === 'paid' || p.status === 'approved');
      const paidYears = paidPayments.map(p => p.tahun);
      const latestPaidYear = paidYears.length > 0 ? Math.max(...paidYears) : null;
      const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.jumlah || 0), 0);

      let statusBayaran = 'Belum Ada Bayaran';
      if (latestPaidYear) {
        if (latestPaidYear >= currentYear) {
          statusBayaran = 'Terkini';
        } else if (latestPaidYear === currentYear - 1) {
          statusBayaran = 'Tertunggak 1 Tahun';
        } else {
          statusBayaran = `Tertunggak ${currentYear - latestPaidYear} Tahun`;
        }
      }

      // Use info from old member if available for display
      const displayMember = oldMember ? {
        no_kp: matchedAhli.no_kp,
        no_ahli: oldMember.no_ahli || `KA-${matchedAhli.id.toString().padStart(5, '0')}`,
        nama: oldMember.nama_ahli || matchedAhli.nama,
        alamat: oldMember.alamat || matchedAhli.alamat,
        no_hp: oldMember.no_hp || matchedAhli.no_hp,
        email: oldMember.email || matchedAhli.email,
        tarikh_daftar: oldMember.tarikh_daftar || matchedAhli.tarikh_daftar,
        status_ahli: oldMember.status_ahli || 'aktif',
      } : {
        no_kp: matchedAhli.no_kp,
        no_ahli: `KA-${matchedAhli.id.toString().padStart(5, '0')}`,
        nama: matchedAhli.nama,
        alamat: matchedAhli.alamat,
        no_hp: matchedAhli.no_hp,
        email: matchedAhli.email,
        tarikh_daftar: matchedAhli.tarikh_daftar,
        status_ahli: 'aktif',
      };

      return NextResponse.json({
        found: true,
        source: 'khairat_ahli',
        ahli_id: matchedAhli.id,
        member_id: linkedMemberId,
        member: displayMember,
        tanggungan,
        payments: allPayments.map(p => ({
          tahun: p.tahun,
          jumlah: p.jumlah,
          no_resit: p.no_resit,
          status: p.status,
          source: p.source
        })),
        summary: {
          total_paid: totalPaid,
          latest_paid_year: latestPaidYear,
          status_bayaran: statusBayaran,
          jumlah_tanggungan: tanggungan.length,
          pending_count: newPayments.filter(p => p.status === 'pending').length
        }
      });
    }

    // If not found in khairat_ahli, search in khairat_members (old system)
    const [members] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM khairat_members WHERE no_kp = ? OR no_kp LIKE ?`,
      [cleanNoKp, `%${cleanNoKp}%`]
    );

    if (members.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'Rekod tidak dijumpai. Sila pastikan No K/P anda betul atau daftar sebagai ahli baru.'
      });
    }

    const member = members[0];

    // Check if this member already has a linked khairat_ahli record
    let linkedAhliId = null;
    const [linkedAhli] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM khairat_ahli WHERE linked_member_id = ?`,
      [member.id]
    );
    if (linkedAhli.length > 0) {
      linkedAhliId = linkedAhli[0].id;
    }

    // Get payment history from old system (khairat_payments)
    const [oldPayments] = await pool.query<RowDataPacket[]>(
      `SELECT tahun, jumlah, no_resit, status
       FROM khairat_payments
       WHERE member_id = ?
       ORDER BY tahun DESC`,
      [member.id]
    );

    // Get payment history from new system (khairat_bayaran) if linked
    let newPayments: RowDataPacket[] = [];
    if (linkedAhliId) {
      const [newPaymentRows] = await pool.query<RowDataPacket[]>(
        `SELECT tahun, amaun as jumlah, no_resit, status
         FROM khairat_bayaran
         WHERE khairat_ahli_id = ?
         ORDER BY tahun DESC`,
        [linkedAhliId]
      );
      newPayments = newPaymentRows;
    }

    // Combine payments from both systems
    const allPayments = [
      ...oldPayments.map(p => ({
        tahun: p.tahun,
        jumlah: p.jumlah,
        no_resit: p.no_resit,
        status: p.status,
        source: 'old'
      })),
      ...newPayments.map(p => ({
        tahun: p.tahun,
        jumlah: p.jumlah,
        no_resit: p.no_resit,
        status: p.status === 'approved' ? 'paid' : p.status,
        source: 'new'
      }))
    ].sort((a, b) => b.tahun - a.tahun);

    // Build dependents list
    const tanggungan = [];
    if (member.pasangan) tanggungan.push({ hubungan: 'Pasangan', nama: member.pasangan });
    if (member.anak1) tanggungan.push({ hubungan: 'Anak', nama: member.anak1 });
    if (member.anak2) tanggungan.push({ hubungan: 'Anak', nama: member.anak2 });
    if (member.anak3) tanggungan.push({ hubungan: 'Anak', nama: member.anak3 });
    if (member.anak4) tanggungan.push({ hubungan: 'Anak', nama: member.anak4 });
    if (member.anak5) tanggungan.push({ hubungan: 'Anak', nama: member.anak5 });
    if (member.anak6) tanggungan.push({ hubungan: 'Anak', nama: member.anak6 });
    if (member.anak7) tanggungan.push({ hubungan: 'Anak', nama: member.anak7 });
    if (member.anak8) tanggungan.push({ hubungan: 'Anak', nama: member.anak8 });
    if (member.bapa) tanggungan.push({ hubungan: 'Bapa', nama: member.bapa });
    if (member.ibu) tanggungan.push({ hubungan: 'Ibu', nama: member.ibu });
    if (member.bapa_mertua) tanggungan.push({ hubungan: 'Bapa Mertua', nama: member.bapa_mertua });
    if (member.mak_mertua) tanggungan.push({ hubungan: 'Ibu Mertua', nama: member.mak_mertua });

    // Calculate payment summary from combined payments
    const currentYear = new Date().getFullYear();
    const paidPayments = allPayments.filter(p => p.status === 'paid' || p.status === 'approved');
    const paidYears = paidPayments.map(p => p.tahun);
    const latestPaidYear = paidYears.length > 0 ? Math.max(...paidYears) : null;
    const totalPaid = paidPayments.reduce((sum, p) => sum + Number(p.jumlah || 0), 0);

    // Determine payment status
    let statusBayaran = 'Tidak Diketahui';
    if (latestPaidYear) {
      if (latestPaidYear >= currentYear) {
        statusBayaran = 'Terkini';
      } else if (latestPaidYear === currentYear - 1) {
        statusBayaran = 'Tertunggak 1 Tahun';
      } else {
        statusBayaran = `Tertunggak ${currentYear - latestPaidYear} Tahun`;
      }
    }

    return NextResponse.json({
      found: true,
      source: 'khairat_members',
      member_id: member.id,
      ahli_id: linkedAhliId,
      member: {
        no_kp: member.no_kp,
        no_ahli: member.no_ahli,
        nama: member.nama_ahli,
        alamat: member.alamat,
        no_hp: member.no_hp,
        email: member.email,
        tarikh_daftar: member.tarikh_daftar,
        status_ahli: member.status_ahli,
      },
      tanggungan,
      payments: allPayments.map(p => ({
        tahun: p.tahun,
        jumlah: p.jumlah,
        no_resit: p.no_resit,
        status: p.status,
        source: p.source
      })),
      summary: {
        total_paid: totalPaid,
        latest_paid_year: latestPaidYear,
        status_bayaran: statusBayaran,
        jumlah_tanggungan: tanggungan.length,
        pending_count: newPayments.filter(p => p.status === 'pending').length
      }
    });

  } catch (error) {
    console.error('Error searching khairat member:', error);
    return NextResponse.json(
      { error: 'Ralat semasa mencari rekod' },
      { status: 500 }
    );
  }
}
