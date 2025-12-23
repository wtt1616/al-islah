'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BakiBank {
  id: number;
  tahun: number;
  nama_bank: string;
  cawangan: string | null;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface BakiPelaburan {
  id: number;
  tahun: number;
  nama_institusi: string;
  cawangan: string | null;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface BakiDeposit {
  id: number;
  tahun: number;
  perkara: string;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface NotaData {
  tahun: number;
  bakiBank: BakiBank[];
  bakiPelaburan: BakiPelaburan[];
  bakiDeposit: BakiDeposit[];
  jumlah: {
    bank: { semasa: number; sebelum: number };
    pelaburan: { semasa: number; sebelum: number };
    deposit: { semasa: number; sebelum: number };
    keseluruhan: { semasa: number; sebelum: number };
  };
}

export default function NotaButiranBakiPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<NotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'bank' | 'pelaburan' | 'deposit'>('bank');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, tahun]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/financial/nota-butiran-baki?tahun=${tahun}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Gagal memuatkan data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const openAddModal = (type: 'bank' | 'pelaburan' | 'deposit') => {
    setModalType(type);
    setEditingItem(null);
    setFormData({
      baki_tahun_semasa: 0,
      baki_tahun_sebelum: 0,
    });
    setShowModal(true);
  };

  const openEditModal = (type: 'bank' | 'pelaburan' | 'deposit', item: any) => {
    setModalType(type);
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const url = '/api/financial/nota-butiran-baki';
      const method = editingItem ? 'PUT' : 'POST';
      const body = {
        type: modalType,
        tahun,
        ...formData,
        ...(editingItem ? { id: editingItem.id } : {}),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save');

      setSuccess('Data berjaya disimpan');
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menyimpan data');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: 'bank' | 'pelaburan' | 'deposit', id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam rekod ini?')) return;

    try {
      const response = await fetch(`/api/financial/nota-butiran-baki?type=${type}&id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setSuccess('Rekod berjaya dipadam');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal memadam rekod');
      console.error(err);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container py-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session || !['admin', 'bendahari'].includes(session.user.role)) {
    return (
      <div className="container py-4">
        <div className="alert alert-danger">Anda tidak mempunyai akses ke halaman ini.</div>
      </div>
    );
  }

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    years.push(y);
  }

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => window.history.back()}
          >
            &larr; Kembali
          </button>
          <h4 className="mb-0">
            <i className="bi bi-journal-text me-2"></i>
            Nota Butiran Baki 1 Januari
          </h4>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <label className="form-label mb-0 me-2">Tahun:</label>
          <select
            className="form-select form-select-sm"
            style={{ width: 'auto' }}
            value={tahun}
            onChange={(e) => setTahun(parseInt(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={() => router.push(`/dashboard/reports/nota-butiran-baki?tahun=${tahun}`)}
          >
            <i className="bi bi-printer me-1"></i> Lihat Laporan
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {data && (
        <>
          {/* Section 1: Baki Wang Di Bank */}
          <div className="card mb-4">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">1. Baki Semua Wang Di Bank Pada 1 Januari {tahun}</h6>
              <button className="btn btn-light btn-sm" onClick={() => openAddModal('bank')}>
                <i className="bi bi-plus-lg me-1"></i> Tambah Bank
              </button>
            </div>
            <div className="card-body p-0">
              <table className="table table-bordered table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>Bil</th>
                    <th>Nama Bank</th>
                    <th>Cawangan</th>
                    <th className="text-end" style={{ width: '150px' }}>Tahun {tahun} (RM)</th>
                    <th className="text-end" style={{ width: '150px' }}>Tahun {tahun - 1} (RM)</th>
                    <th style={{ width: '100px' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bakiBank.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-3">Tiada rekod</td>
                    </tr>
                  ) : (
                    data.bakiBank.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td>{item.nama_bank}</td>
                        <td>{item.cawangan || '-'}</td>
                        <td className="text-end">{formatCurrency(item.baki_tahun_semasa)}</td>
                        <td className="text-end">{formatCurrency(item.baki_tahun_sebelum)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEditModal('bank', item)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete('bank', item.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="table-primary">
                  <tr>
                    <td colSpan={3} className="fw-bold">JUMLAH</td>
                    <td className="text-end fw-bold">{formatCurrency(data.jumlah.bank.semasa)}</td>
                    <td className="text-end fw-bold">{formatCurrency(data.jumlah.bank.sebelum)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 2: Baki Pelaburan */}
          <div className="card mb-4">
            <div className="card-header bg-success text-white d-flex justify-content-between align-items-center">
              <h6 className="mb-0">2. Baki Pelaburan Pada 1 Januari {tahun}</h6>
              <button className="btn btn-light btn-sm" onClick={() => openAddModal('pelaburan')}>
                <i className="bi bi-plus-lg me-1"></i> Tambah Pelaburan
              </button>
            </div>
            <div className="card-body p-0">
              <table className="table table-bordered table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>Bil</th>
                    <th>Nama Institusi</th>
                    <th>Cawangan</th>
                    <th className="text-end" style={{ width: '150px' }}>Tahun {tahun} (RM)</th>
                    <th className="text-end" style={{ width: '150px' }}>Tahun {tahun - 1} (RM)</th>
                    <th style={{ width: '100px' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bakiPelaburan.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-3">Tiada rekod</td>
                    </tr>
                  ) : (
                    data.bakiPelaburan.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td>{item.nama_institusi}</td>
                        <td>{item.cawangan || '-'}</td>
                        <td className="text-end">{formatCurrency(item.baki_tahun_semasa)}</td>
                        <td className="text-end">{formatCurrency(item.baki_tahun_sebelum)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEditModal('pelaburan', item)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete('pelaburan', item.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="table-success">
                  <tr>
                    <td colSpan={3} className="fw-bold">JUMLAH</td>
                    <td className="text-end fw-bold">{formatCurrency(data.jumlah.pelaburan.semasa)}</td>
                    <td className="text-end fw-bold">{formatCurrency(data.jumlah.pelaburan.sebelum)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Section 3: Baki Deposit */}
          <div className="card mb-4">
            <div className="card-header bg-warning d-flex justify-content-between align-items-center">
              <h6 className="mb-0">3. Baki Deposit Pada 1 Januari {tahun}</h6>
              <button className="btn btn-dark btn-sm" onClick={() => openAddModal('deposit')}>
                <i className="bi bi-plus-lg me-1"></i> Tambah Deposit
              </button>
            </div>
            <div className="card-body p-0">
              <table className="table table-bordered table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '50px' }}>Bil</th>
                    <th>Perkara</th>
                    <th className="text-end" style={{ width: '150px' }}>Tahun {tahun} (RM)</th>
                    <th className="text-end" style={{ width: '150px' }}>Tahun {tahun - 1} (RM)</th>
                    <th style={{ width: '100px' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bakiDeposit.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-muted py-3">Tiada rekod</td>
                    </tr>
                  ) : (
                    data.bakiDeposit.map((item, idx) => (
                      <tr key={item.id}>
                        <td>{idx + 1}</td>
                        <td>{item.perkara}</td>
                        <td className="text-end">{formatCurrency(item.baki_tahun_semasa)}</td>
                        <td className="text-end">{formatCurrency(item.baki_tahun_sebelum)}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openEditModal('deposit', item)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete('deposit', item.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="table-warning">
                  <tr>
                    <td colSpan={2} className="fw-bold">JUMLAH</td>
                    <td className="text-end fw-bold">{formatCurrency(data.jumlah.deposit.semasa)}</td>
                    <td className="text-end fw-bold">{formatCurrency(data.jumlah.deposit.sebelum)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Grand Total */}
          <div className="card border-dark">
            <div className="card-body bg-dark text-white">
              <div className="row">
                <div className="col-6">
                  <h5 className="mb-0">JUMLAH KESELURUHAN BAKI 1 JANUARI</h5>
                </div>
                <div className="col-3 text-end">
                  <h5 className="mb-0">RM {formatCurrency(data.jumlah.keseluruhan.semasa)}</h5>
                  <small>Tahun {tahun}</small>
                </div>
                <div className="col-3 text-end">
                  <h5 className="mb-0">RM {formatCurrency(data.jumlah.keseluruhan.sebelum)}</h5>
                  <small>Tahun {tahun - 1}</small>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal for Add/Edit */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingItem ? 'Edit' : 'Tambah'}{' '}
                  {modalType === 'bank' ? 'Bank' : modalType === 'pelaburan' ? 'Pelaburan' : 'Deposit'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {modalType === 'bank' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Nama Bank *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nama_bank || ''}
                        onChange={(e) => setFormData({ ...formData, nama_bank: e.target.value })}
                        placeholder="cth: Bank Islam Malaysia Berhad"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Cawangan</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cawangan || ''}
                        onChange={(e) => setFormData({ ...formData, cawangan: e.target.value })}
                        placeholder="cth: Ampang"
                      />
                    </div>
                  </>
                )}

                {modalType === 'pelaburan' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Nama Institusi *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nama_institusi || ''}
                        onChange={(e) => setFormData({ ...formData, nama_institusi: e.target.value })}
                        placeholder="cth: CIMB Bank"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Cawangan</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cawangan || ''}
                        onChange={(e) => setFormData({ ...formData, cawangan: e.target.value })}
                        placeholder="cth: Bukit Bintang"
                      />
                    </div>
                  </>
                )}

                {modalType === 'deposit' && (
                  <div className="mb-3">
                    <label className="form-label">Perkara *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.perkara || ''}
                      onChange={(e) => setFormData({ ...formData, perkara: e.target.value })}
                      placeholder="cth: Deposit Air"
                    />
                  </div>
                )}

                <div className="row">
                  <div className="col-6">
                    <div className="mb-3">
                      <label className="form-label">Baki Tahun {tahun} (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.baki_tahun_semasa || 0}
                        onChange={(e) => setFormData({ ...formData, baki_tahun_semasa: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="mb-3">
                      <label className="form-label">Baki Tahun {tahun - 1} (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.baki_tahun_sebelum || 0}
                        onChange={(e) => setFormData({ ...formData, baki_tahun_sebelum: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
