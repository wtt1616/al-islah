'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicFooter from '@/components/PublicFooter';

export default function MaklumbalasPage() {
  const [formData, setFormData] = useState({
    nama: '',
    no_telefon: '',
    alamat: '',
    emel: '',
    mesej: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghantar maklum balas');
      }

      setSuccess(true);
      setFormData({
        nama: '',
        no_telefon: '',
        alamat: '',
        emel: '',
        mesej: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
        <div className="card shadow-lg" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="card-body text-center py-5">
            <div className="mb-4">
              <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '5rem' }}></i>
            </div>
            <h3 className="mb-3">Terima Kasih!</h3>
            <p className="text-muted mb-4">
              Maklum balas anda telah berjaya dihantar kepada pihak pengurusan Surau Ar-Raudhah.
              Kami akan menghubungi anda melalui WhatsApp atau emel sekiranya terdapat sebarang maklum balas.
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-primary"
                onClick={() => setSuccess(false)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Hantar Maklum Balas Lain
              </button>
              <Link href="/" className="btn btn-outline-secondary">
                <i className="bi bi-house me-2"></i>
                Kembali ke Laman Utama
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="mb-3">
                <i className="bi bi-mosque text-success" style={{ fontSize: '3rem' }}></i>
              </div>
              <h2 className="fw-bold text-success">Surau Ar-Raudhah</h2>
              <p className="text-muted">Borang Maklum Balas Awam</p>
            </div>

            {/* Form Card */}
            <div className="card shadow">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-chat-left-text me-2"></i>
                  Maklum Balas / Cadangan / Komen
                </h5>
              </div>
              <div className="card-body p-4">
                <p className="text-muted mb-4">
                  Sila lengkapkan borang di bawah untuk menghantar maklum balas, cadangan atau komen kepada pihak pengurusan Surau Ar-Raudhah.
                  Semua maklumat yang diberikan adalah sulit dan hanya akan digunakan untuk tujuan pengurusan sahaja.
                </p>

                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Nama */}
                  <div className="mb-3">
                    <label htmlFor="nama" className="form-label">
                      Nama Penuh <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="nama"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      placeholder="Masukkan nama penuh anda"
                      required
                    />
                  </div>

                  {/* No Telefon */}
                  <div className="mb-3">
                    <label htmlFor="no_telefon" className="form-label">
                      No. Telefon Bimbit <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      id="no_telefon"
                      name="no_telefon"
                      value={formData.no_telefon}
                      onChange={handleChange}
                      placeholder="Contoh: 012-3456789"
                      required
                    />
                    <div className="form-text">
                      Nombor ini akan digunakan untuk menghubungi anda melalui WhatsApp
                    </div>
                  </div>

                  {/* Alamat */}
                  <div className="mb-3">
                    <label htmlFor="alamat" className="form-label">
                      Alamat Rumah <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="alamat"
                      name="alamat"
                      rows={2}
                      value={formData.alamat}
                      onChange={handleChange}
                      placeholder="Masukkan alamat rumah anda"
                      required
                    ></textarea>
                  </div>

                  {/* Emel */}
                  <div className="mb-3">
                    <label htmlFor="emel" className="form-label">
                      Alamat Emel <span className="text-danger">*</span>
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="emel"
                      name="emel"
                      value={formData.emel}
                      onChange={handleChange}
                      placeholder="contoh@email.com"
                      required
                    />
                    <div className="form-text">
                      Jawapan daripada pengurusan akan dihantar ke emel ini
                    </div>
                  </div>

                  {/* Mesej */}
                  <div className="mb-4">
                    <label htmlFor="mesej" className="form-label">
                      Cadangan / Komen / Pendapat <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="mesej"
                      name="mesej"
                      rows={5}
                      value={formData.mesej}
                      onChange={handleChange}
                      placeholder="Sila nyatakan cadangan, komen atau pendapat anda di sini..."
                      required
                    ></textarea>
                  </div>

                  {/* Submit Button */}
                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-success btn-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Menghantar...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Hantar Maklum Balas
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center mt-4 text-muted">
              <small>
                <i className="bi bi-shield-check me-1"></i>
                Maklumat anda adalah sulit dan dilindungi
              </small>
              <br />
              <small className="mt-2 d-block">
                <Link href="/" className="text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i>
                  Kembali ke Laman Utama
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
