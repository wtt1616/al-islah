import Link from 'next/link';

export default function PublicFooter() {
  return (
    <footer className="mt-5 py-3 bg-light border-top">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
            <small className="text-muted">
              <i className="bi bi-mosque me-1"></i>
              Sistem iSAR - Surau Ar-Raudhah
            </small>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <Link href="/help/public" className="text-decoration-none text-muted me-3">
              <i className="bi bi-question-circle me-1"></i>
              Bantuan
            </Link>
            <Link href="/login" className="text-decoration-none text-muted">
              <i className="bi bi-box-arrow-in-right me-1"></i>
              Log Masuk
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
