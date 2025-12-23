'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Pemeriksaan {
  id: number;
  tarikh_pemeriksaan: string;
  jenis_aset: string;
  aset_id: number;
  no_siri_pendaftaran: string;
  keadaan: string;
  catatan: string | null;
  tindakan_diperlukan: string | null;
  nama_pemeriksa: string;
  nama_pengesah: string | null;
  tarikh_pengesahan: string | null;
  status_tindakan: string;
  keterangan_aset: string;
}

interface Asset {
  jenis_aset: string;
  id: number;
  no_siri_pendaftaran: string;
  keterangan: string;
}

const KEADAAN_COLORS: { [key: string]: string } = {
  'Baik': 'bg-success',
  'Rosak Ringan': 'bg-warning',
  'Rosak Teruk': 'bg-danger',
  'Hilang': 'bg-dark',
  'Tidak Dijumpai': 'bg-secondary'
};

export default function PemeriksaanAsetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [pemeriksaan, setPemeriksaan] = useState<Pemeriksaan[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    tarikh_pemeriksaan: new Date().toISOString().split('T')[0],
    jenis_aset: '',
    aset_id: '',
    no_siri_pendaftaran: '',
    keadaan: '',
    catatan: '',
    tindakan_diperlukan: ''
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
      const [pemeriksaanRes, assetsRes] = await Promise.all([
        fetch(`/api/aset/pemeriksaan?tahun=${filterTahun}`),
        fetch('/api/aset/senarai')
      ]);

      const pemeriksaanData = await pemeriksaanRes.json();
      const assetsData = await assetsRes.json();

      setPemeriksaan(pemeriksaanData.data || []);
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
      const res = await fetch('/api/aset/pemeriksaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          aset_id: parseInt(formData.aset_id)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan rekod pemeriksaan');
        return;
      }

      alert('Rekod pemeriksaan berjaya ditambah');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving pemeriksaan:', error);
      alert('Ralat menyimpan rekod');
    }
  };

  const resetForm = () => {
    setFormData({
      tarikh_pemeriksaan: new Date().toISOString().split('T')[0],
      jenis_aset: '',
      aset_id: '',
      no_siri_pendaftaran: '',
      keadaan: '',
      catatan: '',
      tindakan_diperlukan: ''
    });
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
                <li className="breadcrumb-item active">Pemeriksaan Aset</li>
              </ol>
            </nav>
            <h4 className="mb-0" style={{ color: '#8B0000' }}>
              <i className="bi bi-clipboard-check me-2"></i>
              Pemeriksaan Aset (BR-AMS 005)
            </h4>
          </div>
          <button
            className="btn btn-success"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Rekod Pemeriksaan
          </button>
        </div>

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
                    <th>No. Siri</th>
                    <th>Aset</th>
                    <th>Keadaan</th>
                    <th>Tindakan</th>
                    <th>Pemeriksa</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pemeriksaan.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Tiada rekod pemeriksaan
                      </td>
                    </tr>
                  ) : (
                    pemeriksaan.map(item => (
                      <tr key={item.id}>
                        <td>{new Date(item.tarikh_pemeriksaan).toLocaleDateString('ms-MY')}</td>
                        <td><code className="small">{item.no_siri_pendaftaran}</code></td>
                        <td>
                          <span className={`badge ${item.jenis_aset === 'Harta Modal' ? 'bg-primary' : 'bg-info'} me-1`}>
                            {item.jenis_aset === 'Harta Modal' ? 'HM' : 'I'}
                          </span>
                          {item.keterangan_aset}
                        </td>
                        <td>
                          <span className={`badge ${KEADAAN_COLORS[item.keadaan]}`}>
                            {item.keadaan}
                          </span>
                        </td>
                        <td className="small">{item.tindakan_diperlukan || '-'}</td>
                        <td>{item.nama_pemeriksa}</td>
                        <td>
                          <span className={`badge ${
                            item.status_tindakan === 'Selesai' ? 'bg-success' :
                            item.status_tindakan === 'Sedang Dijalankan' ? 'bg-warning' : 'bg-secondary'
                          }`}>
                            {item.status_tindakan}
                          </span>
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
                <h5 className="modal-title">Rekod Pemeriksaan Aset</h5>
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
                      <label className="form-label">Tarikh Pemeriksaan <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tarikh_pemeriksaan}
                        onChange={(e) => setFormData({ ...formData, tarikh_pemeriksaan: e.target.value })}
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
                      <label className="form-label">Keadaan <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.keadaan}
                        onChange={(e) => setFormData({ ...formData, keadaan: e.target.value })}
                        required
                      >
                        <option value="">-- Pilih Keadaan --</option>
                        <option value="Baik">Baik</option>
                        <option value="Rosak Ringan">Rosak Ringan</option>
                        <option value="Rosak Teruk">Rosak Teruk</option>
                        <option value="Hilang">Hilang</option>
                        <option value="Tidak Dijumpai">Tidak Dijumpai</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Catatan Pemeriksaan</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.catatan}
                        onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Tindakan Diperlukan</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.tindakan_diperlukan}
                        onChange={(e) => setFormData({ ...formData, tindakan_diperlukan: e.target.value })}
                        placeholder="Nyatakan tindakan yang perlu diambil (jika ada)"
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
