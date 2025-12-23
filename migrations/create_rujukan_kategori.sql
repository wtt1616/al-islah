-- Migration: Create rujukan_kategori table
-- Purpose: Store keyword mappings for auto-categorization of transactions
-- Date: 2025-11-23

CREATE TABLE IF NOT EXISTS rujukan_kategori (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: kategori_nama stores the actual category name (PenerimaanCategory or PembayaranCategory)
-- This matches the string-based categories used in financial_transactions table
