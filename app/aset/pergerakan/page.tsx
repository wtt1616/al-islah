'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Pergerakan {
  id: number;
  no_rujukan: string;
  jenis_pergerakan: string;
  jenis_aset: string;
  aset_id: number;
  no_siri_pendaftaran: string;
  keterangan_aset: string;
  nama_peminjam: string | null;
  tujuan_pinjaman: string | null;
  tarikh_permohonan: string;
  tarikh_mula: string;
  tarikh_dijangka_pulang: string | null;
  tarikh_sebenar_pulang: string | null;
  status: string;
  keadaan_semasa_keluar: string;
  nama_pemohon: string;
  lokasi_asal_nama: string | null;
  lokasi_tujuan_nama: string | null;
}

interface Summary {
  total: number;
  pindahan: number;
  pinjaman: number;
  aktif: number;
  tidak_dipulangkan: number;
}

interface Asset {
  jenis_aset: string;
  id: number;
  no_siri_pendaftaran: string;
  keterangan: string;
}

interface Lokasi {
  id: number;
  kod_lokasi: string;
  nama_lokasi: string;
}

const STATUS_COLORS: { [key: string]: string } = {
  'Permohonan': 'bg-secondary',
  'Diluluskan': 'bg-info',
  'Ditolak': 'bg-danger',
  'Dalam Pergerakan': 'bg-warning',
  'Dipulangkan': 'bg-success',
  'Tidak Dipulangkan': 'bg-dark'
};

