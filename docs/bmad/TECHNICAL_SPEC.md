# Technical Specification Document
## Sistem iSAR - Islamic Surau Administration & Roster

**Version:** 1.0
**Last Updated:** December 2025
**Document Type:** Technical Specification

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [API Specification](#4-api-specification)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [External Integrations](#6-external-integrations)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Data Flow Patterns](#8-data-flow-patterns)
9. [Error Handling](#9-error-handling)
10. [Development & Deployment](#10-development--deployment)

---

## 1. System Overview

### 1.1 Architecture Type
- **Pattern:** Monolithic Full-Stack Application
- **Framework:** Next.js 14 (App Router)
- **Rendering:** Server-Side Rendering (SSR) + Client Components
- **API Style:** RESTful API Routes

### 1.2 System Components
```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser                        │
│              (React + Bootstrap 5)                       │
└─────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Next.js Application                     │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │   App Router    │  │     API Routes              │   │
│  │   (Pages)       │  │     (/api/*)                │   │
│  └─────────────────┘  └─────────────────────────────┘   │
│                                                          │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │   NextAuth.js   │  │   Business Logic Layer      │   │
│  │   (Auth)        │  │   (lib/*)                   │   │
│  └─────────────────┘  └─────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   MySQL     │   │   Twilio    │   │   SMTP      │
│   Database  │   │   WhatsApp  │   │   Email     │
└─────────────┘   └─────────────┘   └─────────────┘
```

---

## 2. Technology Stack

### 2.1 Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React Framework |
| React | 18.x | UI Library |
| TypeScript | 5.x | Type Safety |
| Bootstrap | 5.x | CSS Framework |
| Bootstrap Icons | Latest | Icon Library |

### 2.2 Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 14.x | API Endpoints |
| NextAuth.js | 4.x | Authentication |
| bcryptjs | 2.x | Password Hashing |
| mysql2 | 3.x | Database Driver |

### 2.3 Database
| Technology | Version | Purpose |
|------------|---------|---------|
| MySQL | 8.0+ | Primary Database |
| Connection Pooling | 10 max | Performance |

### 2.4 External Services
| Service | Provider | Purpose |
|---------|----------|---------|
| WhatsApp API | Twilio | Notifications |
| Email | SMTP/Gmail | Email Notifications |
| File Storage | Local Filesystem | Uploads |

### 2.5 Development Tools
| Tool | Purpose |
|------|---------|
| npm | Package Manager |
| PM2 | Process Manager (Production) |
| Git | Version Control |

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram (Conceptual)

```
                    ┌─────────────┐
                    │   users     │
                    │─────────────│
                    │ id (PK)     │
                    │ name        │
                    │ email       │
                    │ password    │
                    │ role        │
                    │ phone       │
                    │ is_active   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   schedules   │  │  availability │  │bank_statements│
│───────────────│  │───────────────│  │───────────────│
│ id (PK)       │  │ id (PK)       │  │ id (PK)       │
│ date          │  │ user_id (FK)  │  │ uploaded_by   │
│ prayer_time   │  │ date          │  │ month         │
│ imam_id (FK)  │  │ prayer_time   │  │ year          │
│ bilal_id (FK) │  │ is_available  │  │ opening_bal   │
│ week_number   │  │ reason        │  └───────┬───────┘
│ year          │  └───────────────┘          │
└───────────────┘                              │
                                               ▼
                                    ┌───────────────────┐
                                    │financial_trans    │
                                    │───────────────────│
                                    │ id (PK)           │
                                    │ statement_id (FK) │
                                    │ transaction_date  │
                                    │ debit_amount      │
                                    │ credit_amount     │
                                    │ category_*        │
                                    │ categorized_by    │
                                    └───────────────────┘
```

### 3.2 Core Tables

#### 3.2.1 users
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'head_imam', 'imam', 'bilal',
            'inventory_staff', 'bendahari') NOT NULL,
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
);
```

#### 3.2.2 schedules
```sql
CREATE TABLE schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  prayer_time ENUM('Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak') NOT NULL,
  imam_id INT,
  bilal_id INT,
  week_number INT NOT NULL,
  year INT NOT NULL,
  is_auto_generated BOOLEAN DEFAULT FALSE,
  created_by INT,
  modified_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (imam_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (bilal_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (modified_by) REFERENCES users(id),
  INDEX idx_date (date),
  INDEX idx_week_year (week_number, year),
  UNIQUE KEY unique_schedule (date, prayer_time)
);
```

#### 3.2.3 availability
```sql
CREATE TABLE availability (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date DATE NOT NULL,
  prayer_time ENUM('Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'),
  is_available BOOLEAN DEFAULT TRUE,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_date (user_id, date)
);
```

#### 3.2.4 bank_statements
```sql
CREATE TABLE bank_statements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  month TINYINT NOT NULL,
  year SMALLINT NOT NULL,
  uploaded_by INT NOT NULL,
  total_transactions INT DEFAULT 0,
  categorized_count INT DEFAULT 0,
  opening_balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_month_year (month, year)
);
```

#### 3.2.5 financial_transactions
```sql
CREATE TABLE financial_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  statement_id INT NOT NULL,
  transaction_date DATETIME NOT NULL,
  customer_eft_no VARCHAR(255),
  transaction_code VARCHAR(50),
  transaction_description TEXT,
  ref_cheque_no VARCHAR(50),
  servicing_branch VARCHAR(100),
  debit_amount DECIMAL(15,2) DEFAULT 0.00,
  credit_amount DECIMAL(15,2) DEFAULT 0.00,
  balance DECIMAL(15,2) DEFAULT 0.00,
  sender_recipient_name VARCHAR(255),
  payment_details TEXT,
  transaction_type ENUM('penerimaan', 'pembayaran', 'uncategorized')
                   DEFAULT 'uncategorized',
  category_penerimaan ENUM(
    'Sumbangan Am', 'Sumbangan Khas', 'Hasil Sewaan',
    'Deposit', 'Elaun/Bantuan', 'Hibah Pelaburan',
    'Lain-lain Penerimaan', 'Tidak Dikategorikan'
  ),
  category_pembayaran ENUM(
    'Pentadbiran', 'Sumber Manusia', 'Pembangunan',
    'Dakwah', 'Khidmat Sosial', 'Aset',
    'Lain-lain Pembayaran', 'Tidak Dikategorikan'
  ),
  sub_category_penerimaan VARCHAR(255),
  sub_category1_pembayaran VARCHAR(255),
  sub_category2_pembayaran VARCHAR(255),
  investment_type VARCHAR(100),
  investment_institution VARCHAR(255),
  notes TEXT,
  bulan_perkiraan ENUM('bulan_semasa', 'bulan_depan', 'bulan_sebelum')
                  DEFAULT 'bulan_semasa',
  categorized_by INT,
  categorized_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (statement_id) REFERENCES bank_statements(id) ON DELETE CASCADE,
  FOREIGN KEY (categorized_by) REFERENCES users(id),
  INDEX idx_statement (statement_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_transaction_type (transaction_type)
);
```

#### 3.2.6 rujukan_kategori (Auto-Categorization Keywords)
```sql
CREATE TABLE rujukan_kategori (
  id INT AUTO_INCREMENT PRIMARY KEY,
  jenis_transaksi ENUM('penerimaan', 'pembayaran') NOT NULL,
  kategori_nama VARCHAR(255) NOT NULL,
  keyword VARCHAR(255) NOT NULL,
  aktif BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_jenis_transaksi (jenis_transaksi),
  INDEX idx_keyword (keyword),
  INDEX idx_aktif (aktif),
  INDEX idx_kategori_nama (kategori_nama)
);
```

### 3.3 Khairat Module Tables

#### 3.3.1 khairat_ahli
```sql
CREATE TABLE khairat_ahli (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  no_kp VARCHAR(20) NOT NULL,
  umur INT,
  alamat TEXT,
  no_telefon_rumah VARCHAR(20),
  no_hp VARCHAR(20),
  email VARCHAR(255),
  jenis_yuran ENUM('keahlian', 'tahunan', 'isteri_kedua'),
  no_resit VARCHAR(50),
  resit_file VARCHAR(255),
  amaun_bayaran DECIMAL(10,2),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  tarikh_daftar DATE,
  tarikh_lulus DATETIME,
  approved_by INT,
  reject_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (approved_by) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_no_kp (no_kp)
);
```

#### 3.3.2 khairat_tanggungan
```sql
CREATE TABLE khairat_tanggungan (
  id INT AUTO_INCREMENT PRIMARY KEY,
  khairat_ahli_id INT NOT NULL,
  nama_penuh VARCHAR(255) NOT NULL,
  no_kp VARCHAR(20),
  umur INT,
  pertalian ENUM('isteri', 'anak', 'anak_oku'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (khairat_ahli_id) REFERENCES khairat_ahli(id) ON DELETE CASCADE
);
```

### 3.4 Asset Management Tables

#### 3.4.1 lokasi_aset
```sql
CREATE TABLE lokasi_aset (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kod_lokasi VARCHAR(20) NOT NULL UNIQUE,
  nama_lokasi VARCHAR(255) NOT NULL,
  keterangan TEXT,
  pegawai_bertanggungjawab VARCHAR(255),
  no_tel_pegawai VARCHAR(20),
  aktif BOOLEAN DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3.4.2 inventory
```sql
CREATE TABLE inventory (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  sub_kategori VARCHAR(100),
  quantity INT DEFAULT 1,
  unit VARCHAR(50),
  jenama VARCHAR(100),
  model VARCHAR(100),
  no_siri_pembuat VARCHAR(100),
  tarikh_terima DATE,
  harga_asal DECIMAL(15,2),
  lokasi_id INT,
  status VARCHAR(50) DEFAULT 'Sedang Digunakan',
  catatan TEXT,
  gambar VARCHAR(255),
  tarikh_lupus DATE,
  kaedah_lupus VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lokasi_id) REFERENCES lokasi_aset(id)
);
```

#### 3.4.3 harta_modal
```sql
CREATE TABLE harta_modal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kategori VARCHAR(100),
  sub_kategori VARCHAR(100),
  kuantiti INT DEFAULT 1,
  unit VARCHAR(50),
  jenama VARCHAR(100),
  model VARCHAR(100),
  no_siri_pembuat VARCHAR(100),
  tarikh_terima DATE,
  harga_asal DECIMAL(15,2),
  jangka_hayat_tahun INT,
  nilai_semasa DECIMAL(15,2),
  lokasi_id INT,
  status VARCHAR(50) DEFAULT 'Sedang Digunakan',
  catatan TEXT,
  gambar VARCHAR(255),
  tarikh_lupus DATE,
  kaedah_lupus VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (lokasi_id) REFERENCES lokasi_aset(id)
);
```

### 3.5 Other Tables
- **permohonan_majlis**: Facility booking requests
- **aktiviti_surau**: Surau activities/events
- **feedback**: User feedback/complaints
- **preachers**: Ceramah/kuliah preachers
- **pemeriksaan_aset**: Asset inspection records
- **penyelenggaraan_aset**: Asset maintenance records
- **pergerakan_aset**: Asset movement/loan records
- **pelupusan_aset**: Asset disposal records
- **kehilangan_aset**: Asset loss/writeoff records

---

## 4. API Specification

### 4.1 API Overview

| Base URL | `/api` |
|----------|--------|
| Format | JSON |
| Authentication | JWT (NextAuth) |
| Rate Limiting | None (planned) |

### 4.2 Authentication Endpoints

#### POST /api/auth/[...nextauth]
NextAuth.js handler for all authentication operations.

**Supported Operations:**
- `GET /api/auth/session` - Get current session
- `POST /api/auth/signin/credentials` - Sign in with email/password
- `POST /api/auth/signout` - Sign out

### 4.3 User Management

#### GET /api/users
Fetch list of users.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| role | string | Filter by role |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Ahmad bin Ali",
      "email": "ahmad@example.com",
      "role": "imam",
      "phone": "0123456789",
      "is_active": true
    }
  ]
}
```

**Authorization:** All authenticated users

#### POST /api/users
Create new user.

**Request Body:**
```json
{
  "name": "Ahmad bin Ali",
  "email": "ahmad@example.com",
  "password": "password123",
  "role": "imam",
  "phone": "0123456789"
}
```

**Authorization:** admin only

### 4.4 Profile Management

#### GET /api/profile
Get current user's profile.

**Response:**
```json
{
  "id": 1,
  "name": "Ahmad bin Ali",
  "email": "ahmad@example.com",
  "role": "imam",
  "phone": "0123456789",
  "is_active": true
}
```

#### PUT /api/profile
Update current user's profile.

**Request Body:**
```json
{
  "name": "Ahmad bin Ali",
  "email": "ahmad@example.com",
  "phone": "0123456789"
}
```

#### POST /api/profile/change-password
Change password.

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Validation:**
- Current password must be correct
- New password minimum 6 characters
- Confirm password must match

### 4.5 Schedule Management

#### GET /api/schedules
Fetch schedules for date range.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| start_date | string | Start date (YYYY-MM-DD) |
| end_date | string | End date (YYYY-MM-DD) |
| week_number | number | Week number |
| year | number | Year |

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-12-11",
      "prayer_time": "Subuh",
      "imam_id": 2,
      "imam_name": "Ahmad",
      "bilal_id": 3,
      "bilal_name": "Hassan"
    }
  ]
}
```

