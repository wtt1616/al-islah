'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { Pertalian } from '@/types';

interface Tanggungan {
  nama_penuh: string;
  no_kp: string;
  umur: string;
  pertalian: Pertalian;
  catatan: string;
}

export default function KhairatDaftarPage() {
  const [formData, setFormData] = useState({
    nama: '',
    no_kp: '',
    umur: '',
    alamat: '',
    no_hp: '',
    amaun_bayaran: '40.00'
  });

  const [tanggungan, setTanggungan] = useState<Tanggungan[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // File upload states
  const [resitFile, setResitFile] = useState<File | null>(null);
  const [resitPreview, setResitPreview] = useState<string | null>(null);
  const [uploadingResit, setUploadingResit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addTanggungan = () => {
    if (tanggungan.length >= 7) {
      setError('Maksimum 7 tanggungan sahaja dibenarkan');
      return;
    }
    setTanggungan(prev => [...prev, { nama_penuh: '', no_kp: '', umur: '', pertalian: 'anak', catatan: '' }]);
  };

  const removeTanggungan = (index: number) => {
    setTanggungan(prev => prev.filter((_, i) => i !== index));
  };

  const updateTanggungan = (index: number, field: keyof Tanggungan, value: string) => {
    setTanggungan(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Jenis fail tidak sah. Hanya JPEG, PNG, WebP dan PDF dibenarkan');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Saiz fail melebihi had 5MB');
      return;
    }

    setResitFile(file);
    setError('');

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setResitPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      // For PDF, just show the filename
      setResitPreview(null);
    }
  };

  const removeFile = () => {
    setResitFile(null);
    setResitPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadResitFile = async (): Promise<string | null> => {
    if (!resitFile) return null;

    setUploadingResit(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('resit', resitFile);

      const response = await fetch('/api/khairat/upload', {
        method: 'POST',
        body: formDataUpload
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memuat naik resit');
      }

      return data.filePath;
    } catch (err: any) {
      throw new Error(err.message || 'Gagal memuat naik resit');
    } finally {
      setUploadingResit(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate age (18-75)
    const umur = parseInt(formData.umur);
    if (umur < 18 || umur > 75) {
      setError('Umur mestilah antara 18 hingga 75 tahun');
      setLoading(false);
      return;
    }

    try {
      // Upload resit file first if selected
      let resitFilePath: string | null = null;
      if (resitFile) {
        resitFilePath = await uploadResitFile();
      }

      const response = await fetch('/api/khairat/daftar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          umur: formData.umur ? parseInt(formData.umur) : null,
          amaun_bayaran: parseFloat(formData.amaun_bayaran),
          jenis_yuran: 'keahlian',
          resit_file: resitFilePath,
          tanggungan: tanggungan.map(t => ({
            ...t,
            umur: t.umur ? parseInt(t.umur) : null
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghantar permohonan');
      }

      setSuccess(true);
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
            <h3 className="mb-3">Permohonan Berjaya Dihantar!</h3>
            <p className="text-muted mb-4">
              Permohonan keahlian Khairat Kematian anda telah berjaya dihantar kepada pihak pengurusan Surau al-Islah, Taman Kajang Mewah.
              Anda akan menerima notifikasi melalui WhatsApp setelah permohonan diluluskan.
            </p>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setSuccess(false);
                  setFormData({
                    nama: '',
                    no_kp: '',
                    umur: '',
                    alamat: '',
                    no_hp: '',
                    amaun_bayaran: '40.00'
                  });
                  setTanggungan([]);
                  setResitFile(null);
                  setResitPreview(null);
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Hantar Permohonan Lain
              </button>
              <Link href="/khairat" className="btn btn-outline-secondary">
                <i className="bi bi-arrow-left me-2"></i>
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 col-xl-9">
            {/* Header */}
            <div className="text-center mb-4">
              <img
                src="/images/surau-logo.png"
                alt="Logo Surau al-Islah"
                className="mb-3"
                style={{ height: '80px' }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h4 className="fw-bold text-success mb-1">Surau al-Islah</h4>
              <p className="text-muted mb-2">Taman Kajang Mewah</p>
              <h5 className="text-dark">Borang Keahlian Khairat Kematian 2025-2026</h5>
            </div>

            {/* Info Card */}
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <p className="small text-muted mb-3">
                  Khairat Kematian Surau al-Islah, Taman Kajang Mewah adalah berasaskan konsep <strong>tabarru&apos;</strong>.
                  Dengan kata lain, jika dalam tempoh setahun tidak berlaku kematian dalam kalangan ahli atau tanggungannya,
                  maka bayaran tahunan yang telah dibayar dikira sebagai sumbangan yang dikumpulkan untuk membantu pembiayaan
                  pengurusan jenazah ahli lain atau tanggungannya.
                </p>

                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <h6 className="fw-bold text-primary mb-2">
                        <i className="bi bi-info-circle me-2"></i>Maklumat Keahlian
                      </h6>
                      <ul className="small mb-0">
                        <li>Keahlian: Jemaah kariah berumur <strong>18-75 tahun</strong></li>
                        <li>Bayaran Sesi 2025-2026: <strong>RM40</strong></li>
                        <li>Tempoh: <strong>1 Julai 2025 - 30 Jun 2026</strong></li>
                      </ul>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="border rounded p-3 h-100">
                      <h6 className="fw-bold text-success mb-2">
                        <i className="bi bi-gift me-2"></i>Manfaat
                      </h6>
                      <ul className="small mb-0">
                        <li><strong>Ahli & Pasangan:</strong>
                          <ul className="mb-1">
                            <li>RM1,600 (Umur 18-70 tahun)</li>
                            <li>RM1,200 (Umur 71-75 tahun)</li>
                          </ul>
                        </li>
                        <li><strong>Anak</strong> (Sehingga 3 kematian):
                          <ul className="mb-0">
                            <li>RM1,000 (6 bulan - 17 tahun / hingga 23 tahun jika masih belajar)</li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="card shadow">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-person-plus me-2"></i>
                  Borang Permohonan
                </h5>
              </div>
              <div className="card-body p-4">
                {error && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                    <button type="button" className="btn-close" onClick={() => setError('')}></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Maklumat Pemohon */}
                  <h6 className="fw-bold border-bottom pb-2 mb-3">
                    <i className="bi bi-person me-2"></i>
                    Maklumat Ahli
                  </h6>

                  <div className="row">
                    {/* Nama */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nama" className="form-label">
                        Nama Penuh Ahli <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="nama"
                        name="nama"
                        value={formData.nama}
                        onChange={handleChange}
                        placeholder="Seperti dalam Kad Pengenalan"
                        required
                      />
                    </div>

                    {/* No K/P */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="no_kp" className="form-label">
                        Nombor Kad Pengenalan <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="no_kp"
                        name="no_kp"
                        value={formData.no_kp}
                        onChange={handleChange}
                        placeholder="000000-00-0000"
                        required
                      />
                    </div>
                  </div>

                  {/* Alamat */}
                  <div className="mb-3">
                    <label htmlFor="alamat" className="form-label">
                      Alamat <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      id="alamat"
                      name="alamat"
                      rows={2}
                      value={formData.alamat}
                      onChange={handleChange}
                      placeholder="Alamat penuh"
                      required
                    ></textarea>
                  </div>

                  <div className="row">
                    {/* No H/P */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="no_hp" className="form-label">
                        Nombor Telefon Bimbit <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="no_hp"
                        name="no_hp"
                        value={formData.no_hp}
                        onChange={handleChange}
                        placeholder="012-3456789"
                        required
                      />
                      <div className="form-text">
                        Resit akan dihantar melalui WhatsApp ke nombor ini
                      </div>
                    </div>

                    {/* Umur */}
                    <div className="col-md-6 mb-3">
                      <label htmlFor="umur" className="form-label">
                        Umur pada tahun 2026 <span className="text-danger">*</span>
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="umur"
                        name="umur"
                        value={formData.umur}
                        onChange={handleChange}
                        min="18"
                        max="75"
                        placeholder="18-75"
                        required
                      />
                      <div className="form-text">
                        Keahlian dibuka untuk umur 18 hingga 75 tahun
                      </div>
                    </div>
                  </div>

                  {/* Tanggungan */}
                  <h6 className="fw-bold border-bottom pb-2 mb-3 mt-4">
                    <i className="bi bi-people me-2"></i>
                    Tanggungan Saya
                  </h6>

                  {tanggungan.length === 0 ? (
                    <div className="text-center py-4 bg-light rounded mb-3">
                      <p className="text-muted mb-2">Tiada tanggungan ditambah</p>
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm"
                        onClick={addTanggungan}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Tambah Tanggungan
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="table-responsive mb-3">
                        <table className="table table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: '40px' }}>Bil</th>
                              <th>Nama</th>
                              <th style={{ width: '140px' }}>No. KP</th>
                              <th style={{ width: '100px' }}>Umur (2026)</th>
                              <th style={{ width: '120px' }}>Pertalian</th>
                              <th style={{ width: '120px' }}>Catatan</th>
                              <th style={{ width: '50px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {tanggungan.map((t, index) => (
                              <tr key={index}>
                                <td className="text-center align-middle">{index + 1}</td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={t.nama_penuh}
                                    onChange={(e) => updateTanggungan(index, 'nama_penuh', e.target.value)}
                                    placeholder="Nama penuh"
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={t.no_kp}
                                    onChange={(e) => updateTanggungan(index, 'no_kp', e.target.value)}
                                    placeholder="No. KP"
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    value={t.umur}
                                    onChange={(e) => updateTanggungan(index, 'umur', e.target.value)}
                                    min="0"
                                    max="120"
                                    placeholder="Umur"
                                  />
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={t.pertalian}
                                    onChange={(e) => updateTanggungan(index, 'pertalian', e.target.value)}
                                  >
                                    <option value="pasangan">Pasangan</option>
                                    <option value="anak">Anak</option>
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    value={t.catatan}
                                    onChange={(e) => updateTanggungan(index, 'catatan', e.target.value)}
                                    placeholder="Catatan"
                                  />
                                </td>
                                <td className="text-center align-middle">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => removeTanggungan(index)}
                                    title="Padam"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {tanggungan.length < 7 && (
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm mb-3"
                          onClick={addTanggungan}
                        >
                          <i className="bi bi-plus-circle me-2"></i>
                          Tambah Lagi Tanggungan
                        </button>
                      )}
                    </>
                  )}

                  {/* Maklumat Bayaran */}
                  <h6 className="fw-bold border-bottom pb-2 mb-3 mt-4">
                    <i className="bi bi-credit-card me-2"></i>
                    Maklumat Bayaran
                  </h6>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <div className="border rounded p-3 bg-light">
                        <h6 className="fw-bold mb-2">Kaedah Bayaran:</h6>
                        <p className="small mb-2">
                          <strong>1. Pindahan Bank:</strong><br />
                          Maybank: <strong>562834609705</strong><br />
                          Nama: Surau al-Islah<br />
                          Rujukan: <em>&quot;Khairat Kematian&quot;</em>
                        </p>
                        <p className="small mb-0">
                          <strong>2. Tunai:</strong><br />
                          Bayar kepada Bendahari Surau
                        </p>
                      </div>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Jumlah Bayaran</label>
                      <div className="input-group mb-3">
                        <span className="input-group-text">RM</span>
                        <input
                          type="number"
                          className="form-control"
                          id="amaun_bayaran"
                          name="amaun_bayaran"
                          value={formData.amaun_bayaran}
                          onChange={handleChange}
                          step="0.01"
                          min="40"
                          readOnly
                        />
                      </div>

                      {/* Upload Resit */}
                      <label className="form-label">
                        Bukti Bayaran (Pilihan)
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="form-control form-control-sm"
                        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                        onChange={handleFileChange}
                      />
                      <div className="form-text">
                        Format: JPEG, PNG, WebP, PDF. Maks: 5MB
                      </div>

                      {/* File Preview */}
                      {resitFile && (
                        <div className="mt-2 p-2 bg-white border rounded">
                          <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center">
                              {resitPreview ? (
                                <img
                                  src={resitPreview}
                                  alt="Preview resit"
                                  className="me-2 rounded"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div
                                  className="me-2 bg-danger text-white rounded d-flex align-items-center justify-content-center"
                                  style={{ width: '50px', height: '50px' }}
                                >
                                  <i className="bi bi-file-pdf"></i>
                                </div>
                              )}
                              <div>
                                <small className="d-block text-truncate" style={{ maxWidth: '150px' }}>
                                  {resitFile.name}
                                </small>
                                <small className="text-muted">
                                  {(resitFile.size / 1024).toFixed(1)} KB
                                </small>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={removeFile}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="d-grid gap-2 mt-4">
                    <button
                      type="submit"
                      className="btn btn-success btn-lg"
                      disabled={loading || uploadingResit}
                    >
                      {uploadingResit ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Memuat naik...
                        </>
                      ) : loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
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

            {/* Footer Info */}
            <div className="text-center mt-4 text-muted">
              <small>
                <i className="bi bi-shield-check me-1"></i>
                Maklumat anda adalah sulit dan dilindungi
              </small>
              <br />
              <small className="mt-2 d-block">
                <Link href="/khairat" className="text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i>
                  Kembali ke Semakan Khairat
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
