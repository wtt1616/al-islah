# Product Requirements Document (PRD)
## Sistem iSAR - Islamic Surau Administration & Roster

**Version:** 1.0
**Last Updated:** December 2025
**Product Owner:** Surau Ar-Raudhah Management Committee

---

## 1. Executive Summary

### 1.1 Product Vision
Sistem iSAR adalah platform pengurusan bersepadu untuk surau dan masjid yang menyediakan penyelesaian digital menyeluruh untuk penjadualan tugas, pengurusan kewangan, inventori aset, dan perkhidmatan komuniti.

### 1.2 Problem Statement
Pengurusan surau secara tradisional menghadapi cabaran:
- Penjadualan Imam dan Bilal secara manual yang memakan masa
- Rekod kewangan yang tidak sistematik
- Pengurusan aset yang tidak teratur
- Komunikasi dengan jemaah yang tidak efisien
- Laporan kewangan manual yang terdedah kepada kesilapan

### 1.3 Solution
Sistem iSAR menyediakan:
- Penjanaan jadual automatik berdasarkan ketersediaan
- Pengurusan kewangan dengan pengkategorian automatik
- Pengurusan aset mengikut piawaian JAIS BR-AMS
- Notifikasi WhatsApp automatik
- Laporan kewangan mengikut format JAIS BR-KMS

---

## 2. User Personas

### 2.1 Admin (Pentadbir Sistem)
**Profil:** Ahli Jawatankuasa IT atau Setiausaha
**Keperluan:**
- Akses penuh ke semua modul
- Pengurusan pengguna sistem
- Konfigurasi sistem
- Lihat semua laporan

### 2.2 Head Imam (Imam Besar)
**Profil:** Imam utama yang menyelaras jadual
**Keperluan:**
- Urus jadual Imam dan Bilal
- Urus jadual penceramah
- Lihat permohonan cuti
- Akses laporan kewangan (baca sahaja)
- Luluskan permohonan majlis

### 2.3 Imam
**Profil:** Imam yang bertugas solat
**Keperluan:**
- Lihat jadual tugas sendiri
- Mohon cuti/ketidakhadiran
- Terima notifikasi WhatsApp
- Kemaskini profil

### 2.4 Bilal
**Profil:** Bilal yang bertugas azan dan iqamah
**Keperluan:**
- Lihat jadual tugas sendiri
- Mohon cuti/ketidakhadiran
- Terima notifikasi WhatsApp
- Kemaskini profil

### 2.5 Bendahari
**Profil:** Pegawai kewangan surau
**Keperluan:**
- Muat naik penyata bank
- Kategorikan transaksi
- Jana laporan kewangan
- Urus penyesuaian bank
- Akses penuh modul kewangan

### 2.6 Pengguna Awam (Public)
**Profil:** Jemaah dan orang awam
**Keperluan:**
- Lihat jadual solat dan kuliah
- Mohon penggunaan surau
- Daftar khairat kematian
- Hantar maklum balas
- Semak status permohonan

---

## 3. Feature Requirements

### 3.1 Modul Penjadualan (Schedule Management)

#### 3.1.1 Jadual Imam & Bilal
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| SCH-001 | Papar jadual mingguan (Rabu - Selasa) | High | Done |
| SCH-002 | Jana jadual automatik berdasarkan ketersediaan | High | Done |
| SCH-003 | Edit jadual secara manual | High | Done |
| SCH-004 | Kod warna unik untuk setiap Imam/Bilal | Medium | Done |
| SCH-005 | Cetak jadual dalam format A4 | Medium | Done |
| SCH-006 | Salin jadual ke minggu lain | Low | Done |
| SCH-007 | Notifikasi WhatsApp harian (10pm) | High | Done |

#### 3.1.2 Pengurusan Ketersediaan
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AVL-001 | Mohon ketidakhadiran dengan tarikh | High | Done |
| AVL-002 | Senarai ketidakhadiran untuk Head Imam | High | Done |
| AVL-003 | Auto-exclude dari jadual jika tidak hadir | High | Done |

#### 3.1.3 Jadual Penceramah
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PCH-001 | Urus senarai penceramah | High | Done |
| PCH-002 | Tetapkan jadual kuliah mingguan | High | Done |
| PCH-003 | Slot: Subuh, Dhuha (Weekend), Dhuha Jumaat, Tazkirah Jumaat, Maghrib | High | Done |
| PCH-004 | Notifikasi WhatsApp kepada penceramah | High | Done |
| PCH-005 | Muat naik foto penceramah | Low | Done |

