'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { JenisYuran, Pertalian } from '@/types';

interface Tanggungan {
  nama_penuh: string;
  no_kp: string;
  umur: string;
  pertalian: Pertalian;
}

export default function KhairatDaftarPage() {
  const [formData, setFormData] = useState({
    nama: '',
    no_kp: '',
    umur: '',
    alamat: '',
    no_telefon_rumah: '',
    no_hp: '',
    email: '',
    jenis_yuran: 'keahlian' as JenisYuran,
    no_resit: '',
    amaun_bayaran: '50.00'
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
    setTanggungan(prev => [...prev, { nama_penuh: '', no_kp: '', umur: '', pertalian: 'anak' }]);
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
              Permohonan keahlian khairat kematian anda telah berjaya dihantar kepada pihak pengurusan Masjid Saujana Impian.
              Anda akan menerima notifikasi melalui WhatsApp atau emel setelah permohonan diluluskan.
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
                    no_telefon_rumah: '',
                    no_hp: '',
                    email: '',
                    jenis_yuran: 'keahlian',
                    no_resit: '',
                    amaun_bayaran: '50.00'
                  });
                  setTanggungan([]);
                  setResitFile(null);
                  setResitPreview(null);
                }}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Hantar Permohonan Lain
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
          <div className="col-lg-10 col-xl-8">
            {/* Header */}
            <div className="text-center mb-4">
              <div className="mb-3">
                <i className="bi bi-mosque text-success" style={{ fontSize: '3rem' }}></i>
              </div>
              <h2 className="fw-bold text-success">Masjid Saujana Impian</h2>
              <p className="text-muted mb-1">Kajang, Selangor</p>
              <h4 className="text-dark">Borang Ahli Khairat Kematian</h4>
            </div>

            {/* Form Card */}
            <div className="card shadow">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-person-plus me-2"></i>
                  Permohonan Keahlian Baru
                </h5>
              </div>
              <div className="card-body p-4">
                {/* Notice */}
                <div className="alert alert-info mb-4">
                  <h6 className="alert-heading fw-bold">
                    <i className="bi bi-info-circle me-2"></i>
                    Maklumat Penting
                  </h6>
                  <ul className="mb-0 small">
                    <li>Setiap ahli baru akan menempuh tempoh bertenang selama <strong>satu (1) bulan</strong> dari tarikh daftar.</li>
                    <li>Keahlian yang tidak aktif selama <strong>dua (2) tahun</strong> dengan sendiri gugur keahlian.</li>
                    <li>Ibu bapa dan mertua <strong>bukan</strong> di bawah tanggungan pemohon.</li>
                    <li>Anak berumur 19 tahun ke atas sudah berkahwin <strong>bukan</strong> di bawah tanggungan pemohon.</li>
                  </ul>
                </div>

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
                    Maklumat Pemohon
                  </h6>

                  <div className="row">
                    {/* Nama */}
                    <div className="col-md-6 mb-3">
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
                        placeholder="Seperti dalam K/P"
                        required
                      />
                    </div>

                    {/* No K/P */}
                    <div className="col-md-4 mb-3">
                      <label htmlFor="no_kp" className="form-label">
                        No. K/P <span className="text-danger">*</span>
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

                    {/* Umur */}
                    <div className="col-md-2 mb-3">
                      <label htmlFor="umur" className="form-label">
                        Umur
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        id="umur"
                        name="umur"
                        value={formData.umur}
                        onChange={handleChange}
                        min="18"
                        max="120"
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
                    {/* No Telefon Rumah */}
                    <div className="col-md-4 mb-3">
                      <label htmlFor="no_telefon_rumah" className="form-label">
                        No. Telefon (R)
                      </label>
                      <input
                        type="tel"
                        className="form-control"
                        id="no_telefon_rumah"
                        name="no_telefon_rumah"
                        value={formData.no_telefon_rumah}
                        onChange={handleChange}
                        placeholder="03-12345678"
                      />
                    </div>

                    {/* No H/P */}
                    <div className="col-md-4 mb-3">
                      <label htmlFor="no_hp" className="form-label">
                        No. H/P <span className="text-danger">*</span>
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
                        Notifikasi akan dihantar ke nombor ini
                      </div>
                    </div>

                    {/* Email */}
                    <div className="col-md-4 mb-3">
                      <label htmlFor="email" className="form-label">
                        E-mel
                      </label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="contoh@email.com"
                      />
                    </div>
                  </div>

                  {/* Maklumat Yuran */}
                  <h6 className="fw-bold border-bottom pb-2 mb-3 mt-4">
                    <i className="bi bi-cash me-2"></i>
                    Maklumat Yuran & Bayaran
                  </h6>

                  <div className="row">
                    {/* Jenis Yuran */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Jenis Yuran <span className="text-danger">*</span>
                      </label>
                      <div className="border rounded p-3">
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="jenis_yuran"
                            id="yuran_keahlian"
                            value="keahlian"
                            checked={formData.jenis_yuran === 'keahlian'}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="yuran_keahlian">
                            Yuran Keahlian - <strong>RM 50.00</strong>
                            <br /><small className="text-muted">(Sekali sahaja)</small>
                          </label>
                        </div>
                        <div className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="jenis_yuran"
                            id="yuran_tahunan"
                            value="tahunan"
                            checked={formData.jenis_yuran === 'tahunan'}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="yuran_tahunan">
                            Yuran Tahunan - <strong>RM 50.00</strong>
                            <br /><small className="text-muted">(Setiap tahun)</small>
                          </label>
                        </div>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="jenis_yuran"
                            id="yuran_isteri_kedua"
                            value="isteri_kedua"
                            checked={formData.jenis_yuran === 'isteri_kedua'}
                            onChange={handleChange}
                          />
                          <label className="form-check-label" htmlFor="yuran_isteri_kedua">
                            Yuran Keahlian Isteri Kedua - <strong>RM 50.00</strong>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Maklumat Bayaran */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Maklumat Bayaran</label>
                      <div className="border rounded p-3">
                        <div className="mb-3">
                          <label htmlFor="no_resit" className="form-label small">
                            No. Resit <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            id="no_resit"
                            name="no_resit"
                            value={formData.no_resit}
                            onChange={handleChange}
                            placeholder="Masukkan no. resit bayaran"
                            required
                          />
                        </div>
                        <div className="mb-3">
                          <label htmlFor="amaun_bayaran" className="form-label small">
                            Amaun (RM)
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            id="amaun_bayaran"
                            name="amaun_bayaran"
                            value={formData.amaun_bayaran}
                            onChange={handleChange}
                            step="0.01"
                            min="0"
                          />
                        </div>

                        {/* Upload Resit */}
                        <div>
                          <label className="form-label small">
                            Muat Naik Resit
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
                            <div className="mt-2 p-2 bg-light rounded">
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
                    </div>
                  </div>

                  {/* Tanggungan */}
                  <h6 className="fw-bold border-bottom pb-2 mb-3 mt-4">
                    <i className="bi bi-people me-2"></i>
                    Senarai Tanggungan
                  </h6>

                  <div className="alert alert-secondary mb-3">
                    <small>
                      <strong>Tanggungan yang layak:</strong>
                      <ol className="mb-0 ps-3">
                        <li>Isteri</li>
                        <li>Anak yang berumur 25 tahun ke bawah dan belum berkahwin</li>
                        <li>Anak OKU</li>
                      </ol>
                    </small>
                  </div>

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
                              <th style={{ width: '40px' }}>No</th>
                              <th>Nama Penuh</th>
                              <th style={{ width: '150px' }}>No. K/P</th>
                              <th style={{ width: '80px' }}>Umur</th>
                              <th style={{ width: '130px' }}>Pertalian</th>
                              <th style={{ width: '50px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {tanggungan.map((t, index) => (
                              <tr key={index}>
                                <td className="text-center">{index + 1}</td>
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
                                    placeholder="No. K/P"
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
                                  />
                                </td>
                                <td>
                                  <select
                                    className="form-select form-select-sm"
                                    value={t.pertalian}
                                    onChange={(e) => updateTanggungan(index, 'pertalian', e.target.value)}
                                  >
                                    <option value="isteri">Isteri</option>
                                    <option value="anak">Anak</option>
                                    <option value="anak_oku">Anak OKU</option>
                                  </select>
                                </td>
                                <td className="text-center">
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
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-sm mb-3"
                        onClick={addTanggungan}
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Tambah Lagi Tanggungan
                      </button>
                    </>
                  )}

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
                          Memuat naik resit...
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
                <Link href="/" className="text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i>
                  Kembali ke Laman Utama
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
