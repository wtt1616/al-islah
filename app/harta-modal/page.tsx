'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { HartaModal } from '@/types';

export default function HartaModalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hartaModal, setHartaModal] = useState<HartaModal[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<HartaModal | null>(null);
  const [formData, setFormData] = useState({
    no_siri_pendaftaran: '',
    keterangan: '',
    cara_diperolehi: '',
  });

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
      showAlertMessage('danger', 'Error fetching harta modal');
    } finally {
      setLoading(false);
    }
  };

  const showAlertMessage = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      no_siri_pendaftaran: '',
      keterangan: '',
      cara_diperolehi: '',
    });
    setShowModal(true);
  };

  const openEditModal = (item: HartaModal) => {
    setEditingItem(item);
    setFormData({
      no_siri_pendaftaran: item.no_siri_pendaftaran,
      keterangan: item.keterangan,
      cara_diperolehi: item.cara_diperolehi,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({
      no_siri_pendaftaran: '',
      keterangan: '',
      cara_diperolehi: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = editingItem ? `/api/harta-modal/${editingItem.id}` : '/api/harta-modal';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showAlertMessage('success', `Harta modal ${editingItem ? 'updated' : 'created'} successfully!`);
        closeModal();
        fetchHartaModal();
      } else {
        const error = await response.json();
        showAlertMessage('danger', error.error || 'Failed to save harta modal');
      }
    } catch (error) {
      console.error('Error saving harta modal:', error);
      showAlertMessage('danger', 'Error saving harta modal');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this harta modal item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/harta-modal/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showAlertMessage('success', 'Harta modal deleted successfully!');
        fetchHartaModal();
      } else {
        showAlertMessage('danger', 'Failed to delete harta modal');
      }
    } catch (error) {
      console.error('Error deleting harta modal:', error);
      showAlertMessage('danger', 'Error deleting harta modal');
    }
  };

  if (status === 'loading' || !session) {
    return (
      <div className="loading">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        {alert && (
          <div className={`alert alert-${alert.type} alert-custom`} role="alert">
            {alert.message}
          </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Harta Modal</h2>
          <div>
            <button className="btn btn-success me-2" onClick={openAddModal}>
              + Tambah Harta Modal
            </button>
            <button className="btn btn-primary" onClick={() => router.push('/harta-modal/report')}>
              Laporan & Cetak
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : (
          <div className="card">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '20%' }}>No. Siri Pendaftaran</th>
                      <th style={{ width: '35%' }}>Keterangan</th>
                      <th style={{ width: '20%' }}>Cara Diperolehi</th>
                      <th style={{ width: '20%' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hartaModal.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">
                          Tiada harta modal. Klik "Tambah Harta Modal" untuk mula.
                        </td>
                      </tr>
                    ) : (
                      hartaModal.map((item, index) => (
                        <tr key={item.id}>
                          <td>{index + 1}</td>
                          <td>{item.no_siri_pendaftaran}</td>
                          <td>{item.keterangan}</td>
                          <td>{item.cara_diperolehi}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary me-2"
                              onClick={() => openEditModal(item)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(item.id)}
                            >
                              Padam
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingItem ? 'Edit Harta Modal' : 'Tambah Harta Modal'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">No. Siri Pendaftaran *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.no_siri_pendaftaran}
                      onChange={(e) => setFormData({ ...formData, no_siri_pendaftaran: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Keterangan *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Cara Diperolehi *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.cara_diperolehi}
                      onChange={(e) => setFormData({ ...formData, cara_diperolehi: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingItem ? 'Kemaskini' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
