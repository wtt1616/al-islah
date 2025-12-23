import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { ResultSetHeader } from 'mysql2';
import { encrypt } from '@/lib/encryption';

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
      no_telefon_rumah,
      no_hp,
      email,
      jenis_yuran,
      no_resit,
      resit_file,
      amaun_bayaran,
      tanggungan
    } = body;

    // Validation
    if (!nama || !no_kp || !alamat || !no_hp || !jenis_yuran || !no_resit) {
      return NextResponse.json(
        { error: 'Sila lengkapkan semua maklumat wajib' },
        { status: 400 }
      );
    }

    // Validate jenis_yuran
    if (!['keahlian', 'tahunan', 'isteri_kedua'].includes(jenis_yuran)) {
      return NextResponse.json(
        { error: 'Jenis yuran tidak sah' },
        { status: 400 }
      );
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

    // Email validation if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Format emel tidak sah' },
          { status: 400 }
        );
      }
    }

    // Start transaction
    await connection.beginTransaction();

    // Encrypt sensitive data (IC number)
    const encryptedNoKp = encrypt(no_kp.trim());

    // Insert main applicant
    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO khairat_ahli
        (nama, no_kp, umur, alamat, no_telefon_rumah, no_hp, email,
         jenis_yuran, no_resit, resit_file, amaun_bayaran, status, tarikh_daftar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURDATE())`,
      [
        nama.trim(),
        encryptedNoKp,
        umur || null,
        alamat.trim(),
        no_telefon_rumah?.trim() || null,
        cleanPhone,
        email?.trim().toLowerCase() || null,
        jenis_yuran,
        no_resit.trim(),
        resit_file || null,
        amaun_bayaran || 50.00
      ]
    );

    const ahliId = result.insertId;

    // Insert tanggungan if any
    if (tanggungan && Array.isArray(tanggungan) && tanggungan.length > 0) {
      for (const t of tanggungan) {
        if (t.nama_penuh && t.pertalian) {
          // Validate pertalian
          if (!['isteri', 'anak', 'anak_oku'].includes(t.pertalian)) {
            await connection.rollback();
            return NextResponse.json(
              { error: 'Pertalian tanggungan tidak sah' },
              { status: 400 }
            );
          }

          // Encrypt tanggungan IC number if provided
          const tanggunganNoKp = t.no_kp?.trim() ? encrypt(t.no_kp.trim()) : null;

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
      message: 'Permohonan keahlian khairat kematian anda telah berjaya dihantar.',
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
