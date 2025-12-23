'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Inventory } from '@/types';

export default function InventoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
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
      fetchInventory();
    }
  }, [session]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory');
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showAlertMessage('danger', 'Error fetching inventory');
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

  const openEditModal = (item: Inventory) => {
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

    const url = editingItem ? `/api/inventory/${editingItem.id}` : '/api/inventory';
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showAlertMessage('success', `Inventory item ${editingItem ? 'updated' : 'created'} successfully!`);
        closeModal();
        fetchInventory();
      } else {
        const error = await response.json();
        showAlertMessage('danger', error.error || 'Failed to save inventory item');
      }
    } catch (error) {
      console.error('Error saving inventory item:', error);
      showAlertMessage('danger', 'Error saving inventory item');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this inventory item?')) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showAlertMessage('success', 'Inventory item deleted successfully!');
        fetchInventory();
      } else {
        showAlertMessage('danger', 'Failed to delete inventory item');
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      showAlertMessage('danger', 'Error deleting inventory item');
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
          <h2>Inventori</h2>
          <div>
            <button className="btn btn-success me-2" onClick={openAddModal}>
              + Tambah Inventori
            </button>
            <button className="btn btn-primary" onClick={() => router.push('/inventory/report')}>
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
                    {inventory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">
                          Tiada inventori. Klik "Tambah Inventori" untuk mula.
                        </td>
                      </tr>
                    ) : (
                      inventory.map((item, index) => (
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
                  {editingItem ? 'Edit Inventori' : 'Tambah Inventori'}
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
