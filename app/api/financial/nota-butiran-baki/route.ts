import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface BakiBankRow extends RowDataPacket {
  id: number;
  tahun: number;
  nama_bank: string;
  cawangan: string | null;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface BakiPelaburanRow extends RowDataPacket {
  id: number;
  tahun: number;
  nama_institusi: string;
  cawangan: string | null;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface BakiDepositRow extends RowDataPacket {
  id: number;
  tahun: number;
  perkara: string;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

// GET - Fetch all nota butiran baki for a specific year
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'head_imam', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tahun = parseInt(searchParams.get('tahun') || new Date().getFullYear().toString());

    // Fetch bank balances
    const [bakiBank] = await pool.query<BakiBankRow[]>(
      'SELECT * FROM nota_baki_bank WHERE tahun = ? ORDER BY id',
      [tahun]
    );

    // Fetch investment balances
    const [bakiPelaburan] = await pool.query<BakiPelaburanRow[]>(
      'SELECT * FROM nota_baki_pelaburan WHERE tahun = ? ORDER BY id',
      [tahun]
    );

    // Fetch deposit balances
    const [bakiDeposit] = await pool.query<BakiDepositRow[]>(
      'SELECT * FROM nota_baki_deposit WHERE tahun = ? ORDER BY id',
      [tahun]
    );

    // Calculate totals
    const jumlahBankSemasa = bakiBank.reduce((sum, row) => sum + parseFloat(row.baki_tahun_semasa?.toString() || '0'), 0);
    const jumlahBankSebelum = bakiBank.reduce((sum, row) => sum + parseFloat(row.baki_tahun_sebelum?.toString() || '0'), 0);
    const jumlahPelaburanSemasa = bakiPelaburan.reduce((sum, row) => sum + parseFloat(row.baki_tahun_semasa?.toString() || '0'), 0);
    const jumlahPelaburanSebelum = bakiPelaburan.reduce((sum, row) => sum + parseFloat(row.baki_tahun_sebelum?.toString() || '0'), 0);
    const jumlahDepositSemasa = bakiDeposit.reduce((sum, row) => sum + parseFloat(row.baki_tahun_semasa?.toString() || '0'), 0);
    const jumlahDepositSebelum = bakiDeposit.reduce((sum, row) => sum + parseFloat(row.baki_tahun_sebelum?.toString() || '0'), 0);

    return NextResponse.json({
      tahun,
      bakiBank,
      bakiPelaburan,
      bakiDeposit,
      jumlah: {
        bank: { semasa: jumlahBankSemasa, sebelum: jumlahBankSebelum },
        pelaburan: { semasa: jumlahPelaburanSemasa, sebelum: jumlahPelaburanSebelum },
        deposit: { semasa: jumlahDepositSemasa, sebelum: jumlahDepositSebelum },
        keseluruhan: {
          semasa: jumlahBankSemasa + jumlahPelaburanSemasa + jumlahDepositSemasa,
          sebelum: jumlahBankSebelum + jumlahPelaburanSebelum + jumlahDepositSebelum,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching nota butiran baki:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// POST - Create new entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, tahun, ...data } = body;

    if (!type || !tahun) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result: ResultSetHeader;

    switch (type) {
      case 'bank':
        [result] = await pool.query<ResultSetHeader>(
          `INSERT INTO nota_baki_bank (tahun, nama_bank, cawangan, baki_tahun_semasa, baki_tahun_sebelum, created_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [tahun, data.nama_bank, data.cawangan || null, data.baki_tahun_semasa || 0, data.baki_tahun_sebelum || 0, session.user.id]
        );
        break;

      case 'pelaburan':
        [result] = await pool.query<ResultSetHeader>(
          `INSERT INTO nota_baki_pelaburan (tahun, nama_institusi, cawangan, baki_tahun_semasa, baki_tahun_sebelum, created_by)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [tahun, data.nama_institusi, data.cawangan || null, data.baki_tahun_semasa || 0, data.baki_tahun_sebelum || 0, session.user.id]
        );
        break;

      case 'deposit':
        [result] = await pool.query<ResultSetHeader>(
          `INSERT INTO nota_baki_deposit (tahun, perkara, baki_tahun_semasa, baki_tahun_sebelum, created_by)
           VALUES (?, ?, ?, ?, ?)`,
          [tahun, data.perkara, data.baki_tahun_semasa || 0, data.baki_tahun_sebelum || 0, session.user.id]
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error creating nota butiran baki:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}

// PUT - Update entry
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, ...data } = body;

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    switch (type) {
      case 'bank':
        await pool.query(
          `UPDATE nota_baki_bank
           SET nama_bank = ?, cawangan = ?, baki_tahun_semasa = ?, baki_tahun_sebelum = ?, updated_by = ?
           WHERE id = ?`,
          [data.nama_bank, data.cawangan || null, data.baki_tahun_semasa || 0, data.baki_tahun_sebelum || 0, session.user.id, id]
        );
        break;

      case 'pelaburan':
        await pool.query(
          `UPDATE nota_baki_pelaburan
           SET nama_institusi = ?, cawangan = ?, baki_tahun_semasa = ?, baki_tahun_sebelum = ?, updated_by = ?
           WHERE id = ?`,
          [data.nama_institusi, data.cawangan || null, data.baki_tahun_semasa || 0, data.baki_tahun_sebelum || 0, session.user.id, id]
        );
        break;

      case 'deposit':
        await pool.query(
          `UPDATE nota_baki_deposit
           SET perkara = ?, baki_tahun_semasa = ?, baki_tahun_sebelum = ?, updated_by = ?
           WHERE id = ?`,
          [data.perkara, data.baki_tahun_semasa || 0, data.baki_tahun_sebelum || 0, session.user.id, id]
        );
        break;

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating nota butiran baki:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

// DELETE - Delete entry
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['admin', 'bendahari'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let tableName: string;
    switch (type) {
      case 'bank':
        tableName = 'nota_baki_bank';
        break;
      case 'pelaburan':
        tableName = 'nota_baki_pelaburan';
        break;
      case 'deposit':
        tableName = 'nota_baki_deposit';
        break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await pool.query(`DELETE FROM ${tableName} WHERE id = ?`, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting nota butiran baki:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
