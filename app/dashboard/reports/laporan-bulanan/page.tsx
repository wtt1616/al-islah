'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface MonthlyData {
  [month: number]: number;
  jumlah: number;
}

interface ReportData {
  year: number;
  months: string[];
  terimaan: {
    categories: string[];
    data: { [category: string]: MonthlyData };
    jumlah: MonthlyData;
  };
  perbelanjaan: {
    categories: string[];
    data: { [category: string]: MonthlyData };
    jumlah: MonthlyData;
  };
  lebihKurang: MonthlyData;
  bakiAwalBulan: MonthlyData;
  bakiAkhir: MonthlyData;
}

export default function LaporanBulananPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchReport();
    }
  }, [session, year]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/financial/reports/laporan-bulanan?year=${year}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError('Gagal memuatkan laporan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return '-';
    return amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !['admin', 'head_imam', 'bendahari'].includes(session.user.role)) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Anda tidak mempunyai akses ke halaman ini.</div>
      </div>
    );
  }

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 5; y--) {
    years.push(y);
  }

  return (
    <div className="container-fluid py-4">
      {/* Controls - Hidden when printing */}
      <div className="d-print-none mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="mb-0">Laporan Kewangan Bulanan Dan Berkala</h4>
          <div className="d-flex gap-2 align-items-center">
            <label className="form-label mb-0 me-2">Tahun:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={handlePrint}>
              <i className="bi bi-printer me-1"></i> Cetak
            </button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
              Kembali
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {reportData && (
        <div ref={printRef} className="print-container">
          {/* Report Header */}
          <div className="text-center mb-3">
            <p className="mb-1 fw-bold">BR-KMS 018</p>
            <h5 className="fw-bold">LAPORAN KEWANGAN BULANAN DAN BERKALA {year}</h5>
            <p className="mb-2">MASJID/SURAU: <span className="border-bottom border-dark px-5">SURAU AR-RAUDHAH</span></p>
          </div>

          {/* Main Table */}
          <div className="table-responsive">
            <table className="table table-bordered table-sm" style={{ fontSize: '11px' }}>
              <thead>
                {/* TERIMAAN Header */}
                <tr className="table-light">
                  <th rowSpan={2} className="align-middle text-center" style={{ width: '180px' }}>
                    <div style={{ transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>PERKARA</div>
                    <div className="mt-4">BULAN</div>
                  </th>
                  <th colSpan={13} className="text-center bg-success text-white">TERIMAAN</th>
                </tr>
                <tr className="table-light">
                  {reportData.months.map((month, idx) => (
                    <th key={idx} className="text-center" style={{ width: '60px' }}>{month}</th>
                  ))}
                  <th className="text-center" style={{ width: '80px' }}>JUMLAH</th>
                </tr>
              </thead>
              <tbody>
                {/* Terimaan Categories */}
                {reportData.terimaan.categories.map((category, idx) => (
                  <tr key={`terimaan-${idx}`}>
                    <td className="fw-medium">{category}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <td key={m} className="text-end">
                        {formatCurrency(reportData.terimaan.data[category]?.[m] || 0)}
                      </td>
                    ))}
                    <td className="text-end fw-bold">
                      {formatCurrency(reportData.terimaan.data[category]?.jumlah || 0)}
                    </td>
                  </tr>
                ))}
                {/* Jumlah Terimaan */}
                <tr className="table-success fw-bold">
                  <td>JUMLAH</td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <td key={m} className="text-end">
                      {formatCurrency(reportData.terimaan.jumlah[m] || 0)}
                    </td>
                  ))}
                  <td className="text-end">
                    {formatCurrency(reportData.terimaan.jumlah.jumlah || 0)}
                  </td>
                </tr>

                {/* Separator and Perbelanjaan Header */}
                <tr className="table-light">
                  <th colSpan={14} className="text-center bg-danger text-white">PERBELANJAAN</th>
                </tr>

                {/* Perbelanjaan Categories */}
                {reportData.perbelanjaan.categories.map((category, idx) => (
                  <tr key={`perbelanjaan-${idx}`}>
                    <td className="fw-medium">{category}</td>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <td key={m} className="text-end">
                        {formatCurrency(reportData.perbelanjaan.data[category]?.[m] || 0)}
                      </td>
                    ))}
                    <td className="text-end fw-bold">
                      {formatCurrency(reportData.perbelanjaan.data[category]?.jumlah || 0)}
                    </td>
                  </tr>
                ))}
                {/* Jumlah Perbelanjaan */}
                <tr className="table-danger fw-bold">
                  <td>JUMLAH</td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <td key={m} className="text-end">
                      {formatCurrency(reportData.perbelanjaan.jumlah[m] || 0)}
                    </td>
                  ))}
                  <td className="text-end">
                    {formatCurrency(reportData.perbelanjaan.jumlah.jumlah || 0)}
                  </td>
                </tr>

                {/* Lebih / Kurang */}
                <tr className="table-warning fw-bold">
                  <td>Lebih / Kurang</td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <td key={m} className={`text-end ${reportData.lebihKurang[m] < 0 ? 'text-danger' : 'text-success'}`}>
                      {formatCurrency(reportData.lebihKurang[m] || 0)}
                    </td>
                  ))}
                  <td className={`text-end ${reportData.lebihKurang.jumlah < 0 ? 'text-danger' : 'text-success'}`}>
                    {formatCurrency(reportData.lebihKurang.jumlah || 0)}
                  </td>
                </tr>

                {/* Separator */}
                <tr><td colSpan={14} className="border-0" style={{ height: '10px' }}></td></tr>

                {/* Baki Awal Bulan */}
                <tr>
                  <td className="fw-medium">Baki Awal Bulan</td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <td key={m} className="text-end">
                      {formatCurrency(reportData.bakiAwalBulan[m] || 0)}
                    </td>
                  ))}
                  <td className="text-end fw-bold">
                    {formatCurrency(reportData.bakiAwalBulan.jumlah || 0)}
                  </td>
                </tr>

                {/* Lebih / Kurang (repeat) */}
                <tr>
                  <td className="fw-medium">Lebih / Kurang</td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <td key={m} className={`text-end ${reportData.lebihKurang[m] < 0 ? 'text-danger' : ''}`}>
                      {formatCurrency(reportData.lebihKurang[m] || 0)}
                    </td>
                  ))}
                  <td className={`text-end fw-bold ${reportData.lebihKurang.jumlah < 0 ? 'text-danger' : ''}`}>
                    {formatCurrency(reportData.lebihKurang.jumlah || 0)}
                  </td>
                </tr>

                {/* Baki Akhir */}
                <tr className="table-primary fw-bold">
                  <td>Baki Akhir</td>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <td key={m} className="text-end">
                      {formatCurrency(reportData.bakiAkhir[m] || 0)}
                    </td>
                  ))}
                  <td className="text-end">
                    {formatCurrency(reportData.bakiAkhir.jumlah || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Section */}
          <div className="mt-5 pt-4">
            <div className="row">
              <div className="col-3 text-center">
                <div className="border-top border-dark pt-2 mx-3">
                  <p className="mb-0 fw-bold">Disediakan Oleh</p>
                  <p className="mb-0 small">...................................</p>
                  <p className="mb-0 fw-medium">Bendahari</p>
                  <p className="mb-0 small">Tarikh: ...................</p>
                </div>
              </div>
              <div className="col-3 text-center">
                <div className="border-top border-dark pt-2 mx-3">
                  <p className="mb-0 fw-bold">Disemak Oleh</p>
                  <p className="mb-0 small">...................................</p>
                  <p className="mb-0 fw-medium">Pemeriksa Kira-Kira 1</p>
                  <p className="mb-0 small">Tarikh: ...................</p>
                </div>
              </div>
              <div className="col-3 text-center">
                <div className="border-top border-dark pt-2 mx-3">
                  <p className="mb-0 fw-bold">Disemak Oleh</p>
                  <p className="mb-0 small">...................................</p>
                  <p className="mb-0 fw-medium">Pemeriksa Kira-Kira 2</p>
                  <p className="mb-0 small">Tarikh: ...................</p>
                </div>
              </div>
              <div className="col-3 text-center">
                <div className="border-top border-dark pt-2 mx-3">
                  <p className="mb-0 fw-bold">Disahkan Oleh</p>
                  <p className="mb-0 small">...................................</p>
                  <p className="mb-0 fw-medium">Nazir/Pengurus/Pengerusi Surau</p>
                  <p className="mb-0 small">Tarikh: ...................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .d-print-none {
            display: none !important;
          }

          .container-fluid {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-container {
            width: 100%;
          }

          table {
            font-size: 9px !important;
          }

          th, td {
            padding: 2px 4px !important;
          }

          @page {
            size: A4 landscape;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
