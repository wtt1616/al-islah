'use client';

import { useState } from 'react';
import PublicFooter from '@/components/PublicFooter';

interface Maklumbalas {
  id: number;
  nama: string;
  mesej: string;
  status: 'baru' | 'dibaca' | 'dibalas';
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

interface PermohonanMajlis {
  id: number;
  no_rujukan: string;
  nama_pemohon: string;
  tajuk_majlis: string;
  tarikh_majlis: string;
  masa_majlis: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  approved_at: string | null;
  created_at: string;
}

interface Aktiviti {
  id: number;
  tajuk: string;
  penganjur: string | null;
  tarikh_mula: string;
  tarikh_tamat: string | null;
  masa_mula: string | null;
  masa_tamat: string | null;
  lokasi: string;
  status: 'aktif' | 'batal';
  created_at: string;
}

interface Khairat {
  id: number;
  no_ahli: string;
  nama: string;
  no_kp: string | null;
  jenis_yuran: string;
  no_resit: string | null;
  amaun_bayaran: number;
  status: 'pending' | 'approved' | 'rejected';
  tarikh_daftar: string | null;
  tarikh_lulus: string | null;
  reject_reason: string | null;
  jumlah_tanggungan: number;
  created_at: string;
}

interface SearchResults {
  maklumbalas: Maklumbalas[];
  permohonan_majlis: PermohonanMajlis[];
  aktiviti: Aktiviti[];
  khairat: Khairat[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  // Maklumbalas
  baru: { label: 'Baru', color: 'bg-info' },
  dibaca: { label: 'Dibaca', color: 'bg-secondary' },
  dibalas: { label: 'Dibalas', color: 'bg-success' },
  // Permohonan
  pending: { label: 'Dalam Proses', color: 'bg-warning text-dark' },
  approved: { label: 'Diluluskan', color: 'bg-success' },
  rejected: { label: 'Ditolak', color: 'bg-danger' },
  // Aktiviti
  aktif: { label: 'Aktif', color: 'bg-success' },
  batal: { label: 'Dibatalkan', color: 'bg-danger' },
};

const JENIS_YURAN_LABELS: Record<string, string> = {
  keahlian: 'Yuran Keahlian (Sekali)',
  tahunan: 'Yuran Tahunan',
  isteri_kedua: 'Yuran Isteri Kedua',
};

export default function SemakStatusPage() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults(null);

    if (!phone || phone.trim().length < 9) {
      setError('Sila masukkan nombor telefon yang sah (minimum 9 digit)');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/semak-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResults(data.data);
        setTotal(data.total);
        if (data.total === 0) {
          setError('Tiada rekod ditemui untuk nombor telefon ini');
        }
      } else {
        setError(data.error || 'Ralat semasa mencari rekod');
      }
    } catch (err) {
      setError('Ralat rangkaian. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const getStatusBadge = (status: string) => {
    const config = STATUS_LABELS[status] || { label: status, color: 'bg-secondary' };
    return <span className={`badge ${config.color}`}>{config.label}</span>;
  };

  const getCounts = () => {
    if (!results) return { maklumbalas: 0, permohonan: 0, aktiviti: 0, khairat: 0 };
    return {
      maklumbalas: results.maklumbalas.length,
      permohonan: results.permohonan_majlis.length,
      aktiviti: results.aktiviti.length,
      khairat: results.khairat.length
    };
  };

  const counts = getCounts();

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        {/* Header */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex align-items-center gap-3">
              <a
                href="/login"
                className="btn btn-outline-secondary btn-sm"
                title="Kembali ke halaman utama"
              >
                <i className="bi bi-house-door"></i>
              </a>
              <div>
                <h4 className="mb-0" style={{ color: '#8B0000' }}>
                  <i className="bi bi-search me-2"></i>
                  Semak Status Urusan
                </h4>
                <small className="text-muted">Surau Al-Islah, Saujana Impian</small>
              </div>
            </div>
          </div>
        </div>

        {/* Search Form */}
        <div className="card mb-4">
          <div className="card-body">
            <form onSubmit={handleSearch}>
              <div className="row align-items-end">
                <div className="col-md-8 mb-3 mb-md-0">
                  <label htmlFor="phone" className="form-label fw-bold">
                    <i className="bi bi-phone me-1"></i>
                    Nombor Telefon
                  </label>
                  <input
                    type="tel"
                    className="form-control form-control-lg"
                    id="phone"
                    placeholder="Contoh: 0123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                  <small className="text-muted">
                    Masukkan nombor telefon yang digunakan semasa menghantar permohonan/maklumbalas
                  </small>
                </div>
                <div className="col-md-4">
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Mencari...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-search me-2"></i>
                        Semak Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-warning" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>
        )}

