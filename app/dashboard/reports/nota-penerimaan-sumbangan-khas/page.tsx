'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

interface NotaItem {
  id: number;
  subkategori: string;
  baki_awal_jan_sebelum: number;
  terimaan_semasa_sebelum: number;
  belanja_semasa_sebelum: number;
  baki_akhir_dis_sebelum: number;
  baki_awal_jan_semasa: number;
  terimaan_semasa_semasa: number;
  belanja_semasa_semasa: number;
  baki_akhir_dis_semasa: number;
}

interface NotaData {
  tahun: number;
  data: NotaItem[];
  totals: {
    sebelum: {
      baki_awal_jan: number;
      terimaan_semasa: number;
      belanja_semasa: number;
      baki_akhir_dis: number;
    };
    semasa: {
      baki_awal_jan: number;
      terimaan_semasa: number;
      belanja_semasa: number;
      baki_akhir_dis: number;
    };
  };
}

export default function NotaPenerimaanSumbanganKhasReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tahun, setTahun] = useState(parseInt(searchParams.get('tahun') || new Date().getFullYear().toString()));
  const [data, setData] = useState<NotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, tahun]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/financial/nota-penerimaan-sumbangan-khas?tahun=${tahun}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Gagal memuatkan data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
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
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    years.push(y);
  }

  return (
    <div className="container-fluid py-4">
      {/* Controls - Hidden when printing */}
      <div className="d-print-none mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="mb-0">Laporan Nota Butiran Penerimaan Sumbangan Khas</h4>
          <div className="d-flex gap-2 align-items-center">
            <label className="form-label mb-0 me-2">Tahun:</label>
            <select
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={tahun}
              onChange={(e) => setTahun(parseInt(e.target.value))}
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

      {data && (
        <div className="print-container">
          {/* Section Header */}
          <div className="mb-3">
            <h6 className="fw-bold">5. Sumbangan Khas</h6>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered" style={{ fontSize: '10px' }}>
              <thead>
                <tr className="table-light">
                  <th rowSpan={2} className="align-middle text-center" style={{ width: '100px' }}></th>
                  {data.data.map((item) => (
                    <th key={item.id} className="text-center" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: '100px', padding: '6px 3px' }}>
                      <span style={{ transform: 'rotate(180deg)', display: 'inline-block', fontSize: '9px' }}>{item.subkategori}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Tahun Sebelum Section */}
                <tr className="table-secondary">
                  <td colSpan={data.data.length + 1} className="fw-bold" style={{ fontSize: '10px' }}>Tahun Sebelum</td>
                </tr>
                <tr>
                  <td style={{ fontSize: '9px' }}>Baki Awal 1 Jan</td>
                  {data.data.map((item) => (
                    <td key={item.id} className="text-end" style={{ fontSize: '9px' }}>{formatCurrency(item.baki_awal_jan_sebelum)}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontSize: '9px' }}>Terimaan semasa</td>
                  {data.data.map((item) => (
                    <td key={item.id} className="text-end" style={{ fontSize: '9px' }}>{formatCurrency(item.terimaan_semasa_sebelum)}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontSize: '9px' }}>Belanja Semasa</td>
                  {data.data.map((item) => (
                    <td key={item.id} className="text-end" style={{ fontSize: '9px' }}>{formatCurrency(item.belanja_semasa_sebelum)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="fw-bold" style={{ fontSize: '9px' }}>Baki Akhir 31 disember</td>
                  {data.data.map((item) => (
                    <td key={item.id} className="text-end fw-bold" style={{ fontSize: '9px' }}>{formatCurrency(item.baki_akhir_dis_sebelum)}</td>
                  ))}
                </tr>

                {/* Tahun Semasa Section */}
                <tr className="table-secondary">
                  <td colSpan={data.data.length + 1} className="fw-bold" style={{ fontSize: '10px' }}>Tahun Semasa</td>
                </tr>
                <tr>
                  <td style={{ fontSize: '9px' }}>Baki Awal 1 Jan</td>
                  {data.data.map((item) => (
                    <td key={item.id} className="text-end" style={{ fontSize: '9px' }}>{formatCurrency(item.baki_awal_jan_semasa)}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontSize: '9px' }}>Terimaan semasa</td>
                  {data.data.map((item) => (
                    <td key={item.id} className="text-end" style={{ fontSize: '9px' }}>{formatCurrency(item.terimaan_semasa_semasa)}</td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontSize: '9px' }}>Belanja Semasa</td>
                  {data.data.map((item) => (
                    <td key={item.id} className="text-end" style={{ fontSize: '9px' }}>{formatCurrency(item.belanja_semasa_semasa)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="fw-bold" style={{ fontSize: '9px' }}>Baki Akhir 31 Disember</td>
                  {data.data.map((item) => (
                    <td key={item.id} className="text-end fw-bold" style={{ fontSize: '9px' }}>{formatCurrency(item.baki_akhir_dis_semasa)}</td>
                  ))}
                </tr>
              </tbody>
            </table>
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

          @page {
            size: A4 landscape;
            margin: 10mm;
          }

          table {
            font-size: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
