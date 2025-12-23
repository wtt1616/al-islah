'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Tender {
  id: number;
  tajuk: string;
  keterangan: string | null;
  tarikh_mula: string;
  tarikh_akhir: string;
  dokumen: string | null;
  harga: number;
  status: 'aktif' | 'tamat' | 'batal';
  created_by: number;
  created_by_name: string;
  created_at: string;
  jumlah_pembeli: number;
}

interface Pembeli {
  id: number;
  tender_id: number;
  nama_syarikat: string;
  no_tel: string;
  nama_pembeli: string;
  no_resit: string | null;
  tarikh_beli: string;
  keterangan: string | null;
  created_by_name: string;
}

export default function AdminTenderPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [pembeli, setPembeli] = useState<Pembeli[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [showPembeliModal, setShowPembeliModal] = useState(false);
  const [editingPembeli, setEditingPembeli] = useState<Pembeli | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    id: 0,
    tajuk: '',
    keterangan: '',
    tarikh_mula: '',
    tarikh_akhir: '',
    dokumen: '',
    harga: 0,
    status: 'aktif' as 'aktif' | 'tamat' | 'batal'
  });

  const [pembeliForm, setPembeliForm] = useState({
    id: 0,
    tender_id: 0,
    nama_syarikat: '',
    no_tel: '',
    nama_pembeli: '',
    no_resit: '',
    tarikh_beli: new Date().toISOString().split('T')[0],
    keterangan: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && session.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchTenders();
    }
  }, [session]);

  const fetchTenders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tender?admin=true');
      if (res.ok) {
        const data = await res.json();
        setTenders(data.data);
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPembeli = async (tenderId: number) => {
    try {
      const res = await fetch(`/api/tender/pembeli?tender_id=${tenderId}`);
      if (res.ok) {
        const data = await res.json();
        setPembeli(data.data);
      }
    } catch (error) {
      console.error('Error fetching pembeli:', error);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(true);
    const formDataUpload = new FormData();
    formDataUpload.append('dokumen', file);

    try {
      const res = await fetch('/api/tender/upload', {
        method: 'POST',
        body: formDataUpload
      });

      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, dokumen: data.url });
        setMessage({ type: 'success', text: 'Dokumen berjaya dimuat naik' });
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Gagal memuat naik dokumen' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa memuat naik dokumen' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSubmitTender = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const res = await fetch('/api/tender', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: formData.id ? 'Tender berjaya dikemaskini' : 'Tender berjaya ditambah' });
        resetForm();
        setActiveTab('list');
        fetchTenders();
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa menyimpan tender' });
    }
  };

  const handleEditTender = (tender: Tender) => {
    setFormData({
      id: tender.id,
      tajuk: tender.tajuk,
      keterangan: tender.keterangan || '',
      tarikh_mula: tender.tarikh_mula,
      tarikh_akhir: tender.tarikh_akhir,
      dokumen: tender.dokumen || '',
      harga: tender.harga,
      status: tender.status
    });
    setActiveTab('add');
  };

  const handleDeleteTender = async (tender: Tender) => {
    if (!confirm(`Adakah anda pasti mahu memadam tender "${tender.tajuk}"? Semua rekod pembeli juga akan dipadam.`)) return;

    try {
      const res = await fetch(`/api/tender?id=${tender.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Tender berjaya dipadam' });
        fetchTenders();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa memadam tender' });
    }
  };

  const handleStatusChange = async (tender: Tender, newStatus: 'aktif' | 'tamat' | 'batal') => {
    try {
      const res = await fetch('/api/tender', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tender.id, status: newStatus })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Status tender berjaya dikemaskini' });
        fetchTenders();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa mengemaskini status' });
    }
  };

  const handleViewPembeli = (tender: Tender) => {
    setSelectedTender(tender);
    fetchPembeli(tender.id);
    setShowPembeliModal(true);
  };

  const handleSubmitPembeli = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = pembeliForm.id ? 'PUT' : 'POST';
      const res = await fetch('/api/tender/pembeli', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pembeliForm)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: pembeliForm.id ? 'Maklumat pembeli dikemaskini' : 'Pembeli berjaya ditambah' });
        resetPembeliForm();
        if (selectedTender) {
          fetchPembeli(selectedTender.id);
          fetchTenders(); // Refresh to update jumlah_pembeli count
        }
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa menyimpan pembeli' });
    }
  };

  const handleEditPembeli = (p: Pembeli) => {
    setEditingPembeli(p);
    setPembeliForm({
      id: p.id,
      tender_id: p.tender_id,
      nama_syarikat: p.nama_syarikat,
      no_tel: p.no_tel,
      nama_pembeli: p.nama_pembeli,
      no_resit: p.no_resit || '',
      tarikh_beli: p.tarikh_beli,
      keterangan: p.keterangan || ''
    });
  };

  const handleDeletePembeli = async (p: Pembeli) => {
    if (!confirm(`Adakah anda pasti mahu memadam rekod pembeli "${p.nama_syarikat}"?`)) return;

    try {
      const res = await fetch(`/api/tender/pembeli?id=${p.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Rekod pembeli berjaya dipadam' });
        if (selectedTender) {
          fetchPembeli(selectedTender.id);
          fetchTenders();
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa memadam pembeli' });
    }
  };

  const resetForm = () => {
    setFormData({
      id: 0,
      tajuk: '',
      keterangan: '',
      tarikh_mula: '',
      tarikh_akhir: '',
      dokumen: '',
      harga: 0,
      status: 'aktif'
    });
  };

  const resetPembeliForm = () => {
    setEditingPembeli(null);
    setPembeliForm({
      id: 0,
      tender_id: selectedTender?.id || 0,
      nama_syarikat: '',
      no_tel: '',
      nama_pembeli: '',
      no_resit: '',
      tarikh_beli: new Date().toISOString().split('T')[0],
      keterangan: ''
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'aktif': return 'bg-success';
      case 'tamat': return 'bg-secondary';
      case 'batal': return 'bg-danger';
      default: return 'bg-secondary';
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="mb-0">
              <i className="bi bi-file-earmark-text me-2"></i>
              Pengurusan Tender
            </h4>
            <small className="text-muted">Urus tender dan rekod pembeli dokumen</small>
          </div>
          <a href="/tender" target="_blank" className="btn btn-outline-primary">
            <i className="bi bi-box-arrow-up-right me-2"></i>
            Lihat Halaman Awam
          </a>
        </div>

        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'list' ? 'active' : ''}`}
              onClick={() => { setActiveTab('list'); resetForm(); }}
            >
              <i className="bi bi-list me-2"></i>
              Senarai Tender
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'add' ? 'active' : ''}`}
              onClick={() => { setActiveTab('add'); resetForm(); }}
            >
              <i className="bi bi-plus-lg me-2"></i>
              {formData.id ? 'Edit Tender' : 'Tambah Tender'}
            </button>
          </li>
        </ul>

        {/* List Tab */}
        {activeTab === 'list' && (
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Tajuk Tender</th>
                    <th>Tarikh</th>
                    <th>Harga</th>
                    <th>Dokumen</th>
                    <th>Pembeli</th>
                    <th>Status</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {tenders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Tiada tender dijumpai
                      </td>
                    </tr>
                  ) : (
                    tenders.map((tender) => (
                      <tr key={tender.id}>
                        <td>
                          <strong>{tender.tajuk}</strong>
                          {tender.keterangan && (
                            <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: '300px' }}>
                              {tender.keterangan}
                            </p>
                          )}
                        </td>
                        <td>
                          <small>
                            {new Date(tender.tarikh_mula).toLocaleDateString('ms-MY')} - {new Date(tender.tarikh_akhir).toLocaleDateString('ms-MY')}
                          </small>
                        </td>
                        <td>
                          {tender.harga > 0 ? (
                            <span className="text-success fw-bold">RM {Number(tender.harga).toFixed(2)}</span>
                          ) : (
                            <span className="text-muted">Percuma</span>
                          )}
                        </td>
                        <td>
                          {tender.dokumen ? (
                            <a href={tender.dokumen} target="_blank" className="btn btn-sm btn-outline-primary">
                              <i className="bi bi-file-pdf"></i>
                            </a>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-info text-white"
                            onClick={() => handleViewPembeli(tender)}
                            title="Rekod Pembeli Dokumen"
                          >
                            <i className="bi bi-people-fill me-1"></i>
                            <span className="badge bg-white text-info">{tender.jumlah_pembeli}</span>
                            <span className="ms-1 d-none d-lg-inline">Pembeli</span>
                          </button>
                        </td>
                        <td>
                          <div className="dropdown">
                            <button
                              className={`btn btn-sm dropdown-toggle ${getStatusBadge(tender.status)}`}
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                            </button>
                            <ul className="dropdown-menu">
                              <li>
                                <button className="dropdown-item" onClick={() => handleStatusChange(tender, 'aktif')}>
                                  Aktif
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => handleStatusChange(tender, 'tamat')}>
                                  Tamat
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item" onClick={() => handleStatusChange(tender, 'batal')}>
                                  Batal
                                </button>
                              </li>
                            </ul>
                          </div>
                        </td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEditTender(tender)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteTender(tender)}
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
        )}

        {/* Add/Edit Tab */}
        {activeTab === 'add' && (
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmitTender}>
                <div className="row">
                  <div className="col-md-8">
                    <div className="mb-3">
                      <label className="form-label">Tajuk Tender <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.tajuk}
                        onChange={(e) => setFormData({ ...formData, tajuk: e.target.value })}
                        required
                        placeholder="Masukkan tajuk tender"
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Harga Dokumen (RM)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.harga}
                        onChange={(e) => setFormData({ ...formData, harga: parseFloat(e.target.value) || 0 })}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Keterangan</label>
                  <textarea
                    className="form-control"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                    rows={3}
                    placeholder="Keterangan tender (pilihan)"
                  ></textarea>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tarikh Mula <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tarikh_mula}
                        onChange={(e) => setFormData({ ...formData, tarikh_mula: e.target.value })}
                        required
                      />
                      <small className="text-muted">Tarikh tender mula boleh dibeli</small>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Tarikh Akhir <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tarikh_akhir}
                        onChange={(e) => setFormData({ ...formData, tarikh_akhir: e.target.value })}
                        required
                      />
                      <small className="text-muted">Tarikh akhir tender boleh dibeli</small>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Dokumen Tender (PDF)</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={formData.dokumen}
                      onChange={(e) => setFormData({ ...formData, dokumen: e.target.value })}
                      placeholder="URL dokumen atau muat naik fail"
                      readOnly
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="d-none"
                      accept=".pdf"
                      onChange={handleDocumentUpload}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingDoc}
                    >
                      {uploadingDoc ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <i className="bi bi-upload"></i>
                      )}
                    </button>
                    {formData.dokumen && (
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => setFormData({ ...formData, dokumen: '' })}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                  <small className="text-muted">Muat naik fail PDF (maksimum 10MB)</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'aktif' | 'tamat' | 'batal' })}
                  >
                    <option value="aktif">Aktif</option>
                    <option value="tamat">Tamat</option>
                    <option value="batal">Batal</option>
                  </select>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-check-lg me-2"></i>
                    {formData.id ? 'Kemaskini' : 'Simpan'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => { setActiveTab('list'); resetForm(); }}>
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Pembeli Modal */}
        {showPembeliModal && selectedTender && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-people me-2"></i>
                    Senarai Pembeli - {selectedTender.tajuk}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => { setShowPembeliModal(false); resetPembeliForm(); }}></button>
                </div>
                <div className="modal-body">
                  {/* Add Pembeli Form */}
                  <div className="card mb-4">
                    <div className="card-header">
                      <h6 className="mb-0">
                        <i className="bi bi-plus-lg me-2"></i>
                        {editingPembeli ? 'Edit Pembeli' : 'Tambah Pembeli Baru'}
                      </h6>
                    </div>
                    <div className="card-body">
                      <form onSubmit={handleSubmitPembeli}>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Nama Syarikat <span className="text-danger">*</span></label>
                              <input
                                type="text"
                                className="form-control"
                                value={pembeliForm.nama_syarikat}
                                onChange={(e) => setPembeliForm({ ...pembeliForm, nama_syarikat: e.target.value, tender_id: selectedTender.id })}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">No. Telefon <span className="text-danger">*</span></label>
                              <input
                                type="text"
                                className="form-control"
                                value={pembeliForm.no_tel}
                                onChange={(e) => setPembeliForm({ ...pembeliForm, no_tel: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                        </div>
                        <div className="row">
                          <div className="col-md-6">
                            <div className="mb-3">
                              <label className="form-label">Nama Pembeli/Wakil <span className="text-danger">*</span></label>
                              <input
                                type="text"
                                className="form-control"
                                value={pembeliForm.nama_pembeli}
                                onChange={(e) => setPembeliForm({ ...pembeliForm, nama_pembeli: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="mb-3">
                              <label className="form-label">No. Resit</label>
                              <input
                                type="text"
                                className="form-control"
                                value={pembeliForm.no_resit}
                                onChange={(e) => setPembeliForm({ ...pembeliForm, no_resit: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="col-md-3">
                            <div className="mb-3">
                              <label className="form-label">Tarikh Beli <span className="text-danger">*</span></label>
                              <input
                                type="date"
                                className="form-control"
                                value={pembeliForm.tarikh_beli}
                                onChange={(e) => setPembeliForm({ ...pembeliForm, tarikh_beli: e.target.value })}
                                required
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Keterangan</label>
                          <textarea
                            className="form-control"
                            value={pembeliForm.keterangan}
                            onChange={(e) => setPembeliForm({ ...pembeliForm, keterangan: e.target.value })}
                            rows={2}
                          ></textarea>
                        </div>
                        <div className="d-flex gap-2">
                          <button type="submit" className="btn btn-primary">
                            <i className="bi bi-check-lg me-2"></i>
                            {editingPembeli ? 'Kemaskini' : 'Tambah'}
                          </button>
                          {editingPembeli && (
                            <button type="button" className="btn btn-secondary" onClick={resetPembeliForm}>
                              Batal
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Pembeli List */}
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>#</th>
                          <th>Syarikat</th>
                          <th>No. Tel</th>
                          <th>Pembeli</th>
                          <th>No. Resit</th>
                          <th>Tarikh Beli</th>
                          <th>Keterangan</th>
                          <th>Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pembeli.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-4 text-muted">
                              Tiada rekod pembeli
                            </td>
                          </tr>
                        ) : (
                          pembeli.map((p, index) => (
                            <tr key={p.id}>
                              <td>{index + 1}</td>
                              <td><strong>{p.nama_syarikat}</strong></td>
                              <td>{p.no_tel}</td>
                              <td>{p.nama_pembeli}</td>
                              <td>{p.no_resit || '-'}</td>
                              <td>{new Date(p.tarikh_beli).toLocaleDateString('ms-MY')}</td>
                              <td className="text-truncate" style={{ maxWidth: '150px' }}>{p.keterangan || '-'}</td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => handleEditPembeli(p)}
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button
                                    className="btn btn-outline-danger"
                                    onClick={() => handleDeletePembeli(p)}
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
                <div className="modal-footer justify-content-between">
                  <a
                    href={`/dashboard/tender/laporan?tender_id=${selectedTender.id}`}
                    target="_blank"
                    className="btn btn-success"
                  >
                    <i className="bi bi-printer me-2"></i>
                    Cetak Laporan
                  </a>
                  <button type="button" className="btn btn-secondary" onClick={() => { setShowPembeliModal(false); resetPembeliForm(); }}>
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
