import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'komuniti2u-secret-key';

// POST - Login or Register
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'register') {
      return handleRegister(body);
    } else if (action === 'login') {
      return handleLogin(body);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

async function handleRegister(body: any) {
  const { nama, email, password, no_tel, alamat } = body;

  if (!nama || !email || !password || !no_tel) {
    return NextResponse.json(
      { error: 'Sila lengkapkan semua maklumat yang diperlukan' },
      { status: 400 }
    );
  }

  // Check if email already exists
  const [existing] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM k2u_sellers WHERE email = ?',
    [email]
  );

  if (existing.length > 0) {
    return NextResponse.json(
      { error: 'Email ini telah didaftarkan. Sila gunakan email lain atau login.' },
      { status: 400 }
    );
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Insert new seller
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO k2u_sellers (nama, email, password, no_tel, alamat)
     VALUES (?, ?, ?, ?, ?)`,
    [nama, email, hashedPassword, no_tel, alamat || null]
  );

  // Generate token
  const token = jwt.sign(
    { id: result.insertId, email, nama },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return NextResponse.json({
    success: true,
    message: 'Pendaftaran berjaya!',
    token,
    seller: {
      id: result.insertId,
      nama,
      email,
      no_tel,
      alamat
    }
  });
}

async function handleLogin(body: any) {
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Sila masukkan email dan kata laluan' },
      { status: 400 }
    );
  }

  // Find seller
  const [sellers] = await pool.query<RowDataPacket[]>(
    'SELECT * FROM k2u_sellers WHERE email = ?',
    [email]
  );

  if (sellers.length === 0) {
    return NextResponse.json(
      { error: 'Email atau kata laluan tidak sah' },
      { status: 401 }
    );
  }

  const seller = sellers[0];

  // Check if active
  if (!seller.is_active) {
    return NextResponse.json(
      { error: 'Akaun anda telah dinyahaktifkan. Sila hubungi admin.' },
      { status: 403 }
    );
  }

  // Verify password
  const isValid = await bcrypt.compare(password, seller.password);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Email atau kata laluan tidak sah' },
      { status: 401 }
    );
  }

  // Generate token
  const token = jwt.sign(
    { id: seller.id, email: seller.email, nama: seller.nama },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return NextResponse.json({
    success: true,
    token,
    seller: {
      id: seller.id,
      nama: seller.nama,
      email: seller.email,
      no_tel: seller.no_tel,
      alamat: seller.alamat
    }
  });
}

// GET - Verify token and get seller info
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string; nama: string };

      // Get fresh seller data
      const [sellers] = await pool.query<RowDataPacket[]>(
        'SELECT id, nama, email, no_tel, alamat, is_active FROM k2u_sellers WHERE id = ?',
        [decoded.id]
      );

      if (sellers.length === 0 || !sellers[0].is_active) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return NextResponse.json({ seller: sellers[0] });
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
