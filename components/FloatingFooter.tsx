'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const bankInfo = {
  bank: 'Bank Islam',
  accountName: 'Surau Ar-Raudhah',
  accountNumber: '12092010036214',
};

// Pages where footer should NOT be shown
const EXCLUDED_PAGES = [
  '/infaq',
  '/sumbang-derma',
];

export default function FloatingFooter() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const pathname = usePathname();

  // Check if current page should show the footer
  const shouldShowFooter = !EXCLUDED_PAGES.some(page => pathname?.startsWith(page));

  const copyAccountNumber = () => {
    navigator.clipboard.writeText(bankInfo.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!shouldShowFooter) {
    return null;
  }

  return (
    <>
      {/* QR Code Modal */}
      {showQR && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1060 }}
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-4 p-4 text-center shadow-lg"
            style={{ maxWidth: '350px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold text-success">
                <i className="bi bi-qr-code me-2"></i>
                Scan untuk Infaq
              </h6>
              <button
                className="btn btn-sm btn-light"
                onClick={() => setShowQR(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <img
              src="/qr_sar.jpeg"
              alt="QR Code Infaq"
              className="img-fluid rounded-3 shadow-sm mb-3"
              style={{ maxWidth: '250px' }}
            />
            <p className="text-muted small mb-2">
              Scan menggunakan Internet Banking atau E-wallet
            </p>
            <div className="bg-light rounded-3 p-2">
              <small className="text-muted d-block">{bankInfo.bank} - {bankInfo.accountName}</small>
              <strong className="text-success font-monospace">{bankInfo.accountNumber}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Floating Footer */}
      <div
        className="position-fixed bottom-0 start-0 end-0 d-print-none"
        style={{ zIndex: 1050 }}
      >
        {/* Expanded View */}
        {isExpanded && (
          <div
            className="mx-2 mb-2 rounded-4 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              animation: 'slideUp 0.3s ease-out',
            }}
          >
            <div className="p-3">
              <div className="row align-items-center g-3">
                {/* QR Code */}
                <div className="col-auto">
                  <img
                    src="/qr_sar.jpeg"
                    alt="QR Code"
                    className="rounded-3 shadow cursor-pointer"
                    style={{ width: '80px', height: '80px', objectFit: 'cover', cursor: 'pointer' }}
                    onClick={() => setShowQR(true)}
                  />
                </div>

                {/* Bank Info */}
                <div className="col text-white">
                  <div className="d-flex align-items-center mb-1">
                    <i className="bi bi-heart-fill me-2 text-warning"></i>
                    <strong>Infaq Surau Ar-Raudhah</strong>
                  </div>
                  <div className="small opacity-75 mb-1">
                    <i className="bi bi-bank me-1"></i>
                    {bankInfo.bank} - {bankInfo.accountName}
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="font-monospace fw-bold" style={{ letterSpacing: '1px' }}>
                      {bankInfo.accountNumber}
                    </span>
                    <button
                      className={`btn btn-sm ${copied ? 'btn-warning' : 'btn-outline-light'} py-0 px-2`}
                      onClick={copyAccountNumber}
                      title="Salin no akaun"
                    >
                      <i className={`bi ${copied ? 'bi-check' : 'bi-clipboard'} small`}></i>
                    </button>
                  </div>
                  {copied && (
                    <small className="text-warning">
                      <i className="bi bi-check-circle me-1"></i>
                      Disalin!
                    </small>
                  )}
                </div>

                {/* Close Button */}
                <div className="col-auto">
                  <button
                    className="btn btn-sm btn-outline-light rounded-circle"
                    onClick={() => setIsExpanded(false)}
                    style={{ width: '32px', height: '32px' }}
                  >
                    <i className="bi bi-chevron-down"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Collapsed View - Small Button */}
        {!isExpanded && (
          <div className="d-flex justify-content-end p-2">
            <button
              className="btn btn-success shadow-lg rounded-pill px-3 py-2 d-flex align-items-center gap-2"
              onClick={() => setIsExpanded(true)}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                border: 'none',
                animation: 'pulse 2s infinite',
              }}
            >
              <i className="bi bi-heart-fill text-warning"></i>
              <span className="fw-semibold">Infaq</span>
              <i className="bi bi-chevron-up small"></i>
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(5, 150, 105, 0);
          }
        }
      `}</style>
    </>
  );
}
