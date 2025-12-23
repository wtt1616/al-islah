-- Migration: Add applicant info to aktiviti_surau table
-- Date: 2025-12-04
-- Description: Add no_handphone, anggaran_jemputan, peralatan, peralatan_lain columns

ALTER TABLE aktiviti_surau
ADD COLUMN no_handphone VARCHAR(20) NULL AFTER penganjur,
ADD COLUMN anggaran_jemputan INT NULL AFTER no_handphone,
ADD COLUMN peralatan JSON NULL AFTER anggaran_jemputan,
ADD COLUMN peralatan_lain VARCHAR(255) NULL AFTER peralatan;
