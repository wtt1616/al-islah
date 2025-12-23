'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface BakiBank {
  id: number;
  nama_bank: string;
  cawangan: string | null;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface BakiPelaburan {
  id: number;
  nama_bank: string;
  cawangan: string | null;
  baki_tahun_semasa: number;
  baki_tahun_sebelum: number;
}

interface BakiDeposit {
  id: number;
  deposit: string;
  tarikh: string | null;
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

type ModalType = 'bank' | 'pelaburan' | 'deposit' | null;

export default function NotaButiranBaki31DisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<NotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

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
      const response = await fetch(`/api/financial/nota-butiran-baki-31dis?tahun=${tahun}`);
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

  const openAddModal = (type: ModalType) => {
    setModalType(type);
    setEditingItem(null);
    if (type === 'bank') {
      setFormData({ nama_bank: '', cawangan: '', baki_tahun_semasa: '', baki_tahun_sebelum: '' });
    } else if (type === 'pelaburan') {
      setFormData({ nama_bank: '', cawangan: '', baki_tahun_semasa: '', baki_tahun_sebelum: '' });
    } else if (type === 'deposit') {
      setFormData({ deposit: '', tarikh: '', baki_tahun_semasa: '', baki_tahun_sebelum: '' });
    }
    setShowModal(true);
  };

