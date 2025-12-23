-- Migration: Seed rujukan_kategori with initial keywords from kategori.csv
-- Date: 2025-11-23

-- Insert keywords for Kategori Penerimaan

-- Sumbangan Am
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('penerimaan', 'Sumbangan Am', 'infaq', TRUE),
('penerimaan', 'Sumbangan Am', 'wakaf', TRUE),
('penerimaan', 'Sumbangan Am', 'karpet', TRUE),
('penerimaan', 'Sumbangan Am', 'Aircond', TRUE),
('penerimaan', 'Sumbangan Am', 'mimbar', TRUE);

-- Hasil Sewaan/Penjanaan Ekonomi
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('penerimaan', 'Hasil Sewaan/Penjanaan Ekonomi', 'kopiah', TRUE),
('penerimaan', 'Hasil Sewaan/Penjanaan Ekonomi', 'TNB FIAH', TRUE),
('penerimaan', 'Hasil Sewaan/Penjanaan Ekonomi', 'Cawan', TRUE);

-- Tahlil
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('penerimaan', 'Tahlil', 'Tahlil', TRUE);

-- Lain-lain Terimaan
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('penerimaan', 'Lain-lain Terimaan', 'korban', TRUE);

-- Insert keywords for Kategori Pembayaran

-- Pentadbiran
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('pembayaran', 'Pentadbiran', 'elaun', TRUE),
('pembayaran', 'Pentadbiran', 'shati bilal', TRUE),
('pembayaran', 'Pentadbiran', 'shati imam', TRUE);

-- Pengurusan Sumber Manusia
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('pembayaran', 'Pengurusan Sumber Manusia', 'Cleaner', TRUE),
('pembayaran', 'Pengurusan Sumber Manusia', 'Sekuriti', TRUE),
('pembayaran', 'Pengurusan Sumber Manusia', 'Siak', TRUE),
('pembayaran', 'Pengurusan Sumber Manusia', 'bhs arab', TRUE),
('pembayaran', 'Pengurusan Sumber Manusia', 'tahsin', TRUE);

-- Pembangunan dan Penyelenggaraan
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('pembayaran', 'Pembangunan dan Penyelenggaraan', 'baiki', TRUE),
('pembayaran', 'Pembangunan dan Penyelenggaraan', 'servis', TRUE);

-- Dakwah dan Pengimarahan
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('pembayaran', 'Dakwah dan Pengimarahan', 'Kul Subuh', TRUE),
('pembayaran', 'Dakwah dan Pengimarahan', 'Maghrib', TRUE),
('pembayaran', 'Dakwah dan Pengimarahan', 'Jumaat', TRUE),
('pembayaran', 'Dakwah dan Pengimarahan', 'Jamuan', TRUE);

-- Khidmat Sosial dan Kemasyarakatan
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('pembayaran', 'Khidmat Sosial dan Kemasyarakatan', 'Program', TRUE);

-- Pembelian Aset
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('pembayaran', 'Pembelian Aset', 'Aircond', TRUE),
('pembayaran', 'Pembelian Aset', 'Mihrab', TRUE),
('pembayaran', 'Pembelian Aset', 'Karpet', TRUE),
('pembayaran', 'Pembelian Aset', 'kerusi', TRUE),
('pembayaran', 'Pembelian Aset', 'meja', TRUE);

-- Perbelanjaan Khas (Amanah)
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('pembayaran', 'Perbelanjaan Khas (Amanah)', 'Aircond', TRUE),
('pembayaran', 'Perbelanjaan Khas (Amanah)', 'Mihrab', TRUE),
('pembayaran', 'Perbelanjaan Khas (Amanah)', 'Karpet', TRUE);

-- Pelbagai
INSERT INTO rujukan_kategori (jenis_transaksi, kategori_nama, keyword, aktif) VALUES
('pembayaran', 'Pelbagai', 'Korban', TRUE),
('pembayaran', 'Pelbagai', 'lembu', TRUE);

-- Note: kategori_nama values match exactly with PenerimaanCategory and PembayaranCategory types
