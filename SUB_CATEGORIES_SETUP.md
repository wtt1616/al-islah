# Sub-Categories for Penerimaan - Setup Guide

## Ringkasan Fitur

Fitur sub-kategori membolehkan bendahari membuat kategorisasi transaksi penerimaan yang lebih terperinci.

### Sub-kategori yang tersedia:

**1. Sumbangan Am:**
- Kutipan Jumaat
- Kutipan Harian
- Kutipan Hari Raya
- Sumbangan Agensi/Korporat/Syarikat/Yayasan
- Tahlil dan Doa Selamat
- Aktiviti dan Pengimarahan

**2. Sumbangan Khas (Amanah):**
- Khairat Kematian
- Pembangunan & Selenggara Wakaf
- Yuran Pengajian
- Pendidikan
- Ihya Ramadhan
- Ibadah Qurban
- Bantuan Bencana
- Anak Yatim

**3. Hasil Sewaan/Penjanaan Ekonomi:**
- Telekomunikasi
- Tanah/Bangunan/Tapak
- Fasiliti dan Peralatan
- Kitar Semula
- Solar
- Jualan Kopiah

**4. Sumbangan Elaun:**
- Nazir
- Imam 1
- Imam 2
- Bilal 1
- Bilal 2
- Siak 1
- Siak 2
- Timbalan Nazir
- Setiausaha
- Penolong Setiausaha
- Bendahari

**5. Hibah Pelaburan:**
- Tiada dropdown sub-kategori
- Bendahari perlu masukkan:
  - **Jenis Pelaburan** (contoh: Fixed Deposit, ASB, Saham)
  - **Institusi Pelaburan** (contoh: Maybank, CIMB, Tabung Haji)

---

## Langkah Setup

### 1. Jalankan Migration Database

Jalankan migration berikut di phpMyAdmin atau MySQL command line:

```sql
-- File: database/migrations/add_subcategories_penerimaan.sql

ALTER TABLE financial_transactions
ADD COLUMN sub_category_penerimaan VARCHAR(255) DEFAULT NULL AFTER category_penerimaan,
ADD COLUMN investment_type VARCHAR(255) DEFAULT NULL AFTER sub_category_penerimaan,
ADD COLUMN investment_institution VARCHAR(255) DEFAULT NULL AFTER investment_type,
ADD INDEX idx_sub_category_penerimaan (sub_category_penerimaan);
```

### 2. Semak Perubahan

Semak table `financial_transactions` sekarang mempunyai field baru:
- `sub_category_penerimaan` - untuk sub-kategori
- `investment_type` - untuk jenis pelaburan (Hibah Pelaburan sahaja)
- `investment_institution` - untuk institusi pelaburan (Hibah Pelaburan sahaja)

---

## Cara Penggunaan

### Untuk Bendahari:

1. **Kategorikan Transaksi**
   - Pergi ke halaman Kewangan → Pilih statement → Senarai Transaksi
   - Klik butang pensil (edit) pada transaksi
   - Pilih jenis: Penerimaan
   - Pilih kategori (contoh: Sumbangan Am)
   - **Dropdown sub-kategori akan muncul** - pilih sub-kategori yang sesuai (opsional)

2. **Untuk Hibah Pelaburan**
   - Pilih kategori: Hibah Pelaburan
   - Form akan tunjuk 2 field tambahan:
     - Jenis Pelaburan (text field)
     - Institusi Pelaburan (text field)
   - Masukkan maklumat pelaburan

3. **Nota**
   - Sub-kategori adalah OPSIONAL untuk semua kategori (kecuali Hibah Pelaburan)
   - Untuk kategori lain yang tiada sub-kategori (Tahlil, Deposit, Hibah Bank, Lain-lain Terimaan), tiada dropdown sub-kategori

---

## Perubahan Kepada Sistem

### Files yang Ditambah:
1. `database/migrations/add_subcategories_penerimaan.sql` - Database migration
2. `lib/subCategories.ts` - Helper functions untuk sub-categories
3. `SUB_CATEGORIES_SETUP.md` - Panduan ini

### Files yang Diubah:
1. `types/index.ts` - Tambah TypeScript types untuk sub-categories
2. `app/api/financial/transactions/route.ts` - Update API untuk handle sub-categories
3. `app/financial/transactions/page.tsx` - Update UI dengan dropdown sub-category dan investment fields

---

## Testing

1. Login sebagai bendahari
2. Pergi ke Kewangan → Upload statement (atau pilih statement sedia ada)
3. Klik pada transaksi untuk kategorikan
4. Test scenarios:
   - **Sumbangan Am**: Pilih kategori, pastikan dropdown sub-kategori muncul dengan 6 pilihan
   - **Sumbangan Khas (Amanah)**: Pilih kategori, pastikan dropdown sub-kategori muncul dengan 8 pilihan
   - **Hasil Sewaan/Penjanaan Ekonomi**: Pilih kategori, pastikan dropdown sub-kategori muncul dengan 6 pilihan
   - **Sumbangan Elaun**: Pilih kategori, pastikan dropdown sub-kategori muncul dengan 11 pilihan
   - **Hibah Pelaburan**: Pilih kategori, pastikan 2 text fields muncul (Jenis & Institusi)
   - **Tahlil, Deposit, dll**: Pilih kategori, pastikan tiada sub-kategori dropdown

5. Simpan transaksi dan verify data tersimpan dengan betul

---

## TODO: Update Reports

Laporan BR-KMS-001 dan BR-KMS-002 perlu dikemaskini untuk paparkan sub-kategori dan maklumat pelaburan.

Files yang perlu dikemaskini:
- `app/api/financial/reports/anggaran/route.ts`
- `app/api/financial/reports/buku-tunai/route.ts`
- `app/dashboard/reports/anggaran/page.tsx`
- `app/dashboard/reports/buku-tunai/page.tsx`

---

## Support

Jika ada masalah atau pertanyaan, sila rujuk kepada dokumentasi atau hubungi pentadbir sistem.
