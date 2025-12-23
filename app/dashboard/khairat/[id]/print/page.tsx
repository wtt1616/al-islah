'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { KhairatAhli, KhairatTanggungan } from '@/types';

interface KhairatAhliDetail extends KhairatAhli {
  tanggungan: KhairatTanggungan[];
  approver_name?: string;
}

export default function KhairatPrintPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const [application, setApplication] = useState<KhairatAhliDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/login');
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (session && params.id) {
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

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '..........................................';
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
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

  // Calculate empty rows needed for tanggungan table (minimum 5 rows)
  const tanggunganRows = application.tanggungan || [];
  const emptyRowsNeeded = Math.max(0, 5 - tanggunganRows.length);
  const emptyRows = Array(emptyRowsNeeded).fill(null);

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
        }
        .print-page {
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.4;
          color: #000;
          background: #fff;
        }
        .print-page .header-logo {
          text-align: center;
          margin-bottom: 10px;
        }
        .print-page .form-title {
          text-align: center;
          font-weight: bold;
          font-size: 14pt;
          text-decoration: underline;
          margin-bottom: 20px;
        }
        .print-page .form-row {
          margin-bottom: 8px;
          display: flex;
          flex-wrap: wrap;
        }
        .print-page .form-label {
          min-width: 120px;
        }
        .print-page .form-value {
          flex: 1;
          border-bottom: 1px dotted #000;
          min-height: 18px;
          padding-left: 5px;
        }
        .print-page .form-value-inline {
          border-bottom: 1px dotted #000;
          min-height: 18px;
          padding: 0 5px;
          display: inline-block;
        }
        .print-page .checkbox-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 5px;
        }
        .print-page .checkbox-box {
          width: 16px;
          height: 16px;
          border: 1px solid #000;
          margin-right: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .print-page .checkbox-box.checked::after {
          content: '✓';
          font-weight: bold;
        }
        .print-page .tanggungan-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .print-page .tanggungan-table th,
        .print-page .tanggungan-table td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        .print-page .tanggungan-table th {
          background-color: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        .print-page .nota-section {
          margin-top: 15px;
          font-size: 10pt;
        }
        .print-page .nota-section p {
          margin: 2px 0;
        }
        .print-page .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        .print-page .signature-box {
          width: 45%;
        }
        .print-page .signature-line {
          border-bottom: 1px solid #000;
          margin-bottom: 5px;
          height: 40px;
        }
        .print-page .recipient-section {
          margin: 15px 0;
        }
        .print-page .letter-body {
          text-align: justify;
          margin: 15px 0;
        }
        .print-page .yuran-section {
          display: flex;
          gap: 20px;
          margin: 15px 0;
        }
        .print-page .yuran-left {
          flex: 2;
        }
        .print-page .yuran-right {
          flex: 1;
          border: 1px solid #000;
          padding: 10px;
        }
      `}</style>

      {/* Print Button - Hidden when printing */}
      <div className="no-print" style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          className="btn btn-secondary"
          onClick={() => router.back()}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Kembali
        </button>
        <button
          className="btn btn-primary"
          onClick={handlePrint}
        >
          <i className="bi bi-printer me-2"></i>
          Cetak Borang
        </button>
      </div>

      {/* Printable Form */}
      <div className="print-page" style={{ maxWidth: '210mm', margin: '0 auto', padding: '20px', background: '#fff' }}>
        {/* Header with Logo */}
        <div className="header-logo">
          <img
            src="/masjid-logo.png"
            alt="Logo Masjid Saujana Impian"
            style={{ height: '120px', marginBottom: '10px' }}
            onError={(e) => {
              // If logo fails to load, hide it and show text header
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div style={{
            fontFamily: "'Times New Roman', serif",
            marginTop: '5px'
          }}>
            <div style={{
              fontWeight: 'bold',
              fontSize: '18pt',
              letterSpacing: '2px'
            }}>
              MASJID SAUJANA IMPIAN
            </div>
            <div style={{ fontSize: '11pt', marginTop: '2px' }}>Kajang, Selangor</div>
          </div>
        </div>

        {/* Form Title */}
        <div className="form-title">BORANG AHLI KHAIRAT KEMATIAN</div>

        {/* Applicant Information */}
        <div className="form-row">
          <span className="form-label">Nama Pemohon:</span>
          <span className="form-value">{application.nama}</span>
          <span style={{ marginLeft: '20px' }}>No. K/P:</span>
          <span className="form-value" style={{ maxWidth: '150px' }}>{application.no_kp}</span>
          <span style={{ marginLeft: '20px' }}>Umur:</span>
          <span className="form-value" style={{ maxWidth: '50px' }}>{application.umur || ''}</span>
        </div>

        <div className="form-row">
          <span className="form-label">Alamat:</span>
          <span className="form-value">{application.alamat}</span>
        </div>

        <div className="form-row">
          <span className="form-label">No. Telefon (R):</span>
          <span className="form-value" style={{ maxWidth: '150px' }}>{application.no_telefon_rumah || ''}</span>
          <span style={{ marginLeft: '20px' }}>No. H/P:</span>
          <span className="form-value" style={{ maxWidth: '150px' }}>{application.no_hp}</span>
          <span style={{ marginLeft: '20px' }}>E-mail:</span>
          <span className="form-value">{application.email || ''}</span>
        </div>

        <div className="form-row">
          <span className="form-label">Tarikh Daftar:</span>
          <span className="form-value" style={{ maxWidth: '200px' }}>{formatDate(application.tarikh_daftar)}</span>
        </div>

        {/* Recipient Section */}
        <div className="recipient-section">
          <p><strong>Kepada:</strong></p>
          <p style={{ marginLeft: '20px' }}>Pengerusi Khairat Kematian</p>
          <p style={{ marginLeft: '20px' }}>Masjid Saujana Impian</p>
        </div>

        <p><strong>Tuan,</strong></p>

        {/* Letter Body */}
        <div className="letter-body">
          <p>
            Adalah saya seperti nama yang tersebut di atas ingin menjadi Ahli Khairat Kematian Masjid Saujana Impian, Kajang. Saya
            akan mematuhi kepada semua syarat-syarat dan peraturan-peraturan yang telah ditetapkan oleh Khairat Kematian Masjid
            Saujana Impian.
          </p>
          <p style={{ marginTop: '10px' }}>
            Setiap ahli baru akan menempuh tempoh bertenang selama sebulan (1) dari tarikh daftar.<br />
            <strong>Keahlian yang tidak aktif selama dua (2) tahun dengan sendiri gugur keahlian</strong>
          </p>
        </div>

        {/* Yuran Section */}
        <p><strong>Bersama-sama ini disertakan:</strong></p>
        <div className="yuran-section">
          <div className="yuran-left">
            <div className="checkbox-item">
              <div className={`checkbox-box ${application.jenis_yuran === 'keahlian' ? 'checked' : ''}`}></div>
              <span>Yuran Keahlian sebanyak <strong>RM 50.00</strong> (Ringgit: Lima Puluh Ringgit Sahaja)</span>
            </div>
            <div className="checkbox-item">
              <div className={`checkbox-box ${application.jenis_yuran === 'tahunan' ? 'checked' : ''}`}></div>
              <span>Yuran Tahunan sebanyak <strong>RM 50.00</strong> (Ringgit: Lima Puluh Ringgit Sahaja)</span>
            </div>
            <div className="checkbox-item">
              <div className={`checkbox-box ${application.jenis_yuran === 'isteri_kedua' ? 'checked' : ''}`}></div>
              <span>Yuran Keahlian Isteri kedua <strong>RM 50.00</strong> (Ringgit: Lima Puluh Ringgit Sahaja)</span>
            </div>
          </div>
          <div className="yuran-right">
            <div style={{ marginBottom: '10px' }}>
              <span>No.resit: </span>
              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '100px' }}>
                {application.no_resit || ''}
              </span>
            </div>
            <div>
              <span>RM: </span>
              <span style={{ borderBottom: '1px dotted #000', display: 'inline-block', minWidth: '100px' }}>
                {application.amaun_bayaran ? parseFloat(String(application.amaun_bayaran)).toFixed(2) : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Signature Line */}
        <div className="form-row" style={{ marginTop: '20px' }}>
          <span>Tandatangan Pemohon: </span>
          <span className="form-value" style={{ maxWidth: '300px' }}></span>
        </div>

        {/* Tanggungan Section */}
        <p style={{ marginTop: '20px' }}>
          <strong>TANGGUNGAN: 1. Isteri.  2. Anak yang berumur 25 Tahun ke bawah dan belum berkahwin.  3. Anak OKU.</strong>
        </p>

        <table className="tanggungan-table">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>NO</th>
              <th style={{ width: '47%' }}>NAMA PENUH</th>
              <th style={{ width: '15%' }}>UMUR</th>
              <th style={{ width: '30%' }}>PERTALIAN DENGAN PEMOHON</th>
            </tr>
          </thead>
          <tbody>
            {tanggunganRows.map((t, index) => (
              <tr key={t.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>{t.nama_penuh}</td>
                <td style={{ textAlign: 'center' }}>{t.umur || ''}</td>
                <td style={{ textAlign: 'center' }}>
                  {t.pertalian === 'isteri' ? 'Isteri' :
                   t.pertalian === 'anak' ? 'Anak' :
                   t.pertalian === 'anak_oku' ? 'Anak OKU' : t.pertalian}
                </td>
              </tr>
            ))}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`}>
                <td style={{ textAlign: 'center' }}>{tanggunganRows.length + index + 1}</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
                <td>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Nota Section */}
        <div className="nota-section">
          <p><strong><u>NOTA:</u></strong></p>
          <p>1. IBU BAPA DAN MERTUA BUKAN DIBAWAH TANGGUNGAN PEMOHON</p>
          <p>2. IBU BAPA, MERTUA DAN ANAK2 MELEBIHI UMUR 25 TAHUN PERLU DAFTAR JADI AHLI BKKMSI</p>
          <p>3. PEMOHON ADA ISTERI LEBIH DARI SATU PERLU MENDAFTAR ISTERI MENJADI AHLI BKKMSI</p>
          <p>4. ANAK BERUMUR 19 TAHUN KEATAS SUDAH BERKAHWIN BUKAN DIBAWAH TANGGUNGAN PEMOHON</p>
        </div>

        {/* Signature Section */}
        <div className="signature-section">
          <div className="signature-box">
            <p>Di luluskan Oleh</p>
            <div className="signature-line"></div>
            <p><strong>Pengerusi BKKMSI</strong></p>
          </div>
          <div className="signature-box">
            <p>Diluluskan Oleh</p>
            <div className="signature-line">
              {application.status === 'approved' && application.approver_name && (
                <div style={{ textAlign: 'center', paddingTop: '15px', fontStyle: 'italic' }}>
                  {application.approver_name}
                </div>
              )}
            </div>
            <p><strong>Bendahari BKKMSI</strong></p>
          </div>
        </div>

        {/* Status indicator - only shown on screen, hidden on print */}
        {application.status !== 'pending' && (
          <div className="no-print" style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: application.status === 'approved' ? '#d4edda' : '#f8d7da',
            borderRadius: '5px',
            textAlign: 'center'
          }}>
            <strong>Status: </strong>
            {application.status === 'approved' ?
              `Diluluskan pada ${formatDate(application.tarikh_lulus)} oleh ${application.approver_name}` :
              `Ditolak - ${application.reject_reason}`
            }
          </div>
        )}
      </div>
    </>
  );
}
