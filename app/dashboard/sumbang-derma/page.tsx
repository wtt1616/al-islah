'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface SumbangDerma {
  id: number;
  nama: string;
  alamat: string;
  telefon: string;
  keterangan: string;
  image_url: string | null;
  status: 'menunggu' | 'lulus';
  created_at: string;
  approved_at: string | null;
  approved_by: number | null;
  approved_by_name: string | null;
}

export default function AdminSumbangDermaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<SumbangDerma[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'menunggu' | 'lulus'>('all');
  const [editItem, setEditItem] = useState<SumbangDerma | null>(null);
  const [editForm, setEditForm] = useState({
    nama: '',
    alamat: '',
    telefon: '',
    keterangan: '',
  });
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (!['admin', 'bendahari'].includes(session?.user?.role || '')) {
        router.push('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [status, session, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/sumbang-derma?admin=true');
      if (res.ok) {
        const result = await res.json();
        setData(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuatkan data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk meluluskan permohonan ini?')) return;

    try {
      setActionLoading(id);
      const res = await fetch('/api/sumbang-derma', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve' }),
      });

      if (!res.ok) throw new Error('Gagal meluluskan permohonan');

      setSuccess('Permohonan telah diluluskan');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal meluluskan permohonan');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam permohonan ini? Tindakan ini tidak boleh dibatalkan.')) return;

    try {
      setActionLoading(id);
      const res = await fetch(`/api/sumbang-derma?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Gagal memadam permohonan');

      setSuccess('Permohonan telah dipadam');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal memadam permohonan');
      setTimeout(() => setError(''), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const openEditModal = (item: SumbangDerma) => {
    setEditItem(item);
    setEditForm({
      nama: item.nama,
      alamat: item.alamat,
      telefon: item.telefon,
      keterangan: item.keterangan,
    });
    setEditImage(null);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;

    try {
      setEditLoading(true);
      const formData = new FormData();
      formData.append('id', editItem.id.toString());
      formData.append('nama', editForm.nama);
      formData.append('alamat', editForm.alamat);
      formData.append('telefon', editForm.telefon);
      formData.append('keterangan', editForm.keterangan);
      if (editImage) {
        formData.append('image', editImage);
      }

      const res = await fetch('/api/sumbang-derma', {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) throw new Error('Gagal mengemaskini rekod');

      setSuccess('Rekod telah dikemaskini');
      setEditItem(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal mengemaskini rekod');
      setTimeout(() => setError(''), 3000);
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredData = data.filter((item) => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const pendingCount = data.filter((d) => d.status === 'menunggu').length;
  const approvedCount = data.filter((d) => d.status === 'lulus').length;

  if (status === 'loading' || loading) {
    return (
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container py-5 text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Memuatkan data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">
              <i className="bi bi-hand-thumbs-up-fill me-2" style={{ color: '#059669' }}></i>
              Pengurusan Sumbang & Derma
            </h3>
            <p className="text-muted mb-0">Urus permohonan sumbangan dan derma dari ahli kariah</p>
          </div>
          <a href="/sumbang-derma" className="btn btn-outline-success" target="_blank">
            <i className="bi bi-eye me-2"></i>
            Lihat Paparan Awam
          </a>
        </div>

        {/* Stats */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                  <i className="bi bi-list-ul text-primary" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h4 className="mb-0">{data.length}</h4>
                  <small className="text-muted">Jumlah Permohonan</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                  <i className="bi bi-hourglass-split text-warning" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h4 className="mb-0">{pendingCount}</h4>
                  <small className="text-muted">Menunggu Kelulusan</small>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body d-flex align-items-center">
                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                  <i className="bi bi-check-circle text-success" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h4 className="mb-0">{approvedCount}</h4>
                  <small className="text-muted">Telah Lulus</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
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

        {/* Filter Tabs */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  Semua ({data.length})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'menunggu' ? 'active' : ''}`}
                  onClick={() => setFilter('menunggu')}
                >
                  <i className="bi bi-hourglass-split me-1"></i>
                  Menunggu ({pendingCount})
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${filter === 'lulus' ? 'active' : ''}`}
                  onClick={() => setFilter('lulus')}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Lulus ({approvedCount})
                </button>
              </li>
            </ul>
          </div>
          <div className="card-body">
            {filteredData.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
                <p className="mt-3 text-muted">Tiada permohonan untuk dipaparkan.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '80px' }}>Poster</th>
                      <th>Maklumat Pemohon</th>
                      <th>Keterangan</th>
                      <th style={{ width: '120px' }}>Status</th>
                      <th style={{ width: '150px' }}>Tarikh</th>
                      <th style={{ width: '150px' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id}>
                        <td>
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt="Poster"
                              className="rounded shadow-sm"
                              style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                              onClick={() => setSelectedImage(item.image_url)}
                            />
                          ) : (
                            <div
                              className="rounded bg-light d-flex align-items-center justify-content-center"
                              style={{ width: '60px', height: '60px' }}
                            >
                              <i className="bi bi-image text-muted"></i>
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-bold">{item.nama}</div>
                          <small className="text-muted">
                            <i className="bi bi-telephone me-1"></i>
                            {item.telefon}
                          </small>
                          <br />
                          <small className="text-muted">
                            <i className="bi bi-geo-alt me-1"></i>
                            {item.alamat}
                          </small>
                        </td>
                        <td>
                          <div style={{ maxWidth: '300px', whiteSpace: 'pre-wrap' }}>
                            {item.keterangan.length > 150
                              ? `${item.keterangan.substring(0, 150)}...`
                              : item.keterangan}
                          </div>
                        </td>
                        <td>
                          {item.status === 'lulus' ? (
                            <div>
                              <span className="badge bg-success">
                                <i className="bi bi-check-circle me-1"></i>
                                Telah Lulus
                              </span>
                              {item.approved_by_name && (
                                <small className="d-block text-muted mt-1">
                                  oleh {item.approved_by_name}
                                </small>
                              )}
                            </div>
                          ) : (
                            <span className="badge bg-warning text-dark">
                              <i className="bi bi-hourglass-split me-1"></i>
                              Menunggu
                            </span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {formatDate(item.created_at)}
                          </small>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            {item.status === 'menunggu' && (
                              <button
                                className="btn btn-success"
                                onClick={() => handleApprove(item.id)}
                                disabled={actionLoading === item.id}
                                title="Luluskan"
                              >
                                {actionLoading === item.id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <i className="bi bi-check-lg"></i>
                                )}
                              </button>
                            )}
                            <button
                              className="btn btn-warning"
                              onClick={() => openEditModal(item)}
                              disabled={actionLoading === item.id}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-danger"
                              onClick={() => handleDelete(item.id)}
                              disabled={actionLoading === item.id}
                              title="Padam"
                            >
                              {actionLoading === item.id ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <i className="bi bi-trash"></i>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

      {/* Edit Modal */}
      {editItem && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
                <h5 className="modal-title text-white">
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Rekod Sumbang & Derma
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditItem(null)}
                  disabled={editLoading}
                ></button>
              </div>
              <form onSubmit={handleEdit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nama Pemohon</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editForm.nama}
                        onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                        required
                        disabled={editLoading}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">No. Telefon</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={editForm.telefon}
                        onChange={(e) => setEditForm({ ...editForm, telefon: e.target.value })}
                        required
                        disabled={editLoading}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Alamat</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={editForm.alamat}
                        onChange={(e) => setEditForm({ ...editForm, alamat: e.target.value })}
                        required
                        disabled={editLoading}
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Keterangan</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={editForm.keterangan}
                        onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                        required
                        disabled={editLoading}
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Poster/Imej</label>
                      {editItem.image_url && (
                        <div className="mb-2">
                          <img
                            src={editItem.image_url}
                            alt="Current poster"
                            className="rounded shadow-sm"
                            style={{ maxHeight: '150px', objectFit: 'contain' }}
                          />
                          <small className="d-block text-muted mt-1">Imej semasa</small>
                        </div>
                      )}
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => setEditImage(e.target.files?.[0] || null)}
                        disabled={editLoading}
                      />
                      <small className="text-muted">Biarkan kosong jika tidak mahu menukar imej</small>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditItem(null)}
                    disabled={editLoading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={editLoading}
                  >
                    {editLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
