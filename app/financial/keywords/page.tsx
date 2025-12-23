'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { RujukanKategori, PenerimaanCategory, PembayaranCategory } from '@/types';

export default function KeywordsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [keywords, setKeywords] = useState<RujukanKategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'penerimaan' | 'pembayaran'>('all');

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<RujukanKategori | null>(null);
  const [jenisTransaksi, setJenisTransaksi] = useState<'penerimaan' | 'pembayaran'>('penerimaan');
  const [kategoriNama, setKategoriNama] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [aktif, setAktif] = useState(true);

  // Alert states
  const [alert, setAlert] = useState<{type: 'success' | 'danger', message: string} | null>(null);

  const penerimaanCategories: PenerimaanCategory[] = [
    'Sumbangan Am',
    'Sumbangan Khas (Amanah)',
    'Hasil Sewaan/Penjanaan Ekonomi',
    'Tahlil',
    'Sumbangan Elaun',
    'Hibah Pelaburan',
    'Deposit',
    'Hibah Bank',
    'Lain-lain Terimaan'
  ];

  const pembayaranCategories: PembayaranCategory[] = [
    'Pentadbiran',
    'Pengurusan Sumber Manusia',
    'Pembangunan dan Penyelenggaraan',
    'Dakwah dan Pengimarahan',
    'Khidmat Sosial dan Kemasyarakatan',
    'Pembelian Aset',
    'Perbelanjaan Khas (Amanah)',
    'Pelbagai'
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && !['admin', 'bendahari'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchKeywords();
    }
  }, [session, filter]);

  const fetchKeywords = async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? '/api/financial/keywords'
        : `/api/financial/keywords?jenis_transaksi=${filter}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setKeywords(data);
      }
    } catch (error) {
      console.error('Error fetching keywords:', error);
      showAlert('danger', 'Gagal memuat keyword');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'danger', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const resetForm = () => {
    setJenisTransaksi('penerimaan');
    setKategoriNama('');
    setKeywordInput('');
    setAktif(true);
    setEditingKeyword(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEdit = (keyword: RujukanKategori) => {
    setEditingKeyword(keyword);
    setJenisTransaksi(keyword.jenis_transaksi);
    setKategoriNama(keyword.kategori_nama);
    setKeywordInput(keyword.keyword);
    setAktif(keyword.aktif);
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!kategoriNama || !keywordInput.trim()) {
      showAlert('danger', 'Sila isi semua medan yang diperlukan');
      return;
    }

    try {
      if (editingKeyword) {
        // Update existing keyword
        const response = await fetch('/api/financial/keywords', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingKeyword.id,
            jenis_transaksi: jenisTransaksi,
            kategori_nama: kategoriNama,
            keyword: keywordInput.trim(),
            aktif
          })
        });

        if (response.ok) {
          showAlert('success', 'Keyword berjaya dikemaskini');
          setShowAddModal(false);
          resetForm();
          fetchKeywords();
        } else {
          const error = await response.json();
          showAlert('danger', error.error || 'Gagal kemaskini keyword');
        }
      } else {
        // Create new keyword
        const response = await fetch('/api/financial/keywords', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jenis_transaksi: jenisTransaksi,
            kategori_nama: kategoriNama,
            keyword: keywordInput.trim(),
            aktif
          })
        });

        if (response.ok) {
          showAlert('success', 'Keyword berjaya ditambah');
          setShowAddModal(false);
          resetForm();
          fetchKeywords();
        } else {
          const error = await response.json();
          showAlert('danger', error.error || 'Gagal tambah keyword');
        }
      }
    } catch (error) {
      console.error('Error saving keyword:', error);
      showAlert('danger', 'Ralat semasa menyimpan keyword');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam keyword ini?')) {
      return;
    }

    try {
      const response = await fetch(`/api/financial/keywords?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showAlert('success', 'Keyword berjaya dipadam');
        fetchKeywords();
      } else {
        const error = await response.json();
        showAlert('danger', error.error || 'Gagal padam keyword');
      }
    } catch (error) {
      console.error('Error deleting keyword:', error);
      showAlert('danger', 'Ralat semasa memadam keyword');
    }
  };

  const handleToggleActive = async (keyword: RujukanKategori) => {
    try {
      const response = await fetch('/api/financial/keywords', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: keyword.id,
          aktif: !keyword.aktif
        })
      });

      if (response.ok) {
        showAlert('success', `Keyword ${!keyword.aktif ? 'diaktifkan' : 'dinyahaktifkan'}`);
        fetchKeywords();
      } else {
        const error = await response.json();
        showAlert('danger', error.error || 'Gagal kemaskini status');
      }
    } catch (error) {
      console.error('Error toggling keyword:', error);
      showAlert('danger', 'Ralat semasa kemaskini status');
    }
  };

  const groupedKeywords = keywords.reduce((acc, keyword) => {
    const key = `${keyword.jenis_transaksi}-${keyword.kategori_nama}`;
    if (!acc[key]) {
      acc[key] = {
        jenis_transaksi: keyword.jenis_transaksi,
        kategori_nama: keyword.kategori_nama,
        keywords: []
      };
    }
    acc[key].keywords.push(keyword);
    return acc;
  }, {} as Record<string, { jenis_transaksi: string, kategori_nama: string, keywords: RujukanKategori[] }>);

  if (status === 'loading' || !session) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => window.history.back()}
            >
              &larr; Kembali
            </button>
            <h2 className="mb-0">Pengurusan Keyword Kategori</h2>
          </div>
          <button className="btn btn-primary" onClick={handleAdd}>
            + Tambah Keyword
          </button>
        </div>

        {alert && (
          <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
            {alert.message}
            <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
          </div>
        )}

        {/* Filter */}
        <div className="mb-3">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setFilter('all')}
            >
              Semua ({keywords.length})
            </button>
            <button
              type="button"
              className={`btn ${filter === 'penerimaan' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setFilter('penerimaan')}
            >
              Penerimaan
            </button>
            <button
              type="button"
              className={`btn ${filter === 'pembayaran' ? 'btn-danger' : 'btn-outline-danger'}`}
              onClick={() => setFilter('pembayaran')}
            >
              Pembayaran
            </button>
          </div>
        </div>

        {/* Keywords List */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : Object.keys(groupedKeywords).length === 0 ? (
          <div className="alert alert-info">
            Tiada keyword dijumpai. Klik butang "Tambah Keyword" untuk memulakan.
          </div>
        ) : (
          <div className="row">
            {Object.entries(groupedKeywords).map(([key, group]) => (
              <div key={key} className="col-md-6 mb-4">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <span className={`badge ${group.jenis_transaksi === 'penerimaan' ? 'bg-success' : 'bg-danger'} me-2`}>
                        {group.jenis_transaksi.toUpperCase()}
                      </span>
                      {group.kategori_nama}
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Keyword</th>
                            <th>Status</th>
                            <th>Tindakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.keywords.map((keyword) => (
                            <tr key={keyword.id} className={!keyword.aktif ? 'text-muted' : ''}>
                              <td>{keyword.keyword}</td>
                              <td>
                                <span className={`badge ${keyword.aktif ? 'bg-success' : 'bg-secondary'}`}>
                                  {keyword.aktif ? 'Aktif' : 'Tidak Aktif'}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm" role="group">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => handleEdit(keyword)}
                                    title="Edit"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    className={`btn ${keyword.aktif ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                    onClick={() => handleToggleActive(keyword)}
                                    title={keyword.aktif ? 'Nyahaktif' : 'Aktifkan'}
                                  >
                                    {keyword.aktif ? '⏸' : '▶'}
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDelete(keyword.id)}
                                    title="Padam"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {editingKeyword ? 'Edit Keyword' : 'Tambah Keyword Baru'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Jenis Transaksi</label>
                      <select
                        className="form-select"
                        value={jenisTransaksi}
                        onChange={(e) => {
                          setJenisTransaksi(e.target.value as 'penerimaan' | 'pembayaran');
                          setKategoriNama('');
                        }}
                        required
                      >
                        <option value="penerimaan">Penerimaan</option>
                        <option value="pembayaran">Pembayaran</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Kategori</label>
                      <select
                        className="form-select"
                        value={kategoriNama}
                        onChange={(e) => setKategoriNama(e.target.value)}
                        required
                      >
                        <option value="">Pilih Kategori</option>
                        {jenisTransaksi === 'penerimaan'
                          ? penerimaanCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))
                          : pembayaranCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))
                        }
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Keyword</label>
                      <input
                        type="text"
                        className="form-control"
                        value={keywordInput}
                        onChange={(e) => setKeywordInput(e.target.value)}
                        placeholder="Contoh: infaq, elaun, baiki"
                        required
                      />
                      <div className="form-text">
                        Keyword akan digunakan untuk mengesan kategori secara automatik
                      </div>
                    </div>

                    <div className="mb-3 form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="aktifCheck"
                        checked={aktif}
                        onChange={(e) => setAktif(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="aktifCheck">
                        Aktifkan keyword ini
                      </label>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                      }}
                    >
                      Batal
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingKeyword ? 'Kemaskini' : 'Tambah'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
