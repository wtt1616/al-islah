// Sub-category mapping for Penerimaan categories
import {
  PenerimaanCategory,
  SubCategorySumbanganAm,
  SubCategorySumbanganKhas,
  SubCategoryHasilSewaan,
  SubCategorySumbanganElaun
} from '@/types';

export interface Category {
  id: number;
  nama_kategori: string;
  kod_kategori: string;
  penerangan: string | null;
  ada_subkategori: boolean;
  perlu_maklumat_pelaburan: boolean;
  aktif: boolean;
  urutan: number;
  subkategori: SubCategory[];
}

export interface SubCategory {
  id: number;
  kategori_id: number;
  nama_subkategori: string;
  kod_subkategori: string;
  penerangan: string | null;
  aktif: boolean;
  urutan: number;
}

// Legacy static mapping (fallback if database is not available)
export const subCategoriesMap: Record<string, string[]> = {
  'Sumbangan Am': [
    'Kutipan Jumaat',
    'Kutipan Harian',
    'Kutipan Hari Raya',
    'Sumbangan Agensi/Korporat/Syarikat/Yayasan',
    'Tahlil dan Doa Selamat',
    'Aktiviti dan Pengimarahan'
  ],
  'Sumbangan Khas (Amanah)': [
    'Khairat Kematian',
    'Pembangunan & Selenggara Wakaf',
    'Yuran Pengajian',
    'Pendidikan',
    'Ihya Ramadhan',
    'Ibadah Qurban',
    'Bantuan Bencana',
    'Anak Yatim'
  ],
  'Hasil Sewaan/Penjanaan Ekonomi': [
    'Telekomunikasi',
    'Tanah/Bangunan/Tapak',
    'Fasiliti dan Peralatan',
    'Kitar Semula',
    'Solar',
    'Jualan Kopiah'
  ],
  'Sumbangan Elaun': [
    'Nazir',
    'Imam 1',
    'Imam 2',
    'Bilal 1',
    'Bilal 2',
    'Siak 1',
    'Siak 2',
    'Timbalan Nazir',
    'Setiausaha',
    'Penolong Setiausaha',
    'Bendahari'
  ]
};

// Check if category has sub-categories (static version)
export function hasSubCategories(category: PenerimaanCategory | string): boolean {
  return category in subCategoriesMap;
}

// Get sub-categories for a given category (static version)
export function getSubCategories(category: PenerimaanCategory | string): string[] {
  return subCategoriesMap[category] || [];
}

// Dynamic version: check if category has sub-categories based on database data
export function hasSubCategoriesDynamic(category: Category | null): boolean {
  return category?.ada_subkategori || false;
}

// Dynamic version: get sub-categories from database category object
export function getSubCategoriesDynamic(category: Category | null): string[] {
  return category?.subkategori.map(sub => sub.nama_subkategori) || [];
}

// Check if category requires investment fields
export function requiresInvestmentFields(category: PenerimaanCategory | string): boolean {
  return category === 'Hibah Pelaburan';
}

// Dynamic version: check if category requires investment fields
export function requiresInvestmentFieldsDynamic(category: Category | null): boolean {
  return category?.perlu_maklumat_pelaburan || false;
}