export default function PergerakanAsetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState<Pergerakan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [lokasi, setLokasi] = useState<Lokasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    jenis_pergerakan: '',
    jenis_aset: '',
    aset_id: '',
    no_siri_pendaftaran: '',
    keterangan_aset: '',
    lokasi_asal_id: '',
    lokasi_tujuan_id: '',
    nama_peminjam: '',
    no_tel_peminjam: '',
    tujuan_pinjaman: '',
    tarikh_mula: new Date().toISOString().split('T')[0],
    tarikh_dijangka_pulang: '',
    keadaan_semasa_keluar: 'Baik',
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
      const [recordsRes, assetsRes, lokasiRes] = await Promise.all([
        fetch(`/api/aset/pergerakan?tahun=${filterTahun}`),
        fetch('/api/aset/senarai'),
        fetch('/api/aset/lokasi?aktif=true')
      ]);

      const recordsData = await recordsRes.json();
      const assetsData = await assetsRes.json();
      const lokasiData = await lokasiRes.json();

      setRecords(recordsData.data || []);
      setSummary(recordsData.summary || null);
      setAssets(assetsData.data || []);
      setLokasi(lokasiData.data || []);
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
        no_siri_pendaftaran: asset.no_siri_pendaftaran,
        keterangan_aset: asset.keterangan
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/aset/pergerakan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          aset_id: parseInt(formData.aset_id),
          lokasi_asal_id: formData.lokasi_asal_id ? parseInt(formData.lokasi_asal_id) : null,
          lokasi_tujuan_id: formData.lokasi_tujuan_id ? parseInt(formData.lokasi_tujuan_id) : null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan permohonan');
        return;
      }

      alert(`Permohonan berjaya dihantar.\nNo. Rujukan: ${data.no_rujukan}`);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Ralat menyimpan permohonan');
    }
  };

  const handleApprove = async (record: Pergerakan) => {
    if (!confirm('Luluskan permohonan ini?')) return;

    try {
      const res = await fetch('/api/aset/pergerakan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          status: 'Dalam Pergerakan',
          tarikh_kelulusan: new Date().toISOString().split('T')[0],
          jenis_aset: record.jenis_aset,
          aset_id: record.aset_id
        })
      });

      if (res.ok) {
        alert('Permohonan diluluskan');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReturn = async (record: Pergerakan) => {
    const keadaan = prompt('Keadaan semasa pulang (Baik/Rosak Ringan/Rosak Teruk/Hilang):', 'Baik');
    if (!keadaan) return;

    try {
      const res = await fetch('/api/aset/pergerakan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          status: 'Dipulangkan',
          tarikh_sebenar_pulang: new Date().toISOString().split('T')[0],
          keadaan_semasa_pulang: keadaan,
          jenis_aset: record.jenis_aset,
          aset_id: record.aset_id
        })
      });

      if (res.ok) {
        alert('Aset telah dipulangkan');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      jenis_pergerakan: '',
      jenis_aset: '',
      aset_id: '',
      no_siri_pendaftaran: '',
      keterangan_aset: '',
      lokasi_asal_id: '',
      lokasi_tujuan_id: '',
      nama_peminjam: '',
      no_tel_peminjam: '',
      tujuan_pinjaman: '',
      tarikh_mula: new Date().toISOString().split('T')[0],
      tarikh_dijangka_pulang: '',
      keadaan_semasa_keluar: 'Baik',
      catatan: ''
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
                <li className="breadcrumb-item active">Pergerakan/Pinjaman</li>
              </ol>
            </nav>
            <h4 className="mb-0" style={{ color: '#8B0000' }}>
              <i className="bi bi-arrow-left-right me-2"></i>
              Pergerakan/Pinjaman Aset (BR-AMS 004)
            </h4>
          </div>
          <button
            className="btn btn-info text-white"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Permohonan Baru
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="row mb-4">
            <div className="col-md-2 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <h6 className="text-muted mb-1">Jumlah</h6>
                  <h3 className="mb-0">{summary.total}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-2 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <h6 className="text-muted mb-1">Pindahan</h6>
                  <h3 className="mb-0 text-primary">{summary.pindahan}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-2 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <h6 className="text-muted mb-1">Pinjaman</h6>
                  <h3 className="mb-0 text-info">{summary.pinjaman}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-warning">
                <div className="card-body text-center">
                  <h6 className="mb-1">Dalam Pergerakan</h6>
                  <h3 className="mb-0">{summary.aktif}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-danger text-white">
                <div className="card-body text-center">
                  <h6 className="mb-1">Tidak Dipulangkan</h6>
                  <h3 className="mb-0">{summary.tidak_dipulangkan}</h3>
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
                    <th>No. Rujukan</th>
                    <th>Jenis</th>
                    <th>Aset</th>
                    <th>Dari/Kepada</th>
                    <th>Tarikh</th>
                    <th>Status</th>
                    <th className="text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Tiada rekod pergerakan
                      </td>
                    </tr>
                  ) : (
                    records.map(item => (
                      <tr key={item.id}>
                        <td><code>{item.no_rujukan}</code></td>
                        <td>
                          <span className={`badge ${item.jenis_pergerakan === 'Pindahan' ? 'bg-primary' : 'bg-info'}`}>
                            {item.jenis_pergerakan}
                          </span>
                        </td>
                        <td>
                          <code className="small">{item.no_siri_pendaftaran}</code>
                          <div className="small text-muted">{item.keterangan_aset}</div>
                        </td>
                        <td>
                          {item.jenis_pergerakan === 'Pindahan' ? (
                            <>
                              <div className="small">{item.lokasi_asal_nama || '-'}</div>
                              <i className="bi bi-arrow-right text-muted"></i>
                              <div className="small">{item.lokasi_tujuan_nama || '-'}</div>
                            </>
                          ) : (
                            <div className="small">{item.nama_peminjam}</div>
                          )}
                        </td>
                        <td>
                          <div className="small">{new Date(item.tarikh_mula).toLocaleDateString('ms-MY')}</div>
                          {item.tarikh_dijangka_pulang && (
                            <div className="small text-muted">
                              Dijangka: {new Date(item.tarikh_dijangka_pulang).toLocaleDateString('ms-MY')}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            {item.status === 'Permohonan' && (
                              <button
                                className="btn btn-outline-success"
                                onClick={() => handleApprove(item)}
                                title="Luluskan"
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                            )}
                            {item.status === 'Dalam Pergerakan' && item.jenis_pergerakan === 'Pinjaman' && (
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleReturn(item)}
                                title="Rekod Pulangan"
                              >
                                <i className="bi bi-box-arrow-in-left"></i>
                              </button>
                            )}
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

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Permohonan Pergerakan/Pinjaman Aset</h5>
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
                      <label className="form-label">Jenis Pergerakan <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.jenis_pergerakan}
                        onChange={(e) => setFormData({ ...formData, jenis_pergerakan: e.target.value })}
                        required
                      >
                        <option value="">-- Pilih --</option>
                        <option value="Pindahan">Pindahan (Kekal)</option>
                        <option value="Pinjaman">Pinjaman (Sementara)</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tarikh Mula <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tarikh_mula}
                        onChange={(e) => setFormData({ ...formData, tarikh_mula: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
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

                    {formData.jenis_pergerakan === 'Pindahan' && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">Lokasi Asal</label>
                          <select
                            className="form-select"
                            value={formData.lokasi_asal_id}
                            onChange={(e) => setFormData({ ...formData, lokasi_asal_id: e.target.value })}
                          >
                            <option value="">-- Pilih --</option>
                            {lokasi.map(l => (
                              <option key={l.id} value={l.id}>{l.kod_lokasi} - {l.nama_lokasi}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Lokasi Tujuan <span className="text-danger">*</span></label>
                          <select
                            className="form-select"
                            value={formData.lokasi_tujuan_id}
                            onChange={(e) => setFormData({ ...formData, lokasi_tujuan_id: e.target.value })}
                            required={formData.jenis_pergerakan === 'Pindahan'}
                          >
                            <option value="">-- Pilih --</option>
                            {lokasi.map(l => (
                              <option key={l.id} value={l.id}>{l.kod_lokasi} - {l.nama_lokasi}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {formData.jenis_pergerakan === 'Pinjaman' && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">Nama Peminjam <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.nama_peminjam}
                            onChange={(e) => setFormData({ ...formData, nama_peminjam: e.target.value })}
                            required={formData.jenis_pergerakan === 'Pinjaman'}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">No. Telefon Peminjam</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.no_tel_peminjam}
                            onChange={(e) => setFormData({ ...formData, no_tel_peminjam: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Tujuan Pinjaman</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.tujuan_pinjaman}
                            onChange={(e) => setFormData({ ...formData, tujuan_pinjaman: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Tarikh Dijangka Pulang</label>
                          <input
                            type="date"
                            className="form-control"
                            value={formData.tarikh_dijangka_pulang}
                            onChange={(e) => setFormData({ ...formData, tarikh_dijangka_pulang: e.target.value })}
                          />
                        </div>
                      </>
                    )}

                    <div className="col-md-6">
                      <label className="form-label">Keadaan Semasa</label>
                      <select
                        className="form-select"
                        value={formData.keadaan_semasa_keluar}
                        onChange={(e) => setFormData({ ...formData, keadaan_semasa_keluar: e.target.value })}
                      >
                        <option value="Baik">Baik</option>
                        <option value="Rosak Ringan">Rosak Ringan</option>
                        <option value="Rosak Teruk">Rosak Teruk</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Catatan</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.catatan}
                        onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
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
                  <button type="submit" className="btn btn-info text-white">
                    <i className="bi bi-send me-1"></i>Hantar Permohonan
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
