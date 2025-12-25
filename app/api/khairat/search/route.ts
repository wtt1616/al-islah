import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

interface AhliRow extends RowDataPacket {
  id: number;
  nama: string;
  no_kp: string;
  alamat: string | null;
  taman: string | null;
  no_hp: string;
  email: string | null;
  tarikh_daftar: string | null;
  status: string;
  amaun_bayaran: number | null;
  no_resit: string | null;
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

    // Search in khairat_ahli for approved members (plain text comparison)
    const [ahliRecords] = await pool.query<AhliRow[]>(
      `SELECT ka.*,
        (SELECT COUNT(*) FROM khairat_tanggungan WHERE khairat_ahli_id = ka.id) as tanggungan_count
       FROM khairat_ahli ka
       WHERE ka.status = 'approved' AND ka.no_kp = ?`,
      [cleanNoKp]
    );

    if (ahliRecords.length === 0) {
      // Try partial match
      const [partialRecords] = await pool.query<AhliRow[]>(
        `SELECT ka.*,
          (SELECT COUNT(*) FROM khairat_tanggungan WHERE khairat_ahli_id = ka.id) as tanggungan_count
         FROM khairat_ahli ka
         WHERE ka.status = 'approved' AND ka.no_kp LIKE ?`,
        [`%${cleanNoKp}%`]
      );

      if (partialRecords.length === 0) {
        return NextResponse.json({
          found: false,
          message: 'Rekod tidak dijumpai. Sila pastikan No K/P anda betul atau daftar sebagai ahli baru.'
        });
      }

      // Use first partial match
      const ahli = partialRecords[0];
      return await buildResponse(ahli);
    }

    const ahli = ahliRecords[0];
    return await buildResponse(ahli);

  } catch (error) {
    console.error('Error searching khairat member:', error);
    return NextResponse.json(
      { error: 'Ralat semasa mencari rekod: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

async function buildResponse(ahli: AhliRow) {
  // Get tanggungan
  const [tanggunganRows] = await pool.query<RowDataPacket[]>(
    `SELECT nama_penuh, pertalian, no_kp, umur FROM khairat_tanggungan WHERE khairat_ahli_id = ?`,
    [ahli.id]
  );

  const tanggungan = tanggunganRows.map((t: RowDataPacket) => {
    let hubungan = t.pertalian;
    if (t.pertalian === 'isteri' || t.pertalian === 'pasangan') hubungan = 'Pasangan';
    else if (t.pertalian === 'anak') hubungan = 'Anak';
    else if (t.pertalian === 'anak_oku') hubungan = 'Anak OKU';
    else if (t.pertalian === 'bapa') hubungan = 'Bapa';
    else if (t.pertalian === 'ibu') hubungan = 'Ibu';

    return {
      hubungan,
      nama: t.nama_penuh,
      no_kp: t.no_kp,
      umur: t.umur
    };
  });

  // Get payment history from khairat_bayaran
  const [payments] = await pool.query<RowDataPacket[]>(
    `SELECT tahun, amaun as jumlah, no_resit, status
     FROM khairat_bayaran
     WHERE khairat_ahli_id = ?
     ORDER BY tahun DESC`,
    [ahli.id]
  );

  // Calculate payment summary
  const currentYear = new Date().getFullYear();
  const paidPayments = payments.filter((p: RowDataPacket) => p.status === 'paid' || p.status === 'approved');
  const paidYears = paidPayments.map((p: RowDataPacket) => p.tahun);
  const latestPaidYear = paidYears.length > 0 ? Math.max(...paidYears) : null;
  const totalPaid = paidPayments.reduce((sum: number, p: RowDataPacket) => sum + Number(p.jumlah || 0), 0);

  // Use registration payment if no separate payments exist
  let statusBayaran = 'Belum Ada Bayaran';
  let effectiveLatestYear = latestPaidYear;

  // Check if member has paid during registration
  if (ahli.amaun_bayaran && ahli.amaun_bayaran > 0 && ahli.tarikh_daftar) {
    const registrationYear = new Date(ahli.tarikh_daftar).getFullYear();
    if (!effectiveLatestYear || registrationYear > effectiveLatestYear) {
      effectiveLatestYear = registrationYear;
    }
  }

  if (effectiveLatestYear) {
    if (effectiveLatestYear >= currentYear) {
      statusBayaran = 'Terkini';
    } else if (effectiveLatestYear === currentYear - 1) {
      statusBayaran = 'Tertunggak 1 Tahun';
    } else {
      statusBayaran = `Tertunggak ${currentYear - effectiveLatestYear} Tahun`;
    }
  }

  // Build full address
  let fullAddress = ahli.alamat || '';
  if (ahli.taman) {
    fullAddress = fullAddress ? `${fullAddress}, ${ahli.taman}` : ahli.taman;
  }

  return NextResponse.json({
    found: true,
    source: 'khairat_ahli',
    ahli_id: ahli.id,
    member: {
      no_kp: ahli.no_kp,
      no_ahli: `KA-${ahli.id.toString().padStart(5, '0')}`,
      nama: ahli.nama,
      alamat: fullAddress,
      no_hp: ahli.no_hp,
      email: ahli.email,
      tarikh_daftar: ahli.tarikh_daftar,
      status_ahli: 'aktif',
      amaun_bayaran: ahli.amaun_bayaran,
      no_resit: ahli.no_resit
    },
    tanggungan,
    payments: payments.map((p: RowDataPacket) => ({
      tahun: p.tahun,
      jumlah: p.jumlah,
      no_resit: p.no_resit,
      status: p.status === 'approved' ? 'paid' : p.status
    })),
    summary: {
      total_paid: totalPaid + (ahli.amaun_bayaran || 0),
      latest_paid_year: effectiveLatestYear,
      status_bayaran: statusBayaran,
      jumlah_tanggungan: tanggungan.length,
      pending_count: payments.filter((p: RowDataPacket) => p.status === 'pending').length
    }
  });
}
