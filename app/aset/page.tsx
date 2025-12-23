'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface AssetStats {
  total_harta_modal: number;
  total_inventori: number;
  nilai_harta_modal: number;
  nilai_inventori: number;
  rosak_harta_modal: number;
  rosak_inventori: number;
}

interface Asset {
  jenis_aset: string;
  id: number;
  no_siri_pendaftaran: string;
  keterangan: string;
  kategori: string | null;
  jenama: string | null;
  model: string | null;
  harga_asal: number;
  status: string | null;
  nama_lokasi: string | null;
  created_at: string;
}

interface Lokasi {
  id: number;
  kod_lokasi: string;
  nama_lokasi: string;
}

interface Kategori {
  id: number;
  kod_kategori: string;
  nama_kategori: string;
  jenis_aset: 'Harta Modal' | 'Inventori' | 'Kedua-dua';
}

const STATUS_COLORS: { [key: string]: string } = {
  'Sedang Digunakan': 'bg-success',
  'Tidak Digunakan': 'bg-secondary',
  'Rosak': 'bg-danger',
  'Sedang Diselenggara': 'bg-warning',
  'Hilang': 'bg-dark',
  'Dilupuskan': 'bg-info'
};

export default function PengurusanAsetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<AssetStats | null>(null);
  const [lokasi, setLokasi] = useState<Lokasi[]>([]);
  const [kategori, setKategori] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterJenis, setFilterJenis] = useState('all');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterLokasi, setFilterLokasi] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    jenis_aset: 'Harta Modal',
    keterangan: '',
    kategori: '',
    sub_kategori: '',
    jenama: '',
    model: '',
    no_siri_pembuat: '',
    tarikh_terima: '',
    harga_asal: '',
    cara_diperolehi: '',
    lokasi_id: '',
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
  }, [status, session, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch assets, lokasi, and kategori in parallel
      const [assetsRes, lokasiRes, kategoriRes] = await Promise.all([
        fetch('/api/aset/senarai'),
        fetch('/api/aset/lokasi?aktif=true'),
        fetch('/api/aset/kategori?aktif=true')
      ]);

      const assetsData = await assetsRes.json();
      const lokasiData = await lokasiRes.json();
      const kategoriData = await kategoriRes.json();

      setAssets(assetsData.data || []);
      setStats(assetsData.stats || null);
      setLokasi(lokasiData.data || []);
      setKategori(kategoriData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/aset/senarai';
      const method = editingAsset ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        id: editingAsset?.id,
        harga_asal: parseFloat(formData.harga_asal) || 0,
        lokasi_id: formData.lokasi_id ? parseInt(formData.lokasi_id) : null
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan aset');
        return;
      }

      alert(editingAsset ? 'Aset berjaya dikemaskini' : `Aset berjaya didaftarkan. No. Siri: ${data.no_siri_pendaftaran}`);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving asset:', error);
      alert('Ralat menyimpan aset');
    }
  };

  const resetForm = () => {
    setFormData({
      jenis_aset: 'Harta Modal',
      keterangan: '',
      kategori: '',
      sub_kategori: '',
      jenama: '',
      model: '',
      no_siri_pembuat: '',
      tarikh_terima: '',
      harga_asal: '',
      cara_diperolehi: '',
      lokasi_id: '',
      catatan: ''
    });
    setEditingAsset(null);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      jenis_aset: asset.jenis_aset,
      keterangan: asset.keterangan || '',
      kategori: asset.kategori || '',
      sub_kategori: '',
      jenama: asset.jenama || '',
      model: asset.model || '',
      no_siri_pembuat: '',
      tarikh_terima: '',
      harga_asal: asset.harga_asal?.toString() || '',
      cara_diperolehi: '',
      lokasi_id: '',
      catatan: ''
    });
    setShowModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    if (filterJenis !== 'all' && asset.jenis_aset !== filterJenis) return false;
    if (filterStatus && asset.status !== filterStatus) return false;
    if (filterKategori && asset.kategori !== filterKategori) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        asset.no_siri_pendaftaran.toLowerCase().includes(search) ||
        asset.keterangan.toLowerCase().includes(search) ||
        asset.jenama?.toLowerCase().includes(search)
      );
    }
    return true;
  });

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

      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1" style={{ color: '#8B0000' }}>
              <i className="bi bi-box-seam me-2"></i>
              Pengurusan Aset
            </h3>
            <small className="text-muted">Sistem Pengurusan Aset Alih Surau</small>
          </div>
          <button
            className="btn btn-success"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Daftar Aset Baru
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="row mb-4">
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="text-muted mb-1">Harta Modal</h6>
                      <h3 className="mb-0">{stats.total_harta_modal}</h3>
                      <small className="text-success">{formatCurrency(stats.nilai_harta_modal)}</small>
                    </div>
                    <div className="bg-primary bg-opacity-10 rounded p-3">
                      <i className="bi bi-building text-primary fs-4"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="text-muted mb-1">Inventori</h6>
                      <h3 className="mb-0">{stats.total_inventori}</h3>
                      <small className="text-success">{formatCurrency(stats.nilai_inventori)}</small>
                    </div>
                    <div className="bg-info bg-opacity-10 rounded p-3">
                      <i className="bi bi-box text-info fs-4"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="text-muted mb-1">Jumlah Aset</h6>
                      <h3 className="mb-0">{stats.total_harta_modal + stats.total_inventori}</h3>
                      <small className="text-success">{formatCurrency(stats.nilai_harta_modal + stats.nilai_inventori)}</small>
                    </div>
                    <div className="bg-success bg-opacity-10 rounded p-3">
                      <i className="bi bi-calculator text-success fs-4"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="text-muted mb-1">Aset Rosak</h6>
                      <h3 className="mb-0 text-danger">{stats.rosak_harta_modal + stats.rosak_inventori}</h3>
                      <small className="text-muted">Perlu tindakan</small>
                    </div>
                    <div className="bg-danger bg-opacity-10 rounded p-3">
                      <i className="bi bi-exclamation-triangle text-danger fs-4"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <h6 className="mb-3">Tindakan Pantas</h6>
            <div className="d-flex flex-wrap gap-2">
              <a href="/aset/pemeriksaan" className="btn btn-outline-primary btn-sm">
                <i className="bi bi-clipboard-check me-1"></i>Pemeriksaan
              </a>
              <a href="/aset/penyelenggaraan" className="btn btn-outline-warning btn-sm">
                <i className="bi bi-tools me-1"></i>Penyelenggaraan
              </a>
              <a href="/aset/pergerakan" className="btn btn-outline-info btn-sm">
                <i className="bi bi-arrow-left-right me-1"></i>Pergerakan/Pinjaman
              </a>
              <a href="/aset/pelupusan" className="btn btn-outline-danger btn-sm">
                <i className="bi bi-trash me-1"></i>Pelupusan
              </a>
              <a href="/aset/kehilangan" className="btn btn-outline-dark btn-sm">
                <i className="bi bi-search me-1"></i>Kehilangan
              </a>
              <a href="/aset/lokasi" className="btn btn-outline-secondary btn-sm">
                <i className="bi bi-geo-alt me-1"></i>Lokasi Aset
              </a>
              <a href="/aset/laporan" className="btn btn-outline-success btn-sm">
                <i className="bi bi-file-earmark-text me-1"></i>Laporan BR-AMS
              </a>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small">Jenis Aset</label>
                <select
                  className="form-select form-select-sm"
                  value={filterJenis}
                  onChange={(e) => setFilterJenis(e.target.value)}
                >
                  <option value="all">Semua</option>
                  <option value="Harta Modal">Harta Modal</option>
                  <option value="Inventori">Inventori</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small">Status</label>
                <select
                  className="form-select form-select-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">Semua</option>
                  <option value="Sedang Digunakan">Sedang Digunakan</option>
                  <option value="Tidak Digunakan">Tidak Digunakan</option>
                  <option value="Rosak">Rosak</option>
                  <option value="Sedang Diselenggara">Sedang Diselenggara</option>
                  <option value="Hilang">Hilang</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small">Kategori</label>
                <select
                  className="form-select form-select-sm"
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                >
                  <option value="">Semua</option>
                  {kategori.map(k => (
                    <option key={k.id} value={k.nama_kategori}>{k.nama_kategori}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small">Carian</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="No. Siri / Keterangan / Jenama"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-2 d-flex align-items-end">
                <button
                  className="btn btn-outline-secondary btn-sm w-100"
                  onClick={() => {
                    setFilterJenis('all');
                    setFilterStatus('');
                    setFilterLokasi('');
                    setFilterKategori('');
                    setSearchTerm('');
                  }}
                >
                  <i className="bi bi-x-lg me-1"></i>Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Asset List */}
        <div className="card border-0 shadow-sm">
          <div className="card-header bg-white py-3">
            <h6 className="mb-0">
              Senarai Aset ({filteredAssets.length})
            </h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>No. Siri</th>
                    <th>Jenis</th>
                    <th>Keterangan</th>
                    <th>Kategori</th>
                    <th>Lokasi</th>
                    <th className="text-end">Harga (RM)</th>
                    <th>Status</th>
                    <th className="text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4 text-muted">
                        Tiada aset dijumpai
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map(asset => (
                      <tr key={`${asset.jenis_aset}-${asset.id}`}>
                        <td>
                          <code className="small">{asset.no_siri_pendaftaran}</code>
                        </td>
                        <td>
                          <span className={`badge ${asset.jenis_aset === 'Harta Modal' ? 'bg-primary' : 'bg-info'}`}>
                            {asset.jenis_aset === 'Harta Modal' ? 'HM' : 'INV'}
                          </span>
                        </td>
                        <td>
                          <div>{asset.keterangan}</div>
                          {asset.jenama && (
                            <small className="text-muted">{asset.jenama} {asset.model}</small>
                          )}
                        </td>
                        <td>{asset.kategori || '-'}</td>
                        <td>{asset.nama_lokasi || '-'}</td>
                        <td className="text-end">
                          {asset.harga_asal?.toLocaleString('ms-MY', { minimumFractionDigits: 2 }) || '0.00'}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_COLORS[asset.status || ''] || 'bg-secondary'}`}>
                            {asset.status || 'Tidak Diketahui'}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEdit(asset)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-outline-info"
                              title="Lihat Sejarah"
                            >
                              <i className="bi bi-clock-history"></i>
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
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingAsset ? 'Kemaskini Aset' : 'Daftar Aset Baru'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => { setShowModal(false); resetForm(); }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Jenis Aset <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.jenis_aset}
                        onChange={(e) => setFormData({ ...formData, jenis_aset: e.target.value })}
                        disabled={!!editingAsset}
                        required
                      >
                        <option value="Harta Modal">Harta Modal (≥ RM2,000)</option>
                        <option value="Inventori">Inventori (RM100 - RM1,999.99)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Kategori</label>
                      <select
                        className="form-select"
                        value={formData.kategori}
                        onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                      >
                        <option value="">-- Pilih Kategori --</option>
                        {kategori
                          .filter(k => k.jenis_aset === 'Kedua-dua' || k.jenis_aset === formData.jenis_aset)
                          .map(k => (
                            <option key={k.id} value={k.nama_kategori}>{k.nama_kategori}</option>
                          ))}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Keterangan <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.keterangan}
                        onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                        placeholder="Contoh: Komputer Desktop Dell OptiPlex 7090"
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Jenama</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.jenama}
                        onChange={(e) => setFormData({ ...formData, jenama: e.target.value })}
                        placeholder="Contoh: Dell, HP, Samsung"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Model</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="Contoh: OptiPlex 7090"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">No. Siri Pembuat</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.no_siri_pembuat}
                        onChange={(e) => setFormData({ ...formData, no_siri_pembuat: e.target.value })}
                        placeholder="Nombor siri dari pengeluar"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Tarikh Terima</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tarikh_terima}
                        onChange={(e) => setFormData({ ...formData, tarikh_terima: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Harga Asal (RM) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.harga_asal}
                        onChange={(e) => setFormData({ ...formData, harga_asal: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Cara Diperolehi <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.cara_diperolehi}
                        onChange={(e) => setFormData({ ...formData, cara_diperolehi: e.target.value })}
                        required
                      >
                        <option value="">-- Pilih --</option>
                        <option value="Pembelian">Pembelian</option>
                        <option value="Sumbangan">Sumbangan</option>
                        <option value="Hadiah">Hadiah</option>
                        <option value="Pindahan">Pindahan</option>
                        <option value="Lain-lain">Lain-lain</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Lokasi</label>
                      <select
                        className="form-select"
                        value={formData.lokasi_id}
                        onChange={(e) => setFormData({ ...formData, lokasi_id: e.target.value })}
                      >
                        <option value="">-- Pilih Lokasi --</option>
                        {lokasi.map(l => (
                          <option key={l.id} value={l.id}>{l.kod_lokasi} - {l.nama_lokasi}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Catatan</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.catatan}
                        onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                        placeholder="Catatan tambahan (jika ada)"
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
                    <i className="bi bi-check-lg me-1"></i>
                    {editingAsset ? 'Kemaskini' : 'Daftar'}
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
