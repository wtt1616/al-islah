'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface SubCategory {
  id: number;
  kategori_id: number;
  nama_subkategori: string;
  kod_subkategori: string;
  penerangan: string | null;
  aktif: boolean;
  urutan: number;
}

interface Category {
  id: number;
  nama_kategori: string;
  kod_kategori: string;
  penerangan: string | null;
  ada_subkategori: boolean;
  perlu_maklumat_pelaburan: boolean;
  aktif: boolean;
  urutan: number;
  subkategori: SubCategory[];
}

export default function CategoriesManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubCategory, setEditingSubCategory] = useState<SubCategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Category form states
  const [namaKategori, setNamaKategori] = useState('');
  const [kodKategori, setKodKategori] = useState('');
  const [peneranganKategori, setPeneranganKategori] = useState('');
  const [adaSubkategori, setAdaSubkategori] = useState(false);
  const [perluMaklumatPelaburan, setPerluMaklumatPelaburan] = useState(false);
  const [aktifKategori, setAktifKategori] = useState(true);
  const [urutanKategori, setUrutanKategori] = useState(0);

  // Sub-category form states
  const [namaSubkategori, setNamaSubkategori] = useState('');
  const [kodSubkategori, setKodSubkategori] = useState('');
  const [peneranganSubkategori, setPeneranganSubkategori] = useState('');
  const [aktifSubkategori, setAktifSubkategori] = useState(true);
  const [urutanSubkategori, setUrutanSubkategori] = useState(0);

  const [submitting, setSubmitting] = useState(false);

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
      const response = await fetch('/api/financial/categories?include_inactive=true');
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

  const handleAddCategory = () => {
    setEditingCategory(null);
    setNamaKategori('');
    setKodKategori('');
    setPeneranganKategori('');
    setAdaSubkategori(false);
    setPerluMaklumatPelaburan(false);
    setAktifKategori(true);
    setUrutanKategori(categories.length + 1);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNamaKategori(category.nama_kategori);
    setKodKategori(category.kod_kategori);
    setPeneranganKategori(category.penerangan || '');
    setAdaSubkategori(category.ada_subkategori);
    setPerluMaklumatPelaburan(category.perlu_maklumat_pelaburan);
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
        ada_subkategori: adaSubkategori,
        perlu_maklumat_pelaburan: perluMaklumatPelaburan,
        aktif: aktifKategori,
        urutan: urutanKategori
      };

      const response = await fetch('/api/financial/categories', {
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
    if (!confirm('Adakah anda pasti untuk padam kategori ini? Sub-kategori akan turut dipadam.')) {
      return;
    }

    try {
      const response = await fetch(`/api/financial/categories?id=${id}`, {
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

  const handleAddSubCategory = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setEditingSubCategory(null);
    setNamaSubkategori('');
    setKodSubkategori('');
    setPeneranganSubkategori('');
    setAktifSubkategori(true);

    const category = categories.find(c => c.id === categoryId);
    setUrutanSubkategori(category?.subkategori.length ? category.subkategori.length + 1 : 1);
    setShowSubCategoryModal(true);
  };

  const handleEditSubCategory = (categoryId: number, subCategory: SubCategory) => {
    setSelectedCategoryId(categoryId);
    setEditingSubCategory(subCategory);
    setNamaSubkategori(subCategory.nama_subkategori);
    setKodSubkategori(subCategory.kod_subkategori);
    setPeneranganSubkategori(subCategory.penerangan || '');
    setAktifSubkategori(subCategory.aktif);
    setUrutanSubkategori(subCategory.urutan);
    setShowSubCategoryModal(true);
  };

  const handleSaveSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSubkategori || !kodSubkategori) {
      alert('Sila isi nama dan kod sub-kategori');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        kategori_id: selectedCategoryId,
        nama_subkategori: namaSubkategori,
        kod_subkategori: kodSubkategori,
        penerangan: peneranganSubkategori || null,
        aktif: aktifSubkategori,
        urutan: urutanSubkategori
      };

      const response = await fetch('/api/financial/subcategories', {
        method: editingSubCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSubCategory ? { ...payload, id: editingSubCategory.id } : payload)
      });

      if (response.ok) {
        setShowSubCategoryModal(false);
        fetchCategories();
        alert(editingSubCategory ? 'Sub-kategori berjaya dikemaskini' : 'Sub-kategori berjaya ditambah');
      } else {
        const error = await response.json();
        alert('Gagal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving sub-category:', error);
      alert('Ralat semasa menyimpan sub-kategori');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubCategory = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk padam sub-kategori ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/financial/subcategories?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCategories();
        alert('Sub-kategori berjaya dipadam');
      } else {
        const error = await response.json();
        alert('Gagal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting sub-category:', error);
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
              <i className="bi bi-folder-fill me-2"></i>
              Selenggara Kategori Penerimaan
            </h2>
            <p className="text-muted">Urus kategori dan sub-kategori untuk transaksi penerimaan</p>
          </div>
          <div className="col-auto">
            {['admin', 'bendahari'].includes(session?.user.role || '') && (
              <button
                className="btn btn-primary"
                onClick={handleAddCategory}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Tambah Kategori
              </button>
            )}
          </div>
        </div>

        {/* Categories List */}
        <div className="row">
          {categories.map((category) => (
            <div key={category.id} className="col-md-6 col-lg-4 mb-4">
              <div className={`card h-100 ${!category.aktif ? 'border-secondary' : ''}`}>
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-0">{category.nama_kategori}</h5>
                    <small className="text-muted">Kod: {category.kod_kategori}</small>
                  </div>
                  <div>
                    {!category.aktif && (
                      <span className="badge bg-secondary me-2">Tidak Aktif</span>
                    )}
                    {category.perlu_maklumat_pelaburan && (
                      <span className="badge bg-info me-2">
                        <i className="bi bi-graph-up"></i>
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {category.penerangan && (
                    <p className="text-muted small mb-3">{category.penerangan}</p>
                  )}

                  {/* Sub-categories */}
                  {category.ada_subkategori && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong className="small">Sub-Kategori ({category.subkategori.length}):</strong>
                        {['admin', 'bendahari'].includes(session?.user.role || '') && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleAddSubCategory(category.id)}
                          >
                            <i className="bi bi-plus"></i>
                          </button>
                        )}
                      </div>
                      {category.subkategori.length === 0 ? (
                        <p className="text-muted small">Tiada sub-kategori</p>
                      ) : (
                        <ul className="list-group list-group-flush small">
                          {category.subkategori.map((sub) => (
                            <li
                              key={sub.id}
                              className={`list-group-item d-flex justify-content-between align-items-center py-1 ${!sub.aktif ? 'text-muted' : ''}`}
                            >
                              <span>
                                {sub.nama_subkategori}
                                {!sub.aktif && <span className="badge bg-secondary ms-2">Tidak Aktif</span>}
                              </span>
                              {['admin', 'bendahari'].includes(session?.user.role || '') && (
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => handleEditSubCategory(category.id, sub)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteSubCategory(sub.id)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                {['admin', 'bendahari'].includes(session?.user.role || '') && (
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
                      placeholder="Contoh: SUMB_AM"
                    />
                    <small className="text-muted">Huruf besar sahaja, gunakan underscore (_)</small>
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
                      id="adaSubkategori"
                      checked={adaSubkategori}
                      onChange={(e) => setAdaSubkategori(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="adaSubkategori">
                      Ada Sub-Kategori
                    </label>
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="perluMaklumatPelaburan"
                      checked={perluMaklumatPelaburan}
                      onChange={(e) => setPerluMaklumatPelaburan(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="perluMaklumatPelaburan">
                      Perlu Maklumat Pelaburan
                    </label>
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
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Category Modal */}
      {showSubCategoryModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingSubCategory ? 'Edit Sub-Kategori' : 'Tambah Sub-Kategori Baru'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowSubCategoryModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSaveSubCategory}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nama Sub-Kategori *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={namaSubkategori}
                      onChange={(e) => setNamaSubkategori(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Kod Sub-Kategori *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={kodSubkategori}
                      onChange={(e) => setKodSubkategori(e.target.value.toUpperCase())}
                      required
                      placeholder="Contoh: KUT_JUMAAT"
                    />
                    <small className="text-muted">Huruf besar sahaja, gunakan underscore (_)</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Penerangan</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={peneranganSubkategori}
                      onChange={(e) => setPeneranganSubkategori(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Urutan</label>
                    <input
                      type="number"
                      className="form-control"
                      value={urutanSubkategori}
                      onChange={(e) => setUrutanSubkategori(parseInt(e.target.value))}
                      min="0"
                    />
                  </div>

                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="aktifSubkategori"
                      checked={aktifSubkategori}
                      onChange={(e) => setAktifSubkategori(e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="aktifSubkategori">
                      Aktif
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSubCategoryModal(false)}
                    disabled={submitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
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
