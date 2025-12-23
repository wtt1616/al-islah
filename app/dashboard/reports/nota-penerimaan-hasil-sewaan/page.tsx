'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface MainItem {
  id: number;
  perkara: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
}

interface YuranItem {
  id: number;
  yuran_aktiviti: string;
  baki_awal: number;
  terimaan: number;
  belanja: number;
  baki: number;
}

interface SummaryItem {
  id: number;
  perkara: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
}

interface NotaData {
  tahun: number;
  mainData: MainItem[];
  mainGrandTotal: { semasa: number; sebelum: number };
  yuranData: YuranItem[];
  yuranGrandTotal: { baki_awal: number; terimaan: number; belanja: number; baki: number };
  summaryData: SummaryItem[];
}

export default function NotaPenerimaanHasilSewaanReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<NotaData | null>(null);
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
      fetchData();
    }
  }, [session, tahun]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/financial/nota-penerimaan-hasil-sewaan?tahun=${tahun}`);
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
    <div className="container py-4">
      {/* Controls - Hidden when printing */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 no-print">
        <h4 className="mb-0">Laporan Nota Penerimaan Hasil Sewaan / Penjanaan Ekonomi</h4>
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
          <button className="btn btn-outline-secondary btn-sm" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-1"></i> Kembali
          </button>
          <button className="btn btn-primary btn-sm" onClick={handlePrint}>
            <i className="bi bi-printer me-1"></i> Cetak
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger no-print">{error}</div>}

      {data && (
        <div ref={printRef} className="print-area">
          {/* Report Header */}
          <div className="text-center mb-4">
            <h5 className="mb-1">NOTA KEPADA PENYATA KEWANGAN</h5>
            <p className="mb-0">Bagi Tahun Berakhir 31 Disember {tahun}</p>
          </div>

          {/* Table 1: Main Data */}
          <p className="fw-bold mb-3">6. Hasil Sewaan / Penjanaan Ekonomi</p>

          <table className="table table-bordered" style={{ fontSize: '13px' }}>
            <thead>
              <tr className="table-light">
                <th style={{ width: '40px' }} className="text-center">Bil</th>
                <th>Perkara</th>
                <th className="text-center" style={{ width: '120px' }}>Tahun<br />Semasa<br />RM</th>
                <th className="text-center" style={{ width: '120px' }}>Tahun<br />sebelum<br />RM</th>
              </tr>
            </thead>
            <tbody>
              {data.mainData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted">Tiada rekod</td>
                </tr>
              ) : (
                data.mainData.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="text-center">{idx + 1}</td>
                    <td>{item.perkara}</td>
                    <td className="text-end">{formatCurrency(item.jumlah_tahun_semasa)}</td>
                    <td className="text-end">{item.jumlah_tahun_sebelum === 0 ? '-' : formatCurrency(item.jumlah_tahun_sebelum)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {data.mainData.length > 0 && (
              <tfoot>
                <tr className="fw-bold">
                  <td colSpan={2}>Total Amaun</td>
                  <td className="text-end">{formatCurrency(data.mainGrandTotal.semasa)}</td>
                  <td className="text-end">{data.mainGrandTotal.sebelum === 0 ? '-' : formatCurrency(data.mainGrandTotal.sebelum)}</td>
                </tr>
              </tfoot>
            )}
          </table>

          {/* Table 2: Yuran Penagajian Dan Aktiviti */}
          {data.yuranData.length > 0 && (
            <>
              <div className="mt-4"></div>
              <table className="table table-bordered" style={{ fontSize: '13px' }}>
                <thead>
                  <tr className="table-light">
                    <th style={{ width: '40px' }} className="text-center">Bil</th>
                    <th>Yuran Penagajian<br />Dan Aktiviti</th>
                    <th className="text-center" style={{ width: '90px' }}>Baki<br />awal</th>
                    <th className="text-center" style={{ width: '90px' }}>terimaan</th>
                    <th className="text-center" style={{ width: '90px' }}>belanja</th>
                    <th className="text-center" style={{ width: '90px' }}>baki</th>
                  </tr>
                </thead>
                <tbody>
                  {data.yuranData.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>{item.yuran_aktiviti}</td>
                      <td className="text-end">{item.baki_awal === 0 ? '-' : formatCurrency(item.baki_awal)}</td>
                      <td className="text-end">{formatCurrency(item.terimaan)}</td>
                      <td className="text-end">{formatCurrency(item.belanja)}</td>
                      <td className="text-end">{formatCurrency(item.baki)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="fw-bold">
                    <td colSpan={2}></td>
                    <td className="text-end">{data.yuranGrandTotal.baki_awal === 0 ? '-' : formatCurrency(data.yuranGrandTotal.baki_awal)}</td>
                    <td className="text-end">{formatCurrency(data.yuranGrandTotal.terimaan)}</td>
                    <td className="text-end">{formatCurrency(data.yuranGrandTotal.belanja)}</td>
                    <td className="text-end">{formatCurrency(data.yuranGrandTotal.baki)}</td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}

          {/* Table 3: Summary */}
          {data.summaryData.length > 0 && (
            <>
              <div className="mt-4"></div>
              <table className="table table-bordered" style={{ fontSize: '13px' }}>
                <thead>
                  <tr className="table-light">
                    <th style={{ width: '40px' }} className="text-center">Bil</th>
                    <th>Perkara</th>
                    <th className="text-center" style={{ width: '120px' }}>Tahun<br />Semasa<br />RM</th>
                    <th className="text-center" style={{ width: '120px' }}>Tahun<br />Sebelumnya<br />RM</th>
                  </tr>
                </thead>
                <tbody>
                  {data.summaryData.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="text-center">{idx + 1}</td>
                      <td>{item.perkara}</td>
                      <td className="text-end">{formatCurrency(item.jumlah_tahun_semasa)}</td>
                      <td className="text-end">{item.jumlah_tahun_sebelum === 0 ? '-' : formatCurrency(item.jumlah_tahun_sebelum)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .print-area {
            padding: 0;
            margin: 0;
          }

          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .table {
            font-size: 11px !important;
          }

          .table th,
          .table td {
            padding: 4px 6px !important;
          }

          @page {
            size: A4 portrait;
            margin: 15mm;
          }
        }
      `}</style>
    </div>
  );
}
