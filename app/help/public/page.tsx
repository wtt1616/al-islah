'use client';

import { useState } from 'react';
import Link from 'next/link';

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

export default function PublicHelpPage() {
  const [activeSection, setActiveSection] = useState<string>('pengenalan');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // FAQ data for public users
  const faqItems: FAQItem[] = [
    {
      question: 'Bagaimana untuk membuat permohonan penggunaan surau?',
      answer: 'Layari halaman "Permohonan Majlis", isi borang dengan lengkap termasuk nama, no. telefon, jenis majlis, tarikh dan masa yang dikehendaki. Selepas hantar, anda akan menerima nombor rujukan untuk semakan status.'
    },
    {
      question: 'Bagaimana untuk menyemak status permohonan?',
      answer: 'Layari halaman "Semak Status", masukkan nombor rujukan permohonan anda. Status sama ada "Dalam Proses", "Diluluskan" atau "Ditolak" akan dipaparkan.'
    },
    {
      question: 'Berapa lama untuk mendapat kelulusan permohonan?',
      answer: 'Kebiasaannya permohonan akan diproses dalam masa 3-5 hari bekerja. Anda akan dihubungi melalui nombor telefon yang didaftarkan.'
    },
    {
      question: 'Apakah jenis majlis yang boleh diadakan di surau?',
      answer: 'Majlis yang boleh diadakan termasuk: Majlis Akad Nikah, Majlis Kesyukuran, Majlis Tahlil/Doa Selamat, Kelas Agama/Bengkel, dan majlis-majlis keagamaan lain yang bersesuaian.'
    },
    {
      question: 'Bagaimana untuk mendaftar sebagai ahli khairat?',
      answer: 'Layari halaman "Khairat Kematian" dan klik butang "Daftar Ahli Baru". Isi maklumat yang diperlukan seperti nama, no. kad pengenalan, alamat dan no. telefon.'
    },
    {
      question: 'Bagaimana untuk menghantar maklum balas atau aduan?',
      answer: 'Layari halaman "Maklum Balas", pilih jenis maklum balas (cadangan, aduan, pertanyaan), dan tuliskan mesej anda. Pihak surau akan menghubungi anda jika perlu.'
    },
    {
      question: 'Bolehkah saya melihat jadual aktiviti surau?',
      answer: 'Ya, anda boleh melihat kalendar aktiviti surau di halaman "Kalendar Aktiviti". Ia memaparkan semua aktiviti dan program yang dijadualkan.'
    },
    {
      question: 'Bagaimana untuk bertanya soalan agama?',
      answer: 'Layari halaman "Soalan Agama" dan hantar soalan anda. Pihak surau akan menjawab soalan anda melalui e-mel atau telefon yang diberikan.'
    },
    {
      question: 'Adakah perkhidmatan ini dikenakan bayaran?',
      answer: 'Penggunaan sistem ini adalah percuma. Walau bagaimanapun, sesetengah perkhidmatan seperti penggunaan ruang surau mungkin dikenakan sumbangan mengikut kadar yang ditetapkan.'
    },
    {
      question: 'Siapa yang boleh saya hubungi untuk pertanyaan lanjut?',
      answer: 'Anda boleh menghubungi pihak surau melalui borang maklum balas atau datang terus ke surau pada waktu pejabat.'
    },
    {
      question: 'Adakah maklumat peribadi saya selamat?',
      answer: 'Ya, sistem kami menggunakan enkripsi AES-256-GCM untuk melindungi data sensitif seperti No. Kad Pengenalan. Data juga dipaparkan dalam format bertopeng untuk privasi.'
    },
    {
      question: 'Bagaimana untuk memohon bantuan kewangan?',
      answer: 'Layari halaman Sumbang & Derma, pilih tab "Mohon Bantuan", isi borang permohonan dengan lengkap, dan tunggu maklum balas dari pihak surau.'
    }
  ];

  // Help sections for public users
  const helpSections: HelpSection[] = [
    {
      id: 'pengenalan',
      title: 'Pengenalan',
      icon: 'bi-info-circle',
      description: 'Maklumat asas tentang sistem',
      content: (
        <div>
          <h4>Selamat Datang ke Sistem iSAR</h4>
          <p>
            Sistem iSAR (Islamic Surau Administration & Roster) menyediakan pelbagai perkhidmatan
            untuk orang awam bagi memudahkan urusan dengan pihak surau.
          </p>

          <h5 className="mt-4">Perkhidmatan Yang Disediakan:</h5>
          <div className="row g-3 mt-2">
            <div className="col-md-6">
              <div className="card h-100 border-primary">
                <div className="card-body">
                  <h6><i className="bi bi-calendar-event me-2 text-primary"></i>Permohonan Majlis</h6>
                  <p className="small text-muted mb-0">Mohon penggunaan ruang surau untuk majlis keagamaan</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-success">
                <div className="card-body">
                  <h6><i className="bi bi-search me-2 text-success"></i>Semak Status</h6>
                  <p className="small text-muted mb-0">Semak status permohonan menggunakan nombor rujukan</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-warning">
                <div className="card-body">
                  <h6><i className="bi bi-heart me-2 text-warning"></i>Khairat Kematian</h6>
                  <p className="small text-muted mb-0">Daftar sebagai ahli khairat kematian surau</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-info">
                <div className="card-body">
                  <h6><i className="bi bi-chat-left-text me-2 text-info"></i>Maklum Balas</h6>
                  <p className="small text-muted mb-0">Hantar cadangan, aduan atau pertanyaan</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-secondary">
                <div className="card-body">
                  <h6><i className="bi bi-calendar3 me-2 text-secondary"></i>Kalendar Aktiviti</h6>
                  <p className="small text-muted mb-0">Lihat jadual aktiviti dan program surau</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100 border-danger">
                <div className="card-body">
                  <h6><i className="bi bi-question-circle me-2 text-danger"></i>Soalan Agama</h6>
                  <p className="small text-muted mb-0">Hantar soalan berkaitan agama</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card h-100" style={{ borderColor: '#059669' }}>
                <div className="card-body">
                  <h6><i className="bi bi-gift me-2" style={{ color: '#059669' }}></i>Sumbang & Derma</h6>
                  <p className="small text-muted mb-0">Mohon bantuan atau buat sumbangan</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'permohonan',
      title: 'Permohonan Majlis',
      icon: 'bi-calendar-event',
      description: 'Cara mohon penggunaan surau',
      content: (
        <div>
          <h4>Permohonan Penggunaan Surau</h4>
          <p>Anda boleh memohon untuk menggunakan ruang surau bagi mengadakan majlis keagamaan.</p>

          <h5 className="mt-4"><i className="bi bi-list-ol me-2"></i>Langkah-langkah Permohonan:</h5>
          <ol className="mt-3">
            <li className="mb-2">Klik pautan <strong>"Permohonan Majlis"</strong> di bawah</li>
            <li className="mb-2">Isi maklumat pemohon:
              <ul>
                <li>Nama penuh</li>
                <li>No. telefon</li>
                <li>Alamat e-mel (jika ada)</li>
              </ul>
            </li>
            <li className="mb-2">Pilih jenis majlis yang hendak diadakan</li>
            <li className="mb-2">Pilih tarikh dan masa yang dikehendaki</li>
            <li className="mb-2">Masukkan anggaran bilangan tetamu</li>
            <li className="mb-2">Nyatakan keperluan khas (jika ada)</li>
            <li className="mb-2">Klik <strong>"Hantar Permohonan"</strong></li>
            <li className="mb-2"><strong>Simpan nombor rujukan</strong> yang diberikan</li>
          </ol>

          <div className="alert alert-info mt-4">
            <i className="bi bi-lightbulb me-2"></i>
            <strong>Tip:</strong> Mohon sekurang-kurangnya 2 minggu sebelum tarikh majlis untuk memastikan ketersediaan.
          </div>

          <h5 className="mt-4"><i className="bi bi-card-checklist me-2"></i>Jenis Majlis:</h5>
          <ul>
            <li>Majlis Akad Nikah</li>
            <li>Majlis Kesyukuran</li>
            <li>Majlis Tahlil / Doa Selamat</li>
            <li>Kelas Agama / Bengkel</li>
            <li>Majlis Keagamaan Lain</li>
          </ul>

          <div className="mt-4">
            <Link href="/permohonan-majlis" className="btn btn-primary">
              <i className="bi bi-pencil-square me-2"></i>
              Buat Permohonan Sekarang
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'semak-status',
      title: 'Semak Status',
      icon: 'bi-search',
      description: 'Cara semak status permohonan',
      content: (
        <div>
          <h4>Semak Status Permohonan</h4>
          <p>Selepas membuat permohonan, anda boleh menyemak status pada bila-bila masa.</p>

          <h5 className="mt-4"><i className="bi bi-list-ol me-2"></i>Langkah-langkah:</h5>
          <ol className="mt-3">
            <li className="mb-2">Klik pautan <strong>"Semak Status"</strong> di bawah</li>
            <li className="mb-2">Masukkan <strong>nombor rujukan</strong> permohonan anda</li>
            <li className="mb-2">Klik <strong>"Semak"</strong></li>
            <li className="mb-2">Status permohonan akan dipaparkan</li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-flag me-2"></i>Status Permohonan:</h5>
          <table className="table table-bordered mt-3">
            <thead className="table-light">
              <tr>
                <th>Status</th>
                <th>Maksud</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge bg-warning text-dark">Dalam Proses</span></td>
                <td>Permohonan sedang disemak oleh pihak surau</td>
              </tr>
              <tr>
                <td><span className="badge bg-success">Diluluskan</span></td>
                <td>Permohonan telah diluluskan. Sila tunggu untuk dihubungi.</td>
              </tr>
              <tr>
                <td><span className="badge bg-danger">Ditolak</span></td>
                <td>Permohonan tidak dapat diluluskan. Sebab akan dinyatakan.</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4">
            <Link href="/semak-status" className="btn btn-success">
              <i className="bi bi-search me-2"></i>
              Semak Status Sekarang
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'khairat',
      title: 'Khairat Kematian',
      icon: 'bi-heart',
      description: 'Pendaftaran ahli khairat',
      content: (
        <div>
          <h4>Khairat Kematian</h4>
          <p>Daftar sebagai ahli khairat kematian surau untuk mendapat manfaat bantuan kewangan ketika kematian.</p>

          <h5 className="mt-4"><i className="bi bi-gift me-2"></i>Manfaat Ahli:</h5>
          <ul>
            <li>Bantuan kewangan untuk urusan pengebumian</li>
            <li>Sokongan dari komuniti surau</li>
            <li>Keahlian untuk seluruh keluarga (termasuk tanggungan)</li>
          </ul>

          <h5 className="mt-4"><i className="bi bi-list-ol me-2"></i>Cara Mendaftar:</h5>
          <ol className="mt-3">
            <li className="mb-2">Klik pautan <strong>"Daftar Khairat"</strong> di bawah</li>
            <li className="mb-2">Isi maklumat peribadi:
              <ul>
                <li>Nama penuh</li>
                <li>No. Kad Pengenalan</li>
                <li>Alamat</li>
                <li>No. Telefon</li>
                <li>Maklumat tanggungan (isteri/anak)</li>
              </ul>
            </li>
            <li className="mb-2">Muat naik resit bayaran yuran</li>
            <li className="mb-2">Klik <strong>"Hantar Permohonan"</strong></li>
            <li className="mb-2">Tunggu kelulusan dari pihak surau</li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-search me-2"></i>Semak Status Keahlian:</h5>
          <ol className="mt-3">
            <li className="mb-2">Layari halaman <strong>Khairat</strong></li>
            <li className="mb-2">Masukkan No. Kad Pengenalan anda</li>
            <li className="mb-2">Klik <strong>"Semak"</strong></li>
            <li className="mb-2">Status keahlian dan maklumat akan dipaparkan</li>
          </ol>

          <div className="alert alert-info mt-3">
            <i className="bi bi-shield-lock me-2"></i>
            <strong>Privasi Terjamin:</strong> No. Kad Pengenalan anda akan dipaparkan dalam format bertopeng (800101-**-**55) untuk melindungi privasi.
          </div>

          <div className="mt-4">
            <Link href="/khairat" className="btn btn-warning me-2">
              <i className="bi bi-heart me-2"></i>
              Daftar Khairat
            </Link>
            <Link href="/khairat" className="btn btn-outline-primary">
              <i className="bi bi-search me-2"></i>
              Semak Status
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'maklumbalas',
      title: 'Maklum Balas',
      icon: 'bi-chat-left-text',
      description: 'Hantar cadangan atau aduan',
      content: (
        <div>
          <h4>Maklum Balas</h4>
          <p>Kami mengalu-alukan sebarang maklum balas, cadangan, atau aduan untuk penambahbaikan perkhidmatan.</p>

          <h5 className="mt-4"><i className="bi bi-tags me-2"></i>Jenis Maklum Balas:</h5>
          <div className="row g-3 mt-2">
            <div className="col-md-4">
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className="bi bi-lightbulb fs-1 text-warning"></i>
                  <h6 className="mt-2">Cadangan</h6>
                  <p className="small text-muted">Idea untuk penambahbaikan</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className="bi bi-exclamation-triangle fs-1 text-danger"></i>
                  <h6 className="mt-2">Aduan</h6>
                  <p className="small text-muted">Laporan masalah atau ketidakpuasan</p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className="bi bi-question-circle fs-1 text-info"></i>
                  <h6 className="mt-2">Pertanyaan</h6>
                  <p className="small text-muted">Soalan umum berkaitan surau</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Link href="/maklumbalas" className="btn btn-info text-white">
              <i className="bi bi-chat-left-text me-2"></i>
              Hantar Maklum Balas
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'kalendar',
      title: 'Kalendar Aktiviti',
      icon: 'bi-calendar3',
      description: 'Lihat aktiviti surau',
      content: (
        <div>
          <h4>Kalendar Aktiviti</h4>
          <p>Lihat jadual aktiviti dan program yang dianjurkan oleh surau.</p>

          <h5 className="mt-4"><i className="bi bi-calendar-check me-2"></i>Jenis Aktiviti:</h5>
          <ul>
            <li>Kuliah dan ceramah agama</li>
            <li>Kelas mengaji Al-Quran</li>
            <li>Program gotong-royong</li>
            <li>Majlis iftar (bulan Ramadan)</li>
            <li>Program hari kebesaran Islam</li>
            <li>Aktiviti kemasyarakatan</li>
          </ul>

          <div className="alert alert-success mt-4">
            <i className="bi bi-bell me-2"></i>
            <strong>Jangan lepaskan!</strong> Ikuti kalendar aktiviti untuk mengetahui program-program menarik yang akan datang.
          </div>

          <div className="mt-4">
            <Link href="/kalendar-aktiviti" className="btn btn-secondary">
              <i className="bi bi-calendar3 me-2"></i>
              Lihat Kalendar Aktiviti
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'sumbang',
      title: 'Sumbang & Derma',
      icon: 'bi-gift',
      description: 'Permohonan bantuan & sumbangan',
      content: (
        <div>
          <h4>Sumbang & Derma</h4>
          <p>Platform untuk orang awam memohon bantuan atau menyumbang kepada surau.</p>

          <h5 className="mt-4"><i className="bi bi-hand-thumbs-up me-2"></i>Mohon Bantuan:</h5>
          <p>Jika anda memerlukan bantuan kewangan, anda boleh menghantar permohonan:</p>
          <ol className="mt-3">
            <li className="mb-2">Layari halaman <strong>Sumbang & Derma</strong></li>
            <li className="mb-2">Pilih tab <strong>"Mohon Bantuan"</strong></li>
            <li className="mb-2">Isi maklumat permohonan:
              <ul>
                <li>Nama penuh dan No. KP</li>
                <li>Alamat dan No. Telefon</li>
                <li>Jenis bantuan yang diperlukan</li>
                <li>Keterangan keperluan</li>
              </ul>
            </li>
            <li className="mb-2">Lampirkan dokumen sokongan (jika ada)</li>
            <li className="mb-2">Klik <strong>"Hantar Permohonan"</strong></li>
          </ol>

          <h5 className="mt-4"><i className="bi bi-heart me-2"></i>Buat Sumbangan:</h5>
          <p>Untuk menyumbang kepada tabung surau:</p>
          <ol className="mt-3">
            <li className="mb-2">Layari halaman <strong>Sumbang & Derma</strong></li>
            <li className="mb-2">Pilih tab <strong>"Sumbangan"</strong></li>
            <li className="mb-2">Lihat maklumat akaun bank surau</li>
            <li className="mb-2">Imbas kod QR untuk pembayaran mudah</li>
          </ol>

          <div className="alert alert-success mt-3">
            <i className="bi bi-check-circle me-2"></i>
            <strong>Terima Kasih:</strong> Setiap sumbangan anda amat dihargai dan akan digunakan untuk kepentingan surau dan masyarakat.
          </div>

          <div className="mt-4">
            <Link href="/sumbang-derma" className="btn btn-success">
              <i className="bi bi-gift me-2"></i>
              Sumbang & Derma
            </Link>
          </div>
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

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      {/* Header */}
      <nav className="navbar navbar-dark" style={{
        background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
        borderBottom: '3px solid #f59e0b'
      }}>
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center" href="/">
            <i className="bi bi-mosque me-2" style={{ fontSize: '1.75rem' }}></i>
            <span>iSAR</span>
          </Link>
          <div className="d-flex align-items-center">
            <Link href="/login" className="btn btn-outline-light btn-sm">
              <i className="bi bi-box-arrow-in-right me-1"></i>
              Log Masuk
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mt-4">
        <div className="row mb-4">
          <div className="col">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                <li className="breadcrumb-item"><Link href="/">Utama</Link></li>
                <li className="breadcrumb-item active">Bantuan</li>
              </ol>
            </nav>
            <h2 className="mb-1">
              <i className="bi bi-question-circle me-2"></i>
              Bantuan & Panduan
            </h2>
            <p className="text-muted">Panduan penggunaan perkhidmatan surau untuk orang awam</p>
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
                <Link href="/permohonan-majlis" className="list-group-item list-group-item-action">
                  <i className="bi bi-calendar-event me-2 text-primary"></i>Permohonan Majlis
                </Link>
                <Link href="/semak-status" className="list-group-item list-group-item-action">
                  <i className="bi bi-search me-2 text-success"></i>Semak Status
                </Link>
                <Link href="/khairat" className="list-group-item list-group-item-action">
                  <i className="bi bi-heart me-2 text-warning"></i>Khairat Kematian
                </Link>
                <Link href="/maklumbalas" className="list-group-item list-group-item-action">
                  <i className="bi bi-chat-left-text me-2 text-info"></i>Maklum Balas
                </Link>
                <Link href="/kalendar-aktiviti" className="list-group-item list-group-item-action">
                  <i className="bi bi-calendar3 me-2 text-secondary"></i>Kalendar Aktiviti
                </Link>
                <Link href="/sumbang-derma" className="list-group-item list-group-item-action">
                  <i className="bi bi-gift me-2 text-success"></i>Sumbang & Derma
                </Link>
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
                      Jika anda mempunyai soalan lain, sila hubungi pihak surau atau
                      hantar maklum balas melalui sistem.
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end mt-3 mt-md-0">
                    <Link href="/maklumbalas" className="btn btn-primary">
                      <i className="bi bi-envelope me-1"></i>
                      Hubungi Kami
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-5 py-4 bg-dark text-white">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h6><i className="bi bi-mosque me-2"></i>Sistem iSAR</h6>
              <p className="small text-muted mb-0">
                Sistem Pengurusan Surau Bersepadu
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <Link href="/login" className="text-white text-decoration-none me-3">
                <i className="bi bi-box-arrow-in-right me-1"></i>Log Masuk Pengguna
              </Link>
            </div>
          </div>
          <hr className="my-3 border-secondary" />
          <div className="text-center text-muted small">
            <i className="bi bi-info-circle me-1"></i>
            Sistem iSAR v1.5 | Hak Cipta Terpelihara
          </div>
        </div>
      </footer>
    </div>
  );
}
