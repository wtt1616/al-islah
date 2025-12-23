'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

interface BakiBank {
  id: number;
  nama_bank: string;
  cawangan: string | null;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface BakiPelaburan {
  id: number;
  nama_institusi: string;
  cawangan: string | null;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface BakiDeposit {
  id: number;
  perkara: string;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface NotaData {
  tahun: number;
  bakiBank: BakiBank[];
  bakiPelaburan: BakiPelaburan[];
  bakiDeposit: BakiDeposit[];
  jumlah: {
    bank: { semasa: number; sebelum: number };
    pelaburan: { semasa: number; sebelum: number };
    deposit: { semasa: number; sebelum: number };
    keseluruhan: { semasa: number; sebelum: number };
  };
}

export default function NotaButiranBakiReportPage() {
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
      const response = await fetch(`/api/financial/nota-butiran-baki?tahun=${tahun}`);
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
      <div className="d-print-none mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h4 className="mb-0">Laporan Nota Butiran Baki 1 Januari</h4>
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
          {/* Report Header */}
          <div className="text-center mb-4">
            <h5 className="fw-bold text-decoration-underline">NOTA BUTIRAN BAKI 1 JAN</h5>
          </div>

          {/* Section 1: Baki Wang Di Bank */}
          <div className="mb-4">
            <h6 className="fw-bold">1. Baki Semua Wang Di Bank Pada 1 Januari</h6>
            <table className="table table-bordered" style={{ fontSize: '12px' }}>
              <thead>
                <tr className="table-light">
                  <th style={{ width: '50px' }}>Bil</th>
                  <th>Nama bank</th>
                  <th>cawangan</th>
                  <th className="text-center" style={{ width: '120px' }}>Tahun semasa<br />RM</th>
                  <th className="text-center" style={{ width: '120px' }}>Tahun sebelum<br />RM</th>
                </tr>
              </thead>
              <tbody>
                {data.bakiBank.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">-</td>
                  </tr>
                ) : (
                  data.bakiBank.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>{item.nama_bank}</td>
                      <td>{item.cawangan || ''}</td>
                      <td className="text-end">{formatCurrency(item.baki_tahun_semasa)}</td>
                      <td className="text-end">{formatCurrency(item.baki_tahun_sebelum)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="fw-bold">
                  <td colSpan={3} className="text-end">JUMLAH</td>
                  <td className="text-end">{formatCurrency(data.jumlah.bank.semasa)}</td>
                  <td className="text-end">{formatCurrency(data.jumlah.bank.sebelum)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Section 2: Baki Pelaburan */}
          <div className="mb-4">
            <h6 className="fw-bold">2. Baki Pelaburan Pada 1 Januari</h6>
            <table className="table table-bordered" style={{ fontSize: '12px' }}>
              <thead>
                <tr className="table-light">
                  <th style={{ width: '50px' }}>Bil</th>
                  <th>Nama Institusi</th>
                  <th>cawangan</th>
                  <th className="text-center" style={{ width: '120px' }}>Tahun semasa<br />RM</th>
                  <th className="text-center" style={{ width: '120px' }}>Tahun sebelum<br />RM</th>
                </tr>
              </thead>
              <tbody>
                {data.bakiPelaburan.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">-</td>
                  </tr>
                ) : (
                  data.bakiPelaburan.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}.</td>
                      <td>{item.nama_institusi}</td>
                      <td>{item.cawangan || ''}</td>
                      <td className="text-end">{formatCurrency(item.baki_tahun_semasa)}</td>
                      <td className="text-end">{formatCurrency(item.baki_tahun_sebelum)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="fw-bold">
                  <td colSpan={3} className="text-end">JUMLAH</td>
                  <td className="text-end">{formatCurrency(data.jumlah.pelaburan.semasa)}</td>
                  <td className="text-end">{formatCurrency(data.jumlah.pelaburan.sebelum)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Section 3: Baki Deposit */}
          <div className="mb-4">
            <h6 className="fw-bold">3. Baki Deposit Pada 1 Jan</h6>
            <table className="table table-bordered" style={{ fontSize: '12px' }}>
              <thead>
                <tr className="table-light">
                  <th style={{ width: '50px' }}>Bil</th>
                  <th>Perkara</th>
                  <th className="text-center" style={{ width: '120px' }}>Tahun semasa<br />RM</th>
                  <th className="text-center" style={{ width: '120px' }}>Tahun sebelum<br />RM</th>
                </tr>
              </thead>
              <tbody>
                {data.bakiDeposit.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">-</td>
                  </tr>
                ) : (
                  data.bakiDeposit.map((item, idx) => (
                    <tr key={item.id}>
                      <td>{idx + 1}</td>
                      <td>{item.perkara}</td>
                      <td className="text-end">{formatCurrency(item.baki_tahun_semasa)}</td>
                      <td className="text-end">{formatCurrency(item.baki_tahun_sebelum)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="fw-bold">
                  <td colSpan={2} className="text-end">JUMLAH</td>
                  <td className="text-end">{formatCurrency(data.jumlah.deposit.semasa)}</td>
                  <td className="text-end">{formatCurrency(data.jumlah.deposit.sebelum)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Grand Total */}
          <div className="mb-4">
            <table className="table table-bordered" style={{ fontSize: '12px' }}>
              <tbody>
                <tr className="table-dark fw-bold">
                  <td>JUMLAH KESELURUHAN BAKI 1 JANUARI {tahun}</td>
                  <td className="text-end" style={{ width: '120px' }}>RM {formatCurrency(data.jumlah.keseluruhan.semasa)}</td>
                  <td className="text-end" style={{ width: '120px' }}>RM {formatCurrency(data.jumlah.keseluruhan.sebelum)}</td>
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

          .container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
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
