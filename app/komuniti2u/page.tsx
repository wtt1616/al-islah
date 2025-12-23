'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
  seller_nama: string;
  seller_no_tel: string;
  seller_alamat: string;
  category_nama: string;
  category_icon: string;
}

export default function Komuniti2UPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = '/api/komuniti2u/products?';
      if (selectedCategory !== 'all') {
        url += `category=${selectedCategory}&`;
      }
      if (searchTerm) {
        url += `search=${encodeURIComponent(searchTerm)}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const generateWhatsAppLink = (product: Product) => {
    const message = encodeURIComponent(
      `Assalamualaikum, saya berminat untuk membeli:\n\n` +
      `Produk: ${product.nama}\n` +
      `Harga: RM ${Number(product.harga).toFixed(2)}\n\n` +
      `Sila sahkan ketersediaan. Terima kasih.`
    );
    const phone = product.seller_no_tel.replace(/\D/g, '');
    const formattedPhone = phone.startsWith('0') ? '6' + phone : phone;
    return `https://wa.me/${formattedPhone}?text=${message}`;
  };

  return (
    <div className="min-vh-100 bg-light">
      {/* Header */}
      <div className="bg-success text-white py-4">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">
                <i className="bi bi-shop me-2"></i>
                Komuniti 2U
              </h2>
              <p className="mb-0 opacity-75">Marketplace Komuniti Surau Al-Islah</p>
            </div>
            <div className="d-flex gap-2">
              <Link href="/komuniti2u/seller" className="btn btn-light">
                <i className="bi bi-person-badge me-2"></i>
                Portal Penjual
              </Link>
              <Link href="/login" className="btn btn-outline-light">
                <i className="bi bi-arrow-left me-2"></i>
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {/* Search & Filter */}
        <div className="card mb-4">
          <div className="card-body">
            <form onSubmit={handleSearch} className="row g-3">
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-search"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" className="btn btn-success">
                    Cari
                  </button>
                </div>
              </div>
              <div className="col-md-6">
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-funnel"></i>
                  </span>
                  <select
                    className="form-select"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="all">Semua Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-inbox text-muted" style={{ fontSize: '4rem' }}></i>
            <h5 className="mt-3 text-muted">Tiada produk dijumpai</h5>
            <p className="text-muted">Cuba cari dengan kata kunci lain atau pilih kategori berbeza</p>
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-4 row-cols-xl-5 g-2 g-md-3">
            {products.map((product) => (
              <div key={product.id} className="col">
                <div className="card h-100 shadow-sm hover-shadow" style={{ cursor: 'pointer' }}>
                  {product.gambar1 ? (
                    <img
                      src={product.gambar1}
                      className="card-img-top"
                      alt={product.nama}
                      style={{ height: '120px', objectFit: 'cover' }}
                      onClick={() => setSelectedProduct(product)}
                    />
                  ) : (
                    <div
                      className="card-img-top bg-light d-flex align-items-center justify-content-center"
                      style={{ height: '120px' }}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
                    </div>
                  )}
                  <div className="card-body p-2" onClick={() => setSelectedProduct(product)}>
                    <span className="badge bg-secondary mb-1" style={{ fontSize: '0.6rem' }}>
                      <i className={`bi ${product.category_icon} me-1`}></i>
                      {product.category_nama}
                    </span>
                    <h6 className="card-title mb-1" style={{ fontSize: '0.8rem', lineHeight: '1.2' }}>{product.nama}</h6>
                    <p className="text-success fw-bold mb-1" style={{ fontSize: '0.85rem' }}>RM {Number(product.harga).toFixed(2)}</p>
                    <p className="card-text text-muted mb-0" style={{ fontSize: '0.65rem' }}>
                      <i className="bi bi-person me-1"></i>
                      {product.seller_nama}
                    </p>
                  </div>
                  <div className="card-footer bg-white border-top-0 p-2">
                    <a
                      href={generateWhatsAppLink(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success btn-sm w-100"
                      style={{ fontSize: '0.7rem' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <i className="bi bi-whatsapp me-1"></i>
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setSelectedProduct(null)}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header py-2">
                <h6 className="modal-title">{selectedProduct.nama}</h6>
                <button type="button" className="btn-close" onClick={() => setSelectedProduct(null)}></button>
              </div>
              <div className="modal-body p-2 p-md-3">
                <div className="row g-2">
                  <div className="col-12 col-md-6">
                    {/* Image thumbnails - clickable to enlarge */}
                    <div className="d-flex gap-2 flex-wrap justify-content-center">
                      {selectedProduct.gambar1 && (
                        <div
                          className="position-relative"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setActiveImage(selectedProduct.gambar1)}
                        >
                          <img
                            src={selectedProduct.gambar1}
                            className="rounded shadow-sm"
                            style={{ width: '100px', height: '100px', objectFit: 'cover', border: '2px solid #198754' }}
                            alt="Gambar 1"
                          />
                          <div className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}>
                            <i className="bi bi-zoom-in"></i>
                          </div>
                        </div>
                      )}
                      {selectedProduct.gambar2 && (
                        <div
                          className="position-relative"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setActiveImage(selectedProduct.gambar2)}
                        >
                          <img
                            src={selectedProduct.gambar2}
                            className="rounded shadow-sm"
                            style={{ width: '100px', height: '100px', objectFit: 'cover', border: '2px solid #198754' }}
                            alt="Gambar 2"
                          />
                          <div className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}>
                            <i className="bi bi-zoom-in"></i>
                          </div>
                        </div>
                      )}
                      {selectedProduct.gambar3 && (
                        <div
                          className="position-relative"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setActiveImage(selectedProduct.gambar3)}
                        >
                          <img
                            src={selectedProduct.gambar3}
                            className="rounded shadow-sm"
                            style={{ width: '100px', height: '100px', objectFit: 'cover', border: '2px solid #198754' }}
                            alt="Gambar 3"
                          />
                          <div className="position-absolute bottom-0 end-0 bg-success text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '20px', height: '20px', fontSize: '0.6rem' }}>
                            <i className="bi bi-zoom-in"></i>
                          </div>
                        </div>
                      )}
                      {!selectedProduct.gambar1 && !selectedProduct.gambar2 && !selectedProduct.gambar3 && (
                        <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                          <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }}></i>
                        </div>
                      )}
                    </div>
                    <p className="text-center text-muted mt-2 mb-0" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-hand-index me-1"></i>Tekan gambar untuk besarkan
                    </p>
                  </div>
                  <div className="col-12 col-md-6">
                    <span className="badge bg-secondary mb-2">
                      <i className={`bi ${selectedProduct.category_icon} me-1`}></i>
                      {selectedProduct.category_nama}
                    </span>
                    <h4 className="text-success fw-bold mb-2">RM {Number(selectedProduct.harga).toFixed(2)}</h4>

                    {selectedProduct.keterangan && (
                      <div className="mb-2">
                        <h6 className="mb-1" style={{ fontSize: '0.85rem' }}>Keterangan:</h6>
                        <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>{selectedProduct.keterangan}</p>
                      </div>
                    )}

                    <hr className="my-2" />
                    <h6 className="mb-1" style={{ fontSize: '0.85rem' }}>Maklumat Penjual:</h6>
                    <p className="mb-1" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-person me-2"></i>
                      {selectedProduct.seller_nama}
                    </p>
                    <p className="mb-1" style={{ fontSize: '0.8rem' }}>
                      <i className="bi bi-telephone me-2"></i>
                      {selectedProduct.seller_no_tel}
                    </p>
                    {selectedProduct.seller_alamat && (
                      <p className="mb-0" style={{ fontSize: '0.8rem' }}>
                        <i className="bi bi-geo-alt me-2"></i>
                        {selectedProduct.seller_alamat}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer py-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setSelectedProduct(null)}>
                  Tutup
                </button>
                <a
                  href={generateWhatsAppLink(selectedProduct)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-success btn-sm"
                >
                  <i className="bi bi-whatsapp me-2"></i>
                  Tempah via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {activeImage && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.95)', zIndex: 1060 }}
          onClick={() => setActiveImage(null)}
        >
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1070 }}>
            <button
              type="button"
              className="btn btn-light rounded-circle"
              style={{ width: '40px', height: '40px' }}
              onClick={() => setActiveImage(null)}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
          <div className="d-flex align-items-center justify-content-center h-100 p-3">
            <img
              src={activeImage}
              alt="Gambar produk"
              style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        .hover-shadow:hover {
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }
      `}</style>
    </div>
  );
}
