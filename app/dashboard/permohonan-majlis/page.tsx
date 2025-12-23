'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface PermohonanMajlis {
  id: number;
  nama_pemohon: string;
  no_kad_pengenalan: string;
  alamat: string;
  no_telefon_rumah: string | null;
  no_handphone: string;
  tajuk_majlis: string;
  tarikh_majlis: string;
  hari_majlis: string;
  masa_majlis: string;
  waktu_majlis: 'pagi' | 'petang' | 'malam';
  jumlah_jemputan: number;
  peralatan: string[];
  peralatan_lain: string | null;
  bersetuju_terma: boolean;
  tarikh_permohonan: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: number | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const PERALATAN_MAP: { [key: string]: string } = {
  meja_makan: 'Meja Makan',
  kerusi_makan: 'Kerusi Makan',
  pa_system: 'PA System',
  pinggan: 'Pinggan',
  gelas: 'Gelas',
  perkhidmatan_katering: 'Perkhidmatan Katering',
};

export default function PermohonanMajlisAdminPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [permohonan, setPermohonan] = useState<PermohonanMajlis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 0 });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedPermohonan, setSelectedPermohonan] = useState<PermohonanMajlis | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (session) {
      fetchPermohonan();
    }
  }, [session, statusFilter, pagination.page]);

  const fetchPermohonan = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/permohonan-majlis?status=${statusFilter}&page=${pagination.page}&limit=${pagination.limit}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setPermohonan(data.data || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (err: any) {
      setError(err.message || 'Gagal memuatkan data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning text-dark">Menunggu Kelulusan</span>;
      case 'approved':
        return <span className="badge bg-success">Diluluskan</span>;
      case 'rejected':
        return <span className="badge bg-danger">Ditolak</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  const openDetailModal = (item: PermohonanMajlis) => {
    setSelectedPermohonan(item);
    setRejectionReason('');
    setShowModal(true);
  };

  const handleUpdateStatus = async (newStatus: 'approved' | 'rejected') => {
    if (!selectedPermohonan) return;

    if (newStatus === 'rejected' && !rejectionReason.trim()) {
      setError('Sila nyatakan sebab penolakan');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const res = await fetch('/api/permohonan-majlis', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPermohonan.id,
          status: newStatus,
          rejection_reason: newStatus === 'rejected' ? rejectionReason : null
        })
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSuccess(`Permohonan berjaya ${newStatus === 'approved' ? 'diluluskan' : 'ditolak'}`);
      setShowModal(false);
      fetchPermohonan();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengemaskini status');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam permohonan ini?')) return;

    try {
      const res = await fetch(`/api/permohonan-majlis?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setSuccess('Permohonan berjaya dipadam');
      fetchPermohonan();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal memadam permohonan');
    }
  };

  if (authStatus === 'loading' || loading) {
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

  if (!session || !['admin', 'head_imam'].includes(session.user.role)) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Anda tidak mempunyai akses ke halaman ini.</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => router.push('/dashboard')}
          >
            &larr; Kembali
          </button>
          <h4 className="mb-0">Pengurusan Permohonan Majlis</h4>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filter Tabs */}
      <ul className="nav nav-tabs mb-4">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'pending', label: 'Menunggu' },
          { key: 'approved', label: 'Diluluskan' },
          { key: 'rejected', label: 'Ditolak' }
        ].map(tab => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(tab.key);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Tarikh Permohonan</th>
                  <th>Nama Pemohon</th>
                  <th>Tajuk Majlis</th>
                  <th>Tarikh Majlis</th>
                  <th>Waktu</th>
                  <th>Jemputan</th>
                  <th>Status</th>
                  <th>Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {permohonan.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted py-4">
                      Tiada permohonan
                    </td>
                  </tr>
                ) : (
                  permohonan.map(item => (
                    <tr key={item.id}>
                      <td>{formatDateTime(item.created_at)}</td>
                      <td>
                        <strong>{item.nama_pemohon}</strong>
                        <br />
                        <small className="text-muted">{item.no_handphone}</small>
                      </td>
                      <td>{item.tajuk_majlis}</td>
                      <td>
                        {formatDate(item.tarikh_majlis)}
                        <br />
                        <small className="text-muted">{item.hari_majlis}</small>
                      </td>
                      <td>
                        <span className="badge bg-info text-dark">
                          {item.waktu_majlis}
                        </span>
                      </td>
                      <td>{item.jumlah_jemputan} orang</td>
                      <td>{getStatusBadge(item.status)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => openDetailModal(item)}
                          title="Lihat Butiran"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        {session.user.role === 'admin' && (
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(item.id)}
                            title="Padam"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <nav className="mt-3">
          <ul className="pagination justify-content-center mb-0">
            <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Sebelum
              </button>
            </li>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <li key={page} className={`page-item ${pagination.page === page ? 'active' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setPagination(prev => ({ ...prev, page }))}
                >
                  {page}
                </button>
              </li>
            ))}
            <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Seterusnya
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Detail Modal */}
      {showModal && selectedPermohonan && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Butiran Permohonan</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Applicant Info */}
                  <div className="col-md-6 mb-3">
                    <h6 className="text-secondary border-bottom pb-2">Maklumat Pemohon</h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: '40%' }}>Nama:</td>
                          <td><strong>{selectedPermohonan.nama_pemohon}</strong></td>
                        </tr>
                        <tr>
                          <td className="text-muted">No. KP:</td>
                          <td>{selectedPermohonan.no_kad_pengenalan}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Alamat:</td>
                          <td>{selectedPermohonan.alamat}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">No. Tel Rumah:</td>
                          <td>{selectedPermohonan.no_telefon_rumah || '-'}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">No. Handphone:</td>
                          <td>{selectedPermohonan.no_handphone}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Event Info */}
                  <div className="col-md-6 mb-3">
                    <h6 className="text-secondary border-bottom pb-2">Maklumat Majlis</h6>
                    <table className="table table-sm table-borderless">
                      <tbody>
                        <tr>
                          <td className="text-muted" style={{ width: '40%' }}>Tajuk:</td>
                          <td><strong>{selectedPermohonan.tajuk_majlis}</strong></td>
                        </tr>
                        <tr>
                          <td className="text-muted">Tarikh:</td>
                          <td>{formatDate(selectedPermohonan.tarikh_majlis)} ({selectedPermohonan.hari_majlis})</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Masa:</td>
                          <td>{selectedPermohonan.masa_majlis}</td>
                        </tr>
                        <tr>
                          <td className="text-muted">Waktu:</td>
                          <td><span className="badge bg-info text-dark">{selectedPermohonan.waktu_majlis}</span></td>
                        </tr>
                        <tr>
                          <td className="text-muted">Jemputan:</td>
                          <td>{selectedPermohonan.jumlah_jemputan} orang</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Equipment */}
                  <div className="col-12 mb-3">
                    <h6 className="text-secondary border-bottom pb-2">Peralatan Diperlukan</h6>
                    {selectedPermohonan.peralatan && selectedPermohonan.peralatan.length > 0 ? (
                      <div className="d-flex flex-wrap gap-2">
                        {(typeof selectedPermohonan.peralatan === 'string'
                          ? JSON.parse(selectedPermohonan.peralatan)
                          : selectedPermohonan.peralatan
                        ).map((p: string) => (
                          <span key={p} className="badge bg-secondary">
                            {PERALATAN_MAP[p] || p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted">Tiada</span>
                    )}
                    {selectedPermohonan.peralatan_lain && (
                      <p className="mt-2 mb-0">
                        <strong>Lain-lain:</strong> {selectedPermohonan.peralatan_lain}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="col-12 mb-3">
                    <h6 className="text-secondary border-bottom pb-2">Status Permohonan</h6>
                    <div className="d-flex align-items-center gap-3">
                      {getStatusBadge(selectedPermohonan.status)}
                      {selectedPermohonan.approved_at && (
                        <small className="text-muted">
                          oleh {selectedPermohonan.approved_by_name} pada {formatDateTime(selectedPermohonan.approved_at)}
                        </small>
                      )}
                    </div>
                    {selectedPermohonan.rejection_reason && (
                      <div className="alert alert-danger mt-2 mb-0">
                        <strong>Sebab Penolakan:</strong> {selectedPermohonan.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Rejection Reason Input */}
                  {selectedPermohonan.status === 'pending' && (
                    <div className="col-12">
                      <h6 className="text-secondary border-bottom pb-2">Tindakan</h6>
                      <div className="mb-3">
                        <label className="form-label">Sebab Penolakan (jika ditolak)</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Nyatakan sebab penolakan jika permohonan ditolak"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Tutup
                </button>
                {selectedPermohonan.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={processing}
                    >
                      {processing ? 'Memproses...' : 'Tolak'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleUpdateStatus('approved')}
                      disabled={processing}
                    >
                      {processing ? 'Memproses...' : 'Luluskan'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
