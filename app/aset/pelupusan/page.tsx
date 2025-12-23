'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Pelupusan {
  id: number;
  no_rujukan: string;
  jenis_aset: string;
  aset_id: number;
  no_siri_pendaftaran: string;
  keterangan_aset: string;
  harga_asal: number;
  nilai_semasa: number;
  tarikh_permohonan: string;
  sebab_pelupusan: string;
  kaedah_pelupusan: string;
  status: string;
  tarikh_kelulusan: string | null;
  nama_pemohon: string;
  nama_pelulus: string | null;
}

interface Summary {
  total: number;
  selesai: number;
  menunggu: number;
  nilai_dilupuskan: number;
}

interface Asset {
  jenis_aset: string;
  id: number;
  no_siri_pendaftaran: string;
  keterangan: string;
  harga_asal: number;
}

const STATUS_COLORS: { [key: string]: string } = {
  'Permohonan': 'bg-secondary',
  'Dalam Semakan': 'bg-warning',
  'Diluluskan': 'bg-info',
  'Ditolak': 'bg-danger',
  'Selesai': 'bg-success'
};

export default function PelupusanAsetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState<Pelupusan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    jenis_aset: '',
    aset_id: '',
    no_siri_pendaftaran: '',
    keterangan_aset: '',
    harga_asal: '',
    nilai_semasa: '',
    sebab_pelupusan: '',
    kaedah_pelupusan: '',
    nama_penerima: '',
    alamat_penerima: '',
    catatan: ''
  });

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
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
        fetch(`/api/aset/pelupusan?tahun=${filterTahun}`),
        fetch('/api/aset/senarai')
      ]);

      const recordsData = await recordsRes.json();
      const assetsData = await assetsRes.json();

      setRecords(recordsData.data || []);
      setSummary(recordsData.summary || null);
      // Only show assets that are not already disposed
      setAssets((assetsData.data || []).filter((a: Asset) => !a.no_siri_pendaftaran.includes('Dilupuskan')));
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
        keterangan_aset: asset.keterangan,
        harga_asal: asset.harga_asal.toString(),
        nilai_semasa: asset.harga_asal.toString() // Default to original price
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/aset/pelupusan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          aset_id: parseInt(formData.aset_id),
          harga_asal: parseFloat(formData.harga_asal) || 0,
          nilai_semasa: parseFloat(formData.nilai_semasa) || 0
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || 'Gagal menyimpan permohonan');
        return;
      }

      alert(`Permohonan pelupusan berjaya dihantar.\nNo. Rujukan: ${data.no_rujukan}`);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Ralat menyimpan permohonan');
    }
  };

  const handleApprove = async (record: Pelupusan, approve: boolean) => {
    if (!confirm(approve ? 'Luluskan permohonan ini?' : 'Tolak permohonan ini?')) return;

    try {
      const res = await fetch('/api/aset/pelupusan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          status: approve ? 'Diluluskan' : 'Ditolak',
          tarikh_kelulusan: new Date().toISOString().split('T')[0],
          jenis_aset: record.jenis_aset,
          aset_id: record.aset_id
        })
      });

      if (res.ok) {
        alert(approve ? 'Permohonan diluluskan' : 'Permohonan ditolak');
        fetchData();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleComplete = async (record: Pelupusan) => {
    const tarikhPelupusan = prompt('Tarikh pelupusan (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!tarikhPelupusan) return;

    try {
      const res = await fetch('/api/aset/pelupusan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: record.id,
          status: 'Selesai',
          tarikh_pelupusan: tarikhPelupusan,
          jenis_aset: record.jenis_aset,
          aset_id: record.aset_id
        })
      });

      if (res.ok) {
        alert('Pelupusan selesai');
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
      keterangan_aset: '',
      harga_asal: '',
      nilai_semasa: '',
      sebab_pelupusan: '',
      kaedah_pelupusan: '',
      nama_penerima: '',
      alamat_penerima: '',
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
                <li className="breadcrumb-item active">Pelupusan Aset</li>
              </ol>
            </nav>
            <h4 className="mb-0" style={{ color: '#8B0000' }}>
              <i className="bi bi-trash me-2"></i>
              Pelupusan Aset (BR-AMS 007/008)
            </h4>
          </div>
          <button
            className="btn btn-danger"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Permohonan Pelupusan
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="row mb-4">
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">Jumlah Permohonan</h6>
                  <h3 className="mb-0">{summary.total}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">Menunggu Kelulusan</h6>
                  <h3 className="mb-0 text-warning">{summary.menunggu}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">Selesai</h6>
                  <h3 className="mb-0 text-success">{summary.selesai}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <h6 className="text-muted mb-1">Nilai Dilupuskan</h6>
                  <h3 className="mb-0">{formatCurrency(summary.nilai_dilupuskan)}</h3>
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
                    <th>Tarikh</th>
                    <th>Aset</th>
                    <th>Kaedah</th>
                    <th className="text-end">Nilai (RM)</th>
                    <th>Status</th>
                    <th className="text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Tiada permohonan pelupusan
                      </td>
                    </tr>
                  ) : (
                    records.map(item => (
                      <tr key={item.id}>
                        <td><code>{item.no_rujukan}</code></td>
                        <td>{new Date(item.tarikh_permohonan).toLocaleDateString('ms-MY')}</td>
                        <td>
                          <code className="small">{item.no_siri_pendaftaran}</code>
                          <div className="small text-muted">{item.keterangan_aset}</div>
                        </td>
                        <td><span className="badge bg-secondary">{item.kaedah_pelupusan}</span></td>
                        <td className="text-end">{item.nilai_semasa.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={`badge ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                        </td>
                        <td className="text-center">
                          <div className="btn-group btn-group-sm">
                            {userRole === 'admin' && item.status === 'Permohonan' && (
                              <>
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => handleApprove(item, true)}
                                  title="Luluskan"
                                >
                                  <i className="bi bi-check-lg"></i>
                                </button>
                                <button
                                  className="btn btn-outline-danger"
                                  onClick={() => handleApprove(item, false)}
                                  title="Tolak"
                                >
                                  <i className="bi bi-x-lg"></i>
                                </button>
                              </>
                            )}
                            {item.status === 'Diluluskan' && (
                              <button
                                className="btn btn-outline-primary"
                                onClick={() => handleComplete(item)}
                                title="Tandakan Selesai"
                              >
                                <i className="bi bi-check-circle"></i>
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
                <h5 className="modal-title">Permohonan Pelupusan Aset</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => { setShowModal(false); resetForm(); }}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row g-3">
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
                    <div className="col-md-6">
                      <label className="form-label">Harga Asal (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.harga_asal}
                        readOnly
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Nilai Semasa (RM) <span className="text-danger">*</span></label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.nilai_semasa}
                        onChange={(e) => setFormData({ ...formData, nilai_semasa: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Sebab Pelupusan <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.sebab_pelupusan}
                        onChange={(e) => setFormData({ ...formData, sebab_pelupusan: e.target.value })}
                        placeholder="Nyatakan justifikasi pelupusan"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Kaedah Pelupusan <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        value={formData.kaedah_pelupusan}
                        onChange={(e) => setFormData({ ...formData, kaedah_pelupusan: e.target.value })}
                        required
                      >
                        <option value="">-- Pilih --</option>
                        <option value="Jualan">Jualan</option>
                        <option value="Tukar Barang">Tukar Barang</option>
                        <option value="Sumbangan/Hadiah">Sumbangan/Hadiah</option>
                        <option value="Serahan">Serahan</option>
                        <option value="Musnah/Buang/Bakar">Musnah/Buang/Bakar</option>
                      </select>
                    </div>
                    {(formData.kaedah_pelupusan === 'Sumbangan/Hadiah' || formData.kaedah_pelupusan === 'Serahan') && (
                      <>
                        <div className="col-md-6">
                          <label className="form-label">Nama Penerima</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.nama_penerima}
                            onChange={(e) => setFormData({ ...formData, nama_penerima: e.target.value })}
                          />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Alamat Penerima</label>
                          <textarea
                            className="form-control"
                            rows={2}
                            value={formData.alamat_penerima}
                            onChange={(e) => setFormData({ ...formData, alamat_penerima: e.target.value })}
                          />
                        </div>
                      </>
                    )}
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
                  <button type="submit" className="btn btn-danger">
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
