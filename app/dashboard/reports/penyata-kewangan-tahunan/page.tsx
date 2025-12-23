'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface RowData {
  perkara: string;
  nota: number | null;
  semasa: number;
  sebelum: number;
}

interface SectionData {
  title: string;
  rows: RowData[];
}

interface TotalData {
  semasa: number;
  sebelum: number;
}

interface ReportData {
  tahun: number;
  sections: SectionData[];
  totals: {
    bakiAwal: TotalData;
    jumlahPenerimaan: TotalData;
    jumlahPembayaran: TotalData;
    bakiAkhir: TotalData;
  };
}

export default function PenyataKewanganTahunanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [masjidName, setMasjidName] = useState('MASJID ...............................');
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
      const response = await fetch(`/api/financial/reports/penyata-kewangan-tahunan?tahun=${tahun}`);
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
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    years.push(y);
  }

  return (
    <div className="container py-4">
      {/* Controls - Hidden when printing */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2 no-print">
        <h4 className="mb-0">BR-KMS-019: Penyata Kewangan Tahunan</h4>
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
          <div className="text-end mb-2" style={{ fontSize: '12px' }}>
            <strong>BR-KMS 019</strong>
          </div>

          <div className="text-center mb-3">
            <p className="mb-1">{masjidName}</p>
            <h5 className="mb-1"><strong>PENYATA KEWANGAN TAHUNAN</strong></h5>
            <p className="mb-0">JANUARI HINGGA DISEMBER TAHUN {tahun}</p>
          </div>

          {/* Main Table */}
          <table className="table table-bordered" style={{ fontSize: '12px' }}>
            <thead>
              <tr className="table-light">
                <th colSpan={4} className="text-center">
                  PENYATA PENERIMAAN DAN PEMBAYARAN UNTUK TAHUN BERAKHIR 31 DISEMBER
                </th>
              </tr>
              <tr className="table-light">
                <th style={{ width: '50%' }}>Perkara</th>
                <th className="text-center" style={{ width: '10%' }}>Nota</th>
                <th className="text-center" style={{ width: '20%' }}>Tahun<br />(RM)</th>
                <th className="text-center" style={{ width: '20%' }}>Tahun<br />Sebelumnya<br />(RM)</th>
              </tr>
            </thead>
            <tbody>
              {/* Baki Awal Section */}
              <tr>
                <td><strong>BAKI SEMUA WANG DI BANK PADA 1 JANUARI</strong></td>
                <td className="text-center">1</td>
                <td className="text-end">{formatCurrency(data.sections[0]?.rows[0]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[0]?.rows[0]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td>BAKI TUNAI DI TANGAN PADA 1 JANUARI</td>
                <td className="text-center"></td>
                <td className="text-end">-</td>
                <td className="text-end">-</td>
              </tr>
              <tr>
                <td>BAKI PELABURAN PADA 1 JANUARI</td>
                <td className="text-center">2</td>
                <td className="text-end">{formatCurrency(data.sections[0]?.rows[2]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[0]?.rows[2]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td>BAKI DEPOSIT DIBAYAR PADA 1 JAN</td>
                <td className="text-center">3</td>
                <td className="text-end">{formatCurrency(data.sections[0]?.rows[3]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[0]?.rows[3]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td>BAKI AKAUN AMANAH PADA 1 JAN</td>
                <td className="text-center">5</td>
                <td className="text-end">{formatCurrency(data.sections[0]?.rows[4]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[0]?.rows[4]?.sebelum || 0)}</td>
              </tr>

              {/* Penerimaan Section */}
              <tr className="table-light">
                <td colSpan={4}><strong>PENERIMAAN</strong></td>
              </tr>
              <tr>
                <td className="ps-4">Sumbangan Am</td>
                <td className="text-center">4</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[0]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[0]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Sumbangan Khas (Amanah)</td>
                <td className="text-center">5</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[1]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[1]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Hasil Sewaan / Penjanaan Ekonomi</td>
                <td className="text-center">6</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[2]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[2]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Terimaan Sumbangan Elaun</td>
                <td className="text-center">7</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[3]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[3]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Hibah Pelaburan</td>
                <td className="text-center">8</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[4]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[4]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Deposit Diterima</td>
                <td className="text-center">9</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[5]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[5]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Hibah Bank</td>
                <td className="text-center"></td>
                <td className="text-end">-</td>
                <td className="text-end">-</td>
              </tr>
              <tr>
                <td className="ps-4">Lain-Lain Terimaan</td>
                <td className="text-center">10</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[7]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[1]?.rows[7]?.sebelum || 0)}</td>
              </tr>
              <tr className="table-secondary">
                <td><strong>JUMLAH PENERIMAAN</strong></td>
                <td className="text-center"></td>
                <td className="text-end"><strong>{formatCurrency(data.totals.jumlahPenerimaan.semasa)}</strong></td>
                <td className="text-end"><strong>{formatCurrency(data.totals.jumlahPenerimaan.sebelum)}</strong></td>
              </tr>

              {/* Pembayaran Section */}
              <tr className="table-light">
                <td colSpan={4}><strong>PEMBAYARAN</strong></td>
              </tr>
              <tr>
                <td className="ps-4">Pentadbiran</td>
                <td className="text-center">11</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[0]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[0]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Pengurusan Sumber Manusia</td>
                <td className="text-center">12</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[1]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[1]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Pembangunan Dan Penyelenggaraan</td>
                <td className="text-center">13</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[2]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[2]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Dakwah dan Pengimarahan</td>
                <td className="text-center">14</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[3]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[3]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Khidmat Sosial Dan Kemasyarakatan</td>
                <td className="text-center">15</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[4]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[4]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Pembelian Aset</td>
                <td className="text-center">16</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[5]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[5]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Perbelanjaan Khas (Amanah)</td>
                <td className="text-center">5</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[6]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[2]?.rows[6]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td className="ps-4">Pelbagai</td>
                <td className="text-center"></td>
                <td className="text-end">-</td>
                <td className="text-end">-</td>
              </tr>
              <tr className="table-secondary">
                <td><strong>JUMLAH PERBELANJAAN</strong></td>
                <td className="text-center"></td>
                <td className="text-end"><strong>{formatCurrency(data.totals.jumlahPembayaran.semasa)}</strong></td>
                <td className="text-end"><strong>{formatCurrency(data.totals.jumlahPembayaran.sebelum)}</strong></td>
              </tr>

              {/* Baki Akhir Section */}
              <tr>
                <td><strong>BAKI WANG DI BANK PADA 31 DISEMBER</strong></td>
                <td className="text-center"></td>
                <td className="text-end">-</td>
                <td className="text-end">-</td>
              </tr>
              <tr>
                <td>BAKI TUNAI DI TANGAN PADA 31 DISEMBER</td>
                <td className="text-center"></td>
                <td className="text-end">-</td>
                <td className="text-end">-</td>
              </tr>
              <tr>
                <td>BAKI PELABURAN DI BANK PADA 31 DISEMBER</td>
                <td className="text-center">21</td>
                <td className="text-end">{formatCurrency(data.sections[3]?.rows[2]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[3]?.rows[2]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td>BAKI DEPOSIT PADA 31 DISEMBER</td>
                <td className="text-center">22</td>
                <td className="text-end">{formatCurrency(data.sections[3]?.rows[3]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[3]?.rows[3]?.sebelum || 0)}</td>
              </tr>
              <tr>
                <td>BAKI AKAUN AMANAH PADA 31 DISEMBER</td>
                <td className="text-center">5</td>
                <td className="text-end">{formatCurrency(data.sections[3]?.rows[4]?.semasa || 0)}</td>
                <td className="text-end">{formatCurrency(data.sections[3]?.rows[4]?.sebelum || 0)}</td>
              </tr>
            </tbody>
          </table>

          {/* Legend */}
          <div className="mt-4" style={{ fontSize: '11px' }}>
            <p className="mb-1"><strong>Nota:</strong></p>
            <div className="row">
              <div className="col-6">
                <p className="mb-0">1 - Baki Wang Di Bank 1 Jan</p>
                <p className="mb-0">2 - Baki Pelaburan 1 Jan</p>
                <p className="mb-0">3 - Baki Deposit 1 Jan</p>
                <p className="mb-0">4 - Sumbangan Am</p>
                <p className="mb-0">5 - Sumbangan Khas</p>
                <p className="mb-0">6 - Hasil Sewaan</p>
                <p className="mb-0">7 - Elaun</p>
                <p className="mb-0">8 - Pelaburan</p>
              </div>
              <div className="col-6">
                <p className="mb-0">9 - Deposit</p>
                <p className="mb-0">10 - Lain-lain</p>
                <p className="mb-0">11 - Pentadbiran</p>
                <p className="mb-0">12 - Sumber Manusia</p>
                <p className="mb-0">13 - Pembangunan</p>
                <p className="mb-0">14 - Dakwah</p>
                <p className="mb-0">15 - Khidmat Sosial</p>
                <p className="mb-0">16 - Aset</p>
              </div>
            </div>
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
            font-size: 10px !important;
          }

          .table th,
          .table td {
            padding: 3px 5px !important;
          }

          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
