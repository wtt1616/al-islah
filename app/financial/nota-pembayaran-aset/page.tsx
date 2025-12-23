'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AsetItem {
  id: number;
  senarai_aset: string;
  baki_awal: number;
  terimaan: number;
  belanja: number;
  baki: number;
  auto_generated: boolean;
  urutan: number;
}

interface SummaryItem {
  id: number;
  perkara: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface NotaData {
  tahun: number;
  asetData: AsetItem[];
  grandTotal: {
    baki_awal: number;
    terimaan: number;
    belanja: number;
    baki: number;
  };
  summaryData: SummaryItem[];
  summaryGrandTotal: {
    semasa: number;
    sebelum: number;
  };
}

export default function NotaPembayaranAsetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<NotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingAset, setGeneratingAset] = useState(false);

  // Aset Modal state
  const [showAsetModal, setShowAsetModal] = useState(false);
  const [editingAset, setEditingAset] = useState<AsetItem | null>(null);
  const [asetFormData, setAsetFormData] = useState({
    senarai_aset: '',
    baki_awal: '',
    terimaan: '',
    belanja: ''
  });
  const [saving, setSaving] = useState(false);

  // Summary Modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [editingSummary, setEditingSummary] = useState<SummaryItem | null>(null);
  const [summaryFormData, setSummaryFormData] = useState({
    jumlah_tahun_semasa: '',
    jumlah_tahun_sebelum: ''
  });

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
      const response = await fetch(`/api/financial/nota-pembayaran-aset?tahun=${tahun}`);
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

  const handleAutoGenerateAset = async () => {
    if (!confirm(`Adakah anda pasti untuk menjana senarai aset dari buku tunai untuk tahun ${tahun}? Nilai belanja akan dikemaskini berdasarkan transaksi Aset.`)) {
      return;
    }

    try {
      setGeneratingAset(true);
      setError('');
      const response = await fetch('/api/financial/nota-pembayaran-aset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_generate_aset', tahun }),
      });

      if (!response.ok) throw new Error('Failed to auto-generate');

      const result = await response.json();
      setSuccess(`Senarai aset berjaya dijana. ${result.count} aset ditemui.`);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menjana senarai aset');
      console.error(err);
    } finally {
      setGeneratingAset(false);
    }
  };

  const handleAutoGenerateSummary = async () => {
    if (!confirm(`Adakah anda pasti untuk menjana semula ringkasan untuk tahun ${tahun}? Ringkasan auto-generated sedia ada akan dikemaskini.`)) {
      return;
    }

    try {
      setGenerating(true);
      setError('');
      const response = await fetch('/api/financial/nota-pembayaran-aset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_generate_summary', tahun }),
      });

      if (!response.ok) throw new Error('Failed to auto-generate');

      setSuccess('Ringkasan berjaya dijana automatik');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menjana ringkasan');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  // Aset CRUD
  const openAddAsetModal = () => {
    setEditingAset(null);
    setAsetFormData({
      senarai_aset: '',
      baki_awal: '',
      terimaan: '',
      belanja: ''
    });
    setShowAsetModal(true);
  };

  const openEditAsetModal = (item: AsetItem) => {
    setEditingAset(item);
    setAsetFormData({
      senarai_aset: item.senarai_aset,
      baki_awal: item.baki_awal.toString(),
      terimaan: item.terimaan.toString(),
      belanja: item.belanja.toString(),
    });
    setShowAsetModal(true);
  };

  const handleSaveAset = async () => {
    if (!asetFormData.senarai_aset.trim()) {
      setError('Sila masukkan nama aset');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const url = '/api/financial/nota-pembayaran-aset';
      const method = editingAset ? 'PUT' : 'POST';
      const body = {
        ...(editingAset ? { id: editingAset.id } : { tahun }),
        senarai_aset: asetFormData.senarai_aset,
        baki_awal: parseFloat(asetFormData.baki_awal) || 0,
        terimaan: parseFloat(asetFormData.terimaan) || 0,
        belanja: parseFloat(asetFormData.belanja) || 0,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save');

      setSuccess(editingAset ? 'Data berjaya dikemaskini' : 'Data berjaya ditambah');
      setShowAsetModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menyimpan data');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAset = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam rekod ini?')) return;

    try {
      const response = await fetch(`/api/financial/nota-pembayaran-aset?id=${id}`, {
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

  // Summary CRUD
  const openEditSummaryModal = (item: SummaryItem) => {
    setEditingSummary(item);
    setSummaryFormData({
      jumlah_tahun_semasa: item.jumlah_tahun_semasa.toString(),
      jumlah_tahun_sebelum: item.jumlah_tahun_sebelum.toString(),
    });
    setShowSummaryModal(true);
  };

  const handleSaveSummary = async () => {
    if (!editingSummary) return;

    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/financial/nota-pembayaran-aset', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSummary.id,
          type: 'summary',
          jumlah_tahun_semasa: parseFloat(summaryFormData.jumlah_tahun_semasa) || 0,
          jumlah_tahun_sebelum: parseFloat(summaryFormData.jumlah_tahun_sebelum) || 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setSuccess('Ringkasan berjaya dikemaskini');
      setShowSummaryModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menyimpan ringkasan');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Calculate baki preview in form
  const calculatedBaki = () => {
    const ba = parseFloat(asetFormData.baki_awal) || 0;
    const t = parseFloat(asetFormData.terimaan) || 0;
    const b = parseFloat(asetFormData.belanja) || 0;
    return ba + t - b;
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
          <h4 className="mb-0">Selenggara Nota Butiran Pembayaran Aset</h4>
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
          {/* Table 1: Senarai Aset */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h6 className="mb-0">16. Aset (Sumbangan Am) - a. Keperluan Modal / Peralatan</h6>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleAutoGenerateAset}
                  disabled={generatingAset}
                >
                  {generatingAset ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Menjana...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lightning-fill me-1"></i>
                      Jana dari Buku Tunai
                    </>
                  )}
                </button>
                <button className="btn btn-primary btn-sm" onClick={openAddAsetModal}>
                  <i className="bi bi-plus-lg me-1"></i> Tambah Manual
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>Bil</th>
                      <th>Senarai Aset</th>
                      <th className="text-end" style={{ width: '120px' }}>Baki Awal</th>
                      <th className="text-end" style={{ width: '120px' }}>Terimaan</th>
                      <th className="text-end" style={{ width: '120px' }}>Belanja</th>
                      <th className="text-end" style={{ width: '120px' }}>Baki</th>
                      <th style={{ width: '90px' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.asetData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted">Tiada rekod</td>
                      </tr>
                    ) : (
                      data.asetData.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.senarai_aset}</td>
                          <td className="text-end">{item.baki_awal === 0 ? '-' : formatCurrency(item.baki_awal)}</td>
                          <td className="text-end">{formatCurrency(item.terimaan)}</td>
                          <td className="text-end">{formatCurrency(item.belanja)}</td>
                          <td className="text-end fw-bold">{formatCurrency(item.baki)}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditAsetModal(item)}>
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAset(item.id)}>
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.asetData.length > 0 && (
                    <tfoot>
                      <tr className="fw-bold table-primary">
                        <td colSpan={2} className="text-end">JUMLAH</td>
                        <td className="text-end">{data.grandTotal.baki_awal === 0 ? '-' : formatCurrency(data.grandTotal.baki_awal)}</td>
                        <td className="text-end">{formatCurrency(data.grandTotal.terimaan)}</td>
                        <td className="text-end">{formatCurrency(data.grandTotal.belanja)}</td>
                        <td className="text-end">{formatCurrency(data.grandTotal.baki)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          {/* Table 2: Summary (Tahun Semasa vs Tahun Sebelum) */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Ringkasan Aset (Tahun Semasa vs Tahun Sebelum)</h6>
              <button
                className="btn btn-success btn-sm"
                onClick={handleAutoGenerateSummary}
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
                    Jana Ringkasan
                  </>
                )}
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>Bil</th>
                      <th>Perkara</th>
                      <th className="text-end" style={{ width: '140px' }}>Tahun Semasa (RM)</th>
                      <th className="text-end" style={{ width: '140px' }}>Tahun Sebelum (RM)</th>
                      <th style={{ width: '70px' }}>Auto</th>
                      <th style={{ width: '70px' }}>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.summaryData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center text-muted">
                          Tiada ringkasan. Klik &quot;Jana Ringkasan&quot; untuk menjana.
                        </td>
                      </tr>
                    ) : (
                      data.summaryData.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.perkara}</td>
                          <td className="text-end">{formatCurrency(item.jumlah_tahun_semasa)}</td>
                          <td className="text-end">{item.jumlah_tahun_sebelum === 0 ? '-' : formatCurrency(item.jumlah_tahun_sebelum)}</td>
                          <td className="text-center">
                            {item.auto_generated ? (
                              <span className="badge bg-info">Auto</span>
                            ) : (
                              <span className="badge bg-secondary">Manual</span>
                            )}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => openEditSummaryModal(item)}>
                              <i className="bi bi-pencil"></i>
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
        </>
      )}

      <div className="mt-3">
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Nota:</strong>
          <ul className="mb-0 mt-2">
            <li><strong>&quot;Jana dari Buku Tunai&quot;</strong> - Menjana senarai aset dari transaksi kewangan (kategori pembayaran = Aset). Nilai Belanja akan dikemaskini mengikut transaksi.</li>
            <li><strong>&quot;Tambah Manual&quot;</strong> - Menambah aset secara manual jika tiada dalam transaksi.</li>
            <li>Jadual pertama menyenaraikan aset dengan Baki Awal, Terimaan, Belanja. <strong>Baki dikira automatik</strong> (Baki Awal + Terimaan - Belanja).</li>
            <li>Jadual kedua meringkaskan jumlah mengikut column untuk Tahun Semasa dan Tahun Sebelum.</li>
            <li>Klik &quot;Jana Ringkasan&quot; untuk mengira nilai Tahun Semasa dari jadual pertama secara automatik.</li>
            <li>Semua nilai boleh dikemaskini secara manual oleh bendahari dengan klik butang Edit.</li>
          </ul>
        </div>
      </div>

      {/* Aset Modal */}
      {showAsetModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingAset ? 'Edit' : 'Tambah'} Aset
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAsetModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Senarai Aset *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="cth: TV, Perabot, Komputer"
                    value={asetFormData.senarai_aset}
                    onChange={(e) => setAsetFormData({ ...asetFormData, senarai_aset: e.target.value })}
                  />
                </div>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Baki Awal (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={asetFormData.baki_awal}
                      onChange={(e) => setAsetFormData({ ...asetFormData, baki_awal: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Terimaan (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={asetFormData.terimaan}
                      onChange={(e) => setAsetFormData({ ...asetFormData, terimaan: e.target.value })}
                    />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Belanja (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={asetFormData.belanja}
                      onChange={(e) => setAsetFormData({ ...asetFormData, belanja: e.target.value })}
                    />
                  </div>
                </div>
                <div className="alert alert-secondary">
                  <strong>Baki (dikira automatik):</strong> RM {formatCurrency(calculatedBaki())}
                  <br />
                  <small className="text-muted">Formula: Baki Awal + Terimaan - Belanja</small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAsetModal(false)}>
                  Batal
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveAset} disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && editingSummary && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit Ringkasan: {editingSummary.perkara}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowSummaryModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Semasa (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={summaryFormData.jumlah_tahun_semasa}
                      onChange={(e) => setSummaryFormData({ ...summaryFormData, jumlah_tahun_semasa: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Sebelum (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={summaryFormData.jumlah_tahun_sebelum}
                      onChange={(e) => setSummaryFormData({ ...summaryFormData, jumlah_tahun_sebelum: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSummaryModal(false)}>
                  Batal
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveSummary} disabled={saving}>
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
