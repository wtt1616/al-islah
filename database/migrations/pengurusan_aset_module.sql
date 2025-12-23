-- Migration: Pengurusan Aset Module (Asset Management)
-- Date: 2025-11-29
-- Description: Comprehensive asset management based on JAIS guidelines (Bahagian D)
-- References: BR-AMS 001-011 forms

-- =====================================================
-- Helper procedure to add column if not exists
-- =====================================================
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;
DELIMITER //
CREATE PROCEDURE AddColumnIfNotExists(
    IN tableName VARCHAR(64),
    IN columnName VARCHAR(64),
    IN columnDef VARCHAR(500)
)
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tableName
        AND COLUMN_NAME = columnName
    ) THEN
        SET @sql = CONCAT('ALTER TABLE ', tableName, ' ADD COLUMN ', columnName, ' ', columnDef);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- =====================================================
-- STEP 1: Enhance existing inventory table
-- =====================================================
CALL AddColumnIfNotExists('inventory', 'kategori', "VARCHAR(100) DEFAULT NULL COMMENT 'Kategori aset'");
CALL AddColumnIfNotExists('inventory', 'sub_kategori', "VARCHAR(100) DEFAULT NULL COMMENT 'Sub-kategori aset'");
CALL AddColumnIfNotExists('inventory', 'jenama', "VARCHAR(100) DEFAULT NULL COMMENT 'Jenama'");
CALL AddColumnIfNotExists('inventory', 'model', "VARCHAR(100) DEFAULT NULL COMMENT 'Model'");
CALL AddColumnIfNotExists('inventory', 'no_siri_pembuat', "VARCHAR(100) DEFAULT NULL COMMENT 'No. Siri Pembuat'");
CALL AddColumnIfNotExists('inventory', 'tarikh_terima', "DATE DEFAULT NULL COMMENT 'Tarikh Terima'");
CALL AddColumnIfNotExists('inventory', 'harga_asal', "DECIMAL(15,2) DEFAULT 0 COMMENT 'Harga Asal'");
CALL AddColumnIfNotExists('inventory', 'lokasi_id', "INT DEFAULT NULL COMMENT 'Lokasi aset'");
CALL AddColumnIfNotExists('inventory', 'status', "VARCHAR(50) DEFAULT 'Sedang Digunakan' COMMENT 'Status aset'");
CALL AddColumnIfNotExists('inventory', 'catatan', "TEXT DEFAULT NULL COMMENT 'Catatan tambahan'");
CALL AddColumnIfNotExists('inventory', 'gambar', "VARCHAR(255) DEFAULT NULL COMMENT 'Path gambar aset'");
CALL AddColumnIfNotExists('inventory', 'tarikh_lupus', "DATE DEFAULT NULL COMMENT 'Tarikh pelupusan'");
CALL AddColumnIfNotExists('inventory', 'kaedah_lupus', "VARCHAR(100) DEFAULT NULL COMMENT 'Kaedah pelupusan'");

