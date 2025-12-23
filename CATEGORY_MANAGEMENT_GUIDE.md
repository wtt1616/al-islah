# Panduan Pengurusan Kategori dan Sub-Kategori Penerimaan

## Ringkasan

Sistem iSAR kini mempunyai kemudahan untuk bendahari mengurus kategori dan sub-kategori penerimaan secara dinamik. Tiada lagi perlu edit kod - semua boleh diurus melalui interface web.

---

## ✨ Fitur Utama

### 1. **Selenggara Kategori**
- Tambah kategori baru
- Edit kategori sedia ada
- Padam kategori (jika tiada transaksi menggunakannya)
- Set kategori sebagai aktif/tidak aktif
- Atur urutan paparan

### 2. **Selenggara Sub-Kategori**
- Tambah sub-kategori untuk setiap kategori
- Edit sub-kategori
- Padam sub-kategori (jika tiada transaksi menggunakannya)
- Set sub-kategori sebagai aktif/tidak aktif
- Atur urutan paparan

### 3. **Kategori Khas**
- **Ada Sub-kategori**: Flag untuk kategori yang mempunyai sub-kategori
- **Perlu Maklumat Pelaburan**: Flag untuk kategori yang perlukan input jenis & institusi pelaburan

---

## 📋 Langkah Setup

### 1. Jalankan Database Migration

Jalankan SQL berikut di database production (phpMyAdmin atau MySQL command line):

```bash
# Lokasi fail:
database/migrations/create_kategori_penerimaan_tables.sql
```

**PENTING**: Migration ini akan:
1. Create 2 tables baru:
   - `kategori_penerimaan` - untuk kategori utama
   - `subkategori_penerimaan` - untuk sub-kategori
2. Seed data awal dengan semua kategori dan sub-kategori sedia ada
3. Tidak akan menjejaskan data transaksi sedia ada

### 2. Verify Tables Created

Semak tables baru telah dicipta:

```sql
-- Semak kategori
SELECT * FROM kategori_penerimaan ORDER BY urutan;

-- Semak sub-kategori
SELECT k.nama_kategori, s.nama_subkategori
FROM kategori_penerimaan k
LEFT JOIN subkategori_penerimaan s ON k.id = s.kategori_id
ORDER BY k.urutan, s.urutan;
```

Anda sepatutnya nampak:
- 9 kategori (Sumbangan Am, Sumbangan Khas, dll)
- 31 sub-kategori di bawah 4 kategori

---

## 🖥️ Cara Penggunaan

### Untuk Bendahari & Admin:

#### **A. Mengakses Halaman Selenggara Kategori**

1. Login sebagai bendahari atau admin
2. Navbar → **Kewangan** (dropdown) → **Selenggara Kategori**
3. Atau URL terus: `/financial/categories`

#### **B. Tambah Kategori Baru**

1. Klik butang **"Tambah Kategori"**
2. Isi maklumat:
   - **Nama Kategori**: Contoh "Sumbangan Korban"
   - **Kod Kategori**: Huruf besar, underscore. Contoh: `SUMB_KORBAN`
   - **Penerangan**: Opsional
   - **Urutan**: Nombor untuk susun kategori (1, 2, 3...)
   - **Ada Sub-kategori**: Tick jika kategori ini ada sub-kategori
   - **Perlu Maklumat Pelaburan**: Tick jika perlukan input pelaburan
   - **Aktif**: Tick untuk aktifkan kategori
3. Klik **Simpan**

#### **C. Edit Kategori**

1. Pada card kategori, klik butang **"Edit"**
2. Ubah maklumat yang diperlukan
3. Klik **Simpan**

#### **D. Tambah Sub-Kategori**

1. Pada card kategori yang ada flag "Ada Sub-kategori"
2. Klik butang **"+"** di bahagian Sub-Kategori
3. Isi maklumat:
   - **Nama Sub-kategori**: Contoh "Kutipan Aidilfitri"
   - **Kod Sub-kategori**: Contoh: `KUT_AIDILFITRI`
   - **Penerangan**: Opsional
   - **Urutan**: Nombor untuk susun sub-kategori
   - **Aktif**: Tick untuk aktifkan
4. Klik **Simpan**

#### **E. Edit/Padam Sub-Kategori**

1. Klik ikon pensil untuk edit
2. Klik ikon tong sampah untuk padam
3. **Nota**: Tidak boleh padam jika sub-kategori digunakan dalam transaksi. Set sebagai "Tidak Aktif" sahaja.

#### **F. Set Kategori/Sub-Kategori Tidak Aktif**

1. Edit kategori/sub-kategori
2. Untick "Aktif"
3. Simpan
4. Kategori/sub-kategori tidak akan muncul dalam dropdown transaksi baru, tetapi data lama tetap ada

---

## 🗂️ Struktur Database

### Table: `kategori_penerimaan`

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Primary key |
| `nama_kategori` | VARCHAR(255) | Nama kategori (UNIQUE) |
| `kod_kategori` | VARCHAR(50) | Kod kategori (UNIQUE) |
| `penerangan` | TEXT | Penerangan kategori |
| `ada_subkategori` | BOOLEAN | Flag untuk kategori yang ada sub-kategori |
| `perlu_maklumat_pelaburan` | BOOLEAN | Flag untuk kategori pelaburan |
| `aktif` | BOOLEAN | Status aktif/tidak aktif |
| `urutan` | INT | Urutan paparan |

### Table: `subkategori_penerimaan`

