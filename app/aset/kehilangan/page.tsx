'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Kehilangan {
  id: number;
  no_rujukan: string;
  jenis_aset: string;
  aset_id: number;
  no_siri_pendaftaran: string;
  keterangan_aset: string;
  harga_asal: number;
  nilai_semasa: number;
  tarikh_kehilangan: string;
  lokasi_terakhir: string | null;
  sebab_kehilangan: string;
  no_laporan_polis: string | null;
  status: string;
  nama_pelapor: string;
}

interface Summary {
  total: number;
  aktif: number;
  dijumpai: number;
  hapus_kira: number;
  nilai_hilang: number;
}

interface Asset {
  jenis_aset: string;
  id: number;
  no_siri_pendaftaran: string;
  keterangan: string;
  harga_asal: number;
}

const STATUS_COLORS: { [key: string]: string } = {
  'Dilaporkan': 'bg-warning',
  'Dalam Siasatan': 'bg-info',
  'Dijumpai': 'bg-success',
  'Hapus Kira Dalam Proses': 'bg-secondary',
  'Hapus Kira Diluluskan': 'bg-dark',
  'Hapus Kira Ditolak': 'bg-danger'
};

export default function KehilanganAsetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [records, setRecords] = useState<Kehilangan[]>([]);
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
    tarikh_kehilangan: new Date().toISOString().split('T')[0],
    lokasi_terakhir: '',
    sebab_kehilangan: '',
    tindakan_diambil: '',
    no_laporan_polis: '',
    tarikh_laporan_polis: '',
    balai_polis: '',
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
        fetch(`/api/aset/kehilangan?tahun=${filterTahun}`),
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
        no_siri_pendaftaran: asset.no_siri_pendaftaran,
        keterangan_aset: asset.keterangan,
        harga_asal: asset.harga_asal.toString(),
        nilai_semasa: asset.harga_asal.toString()
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/aset/kehilangan', {
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
        alert(data.error || 'Gagal menyimpan laporan');
        return;
      }

      alert(`Laporan kehilangan berjaya dihantar.\nNo. Rujukan: ${data.no_rujukan}`);
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Ralat menyimpan laporan');
    }
  };

  const handleStatusUpdate = async (record: Kehilangan, newStatus: string) => {
    if (!confirm(`Kemaskini status kepada "${newStatus}"?`)) return;

    try {
      const payload: any = {
        id: record.id,
        status: newStatus,
        jenis_aset: record.jenis_aset,
        aset_id: record.aset_id
      };

      if (newStatus === 'Hapus Kira Diluluskan') {
        payload.tarikh_lulus_hapus_kira = new Date().toISOString().split('T')[0];
      }

      const res = await fetch('/api/aset/kehilangan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Status dikemaskini');
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
      tarikh_kehilangan: new Date().toISOString().split('T')[0],
      lokasi_terakhir: '',
      sebab_kehilangan: '',
      tindakan_diambil: '',
      no_laporan_polis: '',
      tarikh_laporan_polis: '',
      balai_polis: '',
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
                <li className="breadcrumb-item active">Kehilangan/Hapus Kira</li>
              </ol>
            </nav>
            <h4 className="mb-0" style={{ color: '#8B0000' }}>
              <i className="bi bi-search me-2"></i>
              Kehilangan/Hapus Kira (BR-AMS 009)
            </h4>
          </div>
          <button
            className="btn btn-dark"
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <i className="bi bi-plus-lg me-1"></i>
            Lapor Kehilangan
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="row mb-4">
            <div className="col-md-2 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center">
                  <h6 className="text-muted mb-1">Jumlah Kes</h6>
                  <h3 className="mb-0">{summary.total}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-2 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-warning">
                <div className="card-body text-center">
                  <h6 className="mb-1">Aktif/Siasatan</h6>
                  <h3 className="mb-0">{summary.aktif}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-2 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-success text-white">
                <div className="card-body text-center">
                  <h6 className="mb-1">Dijumpai</h6>
                  <h3 className="mb-0">{summary.dijumpai}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-2 col-sm-6 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-dark text-white">
                <div className="card-body text-center">
                  <h6 className="mb-1">Hapus Kira</h6>
                  <h3 className="mb-0">{summary.hapus_kira}</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-sm-12 mb-3">
              <div className="card border-0 shadow-sm h-100 bg-danger text-white">
                <div className="card-body text-center">
                  <h6 className="mb-1">Nilai Hilang</h6>
                  <h3 className="mb-0">{formatCurrency(summary.nilai_hilang)}</h3>
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
                    <th>Lokasi Terakhir</th>
                    <th className="text-end">Nilai (RM)</th>
                    <th>Status</th>
                    <th className="text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Tiada laporan kehilangan
                      </td>
                    </tr>
                  ) : (
                    records.map(item => (
                      <tr key={item.id}>
                        <td><code>{item.no_rujukan}</code></td>
                        <td>{new Date(item.tarikh_kehilangan).toLocaleDateString('ms-MY')}</td>
                        <td>
                          <code className="small">{item.no_siri_pendaftaran}</code>
                          <div className="small text-muted">{item.keterangan_aset}</div>
                        </td>
                        <td className="small">{item.lokasi_terakhir || '-'}</td>
                        <td className="text-end">{item.nilai_semasa.toLocaleString('ms-MY', { minimumFractionDigits: 2 })}</td>
                        <td>
                          <span className={`badge ${STATUS_COLORS[item.status]}`}>{item.status}</span>
                          {item.no_laporan_polis && (
                            <div className="small text-muted">Polis: {item.no_laporan_polis}</div>
                          )}
                        </td>
                        <td className="text-center">
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-outline-secondary dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              <i className="bi bi-three-dots"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end">
                              {item.status === 'Dilaporkan' && (
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handleStatusUpdate(item, 'Dalam Siasatan')}
                                  >
                                    <i className="bi bi-search me-2"></i>Mula Siasatan
                                  </button>
                                </li>
                              )}
                              {(item.status === 'Dilaporkan' || item.status === 'Dalam Siasatan') && (
                                <>
                                  <li>
                                    <button
                                      className="dropdown-item text-success"
                                      onClick={() => handleStatusUpdate(item, 'Dijumpai')}
                                    >
                                      <i className="bi bi-check-circle me-2"></i>Dijumpai
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleStatusUpdate(item, 'Hapus Kira Dalam Proses')}
                                    >
                                      <i className="bi bi-file-text me-2"></i>Mohon Hapus Kira
                                    </button>
                                  </li>
                                </>
                              )}
                              {item.status === 'Hapus Kira Dalam Proses' && userRole === 'admin' && (
                                <>
                                  <li>
                                    <button
                                      className="dropdown-item text-success"
                                      onClick={() => handleStatusUpdate(item, 'Hapus Kira Diluluskan')}
                                    >
                                      <i className="bi bi-check-lg me-2"></i>Luluskan Hapus Kira
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item text-danger"
                                      onClick={() => handleStatusUpdate(item, 'Hapus Kira Ditolak')}
                                    >
                                      <i className="bi bi-x-lg me-2"></i>Tolak Hapus Kira
                                    </button>
                                  </li>
                                </>
                              )}
                            </ul>
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
                <h5 className="modal-title">Laporan Kehilangan Aset</h5>
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
                    <div className="col-md-4">
                      <label className="form-label">Tarikh Kehilangan <span className="text-danger">*</span></label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tarikh_kehilangan}
                        onChange={(e) => setFormData({ ...formData, tarikh_kehilangan: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Nilai Semasa (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={formData.nilai_semasa}
                        onChange={(e) => setFormData({ ...formData, nilai_semasa: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Lokasi Terakhir</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.lokasi_terakhir}
                        onChange={(e) => setFormData({ ...formData, lokasi_terakhir: e.target.value })}
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Sebab/Punca Kehilangan <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.sebab_kehilangan}
                        onChange={(e) => setFormData({ ...formData, sebab_kehilangan: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Tindakan Yang Diambil</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={formData.tindakan_diambil}
                        onChange={(e) => setFormData({ ...formData, tindakan_diambil: e.target.value })}
                      />
                    </div>

                    <div className="col-12">
                      <hr />
                      <h6>Maklumat Laporan Polis (Jika Ada)</h6>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">No. Laporan Polis</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.no_laporan_polis}
                        onChange={(e) => setFormData({ ...formData, no_laporan_polis: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Tarikh Laporan</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tarikh_laporan_polis}
                        onChange={(e) => setFormData({ ...formData, tarikh_laporan_polis: e.target.value })}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Balai Polis</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.balai_polis}
                        onChange={(e) => setFormData({ ...formData, balai_polis: e.target.value })}
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
                  <button type="submit" className="btn btn-dark">
                    <i className="bi bi-send me-1"></i>Hantar Laporan
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