#### POST /api/schedules/generate
Auto-generate weekly schedule.

**Request Body:**
```json
{
  "start_date": "2025-12-11"
}
```

**Authorization:** head_imam, admin

### 4.6 Financial Management

#### POST /api/financial/statements
Upload bank statement.

**Request:** FormData
| Field | Type | Description |
|-------|------|-------------|
| file | File | CSV file |
| month | number | Month (1-12) |
| year | number | Year |
| opening_balance | number | Opening balance |

**Response:**
```json
{
  "success": true,
  "statement_id": 1,
  "transactions_count": 150
}
```

#### GET /api/financial/transactions
Fetch transactions.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| statement_id | number | Statement ID |
| type | string | penerimaan/pembayaran/uncategorized |

#### PUT /api/financial/transactions
Update transaction category.

**Request Body:**
```json
{
  "id": 1,
  "transaction_type": "penerimaan",
  "category_penerimaan": "Sumbangan Am",
  "sub_category_penerimaan": "Infaq",
  "bulan_perkiraan": "bulan_semasa",
  "notes": "Sumbangan jemaah"
}
```

#### POST /api/financial/auto-categorize
Auto-categorize transactions using keywords.

**Request Body:**
```json
{
  "statement_id": 1,
  "transaction_ids": [1, 2, 3],
  "preview": true
}
```