  const openEditModal = (type: ModalType, item: any) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'bank') {
      setFormData({
        nama_bank: item.nama_bank,
        cawangan: item.cawangan || '',
        baki_tahun_semasa: item.baki_tahun_semasa,
        baki_tahun_sebelum: item.baki_tahun_sebelum,
      });
    } else if (type === 'pelaburan') {
      setFormData({
        nama_bank: item.nama_bank,
        cawangan: item.cawangan || '',
        baki_tahun_semasa: item.baki_tahun_semasa,
        baki_tahun_sebelum: item.baki_tahun_sebelum,
      });
    } else if (type === 'deposit') {
      setFormData({
        deposit: item.deposit,
        tarikh: item.tarikh ? item.tarikh.split('T')[0] : '',
        baki_tahun_semasa: item.baki_tahun_semasa,
        baki_tahun_sebelum: item.baki_tahun_sebelum,
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const url = '/api/financial/nota-butiran-baki-31dis';
      const method = editingItem ? 'PUT' : 'POST';
      const body = {
        type: modalType,
        tahun,
        ...(editingItem ? { id: editingItem.id } : {}),
        ...formData,
        baki_tahun_semasa: parseFloat(formData.baki_tahun_semasa) || 0,
        baki_tahun_sebelum: parseFloat(formData.baki_tahun_sebelum) || 0,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save');

      setSuccess(editingItem ? 'Data berjaya dikemaskini' : 'Data berjaya ditambah');
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

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam rekod ini?')) return;

    try {
      const response = await fetch(`/api/financial/nota-butiran-baki-31dis?type=${type}&id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      setSuccess('Data berjaya dipadam');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal memadam data');
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
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => window.history.back()}
          >
            &larr; Kembali
          </button>
          <h4 className="mb-0">Selenggara Nota Butiran Baki 31 Disember</h4>
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
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {data && (
        <>
          {/* Section 1: Baki Wang Di Bank */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">1. Baki Semua Wang Di Bank Pada 31 Disember</h6>
              <button className="btn btn-primary btn-sm" onClick={() => openAddModal('bank')}>
                <i className="bi bi-plus-lg me-1"></i> Tambah
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>Bil</th>
                      <th>Nama Bank</th>
                      <th>Cawangan</th>
                      <th className="text-end" style={{ width: '150px' }}>Tahun Semasa (RM)</th>
                      <th className="text-end" style={{ width: '150px' }}>Tahun Sebelum (RM)</th>
                      <th style={{ width: '100px' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bakiBank.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">Tiada rekod</td>
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
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditModal('bank', item)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete('bank', item.id)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold table-secondary">
                      <td colSpan={3} className="text-end">JUMLAH</td>
                      <td className="text-end">{formatCurrency(data.jumlah.bank.semasa)}</td>
                      <td className="text-end">{formatCurrency(data.jumlah.bank.sebelum)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2: Baki Pelaburan */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">2. Baki Pelaburan Pada 31 Disember</h6>
              <button className="btn btn-primary btn-sm" onClick={() => openAddModal('pelaburan')}>
                <i className="bi bi-plus-lg me-1"></i> Tambah
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>Bil</th>
                      <th>Nama Bank</th>
                      <th>Cawangan</th>
                      <th className="text-end" style={{ width: '150px' }}>Tahun Semasa (RM)</th>
                      <th className="text-end" style={{ width: '150px' }}>Tahun Sebelum (RM)</th>
                      <th style={{ width: '100px' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bakiPelaburan.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">Tiada rekod</td>
                      </tr>
                    ) : (
                      data.bakiPelaburan.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.nama_bank}</td>
                          <td>{item.cawangan || '-'}</td>
                          <td className="text-end">{formatCurrency(item.baki_tahun_semasa)}</td>
                          <td className="text-end">{formatCurrency(item.baki_tahun_sebelum)}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditModal('pelaburan', item)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete('pelaburan', item.id)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold table-secondary">
                      <td colSpan={3} className="text-end">JUMLAH</td>
                      <td className="text-end">{formatCurrency(data.jumlah.pelaburan.semasa)}</td>
                      <td className="text-end">{formatCurrency(data.jumlah.pelaburan.sebelum)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Section 3: Baki Deposit */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">3. Baki Deposit Di bayar Pada 31 Disember</h6>
              <button className="btn btn-primary btn-sm" onClick={() => openAddModal('deposit')}>
                <i className="bi bi-plus-lg me-1"></i> Tambah
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>Bil</th>
                      <th>Deposit</th>
                      <th style={{ width: '120px' }}>Tarikh</th>
                      <th className="text-end" style={{ width: '150px' }}>Tahun Semasa (RM)</th>
                      <th className="text-end" style={{ width: '150px' }}>Tahun Sebelum (RM)</th>
                      <th style={{ width: '100px' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bakiDeposit.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">Tiada rekod</td>
                      </tr>
                    ) : (
                      data.bakiDeposit.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.deposit}</td>
                          <td>{item.tarikh ? new Date(item.tarikh).toLocaleDateString('ms-MY') : '-'}</td>
                          <td className="text-end">{formatCurrency(item.baki_tahun_semasa)}</td>
                          <td className="text-end">{formatCurrency(item.baki_tahun_sebelum)}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditModal('deposit', item)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete('deposit', item.id)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold table-secondary">
                      <td colSpan={3} className="text-end">JUMLAH</td>
                      <td className="text-end">{formatCurrency(data.jumlah.deposit.semasa)}</td>
                      <td className="text-end">{formatCurrency(data.jumlah.deposit.sebelum)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="card">
            <div className="card-body bg-dark text-white">
              <div className="row align-items-center">
                <div className="col-md-6">
                  <h6 className="mb-0 fw-bold">JUMLAH KESELURUHAN BAKI 31 DISEMBER {tahun}</h6>
                </div>
                <div className="col-md-3 text-end">
                  <span className="fw-bold">RM {formatCurrency(data.jumlah.keseluruhan.semasa)}</span>
                </div>
                <div className="col-md-3 text-end">
                  <span className="fw-bold">RM {formatCurrency(data.jumlah.keseluruhan.sebelum)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingItem ? 'Edit' : 'Tambah'}{' '}
                  {modalType === 'bank' ? 'Baki Bank' : modalType === 'pelaburan' ? 'Baki Pelaburan' : 'Baki Deposit'}
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
                        value={formData.nama_bank}
                        onChange={(e) => setFormData({ ...formData, nama_bank: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Cawangan</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cawangan}
                        onChange={(e) => setFormData({ ...formData, cawangan: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {modalType === 'pelaburan' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Nama Bank *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nama_bank}
                        onChange={(e) => setFormData({ ...formData, nama_bank: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Cawangan</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.cawangan}
                        onChange={(e) => setFormData({ ...formData, cawangan: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {modalType === 'deposit' && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Deposit *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.deposit}
                        onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Tarikh</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tarikh}
                        onChange={(e) => setFormData({ ...formData, tarikh: e.target.value })}
                      />
                    </div>
                  </>
                )}

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Semasa (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.baki_tahun_semasa}
                      onChange={(e) => setFormData({ ...formData, baki_tahun_semasa: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Sebelum (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.baki_tahun_sebelum}
                      onChange={(e) => setFormData({ ...formData, baki_tahun_sebelum: e.target.value })}
                    />
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
