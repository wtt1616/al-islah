'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KhairatAhli, KhairatBayaran } from '@/types';

interface KhairatAhliWithCount extends KhairatAhli {
  tanggungan_count: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatusCounts {
  semua: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface ModulePermission {
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

type MainTab = 'keahlian' | 'bayaran';

export default function AdminKhairatPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  // Main tab state
  const [mainTab, setMainTab] = useState<MainTab>('keahlian');

  // Keahlian state
  const [applications, setApplications] = useState<KhairatAhliWithCount[]>([]);
  const [keahlianLoading, setKeahlianLoading] = useState(true);
  const [keahlianStatusFilter, setKeahlianStatusFilter] = useState('semua');
  const [keahlianSearch, setKeahlianSearch] = useState('');
  const [keahlianPagination, setKeahlianPagination] = useState<PaginationData>({
    page: 1, limit: 20, total: 0, totalPages: 0
  });
  const [keahlianCounts, setKeahlianCounts] = useState<StatusCounts>({
    semua: 0, pending: 0, approved: 0, rejected: 0
  });

  // Bayaran state
  const [payments, setPayments] = useState<KhairatBayaran[]>([]);
  const [bayaranLoading, setBayaranLoading] = useState(true);
  const [bayaranError, setBayaranError] = useState<string | null>(null);
  const [bayaranStatusFilter, setBayaranStatusFilter] = useState('semua');
  const [bayaranSearch, setBayaranSearch] = useState('');
  const [bayaranPagination, setBayaranPagination] = useState<PaginationData>({
    page: 1, limit: 20, total: 0, totalPages: 0
  });
  const [bayaranCounts, setBayaranCounts] = useState<StatusCounts>({
    semua: 0, pending: 0, approved: 0, rejected: 0
  });

  // Delete modal state
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: number | null; nama: string; type: 'keahlian' | 'bayaran' }>({
    show: false, id: null, nama: '', type: 'keahlian'
  });
  const [deleting, setDeleting] = useState(false);

  // Approval modal state (for bayaran)
  const [approvalModal, setApprovalModal] = useState<{
    show: boolean;
    payment: KhairatBayaran | null;
    action: 'approve' | 'reject';
  }>({ show: false, payment: null, action: 'approve' });
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Permissions state
  const [permissions, setPermissions] = useState<ModulePermission | null>(null);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  // Fetch permissions for current user's role
  useEffect(() => {
    if (session?.user?.role) {
      fetchPermissions(session.user.role);
    }
  }, [session]);

  const fetchPermissions = async (role: string) => {
    try {
      const response = await fetch(`/api/permissions?role=${encodeURIComponent(role)}&module_id=khairat`);
      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          setPermissions(data.data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
    }
  };

  // Fetch counts for both tabs on initial load
  useEffect(() => {
    if (session) {
      fetchBayaranCounts();
    }
  }, [session]);

  useEffect(() => {
    if (session && mainTab === 'keahlian') {
      fetchApplications();
    }
  }, [session, mainTab, keahlianStatusFilter, keahlianPagination.page]);

  useEffect(() => {
    if (session && mainTab === 'bayaran') {
      fetchPayments();
    }
  }, [session, mainTab, bayaranStatusFilter, bayaranPagination.page]);

  // Fetch only bayaran counts (for tab badge)
  const fetchBayaranCounts = async () => {
    try {
      const response = await fetch('/api/khairat/bayaran?limit=1', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setBayaranCounts(data.counts);
      }
    } catch (error) {
      console.error('Error fetching bayaran counts:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setKeahlianLoading(true);
      const params = new URLSearchParams({
        status: keahlianStatusFilter,
        page: keahlianPagination.page.toString(),
        limit: keahlianPagination.limit.toString()
      });

      if (keahlianSearch) {
        params.append('search', keahlianSearch);
      }

      const response = await fetch(`/api/khairat?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setApplications(data.data);
      setKeahlianPagination(data.pagination);
      setKeahlianCounts(data.counts);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setKeahlianLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      setBayaranLoading(true);
      setBayaranError(null);
      const params = new URLSearchParams({
        status: bayaranStatusFilter,
        page: bayaranPagination.page.toString(),
        limit: bayaranPagination.limit.toString()
      });

      if (bayaranSearch) {
        params.append('search', bayaranSearch);
      }

      const response = await fetch(`/api/khairat/bayaran?${params}`, {
        credentials: 'include',
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setPayments(data.data || []);
      setBayaranPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      setBayaranCounts(data.counts || { semua: 0, pending: 0, approved: 0, rejected: 0 });
    } catch (error: any) {
      console.error('Error fetching payments:', error);
      setBayaranError(error.message || 'Gagal memuatkan senarai pembayaran');
    } finally {
      setBayaranLoading(false);
    }
  };

  const handleKeahlianSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeahlianPagination(prev => ({ ...prev, page: 1 }));
    fetchApplications();
  };

  const handleBayaranSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setBayaranPagination(prev => ({ ...prev, page: 1 }));
    fetchPayments();
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;

    setDeleting(true);
    try {
      const endpoint = deleteModal.type === 'keahlian'
        ? `/api/khairat/${deleteModal.id}`
        : `/api/khairat/bayaran/${deleteModal.id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Gagal memadam rekod');
      }

      // Refresh the list
      if (deleteModal.type === 'keahlian') {
        fetchApplications();
      } else {
        fetchPayments();
      }
      setDeleteModal({ show: false, id: null, nama: '', type: 'keahlian' });
    } catch (error: any) {
      alert(error.message || 'Gagal memadam rekod');
    } finally {
      setDeleting(false);
    }
  };

  const handlePaymentAction = async () => {
    if (!approvalModal.payment) return;

    if (approvalModal.action === 'reject' && !rejectReason.trim()) {
      alert('Sila masukkan sebab penolakan');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/khairat/bayaran/${approvalModal.payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approvalModal.action,
          reject_reason: rejectReason
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Gagal memproses pembayaran');
      }

      // Refresh the list
      fetchPayments();
      setApprovalModal({ show: false, payment: null, action: 'approve' });
      setRejectReason('');
    } catch (error: any) {
      alert(error.message || 'Gagal memproses pembayaran');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string | Date | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning text-dark">Menunggu</span>;
      case 'approved':
        return <span className="badge bg-success">Diluluskan</span>;
      case 'rejected':
        return <span className="badge bg-danger">Ditolak</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const getJenisYuranLabel = (jenis: string) => {
    switch (jenis) {
      case 'keahlian': return 'Keahlian';
      case 'tahunan': return 'Tahunan';
      case 'isteri_kedua': return 'Isteri Kedua';
      default: return jenis;
    }
  };

  if (sessionStatus === 'loading') {
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

  // Check access based on permissions (if loaded) or fallback to role check
  if (!session || (permissions !== null && !permissions.can_view)) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Anda tidak mempunyai akses ke halaman ini.</div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-outline-secondary" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-2"></i>Kembali
          </button>
          <div>
            <h4 className="mb-0">
              <i className="bi bi-people me-2"></i>
              Pengurusan Khairat Kematian
            </h4>
            <small className="text-muted">Urus permohonan keahlian dan pembayaran yuran tahunan</small>
          </div>
        </div>
        <div className="d-flex gap-2">
          <Link href="/dashboard/khairat-upload" className="btn btn-success">
            <i className="bi bi-cloud-upload me-2"></i>
            Muat Naik Data Excel
          </Link>
          <Link href="/khairat/daftar" target="_blank" className="btn btn-outline-primary">
            <i className="bi bi-box-arrow-up-right me-2"></i>
            Lihat Borang Awam
          </Link>
        </div>
      </div>

      {/* Main Tabs */}
      <ul className="nav nav-pills mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${mainTab === 'keahlian' ? 'active' : ''}`}
            onClick={() => setMainTab('keahlian')}
          >
            <i className="bi bi-person-plus me-2"></i>
            Permohonan Keahlian
            <span className={`badge ms-2 ${keahlianCounts.pending > 0 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
              {keahlianCounts.pending}
            </span>
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${mainTab === 'bayaran' ? 'active' : ''}`}
            onClick={() => setMainTab('bayaran')}
          >
            <i className="bi bi-credit-card me-2"></i>
            Pembayaran Yuran Tahunan
            <span className={`badge ms-2 ${bayaranCounts.pending > 0 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
              {bayaranCounts.pending}
            </span>
          </button>
        </li>
      </ul>

      {/* Keahlian Tab Content */}
      {mainTab === 'keahlian' && (
        <>
          {/* Search Bar */}
          <div className="card mb-4">
            <div className="card-body">
              <form onSubmit={handleKeahlianSearch} className="row g-3 align-items-end">
                <div className="col-md-8">
                  <label className="form-label">Carian</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cari nama atau no. telefon..."
                    value={keahlianSearch}
                    onChange={(e) => setKeahlianSearch(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-search me-2"></i>Cari
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <ul className="nav nav-tabs mb-4">
            {[
              { key: 'semua', label: 'Semua' },
              { key: 'pending', label: 'Menunggu' },
              { key: 'approved', label: 'Diluluskan' },
              { key: 'rejected', label: 'Ditolak' }
            ].map((tab) => (
              <li className="nav-item" key={tab.key}>
                <button
                  className={`nav-link ${keahlianStatusFilter === tab.key ? 'active' : ''}`}
                  onClick={() => {
                    setKeahlianStatusFilter(tab.key);
                    setKeahlianPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  {tab.label}
                  <span className={`badge ms-2 ${
                    tab.key === 'pending' ? 'bg-warning text-dark' :
                    keahlianStatusFilter === tab.key ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {keahlianCounts[tab.key as keyof StatusCounts]}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Applications List */}
          <div className="card">
            <div className="card-body">
              {keahlianLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-3">Tiada permohonan dijumpai</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '5%' }}>Bil</th>
                        <th style={{ width: '18%' }}>Nama</th>
                        <th style={{ width: '12%' }}>No. K/P</th>
                        <th style={{ width: '12%' }}>No. H/P</th>
                        <th style={{ width: '10%' }}>Jenis Yuran</th>
                        <th style={{ width: '8%' }}>No. Resit</th>
                        <th style={{ width: '8%' }}>Tanggungan</th>
                        <th style={{ width: '10%' }}>Status</th>
                        <th style={{ width: '10%' }}>Tarikh</th>
                        <th style={{ width: '7%' }}>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app, index) => (
                        <tr key={app.id} className={app.status === 'pending' ? 'table-warning' : ''}>
                          <td>{(keahlianPagination.page - 1) * keahlianPagination.limit + index + 1}</td>
                          <td>
                            <strong>{app.nama}</strong>
                            {app.email && (
                              <><br /><small className="text-muted">{app.email}</small></>
                            )}
                          </td>
                          <td>{app.no_kp}</td>
                          <td>{app.no_hp}</td>
                          <td>
                            <span className="badge bg-info text-dark">
                              {getJenisYuranLabel(app.jenis_yuran)}
                            </span>
                          </td>
                          <td>{app.no_resit || '-'}</td>
                          <td className="text-center">
                            <span className="badge bg-secondary">{app.tanggungan_count}</span>
                          </td>
                          <td>{getStatusBadge(app.status)}</td>
                          <td>
                            <small>{formatDate(app.tarikh_daftar || app.created_at)}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              <Link
                                href={`/dashboard/khairat/${app.id}`}
                                className="btn btn-sm btn-primary"
                              >
                                <i className="bi bi-eye"></i>
                              </Link>
                              {permissions?.can_delete && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => setDeleteModal({ show: true, id: app.id, nama: app.nama, type: 'keahlian' })}
                                  title="Padam rekod"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {keahlianPagination.totalPages > 1 && (
                <nav className="mt-3">
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${keahlianPagination.page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setKeahlianPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={keahlianPagination.page === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    {Array.from({ length: keahlianPagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${keahlianPagination.page === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setKeahlianPagination(prev => ({ ...prev, page }))}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${keahlianPagination.page === keahlianPagination.totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setKeahlianPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={keahlianPagination.page === keahlianPagination.totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </>
      )}

      {/* Bayaran Tab Content */}
      {mainTab === 'bayaran' && (
        <>
          {/* Search Bar */}
          <div className="card mb-4">
            <div className="card-body">
              <form onSubmit={handleBayaranSearch} className="row g-3 align-items-end">
                <div className="col-md-8">
                  <label className="form-label">Carian</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cari nama atau no. telefon..."
                    value={bayaranSearch}
                    onChange={(e) => setBayaranSearch(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <button type="submit" className="btn btn-primary w-100">
                    <i className="bi bi-search me-2"></i>Cari
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <ul className="nav nav-tabs mb-4">
            {[
              { key: 'semua', label: 'Semua' },
              { key: 'pending', label: 'Menunggu' },
              { key: 'approved', label: 'Diluluskan' },
              { key: 'rejected', label: 'Ditolak' }
            ].map((tab) => (
              <li className="nav-item" key={tab.key}>
                <button
                  className={`nav-link ${bayaranStatusFilter === tab.key ? 'active' : ''}`}
                  onClick={() => {
                    setBayaranStatusFilter(tab.key);
                    setBayaranPagination(prev => ({ ...prev, page: 1 }));
                  }}
                >
                  {tab.label}
                  <span className={`badge ms-2 ${
                    tab.key === 'pending' ? 'bg-warning text-dark' :
                    bayaranStatusFilter === tab.key ? 'bg-primary' : 'bg-secondary'
                  }`}>
                    {bayaranCounts[tab.key as keyof StatusCounts]}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Payments List */}
          <div className="card">
            <div className="card-body">
              {bayaranLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : bayaranError ? (
                <div className="alert alert-danger">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {bayaranError}
                  <button className="btn btn-sm btn-outline-danger ms-3" onClick={() => fetchPayments()}>
                    Cuba Semula
                  </button>
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                  <p className="text-muted mt-3">Tiada pembayaran dijumpai</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '5%' }}>Bil</th>
                        <th style={{ width: '18%' }}>Nama Ahli</th>
                        <th style={{ width: '12%' }}>No. K/P</th>
                        <th style={{ width: '12%' }}>Tahun Bayaran</th>
                        <th style={{ width: '8%' }}>Jenis</th>
                        <th style={{ width: '10%' }}>Amaun (RM)</th>
                        <th style={{ width: '10%' }}>No. Resit</th>
                        <th style={{ width: '10%' }}>Status</th>
                        <th style={{ width: '8%' }}>Tarikh</th>
                        <th style={{ width: '7%' }}>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment, index) => (
                        <tr key={payment.id} className={payment.status === 'pending' ? 'table-warning' : ''}>
                          <td>{(bayaranPagination.page - 1) * bayaranPagination.limit + index + 1}</td>
                          <td>
                            <strong>{payment.nama_ahli}</strong>
                            <br />
                            <small className="text-muted">{payment.no_hp_ahli}</small>
                          </td>
                          <td>{payment.no_kp_ahli}</td>
                          <td><strong>{payment.tahun}</strong></td>
                          <td>
                            <span className={`badge ${payment.jenis_bayaran === 'tunggakan' ? 'bg-warning text-dark' : 'bg-info text-dark'}`}>
                              {payment.jenis_bayaran === 'tunggakan' ? 'Tunggakan' : 'Tahunan'}
                            </span>
                          </td>
                          <td>{Number(payment.amaun).toFixed(2)}</td>
                          <td>{payment.no_resit || '-'}</td>
                          <td>{getStatusBadge(payment.status)}</td>
                          <td>
                            <small>{formatDate(payment.tarikh_bayar || payment.created_at)}</small>
                          </td>
                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              {payment.status === 'pending' && (
                                <>
                                  <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => setApprovalModal({ show: true, payment, action: 'approve' })}
                                    title="Luluskan"
                                  >
                                    <i className="bi bi-check-lg"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => setApprovalModal({ show: true, payment, action: 'reject' })}
                                    title="Tolak"
                                  >
                                    <i className="bi bi-x-lg"></i>
                                  </button>
                                </>
                              )}
                              {payment.resit_file && (
                                <a
                                  href={payment.resit_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-sm btn-outline-primary"
                                  title="Lihat Resit"
                                >
                                  <i className="bi bi-file-earmark-image"></i>
                                </a>
                              )}
                              {permissions?.can_delete && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setDeleteModal({ show: true, id: payment.id, nama: `${payment.nama_ahli} - Tahun ${payment.tahun}`, type: 'bayaran' })}
                                  title="Padam"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {bayaranPagination.totalPages > 1 && (
                <nav className="mt-3">
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${bayaranPagination.page === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setBayaranPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={bayaranPagination.page === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>
                    {Array.from({ length: bayaranPagination.totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${bayaranPagination.page === page ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setBayaranPagination(prev => ({ ...prev, page }))}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${bayaranPagination.page === bayaranPagination.totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setBayaranPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={bayaranPagination.page === bayaranPagination.totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Pengesahan Padam
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setDeleteModal({ show: false, id: null, nama: '', type: 'keahlian' })}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                <p>Adakah anda pasti untuk memadam rekod berikut?</p>
                <div className="alert alert-warning">
                  <strong>{deleteModal.nama}</strong>
                </div>
                <p className="text-danger mb-0">
                  <i className="bi bi-exclamation-circle me-1"></i>
                  Tindakan ini tidak boleh dibatalkan.
                  {deleteModal.type === 'keahlian' && ' Semua data tanggungan juga akan dipadam.'}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteModal({ show: false, id: null, nama: '', type: 'keahlian' })}
                  disabled={deleting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Memadam...</>
                  ) : (
                    <><i className="bi bi-trash me-2"></i>Ya, Padam</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval/Rejection Modal */}
      {approvalModal.show && approvalModal.payment && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className={`modal-header ${approvalModal.action === 'approve' ? 'bg-success' : 'bg-danger'} text-white`}>
                <h5 className="modal-title">
                  <i className={`bi ${approvalModal.action === 'approve' ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                  {approvalModal.action === 'approve' ? 'Luluskan Pembayaran' : 'Tolak Pembayaran'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => { setApprovalModal({ show: false, payment: null, action: 'approve' }); setRejectReason(''); }}
                  disabled={processing}
                ></button>
              </div>
              <div className="modal-body">
                <div className="card bg-light mb-3">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-6">
                        <small className="text-muted">Nama Ahli</small>
                        <p className="fw-bold mb-2">{approvalModal.payment.nama_ahli}</p>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Tahun Yuran</small>
                        <p className="fw-bold mb-2">{approvalModal.payment.tahun}</p>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">Amaun</small>
                        <p className="fw-bold mb-0">RM {Number(approvalModal.payment.amaun).toFixed(2)}</p>
                      </div>
                      <div className="col-6">
                        <small className="text-muted">No. Resit</small>
                        <p className="fw-bold mb-0">{approvalModal.payment.no_resit || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {approvalModal.payment.resit_file && (
                  <div className="mb-3">
                    <a
                      href={approvalModal.payment.resit_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline-primary w-100"
                    >
                      <i className="bi bi-file-earmark-image me-2"></i>
                      Lihat Bukti Pembayaran
                    </a>
                  </div>
                )}

                {approvalModal.action === 'approve' ? (
                  <div className="alert alert-success mb-0">
                    <i className="bi bi-info-circle me-2"></i>
                    Notifikasi kelulusan akan dihantar kepada ahli melalui WhatsApp/Email.
                  </div>
                ) : (
                  <div className="mb-0">
                    <label className="form-label">Sebab Penolakan <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Nyatakan sebab penolakan..."
                      disabled={processing}
                    ></textarea>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setApprovalModal({ show: false, payment: null, action: 'approve' }); setRejectReason(''); }}
                  disabled={processing}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className={`btn ${approvalModal.action === 'approve' ? 'btn-success' : 'btn-danger'}`}
                  onClick={handlePaymentAction}
                  disabled={processing || (approvalModal.action === 'reject' && !rejectReason.trim())}
                >
                  {processing ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Memproses...</>
                  ) : approvalModal.action === 'approve' ? (
                    <><i className="bi bi-check-lg me-2"></i>Luluskan</>
                  ) : (
                    <><i className="bi bi-x-lg me-2"></i>Tolak</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
