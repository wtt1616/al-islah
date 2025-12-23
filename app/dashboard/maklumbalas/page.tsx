'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Feedback {
  id: number;
  nama: string;
  no_telefon: string;
  alamat: string;
  emel: string;
  mesej: string;
  status: 'baru' | 'dibaca' | 'dibalas';
  admin_reply: string | null;
  replied_by: number | null;
  replied_by_name: string | null;
  replied_at: string | null;
  whatsapp_sent: boolean;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface StatusCounts {
  semua: number;
  baru: number;
  dibaca: number;
  dibalas: number;
}

export default function AdminMaklumbalasPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [statusFilter, setStatusFilter] = useState('semua');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [counts, setCounts] = useState<StatusCounts>({
    semua: 0,
    baru: 0,
    dibaca: 0,
    dibalas: 0
  });

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (session) {
      fetchFeedbacks();
    }
  }, [session, statusFilter, pagination.page]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: statusFilter,
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      const response = await fetch(`/api/feedback?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setFeedbacks(data.data);
      setPagination(data.pagination);
      setCounts(data.counts);
    } catch (error) {
      console.error('Error fetching feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFeedback = async (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setReplyText(feedback.admin_reply || '');

    // Mark as read if new
    if (feedback.status === 'baru') {
      try {
        await fetch('/api/feedback', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: feedback.id, status: 'dibaca' })
        });
        fetchFeedbacks();
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
  };

  const handleReply = async () => {
    if (!selectedFeedback || !replyText.trim()) return;

    setReplying(true);
    try {
      const response = await fetch('/api/feedback/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedFeedback.id,
          reply: replyText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghantar jawapan');
      }

      alert(`Jawapan telah dihantar!\n\nWhatsApp: ${data.notifications.whatsapp ? 'Berjaya' : 'Gagal/Tidak dikonfigurasikan'}\nEmel: ${data.notifications.email ? 'Berjaya' : 'Gagal/Tidak dikonfigurasikan'}`);

      setSelectedFeedback(null);
      setReplyText('');
      fetchFeedbacks();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setReplying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'baru':
        return <span className="badge bg-danger">Baru</span>;
      case 'dibaca':
        return <span className="badge bg-warning text-dark">Dibaca</span>;
      case 'dibalas':
        return <span className="badge bg-success">Dibalas</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (sessionStatus === 'loading' || loading) {
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
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-outline-secondary" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-2"></i>Kembali
          </button>
          <div>
            <h4 className="mb-0">
              <i className="bi bi-chat-left-text me-2"></i>
              Pengurusan Maklum Balas
            </h4>
            <small className="text-muted">Senarai maklum balas daripada orang awam</small>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <ul className="nav nav-tabs mb-4">
        {[
          { key: 'semua', label: 'Semua' },
          { key: 'baru', label: 'Baru' },
          { key: 'dibaca', label: 'Dibaca' },
          { key: 'dibalas', label: 'Dibalas' }
        ].map((tab) => (
          <li className="nav-item" key={tab.key}>
            <button
              className={`nav-link ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => {
                setStatusFilter(tab.key);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
            >
              {tab.label}
              <span className={`badge ms-2 ${statusFilter === tab.key ? 'bg-primary' : 'bg-secondary'}`}>
                {counts[tab.key as keyof StatusCounts]}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Feedback List */}
      <div className="card">
        <div className="card-body">
          {feedbacks.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
              <p className="text-muted mt-3">Tiada maklum balas dijumpai</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '5%' }}>Bil</th>
                    <th style={{ width: '15%' }}>Nama</th>
                    <th style={{ width: '12%' }}>No. Telefon</th>
                    <th style={{ width: '30%' }}>Mesej</th>
                    <th style={{ width: '10%' }}>Status</th>
                    <th style={{ width: '15%' }}>Tarikh</th>
                    <th style={{ width: '13%' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbacks.map((feedback, index) => (
                    <tr key={feedback.id} className={feedback.status === 'baru' ? 'table-warning' : ''}>
                      <td>{(pagination.page - 1) * pagination.limit + index + 1}</td>
                      <td>
                        <strong>{feedback.nama}</strong>
                        <br />
                        <small className="text-muted">{feedback.emel}</small>
                      </td>
                      <td>{feedback.no_telefon}</td>
                      <td>
                        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {feedback.mesej}
                        </div>
                      </td>
                      <td>{getStatusBadge(feedback.status)}</td>
                      <td>
                        <small>{formatDate(feedback.created_at)}</small>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleViewFeedback(feedback)}
                          data-bs-toggle="modal"
                          data-bs-target="#feedbackModal"
                        >
                          <i className="bi bi-eye me-1"></i>
                          Lihat
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <nav className="mt-3">
              <ul className="pagination justify-content-center mb-0">
                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                  <button
                    className="page-link"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
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
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      {/* Feedback Detail Modal */}
      <div className="modal fade" id="feedbackModal" tabIndex={-1}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-chat-left-text me-2"></i>
                Detail Maklum Balas
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            {selectedFeedback && (
              <div className="modal-body">
                {/* Sender Info */}
                <div className="card mb-3">
                  <div className="card-header bg-light">
                    <strong>Maklumat Pengirim</strong>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p className="mb-2">
                          <i className="bi bi-person me-2 text-muted"></i>
                          <strong>Nama:</strong> {selectedFeedback.nama}
                        </p>
                        <p className="mb-2">
                          <i className="bi bi-telephone me-2 text-muted"></i>
                          <strong>No. Telefon:</strong> {selectedFeedback.no_telefon}
                        </p>
                      </div>
                      <div className="col-md-6">
                        <p className="mb-2">
                          <i className="bi bi-envelope me-2 text-muted"></i>
                          <strong>Emel:</strong> {selectedFeedback.emel}
                        </p>
                        <p className="mb-2">
                          <i className="bi bi-geo-alt me-2 text-muted"></i>
                          <strong>Alamat:</strong> {selectedFeedback.alamat}
                        </p>
                      </div>
                    </div>
                    <p className="mb-0 text-muted">
                      <small>
                        <i className="bi bi-clock me-1"></i>
                        Dihantar pada: {formatDate(selectedFeedback.created_at)}
                      </small>
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="card mb-3">
                  <div className="card-header bg-primary text-white">
                    <strong>Maklum Balas</strong>
                  </div>
                  <div className="card-body">
                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{selectedFeedback.mesej}</p>
                  </div>
                </div>

                {/* Previous Reply (if exists) */}
                {selectedFeedback.admin_reply && (
                  <div className="card mb-3 border-success">
                    <div className="card-header bg-success text-white">
                      <strong>Jawapan Terdahulu</strong>
                    </div>
                    <div className="card-body">
                      <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>{selectedFeedback.admin_reply}</p>
                      <small className="text-muted">
                        <i className="bi bi-person me-1"></i>
                        Dibalas oleh: {selectedFeedback.replied_by_name || 'N/A'}
                        {selectedFeedback.replied_at && (
                          <> | <i className="bi bi-clock me-1"></i>{formatDate(selectedFeedback.replied_at)}</>
                        )}
                      </small>
                      <div className="mt-2">
                        {selectedFeedback.whatsapp_sent && (
                          <span className="badge bg-success me-1">
                            <i className="bi bi-whatsapp me-1"></i>WhatsApp Dihantar
                          </span>
                        )}
                        {selectedFeedback.email_sent && (
                          <span className="badge bg-info">
                            <i className="bi bi-envelope me-1"></i>Emel Dihantar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                <div className="card">
                  <div className="card-header bg-light">
                    <strong>
                      {selectedFeedback.status === 'dibalas' ? 'Balas Semula' : 'Balas Maklum Balas'}
                    </strong>
                  </div>
                  <div className="card-body">
                    <textarea
                      className="form-control mb-3"
                      rows={5}
                      placeholder="Taip jawapan anda di sini..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    ></textarea>
                    <div className="alert alert-info mb-0">
                      <i className="bi bi-info-circle me-2"></i>
                      Jawapan akan dihantar melalui WhatsApp dan Emel kepada pengirim.
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleReply}
                disabled={replying || !replyText.trim()}
              >
                {replying ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Menghantar...
                  </>
                ) : (
                  <>
                    <i className="bi bi-send me-2"></i>
                    Hantar Jawapan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
