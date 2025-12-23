'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Seller {
  id: number;
  nama: string;
  email: string;
  no_tel: string;
  alamat: string;
}

interface Category {
  id: number;
  nama: string;
  icon: string;
}

interface Product {
  id: number;
  nama: string;
  keterangan: string;
  harga: number;
  gambar1: string | null;
  gambar2: string | null;
  gambar3: string | null;
  category_id: number;
  category_nama: string;
  is_active: boolean;
}

export default function SellerPortalPage() {
  const [mode, setMode] = useState<'auth' | 'dashboard'>('auth');
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState<string | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ nama: '', email: '', password: '', no_tel: '', alamat: '' });
  const [productForm, setProductForm] = useState({
    id: null as number | null,
    nama: '',
    keterangan: '',
    harga: '',
    category_id: '',
    gambar1: '',
    gambar2: '',
    gambar3: ''
  });
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<1 | 2 | 3 | null>(null);

  // File input refs for each image slot (gallery)
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);
  const fileInput3Ref = useRef<HTMLInputElement>(null);
  // File input refs for camera capture
  const cameraInput1Ref = useRef<HTMLInputElement>(null);
  const cameraInput2Ref = useRef<HTMLInputElement>(null);
  const cameraInput3Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check for existing token
    const savedToken = localStorage.getItem('k2u_token');
    if (savedToken) {
      verifyToken(savedToken);
    }
    fetchCategories();
  }, []);

  const verifyToken = async (t: string) => {
    try {
      const res = await fetch('/api/komuniti2u/auth', {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        setToken(t);
        setSeller(data.seller);
        setMode('dashboard');
        fetchProducts(t);
      } else {
        localStorage.removeItem('k2u_token');
      }
    } catch (error) {
      localStorage.removeItem('k2u_token');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/komuniti2u/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (t: string) => {
    try {
      const res = await fetch('/api/komuniti2u/products?my_products=true', {
        headers: { 'Authorization': `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/komuniti2u/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', ...loginForm })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('k2u_token', data.token);
        setToken(data.token);
        setSeller(data.seller);
        setMode('dashboard');
        fetchProducts(data.token);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa log masuk' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/komuniti2u/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', ...registerForm })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('k2u_token', data.token);
        setToken(data.token);
        setSeller(data.seller);
        setMode('dashboard');
        setMessage({ type: 'success', text: 'Pendaftaran berjaya!' });
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa pendaftaran' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('k2u_token');
    setToken(null);
    setSeller(null);
    setProducts([]);
    setMode('auth');
    setLoginForm({ email: '', password: '' });
  };

  const openProductModal = (product?: Product) => {
    if (product) {
      setProductForm({
        id: product.id,
        nama: product.nama,
        keterangan: product.keterangan || '',
        harga: String(product.harga),
        category_id: String(product.category_id),
        gambar1: product.gambar1 || '',
        gambar2: product.gambar2 || '',
        gambar3: product.gambar3 || ''
      });
      setEditingProduct(true);
    } else {
      setProductForm({
        id: null,
        nama: '',
        keterangan: '',
        harga: '',
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        gambar1: '',
        gambar2: '',
        gambar3: ''
      });
      setEditingProduct(false);
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch('/api/komuniti2u/products', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...productForm,
          harga: parseFloat(productForm.harga)
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: editingProduct ? 'Produk dikemaskini!' : 'Produk ditambah!' });
        setShowProductModal(false);
        fetchProducts(token!);
      } else {
        setMessage({ type: 'error', text: data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa menyimpan produk' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Adakah anda pasti mahu memadam produk ini?')) return;

    try {
      const res = await fetch(`/api/komuniti2u/products?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Produk dipadam!' });
        fetchProducts(token!);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa memadam produk' });
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const res = await fetch('/api/komuniti2u/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: product.id,
          is_active: !product.is_active
        })
      });

      if (res.ok) {
        fetchProducts(token!);
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const handleImageUpload = async (file: File, slot: 1 | 2 | 3) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Jenis fail tidak dibenarkan. Sila gunakan JPEG, PNG, GIF atau WebP.' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Saiz fail terlalu besar. Maksimum 5MB.' });
      return;
    }

    setUploadingImage(slot);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/komuniti2u/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        // Update the appropriate image field
        const fieldName = `gambar${slot}` as 'gambar1' | 'gambar2' | 'gambar3';
        setProductForm(prev => ({ ...prev, [fieldName]: data.url }));
        setMessage({ type: 'success', text: 'Gambar berjaya dimuat naik!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Gagal memuat naik gambar' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa memuat naik gambar' });
    } finally {
      setUploadingImage(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2 | 3) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, slot);
    }
    // Reset input value so same file can be selected again
    e.target.value = '';
  };

  const removeImage = (slot: 1 | 2 | 3) => {
    const fieldName = `gambar${slot}` as 'gambar1' | 'gambar2' | 'gambar3';
    setProductForm(prev => ({ ...prev, [fieldName]: '' }));
  };

  // Auth Page
  if (mode === 'auth') {
    return (
      <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center p-4">
        <div className="card shadow-lg" style={{ maxWidth: '450px', width: '100%' }}>
          <div className="card-header bg-success text-white text-center py-3">
            <h4 className="mb-0">
              <i className="bi bi-shop me-2"></i>
              Portal Penjual
            </h4>
            <small>Komuniti 2U</small>
          </div>
          <div className="card-body p-4">
            {message && (
              <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}>
                {message.text}
                <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
              </div>
            )}

            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${authTab === 'login' ? 'active' : ''}`}
                  onClick={() => setAuthTab('login')}
                >
                  Log Masuk
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${authTab === 'register' ? 'active' : ''}`}
                  onClick={() => setAuthTab('register')}
                >
                  Daftar Baru
                </button>
              </li>
            </ul>

            {authTab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Kata Laluan</label>
                  <input
                    type="password"
                    className="form-control"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-success w-100" disabled={loading}>
                  {loading ? 'Memuatkan...' : 'Log Masuk'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="form-label">Nama Penuh *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={registerForm.nama}
                    onChange={(e) => setRegisterForm({ ...registerForm, nama: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Kata Laluan *</label>
                  <input
                    type="password"
                    className="form-control"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">No. Telefon (WhatsApp) *</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={registerForm.no_tel}
                    onChange={(e) => setRegisterForm({ ...registerForm, no_tel: e.target.value })}
                    placeholder="01x-xxxxxxx"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Alamat</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={registerForm.alamat}
                    onChange={(e) => setRegisterForm({ ...registerForm, alamat: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-success w-100" disabled={loading}>
                  {loading ? 'Memuatkan...' : 'Daftar'}
                </button>
              </form>
            )}

            <div className="text-center mt-4">
              <Link href="/komuniti2u" className="text-muted">
                <i className="bi bi-arrow-left me-1"></i>
                Kembali ke Marketplace
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard Page
  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-success text-white py-3">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">
                <i className="bi bi-shop me-2"></i>
                Selamat datang, {seller?.nama}
              </h5>
            </div>
            <div className="d-flex gap-2">
              <Link href="/komuniti2u" className="btn btn-outline-light btn-sm">
                <i className="bi bi-eye me-1"></i>
                Lihat Marketplace
              </Link>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-1"></i>
                Log Keluar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {/* Action Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h4 className="mb-0">
            <i className="bi bi-box-seam me-2"></i>
            Produk Saya ({products.length})
          </h4>
          <button className="btn btn-success" onClick={() => openProductModal()}>
            <i className="bi bi-plus-lg me-2"></i>
            Tambah Produk
          </button>
        </div>

        {/* Products Table */}
        {products.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-5">
              <i className="bi bi-box-seam text-muted" style={{ fontSize: '4rem' }}></i>
              <h5 className="mt-3 text-muted">Tiada produk lagi</h5>
              <p className="text-muted">Klik butang "Tambah Produk" untuk mula menjual</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '80px' }}>Gambar</th>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Status</th>
                    <th style={{ width: '150px' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        {product.gambar1 ? (
                          <img src={product.gambar1} alt="" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px', borderRadius: '8px' }}>
                            <i className="bi bi-image text-muted"></i>
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{product.nama}</strong>
                        {product.keterangan && (
                          <p className="text-muted small mb-0 text-truncate" style={{ maxWidth: '200px' }}>
                            {product.keterangan}
                          </p>
                        )}
                      </td>
                      <td>{product.category_nama}</td>
                      <td className="text-success fw-bold">RM {Number(product.harga).toFixed(2)}</td>
                      <td>
                        <button
                          className={`btn btn-sm ${product.is_active ? 'btn-success' : 'btn-secondary'}`}
                          onClick={() => toggleProductStatus(product)}
                        >
                          {product.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary me-1" onClick={() => openProductModal(product)}>
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteProduct(product.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowProductModal(false)}></button>
              </div>
              <form onSubmit={handleSaveProduct}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Nama Produk *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={productForm.nama}
                        onChange={(e) => setProductForm({ ...productForm, nama: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Harga (RM) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        value={productForm.harga}
                        onChange={(e) => setProductForm({ ...productForm, harga: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3 mb-3">
                      <label className="form-label">Kategori *</label>
                      <select
                        className="form-select"
                        value={productForm.category_id}
                        onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                        required
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.nama}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label">Keterangan</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={productForm.keterangan}
                        onChange={(e) => setProductForm({ ...productForm, keterangan: e.target.value })}
                        placeholder="Terangkan produk anda..."
                      />
                    </div>
                    {/* Image Upload Section */}
                    <div className="col-12 mb-3">
                      <label className="form-label">Gambar Produk</label>
                      <small className="text-muted d-block mb-2">Muat naik sehingga 3 gambar (maksimum 5MB setiap satu). Boleh ambil gambar dari kamera pada telefon bimbit.</small>

                      <div className="row g-3">
                        {/* Image 1 */}
                        <div className="col-4">
                          <div className="border rounded p-2 text-center" style={{ minHeight: '150px' }}>
                            {productForm.gambar1 ? (
                              <div className="position-relative">
                                <img
                                  src={productForm.gambar1}
                                  alt="Gambar 1"
                                  className="img-fluid rounded mb-2"
                                  style={{ maxHeight: '100px', objectFit: 'cover' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                  onClick={() => removeImage(1)}
                                  style={{ margin: '-8px' }}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100px' }}>
                                {uploadingImage === 1 ? (
                                  <div className="spinner-border spinner-border-sm text-success" role="status">
                                    <span className="visually-hidden">Memuat naik...</span>
                                  </div>
                                ) : (
                                  <>
                                    <i className="bi bi-image text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                                    <small className="text-muted">Gambar Utama</small>
                                  </>
                                )}
                              </div>
                            )}
                            {/* Gallery input - no capture attribute */}
                            <input
                              type="file"
                              ref={fileInput1Ref}
                              className="d-none"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={(e) => handleFileSelect(e, 1)}
                            />
                            {/* Camera input - with capture attribute */}
                            <input
                              type="file"
                              ref={cameraInput1Ref}
                              className="d-none"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              capture="environment"
                              onChange={(e) => handleFileSelect(e, 1)}
                            />
                            <div className="d-flex gap-1 justify-content-center mt-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => fileInput1Ref.current?.click()}
                                disabled={uploadingImage === 1}
                                title="Pilih dari galeri"
                              >
                                <i className="bi bi-upload"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => cameraInput1Ref.current?.click()}
                                disabled={uploadingImage === 1}
                                title="Ambil gambar dari kamera"
                              >
                                <i className="bi bi-camera"></i>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Image 2 */}
                        <div className="col-4">
                          <div className="border rounded p-2 text-center" style={{ minHeight: '150px' }}>
                            {productForm.gambar2 ? (
                              <div className="position-relative">
                                <img
                                  src={productForm.gambar2}
                                  alt="Gambar 2"
                                  className="img-fluid rounded mb-2"
                                  style={{ maxHeight: '100px', objectFit: 'cover' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                  onClick={() => removeImage(2)}
                                  style={{ margin: '-8px' }}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100px' }}>
                                {uploadingImage === 2 ? (
                                  <div className="spinner-border spinner-border-sm text-success" role="status">
                                    <span className="visually-hidden">Memuat naik...</span>
                                  </div>
                                ) : (
                                  <>
                                    <i className="bi bi-image text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                                    <small className="text-muted">Gambar 2</small>
                                  </>
                                )}
                              </div>
                            )}
                            {/* Gallery input - no capture attribute */}
                            <input
                              type="file"
                              ref={fileInput2Ref}
                              className="d-none"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={(e) => handleFileSelect(e, 2)}
                            />
                            {/* Camera input - with capture attribute */}
                            <input
                              type="file"
                              ref={cameraInput2Ref}
                              className="d-none"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              capture="environment"
                              onChange={(e) => handleFileSelect(e, 2)}
                            />
                            <div className="d-flex gap-1 justify-content-center mt-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => fileInput2Ref.current?.click()}
                                disabled={uploadingImage === 2}
                                title="Pilih dari galeri"
                              >
                                <i className="bi bi-upload"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => cameraInput2Ref.current?.click()}
                                disabled={uploadingImage === 2}
                                title="Ambil gambar dari kamera"
                              >
                                <i className="bi bi-camera"></i>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Image 3 */}
                        <div className="col-4">
                          <div className="border rounded p-2 text-center" style={{ minHeight: '150px' }}>
                            {productForm.gambar3 ? (
                              <div className="position-relative">
                                <img
                                  src={productForm.gambar3}
                                  alt="Gambar 3"
                                  className="img-fluid rounded mb-2"
                                  style={{ maxHeight: '100px', objectFit: 'cover' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger position-absolute top-0 end-0"
                                  onClick={() => removeImage(3)}
                                  style={{ margin: '-8px' }}
                                >
                                  <i className="bi bi-x"></i>
                                </button>
                              </div>
                            ) : (
                              <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100px' }}>
                                {uploadingImage === 3 ? (
                                  <div className="spinner-border spinner-border-sm text-success" role="status">
                                    <span className="visually-hidden">Memuat naik...</span>
                                  </div>
                                ) : (
                                  <>
                                    <i className="bi bi-image text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                                    <small className="text-muted">Gambar 3</small>
                                  </>
                                )}
                              </div>
                            )}
                            {/* Gallery input - no capture attribute */}
                            <input
                              type="file"
                              ref={fileInput3Ref}
                              className="d-none"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={(e) => handleFileSelect(e, 3)}
                            />
                            {/* Camera input - with capture attribute */}
                            <input
                              type="file"
                              ref={cameraInput3Ref}
                              className="d-none"
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              capture="environment"
                              onChange={(e) => handleFileSelect(e, 3)}
                            />
                            <div className="d-flex gap-1 justify-content-center mt-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={() => fileInput3Ref.current?.click()}
                                disabled={uploadingImage === 3}
                                title="Pilih dari galeri"
                              >
                                <i className="bi bi-upload"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => cameraInput3Ref.current?.click()}
                                disabled={uploadingImage === 3}
                                title="Ambil gambar dari kamera"
                              >
                                <i className="bi bi-camera"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>
                    Batal
                  </button>
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan'}
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
