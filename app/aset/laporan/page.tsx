'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface ReportStats {
  total_harta_modal: number;
  total_inventori: number;
  nilai_harta_modal: number;
  nilai_inventori: number;
  total_lokasi: number;
}

const REPORTS = [
  {
    code: 'BR-AMS 001',
    title: 'Senarai Daftar Harta Modal',
    description: 'Senarai lengkap semua Harta Modal (aset bernilai ≥ RM2,000)',
    icon: 'bi-building',
    color: 'primary',
    type: 'harta_modal'
  },
  {
    code: 'BR-AMS 002',
    title: 'Senarai Daftar Inventori',
    description: 'Senarai lengkap semua Inventori (aset bernilai RM100 - RM1,999.99)',
    icon: 'bi-box',
    color: 'info',
    type: 'inventori'
  },
  {
    code: 'BR-AMS 003',
    title: 'Senarai Aset Alih Lokasi',
    description: 'Senarai aset mengikut lokasi penempatan',
    icon: 'bi-geo-alt',
    color: 'success',
    type: 'lokasi'
  },
  {
    code: 'BR-AMS 004',
    title: 'Permohonan Pergerakan/Pinjaman Aset Alih',
    description: 'Rekod permohonan pergerakan dan pinjaman aset',
    icon: 'bi-arrow-left-right',
    color: 'warning',
    type: 'pergerakan'
  },
  {
    code: 'BR-AMS 005',
    title: 'Borang Pemeriksaan Aset Alih',
    description: 'Rekod pemeriksaan berkala aset',
    icon: 'bi-clipboard-check',
    color: 'secondary',
    type: 'pemeriksaan'
  },
  {
    code: 'BR-AMS 006',
    title: 'Rekod Penyelenggaraan Aset Alih',
    description: 'Rekod kerja penyelenggaraan dan kos',
    icon: 'bi-tools',
    color: 'dark',
    type: 'penyelenggaraan'
  },
  {
    code: 'BR-AMS 007',
    title: 'Borang Pelupusan Aset Alih',
    description: 'Permohonan pelupusan aset',
    icon: 'bi-trash',
    color: 'danger',
    type: 'pelupusan'
  },
  {
    code: 'BR-AMS 008',
    title: 'Laporan Tindakan Pelupusan',
    description: 'Ringkasan pelupusan yang telah dilaksanakan',
    icon: 'bi-file-earmark-check',
    color: 'danger',
    type: 'pelupusan_selesai'
  },
  {
    code: 'BR-AMS 009',
    title: 'Laporan Kehilangan/Hapus Kira',
    description: 'Senarai aset hilang dan status hapus kira',
    icon: 'bi-search',
    color: 'dark',
    type: 'kehilangan'
  },
  {
    code: 'BR-AMS 010',
    title: 'Laporan Tahunan Pengurusan Aset Alih',
    description: 'Ringkasan pengurusan aset untuk tahun semasa',
    icon: 'bi-graph-up',
    color: 'success',
    type: 'tahunan'
  },
  {
    code: 'BR-AMS 011',
    title: 'Senarai Rekod Aset Tak Alih',
    description: 'Senarai aset tak alih (bangunan, tanah, dll)',
    icon: 'bi-house',
    color: 'primary',
    type: 'tak_alih'
  }
];

