import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

export const dynamic = 'force-dynamic';

// POST - Submit new khairat membership application (Public)
export async function POST(request: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const body = await request.json();
    const {
      nama,
      no_kp,
      umur,
      alamat,
      no_hp,
      resit_file,
      amaun_bayaran,
      tanggungan
    } = body;

    // Validation - only required fields for new form
    if (!nama || !no_kp || !alamat || !no_hp) {
      return NextResponse.json(
        { error: 'Sila lengkapkan semua maklumat wajib' },
        { status: 400 }
      );
    }

    // Age validation (18-75 years)
    if (umur) {
      const age = parseInt(umur);
      if (age < 18 || age > 75) {
        return NextResponse.json(
          { error: 'Umur mestilah antara 18 hingga 75 tahun' },
          { status: 400 }
        );
      }
    }

    // Phone number validation (Malaysian format)
    const phoneRegex = /^(\+?60|0)?1[0-9]{8,9}$/;
    const cleanPhone = no_hp.replace(/[\s\-]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Format nombor telefon bimbit tidak sah' },
        { status: 400 }
      );
    }

    // Clean IC number - remove dashes and spaces
    const cleanNoKp = no_kp.replace(/[-\s]/g, '').trim();

    // Start transaction
    await connection.beginTransaction();

    // Insert main applicant (plain text for no_kp as per existing data format)
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO khairat_ahli
        (nama, no_kp, umur, alamat, no_hp,
         jenis_yuran, resit_file, amaun_bayaran, status, tarikh_daftar)
       VALUES (?, ?, ?, ?, ?, 'keahlian', ?, ?, 'pending', CURDATE())`,
      [
        nama.trim(),
        cleanNoKp,
        umur || null,
        alamat.trim(),
        cleanPhone,
        resit_file || null,
        amaun_bayaran || 40.00
      ]
    );

    const ahliId = result.insertId;

    // Insert tanggungan if any (max 7)
    if (tanggungan && Array.isArray(tanggungan) && tanggungan.length > 0) {
      // Limit to 7 tanggungan
      const limitedTanggungan = tanggungan.slice(0, 7);

      for (const t of limitedTanggungan) {
        if (t.nama_penuh && t.pertalian) {
          // Validate pertalian - updated to match new form options
          if (!['pasangan', 'anak'].includes(t.pertalian)) {
            await connection.rollback();
            return NextResponse.json(
              { error: 'Pertalian tanggungan tidak sah' },
              { status: 400 }
            );
          }

          // Clean tanggungan IC number if provided (plain text)
          const tanggunganNoKp = t.no_kp?.trim() ? t.no_kp.replace(/[-\s]/g, '').trim() : null;

          await connection.query(
            `INSERT INTO khairat_tanggungan (khairat_ahli_id, nama_penuh, no_kp, umur, pertalian)
             VALUES (?, ?, ?, ?, ?)`,
            [ahliId, t.nama_penuh.trim(), tanggunganNoKp, t.umur || null, t.pertalian]
          );
        }
      }
    }

    // Commit transaction
    await connection.commit();

    return NextResponse.json({
      success: true,
      message: 'Permohonan keahlian Khairat Kematian Surau al-Islah anda telah berjaya dihantar.',
      id: ahliId
    }, { status: 201 });
  } catch (error) {
    await connection.rollback();
    console.error('Error submitting khairat application:', error);
    return NextResponse.json({ error: 'Gagal menghantar permohonan' }, { status: 500 });
  } finally {
    connection.release();
  }
}
