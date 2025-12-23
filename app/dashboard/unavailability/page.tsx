'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UnavailabilityRecord {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  date: string;
  prayer_time: string;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export default function UnavailabilityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [records, setRecords] = useState<UnavailabilityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }

    // Only head_imam and admin can access
    if (session && !['head_imam', 'admin'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchUnavailability();
  }, []);

  const fetchUnavailability = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (filterName.trim() !== '') {
        params.append('user_name', filterName.trim());
      }
      if (filterStartDate) {
        params.append('start_date', filterStartDate);
      }
      if (filterEndDate) {
        params.append('end_date', filterEndDate);
      }

      const response = await fetch(`/api/availability/unavailability?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch unavailability records');
      }

      const data = await response.json();
      setRecords(data);
      setCurrentPage(1); // Reset to first page when filters change
    } catch (error) {
      console.error('Error fetching unavailability:', error);
      alert('Gagal memuat rekod ketidaktersediaan');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUnavailability();
  };

  const handleClearFilters = () => {
    setFilterName('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRoleBadgeClass = (role: string) => {
    return role === 'imam' ? 'bg-success' : 'bg-info';
  };

  const getPrayerTimeBadge = (prayerTime: string) => {
    const colors: { [key: string]: string } = {
      'Subuh': 'bg-primary',
      'Zohor': 'bg-warning text-dark',
      'Asar': 'bg-info',
      'Maghrib': 'bg-danger',
      'Isyak': 'bg-dark'
    };
    return colors[prayerTime] || 'bg-secondary';
  };

  // Pagination calculations
  const totalPages = Math.ceil(records.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRecords = records.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <div className="row mb-4">
        <div className="col">
          <div className="d-flex align-items-center gap-3 mb-2">
            <button className="btn btn-outline-secondary" onClick={() => router.back()}>
              <i className="bi bi-arrow-left me-2"></i>Kembali
            </button>
            <h2 className="mb-0">
              <i className="bi bi-calendar-x me-2"></i>
              Senarai Ketidaktersediaan
            </h2>
          </div>
          <p className="text-muted mb-0">Rekod ketidaktersediaan Imam dan Bilal</p>
        </div>
      </div>

      {/* Filter Form */}
      <div className="card mb-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="bi bi-funnel me-2"></i>
            Penapis
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleFilterSubmit}>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Nama</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Cari nama..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Tarikh Mula</label>
                <input
                  type="date"
                  className="form-control"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label">Tarikh Akhir</label>
                <input
                  type="date"
                  className="form-control"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <div className="btn-group w-100">
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-search me-1"></i>
                    Cari
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleClearFilters}
                    title="Padam penapis"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Results Summary */}
      <div className="alert alert-info d-flex align-items-center" role="alert">
        <i className="bi bi-info-circle me-2"></i>
        <div>
          Jumlah rekod: <strong>{records.length}</strong>
          {records.length > itemsPerPage && (
            <span className="ms-2">
              (Menunjukkan {startIndex + 1} - {Math.min(endIndex, records.length)})
            </span>
          )}
        </div>
      </div>

      {/* Unavailability Table */}
      <div className="card">
        <div className="card-body">
          {records.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <p className="text-muted mt-3">Tiada rekod ketidaktersediaan dijumpai</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '5%' }}>Bil</th>
                      <th style={{ width: '20%' }}>Nama</th>
                      <th style={{ width: '10%' }}>Jawatan</th>
                      <th style={{ width: '12%' }}>Tarikh</th>
                      <th style={{ width: '10%' }}>Waktu Solat</th>
                      <th style={{ width: '43%' }}>Sebab</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((record, index) => (
                      <tr key={record.id}>
                        <td>{startIndex + index + 1}</td>
                        <td>
                          <strong>{record.user_name}</strong>
                        </td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(record.user_role)}`}>
                            {record.user_role === 'imam' ? 'Imam' : 'Bilal'}
                          </span>
                        </td>
                        <td>{formatDate(record.date)}</td>
                        <td>
                          <span className={`badge ${getPrayerTimeBadge(record.prayer_time)}`}>
                            {record.prayer_time}
                          </span>
                        </td>
                        <td>
                          {record.reason ? (
                            <span className="text-muted">{record.reason}</span>
                          ) : (
                            <em className="text-muted">Tiada sebab dinyatakan</em>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Page navigation" className="mt-3">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          page === currentPage ||
                          page === currentPage - 1 ||
                          page === currentPage + 1 ||
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis if there's a gap
                        const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;

                        return (
                          <div key={page} className="d-inline">
                            {showEllipsisBefore && (
                              <li className="page-item disabled">
                                <span className="page-link">...</span>
                              </li>
                            )}
                            <li className={`page-item ${currentPage === page ? 'active' : ''}`}>
                              <button
                                className="page-link"
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          </div>
                        );
                      })}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
