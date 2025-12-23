'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Lokasi {
  id: number;
  kod_lokasi: string;
  nama_lokasi: string;
  keterangan: string | null;
  pegawai_bertanggungjawab: string | null;
  no_tel_pegawai: string | null;
  aktif: boolean;
  jumlah_harta_modal: number;
  jumlah_inventori: number;
}

export default function LokasiAsetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [lokasi, setLokasi] = useState<Lokasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Lokasi | null>(null);
  const [formData, setFormData] = useState({
    kod_lokasi: '',
    nama_lokasi: '',
    keterangan: '',
    pegawai_bertanggungjawab: '',
    no_tel_pegawai: '',
    aktif: true
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (!['admin', 'inventory_staff'].includes(userRole)) {
        router.push('/dashboard');
      } else {
        fetchLokasi();
      }
    }
  }, [status, session, router]);

  const fetchLokasi = async () => {
    try {
      const res = await fetch('/api/aset/lokasi');
      const data = await res.json();
      setLokasi(data.data || []);
    } catch (error) {
      console.error('Error fetching lokasi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const method = editing ? 'PUT' : 'POST';
      const payload = editing ? { ...formData, id: editing.id } : formData;

      const res = await fetch('/api/aset/lokasi', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan lokasi');
        return;
      }

      alert(editing ? 'Lokasi berjaya dikemaskini' : 'Lokasi berjaya ditambah');
      setShowModal(false);
      resetForm();
      fetchLokasi();
    } catch (error) {
      console.error('Error saving lokasi:', error);
      alert('Ralat menyimpan lokasi');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam lokasi ini?')) return;

    try {
      const res = await fetch(`/api/aset/lokasi?id=${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal memadam lokasi');
        return;
      }

      alert('Lokasi berjaya dipadam');
      fetchLokasi();
    } catch (error) {
      console.error('Error deleting lokasi:', error);
      alert('Ralat memadam lokasi');
    }
  };

  const resetForm = () => {
    setFormData({
      kod_lokasi: '',
      nama_lokasi: '',
      keterangan: '',
      pegawai_bertanggungjawab: '',
      no_tel_pegawai: '',
      aktif: true
    });
    setEditing(null);
  };

  const handleEdit = (item: Lokasi) => {
    setEditing(item);
    setFormData({
      kod_lokasi: item.kod_lokasi,
      nama_lokasi: item.nama_lokasi,
      keterangan: item.keterangan || '',
      pegawai_bertanggungjawab: item.pegawai_bertanggungjawab || '',
      no_tel_pegawai: item.no_tel_pegawai || '',
      aktif: item.aktif
    });
    setShowModal(true);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />

      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item"><a href="/aset">Pengurusan Aset</a></li>
                <li className="breadcrumb-item active">Lokasi Aset</li>
              </ol>
            </nav>
            <h4 className="mb-0" style={{ color: '#8B0000' }}>
              <i className="bi bi-geo-alt me-2"></i>
              Lokasi Aset
            </h4>
          </div>
          <button
            className="btn btn-success"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Tambah Lokasi
          </button>
        </div>

        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Kod</th>
                    <th>Nama Lokasi</th>
                    <th>Keterangan</th>
                    <th>Pegawai</th>
                    <th className="text-center">Jumlah Aset</th>
                    <th>Status</th>
                    <th className="text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {lokasi.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Tiada lokasi dijumpai
                      </td>
                    </tr>
                  ) : (
                    lokasi.map(item => (
                      <tr key={item.id}>
                        <td><code>{item.kod_lokasi}</code></td>
                        <td>{item.nama_lokasi}</td>
                        <td className="text-muted small">{item.keterangan || '-'}</td>
                        <td>
                          {item.pegawai_bertanggungjawab || '-'}
                          {item.no_tel_pegawai && (
                            <div className="small text-muted">{item.no_tel_pegawai}</div>
                          )}
                        </td>
                        <td className="text-center">
                          <span className="badge bg-primary me-1" title="Harta Modal">
                            HM: {item.jumlah_harta_modal}
                          </span>
                          <span className="badge bg-info" title="Inventori">
                            I: {item.jumlah_inventori}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${item.aktif ? 'bg-success' : 'bg-secondary'}`}>
                            {item.aktif ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(item.id)}
                              title="Padam"
                              disabled={item.jumlah_harta_modal > 0 || item.jumlah_inventori > 0}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editing ? 'Kemaskini Lokasi' : 'Tambah Lokasi Baru'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => { setShowModal(false); resetForm(); }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Kod Lokasi <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.kod_lokasi}
                      onChange={(e) => setFormData({ ...formData, kod_lokasi: e.target.value })}
                      placeholder="Contoh: SAR/L/01"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nama Lokasi <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nama_lokasi}
                      onChange={(e) => setFormData({ ...formData, nama_lokasi: e.target.value })}
                      placeholder="Contoh: Ruang Solat Utama"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Keterangan</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Pegawai Bertanggungjawab</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.pegawai_bertanggungjawab}
                      onChange={(e) => setFormData({ ...formData, pegawai_bertanggungjawab: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">No. Telefon Pegawai</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.no_tel_pegawai}
                      onChange={(e) => setFormData({ ...formData, no_tel_pegawai: e.target.value })}
                    />
                  </div>
                  {editing && (
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="aktif"
                        checked={formData.aktif}
                        onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="aktif">Aktif</label>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setShowModal(false); resetForm(); }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-success">
                    <i className="bi bi-check-lg me-1"></i>
                    {editing ? 'Kemaskini' : 'Simpan'}
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
