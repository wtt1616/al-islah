'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Seller {
  id: number;
  nama: string;
  email: string;
  no_tel: string;
  alamat: string;
  is_active: boolean;
  product_count: number;
  created_at: string;
}

interface Product {
  id: number;
  nama: string;
  keterangan: string;
  harga: number;
  gambar1: string | null;
  seller_nama: string;
  seller_no_tel: string;
  seller_is_active: boolean;
  category_nama: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminKomuniti2UPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sellers' | 'products'>('sellers');
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && !['admin', 'head_imam'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'sellers') {
        const res = await fetch('/api/komuniti2u/sellers?admin=true');
        if (res.ok) {
          const data = await res.json();
          setSellers(data);
        }
      } else {
        const res = await fetch('/api/komuniti2u/admin/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSellerStatus = async (seller: Seller) => {
    try {
      const res = await fetch('/api/komuniti2u/sellers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: seller.id, is_active: !seller.is_active })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Status penjual ${seller.is_active ? 'dinyahaktifkan' : 'diaktifkan'}` });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa mengemaskini status' });
    }
  };

  const deleteSeller = async (seller: Seller) => {
    if (!confirm(`Adakah anda pasti mahu memadam penjual "${seller.nama}" dan semua produknya?`)) return;

    try {
      const res = await fetch(`/api/komuniti2u/sellers?id=${seller.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Penjual dan produk berjaya dipadam' });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa memadam penjual' });
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const res = await fetch('/api/komuniti2u/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id, is_active: !product.is_active })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: `Status produk ${product.is_active ? 'dinyahaktifkan' : 'diaktifkan'}` });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa mengemaskini status' });
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!confirm(`Adakah anda pasti mahu memadam produk "${product.nama}"?`)) return;

    try {
      const res = await fetch(`/api/komuniti2u/admin/products?id=${product.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Produk berjaya dipadam' });
        fetchData();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa memadam produk' });
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
      <div className="container-fluid mt-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="mb-0">
              <i className="bi bi-shop me-2"></i>
              Pengurusan Komuniti 2U
            </h4>
            <small className="text-muted">Urus penjual dan produk marketplace</small>
          </div>
          <div className="d-flex gap-2">
            <a href="/dashboard/komuniti2u/categories" className="btn btn-outline-primary">
              <i className="bi bi-tags me-2"></i>
              Urus Kategori
            </a>
            <a href="/komuniti2u" target="_blank" className="btn btn-outline-success">
              <i className="bi bi-box-arrow-up-right me-2"></i>
              Lihat Marketplace
            </a>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'sellers' ? 'active' : ''}`}
              onClick={() => setActiveTab('sellers')}
            >
              <i className="bi bi-people me-2"></i>
              Penjual
              <span className="badge bg-secondary ms-2">{sellers.length}</span>
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <i className="bi bi-box-seam me-2"></i>
              Produk
              <span className="badge bg-secondary ms-2">{products.length}</span>
            </button>
          </li>
        </ul>

        {/* Sellers Tab */}
        {activeTab === 'sellers' && (
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Penjual</th>
                    <th>No. Telefon</th>
                    <th>Email</th>
                    <th>Produk</th>
                    <th>Tarikh Daftar</th>
                    <th>Status</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Tiada penjual berdaftar
                      </td>
                    </tr>
                  ) : (
                    sellers.map((seller) => (
                      <tr key={seller.id}>
                        <td>
                          <strong>{seller.nama}</strong>
                          {seller.alamat && (
                            <p className="text-muted small mb-0">{seller.alamat}</p>
                          )}
                        </td>
                        <td>{seller.no_tel}</td>
                        <td>{seller.email}</td>
                        <td>
                          <span className="badge bg-info">{seller.product_count} produk</span>
                        </td>
                        <td>
                          {new Date(seller.created_at).toLocaleDateString('ms-MY', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td>
                          <button
                            className={`btn btn-sm ${seller.is_active ? 'btn-success' : 'btn-secondary'}`}
                            onClick={() => toggleSellerStatus(seller)}
                          >
                            {seller.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteSeller(seller)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="card">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '60px' }}>Gambar</th>
                    <th>Produk</th>
                    <th>Penjual</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Status</th>
                    <th>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted">
                        Tiada produk
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className={!product.seller_is_active ? 'table-secondary' : ''}>
                        <td>
                          {product.gambar1 ? (
                            <img src={product.gambar1} alt="" style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                          ) : (
                            <div className="bg-light d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px', borderRadius: '4px' }}>
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
                        <td>
                          {product.seller_nama}
                          {!product.seller_is_active && (
                            <span className="badge bg-secondary ms-1">Tidak Aktif</span>
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
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => deleteProduct(product)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