**Response (Preview Mode):**
```json
{
  "preview": true,
  "total_transactions": 100,
  "matches_found": 45,
  "updates": [
    {
      "id": 1,
      "category_penerimaan": "Sumbangan Am",
      "matched_keyword": "infaq",
      "search_text": "TRF123 Sumbangan Infaq"
    }
  ]
}
```

### 4.7 Financial Reports

| Endpoint | Report Type |
|----------|-------------|
| GET /api/financial/reports/buku-tunai | Cash Book (BR-KMS 002) |
| GET /api/financial/reports/laporan-bulanan | Monthly Report (BR-KMS 018) |
| GET /api/financial/reports/penyata-kewangan-tahunan | Annual Statement (BR-KMS 019) |
| GET /api/financial/penyesuaian-bank | Bank Reconciliation (BR-KMS 020) |
| GET /api/financial/reports/anggaran | Budget (BR-KMS 001) |
| GET /api/financial/reports/nota-* | Category Notes |

### 4.8 Khairat Management

#### POST /api/khairat
Register new khairat member.

**Authorization:** Public (no auth required)

**Request Body:**
```json
{
  "nama": "Ahmad bin Ali",
  "no_kp": "800101125555",
  "alamat": "No 123, Jalan ABC",
  "no_hp": "0123456789",
  "email": "ahmad@example.com",
  "jenis_yuran": "keahlian",
  "amaun_bayaran": 50.00,
  "tanggungan": [
    {
      "nama_penuh": "Fatimah binti Ahmad",
      "no_kp": "850202135555",
      "pertalian": "isteri"
    }
  ]
}
```

