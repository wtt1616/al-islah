'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Category {
  id: number;
  nama: string;
  icon: string;
  urutan: number;
  is_active: boolean;
}

// Popular Bootstrap Icons for categories
const popularIcons = [
  'bi-tag', 'bi-cart', 'bi-bag', 'bi-basket', 'bi-box',
  'bi-gift', 'bi-heart', 'bi-star', 'bi-cup-hot', 'bi-egg-fried',
  'bi-cake', 'bi-flower1', 'bi-tree', 'bi-house', 'bi-tools',
  'bi-palette', 'bi-book', 'bi-music-note', 'bi-camera', 'bi-phone',
  'bi-laptop', 'bi-watch', 'bi-handbag', 'bi-scissors', 'bi-droplet'
];

export default function CategoriesManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ nama: '', icon: 'bi-tag', urutan: 1 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (!['admin', 'head_imam'].includes(userRole)) {
        router.push('/dashboard');
      } else {
        fetchCategories();
      }
    }
  }, [status, session, router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/komuniti2u/categories?includeInactive=true');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ nama: '', icon: 'bi-tag', urutan: categories.length + 1 });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({ nama: category.nama, icon: category.icon, urutan: category.urutan });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ nama: '', icon: 'bi-tag', urutan: 1 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const url = '/api/komuniti2u/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const body = editingCategory
        ? { id: editingCategory.id, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        closeModal();
        fetchCategories();
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal menyimpan kategori' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat berlaku' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      const res = await fetch('/api/komuniti2u/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: category.id, is_active: !category.is_active }),
      });

      if (res.ok) {
        fetchCategories();
        setMessage({ type: 'success', text: `Kategori ${category.is_active ? 'dinyahaktifkan' : 'diaktifkan'}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal mengubah status' });
    }
  };

  const handleDelete = async (category: Category) => {
    if (!confirm(`Adakah anda pasti mahu memadam kategori "${category.nama}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/komuniti2u/categories?id=${category.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        fetchCategories();
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Gagal memadam kategori' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
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
            <h4 className="mb-1">
              <i className="bi bi-tags me-2"></i>
              Urus Kategori Komuniti2U
            </h4>
            <p className="text-muted mb-0">Tambah, edit dan padam kategori produk</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-success" onClick={openAddModal}>
              <i className="bi bi-plus-lg me-2"></i>
              Tambah Kategori
            </button>
            <a href="/dashboard/komuniti2u" className="btn btn-outline-secondary">
              <i className="bi bi-arrow-left me-2"></i>
              Kembali
            </a>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '60px' }}>Urutan</th>
                    <th style={{ width: '60px' }}>Ikon</th>
                    <th>Nama Kategori</th>
                    <th style={{ width: '100px' }}>Status</th>
                    <th style={{ width: '150px' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        Tiada kategori dijumpai
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className={!cat.is_active ? 'table-secondary' : ''}>
                        <td className="text-center">{cat.urutan}</td>
                        <td className="text-center">
                          <i className={`bi ${cat.icon} fs-5`}></i>
                        </td>
                        <td>{cat.nama}</td>
                        <td>
                          <span className={`badge ${cat.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {cat.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => openEditModal(cat)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className={`btn ${cat.is_active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              onClick={() => handleToggleActive(cat)}
                              title={cat.is_active ? 'Nyahaktif' : 'Aktifkan'}
                            >
                              <i className={`bi ${cat.is_active ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDelete(cat)}
                              title="Padam"
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className={`bi ${editingCategory ? 'bi-pencil' : 'bi-plus-lg'} me-2`}></i>
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nama Kategori <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      required
                      placeholder="cth: Makanan, Pakaian, Aksesori"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ikon</label>
                    <div className="d-flex flex-wrap gap-2 p-2 border rounded mb-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {popularIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          className={`btn ${formData.icon === icon ? 'btn-success' : 'btn-outline-secondary'}`}
                          style={{ width: '40px', height: '40px' }}
                          onClick={() => setFormData({ ...formData, icon })}
                        >
                          <i className={`bi ${icon}`}></i>
                        </button>
                      ))}
                    </div>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className={`bi ${formData.icon}`}></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        placeholder="bi-tag"
                      />
                    </div>
                    <small className="text-muted">
                      Lihat senarai ikon di <a href="https://icons.getbootstrap.com/" target="_blank" rel="noopener noreferrer">Bootstrap Icons</a>
                    </small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Urutan</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.urutan}
                      onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                    <small className="text-muted">Nombor kecil akan dipaparkan dahulu</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-success" disabled={saving}>
                    {saving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-lg me-2"></i>
                        Simpan
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
