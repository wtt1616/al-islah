'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Penyelenggaraan {
  id: number;
  jenis_aset: string;
  aset_id: number;
  no_siri_pendaftaran: string;
  tarikh_penyelenggaraan: string;
  jenis_penyelenggaraan: string;
  keterangan_kerja: string;
  nama_kontraktor: string | null;
  kos: number;
  tarikh_siap: string | null;
  status: string;
  nama_pelaksana: string;
  keterangan_aset: string;
}

interface Summary {
  total: number;
  selesai: number;
  dalam_proses: number;
  jumlah_kos: number;
}

interface Asset {
  jenis_aset: string;
  id: number;
  no_siri_pendaftaran: string;
  keterangan: string;
}

const STATUS_COLORS: { [key: string]: string } = {
  'Dirancang': 'bg-secondary',
  'Dalam Proses': 'bg-warning',
  'Selesai': 'bg-success',
  'Dibatalkan': 'bg-danger'
};

export default function PenyelenggaraanAsetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState<Penyelenggaraan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    jenis_aset: '',
    aset_id: '',
    no_siri_pendaftaran: '',
    tarikh_penyelenggaraan: new Date().toISOString().split('T')[0],
    jenis_penyelenggaraan: '',
    keterangan_kerja: '',
    nama_kontraktor: '',
    no_tel_kontraktor: '',
    kos: '',
    no_resit: '',
    catatan: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      const userRole = (session?.user as any)?.role;
      if (!['admin', 'inventory_staff'].includes(userRole)) {
        router.push('/dashboard');
      } else {
        fetchData();
      }
    }
  }, [status, session, router, filterTahun]);

  const fetchData = async () => {
    try {
      const [recordsRes, assetsRes] = await Promise.all([
        fetch(`/api/aset/penyelenggaraan?tahun=${filterTahun}`),
        fetch('/api/aset/senarai')
      ]);

      const recordsData = await recordsRes.json();
      const assetsData = await assetsRes.json();

      setRecords(recordsData.data || []);
      setSummary(recordsData.summary || null);
      setAssets(assetsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssetSelect = (assetKey: string) => {
    const [jenisAset, id] = assetKey.split('-');
    const asset = assets.find(a => a.jenis_aset === jenisAset && a.id === parseInt(id));
    if (asset) {
      setFormData({
        ...formData,
        jenis_aset: asset.jenis_aset,
        aset_id: asset.id.toString(),
        no_siri_pendaftaran: asset.no_siri_pendaftaran
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/aset/penyelenggaraan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          aset_id: parseInt(formData.aset_id),
          kos: parseFloat(formData.kos) || 0
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan rekod');
        return;
      }

      alert('Rekod penyelenggaraan berjaya ditambah');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Ralat menyimpan rekod');
    }
  };

  const handleComplete = async (record: Penyelenggaraan) => {
    const tarikhSiap = prompt('Tarikh siap (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!tarikhSiap) return;

    try {
      const res = await fetch('/api/aset/penyelenggaraan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          tarikh_siap: tarikhSiap,
          status: 'Selesai',
          jenis_aset: record.jenis_aset,
          aset_id: record.aset_id
        })
      });

      if (res.ok) {
        alert('Penyelenggaraan telah ditandakan selesai');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      jenis_aset: '',
      aset_id: '',
      no_siri_pendaftaran: '',
      tarikh_penyelenggaraan: new Date().toISOString().split('T')[0],
      jenis_penyelenggaraan: '',
      keterangan_kerja: '',
      nama_kontraktor: '',
      no_tel_kontraktor: '',
      kos: '',
      no_resit: '',
      catatan: ''
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
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
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item"><a href="/aset">Pengurusan Aset</a></li>
                <li className="breadcrumb-item active">Penyelenggaraan</li>
              </ol>
            </nav>
            <h4 className="mb-0" style={{ color: '#8B0000' }}>
              <i className="bi bi-tools me-2"></i>
              Penyelenggaraan Aset (BR-AMS 006)
            </h4>
          </div>
          <button
            className="btn btn-success"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Rekod Penyelenggaraan
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="row mb-4">
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-primary text-white">
                <div className="card-body">
                  <h6 className="mb-1">Jumlah Rekod</h6>
                  <h3 className="mb-0">{summary.total}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-warning">
                <div className="card-body">
                  <h6 className="mb-1">Dalam Proses</h6>
                  <h3 className="mb-0">{summary.dalam_proses}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-success text-white">
                <div className="card-body">
                  <h6 className="mb-1">Selesai</h6>
                  <h3 className="mb-0">{summary.selesai}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-info text-white">
                <div className="card-body">
                  <h6 className="mb-1">Jumlah Kos</h6>
                  <h3 className="mb-0">{formatCurrency(summary.jumlah_kos)}</h3>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body py-2">
            <div className="row align-items-center">
              <div className="col-auto">
                <label className="form-label mb-0 small">Tahun:</label>
              </div>
              <div className="col-auto">
                <select
                  className="form-select form-select-sm"
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                >
                  {[...Array(5)].map((_, i) => {
                    const year = new Date().getFullYear() - i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="card border-0 shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Tarikh</th>
                    <th>Aset</th>
                    <th>Jenis</th>
                    <th>Keterangan Kerja</th>
                    <th>Kontraktor</th>
                    <th className="text-end">Kos (RM)</th>
                    <th>Status</th>
                    <th className="text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        Tiada rekod penyelenggaraan
                      </td>
                    </tr>
                  ) : (
                    records.map(item => (
                      <tr key={item.id}>
                        <td>{new Date(item.tarikh_penyelenggaraan).toLocaleDateString('ms-MY')}</td>
                        <td>
                          <code className="small">{item.no_siri_pendaftaran}</code>
                          <div className="small text-muted">{item.keterangan_aset}</div>
                        </td>
                        <td><span className="badge bg-secondary">{item.jenis_penyelenggaraan}</span></td>
                        <td className="small">{item.keterangan_kerja}</td>
                        <td>{item.nama_kontraktor || '-'}</td>
                        <td className="text-end">{item.kos.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={`badge ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                        </td>
                        <td className="text-center">
                          {item.status === 'Dalam Proses' && (
                            <button
                              className="btn btn-sm btn-outline-success"
                              onClick={() => handleComplete(item)}
                              title="Tandakan Selesai"
                            >
                              <i className="bi bi-check-lg"></i>
                            </button>
                          )}
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

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Rekod Penyelenggaraan Aset</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => { setShowModal(false); resetForm(); }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label">Tarikh <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tarikh_penyelenggaraan}
                        onChange={(e) => setFormData({ ...formData, tarikh_penyelenggaraan: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Pilih Aset <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.jenis_aset && formData.aset_id ? `${formData.jenis_aset}-${formData.aset_id}` : ''}
                        onChange={(e) => handleAssetSelect(e.target.value)}
                        required
                      >
                        <option value="">-- Pilih Aset --</option>
                        <optgroup label="Harta Modal">
                          {assets.filter(a => a.jenis_aset === 'Harta Modal').map(a => (
                            <option key={`HM-${a.id}`} value={`Harta Modal-${a.id}`}>
                              {a.no_siri_pendaftaran} - {a.keterangan}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Inventori">
                          {assets.filter(a => a.jenis_aset === 'Inventori').map(a => (
                            <option key={`I-${a.id}`} value={`Inventori-${a.id}`}>
                              {a.no_siri_pendaftaran} - {a.keterangan}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Jenis Penyelenggaraan <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.jenis_penyelenggaraan}
                        onChange={(e) => setFormData({ ...formData, jenis_penyelenggaraan: e.target.value })}
                        required
                      >
                        <option value="">-- Pilih --</option>
                        <option value="Pembaikan">Pembaikan</option>
                        <option value="Servis Berkala">Servis Berkala</option>
                        <option value="Penggantian Komponen">Penggantian Komponen</option>
                        <option value="Naik Taraf">Naik Taraf</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Kos (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.kos}
                        onChange={(e) => setFormData({ ...formData, kos: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Keterangan Kerja <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.keterangan_kerja}
                        onChange={(e) => setFormData({ ...formData, keterangan_kerja: e.target.value })}
                        placeholder="Nyatakan kerja penyelenggaraan yang dilakukan"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Nama Kontraktor/Syarikat</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.nama_kontraktor}
                        onChange={(e) => setFormData({ ...formData, nama_kontraktor: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">No. Telefon Kontraktor</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.no_tel_kontraktor}
                        onChange={(e) => setFormData({ ...formData, no_tel_kontraktor: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">No. Resit/Invois</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.no_resit}
                        onChange={(e) => setFormData({ ...formData, no_resit: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setShowModal(false); resetForm(); }}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-success">
                    <i className="bi bi-check-lg me-1"></i>Simpan
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
