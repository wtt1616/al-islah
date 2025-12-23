'use client';

import { useState } from 'react';

export default function InfaqPage() {
  const [copied, setCopied] = useState(false);

  const bankInfo = {
    bank: 'Bank Islam',
    accountName: 'Surau Al-Islah',
    accountNumber: '12092010036214',
  };

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(bankInfo.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b4e 100%)' }}>
      {/* Header */}
      <nav className="navbar navbar-dark" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <div className="container">
          <a href="/" className="navbar-brand d-flex align-items-center">
            <i className="bi bi-arrow-left me-2"></i>
            Kembali
          </a>
        </div>
      </nav>

      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            {/* Main Card */}
            <div className="card border-0 shadow-lg" style={{ borderRadius: '1.5rem', overflow: 'hidden' }}>
              {/* Header Section */}
              <div
                className="text-center text-white py-4"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                }}
              >
                <i className="bi bi-heart-fill mb-2" style={{ fontSize: '2.5rem' }}></i>
                <h2 className="mb-1 fw-bold">Infaq & Sumbangan</h2>
                <p className="mb-0 opacity-75">Surau Al-Islah</p>
              </div>

              {/* QR Code Section */}
              <div className="card-body text-center p-4">
                <p className="text-muted mb-3">
                  Scan QR Code menggunakan aplikasi <strong>Internet Banking</strong> atau <strong>E-wallet</strong>
                </p>

                <div className="mb-4">
                  <img
                    src="/qr_sar.jpeg"
                    alt="QR Code Infaq Surau Al-Islah"
                    className="img-fluid rounded-3 shadow"
                    style={{ maxWidth: '280px' }}
                  />
                </div>

                {/* Divider */}
                <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1" />
                  <span className="px-3 text-muted small">atau transfer ke</span>
                  <hr className="flex-grow-1" />
                </div>

                {/* Bank Info */}
                <div
                  className="p-4 rounded-3 mb-3"
                  style={{ background: '#f8f9fa' }}
                >
                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Bank_Islam_logo.svg/320px-Bank_Islam_logo.svg.png"
                      alt="Bank Islam"
                      style={{ height: '30px' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="ms-2 fw-bold text-danger" style={{ fontSize: '1.25rem' }}>Bank Islam</span>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted d-block">Nama Akaun</small>
                    <strong className="fs-5">{bankInfo.accountName}</strong>
                  </div>

                  <div className="mb-3">
                    <small className="text-muted d-block">No. Akaun</small>
                    <div className="d-flex align-items-center justify-content-center gap-2">
                      <strong
                        className="fs-4 font-monospace"
                        style={{ letterSpacing: '1px', color: '#059669' }}
                      >
                        {bankInfo.accountNumber}
                      </strong>
                      <button
                        className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                        onClick={copyAccountNumber}
                        title="Salin no akaun"
                      >
                        <i className={`bi ${copied ? 'bi-check' : 'bi-clipboard'}`}></i>
                      </button>
                    </div>
                    {copied && (
                      <small className="text-success d-block mt-1">
                        <i className="bi bi-check-circle me-1"></i>
                        No akaun disalin!
                      </small>
                    )}
                  </div>
                </div>

                {/* Note */}
                <div className="alert alert-info border-0 small mb-0" style={{ background: '#e0f2fe' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Sumbangan anda akan digunakan untuk penyelenggaraan dan aktiviti surau.
                  Semoga Allah SWT membalas kebaikan anda dengan berlipat ganda.
                </div>
              </div>

              {/* Footer */}
              <div
                className="card-footer text-center py-3 border-0"
                style={{ background: '#f1f5f9' }}
              >
                <small className="text-muted">
                  <i className="bi bi-geo-alt me-1"></i>
                  Impian Makmur Saujana Impian, 43000 Kajang
                </small>
              </div>
            </div>

            {/* Additional Info */}
            <div className="text-center mt-4 text-white-50 small">
              <p className="mb-1">
                <i className="bi bi-telephone me-1"></i>
                Sebarang pertanyaan, sila hubungi pihak surau
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
