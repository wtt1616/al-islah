-- Migration: Add Sub-Categories for Penerimaan
-- Date: 2025-11-25
-- Description: Add sub_category_penerimaan field and related fields for investment details

-- Add sub_category_penerimaan column to financial_transactions
ALTER TABLE financial_transactions
ADD COLUMN sub_category_penerimaan VARCHAR(255) DEFAULT NULL AFTER category_penerimaan,
ADD COLUMN investment_type VARCHAR(255) DEFAULT NULL AFTER sub_category_penerimaan,
ADD COLUMN investment_institution VARCHAR(255) DEFAULT NULL AFTER investment_type,
ADD INDEX idx_sub_category_penerimaan (sub_category_penerimaan);

-- Note: Sub-categories are:
--
-- Sumbangan Am:
--   - Kutipan Jumaat
--   - Kutipan Harian
--   - Kutipan Hari Raya
--   - Sumbangan Agensi/Korporat/Syarikat/Yayasan
--   - Tahlil dan Doa Selamat
--   - Aktiviti dan Pengimarahan
--
-- Sumbangan Khas (Amanah):
--   - Khairat Kematian
--   - Pembangunan & Selenggara Wakaf
--   - Yuran Pengajian
--   - Pendidikan
--   - Ihya Ramadhan
--   - Ibadah Qurban
--   - Bantuan Bencana
--   - Anak Yatim
--
-- Hasil Sewaan/Penjanaan Ekonomi:
--   - Telekomunikasi
--   - Tanah/Bangunan/Tapak
--   - Fasiliti dan Peralatan
--   - Kitar Semula
--   - Solar
--   - Jualan Kopiah
--
-- Sumbangan Elaun:
--   - Nazir
--   - Imam 1
--   - Imam 2
--   - Bilal 1
--   - Bilal 2
--   - Siak 1
--   - Siak 2
--   - Timbalan Nazir
--   - Setiausaha
--   - Penolong Setiausaha
--   - Bendahari
--
-- Hibah Pelaburan:
--   (Free text in investment_type and investment_institution fields)
