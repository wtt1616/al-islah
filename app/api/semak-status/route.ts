import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

// Normalize phone number for comparison
function normalizePhone(phone: string): string {
  // Remove all non-digits
  let normalized = phone.replace(/\D/g, '');

  // Remove leading 60 (Malaysia country code)
  if (normalized.startsWith('60')) {
    normalized = normalized.substring(2);
  }

  // Remove leading 0
  if (normalized.startsWith('0')) {
    normalized = normalized.substring(1);
  }

  return normalized;
}

// POST - Search all submissions by phone number (public access)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || phone.trim().length < 9) {
      return NextResponse.json({
        error: 'Sila masukkan nombor telefon yang sah'
      }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    // Create LIKE patterns for different phone formats
    const phonePatterns = [
      `%${normalizedPhone}`,           // ends with
      `%0${normalizedPhone}`,          // with leading 0
      `%60${normalizedPhone}`,         // with country code
      `%+60${normalizedPhone}`,        // with +60
    ];

    const results: {
      maklumbalas: any[];
      permohonan_majlis: any[];
      aktiviti: any[];
      khairat: any[];
    } = {
      maklumbalas: [],
      permohonan_majlis: [],
      aktiviti: [],
      khairat: []
    };

    // 1. Search Feedback/Maklumbalas
    const [feedbackRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        id,
        nama,
        no_telefon,
        mesej,
        status,
        admin_reply,
        replied_at,
        created_at
      FROM feedback
      WHERE no_telefon LIKE ?
         OR no_telefon LIKE ?
         OR no_telefon LIKE ?
         OR no_telefon LIKE ?
      ORDER BY created_at DESC`,
      phonePatterns
    );
    results.maklumbalas = feedbackRows.map(row => ({
      id: row.id,
      nama: row.nama,
      mesej: row.mesej.substring(0, 100) + (row.mesej.length > 100 ? '...' : ''),
      status: row.status,
      admin_reply: row.admin_reply,
      replied_at: row.replied_at,
      created_at: row.created_at
    }));

    // 2. Search Permohonan Majlis
    const [majlisRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        id,
        nama_pemohon,
        tajuk_majlis,
        tarikh_majlis,
        masa_majlis,
        status,
        rejection_reason,
        approved_at,
        created_at
      FROM permohonan_majlis
      WHERE no_handphone LIKE ?
         OR no_handphone LIKE ?
         OR no_handphone LIKE ?
         OR no_handphone LIKE ?
      ORDER BY created_at DESC`,
      phonePatterns
    );
    results.permohonan_majlis = majlisRows.map(row => ({
      id: row.id,
      no_rujukan: `PM-${String(row.id).padStart(4, '0')}`,
      nama_pemohon: row.nama_pemohon,
      tajuk_majlis: row.tajuk_majlis,
      tarikh_majlis: row.tarikh_majlis,
      masa_majlis: row.masa_majlis,
      status: row.status,
      rejection_reason: row.rejection_reason,
      approved_at: row.approved_at,
      created_at: row.created_at
    }));

    // 3. Search Aktiviti Surau
    const [aktivitiRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        id,
        tajuk,
        penganjur,
        tarikh_mula,
        tarikh_tamat,
        masa_mula,
        masa_tamat,
        lokasi,
        status,
        created_at
      FROM aktiviti_surau
      WHERE no_handphone LIKE ?
         OR no_handphone LIKE ?
         OR no_handphone LIKE ?
         OR no_handphone LIKE ?
      ORDER BY created_at DESC`,
      phonePatterns
    );
    results.aktiviti = aktivitiRows.map(row => ({
      id: row.id,
      tajuk: row.tajuk,
      penganjur: row.penganjur,
      tarikh_mula: row.tarikh_mula,
      tarikh_tamat: row.tarikh_tamat,
      masa_mula: row.masa_mula,
      masa_tamat: row.masa_tamat,
      lokasi: row.lokasi,
      status: row.status,
      created_at: row.created_at
    }));

    // 4. Search Khairat Kematian
    const [khairatRows] = await pool.execute<RowDataPacket[]>(
      `SELECT
        ka.id,
        ka.nama,
        ka.no_kp,
        ka.jenis_yuran,
        ka.no_resit,
        ka.amaun_bayaran,
        ka.status,
        ka.tarikh_daftar,
        ka.tarikh_lulus,
        ka.reject_reason,
        ka.created_at,
        COUNT(kt.id) as jumlah_tanggungan
      FROM khairat_ahli ka
      LEFT JOIN khairat_tanggungan kt ON ka.id = kt.khairat_ahli_id
      WHERE ka.no_hp LIKE ?
         OR ka.no_hp LIKE ?
         OR ka.no_hp LIKE ?
         OR ka.no_hp LIKE ?
      GROUP BY ka.id
      ORDER BY ka.created_at DESC`,
      phonePatterns
    );
    results.khairat = khairatRows.map(row => ({
      id: row.id,
      no_ahli: `KK-${String(row.id).padStart(4, '0')}`,
      nama: row.nama,
      no_kp: row.no_kp ? row.no_kp.substring(0, 6) + '****' + row.no_kp.substring(10) : null,
      jenis_yuran: row.jenis_yuran,
      no_resit: row.no_resit,
      amaun_bayaran: row.amaun_bayaran,
      status: row.status,
      tarikh_daftar: row.tarikh_daftar,
      tarikh_lulus: row.tarikh_lulus,
      reject_reason: row.reject_reason,
      jumlah_tanggungan: row.jumlah_tanggungan,
      created_at: row.created_at
    }));

    const totalRecords =
      results.maklumbalas.length +
      results.permohonan_majlis.length +
      results.aktiviti.length +
      results.khairat.length;

    return NextResponse.json({
      success: true,
      total: totalRecords,
      data: results
    });

  } catch (error: any) {
    console.error('Error searching status:', error);
    return NextResponse.json({
      error: 'Ralat semasa mencari rekod'
    }, { status: 500 });
  }
}