#### GET /api/khairat/search
Search khairat members.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| no_kp | string | IC number to search |

### 4.9 Notification Endpoints

#### POST /api/notifications
Send notifications.

**Request Body:**
```json
{
  "type": "duty_reminder",
  "recipients": [
    {
      "name": "Ahmad",
      "phone": "0123456789"
    }
  ],
  "data": {
    "date": "2025-12-12",
    "prayer_times": ["Subuh", "Isyak"]
  }
}
```

---

## 5. Authentication & Authorization

### 5.1 NextAuth Configuration

```typescript
// lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // 1. Find user by email
        // 2. Verify password with bcrypt
        // 3. Check is_active = true
        // 4. Return user object or null
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    }
  }
};
```

### 5.2 Role-Based Access Control

| Role | Description | Access Level |
|------|-------------|--------------|
| admin | System administrator | Full access |
| head_imam | Head Imam | Schedules, reports, approvals |
| imam | Prayer leader | View schedules, availability |
| bilal | Muezzin | View schedules, availability |
| bendahari | Treasurer | Financial management |
| inventory_staff | Asset manager | Asset management |

### 5.3 Authorization Patterns

**API Route Protection:**
```typescript
// Pattern for protected API routes
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  // Check authentication
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Check authorization
  if (!['admin', 'head_imam'].includes(session.user.role)) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    );
  }

  // Proceed with operation
}
```

