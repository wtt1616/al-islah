'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Member {
  no_kp: string;
  no_ahli: string;
  nama: string;
  alamat: string;
  no_hp: string;
  email: string;
  tarikh_daftar: string;
  status_ahli: string;
}

interface Tanggungan {
  hubungan: string;
  nama: string;
}

interface Payment {
  tahun: number;
  jumlah: number;
  no_resit: string;
  status: string;
  source?: 'old' | 'new';
}

interface Summary {
  total_paid: number;
  latest_paid_year: number | null;
  status_bayaran: string;
  jumlah_tanggungan: number;
  pending_count?: number;
}

interface SearchResult {
  found: boolean;
  message?: string;
  source?: 'khairat_ahli' | 'khairat_members';
  ahli_id?: number;
  member_id?: number;
  member?: Member;
  tanggungan?: Tanggungan[];
  payments?: Payment[];
  summary?: Summary;
}

export default function KhairatPublicPage() {
  const [mode, setMode] = useState<'menu' | 'search' | 'result'>('menu');
  const [noKp, setNoKp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [tahunBayaran, setTahunBayaran] = useState('');
  const [noResit, setNoResit] = useState('');
  const [amaun, setAmaun] = useState('');
  const [resitFile, setResitFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noKp.trim()) {
      setError('Sila masukkan No. Kad Pengenalan');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/khairat/search?no_kp=${encodeURIComponent(noKp)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ralat semasa mencari');
      }

      setResult(data);
      setMode('result');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setMode('menu');
    setNoKp('');
    setResult(null);
    setError('');
    resetPaymentForm();
  };

  const resetPaymentForm = () => {
    setShowPaymentModal(false);
    setPaymentLoading(false);
    setPaymentError('');
    setPaymentSuccess(false);
    setTahunBayaran('');
    setNoResit('');
    setAmaun('');
    setResitFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setPaymentError('Jenis fail tidak dibenarkan. Sila muat naik JPEG, PNG atau PDF.');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPaymentError('Saiz fail melebihi had maksimum 5MB.');
        return;
      }
      setResitFile(file);
      setPaymentError('');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Check if we have either ahli_id or member_id
    if (!result?.ahli_id && !result?.member_id) return;

    setPaymentLoading(true);
    setPaymentError('');

    try {
      // Upload file first if provided
      let resitFilePath = null;
      if (resitFile) {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append('resit', resitFile);

        const uploadRes = await fetch('/api/khairat/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(uploadData.error || 'Gagal memuat naik fail');
        }

        const uploadData = await uploadRes.json();
        resitFilePath = uploadData.filePath;
        setUploadingFile(false);
      }

      // Submit payment - send ahli_id for new system, member_id for old system
      const paymentData: any = {
        tahun: tahunBayaran,
        no_resit: noResit,
        resit_file: resitFilePath,
        amaun: parseFloat(amaun) || 0
      };

      if (result.ahli_id) {
        paymentData.ahli_id = result.ahli_id;
      } else if (result.member_id) {
        paymentData.member_id = result.member_id;
      }

      const res = await fetch('/api/khairat/bayaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghantar pembayaran');
      }

      setPaymentSuccess(true);

      // Refresh search results after 2 seconds
      setTimeout(() => {
        handleSearch({ preventDefault: () => {} } as React.FormEvent);
        resetPaymentForm();
      }, 2000);

    } catch (err: any) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
      setUploadingFile(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'aktif': return 'bg-success';
      case 'meninggal': return 'bg-secondary';
      case 'pindah': return 'bg-warning text-dark';
      case 'gantung': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <span className="badge bg-success">Dibayar</span>;
      case 'approved': return <span className="badge bg-success">Diluluskan</span>;
      case 'pending': return <span className="badge bg-warning text-dark">Menunggu</span>;
      case 'rejected': return <span className="badge bg-danger">Ditolak</span>;
      case 'tunggak': return <span className="badge bg-danger">Tertunggak</span>;
      case 'prabayar': return <span className="badge bg-info">Pra-bayar</span>;
      default: return <span className="badge bg-secondary">{status}</span>;
    }
  };

  // Mask IC number for privacy: 800101125555 -> 800101-**-**55
  const maskNoKP = (noKp: string): string => {
    if (!noKp) return '-';
    const cleaned = noKp.replace(/[-\s]/g, '');
    if (cleaned.length === 12) {
      return `${cleaned.slice(0, 6)}-**-**${cleaned.slice(-2)}`;
    }
    if (cleaned.length > 4) {
      return `${cleaned.slice(0, 4)}${'*'.repeat(cleaned.length - 6)}${cleaned.slice(-2)}`;
    }
    return '*'.repeat(cleaned.length);
  };

  // Mask phone number for privacy: 0123456789 -> 012-***-6789
  const maskPhone = (phone: string): string => {
    if (!phone) return '-';
    const cleaned = phone.replace(/[-\s]/g, '');
    if (cleaned.length >= 10) {
      return `${cleaned.slice(0, 3)}-***-${cleaned.slice(-4)}`;
    }
    if (cleaned.length > 4) {
      return `${cleaned.slice(0, 2)}${'*'.repeat(cleaned.length - 4)}${cleaned.slice(-2)}`;
    }
    return phone;
  };

  // Menu Page
  if (mode === 'menu') {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
        <div className="card shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="card-body text-center py-5">
            <div className="mb-4">
              <i className="bi bi-people-fill text-success" style={{ fontSize: '4rem' }}></i>
            </div>
            <h3 className="fw-bold text-success mb-2">Khairat Kematian</h3>
            <p className="text-muted mb-4">Surau Al-Islah</p>

            <div className="d-grid gap-3">
              <button
                className="btn btn-primary btn-lg py-3"
                onClick={() => setMode('search')}
              >
                <i className="bi bi-search me-2"></i>
                Semak Status Keahlian
                <br />
                <small className="fw-normal">Cari menggunakan No. K/P</small>
              </button>

              <Link href="/khairat/daftar" className="btn btn-success btn-lg py-3">
                <i className="bi bi-person-plus me-2"></i>
                Daftar Ahli Baru
                <br />
                <small className="fw-normal">Mohon keahlian khairat</small>
              </Link>
            </div>

            <div className="mt-4 d-flex justify-content-center gap-3">
              <Link href="/login" className="text-muted text-decoration-none">
                <i className="bi bi-arrow-left me-1"></i>
                Laman Utama
              </Link>
              <span className="text-muted">|</span>
              <Link href="/help/public" className="text-muted text-decoration-none">
                <i className="bi bi-question-circle me-1"></i>
                Bantuan
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Search Form
  if (mode === 'search') {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
        <div className="card shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-search me-2"></i>
              Semak Status Keahlian
            </h5>
          </div>
          <div className="card-body p-4">
            <p className="text-muted mb-4">
              Masukkan No. Kad Pengenalan anda untuk menyemak status keahlian dan sejarah bayaran.
            </p>

            {error && (
              <div className="alert alert-danger alert-dismissible fade show">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
                <button type="button" className="btn-close" onClick={() => setError('')}></button>
              </div>
            )}

            <form onSubmit={handleSearch}>
              <div className="mb-4">
                <label htmlFor="noKp" className="form-label">
                  No. Kad Pengenalan
                </label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  id="noKp"
                  value={noKp}
                  onChange={(e) => setNoKp(e.target.value)}
                  placeholder="Contoh: 800101125555"
                  disabled={loading}
                  autoFocus
                />
                <div className="form-text">
                  Masukkan tanpa tanda sempang (-)
                </div>
              </div>

              <div className="d-grid gap-2">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
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
                      Cari
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={resetSearch}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Kembali
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Result Page
  if (mode === 'result' && result) {
    if (!result.found) {
      return (
        <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
          <div className="card shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
            <div className="card-body text-center py-5">
              <div className="mb-4">
                <i className="bi bi-search text-warning" style={{ fontSize: '4rem' }}></i>
              </div>
              <h4 className="mb-3">Rekod Tidak Dijumpai</h4>
              <p className="text-muted mb-4">{result.message}</p>

              <div className="d-grid gap-2">
                <Link href="/khairat/daftar" className="btn btn-success btn-lg">
                  <i className="bi bi-person-plus me-2"></i>
                  Daftar Sebagai Ahli Baru
                </Link>
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setMode('search')}
                >
                  <i className="bi bi-search me-2"></i>
                  Cuba Cari Semula
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={resetSearch}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Kembali ke Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Allow payment for both new system (khairat_ahli) and old system (khairat_members)
    const canPayAnnualFee = (result.source === 'khairat_ahli' && result.ahli_id) ||
                            (result.source === 'khairat_members' && result.member_id);

    return (
      <div className="min-vh-100 bg-light py-4">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {/* Header */}
              <div className="card shadow-lg mb-4">
                <div className="card-header bg-success text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">
                      <i className="bi bi-person-check me-2"></i>
                      Maklumat Keahlian
                    </h5>
                    <span className={`badge ${getStatusBadgeClass(result.member?.status_ahli || '')}`}>
                      {result.member?.status_ahli?.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted small">No. Ahli</label>
                      <p className="fw-bold mb-0">{result.member?.no_ahli || '-'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted small">No. K/P</label>
                      <p className="fw-bold mb-0">{maskNoKP(result.member?.no_kp || '')}</p>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label text-muted small">Nama</label>
                      <p className="fw-bold mb-0 fs-5">{result.member?.nama}</p>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label text-muted small">Alamat</label>
                      <p className="mb-0">{result.member?.alamat || '-'}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted small">No. Telefon</label>
                      <p className="mb-0">{maskPhone(result.member?.no_hp || '')}</p>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label text-muted small">Tarikh Daftar</label>
                      <p className="mb-0">
                        {result.member?.tarikh_daftar
                          ? new Date(result.member.tarikh_daftar).toLocaleDateString('ms-MY')
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="row mb-4">
                <div className="col-md-4 mb-3">
                  <div className="card bg-primary text-white h-100">
                    <div className="card-body text-center">
                      <h6 className="card-title">Status Bayaran</h6>
                      <p className="mb-0 fs-5 fw-bold">{result.summary?.status_bayaran}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card bg-success text-white h-100">
                    <div className="card-body text-center">
                      <h6 className="card-title">Jumlah Dibayar</h6>
                      <p className="mb-0 fs-5 fw-bold">RM {Number(result.summary?.total_paid || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4 mb-3">
                  <div className="card bg-info text-white h-100">
                    <div className="card-body text-center">
                      <h6 className="card-title">Tanggungan</h6>
                      <p className="mb-0 fs-5 fw-bold">{result.summary?.jumlah_tanggungan} orang</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Annual Fee Payment Button - Only for khairat_ahli members */}
              {canPayAnnualFee && (
                <div className="card shadow-lg mb-4 border-warning">
                  <div className="card-body text-center py-4">
                    <h5 className="text-warning mb-3">
                      <i className="bi bi-credit-card me-2"></i>
                      Bayar Yuran Khairat
                    </h5>
                    <p className="text-muted mb-3">
                      Klik butang di bawah untuk membuat pembayaran yuran khairat kematian.
                    </p>
                    {result.summary?.pending_count && result.summary.pending_count > 0 && (
                      <div className="alert alert-info">
                        <i className="bi bi-info-circle me-2"></i>
                        Anda mempunyai {result.summary.pending_count} pembayaran yang sedang menunggu kelulusan.
                      </div>
                    )}
                    <button
                      className="btn btn-warning btn-lg px-5"
                      onClick={() => setShowPaymentModal(true)}
                    >
                      <i className="bi bi-wallet2 me-2"></i>
                      Bayar Yuran Khairat
                    </button>
                  </div>
                </div>
              )}

              {/* Tanggungan */}
              {result.tanggungan && result.tanggungan.length > 0 && (
                <div className="card shadow mb-4">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="bi bi-people me-2"></i>
                      Senarai Tanggungan
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-striped mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Bil</th>
                            <th>Nama</th>
                            <th>Hubungan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.tanggungan.map((t, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{t.nama}</td>
                              <td>
                                <span className="badge bg-secondary">{t.hubungan}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History - New System (Yuran Tahunan) */}
              {result.payments && result.payments.filter(p => p.source === 'new').length > 0 && (
                <div className="card shadow mb-4">
                  <div className="card-header bg-success text-white">
                    <h6 className="mb-0">
                      <i className="bi bi-credit-card me-2"></i>
                      Rekod Pembayaran Yuran Tahunan
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-striped mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Tahun</th>
                            <th>Jumlah (RM)</th>
                            <th>No. Resit</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.payments.filter(p => p.source === 'new').map((p, index) => (
                            <tr key={index}>
                              <td><strong>{p.tahun}</strong></td>
                              <td>{Number(p.jumlah || 0).toFixed(2)}</td>
                              <td>{p.no_resit || '-'}</td>
                              <td>{getPaymentStatusBadge(p.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment History - Old System (From Excel) */}
              {result.payments && result.payments.filter(p => p.source === 'old').length > 0 && (
                <div className="card shadow mb-4">
                  <div className="card-header bg-secondary text-white">
                    <h6 className="mb-0">
                      <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                      Rekod Pembayaran Terdahulu (Data Lama)
                    </h6>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-striped mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Tahun</th>
                            <th>Jumlah (RM)</th>
                            <th>No. Resit</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.payments.filter(p => p.source === 'old').map((p, index) => (
                            <tr key={index}>
                              <td><strong>{p.tahun}</strong></td>
                              <td>{Number(p.jumlah || 0).toFixed(2)}</td>
                              <td>{p.no_resit || '-'}</td>
                              <td>{getPaymentStatusBadge(p.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <button
                  className="btn btn-outline-primary"
                  onClick={() => setMode('search')}
                >
                  <i className="bi bi-search me-2"></i>
                  Cari Semula
                </button>
                <button
                  className="btn btn-outline-secondary"
                  onClick={resetSearch}
                >
                  <i className="bi bi-arrow-left me-2"></i>
                  Kembali ke Menu
                </button>
                <Link href="/login" className="btn btn-outline-dark">
                  <i className="bi bi-house me-2"></i>
                  Laman Utama
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content">
                <div className="modal-header bg-warning text-dark">
                  <h5 className="modal-title">
                    <i className="bi bi-credit-card me-2"></i>
                    Bayar Yuran Khairat
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={resetPaymentForm}
                    disabled={paymentLoading}
                  ></button>
                </div>
                <form onSubmit={handlePaymentSubmit}>
                  <div className="modal-body">
                    {paymentSuccess ? (
                      <div className="text-center py-4">
                        <i className="bi bi-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                        <h4 className="mt-3 text-success">Pembayaran Berjaya Dihantar!</h4>
                        <p className="text-muted">
                          Pembayaran anda sedang menunggu kelulusan pentadbir.
                          Anda akan dimaklumkan melalui WhatsApp/Email setelah diluluskan.
                        </p>
                      </div>
                    ) : (
                      <>
                        {paymentError && (
                          <div className="alert alert-danger">
                            <i className="bi bi-exclamation-triangle me-2"></i>
                            {paymentError}
                          </div>
                        )}

                        {/* Member Info */}
                        <div className="card bg-light mb-4">
                          <div className="card-body">
                            <h6 className="card-title text-muted mb-3">Maklumat Ahli</h6>
                            <div className="row">
                              <div className="col-md-6">
                                <small className="text-muted">Nama</small>
                                <p className="fw-bold mb-2">{result.member?.nama}</p>
                              </div>
                              <div className="col-md-6">
                                <small className="text-muted">No. K/P</small>
                                <p className="fw-bold mb-2">{maskNoKP(result.member?.no_kp || '')}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            Tahun Bayaran <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={tahunBayaran}
                            onChange={(e) => setTahunBayaran(e.target.value)}
                            placeholder="Contoh: 2025 atau 2024, 2025"
                            disabled={paymentLoading}
                            required
                          />
                          <div className="form-text">
                            Masukkan tahun yang ingin dibayar. Boleh masukkan lebih dari satu tahun dipisahkan dengan koma.
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            Amaun Bayaran <span className="text-danger">*</span>
                          </label>
                          <div className="input-group">
                            <span className="input-group-text">RM</span>
                            <input
                              type="number"
                              className="form-control"
                              value={amaun}
                              onChange={(e) => setAmaun(e.target.value)}
                              placeholder="Masukkan amaun bayaran"
                              min="1"
                              step="0.01"
                              disabled={paymentLoading}
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            No. Resit Pembayaran <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={noResit}
                            onChange={(e) => setNoResit(e.target.value)}
                            placeholder="Masukkan nombor resit/rujukan transaksi"
                            disabled={paymentLoading}
                            required
                          />
                        </div>

                        <div className="mb-3">
                          <label className="form-label">
                            Muat Naik Resit
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".jpg,.jpeg,.png,.pdf"
                            disabled={paymentLoading}
                          />
                          <div className="form-text">
                            Format yang dibenarkan: JPEG, PNG, PDF (Maks: 5MB)
                          </div>
                          {resitFile && (
                            <div className="mt-2">
                              <span className="badge bg-success">
                                <i className="bi bi-file-check me-1"></i>
                                {resitFile.name}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Bank Info */}
                        <div className="card bg-info bg-opacity-10 border-info">
                          <div className="card-body">
                            <h6 className="card-title text-info">
                              <i className="bi bi-bank me-2"></i>
                              Maklumat Akaun Bank
                            </h6>
                            <p className="mb-1"><strong>Mohamad Shahril b Arshad (AJK Khairat)</strong></p>
                            <p className="mb-1 font-monospace fs-5">164 418 045 496</p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  {!paymentSuccess && (
                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={resetPaymentForm}
                        disabled={paymentLoading}
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="btn btn-warning"
                        disabled={paymentLoading || !tahunBayaran || !noResit || !amaun || parseFloat(amaun) <= 0}
                      >
                        {paymentLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            {uploadingFile ? 'Memuat Naik...' : 'Menghantar...'}
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send me-2"></i>
                            Hantar Pembayaran
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
