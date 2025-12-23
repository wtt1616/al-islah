# Architecture Document
## Sistem iSAR - Islamic Surau Administration & Roster

**Version:** 1.0
**Last Updated:** December 2025
**Document Type:** Software Architecture

---

## Table of Contents
1. [System Architecture Overview](#1-system-architecture-overview)
2. [Architecture Principles](#2-architecture-principles)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Component Architecture](#4-component-architecture)
5. [Data Architecture](#5-data-architecture)
6. [Security Architecture](#6-security-architecture)
7. [Integration Architecture](#7-integration-architecture)
8. [Deployment Architecture](#8-deployment-architecture)
9. [Performance Considerations](#9-performance-considerations)
10. [Architecture Decision Records](#10-architecture-decision-records)

---

## 1. System Architecture Overview

### 1.1 Architecture Style
iSAR menggunakan **Monolithic Full-Stack Architecture** dengan Next.js sebagai framework utama. Pendekatan ini dipilih kerana:

- **Kesederhanaan Deployment**: Satu aplikasi, satu proses
- **Pembangunan Cepat**: Tidak perlu koordinasi antara perkhidmatan
- **Kos Rendah**: Tiada overhead microservices
- **Sesuai untuk Skala**: Bilangan pengguna yang sederhana (~50 pengguna serentak)

### 1.2 Architecture Characteristics

| Karakteristik | Rating | Justifikasi |
|---------------|--------|-------------|
| Simplicity | High | Monolithic, single codebase |
| Maintainability | High | TypeScript, clear separation |
| Scalability | Medium | Adequate for mosque scale |
| Performance | High | SSR + optimized queries |
| Security | High | JWT, RBAC, bcrypt |
| Reliability | High | PM2, connection pooling |

---

## 2. Architecture Principles

### 2.1 Core Principles

1. **Convention over Configuration**
   - Menggunakan Next.js App Router conventions
   - File-based routing
   - API routes in `/app/api/`

2. **Separation of Concerns**
   - UI components terpisah dari business logic
   - API routes menguruskan data operations
   - Utility functions dalam `/lib/`

3. **Single Responsibility**
   - Setiap API route menguruskan satu domain
   - Components fokus pada rendering
   - Utilities menguruskan cross-cutting concerns

4. **Security First**
   - Authentication diperlukan untuk semua protected routes
   - Role-based access control
   - Input validation di server-side

5. **Progressive Enhancement**
   - Server-Side Rendering untuk SEO dan performance
   - Client-side interactivity untuk UX
   - PWA support untuk offline capability

---

## 3. High-Level Architecture

### 3.1 System Context Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         External Systems                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                  │
│  │   Twilio    │  │   Gmail     │  │   Browser   │                  │
│  │  WhatsApp   │  │   SMTP      │  │   Client    │                  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                  │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                         iSAR Application                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      Next.js Server                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │ │
│  │  │ React Pages  │  │  API Routes  │  │  NextAuth Handler    │  │ │
│  │  │   (SSR)      │  │   (REST)     │  │   (Authentication)   │  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────┘  │ │
│  │                           │                                     │ │
│  │  ┌────────────────────────┼────────────────────────────────┐   │ │
│  │  │              Business Logic Layer                        │   │ │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │   │ │
│  │  │  │ Schedule │ │ Finance  │ │ Khairat  │ │  Asset   │    │   │ │
│  │  │  │  Logic   │ │  Logic   │ │  Logic   │ │  Logic   │    │   │ │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │   │ │
│  │  └─────────────────────────────────────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                  │                                   │
│                                  ▼                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      MySQL Database                             │ │
│  │                    (Connection Pool)                            │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 Container Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         iSAR System                                  │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Web Application                            │   │
│  │                    [Next.js 14]                               │   │
│  │                                                               │   │
│  │  ┌─────────────────┐     ┌─────────────────────────────────┐ │   │
│  │  │  Client Bundle  │     │        Server Runtime           │ │   │
│  │  │  [React 18]     │────>│        [Node.js]                │ │   │
│  │  │  [Bootstrap 5]  │     │                                 │ │   │
│  │  └─────────────────┘     │  ┌───────────────────────────┐  │ │   │
│  │                          │  │    API Route Handlers     │  │ │   │
│  │                          │  │    [TypeScript]           │  │ │   │
│  │                          │  └───────────────────────────┘  │ │   │
│  │                          │                                 │ │   │
│  │                          │  ┌───────────────────────────┐  │ │   │
│  │                          │  │    NextAuth.js            │  │ │   │
│  │                          │  │    [JWT Sessions]         │  │ │   │
│  │                          │  └───────────────────────────┘  │ │   │
│  │                          └─────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                      │                               │
│                                      │ mysql2                        │
│                                      ▼                               │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     Database Server                           │   │
│  │                     [MySQL 8.0+]                              │   │
│  │                                                               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │   │
│  │  │   Users     │ │  Schedules  │ │  Financial Tables       │ │   │
│  │  │   Tables    │ │  Tables     │ │  (Statements, Trans)    │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │   │
│  │                                                               │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │   │
│  │  │  Khairat    │ │   Asset     │ │   Other Tables          │ │   │
│  │  │  Tables     │ │   Tables    │ │   (Feedback, etc)       │ │   │
│  │  └─────────────┘ └─────────────┘ └─────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Architecture

### 4.1 Frontend Component Architecture

```
app/
├── (auth)/
│   └── login/
│       └── page.tsx           # Login page (public)
│
├── dashboard/
│   ├── page.tsx               # Main dashboard
│   ├── profile/page.tsx       # User profile
│   ├── khairat/page.tsx       # Khairat management
│   ├── khairat-upload/        # Bulk upload
│   ├── permohonan-majlis/     # Facility requests
│   ├── aktiviti/              # Activities
│   ├── maklumbalas/           # Feedback
│   └── unavailability/        # Availability mgmt
│
├── schedules/
│   └── manage/page.tsx        # Schedule management
│
├── financial/
│   ├── page.tsx               # Statement upload
│   ├── keywords/page.tsx      # Keyword management
│   └── transactions/page.tsx  # Transaction categorization
│
├── reports/
│   └── */page.tsx             # Various financial reports
│
├── asset/
│   └── */page.tsx             # Asset management pages
│
├── help/
│   ├── page.tsx               # Help for users
│   └── public/page.tsx        # Help for public
│
└── (public pages)
    ├── khairat/               # Khairat registration
    ├── permohonan-majlis/     # Public booking
    ├── semak-status/          # Check status
    ├── maklumbalas/           # Public feedback
    └── kalendar-aktiviti/     # Activity calendar
```

### 4.2 API Component Architecture

```
app/api/
├── auth/
│   └── [...nextauth]/route.ts    # Authentication
│
├── users/
│   ├── route.ts                  # CRUD users
│   └── [id]/route.ts             # Single user operations
│
├── profile/
│   ├── route.ts                  # Profile operations
│   └── change-password/route.ts  # Password change
│
├── schedules/
│   ├── route.ts                  # Schedule CRUD
│   ├── generate/route.ts         # Auto-generation
│   ├── copy/route.ts             # Copy schedules
│   └── batch/route.ts            # Batch operations
│
├── availability/
│   ├── route.ts                  # Availability CRUD
│   └── unavailability/route.ts   # Unavailability
│
├── financial/
│   ├── statements/route.ts       # Statement upload
│   ├── transactions/route.ts     # Transaction CRUD
│   ├── auto-categorize/route.ts  # Auto-categorization
│   ├── keywords/route.ts         # Keywords CRUD
│   ├── categories/route.ts       # Categories
│   ├── subcategories/route.ts    # Subcategories
│   ├── penyesuaian-bank/route.ts # Bank reconciliation
│   └── reports/
│       ├── buku-tunai/route.ts   # Cash book
│       ├── laporan-bulanan/      # Monthly report
│       ├── anggaran/route.ts     # Budget
│       └── nota-*/route.ts       # Category notes
│
├── khairat/
│   ├── route.ts                  # Member management
│   ├── search/route.ts           # Member search
│   ├── upload/route.ts           # File upload
│   └── upload-excel/route.ts     # Bulk import
│
├── aset/
│   ├── senarai/route.ts          # Asset list
│   ├── kategori/route.ts         # Categories
│   ├── lokasi/route.ts           # Locations
│   ├── pergerakan/route.ts       # Movement
│   ├── pemeriksaan/route.ts      # Inspection
│   ├── penyelenggaraan/route.ts  # Maintenance
│   ├── pelupusan/route.ts        # Disposal
│   └── kehilangan/route.ts       # Loss/writeoff
│
├── notifications/
│   ├── route.ts                  # Send notifications
│   └── daily/route.ts            # Daily reminders
│
├── feedback/
│   ├── route.ts                  # Feedback CRUD
│   └── reply/route.ts            # Admin reply
│
├── permohonan-majlis/route.ts    # Facility requests
├── aktiviti/route.ts             # Activities
├── preachers/route.ts            # Preachers
│
└── uploads/
    └── [...path]/route.ts        # File serving
```

### 4.3 Shared Components

```
components/
├── Navbar.tsx              # Navigation bar with user menu
├── SessionProvider.tsx     # NextAuth session wrapper
├── BootstrapClient.tsx     # Bootstrap initialization
└── PublicFooter.tsx        # Footer for public pages

lib/
├── db.ts                   # Database connection pool
├── auth.ts                 # NextAuth configuration
├── whatsapp.ts             # WhatsApp integration
├── email.ts                # Email integration
└── userColors.ts           # Schedule color coding
```

### 4.4 Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Page Component                            │
│                        (e.g., dashboard/page.tsx)                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  useState, useEffect, useSession                            │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │                    fetch('/api/...')                        │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Route Handler                         │
│                        (e.g., api/schedules/route.ts)           │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  getServerSession(authOptions)                              │ │
│  │  - Verify JWT token                                         │ │
│  │  - Check user role                                          │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │  Business Logic                                             │ │
│  │  - Validation                                               │ │
│  │  - Data transformation                                      │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
│                             │                                    │
│  ┌──────────────────────────▼─────────────────────────────────┐ │
│  │  pool.execute(query, params)                                │ │
│  │  - Database operations                                      │ │
│  └──────────────────────────┬─────────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MySQL Database                            │
│                        (Connection Pool)                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Data Architecture

### 5.1 Domain Model

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Core Domain                                 │
│                                                                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐   │
│  │    User     │     │  Schedule   │     │    Availability     │   │
│  │─────────────│     │─────────────│     │─────────────────────│   │
│  │ id          │◄───┐│ id          │     │ id                  │   │
│  │ name        │    ││ date        │     │ user_id        ────►│───┤
│  │ email       │    ││ prayer_time │     │ date                │   │
│  │ password    │    ││ imam_id ────│─────│ prayer_time         │   │
│  │ role        │    ││ bilal_id ───│─────│ is_available        │   │
│  │ phone       │    ││ week_number │     │ reason              │   │
│  │ is_active   │    ││ year        │     └─────────────────────┘   │
│  └─────────────┘    │└─────────────┘                               │
│        ▲            │                                               │
│        │            │                                               │
│        └────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       Financial Domain                               │
│                                                                      │
│  ┌─────────────────┐     ┌─────────────────────────────────────┐   │
│  │  BankStatement  │     │       FinancialTransaction          │   │
│  │─────────────────│     │─────────────────────────────────────│   │
│  │ id              │◄───┐│ id                                  │   │
│  │ filename        │    ││ statement_id ──────────────────────►│───┤
│  │ month           │    ││ transaction_date                    │   │
│  │ year            │    ││ debit_amount                        │   │
│  │ opening_balance │    ││ credit_amount                       │   │
│  │ uploaded_by ────│───►││ transaction_type                    │   │
│  └─────────────────┘    ││ category_penerimaan                 │   │
│                         ││ category_pembayaran                 │   │
│  ┌─────────────────┐    ││ bulan_perkiraan                     │   │
│  │ RujukanKategori │    ││ categorized_by                      │   │
│  │─────────────────│    │└─────────────────────────────────────┘   │
│  │ id              │    │                                          │
│  │ jenis_transaksi │    │                                          │
│  │ kategori_nama   │────┘                                          │
│  │ keyword         │                                               │
│  │ aktif           │                                               │
│  └─────────────────┘                                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        Khairat Domain                                │
│                                                                      │
│  ┌─────────────────┐     ┌─────────────────────────────────────┐   │
│  │   KhairatAhli   │     │       KhairatTanggungan             │   │
│  │─────────────────│     │─────────────────────────────────────│   │
│  │ id              │◄───┐│ id                                  │   │
│  │ nama            │    ││ khairat_ahli_id ───────────────────►│───┤
│  │ no_kp           │    ││ nama_penuh                          │   │
│  │ alamat          │    ││ no_kp                               │   │
│  │ no_hp           │    ││ umur                                │   │
│  │ status          │    ││ pertalian                           │   │
│  │ tarikh_daftar   │    │└─────────────────────────────────────┘   │
│  │ approved_by ────│───►│                                          │
│  └─────────────────┘    │                                          │
│                         │                                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         Asset Domain                                 │
│                                                                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐   │
│  │ LokasiAset  │     │  Inventory  │     │    HartaModal       │   │
│  │─────────────│     │─────────────│     │─────────────────────│   │
│  │ id          │◄───┐│ id          │     │ id                  │   │
│  │ kod_lokasi  │    ││ name        │     │ nama                │   │
│  │ nama_lokasi │    ││ category    │     │ kategori            │   │
│  │ pegawai     │    ││ quantity    │     │ kuantiti            │   │
│  │ aktif       │    ││ lokasi_id ──│─────│ lokasi_id ─────────►│───┤
│  └─────────────┘    ││ status      │     │ harga_asal          │   │
│                     ││ harga_asal  │     │ nilai_semasa        │   │
│                     │└─────────────┘     │ jangka_hayat        │   │
│                     │                    └─────────────────────┘   │
│                     │                                               │
│  Asset Operations:  │                                               │
│  - Pemeriksaan      │                                               │
│  - Penyelenggaraan  │                                               │
│  - Pergerakan       │                                               │
│  - Pelupusan        │                                               │
│  - Kehilangan       │                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Bank Statement Processing Flow                    │
│                                                                      │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────┐   │
│  │  CSV File   │────>│  Papa Parse │────>│  Raw Transactions   │   │
│  │  Upload     │     │  Parser     │     │  Array              │   │
│  └─────────────┘     └─────────────┘     └──────────┬──────────┘   │
│                                                      │              │
│                                                      ▼              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Transaction Processing                    │   │
│  │                                                              │   │
│  │  For each row:                                               │   │
│  │  1. Parse date (DD/MM/YYYY)                                  │   │
│  │  2. Parse amounts (remove commas)                            │   │
│  │  3. Determine type (credit=penerimaan, debit=pembayaran)     │   │
│  │  4. Set transaction_type                                     │   │
│  └──────────────────────────────┬──────────────────────────────┘   │
│                                 │                                   │
│                                 ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Database Insert                           │   │
│  │                                                              │   │
│  │  1. Create bank_statements record                            │   │
│  │  2. Bulk insert financial_transactions                       │   │
│  │  3. Update total_transactions count                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                   Auto-Categorization Flow                           │
│                                                                      │
│  ┌─────────────────┐     ┌─────────────────────────────────────┐   │
│  │  rujukan_       │     │  Uncategorized Transactions         │   │
│  │  kategori       │     │                                     │   │
│  │  (keywords)     │     │  customer_eft_no + payment_details  │   │
│  └────────┬────────┘     └───────────────────┬─────────────────┘   │
│           │                                   │                     │
│           │    ┌─────────────────────────────┐│                     │
│           └───>│     Matching Algorithm      │◄┘                    │
│                │                             │                      │
│                │  1. Sort keywords by length │                      │
│                │  2. For each transaction:   │                      │
│                │     - Concatenate search    │                      │
│                │     - Loop keywords         │                      │
│                │     - First match wins      │                      │
│                │  3. Apply business rules    │                      │
│                │     if no keyword match     │                      │
│                └──────────────┬──────────────┘                      │
│                               │                                      │
│                               ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Preview Mode: Return matches without update                 │   │
│  │  Execute Mode: Update transactions + categorized_count       │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 6. Security Architecture

### 6.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Security Layers                              │
│                                                                      │
│  Layer 1: Transport Security                                         │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - HTTPS (TLS 1.2+)                                         │   │
│  │  - Secure cookies                                            │   │
│  │  - HTTP-only cookies                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Layer 2: Authentication                                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - NextAuth.js with Credentials provider                     │   │
│  │  - JWT tokens (signed with NEXTAUTH_SECRET)                  │   │
│  │  - bcrypt password hashing (10 rounds)                       │   │
│  │  - Session validation on each request                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Layer 3: Authorization                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - Role-Based Access Control (RBAC)                          │   │
│  │  - 6 roles: admin, head_imam, imam, bilal,                   │   │
│  │             bendahari, inventory_staff                       │   │
│  │  - Route-level permission checks                             │   │
│  │  - Resource ownership validation                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Layer 4: Input Validation                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - Server-side validation (all inputs)                       │   │
│  │  - SQL injection prevention (parameterized queries)          │   │
│  │  - XSS prevention (React auto-escaping)                      │   │
│  │  - File type/size validation                                 │   │
│  │  - Directory traversal prevention                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Layer 5: Database Security                                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - Connection pooling (10 max)                               │   │
│  │  - multipleStatements: false                                 │   │
│  │  - Prepared statements only                                  │   │
│  │  - Minimum privilege principle                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.2 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                       Authentication Flow                            │
│                                                                      │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────────────┐  │
│  │ Browser │    │ NextAuth│    │  API    │    │    Database     │  │
│  │         │    │         │    │         │    │                 │  │
│  └────┬────┘    └────┬────┘    └────┬────┘    └────────┬────────┘  │
│       │              │              │                   │           │
│       │  POST /api/auth/signin      │                   │           │
│       │──────────────>              │                   │           │
│       │              │              │                   │           │
│       │              │  Query user by email             │           │
│       │              │──────────────────────────────────>           │
│       │              │                                  │           │
│       │              │              User data           │           │
│       │              │<──────────────────────────────────           │
│       │              │              │                   │           │
│       │              │  Verify password (bcrypt)        │           │
│       │              │──────────────>                   │           │
│       │              │              │                   │           │
│       │              │  Generate JWT                    │           │
│       │              │──────────────>                   │           │
│       │              │              │                   │           │
│       │  Set-Cookie: next-auth.session-token           │           │
│       │<──────────────              │                   │           │
│       │              │              │                   │           │
│       │  Subsequent requests include JWT cookie         │           │
│       │──────────────────────────────>                  │           │
│       │              │              │                   │           │
│       │              │  Verify JWT  │                   │           │
│       │              │<─────────────│                   │           │
│       │              │              │                   │           │
│       │              │  Session data                    │           │
│       │              │──────────────>                   │           │
│       │              │              │                   │           │
│       │              Response with user context         │           │
│       │<────────────────────────────                    │           │
│       │              │              │                   │           │
└───────┴──────────────┴──────────────┴───────────────────┴───────────┘
```

### 6.3 Role Permission Matrix

| Feature | admin | head_imam | imam | bilal | bendahari | inventory_staff |
|---------|-------|-----------|------|-------|-----------|-----------------|
| User Management | Full | - | - | - | - | - |
| View Schedules | Yes | Yes | Yes | Yes | - | - |
| Edit Schedules | Yes | Yes | - | - | - | - |
| Generate Schedules | Yes | Yes | - | - | - | - |
| Mark Availability | Yes | Yes | Self | Self | - | - |
| Financial Upload | Yes | - | - | - | Yes | - |
| Categorize Trans. | Yes | View | - | - | Yes | - |
| View Reports | Yes | Yes | - | - | Yes | - |
| Khairat Approval | Yes | - | - | - | - | - |
| Asset Management | Yes | - | - | - | - | Yes |
| Feedback Reply | Yes | - | - | - | - | - |

---

## 7. Integration Architecture

### 7.1 External System Integrations

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Integration Architecture                          │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      iSAR Application                         │   │
│  │                                                               │   │
│  │  ┌───────────────────┐     ┌───────────────────────────────┐ │   │
│  │  │   WhatsApp        │     │   Email Integration           │ │   │
│  │  │   Integration     │     │   (Nodemailer)                │ │   │
│  │  │   (lib/whatsapp)  │     │   (lib/email)                 │ │   │
│  │  └─────────┬─────────┘     └───────────────┬───────────────┘ │   │
│  └────────────┼───────────────────────────────┼─────────────────┘   │
│               │                               │                      │
│               ▼                               ▼                      │
│  ┌─────────────────────┐         ┌─────────────────────────────┐   │
│  │   Twilio API        │         │       Gmail SMTP            │   │
│  │                     │         │                             │   │
│  │  REST API           │         │  SMTP Protocol              │   │
│  │  - Send messages    │         │  - Port 587 (TLS)           │   │
│  │  - Template vars    │         │  - HTML/Text emails         │   │
│  │  - Delivery status  │         │                             │   │
│  │                     │         │                             │   │
│  │  Endpoint:          │         │  Server:                    │   │
│  │  api.twilio.com     │         │  smtp.gmail.com             │   │
│  └─────────────────────┘         └─────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 WhatsApp Integration Details

```typescript
// lib/whatsapp.ts

Integration Pattern:
┌─────────────────────────────────────────────────────────────────┐
│                   WhatsApp Message Flow                          │
│                                                                  │
│  1. Format phone number                                          │
│     - Input: 0123456789                                          │
│     - Output: +60123456789                                       │
│                                                                  │
│  2. Select message type                                          │
│     - Template (24h+ window): Use ContentSid                     │
│     - Free-form (within 24h): Direct body text                   │
│                                                                  │
│  3. Send via Twilio REST API                                     │
│     POST /2010-04-01/Accounts/{SID}/Messages.json                │
│     - From: whatsapp:+60xxxxx                                    │
│     - To: whatsapp:+60yyyyyy                                     │
│     - ContentSid or Body                                         │
│     - ContentVariables (for templates)                           │
│                                                                  │
│  4. Rate limiting                                                │
│     - 10 seconds between messages                                │
│     - Sequential processing for batches                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Email Integration Details

```typescript
// lib/email.ts

Integration Pattern:
┌─────────────────────────────────────────────────────────────────┐
│                      Email Flow                                  │
│                                                                  │
│  1. Create transporter                                           │
│     nodemailer.createTransport({                                 │
│       host: 'smtp.gmail.com',                                    │
│       port: 587,                                                 │
│       secure: false,                                             │
│       auth: { user, pass }                                       │
│     })                                                           │
│                                                                  │
│  2. Send mail                                                    │
│     transporter.sendMail({                                       │
│       from: 'Surau Ar-Raudhah <noreply@...>',                    │
│       to: recipient,                                             │
│       subject: subject,                                          │
│       html: htmlContent,                                         │
│       text: plainTextContent                                     │
│     })                                                           │
│                                                                  │
│  3. Templates                                                    │
│     - Feedback confirmation                                      │
│     - Feedback reply                                             │
│     - Khairat approval/rejection                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Deployment Architecture

### 8.1 Production Environment

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Production Deployment                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   Production Server                           │   │
│  │                   (isar.myopensoft.net)                       │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │                      PM2                                │  │   │
│  │  │              (Process Manager)                          │  │   │
│  │  │                                                         │  │   │
│  │  │  ┌──────────────────────────────────────────────────┐  │  │   │
│  │  │  │              Next.js Application                  │  │  │   │
│  │  │  │              (Node.js Runtime)                    │  │  │   │
│  │  │  │                                                   │  │  │   │
│  │  │  │  - Port: 3000                                     │  │  │   │
│  │  │  │  - Cluster mode: Single instance                  │  │  │   │
│  │  │  │  - Auto-restart on crash                          │  │  │   │
│  │  │  │  - Log management                                 │  │  │   │
│  │  │  │                                                   │  │  │   │
│  │  │  └──────────────────────────────────────────────────┘  │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │                    MySQL 8.0                            │  │   │
│  │  │                    (Database)                           │  │   │
│  │  │                                                         │  │   │
│  │  │  - Connection pool: 10 max                              │  │   │
│  │  │  - Port: 3306                                           │  │   │
│  │  │  - Database: isar_db                                    │  │   │
│  │  │                                                         │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │                                                               │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │                    File Storage                         │  │   │
│  │  │                    (/public/uploads)                    │  │   │
│  │  │                                                         │  │   │
│  │  │  - Khairat receipts                                     │  │   │
│  │  │  - Preacher photos                                      │  │   │
│  │  │  - Asset images                                         │  │   │
│  │  │                                                         │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.2 Deployment Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Deployment Pipeline                              │
│                                                                      │
│  ┌───────────┐     ┌───────────┐     ┌───────────┐     ┌─────────┐ │
│  │ Developer │────>│   Git     │────>│  GitHub   │────>│  SSH    │ │
│  │ (Local)   │     │  Commit   │     │  Push     │     │  Pull   │ │
│  └───────────┘     └───────────┘     └───────────┘     └────┬────┘ │
│                                                              │      │
│                                                              ▼      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Production Server                          │  │
│  │                                                               │  │
│  │  1. git pull origin main                                      │  │
│  │  2. npm install                                               │  │
│  │  3. npm run build                                             │  │
│  │  4. pm2 restart isar                                          │  │
│  │  5. pm2 logs isar --lines 20 (verify)                         │  │
│  │                                                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.3 Environment Configuration

```bash
# Production Environment Variables

# Database
DB_HOST=localhost
DB_USER=isar_user
DB_PASSWORD=secure_password
DB_NAME=isar_db
DB_PORT=3306

# NextAuth
NEXTAUTH_SECRET=production-secret-key-32-chars-min
NEXTAUTH_URL=https://isar.myopensoft.net

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+60xxxxxxxxx

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@gmail.com
SMTP_PASS=app-specific-password
SMTP_FROM=Surau Ar-Raudhah <noreply@surau-arraudhah.com>
```

---

## 9. Performance Considerations

### 9.1 Database Optimization

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Database Optimization                              │
│                                                                      │
│  Connection Pooling:                                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  - connectionLimit: 10                                       │   │
│  │  - idleTimeout: 60000ms                                      │   │
│  │  - maxIdle: 5                                                │   │
│  │  - enableKeepAlive: true                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Indexing Strategy:                                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  users:                                                      │   │
│  │    - idx_role (role)                                         │   │
│  │    - idx_is_active (is_active)                               │   │
│  │                                                              │   │
│  │  schedules:                                                  │   │
│  │    - idx_date (date)                                         │   │
│  │    - idx_week_year (week_number, year)                       │   │
│  │    - unique_schedule (date, prayer_time)                     │   │
│  │                                                              │   │
│  │  financial_transactions:                                     │   │
│  │    - idx_statement (statement_id)                            │   │
│  │    - idx_transaction_date (transaction_date)                 │   │
│  │    - idx_transaction_type (transaction_type)                 │   │
│  │                                                              │   │
│  │  rujukan_kategori:                                           │   │
│  │    - idx_jenis_transaksi                                     │   │
│  │    - idx_keyword                                             │   │
│  │    - idx_aktif                                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 9.2 Application Performance

| Metric | Target | Strategy |
|--------|--------|----------|
| Page Load | < 3s | SSR, code splitting |
| API Response | < 500ms | Connection pooling, indexes |
| Concurrent Users | 50+ | PM2, connection pool |
| Memory Usage | < 512MB | Efficient queries |

### 9.3 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Caching Strategy                                 │
│                                                                      │
│  File Uploads:                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Cache-Control: public, max-age=31536000, immutable          │   │
│  │  (1 year cache for uploaded files)                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  Static Assets:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Next.js automatic caching for:                              │   │
│  │  - JS bundles                                                │   │
│  │  - CSS files                                                 │   │
│  │  - Images                                                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  API Responses:                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  No caching (dynamic data)                                   │   │
│  │  Fresh data on each request                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 10. Architecture Decision Records

### ADR-001: Monolithic Architecture

**Status:** Accepted

**Context:**
Need to build a mosque management system with limited development resources and moderate scale requirements.

**Decision:**
Use monolithic Next.js architecture instead of microservices.

**Consequences:**
- (+) Simpler deployment and maintenance
- (+) Lower operational costs
- (+) Faster development
- (-) Limited horizontal scaling
- (-) Coupled components

---

### ADR-002: NextAuth for Authentication

**Status:** Accepted

**Context:**
Need a secure, easy-to-implement authentication solution for Next.js.

**Decision:**
Use NextAuth.js with Credentials provider and JWT sessions.

**Consequences:**
- (+) Built-in security best practices
- (+) Easy integration with Next.js
- (+) Session management out of the box
- (-) Limited to supported providers
- (-) Learning curve for customization

---

### ADR-003: MySQL Database

**Status:** Accepted

**Context:**
Need a reliable, well-supported relational database for financial and operational data.

**Decision:**
Use MySQL 8.0+ with connection pooling.

**Consequences:**
- (+) Mature, stable technology
- (+) Strong ACID compliance for financial data
- (+) Wide hosting support
- (-) Requires schema management
- (-) Less flexible than NoSQL

---

### ADR-004: Twilio for WhatsApp

**Status:** Accepted

**Context:**
Need to send WhatsApp notifications for duty reminders and status updates.

**Decision:**
Use Twilio WhatsApp Business API.

**Consequences:**
- (+) Reliable message delivery
- (+) Official WhatsApp integration
- (+) Template message support
- (-) Per-message costs
- (-) Template approval process

---

### ADR-005: Local File Storage

**Status:** Accepted

**Context:**
Need to store uploaded files (receipts, photos) with low complexity.

**Decision:**
Use local filesystem storage in `/public/uploads/`.

**Consequences:**
- (+) Simple implementation
- (+) No additional service costs
- (+) Easy backup with filesystem
- (-) Not CDN-enabled
- (-) Server disk space limitation

---

### ADR-006: Bootstrap for UI

**Status:** Accepted

**Context:**
Need a responsive UI framework that is familiar and quick to implement.

**Decision:**
Use Bootstrap 5 with Bootstrap Icons.

**Consequences:**
- (+) Well-documented components
- (+) Mobile-responsive out of the box
- (+) Consistent design language
- (-) Larger bundle size than utility-first CSS
- (-) Generic appearance without customization

---

**Document History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Claude Code | Initial Architecture Doc |