export default function LaporanAsetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (!['admin', 'inventory_staff'].includes(userRole)) {
        router.push('/dashboard');
      } else {
        fetchStats();
      }
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      const [assetsRes, lokasiRes] = await Promise.all([
        fetch('/api/aset/senarai'),
        fetch('/api/aset/lokasi')
      ]);

      const assetsData = await assetsRes.json();
      const lokasiData = await lokasiRes.json();

      setStats({
        ...(assetsData.stats || {}),
        total_lokasi: (lokasiData.data || []).length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (reportType: string, reportCode: string) => {
    setGeneratingReport(reportCode);

    try {
      // For now, redirect to the appropriate page with print view
      let url = '';

      switch (reportType) {
        case 'harta_modal':
          url = `/aset?jenis=Harta%20Modal&print=1`;
          break;
        case 'inventori':
          url = `/aset?jenis=Inventori&print=1`;
          break;
        case 'lokasi':
          url = `/aset/lokasi?print=1`;
          break;
        case 'pergerakan':
          url = `/aset/pergerakan?tahun=${selectedYear}&print=1`;
          break;
        case 'pemeriksaan':
          url = `/aset/pemeriksaan?tahun=${selectedYear}&print=1`;
          break;
        case 'penyelenggaraan':
          url = `/aset/penyelenggaraan?tahun=${selectedYear}&print=1`;
          break;
        case 'pelupusan':
        case 'pelupusan_selesai':
          url = `/aset/pelupusan?tahun=${selectedYear}&print=1`;
          break;
        case 'kehilangan':
          url = `/aset/kehilangan?tahun=${selectedYear}&print=1`;
          break;
        case 'tahunan':
          alert('Laporan Tahunan akan dijana dalam format PDF');
          break;
        case 'tak_alih':
          alert('Modul Aset Tak Alih akan datang');
          break;
        default:
          alert('Laporan tidak tersedia');
      }

      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Ralat menjana laporan');
    } finally {
      setGeneratingReport(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item"><a href="/aset">Pengurusan Aset</a></li>
                <li className="breadcrumb-item active">Laporan BR-AMS</li>
              </ol>
            </nav>
            <h4 className="mb-0" style={{ color: '#8B0000' }}>
              <i className="bi bi-file-earmark-text me-2"></i>
              Laporan Pengurusan Aset (BR-AMS)
            </h4>
            <small className="text-muted">Berdasarkan Garis Panduan JAIS</small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <label className="form-label mb-0 small">Tahun:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {[...Array(5)].map((_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="row mb-4">
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-primary text-white">
                <div className="card-body">
                  <h6 className="mb-1">Harta Modal</h6>
                  <h4 className="mb-0">{stats.total_harta_modal}</h4>
                  <small>{formatCurrency(stats.nilai_harta_modal)}</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-info text-white">
                <div className="card-body">
                  <h6 className="mb-1">Inventori</h6>
                  <h4 className="mb-0">{stats.total_inventori}</h4>
                  <small>{formatCurrency(stats.nilai_inventori)}</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-success text-white">
                <div className="card-body">
                  <h6 className="mb-1">Jumlah Nilai</h6>
                  <h4 className="mb-0">{formatCurrency(stats.nilai_harta_modal + stats.nilai_inventori)}</h4>
                  <small>{stats.total_harta_modal + stats.total_inventori} aset</small>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-secondary text-white">
                <div className="card-body">
                  <h6 className="mb-1">Lokasi Aktif</h6>
                  <h4 className="mb-0">{stats.total_lokasi}</h4>
                  <small>lokasi berdaftar</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Grid */}
        <div className="row">
          {REPORTS.map(report => (
            <div key={report.code} className="col-md-6 col-lg-4 mb-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex align-items-start mb-3">
                    <div className={`bg-${report.color} bg-opacity-10 rounded p-2 me-3`}>
                      <i className={`bi ${report.icon} text-${report.color} fs-4`}></i>
                    </div>
                    <div className="flex-grow-1">
                      <span className={`badge bg-${report.color} mb-1`}>{report.code}</span>
                      <h6 className="mb-1">{report.title}</h6>
                      <p className="small text-muted mb-0">{report.description}</p>
                    </div>
                  </div>
                  <button
                    className={`btn btn-outline-${report.color} btn-sm w-100`}
                    onClick={() => generateReport(report.type, report.code)}
                    disabled={generatingReport === report.code}
                  >
                    {generatingReport === report.code ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Menjana...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-printer me-1"></i>
                        Jana Laporan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info Box */}
        <div className="card border-0 shadow-sm mt-4">
          <div className="card-body">
            <h6 className="mb-3">
              <i className="bi bi-info-circle me-2 text-info"></i>
              Maklumat Laporan BR-AMS
            </h6>
            <div className="row">
              <div className="col-md-6">
                <ul className="list-unstyled small">
                  <li className="mb-2">
                    <strong>BR-AMS 001-002:</strong> Senarai lengkap aset mengikut jenis (Harta Modal / Inventori)
                  </li>
                  <li className="mb-2">
                    <strong>BR-AMS 003:</strong> Senarai aset mengikut lokasi penempatan
                  </li>
                  <li className="mb-2">
                    <strong>BR-AMS 004:</strong> Rekod pergerakan dan pinjaman aset
                  </li>
                  <li className="mb-2">
                    <strong>BR-AMS 005:</strong> Rekod pemeriksaan berkala aset
                  </li>
                </ul>
              </div>
              <div className="col-md-6">
                <ul className="list-unstyled small">
                  <li className="mb-2">
                    <strong>BR-AMS 006:</strong> Rekod penyelenggaraan dan kos
                  </li>
                  <li className="mb-2">
                    <strong>BR-AMS 007-008:</strong> Permohonan dan laporan pelupusan
                  </li>
                  <li className="mb-2">
                    <strong>BR-AMS 009:</strong> Laporan kehilangan dan hapus kira
                  </li>
                  <li className="mb-2">
                    <strong>BR-AMS 010-011:</strong> Laporan tahunan dan aset tak alih
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