**Page Protection:**
```typescript
// Client-side protection
'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status]);

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  return <PageContent />;
}
```

### 5.4 Password Security

- **Hashing Algorithm:** bcrypt
- **Salt Rounds:** 10
- **Minimum Length:** 6 characters
- **Storage:** Hashed only, never plain text

---

## 6. External Integrations

### 6.1 WhatsApp Integration (Twilio)

**Configuration:**
```typescript
// lib/whatsapp.ts
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
```

**Phone Number Formatting:**
```typescript
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('60')) {
    cleaned = '60' + cleaned;
  }
  return '+' + cleaned;
}
```

**Message Templates:**
| Template ID | Purpose |
|-------------|---------|
| HX0314b4c3... | Duty reminder |
| HXcbe52067... | Preacher reminder |

**Rate Limiting:**
- 10 seconds between messages
- Sequential batch processing

### 6.2 Email Integration (Nodemailer)

**Configuration:**
```typescript
// lib/email.ts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

**Email Templates:**
- Feedback confirmation
- Feedback reply
- Khairat approval/rejection
- HTML + plain text versions

### 6.3 File Upload

**Configuration:**
- Max file size: 5 MB
- Allowed types: JPEG, PNG, WebP, PDF
- Storage: `/public/uploads/`

**Security:**
- Directory traversal prevention
- Extension validation
- MIME type checking

### 6.4 CSV Parsing (Papa Parse)

**Bank Statement Format:**
```
Header Row: Transaction Date, Customer EFT No, ...
Data Rows: DD/MM/YYYY, Value, ...
```

**Parsing Logic:**
1. Find header row containing "Transaction Date"
2. Extract subsequent data rows
3. Parse amounts (remove commas)
4. Parse dates (DD/MM/YYYY format)

---

## 7. Frontend Architecture

### 7.1 Directory Structure

```
app/
├── (auth)/
│   └── login/page.tsx
├── dashboard/
│   ├── page.tsx              # Main dashboard
│   ├── profile/page.tsx      # User profile
│   ├── khairat/page.tsx      # Khairat management
│   └── ...
├── financial/
│   ├── page.tsx              # Statement upload
│   ├── keywords/page.tsx     # Keyword management
│   └── transactions/page.tsx # Transaction categorization
├── help/
│   ├── page.tsx              # Help for logged-in users
│   └── public/page.tsx       # Help for public users
├── api/
│   └── ...                   # API routes
├── layout.tsx
└── globals.css