-- =====================================================
-- STEP 2: Enhance existing harta_modal table
-- =====================================================
CALL AddColumnIfNotExists('harta_modal', 'kategori', "VARCHAR(100) DEFAULT NULL COMMENT 'Kategori aset'");
CALL AddColumnIfNotExists('harta_modal', 'sub_kategori', "VARCHAR(100) DEFAULT NULL COMMENT 'Sub-kategori aset'");
CALL AddColumnIfNotExists('harta_modal', 'jenama', "VARCHAR(100) DEFAULT NULL COMMENT 'Jenama'");
CALL AddColumnIfNotExists('harta_modal', 'model', "VARCHAR(100) DEFAULT NULL COMMENT 'Model'");
CALL AddColumnIfNotExists('harta_modal', 'no_siri_pembuat', "VARCHAR(100) DEFAULT NULL COMMENT 'No. Siri Pembuat'");
CALL AddColumnIfNotExists('harta_modal', 'tarikh_terima', "DATE DEFAULT NULL COMMENT 'Tarikh Terima'");
CALL AddColumnIfNotExists('harta_modal', 'harga_asal', "DECIMAL(15,2) DEFAULT 0 COMMENT 'Harga Asal'");
CALL AddColumnIfNotExists('harta_modal', 'lokasi_id', "INT DEFAULT NULL COMMENT 'Lokasi aset'");
CALL AddColumnIfNotExists('harta_modal', 'status', "VARCHAR(50) DEFAULT 'Sedang Digunakan' COMMENT 'Status aset'");
CALL AddColumnIfNotExists('harta_modal', 'catatan', "TEXT DEFAULT NULL COMMENT 'Catatan tambahan'");
CALL AddColumnIfNotExists('harta_modal', 'gambar', "VARCHAR(255) DEFAULT NULL COMMENT 'Path gambar aset'");
CALL AddColumnIfNotExists('harta_modal', 'tarikh_lupus', "DATE DEFAULT NULL COMMENT 'Tarikh pelupusan'");
CALL AddColumnIfNotExists('harta_modal', 'kaedah_lupus', "VARCHAR(100) DEFAULT NULL COMMENT 'Kaedah pelupusan'");
CALL AddColumnIfNotExists('harta_modal', 'jangka_hayat_tahun', "INT DEFAULT NULL COMMENT 'Jangka hayat dalam tahun'");
CALL AddColumnIfNotExists('harta_modal', 'nilai_semasa', "DECIMAL(15,2) DEFAULT NULL COMMENT 'Nilai semasa selepas susut nilai'");

-- Clean up helper procedure
DROP PROCEDURE IF EXISTS AddColumnIfNotExists;

-- =====================================================
-- STEP 3: Create lokasi_aset table (Asset Locations)
-- For BR-AMS 003: Senarai Aset Alih Lokasi
-- =====================================================
CREATE TABLE IF NOT EXISTS lokasi_aset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kod_lokasi VARCHAR(50) UNIQUE NOT NULL COMMENT 'Kod lokasi (e.g., SAR/L/01)',
    nama_lokasi VARCHAR(255) NOT NULL COMMENT 'Nama lokasi (e.g., Pejabat Surau, Ruang Solat Utama)',
    keterangan TEXT DEFAULT NULL COMMENT 'Keterangan lokasi',
    pegawai_bertanggungjawab VARCHAR(255) DEFAULT NULL COMMENT 'Nama pegawai yang bertanggungjawab',
    no_tel_pegawai VARCHAR(20) DEFAULT NULL,
    aktif BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kod_lokasi (kod_lokasi),
    INDEX idx_nama_lokasi (nama_lokasi)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- STEP 4: Create pemeriksaan_aset table (Asset Inspection)
-- For BR-AMS 005: Borang Pemeriksaan Aset Alih
-- =====================================================
CREATE TABLE IF NOT EXISTS pemeriksaan_aset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tarikh_pemeriksaan DATE NOT NULL,
    jenis_aset ENUM('Harta Modal', 'Inventori') NOT NULL,
    aset_id INT NOT NULL COMMENT 'ID dari harta_modal atau inventory table',
    no_siri_pendaftaran VARCHAR(100) NOT NULL,
    keadaan ENUM('Baik', 'Rosak Ringan', 'Rosak Teruk', 'Hilang', 'Tidak Dijumpai') NOT NULL,
    catatan TEXT DEFAULT NULL COMMENT 'Catatan pemeriksaan',
    tindakan_diperlukan TEXT DEFAULT NULL COMMENT 'Tindakan yang perlu diambil',
    diperiksa_oleh INT NOT NULL COMMENT 'ID pegawai yang memeriksa',
    disahkan_oleh INT DEFAULT NULL COMMENT 'ID pegawai yang mengesahkan',
    tarikh_pengesahan DATE DEFAULT NULL,
    status_tindakan ENUM('Belum Diambil', 'Sedang Dijalankan', 'Selesai') DEFAULT 'Belum Diambil',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tarikh (tarikh_pemeriksaan),
    INDEX idx_jenis_aset (jenis_aset),
    INDEX idx_aset_id (aset_id),
    INDEX idx_keadaan (keadaan)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- STEP 5: Create penyelenggaraan_aset table (Asset Maintenance)
