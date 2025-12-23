-- Migration: Add Financial Management Module
-- Date: 2025-11-23
-- Description: Add tables for bank statements and financial transactions

-- Step 1: Update users table to add 'bendahari' role
ALTER TABLE users
MODIFY COLUMN role ENUM('admin', 'head_imam', 'imam', 'bilal', 'inventory_staff', 'bendahari')
NOT NULL;

-- Step 2: Table for storing uploaded bank statements
CREATE TABLE IF NOT EXISTS bank_statements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  month TINYINT NOT NULL,
  year SMALLINT NOT NULL,
  uploaded_by INT NOT NULL,
  total_transactions INT NOT NULL DEFAULT 0,
  categorized_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  INDEX idx_month_year (month, year),
  INDEX idx_uploaded_by (uploaded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for storing individual transactions from bank statements
CREATE TABLE IF NOT EXISTS financial_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  statement_id INT NOT NULL,
  transaction_date DATETIME NOT NULL,
  customer_eft_no VARCHAR(100),
  transaction_code VARCHAR(50),
  transaction_description TEXT,
  ref_cheque_no VARCHAR(100),
  servicing_branch VARCHAR(50),
  debit_amount DECIMAL(15, 2) DEFAULT NULL,
  credit_amount DECIMAL(15, 2) DEFAULT NULL,
  balance DECIMAL(15, 2) NOT NULL,
  sender_recipient_name VARCHAR(255),
  payment_details TEXT,
  transaction_type ENUM('penerimaan', 'pembayaran', 'uncategorized') NOT NULL DEFAULT 'uncategorized',
  category_penerimaan ENUM(
    'Sumbangan Am',
    'Sumbangan Khas (Amanah)',
    'Hasil Sewaan/Penjanaan Ekonomi',
    'Tahlil',
    'Sumbangan Elaun',
    'Hibah Pelaburan',
    'Deposit',
    'Hibah Bank',
    'Lain-lain Terimaan'
  ) DEFAULT NULL,
  category_pembayaran ENUM(
    'Pentadbiran',
    'Pengurusan Sumber Manusia',
    'Pembangunan dan Penyelenggaraan',
    'Dakwah dan Pengimarahan',
    'Khidmat Sosial dan Kemasyarakatan',
    'Pembelian Aset',
    'Perbelanjaan Khas (Amanah)',
    'Pelbagai'
  ) DEFAULT NULL,
  notes TEXT,
  categorized_by INT DEFAULT NULL,
  categorized_at DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (statement_id) REFERENCES bank_statements(id) ON DELETE CASCADE,
  FOREIGN KEY (categorized_by) REFERENCES users(id),
  INDEX idx_statement (statement_id),
  INDEX idx_transaction_date (transaction_date),
  INDEX idx_transaction_type (transaction_type),
  INDEX idx_category_penerimaan (category_penerimaan),
  INDEX idx_category_pembayaran (category_pembayaran)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add bendahari user (password: bendahari123)
INSERT INTO users (name, email, password, role, phone, is_active)
VALUES (
  'Bendahari',
  'bendahari@masjid.com',
  '$2a$10$rQZ8vN3xYxK1YqK5pZxq0uQ9Z7XvH0KqJ6zN8xYxK1YqK5pZxq0uO',
  'bendahari',
  '0123456789',
  1
)
ON DUPLICATE KEY UPDATE email=email;
