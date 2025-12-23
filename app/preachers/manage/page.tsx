'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Preacher {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  photo: string | null;
  nama_bank: string | null;
  no_akaun: string | null;
  is_active: number;
  created_at: string;
}

export default function ManagePreachersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preachers, setPreachers] = useState<Preacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPreacher, setEditingPreacher] = useState<Preacher | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    nama_bank: '',
    no_akaun: '',
    is_active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session?.user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchPreachers();
    }
  }, [session]);

  const fetchPreachers = async () => {
    try {
      const response = await fetch('/api/preachers');
      const data = await response.json();

      if (response.ok) {
        setPreachers(data.preachers);
      } else {
        setError(data.error || 'Failed to fetch preachers');
      }
    } catch (err) {
      setError('Failed to fetch preachers');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (preacher?: Preacher) => {
    if (preacher) {
      setEditingPreacher(preacher);
      setFormData({
        name: preacher.name,
        phone: preacher.phone || '',
        email: preacher.email || '',
        nama_bank: preacher.nama_bank || '',
        no_akaun: preacher.no_akaun || '',
        is_active: preacher.is_active === 1
      });
      setPhotoPreview(preacher.photo);
    } else {
      setEditingPreacher(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        nama_bank: '',
        no_akaun: '',
        is_active: true
      });
      setPhotoPreview(null);
    }
    setSelectedFile(null);
    setShowModal(true);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPreacher(null);
    setSelectedFile(null);
    setPhotoPreview(null);
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Only JPEG, PNG, and WebP are allowed');
        return;
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        setError('File size exceeds 2MB limit');
        return;
      }

      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleUploadPhoto = async (preacherId: number) => {
    if (!selectedFile) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('preacherId', preacherId.toString());
      formData.append('photo', selectedFile);

      const response = await fetch('/api/preachers/photo', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Photo uploaded successfully');
        fetchPreachers();
        setSelectedFile(null);
      } else {
        setError(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      setError('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async (preacherId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    try {
      const response = await fetch(`/api/preachers/photo?preacherId=${preacherId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Photo deleted successfully');
        fetchPreachers();
        setPhotoPreview(null);
      } else {
        setError(data.error || 'Failed to delete photo');
      }
    } catch (err) {
      setError('Failed to delete photo');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const url = editingPreacher ? '/api/preachers' : '/api/preachers';
      const method = editingPreacher ? 'PUT' : 'POST';

      const payload = editingPreacher
        ? { id: editingPreacher.id, ...formData }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);

        // If there's a file to upload and we have a preacher ID
        if (selectedFile) {
          const preacherId = editingPreacher?.id || data.preacherId;
          await handleUploadPhoto(preacherId);
        }

        setShowModal(false);
        fetchPreachers();
      } else {
        setError(data.error || 'Failed to save preacher');
      }
    } catch (err) {
      setError('Failed to save preacher');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this preacher? This will remove them from all schedules.')) {
      return;
    }

    try {
      const response = await fetch(`/api/preachers?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        fetchPreachers();
      } else {
        setError(data.error || 'Failed to delete preacher');
      }
    } catch (err) {
      setError('Failed to delete preacher');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-outline-secondary" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-2"></i>Kembali
          </button>
          <h1 className="mb-0">Manage Preachers</h1>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="bi bi-plus-circle me-2"></i>
          Add Preacher
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {preachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center">
                      No preachers found. Add your first preacher to get started.
                    </td>
                  </tr>
                ) : (
                  preachers.map((preacher) => (
                    <tr key={preacher.id}>
                      <td>
                        {preacher.photo ? (
                          <Image
                            src={preacher.photo}
                            alt={preacher.name}
                            width={50}
                            height={50}
                            className="rounded-circle"
                            style={{ objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                            style={{ width: '50px', height: '50px' }}
                          >
                            <i className="bi bi-person-fill"></i>
                          </div>
                        )}
                      </td>
                      <td>{preacher.name}</td>
                      <td>{preacher.phone || '-'}</td>
                      <td>{preacher.email || '-'}</td>
                      <td>
                        <span className={`badge ${preacher.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {preacher.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => handleOpenModal(preacher)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(preacher.id)}
                        >
                          <i className="bi bi-trash"></i> Delete
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingPreacher ? 'Edit Preacher' : 'Add Preacher'}
                </h5>
                <button type="button" className="btn-close" onClick={handleCloseModal}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}

                  <div className="row">
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label htmlFor="name" className="form-label">
                          Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="phone" className="form-label">
                          Phone
                        </label>
                        <input
                          type="tel"
                          className="form-control"
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control"
                          id="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="nama_bank" className="form-label">
                          Nama Bank
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="nama_bank"
                          value={formData.nama_bank}
                          onChange={(e) => setFormData({ ...formData, nama_bank: e.target.value })}
                          placeholder="Contoh: Maybank, CIMB, Bank Islam"
                        />
                      </div>

                      <div className="mb-3">
                        <label htmlFor="no_akaun" className="form-label">
                          No. Akaun Bank
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          id="no_akaun"
                          value={formData.no_akaun}
                          onChange={(e) => setFormData({ ...formData, no_akaun: e.target.value })}
                          placeholder="Contoh: 1234567890"
                        />
                      </div>

                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label className="form-check-label" htmlFor="is_active">
                          Active
                        </label>
                      </div>
                    </div>

                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">
                          Photo
                          <small className="text-muted d-block">Recommended: 150x150px</small>
                        </label>

                        {photoPreview && (
                          <div className="mb-2 text-center">
                            <Image
                              src={photoPreview}
                              alt="Preview"
                              width={150}
                              height={150}
                              className="rounded"
                              style={{ objectFit: 'cover' }}
                            />
                            {editingPreacher && editingPreacher.photo && !selectedFile && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger d-block w-100 mt-2"
                                onClick={() => handleDeletePhoto(editingPreacher.id)}
                              >
                                <i className="bi bi-trash"></i> Remove Photo
                              </button>
                            )}
                          </div>
                        )}

                        <input
                          type="file"
                          className="form-control"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleFileChange}
                        />
                        <small className="text-muted">
                          Max 2MB. JPEG, PNG, or WebP only.
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={uploadingPhoto}>
                    {uploadingPhoto ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Uploading...
                      </>
                    ) : (
                      <>
                        {editingPreacher ? 'Update' : 'Add'} Preacher
                      </>
                    )}
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