-- For BR-AMS 006: Rekod Penyelenggaraan Aset Alih
-- =====================================================
CREATE TABLE IF NOT EXISTS penyelenggaraan_aset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jenis_aset ENUM('Harta Modal', 'Inventori') NOT NULL,
    aset_id INT NOT NULL COMMENT 'ID dari harta_modal atau inventory table',
    no_siri_pendaftaran VARCHAR(100) NOT NULL,
    tarikh_penyelenggaraan DATE NOT NULL,
    jenis_penyelenggaraan ENUM('Pembaikan', 'Servis Berkala', 'Penggantian Komponen', 'Naik Taraf', 'Lain-lain') NOT NULL,
    keterangan_kerja TEXT NOT NULL COMMENT 'Keterangan kerja penyelenggaraan',
    nama_kontraktor VARCHAR(255) DEFAULT NULL COMMENT 'Nama kontraktor/syarikat',
    no_tel_kontraktor VARCHAR(20) DEFAULT NULL,
    kos DECIMAL(15,2) DEFAULT 0 COMMENT 'Kos penyelenggaraan (RM)',
    no_resit VARCHAR(100) DEFAULT NULL COMMENT 'No. resit/invois',
    tarikh_siap DATE DEFAULT NULL COMMENT 'Tarikh siap penyelenggaraan',
    status ENUM('Dirancang', 'Dalam Proses', 'Selesai', 'Dibatalkan') DEFAULT 'Dalam Proses',
    catatan TEXT DEFAULT NULL,
    dilaksana_oleh INT COMMENT 'ID pegawai yang melaksanakan',
    disahkan_oleh INT DEFAULT NULL COMMENT 'ID pegawai yang mengesahkan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tarikh (tarikh_penyelenggaraan),
    INDEX idx_jenis_aset (jenis_aset),
    INDEX idx_aset_id (aset_id),
    INDEX idx_status (status)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- STEP 6: Create pelupusan_aset table (Asset Disposal)
-- For BR-AMS 007: Borang Pelupusan Aset Alih
-- For BR-AMS 008: Laporan Tindakan Pelupusan
-- =====================================================
CREATE TABLE IF NOT EXISTS pelupusan_aset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    no_rujukan VARCHAR(100) UNIQUE NOT NULL COMMENT 'No. rujukan pelupusan (e.g., SAR/LP/2025/001)',
    jenis_aset ENUM('Harta Modal', 'Inventori') NOT NULL,
    aset_id INT NOT NULL COMMENT 'ID dari harta_modal atau inventory table',
    no_siri_pendaftaran VARCHAR(100) NOT NULL,
    keterangan_aset TEXT NOT NULL,
    harga_asal DECIMAL(15,2) DEFAULT 0,
    nilai_semasa DECIMAL(15,2) DEFAULT 0 COMMENT 'Nilai semasa sebelum pelupusan',
    tarikh_permohonan DATE NOT NULL COMMENT 'Tarikh permohonan pelupusan',
    sebab_pelupusan TEXT NOT NULL COMMENT 'Justifikasi pelupusan',
    kaedah_pelupusan ENUM('Jualan', 'Tukar Barang', 'Sumbangan/Hadiah', 'Serahan', 'Musnah/Buang/Bakar') NOT NULL,
    -- Untuk kaedah Jualan
    harga_jualan DECIMAL(15,2) DEFAULT NULL,
    nama_pembeli VARCHAR(255) DEFAULT NULL,
    -- Untuk kaedah Sumbangan/Hadiah
    nama_penerima VARCHAR(255) DEFAULT NULL COMMENT 'Nama penerima sumbangan/hadiah',
    alamat_penerima TEXT DEFAULT NULL,
    -- Status kelulusan
    status ENUM('Permohonan', 'Dalam Semakan', 'Diluluskan', 'Ditolak', 'Selesai') DEFAULT 'Permohonan',
    tarikh_kelulusan DATE DEFAULT NULL,
    diluluskan_oleh INT DEFAULT NULL,
    tarikh_pelupusan DATE DEFAULT NULL COMMENT 'Tarikh pelupusan sebenar',
    catatan TEXT DEFAULT NULL,
    -- Lampiran/Dokumen sokongan
    dokumen_sokongan VARCHAR(255) DEFAULT NULL COMMENT 'Path dokumen sokongan',
    dimohon_oleh INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_no_rujukan (no_rujukan),
    INDEX idx_tarikh_permohonan (tarikh_permohonan),
    INDEX idx_status (status),
    INDEX idx_kaedah (kaedah_pelupusan)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- STEP 7: Create pergerakan_aset table (Asset Movement/Loan)
