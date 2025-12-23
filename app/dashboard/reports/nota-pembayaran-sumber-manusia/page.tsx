'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface NotaItem {
  id: number;
  sub_kategori1: string;
  sub_kategori1_kod: string;
  sub_kategori2: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface GroupedData {
  kod: string;
  nama: string;
  items: NotaItem[];
  subtotal: {
    semasa: number;
    sebelum: number;
  };
}

interface NotaData {
  tahun: number;
  data: Record<string, GroupedData>;
  grandTotal: {
    semasa: number;
    sebelum: number;
  };
}

const SUB_KATEGORI1_OPTIONS = [
  { kod: 'a', nama: 'Emolumen', columnHeader: 'Jawatan' },
  { kod: 'b', nama: 'Kebajikan', columnHeader: 'Perkara' },
  { kod: 'c', nama: 'Keraian Dan Hospitaliti', columnHeader: 'Perkara' },
  { kod: 'd', nama: 'Kursus Dan Latihan', columnHeader: 'Perkara' },
];

export default function NotaPembayaranSumberManusiaReportPage() {
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
      const response = await fetch(`/api/financial/nota-pembayaran-sumber-manusia?tahun=${tahun}`);
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
        <h4 className="mb-0">Laporan Nota Butiran Pembayaran Pengurusan Sumber Manusia</h4>
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

          {/* Main Header */}
          <p className="fw-bold mb-3">12. Pengurusan Sumber Manusia</p>

          {/* Sub-category tables */}
          {SUB_KATEGORI1_OPTIONS.map((subKat1) => {
            const groupData = data.data[subKat1.nama];
            if (!groupData || groupData.items.length === 0) return null;

            return (
              <div key={subKat1.kod} className="mb-4">
                <p className="fw-bold mb-2 ms-3">{subKat1.kod}. {subKat1.nama}</p>
                <table className="table table-bordered" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr className="table-light">
                      <th style={{ width: '40px' }} className="text-center">Bil</th>
                      <th>{subKat1.columnHeader}</th>
                      <th className="text-center" style={{ width: '120px' }}>Tahun<br />Semasa</th>
                      <th className="text-center" style={{ width: '120px' }}>Tahun<br />Sebelum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupData.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="text-center">{idx + 1}</td>
                        <td>{item.sub_kategori2}</td>
                        <td className="text-end">{formatCurrency(item.jumlah_tahun_semasa)}</td>
                        <td className="text-end">{formatCurrency(item.jumlah_tahun_sebelum)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold">
                      <td colSpan={2} className="text-end">Jumlah</td>
                      <td className="text-end">{formatCurrency(groupData.subtotal.semasa)}</td>
                      <td className="text-end">{formatCurrency(groupData.subtotal.sebelum)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}

          {/* Summary Table (c. Pengurusan Sumber Manusia) */}
          <div className="mb-4">
            <p className="fw-bold mb-2 ms-3">c. Pengurusan Sumber Manusia</p>
            <table className="table table-bordered" style={{ fontSize: '13px' }}>
              <thead>
                <tr className="table-light">
                  <th style={{ width: '40px' }} className="text-center">Bil</th>
                  <th>Perkara</th>
                  <th className="text-center" style={{ width: '120px' }}>Tahun<br />Semasa</th>
                  <th className="text-center" style={{ width: '120px' }}>Tahun<br />Sebelum</th>
                </tr>
              </thead>
              <tbody>
                {SUB_KATEGORI1_OPTIONS.map((subKat1, idx) => {
                  const groupData = data.data[subKat1.nama];
                  const semasa = groupData?.subtotal.semasa || 0;
                  const sebelum = groupData?.subtotal.sebelum || 0;

                  return (
                    <tr key={subKat1.kod}>
                      <td className="text-center">{idx + 1}</td>
                      <td>{subKat1.nama}</td>
                      <td className="text-end">{formatCurrency(semasa)}</td>
                      <td className="text-end">{formatCurrency(sebelum)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="fw-bold">
                  <td colSpan={2}>Jumlah</td>
                  <td className="text-end">{formatCurrency(data.grandTotal.semasa)}</td>
                  <td className="text-end">{formatCurrency(data.grandTotal.sebelum)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
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
