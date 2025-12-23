-- Warning: column statistics not supported by the server.
-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: isar_db
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `availability`
--

DROP TABLE IF EXISTS `availability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `availability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `prayer_time` enum('Subuh','Zohor','Asar','Maghrib','Isyak') NOT NULL,
  `is_available` tinyint(1) DEFAULT 0,
  `reason` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_availability` (`user_id`,`date`,`prayer_time`),
  KEY `idx_user_date` (`user_id`,`date`),
  KEY `idx_date` (`date`),
  CONSTRAINT `availability_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `availability`
--

LOCK TABLES `availability` WRITE;
/*!40000 ALTER TABLE `availability` DISABLE KEYS */;
/*!40000 ALTER TABLE `availability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_statements`
--

DROP TABLE IF EXISTS `bank_statements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bank_statements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `upload_date` datetime NOT NULL DEFAULT current_timestamp(),
  `month` tinyint(4) NOT NULL,
  `year` smallint(6) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `total_transactions` int(11) NOT NULL DEFAULT 0,
  `categorized_count` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_month_year` (`month`,`year`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  CONSTRAINT `bank_statements_ibfk_1` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_statements`
--

LOCK TABLES `bank_statements` WRITE;
/*!40000 ALTER TABLE `bank_statements` DISABLE KEYS */;
/*!40000 ALTER TABLE `bank_statements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `financial_transactions`
--

DROP TABLE IF EXISTS `financial_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financial_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `statement_id` int(11) NOT NULL,
  `transaction_date` datetime NOT NULL,
  `customer_eft_no` varchar(100) DEFAULT NULL,
  `transaction_code` varchar(50) DEFAULT NULL,
  `transaction_description` text DEFAULT NULL,
  `ref_cheque_no` varchar(100) DEFAULT NULL,
  `servicing_branch` varchar(50) DEFAULT NULL,
  `debit_amount` decimal(15,2) DEFAULT NULL,
  `credit_amount` decimal(15,2) DEFAULT NULL,
  `balance` decimal(15,2) NOT NULL,
  `sender_recipient_name` varchar(255) DEFAULT NULL,
  `payment_details` text DEFAULT NULL,
  `transaction_type` enum('penerimaan','pembayaran','uncategorized') NOT NULL DEFAULT 'uncategorized',
  `category_penerimaan` enum('Sumbangan Am','Sumbangan Khas (Amanah)','Hasil Sewaan/Penjanaan Ekonomi','Tahlil','Sumbangan Elaun','Hibah Pelaburan','Deposit','Hibah Bank','Lain-lain Terimaan') DEFAULT NULL,
  `sub_category_penerimaan` varchar(255) DEFAULT NULL,
  `investment_type` varchar(255) DEFAULT NULL,
  `investment_institution` varchar(255) DEFAULT NULL,
  `category_pembayaran` enum('Pentadbiran','Pengurusan Sumber Manusia','Pembangunan dan Penyelenggaraan','Dakwah dan Pengimarahan','Khidmat Sosial dan Kemasyarakatan','Pembelian Aset','Perbelanjaan Khas (Amanah)','Pelbagai') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `categorized_by` int(11) DEFAULT NULL,
  `categorized_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `categorized_by` (`categorized_by`),
  KEY `idx_statement` (`statement_id`),
  KEY `idx_transaction_date` (`transaction_date`),
  KEY `idx_transaction_type` (`transaction_type`),
  KEY `idx_category_penerimaan` (`category_penerimaan`),
  KEY `idx_category_pembayaran` (`category_pembayaran`),
  KEY `idx_sub_category_penerimaan` (`sub_category_penerimaan`),
  CONSTRAINT `financial_transactions_ibfk_1` FOREIGN KEY (`statement_id`) REFERENCES `bank_statements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `financial_transactions_ibfk_2` FOREIGN KEY (`categorized_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `financial_transactions`
--

LOCK TABLES `financial_transactions` WRITE;
/*!40000 ALTER TABLE `financial_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `financial_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kategori_penerimaan`
--

DROP TABLE IF EXISTS `kategori_penerimaan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kategori_penerimaan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nama_kategori` varchar(255) NOT NULL,
  `kod_kategori` varchar(50) NOT NULL,
  `penerangan` text DEFAULT NULL,
  `ada_subkategori` tinyint(1) DEFAULT 0,
  `perlu_maklumat_pelaburan` tinyint(1) DEFAULT 0,
  `aktif` tinyint(1) DEFAULT 1,
  `urutan` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `nama_kategori` (`nama_kategori`),
  UNIQUE KEY `kod_kategori` (`kod_kategori`),
  KEY `idx_aktif` (`aktif`),
  KEY `idx_kod_kategori` (`kod_kategori`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kategori_penerimaan`
--

LOCK TABLES `kategori_penerimaan` WRITE;
/*!40000 ALTER TABLE `kategori_penerimaan` DISABLE KEYS */;
INSERT INTO `kategori_penerimaan` VALUES (1,'Sumbangan Am','SUMB_AM','Sumbangan am daripada masyarakat',1,0,1,1,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(2,'Sumbangan Khas (Amanah)','SUMB_KHAS','Sumbangan khas untuk tujuan tertentu',1,0,1,2,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(3,'Hasil Sewaan/Penjanaan Ekonomi','HASIL_SEWA','Pendapatan daripada sewaan dan penjanaan ekonomi',1,0,1,3,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(4,'Tahlil','TAHLIL','Penerimaan daripada majlis tahlil',0,0,1,4,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(5,'Sumbangan Elaun','SUMB_ELAUN','Elaun untuk kakitangan masjid',1,0,1,5,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(6,'Hibah Pelaburan','HIBAH_PELABURAN','Pendapatan daripada pelaburan',0,1,1,6,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(7,'Deposit','DEPOSIT','Deposit dan wang jaminan',0,0,1,7,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(8,'Hibah Bank','HIBAH_BANK','Hibah atau faedah daripada bank',0,0,1,8,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(9,'Lain-lain Terimaan','LAIN_LAIN','Terimaan lain yang tidak dikategorikan',0,0,1,9,'2025-11-25 09:52:03','2025-11-25 09:52:03');
/*!40000 ALTER TABLE `kategori_penerimaan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `prayer_times`
--

DROP TABLE IF EXISTS `prayer_times`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `prayer_times` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` enum('Subuh','Zohor','Asar','Maghrib','Isyak') NOT NULL,
  `display_order` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_prayer` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `prayer_times`
--

LOCK TABLES `prayer_times` WRITE;
/*!40000 ALTER TABLE `prayer_times` DISABLE KEYS */;
INSERT INTO `prayer_times` VALUES (1,'Subuh',1),(2,'Zohor',2),(3,'Asar',3),(4,'Maghrib',4),(5,'Isyak',5);
/*!40000 ALTER TABLE `prayer_times` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rujukan_kategori`
--

DROP TABLE IF EXISTS `rujukan_kategori`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rujukan_kategori` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `jenis_transaksi` enum('penerimaan','pembayaran') NOT NULL,
  `kategori_nama` varchar(255) NOT NULL,
  `keyword` varchar(255) NOT NULL,
  `aktif` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_jenis_transaksi` (`jenis_transaksi`),
  KEY `idx_keyword` (`keyword`),
  KEY `idx_aktif` (`aktif`),
  KEY `idx_kategori_nama` (`kategori_nama`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rujukan_kategori`
--

LOCK TABLES `rujukan_kategori` WRITE;
/*!40000 ALTER TABLE `rujukan_kategori` DISABLE KEYS */;
INSERT INTO `rujukan_kategori` VALUES (1,'penerimaan','Sumbangan Am','infaq',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(2,'penerimaan','Sumbangan Am','wakaf',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(3,'penerimaan','Sumbangan Am','karpet',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(4,'penerimaan','Sumbangan Am','Aircond',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(5,'penerimaan','Sumbangan Am','mimbar',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(6,'penerimaan','Hasil Sewaan/Penjanaan Ekonomi','kopiah',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(7,'penerimaan','Hasil Sewaan/Penjanaan Ekonomi','TNB FIAH',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(8,'penerimaan','Hasil Sewaan/Penjanaan Ekonomi','Cawan',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(9,'penerimaan','Tahlil','Tahlil',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(10,'penerimaan','Lain-lain Terimaan','korban',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(11,'pembayaran','Pentadbiran','elaun',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(12,'pembayaran','Pentadbiran','shati bilal',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(13,'pembayaran','Pentadbiran','shati imam',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(14,'pembayaran','Pengurusan Sumber Manusia','Cleaner',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(15,'pembayaran','Pengurusan Sumber Manusia','Sekuriti',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(16,'pembayaran','Pengurusan Sumber Manusia','Siak',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(17,'pembayaran','Pengurusan Sumber Manusia','bhs arab',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(18,'pembayaran','Pengurusan Sumber Manusia','tahsin',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(19,'pembayaran','Pembangunan dan Penyelenggaraan','baiki',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(20,'pembayaran','Pembangunan dan Penyelenggaraan','servis',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(21,'pembayaran','Dakwah dan Pengimarahan','Kul Subuh',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(22,'pembayaran','Dakwah dan Pengimarahan','Maghrib',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(23,'pembayaran','Dakwah dan Pengimarahan','Jumaat',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(24,'pembayaran','Dakwah dan Pengimarahan','Jamuan',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(25,'pembayaran','Khidmat Sosial dan Kemasyarakatan','Program',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(26,'pembayaran','Pembelian Aset','Aircond',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(27,'pembayaran','Pembelian Aset','Mihrab',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(28,'pembayaran','Pembelian Aset','Karpet',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(29,'pembayaran','Pembelian Aset','kerusi',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(30,'pembayaran','Pembelian Aset','meja',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(31,'pembayaran','Perbelanjaan Khas (Amanah)','Aircond',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(32,'pembayaran','Perbelanjaan Khas (Amanah)','Mihrab',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(33,'pembayaran','Perbelanjaan Khas (Amanah)','Karpet',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(34,'pembayaran','Pelbagai','Korban',1,'2025-11-25 10:05:19','2025-11-25 10:05:19'),(35,'pembayaran','Pelbagai','lembu',1,'2025-11-25 10:05:19','2025-11-25 10:05:19');
/*!40000 ALTER TABLE `rujukan_kategori` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `prayer_time` enum('Subuh','Zohor','Asar','Maghrib','Isyak') NOT NULL,
  `imam_id` int(11) DEFAULT NULL,
  `bilal_id` int(11) DEFAULT NULL,
  `week_number` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `is_auto_generated` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `modified_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_schedule` (`date`,`prayer_time`),
  KEY `imam_id` (`imam_id`),
  KEY `bilal_id` (`bilal_id`),
  KEY `created_by` (`created_by`),
  KEY `modified_by` (`modified_by`),
  KEY `idx_date` (`date`),
  KEY `idx_week` (`week_number`,`year`),
  CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`imam_id`) REFERENCES `users` (`id`),
  CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`bilal_id`) REFERENCES `users` (`id`),
  CONSTRAINT `schedules_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  CONSTRAINT `schedules_ibfk_4` FOREIGN KEY (`modified_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subkategori_penerimaan`
--

DROP TABLE IF EXISTS `subkategori_penerimaan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subkategori_penerimaan` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `kategori_id` int(11) NOT NULL,
  `nama_subkategori` varchar(255) NOT NULL,
  `kod_subkategori` varchar(50) NOT NULL,
  `penerangan` text DEFAULT NULL,
  `aktif` tinyint(1) DEFAULT 1,
  `urutan` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subkategori` (`kategori_id`,`nama_subkategori`),
  KEY `idx_kategori_id` (`kategori_id`),
  KEY `idx_aktif` (`aktif`),
  CONSTRAINT `subkategori_penerimaan_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_penerimaan` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subkategori_penerimaan`
--

LOCK TABLES `subkategori_penerimaan` WRITE;
/*!40000 ALTER TABLE `subkategori_penerimaan` DISABLE KEYS */;
INSERT INTO `subkategori_penerimaan` VALUES (1,1,'Kutipan Jumaat','KUT_JUMAAT',NULL,1,1,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(2,1,'Kutipan Harian','KUT_HARIAN',NULL,1,2,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(3,1,'Kutipan Hari Raya','KUT_RAYA',NULL,1,3,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(4,1,'Sumbangan Agensi/Korporat/Syarikat/Yayasan','SUMB_KORPORAT',NULL,1,4,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(5,1,'Tahlil dan Doa Selamat','TAHLIL_DOA',NULL,1,5,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(6,1,'Aktiviti dan Pengimarahan','AKTIVITI',NULL,1,6,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(7,2,'Khairat Kematian','KHAIRAT',NULL,1,1,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(8,2,'Pembangunan & Selenggara Wakaf','WAKAF',NULL,1,2,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(9,2,'Yuran Pengajian','YURAN',NULL,1,3,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(10,2,'Pendidikan','PENDIDIKAN',NULL,1,4,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(11,2,'Ihya Ramadhan','RAMADHAN',NULL,1,5,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(12,2,'Ibadah Qurban','QURBAN',NULL,1,6,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(13,2,'Bantuan Bencana','BENCANA',NULL,1,7,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(14,2,'Anak Yatim','YATIM',NULL,1,8,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(15,3,'Telekomunikasi','TELEKOM',NULL,1,1,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(16,3,'Tanah/Bangunan/Tapak','TANAH',NULL,1,2,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(17,3,'Fasiliti dan Peralatan','FASILITI',NULL,1,3,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(18,3,'Kitar Semula','KITAR_SEMULA',NULL,1,4,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(19,3,'Solar','SOLAR',NULL,1,5,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(20,3,'Jualan Kopiah','KOPIAH',NULL,1,6,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(21,5,'Nazir','NAZIR',NULL,1,1,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(22,5,'Imam 1','IMAM1',NULL,1,2,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(23,5,'Imam 2','IMAM2',NULL,1,3,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(24,5,'Bilal 1','BILAL1',NULL,1,4,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(25,5,'Bilal 2','BILAL2',NULL,1,5,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(26,5,'Siak 1','SIAK1',NULL,1,6,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(27,5,'Siak 2','SIAK2',NULL,1,7,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(28,5,'Timbalan Nazir','TIM_NAZIR',NULL,1,8,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(29,5,'Setiausaha','SETIA',NULL,1,9,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(30,5,'Penolong Setiausaha','PENOLONG_SETIA',NULL,1,10,'2025-11-25 09:52:03','2025-11-25 09:52:03'),(31,5,'Bendahari','BENDAHARI',NULL,1,11,'2025-11-25 09:52:03','2025-11-25 09:52:03');
/*!40000 ALTER TABLE `subkategori_penerimaan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','head_imam','imam','bilal','inventory_staff','bendahari') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@isar.com','$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2','admin','0123456789',1,'2025-11-25 09:42:21','2025-11-25 09:42:21'),(2,'Head Imam','headimam@isar.com','$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2','head_imam','0123456780',1,'2025-11-25 09:42:21','2025-11-25 09:42:21'),(3,'Imam 1','imam1@isar.com','$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2','imam','0123456781',1,'2025-11-25 09:42:21','2025-11-25 09:42:21'),(4,'Imam 2','imam2@isar.com','$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2','imam','0123456782',1,'2025-11-25 09:42:21','2025-11-25 09:42:21'),(5,'Bilal 1','bilal1@isar.com','$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2','bilal','0123456783',1,'2025-11-25 09:42:21','2025-11-25 09:42:21'),(6,'Bilal 2','bilal2@isar.com','$2a$10$rOmXF5YZnY8qhP5r8O7yKO8vBXJqT2P0Y9K7xL3wL9N8pT7jK6yL2','bilal','0123456784',1,'2025-11-25 09:42:21','2025-11-25 09:42:21'),(7,'Bendahari','bendahari@masjid.com','$2a$10$NjF1Fzo8jx37oyB5gKydYehQyUos6E.Jm8nC1thVSgn69fZXwemtK','bendahari','0123456789',1,'2025-11-25 09:49:46','2025-11-25 10:08:18');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'isar_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-25 18:48:30
