'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { HartaModal } from '@/types';

export default function HartaModalReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hartaModal, setHartaModal] = useState<HartaModal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session) {
      const role = (session.user as any).role;
      if (role !== 'admin' && role !== 'inventory_staff') {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchHartaModal();
    }
  }, [session]);

  const fetchHartaModal = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/harta-modal');
      if (response.ok) {
        const data = await response.json();
        setHartaModal(data);
      }
    } catch (error) {
      console.error('Error fetching harta modal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (status === 'loading' || !session) {
    return (
      <div className="loading">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('ms-MY', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <div className="no-print">
        <Navbar />
      </div>

      <div className="container mt-4">
        <div className="no-print mb-3">
          <button className="btn btn-secondary me-2" onClick={() => router.push('/harta-modal')}>
            &larr; Kembali
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            Cetak Laporan
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : (
          <div className="report-content">
            {/* Report Header */}
            <div className="text-center mb-4">
              <h3 className="mb-1">LAPORAN HARTA MODAL</h3>
              <h5 className="mb-1">Sistem Pengurusan Jadual Solat (iSAR)</h5>
              <p className="text-muted mb-0">Tarikh: {currentDate}</p>
            </div>

            {/* Summary */}
            <div className="mb-4">
              <div className="card">
                <div className="card-body">
                  <h6 className="mb-2">Ringkasan:</h6>
                  <p className="mb-0">Jumlah Harta Modal: <strong>{hartaModal.length}</strong> item</p>
                </div>
              </div>
            </div>

            {/* Harta Modal Table */}
            <div className="table-responsive">
              <table className="table table-bordered">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: '5%' }}>Bil.</th>
                    <th style={{ width: '20%' }}>No. Siri Pendaftaran</th>
                    <th style={{ width: '45%' }}>Keterangan</th>
                    <th style={{ width: '30%' }}>Cara Diperolehi</th>
                  </tr>
                </thead>
                <tbody>
                  {hartaModal.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        Tiada harta modal untuk dipaparkan
                      </td>
                    </tr>
                  ) : (
                    hartaModal.map((item, index) => (
                      <tr key={item.id}>
                        <td className="text-center">{index + 1}</td>
                        <td>{item.no_siri_pendaftaran}</td>
                        <td>{item.keterangan}</td>
                        <td>{item.cara_diperolehi}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer for print */}
            <div className="mt-5 pt-4 print-only">
              <div className="row">
                <div className="col-6">
                  <p className="mb-1">Disediakan Oleh:</p>
                  <p className="mb-0">_______________________</p>
                  <p className="mb-0 small">Nama & Tandatangan</p>
                </div>
                <div className="col-6">
                  <p className="mb-1">Disahkan Oleh:</p>
                  <p className="mb-0">_______________________</p>
                  <p className="mb-0 small">Nama & Tandatangan</p>
                </div>
              </div>
            </div>

            {/* Print timestamp */}
            <div className="mt-4 text-center text-muted small print-only">
              <p className="mb-0">Cetakan: {new Date().toLocaleString('ms-MY')}</p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          body {
            background: white;
          }

          .container {
            max-width: 100%;
            padding: 20px;
          }

          .report-content {
            page-break-inside: avoid;
          }

          table {
            font-size: 12px;
          }

          th, td {
            padding: 8px !important;
          }

          .card {
            border: 1px solid #dee2e6 !important;
            box-shadow: none !important;
          }
        }

        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
