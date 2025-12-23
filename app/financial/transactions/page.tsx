'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { FinancialTransaction, PenerimaanCategory, PembayaranCategory, BulanPerkiraan } from '@/types';
import {
  Category,
  SubCategory,
  hasSubCategoriesDynamic,
  getSubCategoriesDynamic,
  requiresInvestmentFieldsDynamic
} from '@/lib/subCategories';

export default function TransactionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const statementId = searchParams.get('statement_id');

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>([]); // Store all transactions for counts
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'uncategorized' | 'penerimaan' | 'pembayaran' | 'bulan_sebelum' | 'bulan_depan'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [showCategorizeModal, setShowCategorizeModal] = useState(false);
  const [categorizing, setCategorizing] = useState(false);
  const [autoCategorizing, setAutoCategorizing] = useState(false);
  const [showAutoPreview, setShowAutoPreview] = useState(false);
  const [autoPreviewData, setAutoPreviewData] = useState<any>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Sorting state
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // desc = newest first

  // Category filter state
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Dynamic categories from database
  const [penerimaanCategories, setPenerimaanCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Bulk selection states
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCategorizing, setBulkCategorizing] = useState(false);

  // Helper to check if user can edit (admin or bendahari)
  const canEdit = session?.user?.role && ['admin', 'bendahari'].includes(session.user.role);

  // Bulk form states (separate from single transaction form)
  const [bulkTransactionType, setBulkTransactionType] = useState<'penerimaan' | 'pembayaran'>('penerimaan');
  const [bulkCategoryPenerimaan, setBulkCategoryPenerimaan] = useState<string>('');
  const [bulkSelectedCategory, setBulkSelectedCategory] = useState<Category | null>(null);
  const [bulkSubCategoryPenerimaan, setBulkSubCategoryPenerimaan] = useState<string>('');
  const [bulkInvestmentType, setBulkInvestmentType] = useState<string>('');
  const [bulkInvestmentInstitution, setBulkInvestmentInstitution] = useState<string>('');
  const [bulkCategoryPembayaran, setBulkCategoryPembayaran] = useState<string>('');
  const [bulkSubCategory1Pembayaran, setBulkSubCategory1Pembayaran] = useState<string>('');
  const [bulkSubCategory2Pembayaran, setBulkSubCategory2Pembayaran] = useState<string>('');
  const [bulkSubCategories1, setBulkSubCategories1] = useState<any[]>([]);
  const [bulkSubCategories2, setBulkSubCategories2] = useState<any[]>([]);
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkBulanPerkiraan, setBulkBulanPerkiraan] = useState<BulanPerkiraan>('bulan_semasa');

  // Form states
  const [transactionType, setTransactionType] = useState<'penerimaan' | 'pembayaran'>('penerimaan');
  const [categoryPenerimaan, setCategoryPenerimaan] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [subCategoryPenerimaan, setSubCategoryPenerimaan] = useState<string>('');
  const [investmentType, setInvestmentType] = useState<string>('');
  const [investmentInstitution, setInvestmentInstitution] = useState<string>('');
  const [categoryPembayaran, setCategoryPembayaran] = useState<string>('');
  const [subCategory1Pembayaran, setSubCategory1Pembayaran] = useState<string>('');
  const [subCategory2Pembayaran, setSubCategory2Pembayaran] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [bulanPerkiraan, setBulanPerkiraan] = useState<BulanPerkiraan>('bulan_semasa');

  // Dynamic pembayaran categories from database
  const [pembayaranCategories, setPembayaranCategories] = useState<any[]>([]);
  const [subCategories1, setSubCategories1] = useState<any[]>([]);
  const [subCategories2, setSubCategories2] = useState<any[]>([]);
  const [loadingPembayaranCategories, setLoadingPembayaranCategories] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && !['admin', 'bendahari', 'head_imam'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch categories from database
  useEffect(() => {
    if (session) {
      fetchCategories();
      fetchPembayaranCategories();
    }
  }, [session]);

  useEffect(() => {
    if (session && statementId) {
      fetchTransactions();
      setCurrentPage(1); // Reset to page 1 when filter changes
    }
  }, [session, statementId, filter]);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const response = await fetch('/api/financial/categories');
      if (response.ok) {
        const data = await response.json();
        setPenerimaanCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchPembayaranCategories = async () => {
    try {
      setLoadingPembayaranCategories(true);
      const response = await fetch('/api/financial/pembayaran-categories?include_subcategories=true');
      if (response.ok) {
        const data = await response.json();
        setPembayaranCategories(data);
      }
    } catch (error) {
      console.error('Error fetching pembayaran categories:', error);
    } finally {
      setLoadingPembayaranCategories(false);
    }
  };

  // Handle pembayaran category change - load sub-categories1
  const handlePembayaranCategoryChange = (categoryName: string) => {
    setCategoryPembayaran(categoryName);
    setSubCategory1Pembayaran('');
    setSubCategory2Pembayaran('');
    setSubCategories2([]);

    // Find the category and its sub-categories
    const category = pembayaranCategories.find(c => c.nama_kategori === categoryName);
    if (category && category.subcategories1) {
      setSubCategories1(category.subcategories1);
    } else {
      setSubCategories1([]);
    }
  };

  // Handle sub-category1 change - load sub-categories2
  const handleSubCategory1Change = (subCategoryName: string) => {
    setSubCategory1Pembayaran(subCategoryName);
    setSubCategory2Pembayaran('');

    // Find the sub-category1 and its sub-categories2
    const subCategory1 = subCategories1.find(s => s.nama_subkategori === subCategoryName);
    if (subCategory1 && subCategory1.subcategories2) {
      setSubCategories2(subCategory1.subcategories2);
    } else {
      setSubCategories2([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Always fetch ALL transactions first
      const response = await fetch(`/api/financial/transactions?statement_id=${statementId}`);

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched transactions:', data.length);
        console.log('Transaction breakdown:', {
          uncategorized: data.filter((t: FinancialTransaction) => !t.category_penerimaan && !t.category_pembayaran).length,
          penerimaan_records: data.filter((t: FinancialTransaction) => t.credit_amount && t.credit_amount > 0).length,
          pembayaran_records: data.filter((t: FinancialTransaction) => t.debit_amount && t.debit_amount > 0).length,
        });

        setAllTransactions(data); // Store all for counts

        // Filter for display
        if (filter === 'all') {
          setTransactions(data);
        } else if (filter === 'uncategorized') {
          // Uncategorized = no category assigned (both categories are NULL)
          const filtered = data.filter((t: FinancialTransaction) => !t.category_penerimaan && !t.category_pembayaran);
          setTransactions(filtered);
        } else if (filter === 'penerimaan') {
          // Penerimaan = has credit_amount
          const filtered = data.filter((t: FinancialTransaction) => t.credit_amount && t.credit_amount > 0);
          setTransactions(filtered);
        } else if (filter === 'pembayaran') {
          // Pembayaran = has debit_amount
          const filtered = data.filter((t: FinancialTransaction) => t.debit_amount && t.debit_amount > 0);
          setTransactions(filtered);
        } else if (filter === 'bulan_sebelum') {
          // Bawa ke bulan sebelum
          const filtered = data.filter((t: FinancialTransaction) => t.bulan_perkiraan === 'bulan_sebelum');
          setTransactions(filtered);
        } else if (filter === 'bulan_depan') {
          // Bawa ke bulan depan
          const filtered = data.filter((t: FinancialTransaction) => t.bulan_perkiraan === 'bulan_depan');
          setTransactions(filtered);
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorize = (transaction: FinancialTransaction) => {
    setSelectedTransaction(transaction);

    // Pre-fill form based on existing category or suggest based on amounts
    if (transaction.category_penerimaan) {
      setTransactionType('penerimaan');
      setCategoryPenerimaan(transaction.category_penerimaan);

      // Find the category object
      const category = penerimaanCategories.find(c => c.nama_kategori === transaction.category_penerimaan);
      setSelectedCategory(category || null);

      setSubCategoryPenerimaan(transaction.sub_category_penerimaan || '');
      setInvestmentType(transaction.investment_type || '');
      setInvestmentInstitution(transaction.investment_institution || '');
      setCategoryPembayaran('');
    } else if (transaction.category_pembayaran) {
      setTransactionType('pembayaran');

      // Pre-fill pembayaran category and sub-categories
      const category = pembayaranCategories.find(c => c.nama_kategori === transaction.category_pembayaran);
      setCategoryPembayaran(transaction.category_pembayaran);

      if (category && category.subcategories1) {
        setSubCategories1(category.subcategories1);

        if (transaction.sub_category1_pembayaran) {
          setSubCategory1Pembayaran(transaction.sub_category1_pembayaran);

          const subCat1 = category.subcategories1.find((s: any) => s.nama_subkategori === transaction.sub_category1_pembayaran);
          if (subCat1 && subCat1.subcategories2) {
            setSubCategories2(subCat1.subcategories2);
            setSubCategory2Pembayaran(transaction.sub_category2_pembayaran || '');
          }
        }
      }

      setCategoryPenerimaan('');
      setSelectedCategory(null);
      setSubCategoryPenerimaan('');
      setInvestmentType('');
      setInvestmentInstitution('');
    } else {
      // Suggest type based on transaction amounts
      if (transaction.credit_amount && transaction.credit_amount > 0) {
        setTransactionType('penerimaan');
      } else if (transaction.debit_amount && transaction.debit_amount > 0) {
        setTransactionType('pembayaran');
      }
      setCategoryPenerimaan('');
      setSelectedCategory(null);
      setSubCategoryPenerimaan('');
      setInvestmentType('');
      setInvestmentInstitution('');
      setCategoryPembayaran('');
      setSubCategory1Pembayaran('');
      setSubCategory2Pembayaran('');
      setSubCategories1([]);
      setSubCategories2([]);
    }

    setNotes(transaction.notes || '');
    setBulanPerkiraan(transaction.bulan_perkiraan || 'bulan_semasa');
    setShowCategorizeModal(true);
  };

  const handleSaveCategorization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    try {
      setCategorizing(true);

      const response = await fetch('/api/financial/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: selectedTransaction.id,
          transaction_type: transactionType,
          category_penerimaan: transactionType === 'penerimaan' ? categoryPenerimaan : null,
          sub_category_penerimaan: transactionType === 'penerimaan' ? (subCategoryPenerimaan || null) : null,
          investment_type: transactionType === 'penerimaan' && categoryPenerimaan === 'Hibah Pelaburan' ? (investmentType || null) : null,
          investment_institution: transactionType === 'penerimaan' && categoryPenerimaan === 'Hibah Pelaburan' ? (investmentInstitution || null) : null,
          category_pembayaran: transactionType === 'pembayaran' ? categoryPembayaran : null,
          sub_category1_pembayaran: transactionType === 'pembayaran' ? (subCategory1Pembayaran || null) : null,
          sub_category2_pembayaran: transactionType === 'pembayaran' ? (subCategory2Pembayaran || null) : null,
          notes: notes || null,
          bulan_perkiraan: bulanPerkiraan,
        }),
      });

      if (response.ok) {
        setShowCategorizeModal(false);
        resetForm();
        fetchTransactions();
      } else {
        const error = await response.json();
        alert('Gagal: ' + error.error);
      }
    } catch (error) {
      console.error('Error categorizing transaction:', error);
      alert('Gagal menyimpan kategori');
    } finally {
      setCategorizing(false);
    }
  };

  const resetForm = () => {
    setSelectedTransaction(null);
    setTransactionType('penerimaan');
    setCategoryPenerimaan('');
    setSelectedCategory(null);
    setSubCategoryPenerimaan('');
    setInvestmentType('');
    setInvestmentInstitution('');
    setCategoryPembayaran('');
    setSubCategory1Pembayaran('');
    setSubCategory2Pembayaran('');
    setSubCategories1([]);
    setSubCategories2([]);
    setNotes('');
    setBulanPerkiraan('bulan_semasa');
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(currentTransactions.map(t => t.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const resetBulkForm = () => {
    setBulkTransactionType('penerimaan');
    setBulkCategoryPenerimaan('');
    setBulkSelectedCategory(null);
    setBulkSubCategoryPenerimaan('');
    setBulkInvestmentType('');
    setBulkInvestmentInstitution('');
    setBulkCategoryPembayaran('');
    setBulkSubCategory1Pembayaran('');
    setBulkSubCategory2Pembayaran('');
    setBulkSubCategories1([]);
    setBulkSubCategories2([]);
    setBulkNotes('');
    setBulkBulanPerkiraan('bulan_semasa');
  };

  const handleBulkPembayaranCategoryChange = (categoryName: string) => {
    setBulkCategoryPembayaran(categoryName);
    setBulkSubCategory1Pembayaran('');
    setBulkSubCategory2Pembayaran('');
    setBulkSubCategories2([]);

    const category = pembayaranCategories.find(c => c.nama_kategori === categoryName);
    if (category && category.subcategories1) {
      setBulkSubCategories1(category.subcategories1);
    } else {
      setBulkSubCategories1([]);
    }
  };

  const handleBulkSubCategory1Change = (subCategoryName: string) => {
    setBulkSubCategory1Pembayaran(subCategoryName);
    setBulkSubCategory2Pembayaran('');

    const subCategory1 = bulkSubCategories1.find(s => s.nama_subkategori === subCategoryName);
    if (subCategory1 && subCategory1.subcategories2) {
      setBulkSubCategories2(subCategory1.subcategories2);
    } else {
      setBulkSubCategories2([]);
    }
  };

  const openBulkModal = () => {
    if (selectedIds.size === 0) {
      alert('Sila pilih sekurang-kurangnya satu transaksi');
      return;
    }

    // Determine if selected transactions are mostly penerimaan or pembayaran
    const selectedTransactions = currentTransactions.filter(t => selectedIds.has(t.id));
    const penerimaanCount = selectedTransactions.filter(t => t.credit_amount && t.credit_amount > 0).length;
    const pembayaranCount = selectedTransactions.filter(t => t.debit_amount && t.debit_amount > 0).length;

    // Pre-select transaction type based on majority
    if (penerimaanCount >= pembayaranCount) {
      setBulkTransactionType('penerimaan');
    } else {
      setBulkTransactionType('pembayaran');
    }

    resetBulkForm();
    setShowBulkModal(true);
  };

  const handleBulkCategorize = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedIds.size === 0) {
      alert('Tiada transaksi dipilih');
      return;
    }

    try {
      setBulkCategorizing(true);

      const response = await fetch('/api/financial/transactions/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_ids: Array.from(selectedIds),
          transaction_type: bulkTransactionType,
          category_penerimaan: bulkTransactionType === 'penerimaan' ? bulkCategoryPenerimaan : null,
          sub_category_penerimaan: bulkTransactionType === 'penerimaan' ? (bulkSubCategoryPenerimaan || null) : null,
          investment_type: bulkTransactionType === 'penerimaan' && bulkCategoryPenerimaan === 'Hibah Pelaburan' ? (bulkInvestmentType || null) : null,
          investment_institution: bulkTransactionType === 'penerimaan' && bulkCategoryPenerimaan === 'Hibah Pelaburan' ? (bulkInvestmentInstitution || null) : null,
          category_pembayaran: bulkTransactionType === 'pembayaran' ? bulkCategoryPembayaran : null,
          sub_category1_pembayaran: bulkTransactionType === 'pembayaran' ? (bulkSubCategory1Pembayaran || null) : null,
          sub_category2_pembayaran: bulkTransactionType === 'pembayaran' ? (bulkSubCategory2Pembayaran || null) : null,
          notes: bulkNotes || null,
          bulan_perkiraan: bulkBulanPerkiraan,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setShowBulkModal(false);
        resetBulkForm();
        setSelectedIds(new Set());
        fetchTransactions();
        alert(`Berjaya! ${result.updated_count} transaksi telah dikategorikan.`);
      } else {
        const error = await response.json();
        alert('Gagal: ' + error.error);
      }
    } catch (error) {
      console.error('Error bulk categorizing:', error);
      alert('Gagal menyimpan kategori');
    } finally {
      setBulkCategorizing(false);
    }
  };

  const handleAutoCategorize = async (preview = true) => {
    if (!statementId) return;

    try {
      setAutoCategorizing(true);

      const response = await fetch('/api/financial/auto-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statement_id: statementId,
          preview: preview
        })
      });

      if (response.ok) {
        const data = await response.json();

        if (preview) {
          setAutoPreviewData(data);
          setShowAutoPreview(true);
        } else {
          // Applied successfully
          setShowAutoPreview(false);
          fetchTransactions();
          alert(`Berjaya! ${data.updated_count} transaksi telah dikategorikan.`);
        }
      } else {
        const error = await response.json();
        alert('Gagal: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error auto-categorizing:', error);
      alert('Ralat semasa jana kategori');
    } finally {
      setAutoCategorizing(false);
    }
  };

  const handleApplyAutoCategorize = () => {
    handleAutoCategorize(false);
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return '-';
    return `RM ${amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Calculate counts from ALL transactions, not filtered ones
  // Uncategorized = both categories are NULL
  const uncategorizedCount = allTransactions.filter(t => !t.category_penerimaan && !t.category_pembayaran).length;
  // Penerimaan = has credit_amount
  const penerimaanCount = allTransactions.filter(t => t.credit_amount && t.credit_amount > 0).length;
  // Pembayaran = has debit_amount
  const pembayaranCount = allTransactions.filter(t => t.debit_amount && t.debit_amount > 0).length;
  // Bulan sebelum
  const bulanSebelumCount = allTransactions.filter(t => t.bulan_perkiraan === 'bulan_sebelum').length;
  // Bulan depan
  const bulanDepanCount = allTransactions.filter(t => t.bulan_perkiraan === 'bulan_depan').length;
  const totalCount = allTransactions.length;

  // Get unique categories from current filtered transactions for dropdown
  const getAvailableCategories = () => {
    const categories = new Set<string>();
    transactions.forEach(t => {
      if (t.category_penerimaan) categories.add(t.category_penerimaan);
      if (t.category_pembayaran) categories.add(t.category_pembayaran);
    });
    return Array.from(categories).sort();
  };
  const availableCategories = getAvailableCategories();

  // Apply category filter to transactions
  const filteredByCategory = categoryFilter
    ? transactions.filter(t => t.category_penerimaan === categoryFilter || t.category_pembayaran === categoryFilter)
    : transactions;

  // Sort transactions by date (after category filter)
  const sortedTransactions = [...filteredByCategory].sort((a, b) => {
    const dateA = new Date(a.transaction_date).getTime();
    const dateB = new Date(b.transaction_date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  // Pagination calculations
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

      <div className="container-fluid mt-4 px-4">
        <div className="row mb-4">
          <div className="col">
            <button className="btn btn-outline-secondary mb-3" onClick={() => router.back()}>
              <i className="bi bi-arrow-left me-2"></i>
              Kembali
            </button>
            <h2 className="mb-0">
              <i className="bi bi-list-ul me-2"></i>
              Senarai Transaksi
            </h2>
            <p className="text-muted">Kategorikan transaksi penerimaan dan pembayaran</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="row mb-3">
          <div className="col-md-10">
            <div className="btn-group me-2" role="group">
              <button
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => { setFilter('all'); setCategoryFilter(''); }}
              >
                Semua ({totalCount})
              </button>
              <button
                className={`btn ${filter === 'uncategorized' ? 'btn-warning' : 'btn-outline-warning'}`}
                onClick={() => { setFilter('uncategorized'); setCategoryFilter(''); }}
              >
                Belum Dikategorikan ({uncategorizedCount})
              </button>
              <button
                className={`btn ${filter === 'penerimaan' ? 'btn-success' : 'btn-outline-success'}`}
                onClick={() => { setFilter('penerimaan'); setCategoryFilter(''); }}
              >
                Penerimaan ({penerimaanCount})
              </button>
              <button
                className={`btn ${filter === 'pembayaran' ? 'btn-danger' : 'btn-outline-danger'}`}
                onClick={() => { setFilter('pembayaran'); setCategoryFilter(''); }}
              >
                Pembayaran ({pembayaranCount})
              </button>
            </div>
            <div className="btn-group" role="group">
              <button
                className={`btn ${filter === 'bulan_sebelum' ? 'btn-warning' : 'btn-outline-secondary'}`}
                onClick={() => { setFilter('bulan_sebelum'); setCategoryFilter(''); }}
                title="Transaksi yang dibawa ke bulan sebelum"
              >
                <i className="bi bi-arrow-left me-1"></i>
                Bulan Sebelum ({bulanSebelumCount})
              </button>
              <button
                className={`btn ${filter === 'bulan_depan' ? 'btn-info' : 'btn-outline-secondary'}`}
                onClick={() => { setFilter('bulan_depan'); setCategoryFilter(''); }}
                title="Transaksi yang dibawa ke bulan depan"
              >
                Bulan Depan ({bulanDepanCount})
                <i className="bi bi-arrow-right ms-1"></i>
              </button>
            </div>
          </div>
          <div className="col-md-2 text-end">
            {/* Bulk Categorize Button */}
            {selectedIds.size > 0 && canEdit && (
              <button
                className="btn btn-primary me-2"
                onClick={openBulkModal}
                title="Kategorikan transaksi terpilih"
              >
                <i className="bi bi-tags me-1"></i>
                Kategorikan ({selectedIds.size})
              </button>
            )}
            <div className="dropdown d-inline-block me-2">
              <button
                className="btn btn-secondary dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                title="Urus Kategori"
              >
                <i className="bi bi-folder me-1"></i>
                Kategori
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => router.push('/financial/categories')}
                  >
                    <i className="bi bi-cash-coin text-success me-2"></i>
                    Kategori Penerimaan
                  </button>
                </li>
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => router.push('/financial/pembayaran-categories')}
                  >
                    <i className="bi bi-cash-stack text-danger me-2"></i>
                    Kategori Pembayaran
                  </button>
                </li>
              </ul>
            </div>
            <button
              className="btn btn-info me-2"
              onClick={() => router.push('/financial/keywords')}
              title="Urus keyword untuk auto-kategorisasi"
            >
              <i className="bi bi-key me-1"></i>
              Urus Keyword
            </button>
            <button
              className="btn btn-success"
              onClick={() => handleAutoCategorize(true)}
              disabled={autoCategorizing || uncategorizedCount === 0}
              title="Jana kategori secara automatik berdasarkan keyword"
            >
              {autoCategorizing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Memproses...
                </>
              ) : (
                <>
                  <i className="bi bi-magic me-1"></i>
                  Jana Kategori
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bulk Action Bar - shows when items selected */}
        {selectedIds.size > 0 && canEdit && (
          <div className="alert alert-primary d-flex justify-content-between align-items-center mb-3">
            <div>
              <i className="bi bi-check2-square me-2"></i>
              <strong>{selectedIds.size}</strong> transaksi dipilih
            </div>
            <div>
              <button
                className="btn btn-primary me-2"
                onClick={openBulkModal}
              >
                <i className="bi bi-tags me-2"></i>
                Kategorikan Terpilih
              </button>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSelectedIds(new Set())}
              >
                <i className="bi bi-x-lg me-1"></i>
                Batal Pilihan
              </button>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="card">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm table-hover">
                <thead className="table-light sticky-top">
                  <tr>
                    {canEdit && (
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={currentTransactions.length > 0 && currentTransactions.every(t => selectedIds.has(t.id))}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          title="Pilih semua di halaman ini"
                        />
                      </th>
                    )}
                    <th
                      style={{ width: '100px', cursor: 'pointer' }}
                      onClick={toggleSortOrder}
                      title="Klik untuk tukar susunan"
                    >
                      Tarikh
                      <i className={`bi bi-arrow-${sortOrder === 'desc' ? 'down' : 'up'} ms-1`}></i>
                    </th>
                    <th style={{ width: '120px' }}>No. EFT</th>
                    <th>Penerangan</th>
                    <th style={{ width: '180px' }}>Nama Pengirim/Penerima</th>
                    <th style={{ width: '180px' }}>Butiran Pembayaran</th>
                    <th style={{ width: '120px' }} className="text-end">Debit (RM)</th>
                    <th style={{ width: '120px' }} className="text-end">Kredit (RM)</th>
                    <th style={{ width: '100px' }}>Jenis</th>
                    <th style={{ width: '200px' }}>
                      <div className="d-flex align-items-center gap-1">
                        <span>Kategori</span>
                        <select
                          className="form-select form-select-sm"
                          style={{ width: 'auto', fontSize: '11px', padding: '2px 24px 2px 6px' }}
                          value={categoryFilter}
                          onChange={(e) => {
                            e.stopPropagation();
                            setCategoryFilter(e.target.value);
                            setCurrentPage(1);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">Semua</option>
                          {availableCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        {categoryFilter && (
                          <button
                            className="btn btn-link btn-sm p-0 text-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCategoryFilter('');
                              setCurrentPage(1);
                            }}
                            title="Reset filter"
                          >
                            <i className="bi bi-x-circle"></i>
                          </button>
                        )}
                      </div>
                    </th>
                    <th style={{ width: '120px' }}>Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={canEdit ? 11 : 10} className="text-center py-4 text-muted">
                        Tiada transaksi dijumpai
                      </td>
                    </tr>
                  ) : (
                    currentTransactions.map((transaction) => (
                      <tr key={transaction.id} className={selectedIds.has(transaction.id) ? 'table-primary' : ''}>
                        {canEdit && (
                          <td>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedIds.has(transaction.id)}
                              onChange={(e) => handleSelectOne(transaction.id, e.target.checked)}
                            />
                          </td>
                        )}
                        <td>
                          <small>
                            {new Date(transaction.transaction_date).toLocaleDateString('ms-MY', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </small>
                        </td>
                        <td>
                          <small>{transaction.customer_eft_no || '-'}</small>
                        </td>
                        <td>
                          <small>{transaction.transaction_description || '-'}</small>
                        </td>
                        <td><small>{transaction.sender_recipient_name || '-'}</small></td>
                        <td>
                          <small className="text-muted">{transaction.payment_details || '-'}</small>
                        </td>
                        <td className="text-end">
                          {transaction.debit_amount ? (
                            <span className="text-danger fw-bold">
                              {formatCurrency(transaction.debit_amount)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="text-end">
                          {transaction.credit_amount ? (
                            <span className="text-success fw-bold">
                              {formatCurrency(transaction.credit_amount)}
                            </span>
                          ) : '-'}
                        </td>
                        <td>
                          {transaction.credit_amount && transaction.credit_amount > 0 ? (
                            <span className="badge bg-success">Terima</span>
                          ) : transaction.debit_amount && transaction.debit_amount > 0 ? (
                            <span className="badge bg-danger">Bayar</span>
                          ) : (
                            <span className="badge bg-secondary">-</span>
                          )}
                        </td>
                        <td>
                          <small>
                            {transaction.category_penerimaan || transaction.category_pembayaran || '-'}
                          </small>
                          {transaction.bulan_perkiraan && transaction.bulan_perkiraan !== 'bulan_semasa' && (
                            <span
                              className={`badge ms-1 ${
                                transaction.bulan_perkiraan === 'bulan_sebelum'
                                  ? 'bg-warning text-dark'
                                  : 'bg-info'
                              }`}
                              title={transaction.bulan_perkiraan === 'bulan_sebelum' ? 'Bawa ke bulan sebelum' : 'Bawa ke bulan depan'}
                            >
                              {transaction.bulan_perkiraan === 'bulan_sebelum' ? (
                                <><i className="bi bi-arrow-left"></i></>
                              ) : (
                                <><i className="bi bi-arrow-right"></i></>
                              )}
                            </span>
                          )}
                        </td>
                        <td>
                          {canEdit && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleCategorize(transaction)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3 px-3">
                <div className="text-muted">
                  Menunjukkan {startIndex + 1} hingga {Math.min(endIndex, sortedTransactions.length)} daripada {sortedTransactions.length} transaksi
                </div>
                <nav>
                  <ul className="pagination mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="bi bi-chevron-left"></i>
                      </button>
                    </li>

                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <li className="page-item">
                          <button className="page-link" onClick={() => handlePageChange(1)}>
                            1
                          </button>
                        </li>
                        {currentPage > 4 && (
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )}
                      </>
                    )}

                    {/* Page numbers around current page */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === currentPage ||
                               page === currentPage - 1 ||
                               page === currentPage + 1 ||
                               page === currentPage - 2 ||
                               page === currentPage + 2;
                      })
                      .map(page => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => handlePageChange(page)}>
                            {page}
                          </button>
                        </li>
                      ))}

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <li className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        )}
                        <li className="page-item">
                          <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                            {totalPages}
                          </button>
                        </li>
                      </>
                    )}

                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categorize Modal */}
      {showCategorizeModal && selectedTransaction && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-tags me-2"></i>
                  Kategorikan Transaksi
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowCategorizeModal(false);
                    resetForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleSaveCategorization}>
                <div className="modal-body">
                  {/* Transaction Details */}
                  <div className="alert alert-info">
                    <strong>Tarikh:</strong> {new Date(selectedTransaction.transaction_date).toLocaleDateString('ms-MY')}<br/>
                    <strong>Penerangan:</strong> {selectedTransaction.transaction_description}<br/>
                    <strong>Nama:</strong> {selectedTransaction.sender_recipient_name}<br/>
                    <strong>Jumlah:</strong> {' '}
                    {selectedTransaction.credit_amount ? (
                      <span className="text-success fw-bold">+{formatCurrency(selectedTransaction.credit_amount)}</span>
                    ) : (
                      <span className="text-danger fw-bold">-{formatCurrency(selectedTransaction.debit_amount)}</span>
                    )}
                  </div>

                  {/* Transaction Type */}
                  <div className="mb-3">
                    <label className="form-label">Jenis Transaksi</label>
                    <div className="btn-group w-100" role="group">
                      <input
                        type="radio"
                        className="btn-check"
                        name="transactionType"
                        id="typePenerimaan"
                        checked={transactionType === 'penerimaan'}
                        onChange={() => setTransactionType('penerimaan')}
                      />
                      <label className="btn btn-outline-success" htmlFor="typePenerimaan">
                        <i className="bi bi-cash-coin me-2"></i>
                        Penerimaan
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="transactionType"
                        id="typePembayaran"
                        checked={transactionType === 'pembayaran'}
                        onChange={() => setTransactionType('pembayaran')}
                      />
                      <label className="btn btn-outline-danger" htmlFor="typePembayaran">
                        <i className="bi bi-cash-stack me-2"></i>
                        Pembayaran
                      </label>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="mb-3">
                    <label className="form-label">Kategori</label>
                    {transactionType === 'penerimaan' ? (
                      loadingCategories ? (
                        <div className="text-center py-2">
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Memuat kategori...
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          value={categoryPenerimaan}
                          onChange={(e) => {
                            const newCategoryName = e.target.value;
                            setCategoryPenerimaan(newCategoryName);

                            // Find the category object
                            const category = penerimaanCategories.find(c => c.nama_kategori === newCategoryName);
                            setSelectedCategory(category || null);

                            // Reset sub-category and investment fields when category changes
                            setSubCategoryPenerimaan('');
                            setInvestmentType('');
                            setInvestmentInstitution('');
                          }}
                          required
                        >
                          <option value="">Pilih Kategori Penerimaan</option>
                          {penerimaanCategories.map((cat) => (
                            <option key={cat.id} value={cat.nama_kategori}>
                              {cat.nama_kategori}
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      loadingPembayaranCategories ? (
                        <div className="text-center py-2">
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Memuat kategori...
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          value={categoryPembayaran}
                          onChange={(e) => handlePembayaranCategoryChange(e.target.value)}
                          required
                        >
                          <option value="">Pilih Kategori Pembayaran</option>
                          {pembayaranCategories.map((cat) => (
                            <option key={cat.id} value={cat.nama_kategori}>{cat.nama_kategori}</option>
                          ))}
                        </select>
                      )
                    )}
                  </div>

                  {/* Sub-Category Selection (for applicable Penerimaan categories) */}
                  {transactionType === 'penerimaan' && selectedCategory && hasSubCategoriesDynamic(selectedCategory) && (
                    <div className="mb-3">
                      <label className="form-label">Sub-Kategori</label>
                      <select
                        className="form-select"
                        value={subCategoryPenerimaan}
                        onChange={(e) => setSubCategoryPenerimaan(e.target.value)}
                      >
                        <option value="">Pilih Sub-Kategori (Opsional)</option>
                        {getSubCategoriesDynamic(selectedCategory).map((subCat) => (
                          <option key={subCat} value={subCat}>{subCat}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sub-Kategori 1 Pembayaran */}
                  {transactionType === 'pembayaran' && categoryPembayaran && subCategories1.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label">Sub-Kategori 1</label>
                      <select
                        className="form-select"
                        value={subCategory1Pembayaran}
                        onChange={(e) => handleSubCategory1Change(e.target.value)}
                      >
                        <option value="">Pilih Sub-Kategori 1 (Opsional)</option>
                        {subCategories1.map((sub) => (
                          <option key={sub.id} value={sub.nama_subkategori}>{sub.nama_subkategori}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sub-Kategori 2 Pembayaran */}
                  {transactionType === 'pembayaran' && subCategory1Pembayaran && subCategories2.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label">Sub-Kategori 2</label>
                      <select
                        className="form-select"
                        value={subCategory2Pembayaran}
                        onChange={(e) => setSubCategory2Pembayaran(e.target.value)}
                      >
                        <option value="">Pilih Sub-Kategori 2 (Opsional)</option>
                        {subCategories2.map((sub) => (
                          <option key={sub.id} value={sub.nama_subkategori}>{sub.nama_subkategori}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Investment Fields (for categories with perlu_maklumat_pelaburan flag) */}
                  {transactionType === 'penerimaan' && selectedCategory && requiresInvestmentFieldsDynamic(selectedCategory) && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Jenis Pelaburan</label>
                        <input
                          type="text"
                          className="form-control"
                          value={investmentType}
                          onChange={(e) => setInvestmentType(e.target.value)}
                          placeholder="Contoh: Fixed Deposit, ASB, Saham, dll"
                        />
                        <small className="text-muted">Jenis pelaburan atau instrumen kewangan</small>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Institusi Pelaburan</label>
                        <input
                          type="text"
                          className="form-control"
                          value={investmentInstitution}
                          onChange={(e) => setInvestmentInstitution(e.target.value)}
                          placeholder="Contoh: Maybank, CIMB, Tabung Haji, dll"
                        />
                        <small className="text-muted">Nama bank atau institusi kewangan</small>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  <div className="mb-3">
                    <label className="form-label">Nota (Opsional)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Tambah nota jika perlu..."
                    ></textarea>
                  </div>

                  {/* Bulan Perkiraan - Reconciliation Indicator */}
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-calendar-check me-2"></i>
                      Bulan Perkiraan (Reconciliation)
                    </label>
                    <div className="btn-group w-100" role="group">
                      <input
                        type="radio"
                        className="btn-check"
                        name="bulanPerkiraan"
                        id="bulanSebelum"
                        checked={bulanPerkiraan === 'bulan_sebelum'}
                        onChange={() => setBulanPerkiraan('bulan_sebelum')}
                      />
                      <label className="btn btn-outline-warning" htmlFor="bulanSebelum">
                        <i className="bi bi-arrow-left me-1"></i>
                        Bulan Sebelum
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="bulanPerkiraan"
                        id="bulanSemasa"
                        checked={bulanPerkiraan === 'bulan_semasa'}
                        onChange={() => setBulanPerkiraan('bulan_semasa')}
                      />
                      <label className="btn btn-outline-primary" htmlFor="bulanSemasa">
                        <i className="bi bi-calendar-check me-1"></i>
                        Bulan Semasa
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="bulanPerkiraan"
                        id="bulanDepan"
                        checked={bulanPerkiraan === 'bulan_depan'}
                        onChange={() => setBulanPerkiraan('bulan_depan')}
                      />
                      <label className="btn btn-outline-info" htmlFor="bulanDepan">
                        Bulan Depan
                        <i className="bi bi-arrow-right ms-1"></i>
                      </label>
                    </div>
                    <small className="text-muted d-block mt-1">
                      Pilih jika transaksi perlu dibawa ke bulan lain untuk reconciliation akaun
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowCategorizeModal(false);
                      resetForm();
                    }}
                    disabled={categorizing}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={categorizing}
                  >
                    {categorizing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Simpan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Categorize Modal */}
      {showBulkModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-tags me-2"></i>
                  Kategorikan {selectedIds.size} Transaksi
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowBulkModal(false);
                    resetBulkForm();
                  }}
                ></button>
              </div>
              <form onSubmit={handleBulkCategorize}>
                <div className="modal-body">
                  {/* Selected Count Info */}
                  <div className="alert alert-info">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>{selectedIds.size}</strong> transaksi dipilih akan dikategorikan dengan kategori yang sama.
                  </div>

                  {/* Transaction Type */}
                  <div className="mb-3">
                    <label className="form-label">Jenis Transaksi</label>
                    <div className="btn-group w-100" role="group">
                      <input
                        type="radio"
                        className="btn-check"
                        name="bulkTransactionType"
                        id="bulkTypePenerimaan"
                        checked={bulkTransactionType === 'penerimaan'}
                        onChange={() => {
                          setBulkTransactionType('penerimaan');
                          setBulkCategoryPembayaran('');
                          setBulkSubCategory1Pembayaran('');
                          setBulkSubCategory2Pembayaran('');
                        }}
                      />
                      <label className="btn btn-outline-success" htmlFor="bulkTypePenerimaan">
                        <i className="bi bi-cash-coin me-2"></i>
                        Penerimaan
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="bulkTransactionType"
                        id="bulkTypePembayaran"
                        checked={bulkTransactionType === 'pembayaran'}
                        onChange={() => {
                          setBulkTransactionType('pembayaran');
                          setBulkCategoryPenerimaan('');
                          setBulkSelectedCategory(null);
                          setBulkSubCategoryPenerimaan('');
                        }}
                      />
                      <label className="btn btn-outline-danger" htmlFor="bulkTypePembayaran">
                        <i className="bi bi-cash-stack me-2"></i>
                        Pembayaran
                      </label>
                    </div>
                  </div>

                  {/* Category Selection */}
                  <div className="mb-3">
                    <label className="form-label">Kategori</label>
                    {bulkTransactionType === 'penerimaan' ? (
                      loadingCategories ? (
                        <div className="text-center py-2">
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Memuat kategori...
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          value={bulkCategoryPenerimaan}
                          onChange={(e) => {
                            const newCategoryName = e.target.value;
                            setBulkCategoryPenerimaan(newCategoryName);
                            const category = penerimaanCategories.find(c => c.nama_kategori === newCategoryName);
                            setBulkSelectedCategory(category || null);
                            setBulkSubCategoryPenerimaan('');
                            setBulkInvestmentType('');
                            setBulkInvestmentInstitution('');
                          }}
                          required
                        >
                          <option value="">Pilih Kategori Penerimaan</option>
                          {penerimaanCategories.map((cat) => (
                            <option key={cat.id} value={cat.nama_kategori}>
                              {cat.nama_kategori}
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      loadingPembayaranCategories ? (
                        <div className="text-center py-2">
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Memuat kategori...
                        </div>
                      ) : (
                        <select
                          className="form-select"
                          value={bulkCategoryPembayaran}
                          onChange={(e) => handleBulkPembayaranCategoryChange(e.target.value)}
                          required
                        >
                          <option value="">Pilih Kategori Pembayaran</option>
                          {pembayaranCategories.map((cat) => (
                            <option key={cat.id} value={cat.nama_kategori}>{cat.nama_kategori}</option>
                          ))}
                        </select>
                      )
                    )}
                  </div>

                  {/* Sub-Category Selection (for applicable Penerimaan categories) */}
                  {bulkTransactionType === 'penerimaan' && bulkSelectedCategory && hasSubCategoriesDynamic(bulkSelectedCategory) && (
                    <div className="mb-3">
                      <label className="form-label">Sub-Kategori</label>
                      <select
                        className="form-select"
                        value={bulkSubCategoryPenerimaan}
                        onChange={(e) => setBulkSubCategoryPenerimaan(e.target.value)}
                      >
                        <option value="">Pilih Sub-Kategori (Opsional)</option>
                        {getSubCategoriesDynamic(bulkSelectedCategory).map((subCat) => (
                          <option key={subCat} value={subCat}>{subCat}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sub-Kategori 1 Pembayaran */}
                  {bulkTransactionType === 'pembayaran' && bulkCategoryPembayaran && bulkSubCategories1.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label">Sub-Kategori 1</label>
                      <select
                        className="form-select"
                        value={bulkSubCategory1Pembayaran}
                        onChange={(e) => handleBulkSubCategory1Change(e.target.value)}
                      >
                        <option value="">Pilih Sub-Kategori 1 (Opsional)</option>
                        {bulkSubCategories1.map((sub) => (
                          <option key={sub.id} value={sub.nama_subkategori}>{sub.nama_subkategori}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sub-Kategori 2 Pembayaran */}
                  {bulkTransactionType === 'pembayaran' && bulkSubCategory1Pembayaran && bulkSubCategories2.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label">Sub-Kategori 2</label>
                      <select
                        className="form-select"
                        value={bulkSubCategory2Pembayaran}
                        onChange={(e) => setBulkSubCategory2Pembayaran(e.target.value)}
                      >
                        <option value="">Pilih Sub-Kategori 2 (Opsional)</option>
                        {bulkSubCategories2.map((sub) => (
                          <option key={sub.id} value={sub.nama_subkategori}>{sub.nama_subkategori}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Investment Fields (for categories with perlu_maklumat_pelaburan flag) */}
                  {bulkTransactionType === 'penerimaan' && bulkSelectedCategory && requiresInvestmentFieldsDynamic(bulkSelectedCategory) && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Jenis Pelaburan</label>
                        <input
                          type="text"
                          className="form-control"
                          value={bulkInvestmentType}
                          onChange={(e) => setBulkInvestmentType(e.target.value)}
                          placeholder="Contoh: Fixed Deposit, ASB, Saham, dll"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Institusi Pelaburan</label>
                        <input
                          type="text"
                          className="form-control"
                          value={bulkInvestmentInstitution}
                          onChange={(e) => setBulkInvestmentInstitution(e.target.value)}
                          placeholder="Contoh: Maybank, CIMB, Tabung Haji, dll"
                        />
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  <div className="mb-3">
                    <label className="form-label">Nota (Opsional)</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={bulkNotes}
                      onChange={(e) => setBulkNotes(e.target.value)}
                      placeholder="Tambah nota jika perlu..."
                    ></textarea>
                  </div>

                  {/* Bulan Perkiraan */}
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-calendar-check me-2"></i>
                      Bulan Perkiraan
                    </label>
                    <div className="btn-group w-100" role="group">
                      <input
                        type="radio"
                        className="btn-check"
                        name="bulkBulanPerkiraan"
                        id="bulkBulanSebelum"
                        checked={bulkBulanPerkiraan === 'bulan_sebelum'}
                        onChange={() => setBulkBulanPerkiraan('bulan_sebelum')}
                      />
                      <label className="btn btn-outline-warning" htmlFor="bulkBulanSebelum">
                        <i className="bi bi-arrow-left me-1"></i>
                        Bulan Sebelum
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="bulkBulanPerkiraan"
                        id="bulkBulanSemasa"
                        checked={bulkBulanPerkiraan === 'bulan_semasa'}
                        onChange={() => setBulkBulanPerkiraan('bulan_semasa')}
                      />
                      <label className="btn btn-outline-primary" htmlFor="bulkBulanSemasa">
                        <i className="bi bi-calendar-check me-1"></i>
                        Bulan Semasa
                      </label>

                      <input
                        type="radio"
                        className="btn-check"
                        name="bulkBulanPerkiraan"
                        id="bulkBulanDepan"
                        checked={bulkBulanPerkiraan === 'bulan_depan'}
                        onChange={() => setBulkBulanPerkiraan('bulan_depan')}
                      />
                      <label className="btn btn-outline-info" htmlFor="bulkBulanDepan">
                        Bulan Depan
                        <i className="bi bi-arrow-right ms-1"></i>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowBulkModal(false);
                      resetBulkForm();
                    }}
                    disabled={bulkCategorizing}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={bulkCategorizing}
                  >
                    {bulkCategorizing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Simpan ({selectedIds.size} transaksi)
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Categorize Preview Modal */}
      {showAutoPreview && autoPreviewData && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Pratonton Jana Kategori</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowAutoPreview(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>{autoPreviewData.matches_found}</strong> daripada <strong>{autoPreviewData.total_transactions}</strong> transaksi dijumpai padanan dengan keyword.
                </div>

                {autoPreviewData.matches_found > 0 ? (
                  <>
                    <p className="mb-2">Transaksi berikut akan dikategorikan:</p>
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="table table-sm table-bordered">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>No. EFT / Butiran</th>
                            <th>Keyword</th>
                            <th>Kategori</th>
                          </tr>
                        </thead>
                        <tbody>
                          {autoPreviewData.updates.map((update: any, index: number) => (
                            <tr key={index}>
                              <td>
                                <small className="text-muted d-block">
                                  {update.search_text.substring(0, 80)}...
                                </small>
                              </td>
                              <td>
                                <span className="badge bg-secondary">{update.matched_keyword}</span>
                              </td>
                              <td>
                                {update.category_penerimaan && (
                                  <span className="badge bg-success">{update.category_penerimaan}</span>
                                )}
                                {update.category_pembayaran && (
                                  <span className="badge bg-danger">{update.category_pembayaran}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="alert alert-warning">
                    Tiada transaksi yang sepadan dengan keyword. Cuba tambah keyword baru di halaman Urus Keyword.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAutoPreview(false)}
                >
                  Batal
                </button>
                {autoPreviewData.matches_found > 0 && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={handleApplyAutoCategorize}
                    disabled={autoCategorizing}
                  >
                    {autoCategorizing ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        Teruskan ({autoPreviewData.matches_found} transaksi)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