components/
├── Navbar.tsx
├── SessionProvider.tsx
├── BootstrapClient.tsx
└── PublicFooter.tsx

lib/
├── db.ts                     # Database connection
├── auth.ts                   # NextAuth config
├── whatsapp.ts               # WhatsApp utilities
├── email.ts                  # Email utilities
└── userColors.ts             # Schedule color coding
```

### 7.2 Component Patterns

**Page Component Structure:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function PageComponent() {
  const { data: session, status } = useSession();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/endpoint');
      const json = await res.json();
      setData(json.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      {/* Page content */}
    </div>
  );
}
```

### 7.3 State Management

- **Session State:** NextAuth useSession hook
- **Local State:** React useState
- **Form State:** Controlled components
- **Data Fetching:** fetch API with useEffect

### 7.4 Styling

- **Framework:** Bootstrap 5
- **Icons:** Bootstrap Icons
- **Custom CSS:** app/globals.css
- **Responsive:** Mobile-first approach

---

## 8. Data Flow Patterns

### 8.1 Schedule Generation Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Server    │    │  Database   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                   │
       │ POST /generate   │                   │
       │─────────────────>│                   │
       │                  │                   │
       │                  │ Get active users  │
       │                  │──────────────────>│
       │                  │<──────────────────│
       │                  │                   │
       │                  │ Get availability  │
       │                  │──────────────────>│
       │                  │<──────────────────│
       │                  │                   │
       │                  │ Run algorithm     │
       │                  │ (fair distribution)│
       │                  │                   │
       │                  │ Insert schedules  │
       │                  │──────────────────>│
       │                  │<──────────────────│
       │                  │                   │
       │ Success response │                   │
       │<─────────────────│                   │
```

### 8.2 Transaction Categorization Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   Server    │    │  Database   │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                   │
       │ Click "Jana Kategori"                │
       │                  │                   │
       │ POST /auto-categorize (preview=true) │
       │─────────────────>│                   │
       │                  │                   │
       │                  │ Get keywords      │
       │                  │──────────────────>│
       │                  │<──────────────────│
       │                  │                   │
       │                  │ Get transactions  │
       │                  │──────────────────>│
       │                  │<──────────────────│
       │                  │                   │
       │                  │ Match keywords    │
       │                  │                   │
       │ Preview results  │                   │
       │<─────────────────│                   │
       │                  │                   │
       │ User confirms    │                   │
       │                  │                   │
       │ POST /auto-categorize (preview=false)│
       │─────────────────>│                   │
       │                  │                   │
       │                  │ Update transactions│
       │                  │──────────────────>│
       │                  │<──────────────────│
       │                  │                   │
       │ Success response │                   │
       │<─────────────────│                   │
```

### 8.3 Notification Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Cron Job  │    │   Server    │    │   Twilio    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                   │
       │ Trigger at 10pm  │                   │
       │─────────────────>│                   │
       │                  │                   │
       │                  │ Get tomorrow's    │
       │                  │ schedules         │
       │                  │                   │
       │                  │ For each duty:    │
       │                  │                   │
       │                  │ Send WhatsApp     │
       │                  │──────────────────>│
       │                  │<──────────────────│
       │                  │                   │
       │                  │ Wait 10 seconds   │
       │                  │                   │
       │                  │ Send next message │
       │                  │──────────────────>│
       │                  │<──────────────────│