        {/* Results */}
        {results && total > 0 && (
          <>
            {/* Summary */}
            <div className="alert alert-success mb-4">
              <i className="bi bi-check-circle me-2"></i>
              Dijumpai <strong>{total}</strong> rekod untuk nombor telefon ini
            </div>

            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  Semua ({total})
                </button>
              </li>
              {counts.maklumbalas > 0 && (
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'maklumbalas' ? 'active' : ''}`}
                    onClick={() => setActiveTab('maklumbalas')}
                  >
                    Maklum Balas ({counts.maklumbalas})
                  </button>
                </li>
              )}
              {counts.permohonan > 0 && (
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'permohonan' ? 'active' : ''}`}
                    onClick={() => setActiveTab('permohonan')}
                  >
                    Permohonan Majlis ({counts.permohonan})
                  </button>
                </li>
              )}
              {counts.aktiviti > 0 && (
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'aktiviti' ? 'active' : ''}`}
                    onClick={() => setActiveTab('aktiviti')}
                  >
                    Aktiviti ({counts.aktiviti})
                  </button>
                </li>
              )}
              {counts.khairat > 0 && (
                <li className="nav-item">
                  <button
                    className={`nav-link ${activeTab === 'khairat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('khairat')}
                  >
                    Khairat Kematian ({counts.khairat})
                  </button>
                </li>
              )}
            </ul>