-- For BR-AMS 004: Permohonan Pergerakan/Pinjaman Aset Alih
-- =====================================================
CREATE TABLE IF NOT EXISTS pergerakan_aset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    no_rujukan VARCHAR(100) UNIQUE NOT NULL COMMENT 'No. rujukan pergerakan (e.g., SAR/PG/2025/001)',
    jenis_pergerakan ENUM('Pindahan', 'Pinjaman') NOT NULL,
    jenis_aset ENUM('Harta Modal', 'Inventori') NOT NULL,
    aset_id INT NOT NULL COMMENT 'ID dari harta_modal atau inventory table',
    no_siri_pendaftaran VARCHAR(100) NOT NULL,
    keterangan_aset TEXT NOT NULL,
    -- Lokasi
    lokasi_asal_id INT DEFAULT NULL COMMENT 'ID lokasi asal',
    lokasi_tujuan_id INT DEFAULT NULL COMMENT 'ID lokasi tujuan',
    lokasi_asal_text VARCHAR(255) DEFAULT NULL COMMENT 'Nama lokasi asal (jika tiada dalam sistem)',
    lokasi_tujuan_text VARCHAR(255) DEFAULT NULL COMMENT 'Nama lokasi tujuan (jika tiada dalam sistem)',
    -- Peminjam (untuk pinjaman)
    nama_peminjam VARCHAR(255) DEFAULT NULL COMMENT 'Nama peminjam',
    no_tel_peminjam VARCHAR(20) DEFAULT NULL,
    tujuan_pinjaman TEXT DEFAULT NULL COMMENT 'Tujuan pinjaman',
    -- Tarikh
    tarikh_permohonan DATE NOT NULL,
    tarikh_mula DATE NOT NULL COMMENT 'Tarikh mula pindahan/pinjaman',
    tarikh_dijangka_pulang DATE DEFAULT NULL COMMENT 'Tarikh dijangka pulang (untuk pinjaman)',
    tarikh_sebenar_pulang DATE DEFAULT NULL COMMENT 'Tarikh sebenar pulang',
    -- Status
    status ENUM('Permohonan', 'Diluluskan', 'Ditolak', 'Dalam Pergerakan', 'Dipulangkan', 'Tidak Dipulangkan') DEFAULT 'Permohonan',
    keadaan_semasa_keluar ENUM('Baik', 'Rosak Ringan', 'Rosak Teruk') DEFAULT 'Baik',
    keadaan_semasa_pulang ENUM('Baik', 'Rosak Ringan', 'Rosak Teruk', 'Hilang') DEFAULT NULL,
    catatan TEXT DEFAULT NULL,
    -- Pegawai
    dimohon_oleh INT NOT NULL,
    diluluskan_oleh INT DEFAULT NULL,
    tarikh_kelulusan DATE DEFAULT NULL,
    diterima_oleh VARCHAR(255) DEFAULT NULL COMMENT 'Nama penerima di lokasi tujuan',
    tarikh_terima DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_no_rujukan (no_rujukan),
    INDEX idx_jenis_pergerakan (jenis_pergerakan),
    INDEX idx_tarikh_mula (tarikh_mula),
    INDEX idx_status (status)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- STEP 8: Create kehilangan_aset table (Asset Loss/Write-off)
