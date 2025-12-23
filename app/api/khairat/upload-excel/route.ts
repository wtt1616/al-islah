import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import * as XLSX from 'xlsx';

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

    // Find the Ahli sheet
    const sheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('ahli')) || workbook.SheetNames[1];
    if (!sheetName) {
      return NextResponse.json({ error: 'Sheet "Ahli" not found' }, { status: 400 });
    }

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // Find header row (row with "no Kad Pengenalan")
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some((cell: any) => cell && String(cell).toLowerCase().includes('kad pengenalan'))) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return NextResponse.json({ error: 'Header row not found' }, { status: 400 });
    }

    const headerRow = data[headerRowIndex];

    // Find column indices
    const findColIndex = (keywords: string[]) => {
      return headerRow.findIndex((cell: any) => {
        if (!cell) return false;
        const cellStr = String(cell).toLowerCase();
        return keywords.some(k => cellStr.includes(k.toLowerCase()));
      });
    };

    const colIndices = {
      noKp: findColIndex(['kad pengenalan', 'k/p', 'ic']),
      noAhli: findColIndex(['no ahli']),
      nama: findColIndex(['nama ahli']),
      alamat: findColIndex(['alamat']),
      noHp: findColIndex(['hp', 'telefon', 'phone']),
      email: findColIndex(['email']),
      tarikhDaftar: findColIndex(['t.daftar', 'tarikh daftar']),
      pasangan: findColIndex(['isteri', 'suami']),
      anak1: headerRow.findIndex((cell: any) => cell && String(cell).toLowerCase() === 'anak1'),
      bapa: findColIndex(['bapa']),
      ibu: findColIndex(['ibu']),
      bapaMertua: findColIndex(['bapa mertua']),
      makMertua: findColIndex(['mak mertua']),
    };

    // Find year columns (look for "Resit" and year pattern)
    const yearColumns: { year: number; resitCol: number; amountCol: number }[] = [];
    for (let i = 0; i < headerRow.length; i++) {
      const cell = headerRow[i];
      if (cell) {
        const cellStr = String(cell);
        const yearMatch = cellStr.match(/^(20\d{2})$/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          // Previous column should be Resit
          yearColumns.push({
            year,
            resitCol: i - 1,
            amountCol: i
          });
        }
      }
    }

    // Find status columns
    const statusColIndex = {
      meninggal: headerRow.findIndex((cell: any) => cell && String(cell).includes('M/DUNIA')),
      pindah: headerRow.findIndex((cell: any) => cell && String(cell).includes('PINDAH')),
      gantung: headerRow.findIndex((cell: any) => cell && String(cell).includes('GANTUNG')),
    };

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let insertedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      // Process data rows (skip header)
      for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;

        const noKp = row[colIndices.noKp];
        const nama = row[colIndices.nama];

        if (!noKp || !nama) continue;

        // Clean IC number
        const cleanNoKp = String(noKp).replace(/[-\s]/g, '').trim();
        if (!cleanNoKp) continue;

        // Determine status
        let status = 'aktif';
        if (statusColIndex.meninggal >= 0 && row[statusColIndex.meninggal]) {
          status = 'meninggal';
        } else if (statusColIndex.pindah >= 0 && row[statusColIndex.pindah]) {
          status = 'pindah';
        } else if (statusColIndex.gantung >= 0 && row[statusColIndex.gantung]) {
          status = 'gantung';
        }

        // Check for PINDAH or M/DUNIA in payment columns
        for (const yc of yearColumns) {
          const resitVal = row[yc.resitCol];
          const amountVal = row[yc.amountCol];
          if (resitVal && String(resitVal).includes('PINDAH')) {
            status = 'pindah';
            break;
          }
          if (resitVal && String(resitVal).includes('M/ DUNIA')) {
            status = 'meninggal';
            break;
          }
          if (amountVal && String(amountVal).includes('PINDAH')) {
            status = 'pindah';
            break;
          }
        }

        // Parse date
        let tarikhDaftar = null;
        if (row[colIndices.tarikhDaftar]) {
          const dateVal = row[colIndices.tarikhDaftar];
          if (typeof dateVal === 'number') {
            // Excel date serial
            const date = XLSX.SSF.parse_date_code(dateVal);
            tarikhDaftar = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else if (typeof dateVal === 'string') {
            // Try parsing string date
            const parts = dateVal.split('/');
            if (parts.length === 3) {
              tarikhDaftar = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
        }

        try {
          // Check if member exists
          const [existing] = await connection.query<RowDataPacket[]>(
            'SELECT id FROM khairat_members WHERE no_kp = ?',
            [cleanNoKp]
          );

          let memberId: number;

          if (existing.length > 0) {
            // Update existing
            memberId = existing[0].id;
            await connection.query(
              `UPDATE khairat_members SET
                no_ahli = ?, nama_ahli = ?, alamat = ?, no_hp = ?, email = ?,
                tarikh_daftar = ?, pasangan = ?, anak1 = ?, anak2 = ?, anak3 = ?,
                anak4 = ?, anak5 = ?, anak6 = ?, anak7 = ?, anak8 = ?,
                bapa = ?, ibu = ?, bapa_mertua = ?, mak_mertua = ?, status_ahli = ?
              WHERE id = ?`,
              [
                row[colIndices.noAhli] || null,
                nama,
                row[colIndices.alamat] || null,
                row[colIndices.noHp] || null,
                row[colIndices.email] || null,
                tarikhDaftar,
                row[colIndices.pasangan] || null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 1] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 2] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 3] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 4] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 5] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 6] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 7] : null,
                row[colIndices.bapa] || null,
                row[colIndices.ibu] || null,
                row[colIndices.bapaMertua] || null,
                row[colIndices.makMertua] || null,
                status,
                memberId
              ]
            );
            updatedCount++;
          } else {
            // Insert new
            const [result] = await connection.query<ResultSetHeader>(
              `INSERT INTO khairat_members (
                no_kp, no_ahli, nama_ahli, alamat, no_hp, email,
                tarikh_daftar, pasangan, anak1, anak2, anak3,
                anak4, anak5, anak6, anak7, anak8,
                bapa, ibu, bapa_mertua, mak_mertua, status_ahli
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                cleanNoKp,
                row[colIndices.noAhli] || null,
                nama,
                row[colIndices.alamat] || null,
                row[colIndices.noHp] || null,
                row[colIndices.email] || null,
                tarikhDaftar,
                row[colIndices.pasangan] || null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 1] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 2] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 3] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 4] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 5] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 6] : null,
                colIndices.anak1 >= 0 ? row[colIndices.anak1 + 7] : null,
                row[colIndices.bapa] || null,
                row[colIndices.ibu] || null,
                row[colIndices.bapaMertua] || null,
                row[colIndices.makMertua] || null,
                status
              ]
            );
            memberId = result.insertId;
            insertedCount++;
          }

          // Process payments
          for (const yc of yearColumns) {
            const resitVal = row[yc.resitCol];
            const amountVal = row[yc.amountCol];

            // Skip if no valid payment data
            if (!amountVal || typeof amountVal !== 'number') continue;
            if (String(resitVal).includes('PINDAH') || String(resitVal).includes('M/ DUNIA')) continue;

            let paymentStatus = 'paid';
            if (String(resitVal).toLowerCase().includes('tunggak')) {
              paymentStatus = 'tunggak';
            } else if (String(resitVal).toLowerCase().includes('p/bayar')) {
              paymentStatus = 'prabayar';
            }

            // Upsert payment
            await connection.query(
              `INSERT INTO khairat_payments (member_id, tahun, jumlah, no_resit, status)
               VALUES (?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE jumlah = VALUES(jumlah), no_resit = VALUES(no_resit), status = VALUES(status)`,
              [
                memberId,
                yc.year,
                amountVal,
                resitVal && typeof resitVal !== 'number' ? null : resitVal,
                paymentStatus
              ]
            );
          }
        } catch (rowError) {
          console.error(`Error processing row ${i}:`, rowError);
          errorCount++;
        }
      }

      // Record upload
      await connection.query(
        'INSERT INTO khairat_uploads (filename, uploaded_by, total_records) VALUES (?, ?, ?)',
        [file.name, session.user.id, insertedCount + updatedCount]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        stats: {
          inserted: insertedCount,
          updated: updatedCount,
          errors: errorCount,
          total: insertedCount + updatedCount
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
      { error: 'Failed to upload file' },
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

    const [stats] = await pool.query<RowDataPacket[]>(
      `SELECT
        COUNT(*) as total_members,
        SUM(CASE WHEN status_ahli = 'aktif' THEN 1 ELSE 0 END) as active_members,
        SUM(CASE WHEN status_ahli = 'meninggal' THEN 1 ELSE 0 END) as deceased_members,
        SUM(CASE WHEN status_ahli = 'pindah' THEN 1 ELSE 0 END) as moved_members
       FROM khairat_members`
    );

    return NextResponse.json({
      uploads,
      stats: stats[0]
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

      // Delete all payments first (foreign key constraint)
      const [paymentsResult] = await connection.query<ResultSetHeader>(
        'DELETE FROM khairat_payments'
      );

      // Delete all members
      const [membersResult] = await connection.query<ResultSetHeader>(
        'DELETE FROM khairat_members'
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
          payments: paymentsResult.affectedRows,
          members: membersResult.affectedRows,
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
