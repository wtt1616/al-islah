'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface FAQItem {
  question: string;
  answer: string;
}

interface HelpSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  content: React.ReactNode;
}

export default function HelpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<string>('pengenalan');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // FAQ data
  const faqItems: FAQItem[] = [
    {
      question: 'Bagaimana untuk log masuk ke sistem?',
      answer: 'Masukkan alamat e-mel dan kata laluan yang telah didaftarkan. Jika anda belum mempunyai akaun, sila hubungi Admin untuk mendaftar.'
    },
    {
      question: 'Saya lupa kata laluan. Apa yang perlu dilakukan?',
      answer: 'Hubungi Admin sistem untuk reset kata laluan anda. Admin akan menetapkan kata laluan sementara dan anda boleh menukarnya selepas log masuk.'
    },
    {
      question: 'Bagaimana untuk memohon cuti/ketidakhadiran?',
      answer: 'Pergi ke menu "Ketersediaan" > Klik "Tambah Ketidakhadiran" > Pilih tarikh mula dan akhir > Masukkan sebab > Klik "Simpan". Permohonan akan dihantar kepada Head Imam.'
    },
    {
      question: 'Mengapa saya tidak menerima notifikasi WhatsApp?',
      answer: 'Pastikan nombor telefon anda betul dalam sistem dan WhatsApp aktif. Notifikasi dihantar pada pukul 10 malam setiap hari untuk tugas esok hari.'
    },
    {
      question: 'Format fail penyata bank apa yang disokong?',
      answer: 'Sistem hanya menyokong fail CSV. Muat turun penyata bank dari portal bank anda dalam format CSV.'
    },
    {
      question: 'Bagaimana jika transaksi tersilap dikategorikan?',
      answer: 'Klik pada transaksi dalam senarai > Edit kategori yang betul > Klik "Simpan". Perubahan akan dikemaskini dalam laporan.'
    },
    {
      question: 'Apa itu "Bulan Perkiraan"?',
      answer: 'Bulan Perkiraan menentukan dalam bulan mana transaksi akan direkodkan dalam Buku Tunai. Pilihan: Bulan Semasa (default), Bulan Sebelum, atau Bulan Depan.'
    },
    {
      question: 'Adakah sistem ini boleh diakses melalui telefon?',
      answer: 'Ya, sistem iSAR boleh diakses melalui pelayar web telefon. Sistem juga boleh dipasang sebagai PWA (Progressive Web App) untuk akses lebih mudah.'
    },
    {
      question: 'Bagaimana untuk mencetak laporan?',
      answer: 'Buka laporan yang dikehendaki > Klik butang "Cetak" > Pilih tetapan cetakan (A4, Landscape disyorkan) > Klik "Print".'
    },
    {
      question: 'Siapa yang boleh menguruskan jadual?',
      answer: 'Hanya Admin dan Head Imam yang boleh menambah atau mengubah jadual tugas. Imam dan Bilal hanya boleh melihat jadual dan memohon cuti.'
    },
    {
      question: 'Bagaimana untuk menetapkan kebenaran akses pengguna?',
      answer: 'Admin boleh menetapkan kebenaran melalui menu Pentadbiran > Kebenaran. Pilih peranan dan tandakan kotak untuk setiap modul (Lihat/Cipta/Edit/Padam).'
    },
    {
      question: 'Adakah data peribadi saya selamat?',
      answer: 'Ya, sistem menggunakan enkripsi AES-256-GCM untuk menyimpan data sensitif seperti No. Kad Pengenalan. Data juga ditopengkan di halaman awam untuk privasi.'
    },
    {
      question: 'Bagaimana untuk mendaftar khairat kematian?',
      answer: 'Orang awam boleh mendaftar melalui halaman Khairat di laman utama. Isi borang pendaftaran, muat naik resit bayaran, dan tunggu kelulusan dari Admin.'
    },
    {
      question: 'Mengapa No. KP saya dipaparkan dalam format bertopeng?',
      answer: 'Untuk melindungi privasi, No. KP dipaparkan dalam format 800101-**-**55 di halaman awam. Admin boleh melihat nombor penuh untuk tujuan pengesahan.'
    }
  ];

  // Help sections
  const helpSections: HelpSection[] = [
    {
      id: 'pengenalan',
      title: 'Pengenalan',
      icon: 'bi-info-circle',
      description: 'Maklumat asas tentang sistem iSAR',
      content: (
        <div>
          <h4>Apa itu Sistem iSAR?</h4>
          <p>
            Sistem iSAR (Islamic Surau Administration & Roster) adalah sistem pengurusan bersepadu
            untuk surau dan masjid yang merangkumi penjadualan tugas, pengurusan kewangan,
            aset, dan pelbagai lagi.
          </p>

          <h5 className="mt-4">Modul Utama:</h5>
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <div className="card h-100 border-primary">
                <div className="card-body">
                  <h6><i className="bi bi-calendar-check me-2 text-primary"></i>Jadual Tugas</h6>
                  <p className="small text-muted mb-0">Penjadualan tugas Imam dan Bilal untuk solat harian</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-success">
                <div className="card-body">
                  <h6><i className="bi bi-mic me-2 text-success"></i>Jadual Kuliah</h6>
                  <p className="small text-muted mb-0">Penjadualan penceramah untuk kuliah dan tazkirah</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-warning">
                <div className="card-body">
                  <h6><i className="bi bi-cash-coin me-2 text-warning"></i>Kewangan</h6>
                  <p className="small text-muted mb-0">Pengurusan transaksi, Buku Tunai, dan laporan kewangan</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-info">
                <div className="card-body">
                  <h6><i className="bi bi-box-seam me-2 text-info"></i>Aset</h6>
                  <p className="small text-muted mb-0">Pengurusan harta modal dan inventori</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-danger">
                <div className="card-body">
                  <h6><i className="bi bi-heart me-2 text-danger"></i>Khairat</h6>
                  <p className="small text-muted mb-0">Pendaftaran dan pengurusan ahli khairat kematian</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-secondary">
                <div className="card-body">
                  <h6><i className="bi bi-gift me-2 text-secondary"></i>Sumbang & Derma</h6>
                  <p className="small text-muted mb-0">Permohonan bantuan dan sumbangan orang awam</p>
                </div>
              </div>
            </div>
          </div>

          <h5 className="mt-4">Peranan Pengguna:</h5>
          <table className="table table-bordered mt-2">
            <thead className="table-light">
              <tr>
                <th>Peranan</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge bg-danger">Admin</span></td>
                <td>Pentadbir sistem dengan akses penuh ke semua modul</td>
              </tr>
              <tr>
                <td><span className="badge bg-primary">Head Imam</span></td>
                <td>Imam Besar yang menguruskan jadual dan melihat laporan</td>
              </tr>
              <tr>
                <td><span className="badge bg-success">Imam</span></td>
                <td>Melihat jadual tugas dan memohon cuti</td>
              </tr>
              <tr>
                <td><span className="badge bg-info">Bilal</span></td>
                <td>Melihat jadual tugas dan memohon cuti</td>
              </tr>
              <tr>
                <td><span className="badge bg-warning text-dark">Bendahari</span></td>
                <td>Pengurusan kewangan penuh</td>
              </tr>
              <tr>
                <td><span className="badge bg-secondary">Pegawai Aset</span></td>
                <td>Pengurusan aset dan inventori</td>
              </tr>
            </tbody>
          </table>

          <div className="alert alert-info mt-3">
            <i className="bi bi-shield-check me-2"></i>
            <strong>Sistem Kebenaran Dinamik:</strong> Admin boleh menetapkan akses modul untuk setiap peranan melalui menu Pentadbiran &gt; Kebenaran.
          </div>
        </div>
      )
    },
    {
      id: 'jadual',
      title: 'Jadual Tugas',
      icon: 'bi-calendar-check',
      description: 'Panduan jadual Imam & Bilal',
      content: (
        <div>
          <h4>Jadual Tugas Imam & Bilal</h4>

          <h5 className="mt-4"><i className="bi bi-eye me-2"></i>Melihat Jadual</h5>
          <ol>
            <li>Klik menu <strong>"Jadual"</strong> di navigasi atas</li>
            <li>Pilih <strong>"Urus Jadual"</strong></li>
            <li>Gunakan anak panah untuk navigasi minggu</li>
          </ol>

          <div className="alert alert-info">
            <i className="bi bi-lightbulb me-2"></i>
            <strong>Tip:</strong> Setiap Imam dan Bilal mempunyai warna unik untuk memudahkan pengenalan dalam jadual.
          </div>

          <h5 className="mt-4"><i className="bi bi-calendar-x me-2"></i>Memohon Cuti</h5>
          <ol>
            <li>Klik menu <strong>"Ketersediaan"</strong></li>
            <li>Klik butang <strong>"Tambah Ketidakhadiran"</strong></li>
            <li>Pilih tarikh mula dan tarikh akhir</li>
            <li>Masukkan sebab ketidakhadiran</li>
            <li>Klik <strong>"Simpan"</strong></li>
          </ol>

          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Penting:</strong> Mohon cuti sekurang-kurangnya 3 hari sebelum tarikh untuk membolehkan penggantian diatur.
          </div>

          <h5 className="mt-4"><i className="bi bi-whatsapp me-2"></i>Notifikasi WhatsApp</h5>
          <p>Sistem akan menghantar peringatan WhatsApp:</p>
          <ul>
            <li><strong>Masa:</strong> 10:00 malam setiap hari</li>
            <li><strong>Kandungan:</strong> Peringatan tugas untuk esok hari</li>
            <li><strong>Syarat:</strong> Nombor telefon mesti didaftarkan dalam sistem</li>
          </ul>
        </div>
      )
    },
    {
      id: 'kuliah',
      title: 'Jadual Kuliah',
      icon: 'bi-mic',
      description: 'Panduan jadual penceramah',
      content: (
        <div>
          <h4>Jadual Kuliah (Penceramah)</h4>

          <h5 className="mt-4">Slot Kuliah</h5>
          <table className="table table-bordered">
            <thead className="table-light">
              <tr>
                <th>Slot</th>
                <th>Waktu</th>
                <th>Hari</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Kuliah Subuh</td>
                <td>Selepas solat Subuh</td>
                <td>Selasa, Rabu, Jumaat, Sabtu, Ahad</td>
              </tr>
              <tr>
                <td>Kuliah Dhuha</td>
                <td>Waktu Dhuha</td>
                <td>Sabtu, Ahad, Jumaat</td>
              </tr>
              <tr>
                <td>Kuliah Maghrib</td>
                <td>Selepas solat Maghrib</td>
                <td>Selasa, Rabu, Jumaat, Sabtu, Ahad</td>
              </tr>
              <tr>
                <td>Tazkirah Jumaat</td>
                <td>Sebelum khutbah</td>
                <td>Jumaat</td>
              </tr>
            </tbody>
          </table>

          <div className="alert alert-secondary">
            <i className="bi bi-info-circle me-2"></i>
            <strong>Nota:</strong> Isnin dan Khamis tiada kuliah dijadualkan.
          </div>

          <h5 className="mt-4"><i className="bi bi-person-plus me-2"></i>Menguruskan Penceramah (Admin/Head Imam)</h5>
          <ol>
            <li>Klik menu <strong>"Penceramah"</strong> &gt; <strong>"Urus Penceramah"</strong></li>
            <li>Klik <strong>"Tambah Penceramah"</strong></li>
            <li>Masukkan nama dan nombor telefon</li>
            <li>Pilih slot kuliah yang boleh diisi</li>
            <li>Klik <strong>"Simpan"</strong></li>
          </ol>
        </div>
      )
    },
    {
      id: 'kewangan',
      title: 'Kewangan',
      icon: 'bi-cash-coin',
      description: 'Panduan pengurusan kewangan',
      content: (
        <div>
          <h4>Pengurusan Kewangan</h4>
          <p className="text-muted">Modul ini khusus untuk Bendahari dan Admin</p>

          <h5 className="mt-4"><i className="bi bi-upload me-2"></i>Muat Naik Penyata Bank</h5>
          <ol>
            <li>Klik menu <strong>"Kewangan"</strong></li>
            <li>Klik butang <strong>"Muat Naik Penyata Bank"</strong></li>
            <li>Pilih fail CSV penyata bank</li>
            <li>Pilih Bulan dan Tahun</li>
            <li>Sistem akan cadangkan Baki Awal secara automatik</li>
            <li>Klik <strong>"Muat Naik"</strong></li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-tags me-2"></i>Kategorikan Transaksi</h5>
          <div className="row">
            <div className="col-md-6">
              <h6 className="text-success">Kategori Penerimaan:</h6>
              <ul className="small">
                <li>Sumbangan Am</li>
                <li>Sumbangan Khas</li>
                <li>Hasil Sewaan</li>
                <li>Pelaburan</li>
                <li>Elaun/Bantuan</li>
                <li>Deposit</li>
                <li>Lain-lain Penerimaan</li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6 className="text-danger">Kategori Pembayaran:</h6>
              <ul className="small">
                <li>Pentadbiran</li>
                <li>Sumber Manusia</li>
                <li>Pembangunan</li>
                <li>Dakwah</li>
                <li>Khidmat Sosial</li>
                <li>Aset</li>
              </ul>
            </div>
          </div>

          <h5 className="mt-4"><i className="bi bi-magic me-2"></i>Auto-Kategorikan</h5>
          <p>Sistem boleh kategorikan transaksi secara automatik berdasarkan kata kunci:</p>
          <ol>
            <li>Buka senarai transaksi</li>
            <li>Klik butang <strong>"Jana Kategori"</strong></li>
            <li>Semak preview padanan</li>
            <li>Klik <strong>"Teruskan"</strong> untuk mengesahkan</li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-book me-2"></i>Buku Tunai</h5>
          <p>Laporan bulanan yang merekodkan semua penerimaan dan pembayaran:</p>
          <ol>
            <li>Klik menu <strong>"Kewangan"</strong> &gt; <strong>"Buku Tunai"</strong></li>
            <li>Pilih Bulan dan Tahun</li>
            <li>Laporan akan dijana secara automatik</li>
            <li>Klik <strong>"Cetak"</strong> untuk mencetak</li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-arrow-left-right me-2"></i>Penyesuaian Bank</h5>
          <p>Memadankan baki Buku Tunai dengan penyata bank:</p>
          <ol>
            <li>Klik menu <strong>"Kewangan"</strong> &gt; <strong>"Penyesuaian Bank"</strong></li>
            <li>Pilih Bulan dan Tahun</li>
            <li>Masukkan Baki Penyata Bank</li>
            <li>Masukkan pelarasan (caj bank, komisen, dll)</li>
            <li>Sistem akan mengira baki selepas pelarasan</li>
          </ol>
        </div>
      )
    },
    {
      id: 'aset',
      title: 'Aset',
      icon: 'bi-box-seam',
      description: 'Panduan pengurusan aset',
      content: (
        <div>
          <h4>Pengurusan Aset</h4>

          <h5 className="mt-4"><i className="bi bi-building me-2"></i>Harta Modal</h5>
          <p>Aset bernilai tinggi dan jangka panjang seperti peralatan elektronik, perabot, kenderaan.</p>
          <ol>
            <li>Klik menu <strong>"Aset"</strong> &gt; <strong>"Harta Modal"</strong></li>
            <li>Klik <strong>"Tambah Aset"</strong></li>
            <li>Masukkan maklumat aset</li>
            <li>Klik <strong>"Simpan"</strong></li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-boxes me-2"></i>Inventori</h5>
          <p>Barang habis guna seperti kertas, pen, dan bekalan pejabat.</p>
          <ol>
            <li>Klik menu <strong>"Aset"</strong> &gt; <strong>"Inventori"</strong></li>
            <li>Klik <strong>"Tambah Inventori"</strong></li>
            <li>Masukkan maklumat barang dan kuantiti</li>
            <li>Klik <strong>"Simpan"</strong></li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-tools me-2"></i>Penyelenggaraan</h5>
          <p>Rekod penyelenggaraan dan pembaikan aset.</p>

          <h5 className="mt-4"><i className="bi bi-clipboard-check me-2"></i>Pemeriksaan</h5>
          <p>Rekod pemeriksaan berkala untuk memastikan aset dalam keadaan baik.</p>

          <h5 className="mt-4"><i className="bi bi-trash me-2"></i>Pelupusan</h5>
          <p>Rekod aset yang dilupuskan kerana rosak atau tidak diperlukan.</p>
        </div>
      )
    },
    {
      id: 'khairat',
      title: 'Khairat',
      icon: 'bi-heart',
      description: 'Panduan khairat kematian',
      content: (
        <div>
          <h4>Khairat Kematian</h4>

          <h5 className="mt-4"><i className="bi bi-people me-2"></i>Senarai Ahli</h5>
          <ol>
            <li>Klik menu <strong>"Khairat"</strong></li>
            <li>Senarai ahli akan dipaparkan</li>
            <li>Gunakan kotak carian untuk mencari ahli</li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-person-plus me-2"></i>Pendaftaran Awam</h5>
          <p>Orang awam boleh mendaftar sendiri melalui laman web:</p>
          <ol>
            <li>Layari halaman <strong>Khairat</strong> di laman utama</li>
            <li>Klik <strong>"Daftar Sekarang"</strong></li>
            <li>Isi maklumat pemohon dan tanggungan</li>
            <li>Muat naik resit bayaran</li>
            <li>Tunggu kelulusan dari Admin</li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-search me-2"></i>Semak Status Keahlian</h5>
          <p>Orang awam boleh menyemak status pendaftaran:</p>
          <ol>
            <li>Layari halaman <strong>Khairat</strong></li>
            <li>Masukkan No. Kad Pengenalan</li>
            <li>Klik <strong>"Semak"</strong></li>
            <li>Status dan maklumat ahli akan dipaparkan</li>
          </ol>

          <div className="alert alert-success">
            <i className="bi bi-shield-lock me-2"></i>
            <strong>Privasi Dilindungi:</strong> No. KP dipaparkan dalam format bertopeng (800101-**-**55) untuk melindungi privasi ahli.
          </div>

          <h5 className="mt-4"><i className="bi bi-check-circle me-2"></i>Kelulusan Permohonan (Admin)</h5>
          <ol>
            <li>Klik menu <strong>"Khairat"</strong> di dashboard</li>
            <li>Lihat senarai permohonan <span className="badge bg-warning text-dark">Pending</span></li>
            <li>Klik pada permohonan untuk melihat butiran</li>
            <li>Semak maklumat dan resit bayaran</li>
            <li>Klik <strong>"Luluskan"</strong> atau <strong>"Tolak"</strong></li>
          </ol>

          <div className="alert alert-info">
            <i className="bi bi-lock me-2"></i>
            <strong>Keselamatan Data:</strong> Semua No. Kad Pengenalan disimpan dalam bentuk terenkripsi (AES-256-GCM) untuk keselamatan.
          </div>
        </div>
      )
    },
    {
      id: 'majlis',
      title: 'Permohonan Majlis',
      icon: 'bi-calendar-event',
      description: 'Panduan permohonan majlis',
      content: (
        <div>
          <h4>Permohonan Majlis</h4>

          <h5 className="mt-4"><i className="bi bi-pencil-square me-2"></i>Membuat Permohonan</h5>
          <p>Orang awam boleh membuat permohonan tanpa log masuk:</p>
          <ol>
            <li>Layari halaman <strong>Permohonan Majlis</strong></li>
            <li>Isi borang permohonan:
              <ul>
                <li>Nama pemohon</li>
                <li>No. telefon</li>
                <li>Jenis majlis</li>
                <li>Tarikh dan masa</li>
                <li>Bilangan tetamu</li>
              </ul>
            </li>
            <li>Klik <strong>"Hantar Permohonan"</strong></li>
            <li>Simpan nombor rujukan yang diberikan</li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-search me-2"></i>Semak Status</h5>
          <ol>
            <li>Layari halaman <strong>Semak Status</strong></li>
            <li>Masukkan nombor rujukan</li>
            <li>Status permohonan akan dipaparkan</li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-gear me-2"></i>Mengurus Permohonan (Admin/Head Imam)</h5>
          <ol>
            <li>Klik menu <strong>"Permohonan Majlis"</strong></li>
            <li>Lihat senarai permohonan</li>
            <li>Klik pada permohonan untuk melihat butiran</li>
            <li>Klik <strong>"Luluskan"</strong> atau <strong>"Tolak"</strong></li>
          </ol>
        </div>
      )
    },
    {
      id: 'profil',
      title: 'Profil',
      icon: 'bi-person-circle',
      description: 'Panduan tetapan profil',
      content: (
        <div>
          <h4>Profil & Tetapan</h4>

          <h5 className="mt-4"><i className="bi bi-person me-2"></i>Kemaskini Profil</h5>
          <ol>
            <li>Klik nama anda di bahagian atas kanan</li>
            <li>Pilih <strong>"Profil Saya"</strong></li>
            <li>Klik tab <strong>"Maklumat Profil"</strong></li>
            <li>Edit maklumat yang dikehendaki</li>
            <li>Klik <strong>"Kemaskini"</strong></li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-key me-2"></i>Tukar Kata Laluan</h5>
          <ol>
            <li>Buka halaman Profil</li>
            <li>Klik tab <strong>"Tukar Kata Laluan"</strong></li>
            <li>Masukkan kata laluan semasa</li>
            <li>Masukkan kata laluan baru (minimum 6 aksara)</li>
            <li>Masukkan pengesahan kata laluan baru</li>
            <li>Klik <strong>"Tukar Kata Laluan"</strong></li>
          </ol>

          <div className="alert alert-info">
            <i className="bi bi-shield-check me-2"></i>
            <strong>Tips Keselamatan:</strong>
            <ul className="mb-0 mt-2">
              <li>Gunakan kata laluan yang kuat dengan gabungan huruf dan nombor</li>
              <li>Jangan kongsi kata laluan dengan orang lain</li>
              <li>Tukar kata laluan secara berkala</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'pentadbiran',
      title: 'Pentadbiran',
      icon: 'bi-gear',
      description: 'Tetapan sistem (Admin sahaja)',
      content: (
        <div>
          <h4>Pentadbiran Sistem</h4>
          <p className="text-muted">Modul ini khusus untuk Admin sahaja</p>

          <h5 className="mt-4"><i className="bi bi-shield-check me-2"></i>Pengurusan Kebenaran (RBAC)</h5>
          <p>Admin boleh menetapkan akses modul untuk setiap peranan pengguna:</p>
          <ol>
            <li>Klik menu <strong>"Pentadbiran"</strong> &gt; <strong>"Kebenaran"</strong></li>
            <li>Pilih peranan dari dropdown (contoh: bendahari, head_imam)</li>
            <li>Tandakan kotak untuk setiap modul:
              <ul>
                <li><strong>Lihat</strong> - Boleh melihat modul</li>
                <li><strong>Cipta</strong> - Boleh menambah data baru</li>
                <li><strong>Edit</strong> - Boleh mengubah data sedia ada</li>
                <li><strong>Padam</strong> - Boleh memadamkan data</li>
              </ul>
            </li>
            <li>Klik <strong>"Simpan Perubahan"</strong></li>
          </ol>

          <div className="alert alert-warning">
            <i className="bi bi-exclamation-triangle me-2"></i>
            <strong>Perhatian:</strong> Perubahan kebenaran akan berkuat kuasa serta-merta selepas pengguna log masuk semula.
          </div>

          <h5 className="mt-4"><i className="bi bi-grid me-2"></i>Modul Yang Diurus</h5>
          <table className="table table-bordered mt-2">
            <thead className="table-light">
              <tr>
                <th>Modul</th>
                <th>Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Dashboard</td><td>Papan pemuka utama</td></tr>
              <tr><td>Penjadualan</td><td>Jadual Imam, Bilal, Penceramah</td></tr>
              <tr><td>Kewangan</td><td>Transaksi, Buku Tunai, Laporan</td></tr>
              <tr><td>Aset</td><td>Harta Modal, Inventori</td></tr>
              <tr><td>Laporan</td><td>Laporan kewangan</td></tr>
              <tr><td>Aktiviti</td><td>Program dan aktiviti</td></tr>
              <tr><td>Khairat</td><td>Keahlian khairat kematian</td></tr>
              <tr><td>Pentadbiran</td><td>Tetapan sistem</td></tr>
            </tbody>
          </table>

          <h5 className="mt-4"><i className="bi bi-people me-2"></i>Pengurusan Pengguna</h5>
          <ol>
            <li>Klik menu <strong>"Pentadbiran"</strong> &gt; <strong>"Pengguna"</strong></li>
            <li>Untuk tambah pengguna baru, klik <strong>"Tambah Pengguna"</strong></li>
            <li>Untuk edit, klik ikon pensil pada baris pengguna</li>
            <li>Untuk nyahaktif, klik ikon toggle</li>
          </ol>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'Soalan Lazim',
      icon: 'bi-question-circle',
      description: 'Soalan yang kerap ditanya',
      content: (
        <div>
          <h4>Soalan Lazim (FAQ)</h4>
          <div className="accordion mt-4" id="faqAccordion">
            {faqItems.map((faq, index) => (
              <div className="accordion-item" key={index}>
                <h2 className="accordion-header">
                  <button
                    className={`accordion-button ${expandedFAQ !== index ? 'collapsed' : ''}`}
                    type="button"
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  >
                    {faq.question}
                  </button>
                </h2>
                <div className={`accordion-collapse collapse ${expandedFAQ === index ? 'show' : ''}`}>
                  <div className="accordion-body">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  ];

  // Filter sections based on search
  const filteredSections = searchQuery
    ? helpSections.filter(
        section =>
          section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : helpSections;

  const activeContent = helpSections.find(s => s.id === activeSection);

  if (status === 'loading') {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />

      <div className="container-fluid mt-4">
        <div className="row mb-4">
          <div className="col">
            <h2 className="mb-1">
              <i className="bi bi-question-circle me-2"></i>
              Bantuan & Panduan
            </h2>
            <p className="text-muted">Panduan penggunaan sistem iSAR</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="row mb-4">
          <div className="col-md-6 mx-auto">
            <div className="input-group">
              <span className="input-group-text bg-white">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control"
                placeholder="Cari topik bantuan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="row">
          {/* Sidebar */}
          <div className="col-md-3 mb-4">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h6 className="mb-0">
                  <i className="bi bi-list me-2"></i>
                  Topik Bantuan
                </h6>
              </div>
              <div className="list-group list-group-flush">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    className={`list-group-item list-group-item-action d-flex align-items-center ${
                      activeSection === section.id ? 'active' : ''
                    }`}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSearchQuery('');
                    }}
                  >
                    <i className={`bi ${section.icon} me-2`}></i>
                    <div>
                      <div className="fw-semibold">{section.title}</div>
                      <small className={activeSection === section.id ? 'text-white-50' : 'text-muted'}>
                        {section.description}
                      </small>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="card mt-3">
              <div className="card-header bg-white">
                <h6 className="mb-0">
                  <i className="bi bi-lightning me-2"></i>
                  Pautan Pantas
                </h6>
              </div>
              <div className="list-group list-group-flush">
                <a href="/dashboard" className="list-group-item list-group-item-action">
                  <i className="bi bi-house me-2"></i>Dashboard
                </a>
                <a href="/schedules/manage" className="list-group-item list-group-item-action">
                  <i className="bi bi-calendar me-2"></i>Jadual Tugas
                </a>
                {session?.user.role && ['admin', 'bendahari'].includes(session.user.role) && (
                  <a href="/financial" className="list-group-item list-group-item-action">
                    <i className="bi bi-cash-coin me-2"></i>Kewangan
                  </a>
                )}
                <a href="/dashboard/profile" className="list-group-item list-group-item-action">
                  <i className="bi bi-person me-2"></i>Profil Saya
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-md-9">
            <div className="card">
              <div className="card-header bg-white d-flex align-items-center">
                <i className={`bi ${activeContent?.icon} me-2 text-primary fs-5`}></i>
                <h5 className="mb-0">{activeContent?.title}</h5>
              </div>
              <div className="card-body">
                {activeContent?.content}
              </div>
            </div>

            {/* Contact Support */}
            <div className="card mt-3 border-primary">
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 className="mb-1">
                      <i className="bi bi-headset me-2"></i>
                      Perlukan Bantuan Lanjut?
                    </h5>
                    <p className="text-muted mb-0">
                      Jika anda mempunyai soalan lain atau menghadapi masalah teknikal,
                      sila hubungi pentadbir sistem.
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <a
                      href="mailto:admin@example.com"
                      className="btn btn-outline-primary me-2"
                    >
                      <i className="bi bi-envelope me-1"></i>
                      E-mel
                    </a>
                    <a
                      href="https://wa.me/60123456789"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success"
                    >
                      <i className="bi bi-whatsapp me-1"></i>
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-5 py-3 bg-white border-top">
        <div className="container text-center text-muted">
          <small>
            <i className="bi bi-info-circle me-1"></i>
            Sistem iSAR v1.5 | Manual terakhir dikemaskini: 21 Disember 2025
          </small>
        </div>
      </footer>
    </div>
  );
}