-- For BR-AMS 009: Laporan Kehilangan/Hapus Kira
-- =====================================================
CREATE TABLE IF NOT EXISTS kehilangan_aset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    no_rujukan VARCHAR(100) UNIQUE NOT NULL COMMENT 'No. rujukan kehilangan (e.g., SAR/KH/2025/001)',
    jenis_aset ENUM('Harta Modal', 'Inventori') NOT NULL,
    aset_id INT NOT NULL COMMENT 'ID dari harta_modal atau inventory table',
    no_siri_pendaftaran VARCHAR(100) NOT NULL,
    keterangan_aset TEXT NOT NULL,
    harga_asal DECIMAL(15,2) DEFAULT 0,
    nilai_semasa DECIMAL(15,2) DEFAULT 0,
    tarikh_kehilangan DATE NOT NULL COMMENT 'Tarikh kehilangan dikesan',
    lokasi_terakhir VARCHAR(255) DEFAULT NULL COMMENT 'Lokasi terakhir diketahui',
    sebab_kehilangan TEXT NOT NULL COMMENT 'Sebab/punca kehilangan',
    tindakan_diambil TEXT DEFAULT NULL COMMENT 'Tindakan yang telah diambil',
    -- Laporan polis (jika berkaitan)
    no_laporan_polis VARCHAR(100) DEFAULT NULL,
    tarikh_laporan_polis DATE DEFAULT NULL,
    balai_polis VARCHAR(255) DEFAULT NULL,
    -- Status
    status ENUM('Dilaporkan', 'Dalam Siasatan', 'Dijumpai', 'Hapus Kira Dalam Proses', 'Hapus Kira Diluluskan', 'Hapus Kira Ditolak') DEFAULT 'Dilaporkan',
    -- Hapus kira
    tarikh_mohon_hapus_kira DATE DEFAULT NULL,
    tarikh_lulus_hapus_kira DATE DEFAULT NULL,
    diluluskan_oleh INT DEFAULT NULL COMMENT 'ID pegawai yang meluluskan hapus kira',
    catatan TEXT DEFAULT NULL,
    -- Pegawai
    dilaporkan_oleh INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_no_rujukan (no_rujukan),
    INDEX idx_tarikh_kehilangan (tarikh_kehilangan),
    INDEX idx_status (status)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- STEP 9: Create kategori_aset table (Asset Categories)
-- =====================================================
CREATE TABLE IF NOT EXISTS kategori_aset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kod_kategori VARCHAR(20) UNIQUE NOT NULL COMMENT 'Kod kategori (e.g., PP, PRT, KN)',
    nama_kategori VARCHAR(255) NOT NULL COMMENT 'Nama kategori',
    jenis_aset ENUM('Harta Modal', 'Inventori', 'Kedua-dua') DEFAULT 'Kedua-dua',
    keterangan TEXT DEFAULT NULL,
    aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kod_kategori (kod_kategori),
    INDEX idx_jenis_aset (jenis_aset)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =====================================================
-- STEP 10: Seed default asset categories
-- =====================================================
INSERT INTO kategori_aset (kod_kategori, nama_kategori, jenis_aset, keterangan) VALUES
('PP', 'Peralatan Pejabat', 'Kedua-dua', 'Komputer, pencetak, mesin fotostat, dll'),
('PRT', 'Perabot', 'Kedua-dua', 'Meja, kerusi, almari, rak, dll'),
('KN', 'Kenderaan', 'Harta Modal', 'Kereta, van, motosikal, dll'),
('KJ', 'Kelengkapan Jaringan', 'Kedua-dua', 'Router, switch, kabel, dll'),
('ES', 'Elektrik & Sistem', 'Kedua-dua', 'Penghawa dingin, kipas, lampu, dll'),
('AV', 'Audio Visual', 'Kedua-dua', 'PA system, projektor, skrin, dll'),
('KP', 'Kelengkapan Perkhidmatan', 'Kedua-dua', 'Alat kebersihan, alat keselamatan, dll'),
('SU', 'Sukan & Rekreasi', 'Inventori', 'Peralatan sukan, permainan, dll'),
('IB', 'Ibadah', 'Kedua-dua', 'Sejadah, Al-Quran, mimbar, dll'),
('DPR', 'Dapur', 'Inventori', 'Peralatan dapur, pinggan mangkuk, dll'),
('LN', 'Lain-lain', 'Kedua-dua', 'Aset yang tidak termasuk dalam kategori lain')
ON DUPLICATE KEY UPDATE nama_kategori = VALUES(nama_kategori);