            {/* Maklumbalas Section */}
            {(activeTab === 'all' || activeTab === 'maklumbalas') && results.maklumbalas.length > 0 && (
              <div className="card mb-4">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-chat-left-text me-2"></i>
                    Maklum Balas
                  </h5>
                </div>
                <div className="card-body">
                  {results.maklumbalas.map((item) => (
                    <div key={item.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong>{item.nama}</strong>
                          <br />
                          <small className="text-muted">
                            Dihantar: {formatDateTime(item.created_at)}
                          </small>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="bg-light p-2 rounded mb-2">
                        <small className="text-muted">Mesej anda:</small>
                        <p className="mb-0">{item.mesej}</p>
                      </div>
                      {item.admin_reply && (
                        <div className="bg-success bg-opacity-10 p-2 rounded border-start border-success border-3">
                          <small className="text-muted">
                            Jawapan ({formatDateTime(item.replied_at)}):
                          </small>
                          <p className="mb-0 text-success fw-medium">{item.admin_reply}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Permohonan Majlis Section */}
            {(activeTab === 'all' || activeTab === 'permohonan') && results.permohonan_majlis.length > 0 && (
              <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-event me-2"></i>
                    Permohonan Majlis
                  </h5>
                </div>
                <div className="card-body">
                  {results.permohonan_majlis.map((item) => (
                    <div key={item.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="badge bg-secondary me-2">{item.no_rujukan}</span>
                          <strong>{item.tajuk_majlis}</strong>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="row">
                        <div className="col-md-6">
                          <small className="text-muted">Pemohon:</small>
                          <p className="mb-1">{item.nama_pemohon}</p>
                        </div>
                        <div className="col-md-6">
                          <small className="text-muted">Tarikh Majlis:</small>
                          <p className="mb-1">
                            {formatDate(item.tarikh_majlis)} • {item.masa_majlis}
                          </p>
                        </div>
                      </div>
                      {item.status === 'approved' && item.approved_at && (
                        <div className="alert alert-success py-2 mb-0 mt-2">
                          <i className="bi bi-check-circle me-2"></i>
                          Diluluskan pada {formatDateTime(item.approved_at)}
                        </div>
                      )}
                      {item.status === 'rejected' && item.rejection_reason && (
                        <div className="alert alert-danger py-2 mb-0 mt-2">
                          <i className="bi bi-x-circle me-2"></i>
                          <strong>Sebab penolakan:</strong> {item.rejection_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aktiviti Section */}
            {(activeTab === 'all' || activeTab === 'aktiviti') && results.aktiviti.length > 0 && (
              <div className="card mb-4">
                <div className="card-header bg-success text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-calendar-check me-2"></i>
                    Permohonan Aktiviti
                  </h5>
                </div>
                <div className="card-body">
                  {results.aktiviti.map((item) => (
                    <div key={item.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <strong>{item.tajuk}</strong>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="row">
                        <div className="col-md-4">
                          <small className="text-muted">Penganjur:</small>
                          <p className="mb-1">{item.penganjur || '-'}</p>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">Tarikh:</small>
                          <p className="mb-1">
                            {formatDate(item.tarikh_mula)}
                            {item.tarikh_tamat && item.tarikh_tamat !== item.tarikh_mula && (
                              <> - {formatDate(item.tarikh_tamat)}</>
                            )}
                          </p>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">Masa:</small>
                          <p className="mb-1">
                            {formatTime(item.masa_mula)}
                            {item.masa_tamat && <> - {formatTime(item.masa_tamat)}</>}
                          </p>
                        </div>
                      </div>
                      <small className="text-muted">
                        <i className="bi bi-geo-alt me-1"></i>
                        {item.lokasi}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Khairat Section */}
            {(activeTab === 'all' || activeTab === 'khairat') && results.khairat.length > 0 && (
              <div className="card mb-4">
                <div className="card-header bg-dark text-white">
                  <h5 className="mb-0">
                    <i className="bi bi-person-check me-2"></i>
                    Khairat Kematian
                  </h5>
                </div>
                <div className="card-body">
                  {results.khairat.map((item) => (
                    <div key={item.id} className="border rounded p-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="badge bg-secondary me-2">{item.no_ahli}</span>
                          <strong>{item.nama}</strong>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>
                      <div className="row">
                        <div className="col-md-4">
                          <small className="text-muted">No. K/P:</small>
                          <p className="mb-1">{item.no_kp || '-'}</p>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">Jenis Yuran:</small>
                          <p className="mb-1">{JENIS_YURAN_LABELS[item.jenis_yuran] || item.jenis_yuran}</p>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">Amaun:</small>
                          <p className="mb-1">RM {parseFloat(String(item.amaun_bayaran)).toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-4">
                          <small className="text-muted">No. Resit:</small>
                          <p className="mb-1">{item.no_resit || '-'}</p>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">Tarikh Daftar:</small>
                          <p className="mb-1">{formatDate(item.tarikh_daftar)}</p>
                        </div>
                        <div className="col-md-4">
                          <small className="text-muted">Tanggungan:</small>
                          <p className="mb-1">{item.jumlah_tanggungan} orang</p>
                        </div>
                      </div>
                      {item.status === 'approved' && item.tarikh_lulus && (
                        <div className="alert alert-success py-2 mb-0 mt-2">
                          <i className="bi bi-check-circle me-2"></i>
                          Diluluskan pada {formatDateTime(item.tarikh_lulus)}
                        </div>
                      )}
                      {item.status === 'rejected' && item.reject_reason && (
                        <div className="alert alert-danger py-2 mb-0 mt-2">
                          <i className="bi bi-x-circle me-2"></i>
                          <strong>Sebab penolakan:</strong> {item.reject_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Info Section */}
        {!results && !loading && (
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">
                <i className="bi bi-info-circle me-2"></i>
                Panduan Semakan Status
              </h5>
              <p className="text-muted mb-3">
                Gunakan kemudahan ini untuk menyemak status permohonan dan maklum balas anda kepada Surau Al-Islah.
              </p>
              <div className="row">
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <i className="bi bi-chat-left-text text-info fs-3 mb-2 d-block"></i>
                    <strong>Maklum Balas</strong>
                    <p className="small text-muted mb-0">
                      Semak status dan jawapan maklum balas yang dihantar
                    </p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <i className="bi bi-calendar-event text-primary fs-3 mb-2 d-block"></i>
                    <strong>Permohonan Majlis</strong>
                    <p className="small text-muted mb-0">
                      Semak status kelulusan permohonan majlis
                    </p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <i className="bi bi-calendar-check text-success fs-3 mb-2 d-block"></i>
                    <strong>Aktiviti</strong>
                    <p className="small text-muted mb-0">
                      Semak status permohonan aktiviti surau
                    </p>
                  </div>
                </div>
                <div className="col-md-6 col-lg-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <i className="bi bi-person-check text-dark fs-3 mb-2 d-block"></i>
                    <strong>Khairat Kematian</strong>
                    <p className="small text-muted mb-0">
                      Semak status pendaftaran khairat kematian
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
