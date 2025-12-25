import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import * as XLSX from 'xlsx';

// Column indices based on new format
interface ColumnIndices {
  bil: number;
  nama: number;
  kp: number;
  tarikhLahir: number;
  umur: number;
  status: number;
  jantina: number;
  hp: number;
  resit: number;
  alamat: number;
  taman: number;
  permohonan: number;
  caraBayaran: number;
  bayaran: number;
  catatan: number;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam', 'khairat'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get Sheet1 (or first sheet)
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: 'No sheet found in file' }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    if (data.length < 2) {
      return NextResponse.json({ error: 'File is empty or has no data rows' }, { status: 400 });
    }

    // Find header row (row 0 based on the format)
    const headerRow = data[0];

    // Map column indices
    const findColIndex = (keywords: string[]): number => {
      return headerRow.findIndex((cell: any) => {
        if (!cell) return false;
        const cellStr = String(cell).toLowerCase();
        return keywords.some(k => cellStr.toLowerCase().includes(k.toLowerCase()));
      });
    };

    const colIndices: ColumnIndices = {
      bil: findColIndex(['bil']),
      nama: findColIndex(['nama']),
      kp: findColIndex(['kp', 'k/p', 'kad pengenalan']),
      tarikhLahir: findColIndex(['tarikh lahir']),
      umur: findColIndex(['umur']),
      status: findColIndex(['status']),
      jantina: findColIndex(['jantina']),
      hp: findColIndex(['hp', 'telefon']),
      resit: findColIndex(['resit']),
      alamat: findColIndex(['alamat']),
      taman: findColIndex(['taman']),
      permohonan: findColIndex(['permohonan']),
      caraBayaran: findColIndex(['cara bayaran']),
      bayaran: findColIndex(['bayaran']),
      catatan: findColIndex(['catatan']),
    };

    // Validate required columns
    if (colIndices.nama === -1 || colIndices.kp === -1 || colIndices.status === -1) {
      return NextResponse.json({
        error: 'Lajur wajib tidak dijumpai. Pastikan fail mengandungi: NAMA, KP, Status'
      }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let ahliInsertedCount = 0;
      let ahliUpdatedCount = 0;
      let tanggunganInsertedCount = 0;
      let errorCount = 0;
      let currentAhliId: number | null = null;

      // Helper function to parse Excel date
      const parseExcelDate = (dateVal: any): string | null => {
        if (!dateVal) return null;

        if (typeof dateVal === 'number') {
          // Excel date serial number
          const date = XLSX.SSF.parse_date_code(dateVal);
          if (date) {
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          }
        } else if (typeof dateVal === 'string') {
          // Try parsing string date (DD/MM/YYYY format)
          const parts = dateVal.split('/');
          if (parts.length === 3) {
            return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
        return null;
      };

      // Helper function to clean IC number
      const cleanNoKp = (kp: any): string => {
        if (!kp) return '';
        return String(kp).replace(/[-\s]/g, '').trim();
      };

      // Process data rows (skip header row 0)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const nama = row[colIndices.nama];
        const noKp = cleanNoKp(row[colIndices.kp]);
        const statusType = String(row[colIndices.status] || '').trim();

        if (!nama || !noKp) continue;

        const bil = row[colIndices.bil];
        const tarikhLahir = parseExcelDate(row[colIndices.tarikhLahir]);
        const umur = row[colIndices.umur] && !isNaN(Number(row[colIndices.umur])) ? Number(row[colIndices.umur]) : null;
        const jantina = row[colIndices.jantina] || null;
        const hp = row[colIndices.hp] ? String(row[colIndices.hp]).trim() : null;
        const resit = row[colIndices.resit] || null;
        const alamat = row[colIndices.alamat] || null;
        const taman = row[colIndices.taman] || null;
        const caraBayaran = row[colIndices.caraBayaran] || null;
        const bayaran = row[colIndices.bayaran] && !isNaN(Number(row[colIndices.bayaran])) ? Number(row[colIndices.bayaran]) : null;
        const catatan = row[colIndices.catatan] || null;

        try {
          if (statusType.toLowerCase() === 'ahli') {
            // This is a main member - insert/update into khairat_ahli
            const [existing] = await connection.query<RowDataPacket[]>(
              'SELECT id FROM khairat_ahli WHERE no_kp = ?',
              [noKp]
            );

            if (existing.length > 0) {
              // Update existing member
              currentAhliId = existing[0].id;
              await connection.query(
                `UPDATE khairat_ahli SET
                  bil_excel = ?, nama = ?, tarikh_lahir = ?, umur = ?, jantina = ?,
                  no_hp = ?, no_resit = ?, alamat = ?, taman = ?, cara_bayaran = ?,
                  amaun_bayaran = ?, catatan = ?, status = 'approved'
                WHERE id = ?`,
                [
                  bil, nama, tarikhLahir, umur, jantina,
                  hp || '000', resit, alamat, taman, caraBayaran,
                  bayaran, catatan, currentAhliId
                ]
              );
              ahliUpdatedCount++;
            } else {
              // Insert new member
              const [result] = await connection.query<ResultSetHeader>(
                `INSERT INTO khairat_ahli (
                  bil_excel, nama, no_kp, tarikh_lahir, umur, jantina,
                  no_hp, no_resit, alamat, taman, cara_bayaran,
                  amaun_bayaran, catatan, jenis_yuran, status, tarikh_daftar
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'keahlian', 'approved', CURDATE())`,
                [
                  bil, nama, noKp, tarikhLahir, umur, jantina,
                  hp || '000', resit, alamat, taman, caraBayaran,
                  bayaran, catatan
                ]
              );
              currentAhliId = result.insertId;
              ahliInsertedCount++;
            }
          } else if (currentAhliId && ['pasangan', 'isteri', 'suami', 'anak'].some(s => statusType.toLowerCase().includes(s))) {
            // This is a dependent - insert into khairat_tanggungan
            // Map status to pertalian
            let pertalian = 'anak';
            if (statusType.toLowerCase().includes('pasangan') ||
                statusType.toLowerCase().includes('isteri') ||
                statusType.toLowerCase().includes('suami')) {
              pertalian = 'pasangan';
            }

            // Check if tanggungan already exists
            const [existingTanggungan] = await connection.query<RowDataPacket[]>(
              'SELECT id FROM khairat_tanggungan WHERE khairat_ahli_id = ? AND no_kp = ?',
              [currentAhliId, noKp]
            );

            if (existingTanggungan.length > 0) {
              // Update existing tanggungan
              await connection.query(
                `UPDATE khairat_tanggungan SET
                  nama_penuh = ?, tarikh_lahir = ?, umur = ?, jantina = ?, pertalian = ?
                WHERE id = ?`,
                [nama, tarikhLahir, umur, jantina, pertalian, existingTanggungan[0].id]
              );
            } else {
              // Insert new tanggungan
              await connection.query(
                `INSERT INTO khairat_tanggungan (
                  khairat_ahli_id, nama_penuh, no_kp, tarikh_lahir, umur, jantina, pertalian
                ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [currentAhliId, nama, noKp, tarikhLahir, umur, jantina, pertalian]
              );
              tanggunganInsertedCount++;
            }
          }
        } catch (rowError) {
          console.error(`Error processing row ${i}:`, rowError);
          errorCount++;
        }
      }

      // Record upload
      await connection.query(
        'INSERT INTO khairat_uploads (filename, uploaded_by, total_records) VALUES (?, ?, ?)',
        [file.name, session.user.id, ahliInsertedCount + ahliUpdatedCount + tanggunganInsertedCount]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Fail berjaya dimuat naik',
        stats: {
          inserted: ahliInsertedCount,
          updated: ahliUpdatedCount,
          tanggungan: tanggunganInsertedCount,
          errors: errorCount,
          total: ahliInsertedCount + ahliUpdatedCount + tanggunganInsertedCount
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error uploading khairat file:', error);
    return NextResponse.json(
      { error: 'Gagal memuat naik fail: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam', 'khairat'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [uploads] = await pool.query<RowDataPacket[]>(
      `SELECT ku.*, u.name as uploaded_by_name
       FROM khairat_uploads ku
       LEFT JOIN users u ON ku.uploaded_by = u.id
       ORDER BY ku.created_at DESC
       LIMIT 20`
    );

    // Get stats from khairat_ahli table (new format)
    const [stats] = await pool.query<RowDataPacket[]>(
      `SELECT
        (SELECT COUNT(*) FROM khairat_ahli) as total_ahli,
        (SELECT COUNT(*) FROM khairat_ahli WHERE status = 'approved') as approved_ahli,
        (SELECT COUNT(*) FROM khairat_ahli WHERE status = 'pending') as pending_ahli,
        (SELECT COUNT(*) FROM khairat_tanggungan) as total_tanggungan`
    );

    return NextResponse.json({
      uploads,
      stats: {
        total_members: stats[0].total_ahli || 0,
        active_members: stats[0].approved_ahli || 0,
        pending_members: stats[0].pending_ahli || 0,
        total_tanggungan: stats[0].total_tanggungan || 0
      }
    });

  } catch (error) {
    console.error('Error fetching upload history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'head_imam', 'khairat'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Delete all tanggungan first (foreign key constraint)
      const [tanggunganResult] = await connection.query<ResultSetHeader>(
        'DELETE FROM khairat_tanggungan'
      );

      // Delete all ahli
      const [ahliResult] = await connection.query<ResultSetHeader>(
        'DELETE FROM khairat_ahli'
      );

      // Delete all upload history
      const [uploadsResult] = await connection.query<ResultSetHeader>(
        'DELETE FROM khairat_uploads'
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Semua data khairat telah dipadam',
        deleted: {
          tanggungan: tanggunganResult.affectedRows,
          ahli: ahliResult.affectedRows,
          uploads: uploadsResult.affectedRows
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error deleting khairat data:', error);
    return NextResponse.json(
      { error: 'Gagal memadam data' },
      { status: 500 }
    );
  }
}
