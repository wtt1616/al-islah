'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  year: number;
  summary: {
    openingBalance: number;
    totalPenerimaan: number;
    totalPembayaran: number;
    closingBalance: number;
    danaWakaf: number;
    avgPenerimaan: number;
    avgPembayaran: number;
  };
  monthlyBreakdown: {
    month: number;
    penerimaan: number;
    pembayaran: number;
  }[];
  penerimaanByCategory: {
    category: string;
    total: number;
    percentage: string;
  }[];
  pembayaranByCategory: {
    category: string;
    total: number;
    percentage: string;
  }[];
  highlights: {
    highestPenerimaan: {
      category: string;
      total: number;
      percentage: string;
    };
    highestPembayaran: {
      category: string;
      total: number;
      percentage: string;
    };
  };
}

const monthNames = ['JAN', 'FEB', 'MAC', 'APR', 'MEI', 'JUN', 'JUL', 'OGO', 'SEP', 'OKT', 'NOV', 'DIS'];
const monthNamesFull = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];

export default function FinancialDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && !['admin', 'bendahari', 'head_imam'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session, selectedYear]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/financial/dashboard-stats?year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatK = (value: number) => {
    if (value >= 1000) {
      return `${Math.round(value / 1000)} K`;
    }
    return value.toFixed(0);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Chart data for Penerimaan
  const penerimaanChartData = {
    labels: monthNames,
    datasets: [
      {
        label: 'Penerimaan (RM)',
        data: stats?.monthlyBreakdown.map(m => m.penerimaan) || [],
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      }
    ]
  };

  // Chart data for Pembayaran
  const pembayaranChartData = {
    labels: monthNames,
    datasets: [
      {
        label: 'Pembayaran (RM)',
        data: stats?.monthlyBreakdown.map(m => m.pembayaran) || [],
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#0ea5e9',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `RM ${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatK(value)
        }
      }
    }
  };

  // Horizontal bar chart for categories
  const penerimaanCategoryData = {
    labels: stats?.penerimaanByCategory.slice(0, 8).map(c => c.category) || [],
    datasets: [
      {
        label: 'RM',
        data: stats?.penerimaanByCategory.slice(0, 8).map(c => c.total) || [],
        backgroundColor: '#0ea5e9',
        borderRadius: 4,
      }
    ]
  };

  const pembayaranCategoryData = {
    labels: stats?.pembayaranByCategory.slice(0, 8).map(c => c.category) || [],
    datasets: [
      {
        label: 'RM',
        data: stats?.pembayaranByCategory.slice(0, 8).map(c => c.total) || [],
        backgroundColor: '#0ea5e9',
        borderRadius: 4,
      }
    ]
  };

  const horizontalBarOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `RM ${formatCurrency(context.raw)}`
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => formatK(value)
        }
      }
    }
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f0f4f8' }}>
      <Navbar />

      <div className="container-fluid mt-4 px-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1" style={{ color: '#0c4a6e' }}>
              <i className="bi bi-graph-up-arrow me-2"></i>
              Ringkasan Penyata Penerimaan & Pembayaran
            </h2>
            <p className="text-muted mb-0">
              {monthNamesFull[0]} - {monthNamesFull[11]} {selectedYear}
            </p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              style={{ width: '120px' }}
            >
              {[2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <button
              className="btn btn-outline-primary"
              onClick={() => router.push('/financial')}
            >
              <i className="bi bi-arrow-left me-1"></i>
              Kembali
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row g-3 mb-4">
          {/* Baki Awal */}
          <div className="col-12 col-md-6 col-lg">
            <div className="card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
              <div className="card-body text-white text-center py-4">
                <div className="mb-2">
                  <i className="bi bi-calendar-date" style={{ fontSize: '1.5rem', opacity: 0.8 }}></i>
                </div>
                <p className="mb-1 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px', opacity: 0.8 }}>
                  Baki Buku Tunai<br />1 Jan {selectedYear}
                </p>
                <h3 className="mb-0 fw-bold">
                  <span style={{ fontSize: '0.9rem' }}>RM</span><br />
                  {formatCurrency(stats?.summary.openingBalance || 0)}
                </h3>
              </div>
            </div>
          </div>

          {/* Jumlah Penerimaan */}
          <div className="col-12 col-md-6 col-lg">
            <div className="card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
              <div className="card-body text-center py-4">
                <div className="mb-2">
                  <i className="bi bi-arrow-down-circle-fill text-success" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <p className="mb-1 text-uppercase text-muted" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                  Jumlah<br />Penerimaan
                </p>
                <h3 className="mb-0 fw-bold text-success">
                  <span style={{ fontSize: '0.9rem' }}>RM</span><br />
                  {formatCurrency(stats?.summary.totalPenerimaan || 0)}
                </h3>
              </div>
            </div>
          </div>

          {/* Jumlah Pembayaran */}
          <div className="col-12 col-md-6 col-lg">
            <div className="card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
              <div className="card-body text-center py-4">
                <div className="mb-2">
                  <i className="bi bi-arrow-up-circle-fill text-danger" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <p className="mb-1 text-uppercase text-muted" style={{ fontSize: '0.7rem', letterSpacing: '1px' }}>
                  Jumlah<br />Pembayaran
                </p>
                <h3 className="mb-0 fw-bold text-danger">
                  <span style={{ fontSize: '0.9rem' }}>RM</span><br />
                  {formatCurrency(stats?.summary.totalPembayaran || 0)}
                </h3>
              </div>
            </div>
          </div>

          {/* Baki Akhir */}
          <div className="col-12 col-md-6 col-lg">
            <div className="card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' }}>
              <div className="card-body text-white text-center py-4">
                <div className="mb-2">
                  <i className="bi bi-wallet2" style={{ fontSize: '1.5rem', opacity: 0.8 }}></i>
                </div>
                <p className="mb-1 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px', opacity: 0.8 }}>
                  Baki Buku Tunai<br />31 Dis {selectedYear}
                </p>
                <h3 className="mb-0 fw-bold">
                  <span style={{ fontSize: '0.9rem' }}>RM</span><br />
                  {formatCurrency(stats?.summary.closingBalance || 0)}
                </h3>
              </div>
            </div>
          </div>

          {/* Dana Wakaf */}
          <div className="col-12 col-md-6 col-lg">
            <div className="card h-100 border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}>
              <div className="card-body text-white text-center py-4">
                <div className="mb-2">
                  <i className="bi bi-house-heart" style={{ fontSize: '1.5rem', opacity: 0.9 }}></i>
                </div>
                <p className="mb-1 text-uppercase" style={{ fontSize: '0.7rem', letterSpacing: '1px', opacity: 0.9 }}>
                  Sumbangan<br />Dana Wakaf
                </p>
                <h3 className="mb-0 fw-bold">
                  <span style={{ fontSize: '0.9rem' }}>RM</span><br />
                  {formatCurrency(stats?.summary.danaWakaf || 0)}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="row g-4 mb-4">
          {/* Penerimaan Chart */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="mb-1" style={{ color: '#f97316' }}>
                      <i className="bi bi-graph-up me-2"></i>TERIMAAN
                    </h5>
                  </div>
                  <div className="text-end">
                    <small className="text-muted">Purata bulanan bagi terimaan</small>
                    <h4 className="mb-0" style={{ color: '#f97316' }}>
                      RM {formatK(stats?.summary.avgPenerimaan || 0)} <small className="text-muted">sebulan</small>
                    </h4>
                  </div>
                </div>
                <div style={{ height: '250px' }}>
                  <Line data={penerimaanChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Pembayaran Chart */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="mb-1" style={{ color: '#0ea5e9' }}>
                      <i className="bi bi-graph-down me-2"></i>PEMBAYARAN
                    </h5>
                  </div>
                  <div className="text-end">
                    <small className="text-muted">Purata bulanan bagi pembayaran</small>
                    <h4 className="mb-0" style={{ color: '#0ea5e9' }}>
                      RM {formatK(stats?.summary.avgPembayaran || 0)} <small className="text-muted">sebulan</small>
                    </h4>
                  </div>
                </div>
                <div style={{ height: '250px' }}>
                  <Line data={pembayaranChartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Row */}
        <div className="row g-4 mb-4">
          {/* Penerimaan by Category */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="mb-1" style={{ color: '#0ea5e9' }}>
                      TERIMAAN
                    </h5>
                    <p className="text-muted mb-0">Mengikut Kategori</p>
                  </div>
                  <div className="text-end">
                    <span className="badge" style={{ background: '#0ea5e9', fontSize: '0.75rem' }}>
                      JAN-DIS {selectedYear}
                    </span>
                    <div className="mt-2">
                      <small className="text-muted">Kategori</small>
                      <div style={{ color: '#0ea5e9', fontWeight: 'bold' }}>
                        {stats?.highlights.highestPenerimaan.category}
                      </div>
                      <small className="text-muted">terimaan tertinggi sebanyak</small>
                      <h3 style={{ color: '#0ea5e9' }}>{stats?.highlights.highestPenerimaan.percentage}%</h3>
                    </div>
                  </div>
                </div>
                <div style={{ height: '300px' }}>
                  <Bar data={penerimaanCategoryData} options={horizontalBarOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Pembayaran by Category */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="mb-1" style={{ color: '#0ea5e9' }}>
                      PEMBAYARAN
                    </h5>
                    <p className="text-muted mb-0">Mengikut Kategori</p>
                  </div>
                  <div className="text-end">
                    <span className="badge" style={{ background: '#0ea5e9', fontSize: '0.75rem' }}>
                      JAN-DIS {selectedYear}
                    </span>
                    <div className="mt-2">
                      <small className="text-muted">Kategori</small>
                      <div style={{ color: '#0ea5e9', fontWeight: 'bold' }}>
                        {stats?.highlights.highestPembayaran.category}
                      </div>
                      <small className="text-muted">pembayaran tertinggi sebanyak</small>
                      <h3 style={{ color: '#0ea5e9' }}>{stats?.highlights.highestPembayaran.percentage}%</h3>
                    </div>
                  </div>
                </div>
                <div style={{ height: '300px' }}>
                  <Bar data={pembayaranCategoryData} options={horizontalBarOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tables */}
        <div className="row g-4 mb-4">
          {/* Penerimaan Table */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h6 className="mb-0">
                  <i className="bi bi-list-ul me-2 text-success"></i>
                  Senarai Penerimaan Mengikut Kategori
                </h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Kategori</th>
                        <th className="text-end">Jumlah (RM)</th>
                        <th className="text-end">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.penerimaanByCategory.map((cat, idx) => (
                        <tr key={idx}>
                          <td>{cat.category}</td>
                          <td className="text-end">{formatCurrency(cat.total)}</td>
                          <td className="text-end">
                            <span className="badge bg-success">{cat.percentage}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th>Jumlah</th>
                        <th className="text-end">{formatCurrency(stats?.summary.totalPenerimaan || 0)}</th>
                        <th className="text-end">100%</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Pembayaran Table */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h6 className="mb-0">
                  <i className="bi bi-list-ul me-2 text-danger"></i>
                  Senarai Pembayaran Mengikut Kategori
                </h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Kategori</th>
                        <th className="text-end">Jumlah (RM)</th>
                        <th className="text-end">%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.pembayaranByCategory.map((cat, idx) => (
                        <tr key={idx}>
                          <td>{cat.category}</td>
                          <td className="text-end">{formatCurrency(cat.total)}</td>
                          <td className="text-end">
                            <span className="badge bg-danger">{cat.percentage}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <th>Jumlah</th>
                        <th className="text-end">{formatCurrency(stats?.summary.totalPembayaran || 0)}</th>
                        <th className="text-end">100%</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