| Field | Type | Description |
|-------|------|-------------|
| `id` | INT | Primary key |
| `kategori_id` | INT | Foreign key ke `kategori_penerimaan` |
| `nama_subkategori` | VARCHAR(255) | Nama sub-kategori |
| `kod_subkategori` | VARCHAR(50) | Kod sub-kategori |
| `penerangan` | TEXT | Penerangan sub-kategori |
| `aktif` | BOOLEAN | Status aktif/tidak aktif |
| `urutan` | INT | Urutan paparan |

---

## 📁 Files Yang Ditambah/Diubah

### Files Baru:
1. `database/migrations/create_kategori_penerimaan_tables.sql` - Migration
2. `app/api/financial/categories/route.ts` - API untuk kategori (CRUD)
3. `app/api/financial/subcategories/route.ts` - API untuk sub-kategori (CRUD)
4. `app/financial/categories/page.tsx` - UI untuk selenggara kategori
5. `CATEGORY_MANAGEMENT_GUIDE.md` - Panduan ini

### Files Yang Diubah:
1. `components/Navbar.tsx` - Tambah dropdown Kewangan dengan link ke Selenggara Kategori
2. `lib/subCategories.ts` - Tambah interfaces dan helper functions untuk dynamic categories

---

## 🔒 Keselamatan & Access Control

- **View Kategori**: Admin, Bendahari, Head Imam
- **Tambah/Edit/Padam**: Admin, Bendahari sahaja
- Kategori/sub-kategori yang digunakan dalam transaksi **TIDAK BOLEH** dipadam
  - Sistem akan warning dan suggest set sebagai "Tidak Aktif"
- Kod kategori dan kod sub-kategori mesti UNIQUE

---

## 📝 Contoh Scenario

### **Scenario 1: Tambah Kategori Baru "Sumbangan Qurban"**

1. Login sebagai bendahari
2. Kewangan → Selenggara Kategori
3. Klik "Tambah Kategori"
4. Isi:
   - Nama: `Sumbangan Qurban`
   - Kod: `SUMB_QURBAN`
   - Penerangan: `Sumbangan untuk ibadah korban`
   - Ada Sub-kategori: ✓ (tick)
   - Urutan: `10`
   - Aktif: ✓ (tick)
5. Simpan
6. Tambah sub-kategori:
   - "Kambing" (KOD: `QURBAN_KAMBING`)
   - "Lembu" (KOD: `QURBAN_LEMBU`)
   - "1/7 Lembu" (KOD: `QURBAN_LEMBU_7`)

### **Scenario 2: Edit Nama Kategori**

1. Kewangan → Selenggara Kategori
2. Cari kategori yang mahu edit
3. Klik "Edit"
4. Ubah nama sahaja, biarkan kod seperti sedia ada
5. Simpan

**NOTA**: Jangan ubah kod kategori jika kategori sudah digunakan dalam transaksi!

### **Scenario 3: Nonaktifkan Sub-Kategori**

1. Cari kategori yang berkaitan
2. Klik ikon pensil pada sub-kategori
3. Untick "Aktif"
4. Simpan
5. Sub-kategori tidak akan muncul dalam dropdown baru, tetapi transaksi lama tetap ada

---

## ⚠️ Perkara Penting

1. **Jangan padam kategori/sub-kategori** yang sudah digunakan dalam transaksi
   - Set sebagai "Tidak Aktif" sahaja
   - Sistem akan bagi warning jika cuba padam

2. **Kod kategori adalah unik dan penting**
   - Gunakan huruf besar sahaja
   - Gunakan underscore (_) untuk pemisah
   - Contoh: `SUMB_AM`, `KUT_JUMAAT`
   - Jangan ubah kod jika kategori sudah digunakan

3. **Urutan menentukan paparan**
   - Nombor kecil akan dipaparkan dahulu
   - Boleh skip nombor (contoh: 1, 5, 10, 15)

4. **Backup database sebelum padam**
   - Walaupun sistem ada protection, lebih baik backup dulu

---

## 🔄 Migration dari Sistem Lama

Sistem lama menggunakan hardcoded categories. Sistem baru menggunakan database.

**Good news**: Migration script sudah seed semua kategori dan sub-kategori lama, jadi:
- ✅ Tiada data hilang
- ✅ Semua kategori lama ada dalam database
- ✅ Boleh terus guna seperti biasa
- ✅ Sekarang boleh tambah/edit/padam melalui UI

---

## 🚀 Next Steps (TODO)

1. ✅ Database migration
2. ✅ API endpoints (CRUD)
3. ✅ UI for category management
4. ✅ Navigation link
5. ⏳ Update transaction categorization to fetch from database (currently using static list)
6. ⏳ Update reports to show sub-categories
7. ⏳ Update auto-categorization to use dynamic categories

---

## 💡 Tips

- Gunakan naming convention yang konsisten
- Buat backup sebelum ubah kategori penting
- Set kategori lama sebagai "Tidak Aktif" instead of padam
- Atur urutan mengikut keutamaan penggunaan
- Tambah penerangan untuk kategori yang mungkin confusing

---

## 🆘 Troubleshooting

### "Cannot delete category that is used in transactions"
**Penyelesaian**: Set kategori sebagai "Tidak Aktif" instead of padam

### "Kod kategori already exists"
**Penyelesaian**: Guna kod yang berbeza. Kod mesti unik.

### Kategori tidak muncul dalam dropdown transaksi
**Penyelesaian**:
1. Semak kategori aktif atau tidak
2. Transaction page mungkin masih guna static list - tunggu update seterusnya

---

**Last Updated**: 2025-11-25
**Version**: 1.0
