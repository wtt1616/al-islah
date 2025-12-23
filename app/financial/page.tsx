'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { BankStatement } from '@/types';

export default function FinancialManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [statementToDelete, setStatementToDelete] = useState<BankStatement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [suggestedBalance, setSuggestedBalance] = useState<number | null>(null);
  const [balanceMessage, setBalanceMessage] = useState('');

  // Edit opening balance state
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  const [statementToEdit, setStatementToEdit] = useState<BankStatement | null>(null);
  const [editingBalance, setEditingBalance] = useState(false);
  const [editBalanceValue, setEditBalanceValue] = useState('');
  const [editBalanceMessage, setEditBalanceMessage] = useState('');

  // Sorting state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = newest first

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && !['admin', 'bendahari', 'head_imam'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchStatements();
    }
  }, [session]);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/financial/statements');
      if (response.ok) {
        const data = await response.json();
        setStatements(data);
      }
    } catch (error) {
      console.error('Error fetching statements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const fetchSuggestedBalance = async (month: string, year: string) => {
    if (!month || !year) return;

    try {
      const response = await fetch(`/api/financial/statements?action=get_opening_balance&month=${month}&year=${year}`);
      if (response.ok) {
        const data = await response.json();
        if (data.opening_balance !== null) {
          setSuggestedBalance(data.opening_balance);
          setOpeningBalance(data.opening_balance.toFixed(2));
          setBalanceMessage(`✓ ${data.message}: RM ${data.opening_balance.toFixed(2)}`);
        } else {
          setSuggestedBalance(null);
          setOpeningBalance('');
          setBalanceMessage('⚠ ' + data.message + '. Sila masukkan baki awal secara manual.');
        }
      }
    } catch (error) {
      console.error('Error fetching suggested balance:', error);
      setBalanceMessage('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedMonth || !selectedYear) {
      setUploadMessage('Sila pilih fail, bulan dan tahun');
      return;
    }

    if (!openingBalance || openingBalance.trim() === '') {
      setUploadMessage('Sila masukkan baki awal');
      return;
    }

    try {
      setUploading(true);
      setUploadMessage('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('month', selectedMonth);
      formData.append('year', selectedYear);
      formData.append('opening_balance', openingBalance);

      const response = await fetch('/api/financial/statements', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setUploadMessage(`✓ ${data.message}`);
        setSelectedFile(null);
        setSelectedMonth('');
        setSelectedYear('');
        setOpeningBalance('');
        setSuggestedBalance(null);
        setBalanceMessage('');
        setShowUploadModal(false);
        fetchStatements();
      } else {
        setUploadMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setUploadMessage('✗ Gagal memuat naik fail');
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (statement: BankStatement) => {
    setStatementToDelete(statement);
    setShowDeleteModal(true);
    setDeleteMessage('');
  };

  const handleEditBalanceClick = (statement: BankStatement) => {
    setStatementToEdit(statement);
    setEditBalanceValue(statement.opening_balance?.toString() || '0');
    setShowEditBalanceModal(true);
    setEditBalanceMessage('');
  };

  const handleEditBalanceConfirm = async () => {
    if (!statementToEdit) return;

    try {
      setEditingBalance(true);
      setEditBalanceMessage('');

      const response = await fetch('/api/financial/statements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: statementToEdit.id,
          opening_balance: parseFloat(editBalanceValue) || 0
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEditBalanceMessage(`✓ ${data.message}`);
        setTimeout(() => {
          setShowEditBalanceModal(false);
          setStatementToEdit(null);
          fetchStatements();
        }, 1500);
      } else {
        setEditBalanceMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setEditBalanceMessage('✗ Gagal mengemaskini baki awal');
      console.error('Error updating opening balance:', error);
    } finally {
      setEditingBalance(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!statementToDelete) return;

    try {
      setDeleting(true);
      setDeleteMessage('');

      const response = await fetch(`/api/financial/statements?id=${statementToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteMessage(`✓ ${data.message}`);
        setTimeout(() => {
          setShowDeleteModal(false);
          setStatementToDelete(null);
          fetchStatements();
        }, 1500);
      } else {
        setDeleteMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setDeleteMessage('✗ Gagal memadam penyata bank');
      console.error('Error deleting statement:', error);
    } finally {
      setDeleting(false);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
    'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
  ];

  const getMonthName = (month: number) => monthNames[month - 1] || '';

  // Sort statements by date (year and month)
  const sortedStatements = [...statements].sort((a, b) => {
    const dateA = a.year * 12 + a.month;
    const dateB = b.year * 12 + b.month;
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />

      <div className="container mt-4">
        <div className="row mb-4">
          <div className="col">
            <h2 className="mb-0">
              <i className="bi bi-cash-coin me-2"></i>
              Pengurusan Kewangan
            </h2>
            <p className="text-muted">Pengurusan penyata bank dan transaksi kewangan masjid</p>
          </div>
          <div className="col-auto d-flex gap-2">
            <button
              className="btn btn-success"
              onClick={() => router.push('/financial/dashboard')}
            >
              <i className="bi bi-graph-up-arrow me-2"></i>
              Dashboard Statistik
            </button>
            {['admin', 'bendahari'].includes(session?.user.role || '') && (
              <button
                className="btn btn-primary"
                onClick={() => setShowUploadModal(true)}
              >
                <i className="bi bi-upload me-2"></i>
                Muat Naik Penyata Bank
              </button>
            )}
          </div>
        </div>

        {/* Statements List */}
        <div className="card">
          <div className="card-header bg-white">
            <h5 className="mb-0">Senarai Penyata Bank</h5>
          </div>
          <div className="card-body">
            {statements.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox" style={{ fontSize: '3rem' }}></i>
                <p className="mt-3">Tiada penyata bank dimuat naik lagi</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={toggleSortOrder}
                        title="Klik untuk tukar susunan"
                      >
                        Bulan/Tahun
                        <i className={`bi bi-arrow-${sortOrder === 'desc' ? 'down' : 'up'} ms-1`}></i>
                      </th>
                      <th>Nama Fail</th>
                      <th>Tarikh Muat Naik</th>
                      <th>Dimuat Naik Oleh</th>
                      <th>Baki Awal (RM)</th>
                      <th>Jumlah Transaksi</th>
                      <th>Dikategorikan</th>
                      <th>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStatements.map((statement) => (
                      <tr key={statement.id}>
                        <td>
                          <strong>{getMonthName(statement.month)} {statement.year}</strong>
                        </td>
                        <td>
                          <i className="bi bi-file-earmark-spreadsheet me-2 text-success"></i>
                          {statement.filename}
                        </td>
                        <td>
                          {new Date(statement.upload_date).toLocaleDateString('ms-MY', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>{statement.uploader_name}</td>
                        <td>
                          {statement.opening_balance !== null && statement.opening_balance !== undefined
                            ? parseFloat(statement.opening_balance.toString()).toLocaleString('ms-MY', { minimumFractionDigits: 2 })
                            : '-'}
                          {['admin', 'bendahari'].includes(session?.user.role || '') && (
                            <button
                              className="btn btn-sm btn-link p-0 ms-2"
                              onClick={() => handleEditBalanceClick(statement)}
                              title="Edit baki awal"
                            >
                              <i className="bi bi-pencil text-primary"></i>
                            </button>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-primary">{statement.total_transactions}</span>
                        </td>
                        <td>
                          <span className={`badge ${statement.categorized_count === statement.total_transactions ? 'bg-success' : 'bg-warning'}`}>
                            {statement.categorized_count} / {statement.total_transactions}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => router.push(`/financial/transactions?statement_id=${statement.id}`)}
                          >
                            <i className="bi bi-list-ul me-1"></i>
                            Lihat Transaksi
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success me-2"
                            onClick={() => router.push(`/dashboard/reports/buku-tunai?month=${statement.month}&year=${statement.year}`)}
                          >
                            <i className="bi bi-file-earmark-text me-1"></i>
                            Buku Tunai
                          </button>
                          {['admin', 'bendahari'].includes(session?.user.role || '') && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteClick(statement)}
                              title="Padam penyata bank"
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && statementToDelete && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Pengesahan Pemadaman
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setStatementToDelete(null);
                    setDeleteMessage('');
                  }}
                  disabled={deleting}
                ></button>
              </div>
              <div className="modal-body">
                {deleteMessage && (
                  <div className={`alert ${deleteMessage.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>
                    {deleteMessage}
                  </div>
                )}

                {!deleteMessage && (
                  <>
                    <div className="alert alert-warning">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <strong>AMARAN:</strong> Tindakan ini tidak boleh dibatalkan!
                    </div>

                    <p className="mb-3">
                      Adakah anda pasti untuk memadam penyata bank ini?
                    </p>

                    <div className="card">
                      <div className="card-body">
                        <h6 className="card-title">Maklumat Penyata:</h6>
                        <ul className="mb-0">
                          <li><strong>Bulan/Tahun:</strong> {getMonthName(statementToDelete.month)} {statementToDelete.year}</li>
                          <li><strong>Nama Fail:</strong> {statementToDelete.filename}</li>
                          <li><strong>Jumlah Transaksi:</strong> {statementToDelete.total_transactions}</li>
                        </ul>
                      </div>
                    </div>

                    <div className="alert alert-danger mt-3 mb-0">
                      <small>
                        <i className="bi bi-info-circle me-2"></i>
                        Semua transaksi yang berkaitan dengan penyata ini akan turut dipadam.
                      </small>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setStatementToDelete(null);
                    setDeleteMessage('');
                  }}
                  disabled={deleting}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDeleteConfirm}
                  disabled={deleting || deleteMessage.startsWith('✓')}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Memadam...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash me-2"></i>
                      Ya, Padam
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-upload me-2"></i>
                  Muat Naik Penyata Bank
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowUploadModal(false);
                    setUploadMessage('');
                  }}
                ></button>
              </div>
              <form onSubmit={handleUpload}>
                <div className="modal-body">
                  {uploadMessage && (
                    <div className={`alert ${uploadMessage.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>
                      {uploadMessage}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Fail Penyata Bank (CSV)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".csv"
                      onChange={handleFileChange}
                      required
                    />
                    <div className="form-text">
                      Format: CSV sahaja. Fail penyata bank dari bank.
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Bulan</label>
                      <select
                        className="form-select"
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(e.target.value);
                          if (e.target.value && selectedYear) {
                            fetchSuggestedBalance(e.target.value, selectedYear);
                          }
                        }}
                        required
                      >
                        <option value="">Pilih Bulan</option>
                        {monthNames.map((month, index) => (
                          <option key={index + 1} value={index + 1}>
                            {month}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tahun</label>
                      <select
                        className="form-select"
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(e.target.value);
                          if (selectedMonth && e.target.value) {
                            fetchSuggestedBalance(selectedMonth, e.target.value);
                          }
                        }}
                        required
                      >
                        <option value="">Pilih Tahun</option>
                        {[2024, 2025, 2026, 2027, 2028].map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Baki Awal (RM)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={openingBalance}
                      onChange={(e) => setOpeningBalance(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                    {balanceMessage && (
                      <div className={`form-text ${balanceMessage.startsWith('✓') ? 'text-success' : 'text-warning'}`}>
                        {balanceMessage}
                      </div>
                    )}
                    <div className="form-text">
                      Baki awal bulan (dari baki akhir bulan sebelum). Sistem akan cuba cadangkan nilai ini secara automatik.
                    </div>
                  </div>

                  {selectedFile && (
                    <div className="alert alert-info">
                      <i className="bi bi-info-circle me-2"></i>
                      <strong>Fail dipilih:</strong> {selectedFile.name}
                      <br />
                      <small>Saiz: {(selectedFile.size / 1024).toFixed(2)} KB</small>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadMessage('');
                    }}
                    disabled={uploading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={uploading || !selectedFile || !selectedMonth || !selectedYear}
                  >
                    {uploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Memuat Naik...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-upload me-2"></i>
                        Muat Naik
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Opening Balance Modal */}
      {showEditBalanceModal && statementToEdit && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-pencil me-2"></i>
                  Edit Baki Awal
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowEditBalanceModal(false);
                    setStatementToEdit(null);
                    setEditBalanceMessage('');
                  }}
                  disabled={editingBalance}
                ></button>
              </div>
              <div className="modal-body">
                {editBalanceMessage && (
                  <div className={`alert ${editBalanceMessage.startsWith('✓') ? 'alert-success' : 'alert-danger'}`}>
                    {editBalanceMessage}
                  </div>
                )}

                <div className="card mb-3">
                  <div className="card-body">
                    <h6 className="card-title">Maklumat Penyata:</h6>
                    <p className="mb-0">
                      <strong>{getMonthName(statementToEdit.month)} {statementToEdit.year}</strong>
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Baki Awal (RM)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={editBalanceValue}
                    onChange={(e) => setEditBalanceValue(e.target.value)}
                    placeholder="0.00"
                    disabled={editingBalance}
                  />
                  <div className="form-text">
                    Masukkan nilai baki awal bulan (dari baki akhir bulan sebelum).
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditBalanceModal(false);
                    setStatementToEdit(null);
                    setEditBalanceMessage('');
                  }}
                  disabled={editingBalance}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleEditBalanceConfirm}
                  disabled={editingBalance || editBalanceMessage.startsWith('✓')}
                >
                  {editingBalance ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Mengemaskini...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Simpan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
