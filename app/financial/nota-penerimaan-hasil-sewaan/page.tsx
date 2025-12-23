'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface MainItem {
  id: number;
  perkara: string;
  jumlah_tahun_semasa: number;
  jumlah_tahun_sebelum: number;
  auto_generated: boolean;
  urutan: number;
}

interface YuranItem {
  id: number;
  yuran_aktiviti: string;
  baki_awal: number;
  terimaan: number;
  belanja: number;
  baki: number;
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
  mainData: MainItem[];
  mainGrandTotal: { semasa: number; sebelum: number };
  yuranData: YuranItem[];
  yuranGrandTotal: { baki_awal: number; terimaan: number; belanja: number; baki: number };
  summaryData: SummaryItem[];
  perkaraOptions: string[];
}

const PERKARA_OPTIONS = [
  'Telekomunikasi',
  'Tanah/ Bangunan / Tapak',
  'Fasiliti Dan Peralatan',
];

export default function NotaPenerimaanHasilSewaanPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<NotaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatingMain, setGeneratingMain] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);

  // Main Modal state
  const [showMainModal, setShowMainModal] = useState(false);
  const [editingMain, setEditingMain] = useState<MainItem | null>(null);
  const [mainFormData, setMainFormData] = useState({
    perkara: PERKARA_OPTIONS[0],
    jumlah_tahun_semasa: '',
    jumlah_tahun_sebelum: ''
  });

  // Yuran Modal state
  const [showYuranModal, setShowYuranModal] = useState(false);
  const [editingYuran, setEditingYuran] = useState<YuranItem | null>(null);
  const [yuranFormData, setYuranFormData] = useState({
    yuran_aktiviti: PERKARA_OPTIONS[0],
    baki_awal: '',
    terimaan: '',
    belanja: ''
  });

  // Summary Modal state
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [editingSummary, setEditingSummary] = useState<SummaryItem | null>(null);
  const [summaryFormData, setSummaryFormData] = useState({
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
      const response = await fetch(`/api/financial/nota-penerimaan-hasil-sewaan?tahun=${tahun}`);
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

  // Auto-generate handlers
  const handleAutoGenerateMain = async () => {
    if (!confirm(`Adakah anda pasti untuk menjana semula data dari transaksi untuk tahun ${tahun}?`)) return;

    try {
      setGeneratingMain(true);
      setError('');
      const response = await fetch('/api/financial/nota-penerimaan-hasil-sewaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auto_generate_main', tahun }),
      });
      if (!response.ok) throw new Error('Failed to auto-generate');
      setSuccess('Data berjaya dijana automatik');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menjana data');
      console.error(err);
    } finally {
      setGeneratingMain(false);
    }
  };

  const handleAutoGenerateSummary = async () => {
    if (!confirm(`Adakah anda pasti untuk menjana semula ringkasan untuk tahun ${tahun}?`)) return;

    try {
      setGeneratingSummary(true);
      setError('');
      const response = await fetch('/api/financial/nota-penerimaan-hasil-sewaan', {
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
      setGeneratingSummary(false);
    }
  };

  // Main CRUD
  const openAddMainModal = () => {
    setEditingMain(null);
    setMainFormData({ perkara: PERKARA_OPTIONS[0], jumlah_tahun_semasa: '', jumlah_tahun_sebelum: '' });
    setShowMainModal(true);
  };

  const openEditMainModal = (item: MainItem) => {
    setEditingMain(item);
    setMainFormData({
      perkara: item.perkara,
      jumlah_tahun_semasa: item.jumlah_tahun_semasa.toString(),
      jumlah_tahun_sebelum: item.jumlah_tahun_sebelum.toString(),
    });
    setShowMainModal(true);
  };

  const handleSaveMain = async () => {
    try {
      setSaving(true);
      setError('');
      const url = '/api/financial/nota-penerimaan-hasil-sewaan';
      const method = editingMain ? 'PUT' : 'POST';
      const body = {
        ...(editingMain ? { id: editingMain.id } : { tahun }),
        table: 'main',
        perkara: mainFormData.perkara,
        jumlah_tahun_semasa: parseFloat(mainFormData.jumlah_tahun_semasa) || 0,
        jumlah_tahun_sebelum: parseFloat(mainFormData.jumlah_tahun_sebelum) || 0,
      };
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error('Failed to save');
      setSuccess(editingMain ? 'Data berjaya dikemaskini' : 'Data berjaya ditambah');
      setShowMainModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menyimpan data');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMain = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam rekod ini?')) return;
    try {
      const response = await fetch(`/api/financial/nota-penerimaan-hasil-sewaan?id=${id}&table=main`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      setSuccess('Data berjaya dipadam');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal memadam data');
      console.error(err);
    }
  };

  // Yuran CRUD
  const openAddYuranModal = () => {
    setEditingYuran(null);
    setYuranFormData({ yuran_aktiviti: PERKARA_OPTIONS[0], baki_awal: '', terimaan: '', belanja: '' });
    setShowYuranModal(true);
  };

  const openEditYuranModal = (item: YuranItem) => {
    setEditingYuran(item);
    setYuranFormData({
      yuran_aktiviti: item.yuran_aktiviti,
      baki_awal: item.baki_awal.toString(),
      terimaan: item.terimaan.toString(),
      belanja: item.belanja.toString(),
    });
    setShowYuranModal(true);
  };

  const handleSaveYuran = async () => {
    try {
      setSaving(true);
      setError('');
      const url = '/api/financial/nota-penerimaan-hasil-sewaan';
      const method = editingYuran ? 'PUT' : 'POST';
      const body = {
        ...(editingYuran ? { id: editingYuran.id } : { tahun }),
        table: 'yuran',
        yuran_aktiviti: yuranFormData.yuran_aktiviti,
        baki_awal: parseFloat(yuranFormData.baki_awal) || 0,
        terimaan: parseFloat(yuranFormData.terimaan) || 0,
        belanja: parseFloat(yuranFormData.belanja) || 0,
      };
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error('Failed to save');
      setSuccess(editingYuran ? 'Data berjaya dikemaskini' : 'Data berjaya ditambah');
      setShowYuranModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal menyimpan data');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteYuran = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam rekod ini?')) return;
    try {
      const response = await fetch(`/api/financial/nota-penerimaan-hasil-sewaan?id=${id}&table=yuran`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      setSuccess('Data berjaya dipadam');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Gagal memadam data');
      console.error(err);
    }
  };

  // Summary Edit
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
      const response = await fetch('/api/financial/nota-penerimaan-hasil-sewaan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSummary.id,
          table: 'summary',
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

  const calculatedBaki = () => {
    const ba = parseFloat(yuranFormData.baki_awal) || 0;
    const t = parseFloat(yuranFormData.terimaan) || 0;
    const b = parseFloat(yuranFormData.belanja) || 0;
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
          <h4 className="mb-0">Selenggara Nota Penerimaan Hasil Sewaan / Penjanaan Ekonomi</h4>
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
          {/* Table 1: Main Data */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">6. Hasil Sewaan / Penjanaan Ekonomi</h6>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleAutoGenerateMain}
                  disabled={generatingMain}
                >
                  {generatingMain ? <><span className="spinner-border spinner-border-sm me-1"></span>Menjana...</> : <><i className="bi bi-lightning-fill me-1"></i>Jana Automatik</>}
                </button>
                <button className="btn btn-primary btn-sm" onClick={openAddMainModal}>
                  <i className="bi bi-plus-lg me-1"></i> Tambah
                </button>
              </div>
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
                      <th style={{ width: '90px' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.mainData.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-muted">Tiada rekod</td></tr>
                    ) : (
                      data.mainData.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.perkara}</td>
                          <td className="text-end">{formatCurrency(item.jumlah_tahun_semasa)}</td>
                          <td className="text-end">{item.jumlah_tahun_sebelum === 0 ? '-' : formatCurrency(item.jumlah_tahun_sebelum)}</td>
                          <td className="text-center">
                            {item.auto_generated ? <span className="badge bg-info">Auto</span> : <span className="badge bg-secondary">Manual</span>}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditMainModal(item)}><i className="bi bi-pencil"></i></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteMain(item.id)}><i className="bi bi-trash"></i></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.mainData.length > 0 && (
                    <tfoot>
                      <tr className="fw-bold table-primary">
                        <td colSpan={2} className="text-end">Total Amaun</td>
                        <td className="text-end">{formatCurrency(data.mainGrandTotal.semasa)}</td>
                        <td className="text-end">{data.mainGrandTotal.sebelum === 0 ? '-' : formatCurrency(data.mainGrandTotal.sebelum)}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          {/* Table 2: Yuran Penagajian Dan Aktiviti */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Yuran Penagajian Dan Aktiviti</h6>
              <button className="btn btn-primary btn-sm" onClick={openAddYuranModal}>
                <i className="bi bi-plus-lg me-1"></i> Tambah
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-bordered table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: '50px' }}>Bil</th>
                      <th>Yuran Penagajian Dan Aktiviti</th>
                      <th className="text-end" style={{ width: '110px' }}>Baki Awal</th>
                      <th className="text-end" style={{ width: '110px' }}>Terimaan</th>
                      <th className="text-end" style={{ width: '110px' }}>Belanja</th>
                      <th className="text-end" style={{ width: '110px' }}>Baki</th>
                      <th style={{ width: '90px' }}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.yuranData.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-muted">Tiada rekod</td></tr>
                    ) : (
                      data.yuranData.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.yuran_aktiviti}</td>
                          <td className="text-end">{item.baki_awal === 0 ? '-' : formatCurrency(item.baki_awal)}</td>
                          <td className="text-end">{formatCurrency(item.terimaan)}</td>
                          <td className="text-end">{formatCurrency(item.belanja)}</td>
                          <td className="text-end fw-bold">{formatCurrency(item.baki)}</td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openEditYuranModal(item)}><i className="bi bi-pencil"></i></button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteYuran(item.id)}><i className="bi bi-trash"></i></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {data.yuranData.length > 0 && (
                    <tfoot>
                      <tr className="fw-bold table-primary">
                        <td colSpan={2} className="text-end">JUMLAH</td>
                        <td className="text-end">{data.yuranGrandTotal.baki_awal === 0 ? '-' : formatCurrency(data.yuranGrandTotal.baki_awal)}</td>
                        <td className="text-end">{formatCurrency(data.yuranGrandTotal.terimaan)}</td>
                        <td className="text-end">{formatCurrency(data.yuranGrandTotal.belanja)}</td>
                        <td className="text-end">{formatCurrency(data.yuranGrandTotal.baki)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>

          {/* Table 3: Summary */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Ringkasan (Tahun Semasa vs Tahun Sebelumnya)</h6>
              <button
                className="btn btn-success btn-sm"
                onClick={handleAutoGenerateSummary}
                disabled={generatingSummary}
              >
                {generatingSummary ? <><span className="spinner-border spinner-border-sm me-1"></span>Menjana...</> : <><i className="bi bi-lightning-fill me-1"></i>Jana Ringkasan</>}
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
                      <th className="text-end" style={{ width: '140px' }}>Tahun Sebelumnya (RM)</th>
                      <th style={{ width: '70px' }}>Auto</th>
                      <th style={{ width: '70px' }}>Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.summaryData.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-muted">Tiada ringkasan. Klik &quot;Jana Ringkasan&quot; untuk menjana.</td></tr>
                    ) : (
                      data.summaryData.map((item, idx) => (
                        <tr key={item.id}>
                          <td>{idx + 1}</td>
                          <td>{item.perkara}</td>
                          <td className="text-end">{formatCurrency(item.jumlah_tahun_semasa)}</td>
                          <td className="text-end">{item.jumlah_tahun_sebelum === 0 ? '-' : formatCurrency(item.jumlah_tahun_sebelum)}</td>
                          <td className="text-center">
                            {item.auto_generated ? <span className="badge bg-info">Auto</span> : <span className="badge bg-secondary">Manual</span>}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => openEditSummaryModal(item)}><i className="bi bi-pencil"></i></button>
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
            <li><strong>Jadual 1:</strong> Data penerimaan hasil sewaan mengikut sub-kategori. Klik &quot;Jana Automatik&quot; untuk menjana dari transaksi.</li>
            <li><strong>Jadual 2:</strong> Yuran Penagajian dengan Baki Awal, Terimaan, Belanja. <strong>Baki dikira automatik</strong>.</li>
            <li><strong>Jadual 3:</strong> Ringkasan keseluruhan. Klik &quot;Jana Ringkasan&quot; untuk mengira dari Jadual 2.</li>
          </ul>
        </div>
      </div>

      {/* Main Modal */}
      {showMainModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingMain ? 'Edit' : 'Tambah'} Perkara</h5>
                <button type="button" className="btn-close" onClick={() => setShowMainModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Perkara *</label>
                  <select className="form-select" value={mainFormData.perkara} onChange={(e) => setMainFormData({ ...mainFormData, perkara: e.target.value })}>
                    {PERKARA_OPTIONS.map((opt, idx) => (<option key={idx} value={opt}>{opt}</option>))}
                  </select>
                </div>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Semasa (RM)</label>
                    <input type="number" step="0.01" className="form-control" value={mainFormData.jumlah_tahun_semasa} onChange={(e) => setMainFormData({ ...mainFormData, jumlah_tahun_semasa: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Sebelum (RM)</label>
                    <input type="number" step="0.01" className="form-control" value={mainFormData.jumlah_tahun_sebelum} onChange={(e) => setMainFormData({ ...mainFormData, jumlah_tahun_sebelum: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMainModal(false)}>Batal</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveMain} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yuran Modal */}
      {showYuranModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingYuran ? 'Edit' : 'Tambah'} Yuran Penagajian</h5>
                <button type="button" className="btn-close" onClick={() => setShowYuranModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Yuran Penagajian Dan Aktiviti *</label>
                  <select className="form-select" value={yuranFormData.yuran_aktiviti} onChange={(e) => setYuranFormData({ ...yuranFormData, yuran_aktiviti: e.target.value })}>
                    {PERKARA_OPTIONS.map((opt, idx) => (<option key={idx} value={opt}>{opt}</option>))}
                  </select>
                </div>
                <div className="row">
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Baki Awal (RM)</label>
                    <input type="number" step="0.01" className="form-control" value={yuranFormData.baki_awal} onChange={(e) => setYuranFormData({ ...yuranFormData, baki_awal: e.target.value })} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Terimaan (RM)</label>
                    <input type="number" step="0.01" className="form-control" value={yuranFormData.terimaan} onChange={(e) => setYuranFormData({ ...yuranFormData, terimaan: e.target.value })} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label className="form-label">Belanja (RM)</label>
                    <input type="number" step="0.01" className="form-control" value={yuranFormData.belanja} onChange={(e) => setYuranFormData({ ...yuranFormData, belanja: e.target.value })} />
                  </div>
                </div>
                <div className="alert alert-secondary">
                  <strong>Baki (dikira automatik):</strong> RM {formatCurrency(calculatedBaki())}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowYuranModal(false)}>Batal</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveYuran} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
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
                <h5 className="modal-title">Edit Ringkasan: {editingSummary.perkara}</h5>
                <button type="button" className="btn-close" onClick={() => setShowSummaryModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Semasa (RM)</label>
                    <input type="number" step="0.01" className="form-control" value={summaryFormData.jumlah_tahun_semasa} onChange={(e) => setSummaryFormData({ ...summaryFormData, jumlah_tahun_semasa: e.target.value })} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Tahun Sebelumnya (RM)</label>
                    <input type="number" step="0.01" className="form-control" value={summaryFormData.jumlah_tahun_sebelum} onChange={(e) => setSummaryFormData({ ...summaryFormData, jumlah_tahun_sebelum: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSummaryModal(false)}>Batal</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveSummary} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
