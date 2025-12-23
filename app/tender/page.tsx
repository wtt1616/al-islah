'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tender {
  id: number;
  tajuk: string;
  keterangan: string | null;
  tarikh_mula: string;
  tarikh_akhir: string;
  dokumen: string | null;
  harga: number;
  status: 'aktif' | 'tamat' | 'batal';
}

export default function PublicTenderPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      const res = await fetch('/api/tender');
      if (res.ok) {
        const data = await res.json();
        setTenders(data.data);
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (endDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <Link href="/" className="navbar-brand d-flex align-items-center">
            <img src="/surau-logo.png" alt="Logo" height="40" className="me-2" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <span className="fw-bold text-success">Surau Al-Islah</span>
          </Link>
          <div className="ms-auto">
            <Link href="/" className="btn btn-outline-success">
              <i className="bi bi-house me-2"></i>
              Laman Utama
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Banner */}
      <div className="bg-success text-white py-5">
        <div className="container text-center">
          <h1 className="display-5 fw-bold mb-3">
            <i className="bi bi-file-earmark-text me-3"></i>
            Tender & Sebut Harga
          </h1>
          <p className="lead mb-0">
            Senarai tender dan sebut harga yang ditawarkan oleh Surau Al-Islah
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-5">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Memuatkan senarai tender...</p>
          </div>
        ) : tenders.length === 0 ? (
          <div className="text-center py-5">
            <div className="display-1 text-muted mb-4">
              <i className="bi bi-file-earmark-x"></i>
            </div>
            <h4 className="text-muted">Tiada Tender Aktif</h4>
            <p className="text-muted">Sila semak semula nanti untuk tender baharu.</p>
            <Link href="/" className="btn btn-success mt-3">
              <i className="bi bi-house me-2"></i>
              Kembali ke Laman Utama
            </Link>
          </div>
        ) : (
          <>
            <div className="row mb-4">
              <div className="col-12">
                <div className="alert alert-info d-flex align-items-center">
                  <i className="bi bi-info-circle me-3 fs-4"></i>
                  <div>
                    <strong>Maklumat:</strong> Sila hubungi pejabat surau untuk membeli dokumen tender.
                    Klik pada butang "Muat Turun Dokumen" untuk melihat maklumat lanjut.
                  </div>
                </div>
              </div>
            </div>

            <div className="row">
              {tenders.map((tender) => {
                const daysRemaining = getDaysRemaining(tender.tarikh_akhir);
                const isEnding = daysRemaining <= 3;

                return (
                  <div key={tender.id} className="col-md-6 col-lg-4 mb-4">
                    <div className={`card h-100 shadow-sm ${isEnding ? 'border-warning border-2' : ''}`}>
                      <div className="card-header bg-success text-white">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="mb-0 flex-grow-1">{tender.tajuk}</h6>
                          {isEnding && daysRemaining > 0 && (
                            <span className="badge bg-warning text-dark ms-2">
                              <i className="bi bi-clock me-1"></i>
                              {daysRemaining} hari lagi
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="card-body">
                        {tender.keterangan && (
                          <p className="card-text text-muted small mb-3">
                            {tender.keterangan}
                          </p>
                        )}

                        <div className="mb-3">
                          <div className="d-flex align-items-center mb-2">
                            <i className="bi bi-calendar-event text-success me-2"></i>
                            <small className="text-muted">
                              <strong>Tempoh Jualan:</strong>
                            </small>
                          </div>
                          <div className="ms-4">
                            <small>
                              {new Date(tender.tarikh_mula).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                              <span className="mx-2">hingga</span>
                              {new Date(tender.tarikh_akhir).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </small>
                          </div>
                        </div>

                        <div className="d-flex align-items-center mb-3">
                          <i className="bi bi-tag text-success me-2"></i>
                          <small className="text-muted me-2"><strong>Harga Dokumen:</strong></small>
                          {tender.harga > 0 ? (
                            <span className="badge bg-success fs-6">RM {Number(tender.harga).toFixed(2)}</span>
                          ) : (
                            <span className="badge bg-secondary">Percuma</span>
                          )}
                        </div>
                      </div>
                      <div className="card-footer bg-white border-top-0">
                        {tender.dokumen ? (
                          <a
                            href={tender.dokumen}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-success w-100"
                          >
                            <i className="bi bi-file-pdf me-2"></i>
                            Muat Turun Dokumen
                          </a>
                        ) : (
                          <button className="btn btn-outline-secondary w-100" disabled>
                            <i className="bi bi-file-earmark me-2"></i>
                            Dokumen Tidak Tersedia
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-dark text-white py-4 mt-auto">
        <div className="container text-center">
          <p className="mb-0">
            <i className="bi bi-building me-2"></i>
            Surau Al-Islah, Saujana Impian, Kajang
          </p>
          <small className="text-white-50">
            Untuk pertanyaan, sila hubungi pejabat surau.
          </small>
        </div>
      </footer>
    </div>
  );
}