---

### 3.2 Modul Kewangan (Financial Management)

#### 3.2.1 Pengurusan Transaksi
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FIN-001 | Muat naik penyata bank (CSV) | High | Done |
| FIN-002 | Parsing automatik transaksi dari CSV | High | Done |
| FIN-003 | Kategorikan transaksi (Penerimaan/Pembayaran) | High | Done |
| FIN-004 | Auto-kategorikan berdasarkan keyword | High | Done |
| FIN-005 | Urus kata kunci auto-kategori | Medium | Done |
| FIN-006 | Tetapan bulan perkiraan (Semasa/Sebelum/Depan) | High | Done |
| FIN-007 | Cadangan baki awal dari buku tunai bulan sebelum | Medium | Done |

#### 3.2.2 Kategori Kewangan
**Kategori Penerimaan:**
- Sumbangan Am
- Sumbangan Khas
- Hasil Sewaan
- Pelaburan
- Elaun/Bantuan
- Deposit
- Lain-lain Penerimaan

**Kategori Pembayaran:**
- Pentadbiran
- Sumber Manusia
- Pembangunan
- Dakwah
- Khidmat Sosial
- Aset

#### 3.2.3 Laporan Kewangan (BR-KMS)
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| RPT-001 | BR-KMS-001: Anggaran | Medium | Done |
| RPT-002 | BR-KMS-002: Buku Tunai | High | Done |
| RPT-003 | BR-KMS-018: Laporan Bulanan | High | Done |
| RPT-004 | BR-KMS-019: Penyata Kewangan Tahunan | High | Done |
| RPT-005 | BR-KMS-020: Penyesuaian Bank | High | Done |
| RPT-006 | Nota Butiran Baki (1 Jan & 31 Dis) | Medium | Done |
| RPT-007 | Nota Penerimaan (7 kategori) | Medium | Done |
| RPT-008 | Nota Pembayaran (6 kategori) | Medium | Done |

---

### 3.3 Modul Pengurusan Aset (Asset Management)

#### 3.3.1 Pendaftaran Aset
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AST-001 | Daftar Harta Modal | High | Done |
| AST-002 | Daftar Inventori | High | Done |
| AST-003 | Urus kategori aset | Medium | Done |
| AST-004 | Urus lokasi aset | Medium | Done |

#### 3.3.2 Pengurusan Aset
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AST-005 | Rekod pergerakan/pinjaman aset | Medium | Done |
| AST-006 | Rekod pemeriksaan berkala | Medium | Done |
| AST-007 | Rekod penyelenggaraan | Medium | Done |
| AST-008 | Rekod pelupusan | Medium | Done |
| AST-009 | Rekod kehilangan/hapus kira | Medium | Done |
| AST-010 | Laporan BR-AMS | Medium | Done |

---

### 3.4 Modul Khairat Kematian

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| KHR-001 | Pendaftaran ahli baru | High | Done |
| KHR-002 | Import ahli dari Excel | Medium | Done |
| KHR-003 | Senarai ahli dengan carian | High | Done |
| KHR-004 | Semak status keahlian (Public) | High | Done |
| KHR-005 | Rekod tanggungan ahli | Medium | Done |
| KHR-006 | Padam rekod ahli (Admin) | Low | Done |
| KHR-007 | Cetak kad ahli | Low | Done |

---

### 3.5 Modul Permohonan Majlis

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| PMH-001 | Borang permohonan online (Public) | High | Done |
| PMH-002 | Pilihan peralatan yang diperlukan | Medium | Done |
| PMH-003 | Semak tarikh yang telah ditempah | Medium | Done |
| PMH-004 | Semak status permohonan | High | Done |
| PMH-005 | Luluskan/Tolak permohonan (Admin/Head Imam) | High | Done |
| PMH-006 | Notifikasi WhatsApp status | Medium | Done |

---

### 3.6 Modul Aktiviti & Maklum Balas

#### 3.6.1 Kalendar Aktiviti
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| AKT-001 | Senarai aktiviti bulanan | Medium | Done |
| AKT-002 | Tambah/Edit aktiviti (Admin) | Medium | Done |
| AKT-003 | Kalendar aktiviti (Public) | Medium | Done |

#### 3.6.2 Maklum Balas
| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| MKL-001 | Borang maklum balas (Public) | Medium | Done |
| MKL-002 | Senarai maklum balas (Admin) | Medium | Done |
| MKL-003 | Balas maklum balas | Medium | Done |
| MKL-004 | Notifikasi e-mel kepada penghantar | Low | Done |

