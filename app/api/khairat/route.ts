import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export const dynamic = 'force-dynamic';

interface KhairatAhliRow extends RowDataPacket {
  id: number;
  nama: string;
  no_kp: string;
  umur: number | null;
  alamat: string | null;
  no_telefon_rumah: string | null;
  no_hp: string;
  email: string | null;
  jenis_yuran: 'keahlian' | 'tahunan' | 'isteri_kedua';
  no_resit: string | null;
  amaun_bayaran: number;
  status: 'pending' | 'approved' | 'rejected';
  tarikh_daftar: string | null;
  tarikh_lulus: Date | null;
  approved_by: number | null;
  reject_reason: string | null;
  created_at: Date;
  updated_at: Date;
  approver_name?: string;
  tanggungan_count?: number;
}

// GET - Fetch all khairat applications (Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['admin', 'head_imam', 'bendahari', 'khairat'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    const search = searchParams.get('search');

    let query = `
      SELECT
        k.*,
        u.name as approver_name,
        (SELECT COUNT(*) FROM khairat_tanggungan WHERE khairat_ahli_id = k.id) as tanggungan_count
      FROM khairat_ahli k
      LEFT JOIN users u ON k.approved_by = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'semua') {
      query += ' AND k.status = ?';
      params.push(status);
    }

    if (search) {
      // Note: no_kp is encrypted, so we can only search by nama and no_hp
      query += ' AND (k.nama LIKE ? OR k.no_hp LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    query += ' ORDER BY k.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query<KhairatAhliRow[]>(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM khairat_ahli WHERE 1=1';
    const countParams: any[] = [];

    if (status && status !== 'semua') {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    if (search) {
      // Note: no_kp is encrypted, so we can only search by nama and no_hp
      countQuery += ' AND (nama LIKE ? OR no_hp LIKE ?)';
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
      FROM khairat_ahli
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

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      counts
    });
  } catch (error) {
    console.error('Error fetching khairat applications:', error);
    return NextResponse.json({ error: 'Gagal memuatkan senarai permohonan' }, { status: 500 });
  }
}
