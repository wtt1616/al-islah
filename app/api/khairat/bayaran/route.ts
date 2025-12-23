import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { decrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

interface KhairatBayaranRow extends RowDataPacket {
  id: number;
  khairat_ahli_id: number;
  tahun: string;
  jenis_bayaran: 'tahunan' | 'tunggakan';
  amaun: number;
  no_resit: string | null;
  resit_file: string | null;
  status: 'pending' | 'approved' | 'rejected';
  tarikh_bayar: string | null;
  tarikh_lulus: Date | null;
  approved_by: number | null;
  reject_reason: string | null;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  nama_ahli: string;
  no_kp_ahli: string;
  no_hp_ahli: string;
  approver_name?: string;
}

// POST - Submit new annual fee payment (Public)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { ahli_id, member_id, tahun, no_resit, resit_file, amaun } = body;

    // Validation
    if ((!ahli_id && !member_id) || !tahun || !no_resit) {
      return NextResponse.json(
        { error: 'Sila lengkapkan semua maklumat wajib' },
        { status: 400 }
      );
    }

    // If member_id is provided (from khairat_members), find or create linked khairat_ahli record
    if (member_id && !ahli_id) {
      // Get member data from khairat_members
      const [memberRows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM khairat_members WHERE id = ?',
        [member_id]
      );

      if (memberRows.length === 0) {
        return NextResponse.json(
          { error: 'Ahli tidak dijumpai dalam rekod' },
          { status: 404 }
        );
      }

      const member = memberRows[0];

      // Check if already has linked khairat_ahli record
      const [linkedRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM khairat_ahli WHERE linked_member_id = ?',
        [member_id]
      );

      if (linkedRows.length > 0) {
        ahli_id = linkedRows[0].id;
      } else {
        // Create new khairat_ahli record linked to this member
        const [insertResult] = await pool.query<ResultSetHeader>(
          `INSERT INTO khairat_ahli
            (linked_member_id, nama, no_kp, alamat, no_hp, email, jenis_yuran, status, tarikh_daftar, tarikh_lulus)
           VALUES (?, ?, ?, ?, ?, ?, 'tahunan', 'approved', ?, NOW())`,
          [
            member_id,
            member.nama_ahli,
            member.no_kp, // Not encrypted for old data
            member.alamat,
            member.no_hp,
            member.email,
            member.tarikh_daftar
          ]
        );
        ahli_id = insertResult.insertId;
      }
    }

    // Check if ahli exists
    const [ahliRows] = await pool.query<RowDataPacket[]>(
      'SELECT id, nama, no_kp, no_hp, status FROM khairat_ahli WHERE id = ?',
      [ahli_id]
    );

    if (ahliRows.length === 0) {
      return NextResponse.json(
        { error: 'Ahli tidak dijumpai' },
        { status: 404 }
      );
    }

    const ahli = ahliRows[0];

    // For linked members (from old system), status should be 'approved'
    // For new registrations, check if approved
    if (ahli.status !== 'approved') {
      return NextResponse.json(
        { error: 'Hanya ahli yang telah diluluskan boleh membuat pembayaran yuran' },
        { status: 400 }
      );
    }

    // Check if payment for this year already exists
    const [existingPayment] = await pool.query<RowDataPacket[]>(
      'SELECT id, status FROM khairat_bayaran WHERE khairat_ahli_id = ? AND tahun = ?',
      [ahli_id, tahun]
    );

    if (existingPayment.length > 0) {
      const existing = existingPayment[0];
      if (existing.status === 'approved') {
        return NextResponse.json(
          { error: `Pembayaran yuran untuk tahun ${tahun} telah diluluskan` },
          { status: 400 }
        );
      } else if (existing.status === 'pending') {
        return NextResponse.json(
          { error: `Pembayaran yuran untuk tahun ${tahun} sedang menunggu kelulusan` },
          { status: 400 }
        );
      }
      // If rejected, allow resubmission - delete the old record
      await pool.query('DELETE FROM khairat_bayaran WHERE id = ?', [existing.id]);
    }

    // Determine jenis_bayaran based on current year
    // Parse the first year from tahun string (e.g., "2024, 2025" -> 2024)
    const currentYear = new Date().getFullYear();
    const tahunStr = String(tahun);
    const firstYear = parseInt(tahunStr.split(',')[0].trim()) || currentYear;
    const jenis_bayaran = firstYear < currentYear ? 'tunggakan' : 'tahunan';

    // Insert payment record
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO khairat_bayaran
        (khairat_ahli_id, tahun, jenis_bayaran, amaun, no_resit, resit_file, status, tarikh_bayar)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', CURDATE())`,
      [ahli_id, tahun, jenis_bayaran, amaun || 50.00, no_resit, resit_file || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Pembayaran yuran telah dihantar dan menunggu kelulusan',
      id: result.insertId
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting payment:', error);
    return NextResponse.json(
      { error: 'Gagal menghantar pembayaran' },
      { status: 500 }
    );
  }
}

