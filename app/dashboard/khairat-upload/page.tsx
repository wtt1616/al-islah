'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Upload {
  id: number;
  filename: string;
  uploaded_by_name: string;
  total_records: number;
  created_at: string;
}

interface Stats {
  total_members: number;
  active_members: number;
  pending_members: number;
  total_tanggungan: number;
}

export default function KhairatUploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && !['admin', 'head_imam', 'khairat'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/khairat/upload-excel');
      if (res.ok) {
        const data = await res.json();
        setUploads(data.uploads || []);
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        setMessage({ type: 'error', text: 'Sila pilih fail Excel (.xlsx atau .xls)' });
        return;
      }
      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Sila pilih fail untuk dimuat naik' });
      return;
    }

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/khairat/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Berjaya! ${data.stats.inserted} ahli baru, ${data.stats.updated} ahli dikemaskini, ${data.stats.tanggungan || 0} tanggungan ditambah.`
        });
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal memuat naik fail' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa memuat naik fail' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/khairat/upload-excel', {
        method: 'DELETE',
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `Berjaya! ${data.deleted.ahli} ahli dan ${data.deleted.tanggungan} tanggungan telah dipadam.`
        });
        setShowDeleteModal(false);
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal memadam data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa memadam data' });
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <>
        <Navbar />
        <div className="container mt-4">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>
            <i className="bi bi-cloud-upload me-2"></i>
            Muat Naik Data Khairat
          </h2>
          <a href="/dashboard/khairat" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Kembali
          </a>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card bg-primary text-white">
                <div className="card-body">
                  <h5 className="card-title">Jumlah Ahli</h5>
                  <h2 className="mb-0">{stats.total_members?.toLocaleString() || 0}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-success text-white">
                <div className="card-body">
                  <h5 className="card-title">Ahli Diluluskan</h5>
                  <h2 className="mb-0">{stats.active_members?.toLocaleString() || 0}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-warning text-dark">
                <div className="card-body">
                  <h5 className="card-title">Menunggu Kelulusan</h5>
                  <h2 className="mb-0">{stats.pending_members?.toLocaleString() || 0}</h2>
                </div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card bg-info text-white">
                <div className="card-body">
                  <h5 className="card-title">Jumlah Tanggungan</h5>
                  <h2 className="mb-0">{stats.total_tanggungan?.toLocaleString() || 0}</h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">
              <i className="bi bi-file-earmark-excel me-2"></i>
              Muat Naik Fail Excel
            </h5>
          </div>
          <div className="card-body">
            {message && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                {message.text}
                <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
              </div>
            )}

            <div className="mb-3">
              <label htmlFor="fileInput" className="form-label">
                Pilih Fail Excel (.xlsx)
              </label>
              <input
                type="file"
                className="form-control"
                id="fileInput"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <div className="form-text">
                <strong>Format fail:</strong> BIL, NAMA, KP, Tarikh Lahir, Umur, Status (Ahli/Pasangan/Anak), Jantina, HP, Resit, Alamat, Taman, Permohonan, Cara Bayaran, Bayaran, Catatan
              </div>
            </div>

            {file && (
              <div className="alert alert-info">
                <i className="bi bi-file-earmark me-2"></i>
                Fail dipilih: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file || uploading}
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Memproses...
                  </>
                ) : (
                  <>
                    <i className="bi bi-upload me-2"></i>
                    Muat Naik
                  </>
                )}
              </button>

              {stats && stats.total_members > 0 && (
                <button
                  className="btn btn-outline-danger"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={uploading || deleting}
                >
                  <i className="bi bi-trash me-2"></i>
                  Padam Semua Data
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Upload History */}
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-clock-history me-2"></i>
              Sejarah Muat Naik
            </h5>
          </div>
          <div className="card-body">
            {uploads.length === 0 ? (
              <p className="text-muted mb-0">Tiada rekod muat naik</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Tarikh/Masa</th>
                      <th>Nama Fail</th>
                      <th>Dimuat Naik Oleh</th>
                      <th>Jumlah Rekod</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploads.map((upload) => (
                      <tr key={upload.id}>
                        <td>
                          {new Date(upload.created_at).toLocaleString('ms-MY', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td>
                          <i className="bi bi-file-earmark-excel text-success me-2"></i>
                          {upload.filename}
                        </td>
                        <td>{upload.uploaded_by_name || '-'}</td>
                        <td>
                          <span className="badge bg-primary">{upload.total_records}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-danger text-white">
                  <h5 className="modal-title">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Pengesahan Padam Data
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Amaran!</strong> Tindakan ini tidak boleh dibatalkan.
                  </div>
                  <p>Anda akan memadam:</p>
                  <ul>
                    <li><strong>{stats?.total_members?.toLocaleString() || 0}</strong> rekod ahli</li>
                    <li><strong>{stats?.total_tanggungan?.toLocaleString() || 0}</strong> rekod tanggungan</li>
                    <li>Semua sejarah muat naik</li>
                  </ul>
                  <p className="mb-0">Adakah anda pasti mahu meneruskan?</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deleting}
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Memadam...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-trash me-2"></i>
                        Ya, Padam Semua
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