-- =====================================================
-- STEP 11: Seed default asset locations
-- =====================================================
INSERT INTO lokasi_aset (kod_lokasi, nama_lokasi, keterangan) VALUES
('SAR/L/01', 'Ruang Solat Utama', 'Ruang solat utama lelaki'),
('SAR/L/02', 'Ruang Solat Wanita', 'Ruang solat khusus wanita'),
('SAR/L/03', 'Pejabat Surau', 'Bilik pejabat pentadbiran'),
('SAR/L/04', 'Bilik Imam', 'Bilik rehat imam'),
('SAR/L/05', 'Ruang Wuduk Lelaki', 'Tempat wuduk lelaki'),
('SAR/L/06', 'Ruang Wuduk Wanita', 'Tempat wuduk wanita'),
('SAR/L/07', 'Stor', 'Bilik stor penyimpanan'),
('SAR/L/08', 'Dapur', 'Ruang dapur surau'),
('SAR/L/09', 'Beranda/Koridor', 'Kawasan luar dan koridor'),
('SAR/L/10', 'Tempat Letak Kenderaan', 'Kawasan parkir')
ON DUPLICATE KEY UPDATE nama_lokasi = VALUES(nama_lokasi);

-- =====================================================
-- STEP 12: Create view for combined asset list
-- For easier querying across both asset types
-- =====================================================
DROP VIEW IF EXISTS v_senarai_aset;
CREATE VIEW v_senarai_aset AS
SELECT
    'Harta Modal' AS jenis_aset,
    h.id,
    h.no_siri_pendaftaran,
    h.keterangan,
    h.kategori,
    h.sub_kategori,
    h.jenama,
    h.model,
    h.no_siri_pembuat,
    h.tarikh_terima,
    h.harga_asal,
    h.cara_diperolehi,
    h.status,
    l.nama_lokasi,
    h.catatan,
    h.created_at
FROM harta_modal h
LEFT JOIN lokasi_aset l ON h.lokasi_id = l.id
UNION ALL
SELECT
    'Inventori' AS jenis_aset,
    i.id,
    i.no_siri_pendaftaran,
    i.keterangan,
    i.kategori,
    i.sub_kategori,
    i.jenama,
    i.model,
    i.no_siri_pembuat,
    i.tarikh_terima,
    i.harga_asal,
    i.cara_diperolehi,
    i.status,
    l.nama_lokasi,
    i.catatan,
    i.created_at
FROM inventory i
LEFT JOIN lokasi_aset l ON i.lokasi_id = l.id;

-- =====================================================
-- STEP 13: Create sequence tables for auto-numbering
-- =====================================================
CREATE TABLE IF NOT EXISTS aset_sequence (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jenis VARCHAR(20) NOT NULL COMMENT 'HM, I, LP, PG, KH',
    tahun INT NOT NULL,
    last_number INT DEFAULT 0,
    UNIQUE KEY uk_jenis_tahun (jenis, tahun)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Initialize sequences for current year
INSERT INTO aset_sequence (jenis, tahun, last_number) VALUES
('HM', YEAR(CURDATE()), 0),
('I', YEAR(CURDATE()), 0),
('LP', YEAR(CURDATE()), 0),
('PG', YEAR(CURDATE()), 0),
('KH', YEAR(CURDATE()), 0)
ON DUPLICATE KEY UPDATE jenis = VALUES(jenis);
