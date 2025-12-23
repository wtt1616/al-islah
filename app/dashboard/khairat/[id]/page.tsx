'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { KhairatAhli, KhairatTanggungan } from '@/types';

interface KhairatAhliDetail extends KhairatAhli {
  tanggungan: KhairatTanggungan[];
}

export default function KhairatDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [application, setApplication] = useState<KhairatAhliDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (session) {
      fetchApplication();
    }
  }, [session, params.id]);

  const fetchApplication = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/khairat/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          alert('Permohonan tidak dijumpai');
          router.push('/dashboard/khairat');
          return;
        }
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      setApplication(data);
    } catch (error) {
      console.error('Error fetching application:', error);
      alert('Gagal memuatkan permohonan');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Adakah anda pasti mahu meluluskan permohonan ini?')) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/khairat/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal meluluskan permohonan');
      }

      alert('Permohonan telah diluluskan dan notifikasi telah dihantar kepada pemohon.');
      router.push('/dashboard/khairat');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Sila nyatakan sebab penolakan');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/khairat/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reject_reason: rejectReason })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menolak permohonan');
      }

      alert('Permohonan telah ditolak dan notifikasi telah dihantar kepada pemohon.');
      setShowRejectModal(false);
      router.push('/dashboard/khairat');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="badge bg-warning text-dark fs-6">Menunggu Kelulusan</span>;
      case 'approved':
        return <span className="badge bg-success fs-6">Diluluskan</span>;
      case 'rejected':
        return <span className="badge bg-danger fs-6">Ditolak</span>;
      default:
        return <span className="badge bg-secondary fs-6">{status}</span>;
    }
  };

  const getJenisYuranLabel = (jenis: string) => {
    switch (jenis) {
      case 'keahlian':
        return 'Yuran Keahlian (RM 50.00 - Sekali)';
      case 'tahunan':
        return 'Yuran Tahunan (RM 50.00 - Setiap Tahun)';
      case 'isteri_kedua':
        return 'Yuran Keahlian Isteri Kedua (RM 50.00)';
      default:
        return jenis;
    }
  };

  const getPertalianLabel = (pertalian: string) => {
    switch (pertalian) {
      case 'isteri':
        return 'Isteri';
      case 'anak':
        return 'Anak';
      case 'anak_oku':
        return 'Anak OKU';
      default:
        return pertalian;
    }
  };

  // Format IC number for display: 800101125555 -> 800101-12-5555
  const formatNoKP = (noKp: string | null | undefined): string => {
    if (!noKp) return '-';
    const cleaned = noKp.replace(/[-\s]/g, '');
    if (cleaned.length === 12) {
      return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8)}`;
    }
    return noKp; // Return as-is if not standard format
  };

  // Convert old static paths to API paths for uploaded files
  const getResitUrl = (path: string | null | undefined): string | null => {
    if (!path) return null;
    // If already using API path, return as is
    if (path.startsWith('/api/uploads/')) return path;
    // Convert old static path to API path
    if (path.startsWith('/uploads/')) {
      return `/api${path}`;
    }
    return path;
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

  if (!session || !['admin', 'head_imam', 'bendahari', 'khairat'].includes(session.user.role)) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Anda tidak mempunyai akses ke halaman ini.</div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="container py-4">
        <div className="alert alert-warning">Permohonan tidak dijumpai.</div>
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
              <i className="bi bi-person-badge me-2"></i>
              Detail Permohonan Khairat
            </h4>
            <small className="text-muted">No. Rujukan: KK-{String(application.id).padStart(4, '0')}</small>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-outline-primary"
            onClick={() => router.push(`/dashboard/khairat/${params.id}/print`)}
          >
            <i className="bi bi-printer me-2"></i>Cetak Borang
          </button>
          {getStatusBadge(application.status)}
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {/* Maklumat Pemohon */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-person me-2"></i>
                Maklumat Pemohon
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Nama Penuh</label>
                  <p className="fw-bold mb-0">{application.nama}</p>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label text-muted small">No. K/P</label>
                  <p className="fw-bold mb-0 font-monospace">{formatNoKP(application.no_kp)}</p>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label text-muted small">Umur</label>
                  <p className="fw-bold mb-0">{application.umur || '-'}</p>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Alamat</label>
                <p className="fw-bold mb-0">{application.alamat || '-'}</p>
              </div>
              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted small">No. Telefon (R)</label>
                  <p className="fw-bold mb-0">{application.no_telefon_rumah || '-'}</p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted small">No. H/P</label>
                  <p className="fw-bold mb-0">
                    <a href={`tel:${application.no_hp}`} className="text-decoration-none">
                      {application.no_hp}
                    </a>
                  </p>
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label text-muted small">E-mel</label>
                  <p className="fw-bold mb-0">
                    {application.email ? (
                      <a href={`mailto:${application.email}`} className="text-decoration-none">
                        {application.email}
                      </a>
                    ) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Maklumat Yuran & Bayaran */}
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">
                <i className="bi bi-cash me-2"></i>
                Maklumat Yuran & Bayaran
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Jenis Yuran</label>
                  <p className="fw-bold mb-0">{getJenisYuranLabel(application.jenis_yuran)}</p>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label text-muted small">No. Resit</label>
                  <p className="fw-bold mb-0">{application.no_resit || '-'}</p>
                </div>
                <div className="col-md-3 mb-3">
                  <label className="form-label text-muted small">Amaun</label>
                  <p className="fw-bold mb-0 text-success fs-5">RM {parseFloat(String(application.amaun_bayaran)).toFixed(2)}</p>
                </div>
              </div>
              {/* Receipt File */}
              {application.resit_file && (
                <div className="mt-3 pt-3 border-top">
                  <label className="form-label text-muted small">Bukti Bayaran (Resit)</label>
                  <div className="d-flex align-items-center gap-3">
                    {application.resit_file.toLowerCase().endsWith('.pdf') ? (
                      <div className="bg-danger text-white rounded d-flex align-items-center justify-content-center"
                           style={{ width: '80px', height: '80px' }}>
                        <i className="bi bi-file-pdf fs-2"></i>
                      </div>
                    ) : (
                      <a href={getResitUrl(application.resit_file) || '#'} target="_blank" rel="noopener noreferrer">
                        <img
                          src={getResitUrl(application.resit_file) || ''}
                          alt="Resit bayaran"
                          className="rounded border"
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                      </a>
                    )}
                    <div>
                      <a
                        href={getResitUrl(application.resit_file) || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        <i className="bi bi-eye me-1"></i>
                        Lihat Resit
                      </a>
                      <a
                        href={getResitUrl(application.resit_file) || '#'}
                        download
                        className="btn btn-outline-secondary btn-sm ms-2"
                      >
                        <i className="bi bi-download me-1"></i>
                        Muat Turun
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Senarai Tanggungan */}
          <div className="card mb-4">
            <div className="card-header bg-info text-white">
              <h5 className="mb-0">
                <i className="bi bi-people me-2"></i>
                Senarai Tanggungan
                <span className="badge bg-white text-info ms-2">{application.tanggungan?.length || 0}</span>
              </h5>
            </div>
            <div className="card-body">
              {application.tanggungan && application.tanggungan.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '5%' }}>No</th>
                        <th>Nama Penuh</th>
                        <th style={{ width: '20%' }}>No. K/P</th>
                        <th style={{ width: '10%' }}>Umur</th>
                        <th style={{ width: '15%' }}>Pertalian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {application.tanggungan.map((t, index) => (
                        <tr key={t.id}>
                          <td className="text-center">{index + 1}</td>
                          <td>{t.nama_penuh}</td>
                          <td className="font-monospace">{formatNoKP(t.no_kp)}</td>
                          <td className="text-center">{t.umur || '-'}</td>
                          <td>
                            <span className={`badge ${
                              t.pertalian === 'isteri' ? 'bg-pink' :
                              t.pertalian === 'anak_oku' ? 'bg-purple' : 'bg-secondary'
                            }`} style={{
                              backgroundColor: t.pertalian === 'isteri' ? '#e91e63' :
                              t.pertalian === 'anak_oku' ? '#9c27b0' : undefined
                            }}>
                              {getPertalianLabel(t.pertalian)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-person-x fs-1 d-block mb-2"></i>
                  Tiada tanggungan didaftarkan
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          {/* Status & Tarikh */}
          <div className="card mb-4">
            <div className="card-header bg-secondary text-white">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Maklumat Status
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label text-muted small">Tarikh Daftar</label>
                <p className="fw-bold mb-0">{formatDate(application.tarikh_daftar)}</p>
              </div>
              <div className="mb-3">
                <label className="form-label text-muted small">Tarikh Permohonan</label>
                <p className="fw-bold mb-0">{formatDateTime(application.created_at?.toString())}</p>
              </div>
              {application.status === 'approved' && (
                <>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Tarikh Lulus</label>
                    <p className="fw-bold mb-0 text-success">{formatDateTime(application.tarikh_lulus)}</p>
                  </div>
                  <div className="mb-0">
                    <label className="form-label text-muted small">Diluluskan Oleh</label>
                    <p className="fw-bold mb-0">{application.approver_name || '-'}</p>
                  </div>
                </>
              )}
              {application.status === 'rejected' && (
                <>
                  <div className="mb-3">
                    <label className="form-label text-muted small">Ditolak Oleh</label>
                    <p className="fw-bold mb-0">{application.approver_name || '-'}</p>
                  </div>
                  <div className="mb-0">
                    <label className="form-label text-muted small">Sebab Penolakan</label>
                    <p className="fw-bold mb-0 text-danger">{application.reject_reason || '-'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {application.status === 'pending' && (
            <div className="card">
              <div className="card-header bg-warning text-dark">
                <h5 className="mb-0">
                  <i className="bi bi-check2-square me-2"></i>
                  Tindakan
                </h5>
              </div>
              <div className="card-body">
                <p className="text-muted small mb-3">
                  Sila semak maklumat permohonan dengan teliti sebelum membuat keputusan.
                </p>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-success btn-lg"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Luluskan Permohonan
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-danger btn-lg"
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                  >
                    <i className="bi bi-x-circle me-2"></i>
                    Tolak Permohonan
                  </button>
                </div>
                <div className="alert alert-info mt-3 mb-0">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    Notifikasi akan dihantar kepada pemohon melalui WhatsApp dan E-mel selepas keputusan dibuat.
                  </small>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card mt-4">
            <div className="card-body">
              <h6 className="card-title mb-3">Tindakan Pantas</h6>
              <div className="d-grid gap-2">
                <a
                  href={`https://wa.me/6${application.no_hp.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-success"
                >
                  <i className="bi bi-whatsapp me-2"></i>
                  WhatsApp Pemohon
                </a>
                {application.email && (
                  <a
                    href={`mailto:${application.email}`}
                    className="btn btn-outline-primary"
                  >
                    <i className="bi bi-envelope me-2"></i>
                    E-mel Pemohon
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-x-circle me-2"></i>
                  Tolak Permohonan
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowRejectModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Sila nyatakan sebab penolakan permohonan ini:</p>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Sebab penolakan..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                ></textarea>
                <div className="alert alert-warning mt-3 mb-0">
                  <small>
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Sebab penolakan akan dihantar kepada pemohon melalui notifikasi.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowRejectModal(false)}
                  disabled={processing}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleReject}
                  disabled={processing || !rejectReason.trim()}
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Memproses...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-x-circle me-2"></i>
                      Tolak Permohonan
                    </>
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
