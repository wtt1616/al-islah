'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Transaction {
  id: number;
  transaction_date: string;
  transaction_description: string;
  ref_cheque_no: string;
  customer_eft_no: string;
  transaction_type: string;
  category_penerimaan: string | null;
  category_pembayaran: string | null;
  credit_amount: number;
  debit_amount: number;
  running_balance: number;
  amount: number;
}

interface ReportData {
  month: string;
  year: string;
  openingBalance: number;
  transactions: Transaction[];
  penerimaanByCategory: { [key: string]: number };
  pembayaranByCategory: { [key: string]: number };
  totalPenerimaan: number;
  totalPembayaran: number;
  closingBalance: number;
  balance: number;
}

const MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Mac' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Jun' },
  { value: 7, label: 'Julai' },
  { value: 8, label: 'Ogos' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Disember' },
];

export default function BukuTunaiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState<number[]>([]);

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
  }, [session, selectedMonth, selectedYear]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/financial/reports/buku-tunai?month=${selectedMonth}&year=${selectedYear}`);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
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

  const monthName = MONTHS.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="container-fluid mt-4">
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { page-break-after: always; }
          body { margin: 0; }
          table { font-size: 9px; }
          @page { size: A4 landscape; margin: 10mm; }
        }
        .buku-tunai-table {
          font-size: 10px;
        }
        .buku-tunai-table th {
          background-color: #f8f9fa;
          padding: 4px 2px;
          text-align: center;
          vertical-align: middle;
          border: 1px solid #000;
          font-weight: 600;
          font-size: 9px;
        }
        .buku-tunai-table td {
          padding: 2px;
          border: 1px solid #000;
          vertical-align: middle;
          font-size: 8px;
        }
        .rotate-text {
          writing-mode: vertical-lr;
          transform: rotate(180deg);
          white-space: nowrap;
          padding: 2px;
          font-size: 8px;
        }
      `}</style>

      <div className="row mb-4 no-print">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">BR-KMS-002: Buku Tunai</h2>
              <p className="text-muted">Monthly cash book report</p>
            </div>
            <div className="d-flex gap-2">
              <select
                className="form-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{ width: 'auto' }}
              >
                {MONTHS.map((month) => (
                  <option key={month.value} value={month.value}>{month.label}</option>
                ))}
              </select>
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
        <div className="card-body p-2">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 className="mb-0">BUKU TUNAI</h5>
              <p className="mb-0" style={{ fontSize: '12px' }}>
                {monthName} {selectedYear}
              </p>
            </div>
            <div className="text-end" style={{ fontSize: '10px' }}>
              <strong>BR-KMS 002</strong>
            </div>
          </div>

          {reportData && (
            <div className="table-responsive">
              <table className="table table-bordered buku-tunai-table mb-0">
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ width: '50px' }}>Tarikh</th>
                    <th rowSpan={2} style={{ minWidth: '120px' }}>Butiran</th>
                    <th rowSpan={2} style={{ width: '50px' }}>No. Resit</th>
                    <th rowSpan={2} style={{ width: '50px' }}>No. Cek</th>
                    <th colSpan={7} className="text-center">PENERIMAAN</th>
                    <th colSpan={8} className="text-center">PEMBAYARAN</th>
                    <th rowSpan={2} style={{ width: '60px' }}>Baki RM</th>
                    <th rowSpan={2} style={{ width: '60px' }}>Jumlah</th>
                  </tr>
                  <tr>
                    {/* Penerimaan columns */}
                    <th style={{ width: '35px' }}><div className="rotate-text">Sumbangan am</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Sumbangan khas/amanah</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Perniagaan ekonomi</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Pelaburan dan pembangunan</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Dakwah dan kemasyarakatan</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Khidmat sosial</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Pelbagai</div></th>

                    {/* Pembayaran columns */}
                    <th style={{ width: '35px' }}><div className="rotate-text">Pentadbiran</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Pengurusan sumber manusia</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Pembangunan dan penyelenggaraan</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Dakwah dan pengamarahan</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Khidmat sosial dan kemasyarakatan</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Pembelian aset</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Perbelanjaan khas (amanah)</div></th>
                    <th style={{ width: '35px' }}><div className="rotate-text">Pelbagai</div></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Baris Baki Awal */}
                  <tr className="table-info">
                    <td></td>
                    <td className="fw-bold">BAKI AWAL</td>
                    <td></td>
                    <td></td>
                    {/* Penerimaan columns - empty */}
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    {/* Pembayaran columns - empty */}
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    {/* Baki column */}
                    <td className="text-end fw-bold">{formatCurrency(reportData.openingBalance)}</td>
                    <td></td>
                  </tr>
                  {reportData.transactions.length > 0 ? (
                    reportData.transactions.map((txn, index) => (
                      <tr key={index}>
                        <td>{formatDate(txn.transaction_date)}</td>
                        <td>{txn.transaction_description}</td>
                        <td className="text-center">
                          {txn.transaction_type === 'penerimaan' ? txn.customer_eft_no : ''}
                        </td>
                        <td className="text-center">
                          {txn.transaction_type === 'pembayaran' ? txn.ref_cheque_no : ''}
                        </td>

                        {/* Penerimaan columns */}
                        <td className="text-end">
                          {txn.transaction_type === 'penerimaan' && txn.category_penerimaan === 'Sumbangan Am' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'penerimaan' && txn.category_penerimaan === 'Sumbangan Khas (Amanah)' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'penerimaan' && txn.category_penerimaan === 'Hasil Sewaan/Penjanaan Ekonomi' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'penerimaan' && txn.category_penerimaan === 'Hibah Pelaburan' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'penerimaan' && txn.category_penerimaan === 'Dakwah dan Pengimarahan' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'penerimaan' && txn.category_penerimaan === 'Khidmat Sosial dan Kemasyarakatan' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'penerimaan' && txn.category_penerimaan === 'Pelbagai' ? formatCurrency(txn.amount) : ''}
                        </td>

                        {/* Pembayaran columns */}
                        <td className="text-end">
                          {txn.transaction_type === 'pembayaran' && txn.category_pembayaran === 'Pentadbiran' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'pembayaran' && txn.category_pembayaran === 'Pengurusan Sumber Manusia' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'pembayaran' && txn.category_pembayaran === 'Pembangunan dan Penyelenggaraan' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'pembayaran' && txn.category_pembayaran === 'Dakwah dan Pengimarahan' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'pembayaran' && txn.category_pembayaran === 'Khidmat Sosial dan Kemasyarakatan' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'pembayaran' && txn.category_pembayaran === 'Pembelian Aset' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'pembayaran' && txn.category_pembayaran === 'Perbelanjaan Khas (Amanah)' ? formatCurrency(txn.amount) : ''}
                        </td>
                        <td className="text-end">
                          {txn.transaction_type === 'pembayaran' && txn.category_pembayaran === 'Pelbagai' ? formatCurrency(txn.amount) : ''}
                        </td>

                        <td className="text-end fw-bold">
                          {formatCurrency(txn.running_balance)}
                        </td>
                        <td className="text-end">
                          {formatCurrency(txn.amount)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={21} className="text-center text-muted">
                        No transactions for this month
                      </td>
                    </tr>
                  )}

                  {/* Summary row */}
                  {reportData.transactions.length > 0 && (
                    <tr className="table-secondary fw-bold">
                      <td colSpan={4} className="text-end">JUMLAH:</td>
                      <td className="text-end">{formatCurrency(reportData.penerimaanByCategory['Sumbangan Am'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.penerimaanByCategory['Sumbangan Khas (Amanah)'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.penerimaanByCategory['Hasil Sewaan/Penjanaan Ekonomi'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.penerimaanByCategory['Hibah Pelaburan'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.penerimaanByCategory['Dakwah dan Pengimarahan'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.penerimaanByCategory['Khidmat Sosial dan Kemasyarakatan'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.penerimaanByCategory['Pelbagai'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.pembayaranByCategory['Pentadbiran'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.pembayaranByCategory['Pengurusan Sumber Manusia'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.pembayaranByCategory['Pembangunan dan Penyelenggaraan'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.pembayaranByCategory['Dakwah dan Pengimarahan'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.pembayaranByCategory['Khidmat Sosial dan Kemasyarakatan'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.pembayaranByCategory['Pembelian Aset'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.pembayaranByCategory['Perbelanjaan Khas (Amanah)'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.pembayaranByCategory['Pelbagai'] || 0)}</td>
                      <td className="text-end">{formatCurrency(reportData.closingBalance)}</td>
                      <td></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          <div className="mt-2" style={{ fontSize: '9px' }}>
            <p className="mb-0">
              <em>
                Perbutan salahguna kuasa penyelewengan dan mengemukan tuntutan palsu adalah kesalahan di bawah
                Akta Suruhanjaya Pencegahan Rasuah Malaysia 2009
              </em>
            </p>
          </div>
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
            <div className="card border-info">
              <div className="card-body">
                <h6 className="card-title text-info">Baki Akhir</h6>
                <h4 className="mb-0">RM {formatCurrency(reportData.closingBalance)}</h4>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