```

---

## 9. Error Handling

### 9.1 API Error Responses

```typescript
// Standard error response format
{
  "error": "Error message description",
  "status": 400 // HTTP status code
}

// Common status codes
// 400 - Bad Request (validation errors)
// 401 - Unauthorized (not logged in)
// 403 - Forbidden (insufficient permissions)
// 404 - Not Found
// 500 - Internal Server Error
```

### 9.2 Error Handling Patterns

**API Route Error Handling:**
```typescript
export async function POST(request: Request) {
  try {
    // Validate input
    if (!requiredField) {
      return NextResponse.json(
        { error: 'Field is required' },
        { status: 400 }
      );
    }

    // Database operation
    const result = await db.query(...);

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error('Operation failed:', error);

    // Handle specific errors
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Record already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Client-Side Error Handling:**
```typescript
const handleSubmit = async () => {
  try {
    setLoading(true);
    setError('');

    const res = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const json = await res.json();

    if (!res.ok) {
      throw new Error(json.error || 'Operation failed');
    }

    // Success handling
    setSuccess(true);

  } catch (error: any) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### 9.3 Validation

**Server-Side Validation:**
- Required field checks
- Email format validation
- Email uniqueness (database check)
- Password strength (minimum length)
- File type and size validation
- ENUM value validation

**Client-Side Validation:**
- HTML5 form validation
- Required field indicators
- Real-time feedback
- Bootstrap validation classes

---

## 10. Development & Deployment

### 10.1 Environment Variables

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=isar_db
DB_PORT=3306

# NextAuth
NEXTAUTH_SECRET=your-secret-key-change-this
NEXTAUTH_URL=http://localhost:3000

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=whatsapp:+60123456789

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Surau Ar-Raudhah <noreply@surau-arraudhah.com>
```

### 10.2 Database Connection Pool

```typescript
// lib/db.ts
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'isar_db',
  port: parseInt(process.env.DB_PORT || '3306'),

  // Pool settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // Timeouts
  connectTimeout: 10000,
  idleTimeout: 60000,
  maxIdle: 5,

  // Keep-alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Security
  multipleStatements: false
});
```

### 10.3 Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

### 10.4 Deployment Process

**Production Server:**
- Host: isar.myopensoft.net
- SSH Port: 8288
- App Directory: ~/isar
- Process Manager: PM2

**Deployment Steps:**
```bash
# 1. SSH into server
ssh myopensoft-isar@isar.myopensoft.net -p 8288

# 2. Navigate to app directory
cd ~/isar

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies
npm install

# 5. Build application
npm run build

# 6. Restart PM2 process
pm2 restart isar

# 7. Verify deployment
pm2 logs isar --lines 20
```

### 10.5 Database Migrations

Total migrations: **33 SQL files**

**Running Migrations:**
```bash
# Via API endpoint (admin only)
GET /api/admin/run-migration

# Or manually via MySQL client
mysql -u root -p isar_db < migrations/001_create_users.sql
```

---

## Appendix A: API Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { }
}
```

### Error Response
```json
{
  "error": "Error message",
  "details": "Additional details (optional)"
}
```

### Paginated Response
```json
{
  "data": [ ],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

## Appendix B: Category Enumerations

### Penerimaan Categories
1. Sumbangan Am
2. Sumbangan Khas
3. Hasil Sewaan
4. Deposit
5. Elaun/Bantuan
6. Hibah Pelaburan
7. Lain-lain Penerimaan

### Pembayaran Categories
1. Pentadbiran
2. Sumber Manusia
3. Pembangunan
4. Dakwah
5. Khidmat Sosial
6. Aset
7. Lain-lain Pembayaran

---

**Document History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Claude Code | Initial Technical Spec |