// GET - List payments (Admin) or payment history for a specific member
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ahli_id = searchParams.get('ahli_id');

    // If ahli_id is provided, return payment history for that member (public access)
    if (ahli_id) {
      const [payments] = await pool.query<KhairatBayaranRow[]>(
        `SELECT kb.*, ka.nama as nama_ahli, ka.no_kp as no_kp_ahli, ka.no_hp as no_hp_ahli
         FROM khairat_bayaran kb
         JOIN khairat_ahli ka ON kb.khairat_ahli_id = ka.id
         WHERE kb.khairat_ahli_id = ?
         ORDER BY kb.tahun DESC`,
        [ahli_id]
      );

      // Get member info
      const [ahliRows] = await pool.query<RowDataPacket[]>(
        'SELECT id, nama, no_kp, no_hp, status, tarikh_daftar, tarikh_lulus FROM khairat_ahli WHERE id = ?',
        [ahli_id]
      );

      if (ahliRows.length === 0) {
        return NextResponse.json({ error: 'Ahli tidak dijumpai' }, { status: 404 });
      }

      const ahli = ahliRows[0];
      const decryptedNoKp = decrypt(ahli.no_kp);

      // Calculate payment summary
      const currentYear = new Date().getFullYear();
      const approvedPayments = payments.filter(p => p.status === 'approved');
      // Parse first year from tahun string (e.g., "2024, 2025" -> 2024)
      const paidYears = approvedPayments.map(p => parseInt(String(p.tahun).split(',')[0].trim()) || 0);
      const latestPaidYear = paidYears.length > 0 ? Math.max(...paidYears) : null;
      const totalPaid = approvedPayments.reduce((sum, p) => sum + Number(p.amaun || 0), 0);

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

      return NextResponse.json({
        ahli: {
          id: ahli.id,
          nama: ahli.nama,
          no_kp: decryptedNoKp,
          no_hp: ahli.no_hp,
          status: ahli.status,
          tarikh_daftar: ahli.tarikh_daftar,
          tarikh_lulus: ahli.tarikh_lulus
        },
        payments: payments.map(p => ({
          id: p.id,
          tahun: p.tahun,
          jenis_bayaran: p.jenis_bayaran,
          amaun: p.amaun,
          no_resit: p.no_resit,
          status: p.status,
          tarikh_bayar: p.tarikh_bayar,
          tarikh_lulus: p.tarikh_lulus
        })),
        summary: {
          total_paid: totalPaid,
          latest_paid_year: latestPaidYear,
          status_bayaran: statusBayaran,
          pending_count: payments.filter(p => p.status === 'pending').length
        }
      });
    }

    // Admin access - list all payments
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'head_imam', 'bendahari', 'khairat'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');
    const tahun = searchParams.get('tahun');

    let query = `
      SELECT
        kb.*,
        ka.nama as nama_ahli,
        ka.no_kp as no_kp_ahli,
        ka.no_hp as no_hp_ahli,
        u.name as approver_name
      FROM khairat_bayaran kb
      JOIN khairat_ahli ka ON kb.khairat_ahli_id = ka.id
      LEFT JOIN users u ON kb.approved_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'semua') {
      query += ' AND kb.status = ?';
      params.push(status);
    }

    if (tahun) {
      query += ' AND kb.tahun = ?';
      params.push(parseInt(tahun));
    }

    if (search) {
      // Search by nama or no_hp (no_kp is encrypted)
      query += ' AND (ka.nama LIKE ? OR ka.no_hp LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY kb.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<KhairatBayaranRow[]>(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total
      FROM khairat_bayaran kb
      JOIN khairat_ahli ka ON kb.khairat_ahli_id = ka.id
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (status && status !== 'semua') {
      countQuery += ' AND kb.status = ?';
      countParams.push(status);
    }

    if (tahun) {
      countQuery += ' AND kb.tahun = ?';
      countParams.push(parseInt(tahun));
    }

    if (search) {
      countQuery += ' AND (ka.nama LIKE ? OR ka.no_hp LIKE ?)';
      const searchPattern = `%${search}%`;
      countParams.push(searchPattern, searchPattern);
    }

    const [countResult] = await pool.query<RowDataPacket[]>(countQuery, countParams);
    const total = countResult[0].total;

    // Get status counts
    const [statusCounts] = await pool.query<RowDataPacket[]>(`
      SELECT
        status,
        COUNT(*) as count
      FROM khairat_bayaran
      GROUP BY status
    `);

    const counts = {
      semua: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    statusCounts.forEach((row: any) => {
      counts[row.status as keyof typeof counts] = row.count;
      counts.semua += row.count;
    });

    // Decrypt no_kp for each record
    const decryptedRows = rows.map(row => ({
      ...row,
      no_kp_ahli: decrypt(row.no_kp_ahli)
    }));

    return NextResponse.json({
      data: decryptedRows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      counts
    });

  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Gagal memuatkan senarai pembayaran' },
      { status: 500 }
    );
  }
}
