'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface NotaItem {
  id: number;
  subkategori: string;
  baki_awal_jan_sebelum: number;
  terimaan_semasa_sebelum: number;
  belanja_semasa_sebelum: number;
  baki_akhir_dis_sebelum: number;
  baki_awal_jan_semasa: number;
  terimaan_semasa_semasa: number;
  belanja_semasa_semasa: number;
  baki_akhir_dis_semasa: number;
  auto_generated: boolean;
}

interface NotaData {
  tahun: number;
  data: NotaItem[];
  subkategoriList: string[];
  totals: {
    sebelum: {
      baki_awal_jan: number;
      terimaan_semasa: number;
      belanja_semasa: number;
      baki_akhir_dis: number;
    };
    semasa: {
      baki_awal_jan: number;
      terimaan_semasa: number;
      belanja_semasa: number;
      baki_akhir_dis: number;
    };
  };
}

export default function NotaPenerimaanSumbanganKhasPage() {
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
      const response = await fetch(`/api/financial/nota-penerimaan-sumbangan-khas?tahun=${tahun}`);
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
    if (!confirm(`Adakah anda pasti untuk menjana semula nilai automatik dari transaksi untuk tahun ${tahun}? Nilai Terimaan dan Belanja akan dikemaskini.`)) {
      return;
    }

    try {
      setGenerating(true);
      setError('');
      const response = await fetch('/api/financial/nota-penerimaan-sumbangan-khas', {
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

  const openEditModal = (item: NotaItem) => {
    setEditingItem(item);
    setFormData({
      subkategori: item.subkategori,
      baki_awal_jan_sebelum: item.baki_awal_jan_sebelum,
      terimaan_semasa_sebelum: item.terimaan_semasa_sebelum,
      belanja_semasa_sebelum: item.belanja_semasa_sebelum,
      baki_akhir_dis_sebelum: item.baki_akhir_dis_sebelum,
      baki_awal_jan_semasa: item.baki_awal_jan_semasa,
      terimaan_semasa_semasa: item.terimaan_semasa_semasa,
      belanja_semasa_semasa: item.belanja_semasa_semasa,
      baki_akhir_dis_semasa: item.baki_akhir_dis_semasa,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const body = {
        id: editingItem?.id,
        ...formData,
        baki_awal_jan_sebelum: parseFloat(formData.baki_awal_jan_sebelum) || 0,
        terimaan_semasa_sebelum: parseFloat(formData.terimaan_semasa_sebelum) || 0,
        belanja_semasa_sebelum: parseFloat(formData.belanja_semasa_sebelum) || 0,
        baki_akhir_dis_sebelum: parseFloat(formData.baki_akhir_dis_sebelum) || 0,
        baki_awal_jan_semasa: parseFloat(formData.baki_awal_jan_semasa) || 0,
        terimaan_semasa_semasa: parseFloat(formData.terimaan_semasa_semasa) || 0,
        belanja_semasa_semasa: parseFloat(formData.belanja_semasa_semasa) || 0,
        baki_akhir_dis_semasa: parseFloat(formData.baki_akhir_dis_semasa) || 0,
      };

      const response = await fetch('/api/financial/nota-penerimaan-sumbangan-khas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save');

      setSuccess('Data berjaya dikemaskini');
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

  // Auto-calculate baki akhir when values change
  const updateFormWithCalculation = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };

    // Calculate baki akhir for sebelum
    if (['baki_awal_jan_sebelum', 'terimaan_semasa_sebelum', 'belanja_semasa_sebelum'].includes(field)) {
      const baki = (parseFloat(newFormData.baki_awal_jan_sebelum) || 0) +
                   (parseFloat(newFormData.terimaan_semasa_sebelum) || 0) -
                   (parseFloat(newFormData.belanja_semasa_sebelum) || 0);
      newFormData.baki_akhir_dis_sebelum = baki;
    }

    // Calculate baki akhir for semasa
    if (['baki_awal_jan_semasa', 'terimaan_semasa_semasa', 'belanja_semasa_semasa'].includes(field)) {
      const baki = (parseFloat(newFormData.baki_awal_jan_semasa) || 0) +
                   (parseFloat(newFormData.terimaan_semasa_semasa) || 0) -
                   (parseFloat(newFormData.belanja_semasa_semasa) || 0);
      newFormData.baki_akhir_dis_semasa = baki;
    }

    setFormData(newFormData);
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
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => window.history.back()}>&larr; Kembali</button>
          <h4 className="mb-0">Selenggara Nota Butiran Penerimaan Sumbangan Khas</h4>
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
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {data && (
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">5. Sumbangan Khas (Amanah)</h6>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered table-sm mb-0" style={{ fontSize: '11px' }}>
                <thead className="table-light">
                  <tr>
                    <th rowSpan={2} className="align-middle text-center" style={{ width: '120px' }}></th>
                    {data.data.map((item) => (
                      <th key={item.id} className="text-center" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', height: '120px', padding: '8px 4px' }}>
                        <span style={{ transform: 'rotate(180deg)', display: 'inline-block' }}>{item.subkategori}</span>
                      </th>
                    ))}
                    <th className="text-center align-middle" style={{ width: '100px' }}>Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Tahun Sebelum Section */}
                  <tr className="table-secondary">
                    <td colSpan={data.data.length + 2} className="fw-bold">Tahun Sebelum</td>
                  </tr>
                  <tr>
                    <td>Baki Awal 1 Jan</td>
                    {data.data.map((item) => (
                      <td key={item.id} className="text-end">{formatCurrency(item.baki_awal_jan_sebelum)}</td>
                    ))}
                    <td className="text-end fw-bold">{formatCurrency(data.totals.sebelum.baki_awal_jan)}</td>
                  </tr>
                  <tr>
                    <td>Terimaan semasa</td>
                    {data.data.map((item) => (
                      <td key={item.id} className="text-end">{formatCurrency(item.terimaan_semasa_sebelum)}</td>
                    ))}
                    <td className="text-end fw-bold">{formatCurrency(data.totals.sebelum.terimaan_semasa)}</td>
                  </tr>
                  <tr>
                    <td>Belanja Semasa</td>
                    {data.data.map((item) => (
                      <td key={item.id} className="text-end">{formatCurrency(item.belanja_semasa_sebelum)}</td>
                    ))}
                    <td className="text-end fw-bold">{formatCurrency(data.totals.sebelum.belanja_semasa)}</td>
                  </tr>
                  <tr className="table-warning">
                    <td className="fw-bold">Baki Akhir 31 Disember</td>
                    {data.data.map((item) => (
                      <td key={item.id} className="text-end fw-bold">{formatCurrency(item.baki_akhir_dis_sebelum)}</td>
                    ))}
                    <td className="text-end fw-bold">{formatCurrency(data.totals.sebelum.baki_akhir_dis)}</td>
                  </tr>

                  {/* Tahun Semasa Section */}
                  <tr className="table-secondary">
                    <td colSpan={data.data.length + 2} className="fw-bold">Tahun Semasa</td>
                  </tr>
                  <tr>
                    <td>Baki Awal 1 Jan</td>
                    {data.data.map((item) => (
                      <td key={item.id} className="text-end">{formatCurrency(item.baki_awal_jan_semasa)}</td>
                    ))}
                    <td className="text-end fw-bold">{formatCurrency(data.totals.semasa.baki_awal_jan)}</td>
                  </tr>
                  <tr>
                    <td>Terimaan semasa</td>
                    {data.data.map((item) => (
                      <td key={item.id} className="text-end">{formatCurrency(item.terimaan_semasa_semasa)}</td>
                    ))}
                    <td className="text-end fw-bold">{formatCurrency(data.totals.semasa.terimaan_semasa)}</td>
                  </tr>
                  <tr>
                    <td>Belanja Semasa</td>
                    {data.data.map((item) => (
                      <td key={item.id} className="text-end">{formatCurrency(item.belanja_semasa_semasa)}</td>
                    ))}
                    <td className="text-end fw-bold">{formatCurrency(data.totals.semasa.belanja_semasa)}</td>
                  </tr>
                  <tr className="table-success">
                    <td className="fw-bold">Baki Akhir 31 Disember</td>
                    {data.data.map((item) => (
                      <td key={item.id} className="text-end fw-bold">{formatCurrency(item.baki_akhir_dis_semasa)}</td>
                    ))}
                    <td className="text-end fw-bold">{formatCurrency(data.totals.semasa.baki_akhir_dis)}</td>
                  </tr>

                  {/* Edit buttons row */}
                  <tr className="table-light">
                    <td className="text-center">Tindakan</td>
                    {data.data.map((item) => (
                      <td key={item.id} className="text-center">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(item)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                      </td>
                    ))}
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3">
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          <strong>Nota:</strong> Klik butang "Jana Automatik" untuk menjana nilai Terimaan dan Belanja dari transaksi.
          Nilai Baki Awal perlu dimasukkan secara manual. Baki Akhir akan dikira automatik (Baki Awal + Terimaan - Belanja).
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && editingItem && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit: {editingItem.subkategori}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Tahun Sebelum */}
                  <div className="col-md-6">
                    <h6 className="border-bottom pb-2">Tahun Sebelum</h6>
                    <div className="mb-3">
                      <label className="form-label">Baki Awal 1 Jan (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.baki_awal_jan_sebelum}
                        onChange={(e) => updateFormWithCalculation('baki_awal_jan_sebelum', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Terimaan Semasa (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.terimaan_semasa_sebelum}
                        onChange={(e) => updateFormWithCalculation('terimaan_semasa_sebelum', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Belanja Semasa (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.belanja_semasa_sebelum}
                        onChange={(e) => updateFormWithCalculation('belanja_semasa_sebelum', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Baki Akhir 31 Dis (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control bg-light"
                        value={formData.baki_akhir_dis_sebelum}
                        readOnly
                      />
                      <small className="text-muted">Dikira automatik</small>
                    </div>
                  </div>

                  {/* Tahun Semasa */}
                  <div className="col-md-6">
                    <h6 className="border-bottom pb-2">Tahun Semasa</h6>
                    <div className="mb-3">
                      <label className="form-label">Baki Awal 1 Jan (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.baki_awal_jan_semasa}
                        onChange={(e) => updateFormWithCalculation('baki_awal_jan_semasa', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Terimaan Semasa (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.terimaan_semasa_semasa}
                        onChange={(e) => updateFormWithCalculation('terimaan_semasa_semasa', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Belanja Semasa (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control"
                        value={formData.belanja_semasa_semasa}
                        onChange={(e) => updateFormWithCalculation('belanja_semasa_semasa', e.target.value)}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Baki Akhir 31 Dis (RM)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-control bg-light"
                        value={formData.baki_akhir_dis_semasa}
                        readOnly
                      />
                      <small className="text-muted">Dikira automatik</small>
                    </div>
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