---

### 3.7 Modul Pengurusan Pengguna

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| USR-001 | Senarai pengguna | High | Done |
| USR-002 | Tambah pengguna baru | High | Done |
| USR-003 | Edit maklumat pengguna | High | Done |
| USR-004 | Aktif/Nyahaktif pengguna | High | Done |
| USR-005 | Reset kata laluan | High | Done |
| USR-006 | Profil pengguna sendiri | High | Done |
| USR-007 | Tukar kata laluan sendiri | High | Done |

---

### 3.8 Modul Notifikasi

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| NTF-001 | WhatsApp peringatan tugas Imam/Bilal | High | Done |
| NTF-002 | WhatsApp peringatan tugas Penceramah | High | Done |
| NTF-003 | E-mel pengesahan maklum balas | Low | Done |
| NTF-004 | WhatsApp status permohonan majlis | Medium | Done |

---

### 3.9 Halaman Bantuan

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| HLP-001 | Halaman bantuan untuk pengguna berdaftar | Medium | Done |
| HLP-002 | Halaman bantuan untuk orang awam | Medium | Done |
| HLP-003 | Soalan Lazim (FAQ) | Medium | Done |
| HLP-004 | Pautan pantas ke modul utama | Low | Done |

---

## 4. Non-Functional Requirements

### 4.1 Performance
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | Page load time | < 3 seconds |
| NFR-002 | API response time | < 500ms |
| NFR-003 | Concurrent users | 50+ |
| NFR-004 | Database connections | 10 pool |

### 4.2 Security
| ID | Requirement | Status |
|----|-------------|--------|
| NFR-005 | Password hashing (bcrypt) | Done |
| NFR-006 | JWT authentication | Done |
| NFR-007 | Role-based access control | Done |
| NFR-008 | Protected API routes | Done |
| NFR-009 | SQL injection prevention | Done |

### 4.3 Usability
| ID | Requirement | Status |
|----|-------------|--------|
| NFR-010 | Mobile responsive design | Done |
| NFR-011 | PWA support (offline) | Done |
| NFR-012 | Bahasa Melayu interface | Done |
| NFR-013 | Print-friendly reports | Done |

### 4.4 Reliability
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-014 | System uptime | 99.5% |
| NFR-015 | Data backup | Daily |
| NFR-016 | Error handling | Graceful |

---

## 5. Technical Constraints

### 5.1 Technology Stack
- **Frontend:** Next.js 14, React 18, TypeScript, Bootstrap 5
- **Backend:** Next.js API Routes
- **Database:** MySQL 8.0+
- **Authentication:** NextAuth.js
- **Hosting:** Node.js server with PM2

### 5.2 Third-Party Integrations
- **WhatsApp:** Twilio API
- **Email:** Nodemailer (SMTP)
- **PDF:** jsPDF
- **Excel:** xlsx library

### 5.3 Compliance
- **Kewangan:** JAIS BR-KMS format
- **Aset:** JAIS BR-AMS guidelines
- **Data:** Malaysian PDPA compliance

---

## 6. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| User Adoption | 100% Imam & Bilal | Active users |
| Schedule Automation | 90% auto-generated | Manual overrides |
| Transaction Categorization | 80% auto-categorized | Manual categorization |
| WhatsApp Delivery | 95% success rate | Delivery reports |
| Report Generation | < 5 seconds | Page load time |

---

## 7. Future Enhancements

### Phase 2 (Planned)
- SMS notifications backup
- Advanced analytics dashboard
- Multi-surau support
- Mobile app (React Native)

### Phase 3 (Considered)
- Real-time notifications (WebSocket)
- AI-powered schedule optimization
- Financial forecasting
- Integration dengan e-MAIS

---

## 8. Appendix

### A. Glossary
| Term | Definition |
|------|------------|
| Imam | Muslim prayer leader |
| Bilal | Person who calls the adhan |
| Khairat | Death benefit fund |
| Penerimaan | Income/Receipt |
| Pembayaran | Payment/Expense |
| Buku Tunai | Cash book |
| BR-KMS | Borang Rujukan - Kewangan Masjid & Surau |
| BR-AMS | Borang Rujukan - Aset Masjid & Surau |

### B. Reference Documents
- CLAUDE.md - Development log
- USER_MANUAL_iSAR.md - User manual
- DATABASE_SETUP_GUIDE.md - Database setup

---

**Document History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Dec 2025 | Claude Code | Initial PRD |
