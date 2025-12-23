'use client';

import { useState, useEffect } from 'react';

interface SumbangDerma {
  id: number;
  nama: string;
  alamat: string;
  telefon: string;
  keterangan: string;
  image_url: string | null;
  status: 'menunggu' | 'lulus';
  created_at: string;
}

export default function SumbangDermaPage() {
  const [data, setData] = useState<SumbangDerma[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    alamat: '',
    telefon: '',
    keterangan: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sumbang-derma');
      if (res.ok) {
        const result = await res.json();
        setData(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nama', formData.nama);
      formDataToSend.append('alamat', formData.alamat);
      formDataToSend.append('telefon', formData.telefon);
      formDataToSend.append('keterangan', formData.keterangan);
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const res = await fetch('/api/sumbang-derma', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal menghantar permohonan');
      }

      setSuccess('Permohonan sumbangan berjaya dihantar! Sila tunggu kelulusan dari pihak pengurusan surau.');
      setFormData({ nama: '', alamat: '', telefon: '', keterangan: '' });
      setImageFile(null);
      setImagePreview(null);
      setShowForm(false);
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || 'Gagal menghantar permohonan');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
      {/* Header */}
      <nav className="navbar navbar-light bg-white shadow-sm" style={{ borderBottom: '3px solid #059669' }}>
        <div className="container">
          <a href="/" className="navbar-brand d-flex align-items-center text-decoration-none">
            <i className="bi bi-arrow-left me-2" style={{ color: '#059669' }}></i>
            <span style={{ color: '#059669' }}>Kembali ke Laman Utama</span>
          </a>
        </div>
      </nav>

      <div className="container py-4">
        {/* Title Section */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
          >
            <i className="bi bi-hand-thumbs-up-fill text-white" style={{ fontSize: '2.5rem' }}></i>
          </div>
          <h2 className="fw-bold" style={{ color: '#059669' }}>Sumbang & Derma</h2>
          <p className="text-muted">
            Platform untuk ahli kariah memohon sumbangan atau derma dari masyarakat
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Add New Button */}
        <div className="text-center mb-4">
          <button
            className="btn btn-success btn-lg px-5 shadow"
            onClick={() => setShowForm(!showForm)}
            style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', border: 'none' }}
          >
            {showForm ? (
              <>
                <i className="bi bi-x-lg me-2"></i>
                Tutup Borang
              </>
            ) : (
              <>
                <i className="bi bi-plus-lg me-2"></i>
                Mohon Sumbangan / Derma
              </>
            )}
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="card mb-4 shadow-sm border-0">
            <div className="card-header text-white" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
              <h5 className="mb-0">
                <i className="bi bi-pencil-square me-2"></i>
                Borang Permohonan Sumbangan / Derma
              </h5>
            </div>
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-person me-1"></i> Nama Penuh <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="nama"
                      value={formData.nama}
                      onChange={handleInputChange}
                      required
                      placeholder="Masukkan nama penuh"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-telephone me-1"></i> No. Telefon <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      name="telefon"
                      value={formData.telefon}
                      onChange={handleInputChange}
                      required
                      placeholder="Contoh: 012-3456789"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-geo-alt me-1"></i> Alamat <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      required
                      rows={2}
                      placeholder="Masukkan alamat lengkap"
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-chat-left-text me-1"></i> Keterangan Sumbangan / Derma <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      name="keterangan"
                      value={formData.keterangan}
                      onChange={handleInputChange}
                      required
                      rows={4}
                      placeholder="Terangkan tujuan permohonan sumbangan atau derma anda dengan lengkap..."
                    ></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-image me-1"></i> Poster / Bunting (Pilihan)
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <small className="text-muted">Format: JPG, PNG, GIF. Maksimum 5MB.</small>
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="rounded shadow-sm"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="alert alert-info mt-4 mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Nota:</strong> Permohonan anda akan dipaparkan kepada orang ramai dengan status <span className="badge bg-warning text-dark">Menunggu Kelulusan</span>.
                  Setelah diluluskan oleh pihak pengurusan surau, status akan bertukar kepada <span className="badge bg-success">Telah Lulus</span>.
                </div>

                <div className="text-end">
                  <button
                    type="button"
                    className="btn btn-secondary me-2"
                    onClick={() => setShowForm(false)}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success px-4"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Menghantar...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Hantar Permohonan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List Section */}
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white">
            <h5 className="mb-0">
              <i className="bi bi-list-ul me-2" style={{ color: '#059669' }}></i>
              Senarai Permohonan Sumbangan & Derma
            </h5>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Memuatkan data...</p>
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
                <p className="mt-3 text-muted">Tiada permohonan sumbangan atau derma pada masa ini.</p>
              </div>
            ) : (
              <div className="row g-4">
                {data.map((item) => (
                  <div key={item.id} className="col-md-6 col-lg-4">
                    <div className="card h-100 shadow-sm border-0" style={{ borderRadius: '1rem' }}>
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt="Poster"
                          className="card-img-top"
                          style={{ height: '200px', objectFit: 'cover', cursor: 'pointer', borderRadius: '1rem 1rem 0 0' }}
                          onClick={() => setSelectedImage(item.image_url)}
                        />
                      )}
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title fw-bold mb-0">{item.nama}</h6>
                          {item.status === 'lulus' ? (
                            <span className="badge bg-success">
                              <i className="bi bi-check-circle me-1"></i>
                              Telah Lulus
                            </span>
                          ) : (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-hourglass-split me-1"></i>
                              Menunggu Kelulusan
                            </span>
                          )}
                        </div>
                        <p className="card-text small text-muted mb-2">
                          <i className="bi bi-geo-alt me-1"></i>
                          {item.alamat}
                        </p>
                        <p className="card-text small text-muted mb-2">
                          <i className="bi bi-telephone me-1"></i>
                          {item.telefon}
                        </p>
                        <hr />
                        <p className="card-text" style={{ whiteSpace: 'pre-wrap' }}>
                          {item.keterangan}
                        </p>
                      </div>
                      <div className="card-footer bg-transparent border-0">
                        <small className="text-muted">
                          <i className="bi bi-calendar me-1"></i>
                          Dihantar pada {formatDate(item.created_at)}
                        </small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="btn btn-light position-fixed"
            style={{ top: '20px', right: '20px', zIndex: 1070 }}
            onClick={() => setSelectedImage(null)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
          <img
            src={selectedImage}
            alt="Poster"
            style={{ maxWidth: '90%', maxHeight: '90vh', objectFit: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
