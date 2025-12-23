'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface NotaItem {
  id: number;
  sub_kategori1: string;
  sub_kategori1_kod: string;
  sub_kategori2: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface GroupedData {
  kod: string;
  nama: string;
  items: NotaItem[];
  subtotal: {
    semasa: number;
    sebelum: number;
  };
}

interface NotaData {
  tahun: number;
  data: Record<string, GroupedData>;
  grandTotal: {
    semasa: number;
    sebelum: number;
  };
  subKategori1List: { nama: string; kod: string }[];
}

const SUB_KATEGORI1_OPTIONS = [
  { kod: 'a', nama: 'Emolumen', columnHeader: 'Jawatan' },
  { kod: 'b', nama: 'Kebajikan', columnHeader: 'Perkara' },
  { kod: 'c', nama: 'Keraian Dan Hospitaliti', columnHeader: 'Perkara' },
  { kod: 'd', nama: 'Kursus Dan Latihan', columnHeader: 'Perkara' },
];

export default function NotaPembayaranSumberManusiaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<NotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generating, setGenerating] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NotaItem | null>(null);
  const [formData, setFormData] = useState({
    sub_kategori1: 'Emolumen',
    sub_kategori2: '',
    jumlah_tahun_semasa: '',
    jumlah_tahun_sebelum: ''
  });
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
      const response = await fetch(`/api/financial/nota-pembayaran-sumber-manusia?tahun=${tahun}`);
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

  const handleAutoGenerate = async () => {
    if (!confirm(`Adakah anda pasti untuk menjana semula nilai automatik dari transaksi untuk tahun ${tahun}? Rekod auto-generated sedia ada akan dikemaskini.`)) {
      return;
    }

    try {
      setGenerating(true);
      setError('');
      const response = await fetch('/api/financial/nota-pembayaran-sumber-manusia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_generate', tahun }),
      });

      if (!response.ok) throw new Error('Failed to auto-generate');

      setSuccess('Nilai berjaya dijana automatik dari transaksi');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menjana nilai automatik');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const openAddModal = (subKategori1?: string) => {
    setEditingItem(null);
    setFormData({
      sub_kategori1: subKategori1 || 'Emolumen',
      sub_kategori2: '',
      jumlah_tahun_semasa: '',
      jumlah_tahun_sebelum: ''
    });
    setShowModal(true);
  };

  const openEditModal = (item: NotaItem) => {
    setEditingItem(item);
    setFormData({
      sub_kategori1: item.sub_kategori1,
      sub_kategori2: item.sub_kategori2,
      jumlah_tahun_semasa: item.jumlah_tahun_semasa.toString(),
      jumlah_tahun_sebelum: item.jumlah_tahun_sebelum.toString(),
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const url = '/api/financial/nota-pembayaran-sumber-manusia';
      const method = editingItem ? 'PUT' : 'POST';
      const body = {
        ...(editingItem ? { id: editingItem.id } : { tahun }),
        sub_kategori1: formData.sub_kategori1,
        sub_kategori2: formData.sub_kategori2,
        jumlah_tahun_semasa: parseFloat(formData.jumlah_tahun_semasa) || 0,
        jumlah_tahun_sebelum: parseFloat(formData.jumlah_tahun_sebelum) || 0,
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

  const handleDelete = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam rekod ini?')) return;

    try {
      const response = await fetch(`/api/financial/nota-pembayaran-sumber-manusia?id=${id}`, {
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
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => window.history.back()}>&larr; Kembali</button>
          <h4 className="mb-0">Selenggara Nota Butiran Pembayaran Pengurusan Sumber Manusia</h4>
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
            className="btn btn-success btn-sm"
            onClick={handleAutoGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                Menjana...
              </>
            ) : (
              <>
                <i className="bi bi-lightning-fill me-1"></i>
                Jana Automatik
              </>
            )}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => openAddModal()}>
            <i className="bi bi-plus-lg me-1"></i> Tambah
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {data && (
        <>
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">12. Pengurusan Sumber Manusia</h6>
            </div>
          </div>

          {SUB_KATEGORI1_OPTIONS.map((subKat1) => {
            const groupData = data.data[subKat1.nama];
            if (!groupData) return null;

            return (
              <div key={subKat1.kod} className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <strong>{subKat1.kod}. {subKat1.nama}</strong>
                  </div>
                  <button
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => openAddModal(subKat1.nama)}
                  >
                    <i className="bi bi-plus-lg me-1"></i> Tambah
                  </button>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '50px' }}>Bil</th>
                          <th>{subKat1.columnHeader}</th>
                          <th className="text-end" style={{ width: '140px' }}>Tahun Semasa (RM)</th>
                          <th className="text-end" style={{ width: '140px' }}>Tahun Sebelum (RM)</th>
                          <th style={{ width: '70px' }}>Auto</th>
                          <th style={{ width: '90px' }}>Tindakan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupData.items.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center text-muted">Tiada rekod</td>
                          </tr>
                        ) : (
                          groupData.items.map((item, idx) => (
                            <tr key={item.id}>
                              <td>{idx + 1}</td>
                              <td>{item.sub_kategori2}</td>
                              <td className="text-end">{formatCurrency(item.jumlah_tahun_semasa)}</td>
                              <td className="text-end">{formatCurrency(item.jumlah_tahun_sebelum)}</td>
                              <td className="text-center">
                                {item.auto_generated ? (
                                  <span className="badge bg-info">Auto</span>
                                ) : (
                                  <span className="badge bg-secondary">Manual</span>
                                )}
                              </td>
                              <td>
                                <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditModal(item)}>
                                  <i className="bi bi-pencil"></i>
                                </button>
                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item.id)}>
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {groupData.items.length > 0 && (
                        <tfoot>
                          <tr className="fw-bold table-secondary">
                            <td colSpan={2} className="text-end">Jumlah {subKat1.nama}</td>
                            <td className="text-end">{formatCurrency(groupData.subtotal.semasa)}</td>
                            <td className="text-end">{formatCurrency(groupData.subtotal.sebelum)}</td>
                            <td colSpan={2}></td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Grand Total Card */}
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h6 className="mb-0">c. Pengurusan Sumber Manusia (Ringkasan)</h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>Bil</th>
                      <th>Perkara</th>
                      <th className="text-end" style={{ width: '140px' }}>Tahun Semasa (RM)</th>
                      <th className="text-end" style={{ width: '140px' }}>Tahun Sebelum (RM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUB_KATEGORI1_OPTIONS.map((subKat1, idx) => {
                      const groupData = data.data[subKat1.nama];
                      return (
                        <tr key={subKat1.kod}>
                          <td>{idx + 1}</td>
                          <td>{subKat1.nama}</td>
                          <td className="text-end">{formatCurrency(groupData?.subtotal.semasa || 0)}</td>
                          <td className="text-end">{formatCurrency(groupData?.subtotal.sebelum || 0)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="fw-bold table-primary">
                      <td colSpan={2} className="text-end">JUMLAH PENGURUSAN SUMBER MANUSIA</td>
                      <td className="text-end">{formatCurrency(data.grandTotal.semasa)}</td>
                      <td className="text-end">{formatCurrency(data.grandTotal.sebelum)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="mt-3">
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Nota:</strong> Klik butang "Jana Automatik" untuk menjana nilai dari transaksi yang telah dikategorikan sebagai "Pengurusan Sumber Manusia" dengan sub-kategori yang sesuai.
          Nilai yang dijana boleh dikemaskini secara manual oleh bendahari.
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingItem ? 'Edit' : 'Tambah'} Butiran Pembayaran Sumber Manusia
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Sub-Kategori 1 *</label>
                  <select
                    className="form-select"
                    value={formData.sub_kategori1}
                    onChange={(e) => setFormData({ ...formData, sub_kategori1: e.target.value })}
                  >
                    {SUB_KATEGORI1_OPTIONS.map((opt) => (
                      <option key={opt.kod} value={opt.nama}>{opt.kod}. {opt.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">
                    {formData.sub_kategori1 === 'Emolumen' ? 'Jawatan' : 'Perkara'} *
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.sub_kategori2}
                    onChange={(e) => setFormData({ ...formData, sub_kategori2: e.target.value })}
                    placeholder={formData.sub_kategori1 === 'Emolumen'
                      ? 'cth: Pengurus, Setiausaha, Imam 1'
                      : 'cth: Bantuan Musibah, Caruman Insuran'}
                    required
                  />
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Semasa (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.jumlah_tahun_semasa}
                      onChange={(e) => setFormData({ ...formData, jumlah_tahun_semasa: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Sebelum (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.jumlah_tahun_sebelum}
                      onChange={(e) => setFormData({ ...formData, jumlah_tahun_sebelum: e.target.value })}
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
