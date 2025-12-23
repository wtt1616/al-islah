'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface SubCategory2 {
  id: number;
  subkategori1_id: number;
  nama_subkategori: string;
  kod_subkategori: string;
  penerangan: string | null;
  aktif: boolean;
  urutan: number;
}

interface SubCategory1 {
  id: number;
  kategori_id: number;
  nama_subkategori: string;
  kod_subkategori: string;
  penerangan: string | null;
  aktif: boolean;
  urutan: number;
  subcategories2: SubCategory2[];
}

interface Category {
  id: number;
  nama_kategori: string;
  kod_kategori: string;
  penerangan: string | null;
  aktif: boolean;
  urutan: number;
  subcategories1: SubCategory1[];
}

export default function PembayaranCategoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSub1Modal, setShowSub1Modal] = useState(false);
  const [showSub2Modal, setShowSub2Modal] = useState(false);

  // Editing states
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSub1, setEditingSub1] = useState<SubCategory1 | null>(null);
  const [editingSub2, setEditingSub2] = useState<SubCategory2 | null>(null);

  // Selected parent IDs
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSub1Id, setSelectedSub1Id] = useState<number | null>(null);

  // Category form states
  const [namaKategori, setNamaKategori] = useState('');
  const [kodKategori, setKodKategori] = useState('');
  const [peneranganKategori, setPeneranganKategori] = useState('');
  const [aktifKategori, setAktifKategori] = useState(true);
  const [urutanKategori, setUrutanKategori] = useState(0);

  // Sub-Category 1 form states
  const [namaSub1, setNamaSub1] = useState('');
  const [kodSub1, setKodSub1] = useState('');
  const [peneranganSub1, setPeneranganSub1] = useState('');
  const [aktifSub1, setAktifSub1] = useState(true);
  const [urutanSub1, setUrutanSub1] = useState(0);

  // Sub-Category 2 form states
  const [namaSub2, setNamaSub2] = useState('');
  const [kodSub2, setKodSub2] = useState('');
  const [peneranganSub2, setPeneranganSub2] = useState('');
  const [aktifSub2, setAktifSub2] = useState(true);
  const [urutanSub2, setUrutanSub2] = useState(0);

  const [submitting, setSubmitting] = useState(false);

  // Expanded sub-kategori 1 for showing sub-kategori 2
  const [expandedSub1, setExpandedSub1] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && !['admin', 'bendahari', 'head_imam'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchCategories();
    }
  }, [session]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/financial/pembayaran-categories?include_subcategories=true&active_only=false');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      alert('Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  };

  const toggleSub1Expand = (sub1Id: number) => {
    setExpandedSub1(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sub1Id)) {
        newSet.delete(sub1Id);
      } else {
        newSet.add(sub1Id);
      }
      return newSet;
    });
  };

  // Category handlers
  const handleAddCategory = () => {
    setEditingCategory(null);
    setNamaKategori('');
    setKodKategori('');
    setPeneranganKategori('');
    setAktifKategori(true);
    setUrutanKategori(categories.length + 1);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNamaKategori(category.nama_kategori);
    setKodKategori(category.kod_kategori);
    setPeneranganKategori(category.penerangan || '');
    setAktifKategori(category.aktif);
    setUrutanKategori(category.urutan);
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaKategori || !kodKategori) {
      alert('Sila isi nama dan kod kategori');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        nama_kategori: namaKategori,
        kod_kategori: kodKategori,
        penerangan: peneranganKategori || null,
        aktif: aktifKategori,
        urutan: urutanKategori
      };

      const response = await fetch('/api/financial/pembayaran-categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCategory ? { ...payload, id: editingCategory.id } : payload)
      });

      if (response.ok) {
        setShowCategoryModal(false);
        fetchCategories();
        alert(editingCategory ? 'Kategori berjaya dikemaskini' : 'Kategori berjaya ditambah');
      } else {
        const error = await response.json();
        alert('Gagal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Ralat semasa menyimpan kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk padam kategori ini? Semua sub-kategori akan turut dipadam.')) {
      return;
    }

    try {
      const response = await fetch(`/api/financial/pembayaran-categories?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
        alert('Kategori berjaya dipadam');
      } else {
        const error = await response.json();
        alert('Gagal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Ralat semasa memadam kategori');
    }
  };

  // Sub-Category 1 handlers
  const handleAddSub1 = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setEditingSub1(null);
    setNamaSub1('');
    setKodSub1('');
    setPeneranganSub1('');
    setAktifSub1(true);
    const category = categories.find(c => c.id === categoryId);
    setUrutanSub1(category?.subcategories1?.length ? category.subcategories1.length + 1 : 1);
    setShowSub1Modal(true);
  };

  const handleEditSub1 = (categoryId: number, sub1: SubCategory1) => {
    setSelectedCategoryId(categoryId);
    setEditingSub1(sub1);
    setNamaSub1(sub1.nama_subkategori);
    setKodSub1(sub1.kod_subkategori);
    setPeneranganSub1(sub1.penerangan || '');
    setAktifSub1(sub1.aktif);
    setUrutanSub1(sub1.urutan);
    setShowSub1Modal(true);
  };

  const handleSaveSub1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSub1 || !kodSub1) {
      alert('Sila isi nama dan kod sub-kategori');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        kategori_id: selectedCategoryId,
        nama_subkategori: namaSub1,
        kod_subkategori: kodSub1,
        penerangan: peneranganSub1 || null,
        aktif: aktifSub1,
        urutan: urutanSub1
      };

      const response = await fetch('/api/financial/pembayaran-subcategories1', {
        method: editingSub1 ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSub1 ? { ...payload, id: editingSub1.id } : payload)
      });

      if (response.ok) {
        setShowSub1Modal(false);
        fetchCategories();
        alert(editingSub1 ? 'Sub-Kategori 1 berjaya dikemaskini' : 'Sub-Kategori 1 berjaya ditambah');
      } else {
        const error = await response.json();
        alert('Gagal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving sub-category 1:', error);
      alert('Ralat semasa menyimpan sub-kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSub1 = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk padam sub-kategori ini? Sub-kategori 2 akan turut dipadam.')) {
      return;
    }

    try {
      const response = await fetch(`/api/financial/pembayaran-subcategories1?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
        alert('Sub-Kategori 1 berjaya dipadam');
      } else {
        const error = await response.json();
        alert('Gagal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting sub-category 1:', error);
      alert('Ralat semasa memadam sub-kategori');
    }
  };

  // Sub-Category 2 handlers
  const handleAddSub2 = (sub1Id: number) => {
    setSelectedSub1Id(sub1Id);
    setEditingSub2(null);
    setNamaSub2('');
    setKodSub2('');
    setPeneranganSub2('');
    setAktifSub2(true);

    // Find sub1 to get count
    let sub2Count = 0;
    for (const cat of categories) {
      const sub1 = cat.subcategories1?.find(s => s.id === sub1Id);
      if (sub1) {
        sub2Count = sub1.subcategories2?.length || 0;
        break;
      }
    }
    setUrutanSub2(sub2Count + 1);
    setShowSub2Modal(true);
  };

  const handleEditSub2 = (sub1Id: number, sub2: SubCategory2) => {
    setSelectedSub1Id(sub1Id);
    setEditingSub2(sub2);
    setNamaSub2(sub2.nama_subkategori);
    setKodSub2(sub2.kod_subkategori);
    setPeneranganSub2(sub2.penerangan || '');
    setAktifSub2(sub2.aktif);
    setUrutanSub2(sub2.urutan);
    setShowSub2Modal(true);
  };

  const handleSaveSub2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSub2 || !kodSub2) {
      alert('Sila isi nama dan kod sub-kategori');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        subkategori1_id: selectedSub1Id,
        nama_subkategori: namaSub2,
        kod_subkategori: kodSub2,
        penerangan: peneranganSub2 || null,
        aktif: aktifSub2,
        urutan: urutanSub2
      };

      const response = await fetch('/api/financial/pembayaran-subcategories2', {
        method: editingSub2 ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSub2 ? { ...payload, id: editingSub2.id } : payload)
      });

      if (response.ok) {
        setShowSub2Modal(false);
        fetchCategories();
        alert(editingSub2 ? 'Sub-Kategori 2 berjaya dikemaskini' : 'Sub-Kategori 2 berjaya ditambah');
      } else {
        const error = await response.json();
        alert('Gagal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving sub-category 2:', error);
      alert('Ralat semasa menyimpan sub-kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSub2 = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk padam sub-kategori ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/financial/pembayaran-subcategories2?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
        alert('Sub-Kategori 2 berjaya dipadam');
      } else {
        const error = await response.json();
        alert('Gagal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting sub-category 2:', error);
      alert('Ralat semasa memadam sub-kategori');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const canEdit = ['admin', 'bendahari'].includes(session?.user.role || '');

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />

      <div className="container-fluid mt-4 px-4">
        <div className="row mb-4">
          <div className="col">
            <button className="btn btn-outline-secondary mb-3" onClick={() => router.back()}>
              <i className="bi bi-arrow-left me-2"></i>
              Kembali
            </button>
            <h2 className="mb-0">
              <i className="bi bi-folder-fill me-2 text-danger"></i>
              Selenggara Kategori Pembayaran
            </h2>
            <p className="text-muted">Urus kategori dan sub-kategori untuk transaksi pembayaran</p>
          </div>
          <div className="col-auto">
            {canEdit && (
              <button className="btn btn-danger" onClick={handleAddCategory}>
                <i className="bi bi-plus-circle me-2"></i>
                Tambah Kategori
              </button>
            )}
          </div>
        </div>

        {/* Categories List - Card Layout */}
        <div className="row">
          {categories.map((category) => (
            <div key={category.id} className="col-md-6 col-lg-4 mb-4">
              <div className={`card h-100 ${!category.aktif ? 'border-secondary' : 'border-danger'}`}>
                <div className="card-header bg-danger bg-opacity-10 d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0 text-danger">{category.nama_kategori}</h5>
                    <small className="text-muted">Kod: {category.kod_kategori}</small>
                  </div>
                  <div>
                    {!category.aktif && (
                      <span className="badge bg-secondary">Tidak Aktif</span>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {category.penerangan && (
                    <p className="text-muted small mb-3">{category.penerangan}</p>
                  )}

                  {/* Sub-Kategori 1 */}
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <strong className="small text-warning">
                        <i className="bi bi-folder2 me-1"></i>
                        Sub-Kategori 1 ({category.subcategories1?.length || 0}):
                      </strong>
                      {canEdit && (
                        <button
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => handleAddSub1(category.id)}
                          title="Tambah Sub-Kategori 1"
                        >
                          <i className="bi bi-plus"></i>
                        </button>
                      )}
                    </div>
                    {!category.subcategories1 || category.subcategories1.length === 0 ? (
                      <p className="text-muted small">Tiada sub-kategori 1</p>
                    ) : (
                      <ul className="list-group list-group-flush small">
                        {category.subcategories1.map((sub1) => (
                          <li
                            key={sub1.id}
                            className={`list-group-item px-0 py-2 ${!sub1.aktif ? 'text-muted' : ''}`}
                          >
                            <div className="d-flex justify-content-between align-items-center">
                              <div
                                className="d-flex align-items-center"
                                style={{ cursor: sub1.subcategories2?.length > 0 ? 'pointer' : 'default' }}
                                onClick={() => sub1.subcategories2?.length > 0 && toggleSub1Expand(sub1.id)}
                              >
                                {sub1.subcategories2?.length > 0 && (
                                  <i className={`bi ${expandedSub1.has(sub1.id) ? 'bi-chevron-down' : 'bi-chevron-right'} me-1 text-muted`}></i>
                                )}
                                <span className="text-warning fw-medium">{sub1.nama_subkategori}</span>
                                {!sub1.aktif && <span className="badge bg-secondary ms-2">Tidak Aktif</span>}
                                {sub1.subcategories2?.length > 0 && (
                                  <span className="badge bg-success bg-opacity-25 text-success ms-2">
                                    {sub1.subcategories2.length} sub-2
                                  </span>
                                )}
                              </div>
                              {canEdit && (
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => handleAddSub2(sub1.id)}
                                    title="Tambah Sub-Kategori 2"
                                  >
                                    <i className="bi bi-plus"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => handleEditSub1(category.id, sub1)}
                                    title="Edit"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteSub1(sub1.id)}
                                    title="Padam"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Sub-Kategori 2 - Expanded */}
                            {expandedSub1.has(sub1.id) && sub1.subcategories2 && sub1.subcategories2.length > 0 && (
                              <div className="ms-4 mt-2 ps-2 border-start border-success">
                                {sub1.subcategories2.map((sub2) => (
                                  <div
                                    key={sub2.id}
                                    className={`d-flex justify-content-between align-items-center py-1 ${!sub2.aktif ? 'text-muted' : ''}`}
                                  >
                                    <span className="text-success">
                                      <i className="bi bi-dot"></i>
                                      {sub2.nama_subkategori}
                                      {!sub2.aktif && <span className="badge bg-secondary ms-2">Tidak Aktif</span>}
                                    </span>
                                    {canEdit && (
                                      <div className="btn-group btn-group-sm">
                                        <button
                                          className="btn btn-sm btn-outline-secondary py-0"
                                          onClick={() => handleEditSub2(sub1.id, sub2)}
                                          title="Edit"
                                        >
                                          <i className="bi bi-pencil" style={{ fontSize: '0.7rem' }}></i>
                                        </button>
                                        <button
                                          className="btn btn-sm btn-outline-danger py-0"
                                          onClick={() => handleDeleteSub2(sub2.id)}
                                          title="Padam"
                                        >
                                          <i className="bi bi-trash" style={{ fontSize: '0.7rem' }}></i>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {canEdit && (
                  <div className="card-footer">
                    <div className="btn-group w-100">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditCategory(category)}
                      >
                        <i className="bi bi-pencil me-1"></i>
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <i className="bi bi-trash me-1"></i>
                        Padam
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCategoryModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveCategory}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nama Kategori *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={namaKategori}
                      onChange={(e) => setNamaKategori(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Kod Kategori *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={kodKategori}
                      onChange={(e) => setKodKategori(e.target.value.toUpperCase())}
                      required
                      placeholder="Contoh: PENT"
                    />
                    <small className="text-muted">Huruf besar sahaja</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Penerangan</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={peneranganKategori}
                      onChange={(e) => setPeneranganKategori(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Urutan</label>
                    <input
                      type="number"
                      className="form-control"
                      value={urutanKategori}
                      onChange={(e) => setUrutanKategori(parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="aktifKategori"
                      checked={aktifKategori}
                      onChange={(e) => setAktifKategori(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="aktifKategori">
                      Aktif
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCategoryModal(false)}
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Category 1 Modal */}
      {showSub1Modal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingSub1 ? 'Edit Sub-Kategori 1' : 'Tambah Sub-Kategori 1 Baru'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSub1Modal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveSub1}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nama Sub-Kategori 1 *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={namaSub1}
                      onChange={(e) => setNamaSub1(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Kod Sub-Kategori 1 *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={kodSub1}
                      onChange={(e) => setKodSub1(e.target.value.toUpperCase())}
                      required
                      placeholder="Contoh: ELAUN"
                    />
                    <small className="text-muted">Huruf besar sahaja</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Penerangan</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={peneranganSub1}
                      onChange={(e) => setPeneranganSub1(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Urutan</label>
                    <input
                      type="number"
                      className="form-control"
                      value={urutanSub1}
                      onChange={(e) => setUrutanSub1(parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="aktifSub1"
                      checked={aktifSub1}
                      onChange={(e) => setAktifSub1(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="aktifSub1">
                      Aktif
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSub1Modal(false)}
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-warning" disabled={submitting}>
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Category 2 Modal */}
      {showSub2Modal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingSub2 ? 'Edit Sub-Kategori 2' : 'Tambah Sub-Kategori 2 Baru'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSub2Modal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveSub2}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nama Sub-Kategori 2 *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={namaSub2}
                      onChange={(e) => setNamaSub2(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Kod Sub-Kategori 2 *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={kodSub2}
                      onChange={(e) => setKodSub2(e.target.value.toUpperCase())}
                      required
                      placeholder="Contoh: IMAM"
                    />
                    <small className="text-muted">Huruf besar sahaja</small>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Penerangan</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={peneranganSub2}
                      onChange={(e) => setPeneranganSub2(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Urutan</label>
                    <input
                      type="number"
                      className="form-control"
                      value={urutanSub2}
                      onChange={(e) => setUrutanSub2(parseInt(e.target.value))}
                      min="0"
                    />
                  </div>
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="aktifSub2"
                      checked={aktifSub2}
                      onChange={(e) => setAktifSub2(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="aktifSub2">
                      Aktif
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSub2Modal(false)}
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-success" disabled={submitting}>
                    {submitting ? 'Menyimpan...' : 'Simpan'}
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
