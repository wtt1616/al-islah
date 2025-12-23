'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Tender {
  id: number;
  tajuk: string;
  keterangan: string | null;
  tarikh_mula: string;
  tarikh_akhir: string;
  harga: number;
  status: string;
}

interface Pembeli {
  id: number;
  tender_id: number;
  nama_syarikat: string;
  no_tel: string;
  nama_pembeli: string;
  no_resit: string | null;
  tarikh_beli: string;
  keterangan: string | null;
}

export default function LaporanPembeliTender() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenderId = searchParams.get('tender_id');

  const [tender, setTender] = useState<Tender | null>(null);
  const [pembeli, setPembeli] = useState<Pembeli[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && session.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session && tenderId) {
      fetchData();
    }
  }, [session, tenderId]);

  const fetchData = async () => {
    try {
      // Fetch tender details
      const tenderRes = await fetch(`/api/tender?id=${tenderId}`);
      if (tenderRes.ok) {
        const tenderData = await tenderRes.json();
        setTender(tenderData.data);
      }

      // Fetch pembeli
      const pembeliRes = await fetch(`/api/tender/pembeli?tender_id=${tenderId}`);
      if (pembeliRes.ok) {
        const pembeliData = await pembeliRes.json();
        setPembeli(pembeliData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (status === 'loading' || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">Tender tidak dijumpai</div>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          Kembali
        </button>
      </div>
    );
  }

  // Calculate total collection
  const jumlahKutipan = pembeli.length * tender.harga;

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
          }
          .report-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 15mm !important;
          }
          table {
            font-size: 10pt !important;
          }
          th, td {
            padding: 4px 6px !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
        .report-page {
          background: white;
          max-width: 210mm;
          margin: 20px auto;
          padding: 20mm;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }
        .signature-line {
          border-top: 1px solid #000;
          width: 200px;
          margin-top: 50px;
          padding-top: 5px;
        }
      `}</style>

      {/* Action buttons - hidden when printing */}
      <div className="no-print bg-light py-3 sticky-top border-bottom">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <button className="btn btn-secondary" onClick={() => window.close()}>
              <i className="bi bi-x-lg me-2"></i>
              Tutup
            </button>
            <div className="d-flex gap-2">
              <a href="/dashboard/tender" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>
                Ke Pengurusan Tender
              </a>
              <button className="btn btn-primary" onClick={handlePrint}>
                <i className="bi bi-printer me-2"></i>
                Cetak Laporan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div className="print-container">
        <div className="report-page">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="d-flex justify-content-center align-items-center mb-3">
              <img
                src="/surau-logo.png"
                alt="Logo Surau"
                className="header-logo me-3"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div>
                <h4 className="mb-0 fw-bold">SURAU AR-RAUDHAH</h4>
                <p className="mb-0 small">Saujana Impian, Kajang</p>
              </div>
            </div>
            <hr className="my-3" />
            <h5 className="fw-bold text-uppercase mb-1">SENARAI PENGAMBILAN DOKUMEN TENDER</h5>
          </div>

          {/* Tender Info */}
          <div className="mb-4">
            <table className="table table-borderless table-sm mb-0">
              <tbody>
                <tr>
                  <td style={{ width: '150px' }}><strong>Tajuk Tender</strong></td>
                  <td>: {tender.tajuk}</td>
                </tr>
                <tr>
                  <td><strong>Tempoh Jualan</strong></td>
                  <td>: {new Date(tender.tarikh_mula).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })} hingga {new Date(tender.tarikh_akhir).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                </tr>
                <tr>
                  <td><strong>Harga Dokumen</strong></td>
                  <td>: RM {Number(tender.harga).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pembeli Table */}
          <div className="table-responsive">
            <table className="table table-bordered">
              <thead className="table-light">
                <tr>
                  <th className="text-center" style={{ width: '40px' }}>Bil.</th>
                  <th>Nama Syarikat</th>
                  <th style={{ width: '120px' }}>No. Telefon</th>
                  <th>Nama Pembeli/Wakil</th>
                  <th style={{ width: '100px' }}>No. Resit</th>
                  <th style={{ width: '100px' }}>Tarikh Beli</th>
                  <th>Catatan</th>
                </tr>
              </thead>
              <tbody>
                {pembeli.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      Tiada rekod pembeli
                    </td>
                  </tr>
                ) : (
                  pembeli.map((p, index) => (
                    <tr key={p.id}>
                      <td className="text-center">{index + 1}</td>
                      <td>{p.nama_syarikat}</td>
                      <td>{p.no_tel}</td>
                      <td>{p.nama_pembeli}</td>
                      <td>{p.no_resit || '-'}</td>
                      <td>{new Date(p.tarikh_beli).toLocaleDateString('ms-MY')}</td>
                      <td>{p.keterangan || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-4">
            <div className="row">
              <div className="col-md-6">
                <table className="table table-sm table-borderless">
                  <tbody>
                    <tr>
                      <td><strong>Jumlah Pembeli</strong></td>
                      <td>: {pembeli.length} syarikat</td>
                    </tr>
                    <tr>
                      <td><strong>Jumlah Kutipan</strong></td>
                      <td>: RM {jumlahKutipan.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Signature section */}
          <div className="mt-5 pt-4">
            <div className="row">
              <div className="col-6">
                <p className="mb-0"><strong>Disediakan oleh:</strong></p>
                <div className="signature-line">
                  <p className="mb-0 small">Nama: _______________________</p>
                  <p className="mb-0 small">Tarikh: _______________________</p>
                </div>
              </div>
              <div className="col-6">
                <p className="mb-0"><strong>Disahkan oleh:</strong></p>
                <div className="signature-line">
                  <p className="mb-0 small">Nama: _______________________</p>
                  <p className="mb-0 small">Jawatan: _______________________</p>
                  <p className="mb-0 small">Tarikh: _______________________</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-5 pt-3 border-top">
            <small className="text-muted">
              Laporan dijana pada {new Date().toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </small>
          </div>
        </div>
      </div>
    </>
  );
}
