// Jenis Pengguna
export type UserType = 'pengguna_dalaman' | 'petugas';

// Peranan Pengguna Dalaman
export type InternalUserRole = 'admin' | 'bendahari' | 'aset' | 'pegawai';

// Peranan Petugas
export type PetugasRole = 'imam' | 'bilal' | 'imam_jumaat' | 'bilal_jumaat' | 'penceramah' | 'head_imam' | 'tadabbur' | 'tahsin';

// Gabungan semua peranan (untuk backward compatibility)
export type UserRole = InternalUserRole | PetugasRole | 'inventory_staff';

export type PrayerTime = 'Subuh' | 'Zohor' | 'Asar' | 'Maghrib' | 'Isyak';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  user_type: UserType;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Availability {
  id: number;
  user_id: number;
  date: string;
  prayer_time: PrayerTime;
  is_available: boolean;
  reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Schedule {
  id: number;
  date: string;
  prayer_time: PrayerTime;
  imam_id: number;
  bilal_id: number;
  week_number: number;
  year: number;
  is_auto_generated: boolean;
  created_by?: number;
  modified_by?: number;
  created_at: Date;
  updated_at: Date;
  imam_name?: string;
  bilal_name?: string;
}

export interface WeekSchedule {
  weekNumber: number;
  year: number;
  startDate: string;
  endDate: string;
  schedules: Schedule[];
}

// =====================================
// Monthly Schedule Types
// =====================================

export type ScheduleType = 'prayer' | 'tadabbur' | 'tahsin' | 'imam_jumaat';
export type MonthlyPetugasRole = 'imam' | 'bilal' | 'siak' | 'tadabbur' | 'tahsin' | 'imam_jumaat';

export interface MonthlySchedule {
  id: number;
  schedule_date: string;
  schedule_type: ScheduleType;
  prayer_time: PrayerTime | null;
  petugas_id: number | null;
  petugas_role: MonthlyPetugasRole;
  petugas_name?: string;
  month_number: number;
  year: number;
  is_auto_generated: boolean;
  created_by?: number;
  modified_by?: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DayScheduleView {
  date: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 5=Friday, 6=Saturday
  prayers: {
    [key in PrayerTime]: {
      imam_id: number | null;
      imam_name: string | null;
      bilal_id: number | null;
      bilal_name: string | null;
    };
  };
  tadabbur: { petugas_id: number | null; petugas_name: string | null } | null;
  tahsin: { petugas_id: number | null; petugas_name: string | null };
  imam_jumaat: { petugas_id: number | null; petugas_name: string | null } | null;
}

export interface MonthlyStats {
  totalDays: number;
  totalPrayerSlots: number;
  assignedPrayerSlots: number;
  tadabburDays: number;
  assignedTadabbur: number;
  tahsinDays: number;
  assignedTahsin: number;
  imamJumaatCount: number;
  assignedImamJumaat: number;
}

export interface Inventory {
  id: number;
  no_siri_pendaftaran: string;
  keterangan: string;
  cara_diperolehi: string;
  created_by?: number;
  modified_by?: number;
  created_at: Date;
  updated_at: Date;
  creator_name?: string;
  modifier_name?: string;
}

export interface HartaModal {
  id: number;
  no_siri_pendaftaran: string;
  keterangan: string;
  cara_diperolehi: string;
  created_by?: number;
  modified_by?: number;
  created_at: Date;
  updated_at: Date;
  creator_name?: string;
  modifier_name?: string;
}

export interface Preacher {
  id: number;
  name: string;
  photo?: string;
  is_active: number;
  created_at: Date;
  updated_at: Date;
}

// Financial Management Types
export type TransactionType = 'penerimaan' | 'pembayaran' | 'uncategorized';

export type PenerimaanCategory =
  | 'Sumbangan Am'
  | 'Sumbangan Khas (Amanah)'
  | 'Hasil Sewaan/Penjanaan Ekonomi'
  | 'Tahlil'
  | 'Sumbangan Elaun'
  | 'Hibah Pelaburan'
  | 'Deposit'
  | 'Hibah Bank'
  | 'Lain-lain Terimaan';

// Sub-categories for Penerimaan
export type SubCategorySumbanganAm =
  | 'Kutipan Jumaat'
  | 'Kutipan Harian'
  | 'Kutipan Hari Raya'
  | 'Sumbangan Agensi/Korporat/Syarikat/Yayasan'
  | 'Tahlil dan Doa Selamat'
  | 'Aktiviti dan Pengimarahan';

export type SubCategorySumbanganKhas =
  | 'Khairat Kematian'
  | 'Pembangunan & Selenggara Wakaf'
  | 'Yuran Pengajian'
  | 'Pendidikan'
  | 'Ihya Ramadhan'
  | 'Ibadah Qurban'
  | 'Bantuan Bencana'
  | 'Anak Yatim';

export type SubCategoryHasilSewaan =
  | 'Telekomunikasi'
  | 'Tanah/Bangunan/Tapak'
  | 'Fasiliti dan Peralatan'
  | 'Kitar Semula'
  | 'Solar'
  | 'Jualan Kopiah';

export type SubCategorySumbanganElaun =
  | 'Nazir'
  | 'Imam 1'
  | 'Imam 2'
  | 'Bilal 1'
  | 'Bilal 2'
  | 'Siak 1'
  | 'Siak 2'
  | 'Timbalan Nazir'
  | 'Setiausaha'
  | 'Penolong Setiausaha'
  | 'Bendahari';

export type SubCategoryPenerimaan =
  | SubCategorySumbanganAm
  | SubCategorySumbanganKhas
  | SubCategoryHasilSewaan
  | SubCategorySumbanganElaun
  | string; // For Hibah Pelaburan (free text)

export type PembayaranCategory =
  | 'Pentadbiran'
  | 'Pengurusan Sumber Manusia'
  | 'Pembangunan dan Penyelenggaraan'
  | 'Dakwah dan Pengimarahan'
  | 'Khidmat Sosial dan Kemasyarakatan'
  | 'Pembelian Aset'
  | 'Perbelanjaan Khas (Amanah)'
  | 'Pelbagai';

export interface BankStatement {
  id: number;
  filename: string;
  upload_date: Date;
  month: number;
  year: number;
  uploaded_by: number;
  total_transactions: number;
  categorized_count: number;
  opening_balance: number;
  uploader_name?: string;
}

export type BulanPerkiraan = 'bulan_semasa' | 'bulan_depan' | 'bulan_sebelum';

export interface FinancialTransaction {
  id: number;
  statement_id: number;
  transaction_date: Date;
  customer_eft_no?: string;
  transaction_code?: string;
  transaction_description?: string;
  ref_cheque_no?: string;
  servicing_branch?: string;
  debit_amount?: number;
  credit_amount?: number;
  balance: number;
  sender_recipient_name?: string;
  payment_details?: string;
  transaction_type: TransactionType;
  category_penerimaan?: PenerimaanCategory;
  sub_category_penerimaan?: string;
  investment_type?: string; // For Hibah Pelaburan
  investment_institution?: string; // For Hibah Pelaburan
  category_pembayaran?: PembayaranCategory;
  sub_category1_pembayaran?: string; // Sub-kategori 1 for Pembayaran
  sub_category2_pembayaran?: string; // Sub-kategori 2 for Pembayaran
  notes?: string;
  bulan_perkiraan?: BulanPerkiraan; // Reconciliation indicator
  categorized_by?: number;
  categorized_at?: Date;
  created_at: Date;
}

export interface RujukanKategori {
  id: number;
  jenis_transaksi: 'penerimaan' | 'pembayaran';
  kategori_nama: string; // PenerimaanCategory | PembayaranCategory
  keyword: string;
  aktif: boolean;
  created_at: Date;
  updated_at: Date;
}

// =====================================
// Pengurusan Aset (Asset Management) Types
// Based on JAIS Guidelines BR-AMS 001-011
// =====================================

export type JenisAset = 'Harta Modal' | 'Inventori';
export type StatusAset = 'Sedang Digunakan' | 'Tidak Digunakan' | 'Rosak' | 'Sedang Diselenggara' | 'Hilang' | 'Dilupuskan';
export type KeadaanAset = 'Baik' | 'Rosak Ringan' | 'Rosak Teruk' | 'Hilang' | 'Tidak Dijumpai';
export type KaedahPelupusan = 'Jualan' | 'Tukar Barang' | 'Sumbangan/Hadiah' | 'Serahan' | 'Musnah/Buang/Bakar';
export type JenisPenyelenggaraan = 'Pembaikan' | 'Servis Berkala' | 'Penggantian Komponen' | 'Naik Taraf' | 'Lain-lain';
export type JenisPergerakan = 'Pindahan' | 'Pinjaman';

// Enhanced Inventory interface (BR-AMS 002)
export interface InventoryEnhanced extends Inventory {
  kategori?: string;
  sub_kategori?: string;
  jenama?: string;
  model?: string;
  no_siri_pembuat?: string;
  tarikh_terima?: string;
  harga_asal?: number;
  lokasi_id?: number;
  status?: StatusAset;
  catatan?: string;
  gambar?: string;
  tarikh_lupus?: string;
  kaedah_lupus?: string;
  lokasi_nama?: string;
}

// Enhanced HartaModal interface (BR-AMS 001)
export interface HartaModalEnhanced extends HartaModal {
  kategori?: string;
  sub_kategori?: string;
  jenama?: string;
  model?: string;
  no_siri_pembuat?: string;
  tarikh_terima?: string;
  harga_asal?: number;
  lokasi_id?: number;
  status?: StatusAset;
  catatan?: string;
  gambar?: string;
  tarikh_lupus?: string;
  kaedah_lupus?: string;
  jangka_hayat_tahun?: number;
  nilai_semasa?: number;
  lokasi_nama?: string;
}

// Lokasi Aset (BR-AMS 003)
export interface LokasiAset {
  id: number;
  kod_lokasi: string;
  nama_lokasi: string;
  keterangan?: string;
  pegawai_bertanggungjawab?: string;
  no_tel_pegawai?: string;
  aktif: boolean;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

// Kategori Aset
export interface KategoriAset {
  id: number;
  kod_kategori: string;
  nama_kategori: string;
  jenis_aset: 'Harta Modal' | 'Inventori' | 'Kedua-dua';
  keterangan?: string;
  aktif: boolean;
  created_at: Date;
  updated_at: Date;
}

// Pergerakan/Pinjaman Aset (BR-AMS 004)
export interface PergerakanAset {
  id: number;
  no_rujukan: string;
  jenis_pergerakan: JenisPergerakan;
  jenis_aset: JenisAset;
  aset_id: number;
  no_siri_pendaftaran: string;
  keterangan_aset: string;
  lokasi_asal_id?: number;
  lokasi_tujuan_id?: number;
  lokasi_asal_text?: string;
  lokasi_tujuan_text?: string;
  nama_peminjam?: string;
  no_tel_peminjam?: string;
  tujuan_pinjaman?: string;
  tarikh_permohonan: string;
  tarikh_mula: string;
  tarikh_dijangka_pulang?: string;
  tarikh_sebenar_pulang?: string;
  status: 'Permohonan' | 'Diluluskan' | 'Ditolak' | 'Dalam Pergerakan' | 'Dipulangkan' | 'Tidak Dipulangkan';
  keadaan_semasa_keluar?: KeadaanAset;
  keadaan_semasa_pulang?: KeadaanAset;
  catatan?: string;
  dimohon_oleh: number;
  diluluskan_oleh?: number;
  tarikh_kelulusan?: string;
  diterima_oleh?: string;
  tarikh_terima?: string;
  created_at: Date;
  updated_at: Date;
  nama_pemohon?: string;
  nama_pelulus?: string;
  lokasi_asal_nama?: string;
  lokasi_tujuan_nama?: string;
}

// Pemeriksaan Aset (BR-AMS 005)
export interface PemeriksaanAset {
  id: number;
  tarikh_pemeriksaan: string;
  jenis_aset: JenisAset;
  aset_id: number;
  no_siri_pendaftaran: string;
  keadaan: KeadaanAset;
  catatan?: string;
  tindakan_diperlukan?: string;
  diperiksa_oleh: number;
  disahkan_oleh?: number;
  tarikh_pengesahan?: string;
  status_tindakan: 'Belum Diambil' | 'Sedang Dijalankan' | 'Selesai';
  created_at: Date;
  updated_at: Date;
  nama_pemeriksa?: string;
  nama_pengesah?: string;
  keterangan_aset?: string;
}

// Penyelenggaraan Aset (BR-AMS 006)
export interface PenyelenggaraanAset {
  id: number;
  jenis_aset: JenisAset;
  aset_id: number;
  no_siri_pendaftaran: string;
  tarikh_penyelenggaraan: string;
  jenis_penyelenggaraan: JenisPenyelenggaraan;
  keterangan_kerja: string;
  nama_kontraktor?: string;
  no_tel_kontraktor?: string;
  kos: number;
  no_resit?: string;
  tarikh_siap?: string;
  status: 'Dirancang' | 'Dalam Proses' | 'Selesai' | 'Dibatalkan';
  catatan?: string;
  dilaksana_oleh?: number;
  disahkan_oleh?: number;
  created_at: Date;
  updated_at: Date;
  nama_pelaksana?: string;
  nama_pengesah?: string;
  keterangan_aset?: string;
}

// Pelupusan Aset (BR-AMS 007 & 008)
export interface PelupusanAset {
  id: number;
  no_rujukan: string;
  jenis_aset: JenisAset;
  aset_id: number;
  no_siri_pendaftaran: string;
  keterangan_aset: string;
  harga_asal: number;
  nilai_semasa: number;
  tarikh_permohonan: string;
  sebab_pelupusan: string;
  kaedah_pelupusan: KaedahPelupusan;
  harga_jualan?: number;
  nama_pembeli?: string;
  nama_penerima?: string;
  alamat_penerima?: string;
  status: 'Permohonan' | 'Dalam Semakan' | 'Diluluskan' | 'Ditolak' | 'Selesai';
  tarikh_kelulusan?: string;
  diluluskan_oleh?: number;
  tarikh_pelupusan?: string;
  catatan?: string;
  dokumen_sokongan?: string;
  dimohon_oleh: number;
  created_at: Date;
  updated_at: Date;
  nama_pemohon?: string;
  nama_pelulus?: string;
}

// Kehilangan/Hapus Kira Aset (BR-AMS 009)
export interface KehilanganAset {
  id: number;
  no_rujukan: string;
  jenis_aset: JenisAset;
  aset_id: number;
  no_siri_pendaftaran: string;
  keterangan_aset: string;
  harga_asal: number;
  nilai_semasa: number;
  tarikh_kehilangan: string;
  lokasi_terakhir?: string;
  sebab_kehilangan: string;
  tindakan_diambil?: string;
  no_laporan_polis?: string;
  tarikh_laporan_polis?: string;
  balai_polis?: string;
  status: 'Dilaporkan' | 'Dalam Siasatan' | 'Dijumpai' | 'Hapus Kira Dalam Proses' | 'Hapus Kira Diluluskan' | 'Hapus Kira Ditolak';
  tarikh_mohon_hapus_kira?: string;
  tarikh_lulus_hapus_kira?: string;
  diluluskan_oleh?: number;
  catatan?: string;
  dilaporkan_oleh: number;
  created_at: Date;
  updated_at: Date;
  nama_pelapor?: string;
  nama_pelulus?: string;
}

// Combined Asset View
export interface SenaraiAset {
  jenis_aset: JenisAset;
  id: number;
  no_siri_pendaftaran: string;
  keterangan: string;
  kategori?: string;
  sub_kategori?: string;
  jenama?: string;
  model?: string;
  no_siri_pembuat?: string;
  tarikh_terima?: string;
  harga_asal?: number;
  cara_diperolehi: string;
  status?: StatusAset;
  nama_lokasi?: string;
  catatan?: string;
  created_at: Date;
}

// =====================================
// Khairat Kematian Types
// =====================================

export type JenisYuran = 'keahlian' | 'tahunan' | 'isteri_kedua';
export type StatusPermohonan = 'pending' | 'approved' | 'rejected';
export type Pertalian = 'isteri' | 'pasangan' | 'anak' | 'anak_oku';

export interface KhairatAhli {
  id: number;
  nama: string;
  no_kp: string;
  umur?: number;
  alamat?: string;
  no_telefon_rumah?: string;
  no_hp: string;
  email?: string;
  jenis_yuran: JenisYuran;
  no_resit?: string;
  resit_file?: string;
  amaun_bayaran: number;
  status: StatusPermohonan;
  tarikh_daftar?: string;
  tarikh_lulus?: string;
  approved_by?: number;
  reject_reason?: string;
  created_at: Date;
  updated_at: Date;
  approver_name?: string;
  tanggungan?: KhairatTanggungan[];
}

export interface KhairatTanggungan {
  id: number;
  khairat_ahli_id: number;
  nama_penuh: string;
  no_kp?: string;
  umur?: number;
  pertalian: Pertalian;
  created_at: Date;
  updated_at: Date;
}

export type JenisBayaran = 'tahunan' | 'tunggakan';
export type StatusBayaran = 'pending' | 'approved' | 'rejected';

export interface KhairatBayaran {
  id: number;
  khairat_ahli_id: number;
  tahun: string;
  jenis_bayaran: JenisBayaran;
  amaun: number;
  no_resit?: string;
  resit_file?: string;
  status: StatusBayaran;
  tarikh_bayar?: string;
  tarikh_lulus?: string;
  approved_by?: number;
  reject_reason?: string;
  created_at: Date;
  updated_at: Date;
  // Joined fields
  nama_ahli?: string;
  no_kp_ahli?: string;
  no_hp_ahli?: string;
  approver_name?: string;
}
