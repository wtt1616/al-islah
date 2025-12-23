'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ReportData {
  year: number;
  masjid_name: string;
  penerimaan: { [key: string]: number };
  pembayaran: { [key: string]: number };
  totalPenerimaan: number;
  totalPembayaran: number;
  lebihan: number;
  exists: boolean;
}

export default function LaporanAnggaranPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState<number[]>([]);

  // All categories matching BR-KMS-001 format
  const penerimaanCategories = [
    'Sumbangan Am',
    'Sumbangan Khas (Amanah)',
    'Hasil Sewaan/Penjanaan Ekonomi',
    'Tahlil',
    'Sumbangan Elaun',
    'Hibah Pelaburan',
    'Deposit',
    'Hibah Bank',
    'Lain-lain Terimaan',
  ];

  const pembayaranCategories = [
    'Pentadbiran',
    'Pengurusan Sumber Manusia',
    'Pembangunan dan Penyelenggaraan',
    'Dakwah dan Pengimarahan',
    'Khidmat Sosial dan Kemasyarakatan',
    'Pembelian Aset',
    'Perbelanjaan Khas (Amanah)',
    'Pelbagai',
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user?.role && !['admin', 'head_imam', 'bendahari'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearList = [];
    for (let i = 0; i <= 5; i++) {
      yearList.push(currentYear - i);
    }
    setYears(yearList);
  }, []);

  useEffect(() => {
    if (session) {
      fetchReport();
    }
  }, [session, selectedYear]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/financial/reports/anggaran?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        alert('Failed to fetch report data');
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      alert('Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  const handlePrint = () => {
    window.print();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading report...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-page {
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            margin: 0;
          }
          body { margin: 0; }
        }
      `}</style>

      <div className="row mb-4 no-print">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">BR-KMS-001: Laporan Penerimaan dan Pembayaran</h2>
              <p className="text-muted">Laporan penerimaan dan pembayaran berdasarkan transaksi sebenar</p>
            </div>
            <div className="d-flex gap-2">
              <select
                className="form-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ width: 'auto' }}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button className="btn btn-outline-secondary" onClick={() => router.back()}>
                <i className="bi bi-arrow-left me-2"></i>Kembali
              </button>
              <button className="btn btn-info" onClick={handlePrint}>
                <i className="bi bi-printer me-2"></i>Print
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm print-page">
        <div className="card-body">
          {/* Header */}
          <div className="text-end mb-2">
            <strong>BR-KMS 001</strong>
          </div>

          <div className="mb-3">
            <strong>MASJID/SURAU</strong> <span className="ms-2">{reportData?.masjid_name || 'MASJID/SURAU'}</span>
          </div>

          <h5 className="mb-4">
            Penerimaan Dan Pembayaran Bagi Tahun <strong>{selectedYear}</strong>
          </h5>

          {reportData && (
            <>
              {/* PENERIMAAN */}
              <div className="mb-4">
                <h6 className="mb-3"><u>PENERIMAAN</u></h6>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th style={{ width: '70%' }}>Kategori</th>
                      <th className="text-center" style={{ width: '30%' }}>RM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penerimaanCategories.map((category, idx) => (
                      <tr key={idx}>
                        <td>{category}</td>
                        <td className="text-end">
                          {formatCurrency(reportData.penerimaan[category] || 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="table-secondary fw-bold">
                      <td>Jumlah Penerimaan</td>
                      <td className="text-end">{formatCurrency(reportData.totalPenerimaan)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* PEMBAYARAN */}
              <div className="mb-4">
                <h6 className="mb-3"><u>PEMBAYARAN</u></h6>
                <table className="table table-bordered">
                  <thead>
                    <tr>
                      <th style={{ width: '70%' }}>Kategori</th>
                      <th className="text-center" style={{ width: '30%' }}>RM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pembayaranCategories.map((category, idx) => (
                      <tr key={idx}>
                        <td>{category}</td>
                        <td className="text-end">
                          {formatCurrency(reportData.pembayaran[category] || 0)}
                        </td>
                      </tr>
                    ))}
                    <tr className="table-secondary fw-bold">
                      <td>Jumlah Pembayaran</td>
                      <td className="text-end">{formatCurrency(reportData.totalPembayaran)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* LEBIHAN/KURANGAN */}
              <div className="mb-5">
                <table className="table table-bordered">
                  <tbody>
                    <tr className="table-info fw-bold">
                      <td style={{ width: '70%' }}>LEBIHAN/(KURANGAN)</td>
                      <td className="text-end" style={{ width: '30%' }}>
                        <span className={reportData.lebihan >= 0 ? 'text-success' : 'text-danger'}>
                          {formatCurrency(reportData.lebihan)}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="row mt-5">
                <div className="col-6">
                  <p>Disediakan Oleh,</p>
                  <div style={{ height: '60px' }}></div>
                  <p className="mb-0">_________________</p>
                  <p className="mb-0">Nama</p>
                  <p>(Bendahari)</p>
                </div>
                <div className="col-6">
                  <p>Diluluskan Oleh,</p>
                  <div style={{ height: '60px' }}></div>
                  <p className="mb-0">_________________</p>
                  <p className="mb-0">Nama</p>
                  <p>(Nazir)</p>
                </div>
              </div>

              {/* Footer note */}
              <div className="mt-4 p-2 border" style={{ fontSize: '10px' }}>
                <em>
                  "Perbuatan salahguna kuasa penyelewengan dan mengemukakan tuntutan palsu
                  adalah kesalahan di bawah Akta Suruhanjaya Pencegahan Rasuah Malaysia 2009"
                </em>
              </div>
            </>
          )}

          {!reportData && (
            <div className="alert alert-info">
              <i className="bi bi-info-circle me-2"></i>
              Tiada data transaksi untuk tahun {selectedYear}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards - Only shown on screen, not print */}
      {reportData && (
        <div className="row mt-4 no-print">
          <div className="col-md-4">
            <div className="card border-success">
              <div className="card-body">
                <h6 className="card-title text-success">Total Penerimaan</h6>
                <h4 className="mb-0">RM {formatCurrency(reportData.totalPenerimaan)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-danger">
              <div className="card-body">
                <h6 className="card-title text-danger">Total Pembayaran</h6>
                <h4 className="mb-0">RM {formatCurrency(reportData.totalPembayaran)}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className={`card ${reportData.lebihan >= 0 ? 'border-success' : 'border-danger'}`}>
              <div className="card-body">
                <h6 className="card-title">Lebihan/(Kurangan)</h6>
                <h4 className={`mb-0 ${reportData.lebihan >= 0 ? 'text-success' : 'text-danger'}`}>
                  RM {formatCurrency(reportData.lebihan)}
                </h4>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
