'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface TransaksiPerkiraan {
  id: number;
  transaction_date: string;
  payment_details: string;
  customer_eft_no: string;
  credit_amount: number;
  debit_amount: number;
  bulan_perkiraan: string;
  jenis_transaksi?: 'penerimaan' | 'pembayaran';
  sumber_bulan?: 'bulan_semasa' | 'bulan_lepas' | 'bulan_hadapan';
}

interface PenyesuaianData {
  id: number | null;
  tahun: number;
  bulan: number;
  baki_penyata_bank: number;
  caj_bank: number;
  komisen_bank: number;
  cek_tak_laku: number;
  lain_lain_pendahuluan: number;
  dividen_hibah: number;
  nota: string | null;
  terimaan_belum_dimasukkan: number;
  cek_belum_dikemukakan: number;
  // CAMPUR: Terimaan bulan semasa dengan bulan_perkiraan (ada dalam bank, tiada dalam buku tunai)
  transaksi_terimaan_campur: TransaksiPerkiraan[];
  // TOLAK: Pembayaran bulan semasa dengan bulan_perkiraan (ada dalam bank, tiada dalam buku tunai)
  transaksi_pembayaran_tolak: TransaksiPerkiraan[];
  // TOLAK: Transaksi dari bulan lain (tiada dalam bank, ada dalam buku tunai)
  transaksi_dari_bulan_lain: TransaksiPerkiraan[];
  // Auto-calculated values from API
  calculated_bank_closing: number;
  bank_opening_balance: number;
  total_bank_credit: number;
  total_bank_debit: number;
  // Actual bank statement closing balance
  closing_balance_bank: number | null;
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export default function PenyesuaianBankPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<PenyesuaianData>({
    id: null,
    tahun: currentYear,
    bulan: currentMonth,
    baki_penyata_bank: 0,
    caj_bank: 0,
    komisen_bank: 0,
    cek_tak_laku: 0,
    lain_lain_pendahuluan: 0,
    dividen_hibah: 0,
    nota: null,
    terimaan_belum_dimasukkan: 0,
    cek_belum_dikemukakan: 0,
    transaksi_terimaan_campur: [],
    transaksi_pembayaran_tolak: [],
    transaksi_dari_bulan_lain: [],
    calculated_bank_closing: 0,
    bank_opening_balance: 0,
    total_bank_credit: 0,
    total_bank_debit: 0,
    closing_balance_bank: null
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && !['admin', 'bendahari', 'head_imam'].includes(session.user.role)) {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, selectedYear, selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/financial/penyesuaian-bank?tahun=${selectedYear}&bulan=${selectedMonth}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          ...data,
          baki_penyata_bank: Number(data.baki_penyata_bank) || 0,
          caj_bank: Number(data.caj_bank) || 0,
          komisen_bank: Number(data.komisen_bank) || 0,
          cek_tak_laku: Number(data.cek_tak_laku) || 0,
          lain_lain_pendahuluan: Number(data.lain_lain_pendahuluan) || 0,
          dividen_hibah: Number(data.dividen_hibah) || 0,
          terimaan_belum_dimasukkan: Number(data.terimaan_belum_dimasukkan) || 0,
          cek_belum_dikemukakan: Number(data.cek_belum_dikemukakan) || 0,
          transaksi_terimaan_campur: data.transaksi_terimaan_campur || [],
          transaksi_pembayaran_tolak: data.transaksi_pembayaran_tolak || [],
          transaksi_dari_bulan_lain: data.transaksi_dari_bulan_lain || [],
          calculated_bank_closing: Number(data.calculated_bank_closing) || 0,
          bank_opening_balance: Number(data.bank_opening_balance) || 0,
          total_bank_credit: Number(data.total_bank_credit) || 0,
          total_bank_debit: Number(data.total_bank_debit) || 0,
          closing_balance_bank: data.closing_balance_bank !== null ? Number(data.closing_balance_bank) : null
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const res = await fetch('/api/financial/penyesuaian-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tahun: selectedYear,
          bulan: selectedMonth,
          baki_penyata_bank: formData.baki_penyata_bank,
          caj_bank: formData.caj_bank,
          komisen_bank: formData.komisen_bank,
          cek_tak_laku: formData.cek_tak_laku,
          lain_lain_pendahuluan: formData.lain_lain_pendahuluan,
          dividen_hibah: formData.dividen_hibah,
          nota: formData.nota,
          closing_balance_bank: formData.closing_balance_bank
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Data berjaya disimpan' });
        fetchData();
      } else {
        const error = await res.json();
        setMessage({ type: 'error', text: error.error || 'Gagal menyimpan data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Ralat semasa menyimpan data' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // === LOGIK PENYESUAIAN BANK ===
  // Formula: Baki Bank + CAMPUR - TOLAK = Baki Buku Tunai
  //
  // Use actual bank statement closing balance if available, otherwise fall back to calculated value
  const bakiPenyataBank = formData.closing_balance_bank !== null
    ? formData.closing_balance_bank
    : (formData.calculated_bank_closing || formData.baki_penyata_bank);

  // Transaksi dalam BANK bulan ini tapi TIDAK dalam Buku Tunai bulan ini:
  // - Terimaan bulan semasa dengan bulan_sebelum/bulan_depan: Bank LEBIH TINGGI → TOLAK
  // - Pembayaran bulan semasa dengan bulan_sebelum/bulan_depan: Bank LEBIH RENDAH → CAMPUR
  const totalTerimaanBulanSemasa = formData.transaksi_terimaan_campur
    .reduce((sum, t) => sum + Number(t.credit_amount), 0);
  const totalPembayaranBulanSemasa = formData.transaksi_pembayaran_tolak
    .reduce((sum, t) => sum + Number(t.debit_amount), 0);

  // Transaksi TIDAK dalam BANK bulan ini tapi ADA dalam Buku Tunai bulan ini:
  // - Terimaan dari bulan lain: Buku Tunai LEBIH TINGGI → TOLAK dari bank
  // - Pembayaran dari bulan lain: Buku Tunai LEBIH RENDAH → TOLAK dari bank
  const totalTerimaanDariBulanLain = formData.transaksi_dari_bulan_lain
    .filter(t => Number(t.credit_amount) > 0)
    .reduce((sum, t) => sum + Number(t.credit_amount), 0);
  const totalPembayaranDariBulanLain = formData.transaksi_dari_bulan_lain
    .filter(t => Number(t.debit_amount) > 0)
    .reduce((sum, t) => sum + Number(t.debit_amount), 0);

  // Calculate totals
  // CAMPUR: Bank LEBIH RENDAH daripada buku tunai, perlu tambah untuk sama dengan Buku Tunai
  // - Pembayaran bulan semasa dengan perkiraan (ada dalam bank = bank rendah, tiada dalam buku tunai)
  // - Terimaan dari bulan lain (tiada dalam bank, ada dalam buku tunai = buku tunai tinggi = bank rendah)
  const jumlahCampur = formData.terimaan_belum_dimasukkan + formData.caj_bank + formData.komisen_bank + formData.cek_tak_laku + formData.lain_lain_pendahuluan + totalPembayaranBulanSemasa + totalTerimaanDariBulanLain;

  // TOLAK: Bank LEBIH TINGGI daripada buku tunai, perlu tolak untuk sama dengan Buku Tunai
  // - Terimaan bulan semasa dengan perkiraan (ada dalam bank = bank tinggi, tiada dalam buku tunai)
  // - Pembayaran dari bulan lain (tiada dalam bank, ada dalam buku tunai = buku tunai rendah = bank tinggi)
  const jumlahTolak = formData.cek_belum_dikemukakan + formData.dividen_hibah + totalTerimaanBulanSemasa + totalPembayaranDariBulanLain;

  const bakiBukuTunai = bakiPenyataBank + jumlahCampur - jumlahTolak;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const canEdit = session?.user.role === 'admin' || session?.user.role === 'bendahari';

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
        {/* Header - Hide on print */}
        <div className="no-print">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="mb-1">
                <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                Penyata Penyesuaian Bank
              </h4>
              <small className="text-muted">BR-KMS 020</small>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary" onClick={handlePrint}>
                <i className="bi bi-printer me-2"></i>
                Cetak
              </button>
            </div>
          </div>

          {/* Month/Year Selector */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-3">
                  <label className="form-label">Tahun</label>
                  <select
                    className="form-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  >
                    {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label">Bulan</label>
                  <select
                    className="form-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  >
                    {BULAN_NAMES.map((name, index) => (
                      <option key={index + 1} value={index + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6 text-end">
                  {canEdit && (
                    <button
                      className="btn btn-primary"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-save me-2"></i>
                          Simpan
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible`}>
              {message.text}
              <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
            </div>
          )}
        </div>

        {/* Report Content - Printable */}
        <div ref={printRef} className="card">
          <div className="card-body p-4">
            {/* Header */}
            <div className="text-end mb-2">
              <strong>BR-KMS 020</strong>
            </div>

            <div className="text-center mb-4">
              <p className="mb-1">MASJID/SURAU: <u className="px-4">SURAU AR-RAUDHAH PRESINT 18</u></p>
              <p className="mb-0">
                <strong>PENYATA PENYESUAIAN BANK PADA</strong>{' '}
                <u className="px-3">{BULAN_NAMES[selectedMonth - 1]} {selectedYear}</u>
              </p>
            </div>

            {/* Table */}
            <table className="table table-borderless" style={{ maxWidth: '700px', margin: '0 auto' }}>
              <thead>
                <tr>
                  <th style={{ width: '50%' }}></th>
                  <th style={{ width: '25%' }} className="text-end">RM</th>
                  <th style={{ width: '25%' }} className="text-end">RM</th>
                </tr>
              </thead>
              <tbody>
                {/* Baki seperti di penyata bank (actual bank statement closing balance) */}
                <tr>
                  <td>Baki seperti di penyata bank</td>
                  <td></td>
                  <td className="text-end">
                    {canEdit ? (
                      <input
                        type="number"
                        className="form-control form-control-sm text-end no-print-input fw-bold"
                        style={{ maxWidth: '150px', marginLeft: 'auto' }}
                        value={formData.closing_balance_bank !== null ? formData.closing_balance_bank : formData.calculated_bank_closing || ''}
                        onChange={(e) => setFormData({ ...formData, closing_balance_bank: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        title="Baki akhir dari penyata bank sebenar"
                      />
                    ) : (
                      <strong>{formatCurrency(bakiPenyataBank)}</strong>
                    )}
                    <span className="print-only"><strong>{formatCurrency(bakiPenyataBank)}</strong></span>
                  </td>
                </tr>

                {/* (Campur) Header */}
                <tr>
                  <td colSpan={3} className="pt-4"><strong>(Campur)</strong></td>
                </tr>

                {/* Terimaan belum dimasukkan ke bank */}
                <tr>
                  <td className="ps-4">Terimaan belum dimasukkan ke bank</td>
                  <td className="text-end">{formatCurrency(formData.terimaan_belum_dimasukkan)}</td>
                  <td></td>
                </tr>

                {/* Caj bank */}
                <tr>
                  <td className="ps-4">Caj bank</td>
                  <td className="text-end">
                    {canEdit ? (
                      <input
                        type="number"
                        className="form-control form-control-sm text-end no-print-input"
                        style={{ maxWidth: '120px', marginLeft: 'auto' }}
                        value={formData.caj_bank || ''}
                        onChange={(e) => setFormData({ ...formData, caj_bank: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                      />
                    ) : null}
                    <span className="print-only">{formatCurrency(formData.caj_bank)}</span>
                  </td>
                  <td></td>
                </tr>

                {/* Komisen bank */}
                <tr>
                  <td className="ps-4">Komisen bank</td>
                  <td className="text-end">
                    {canEdit ? (
                      <input
                        type="number"
                        className="form-control form-control-sm text-end no-print-input"
                        style={{ maxWidth: '120px', marginLeft: 'auto' }}
                        value={formData.komisen_bank || ''}
                        onChange={(e) => setFormData({ ...formData, komisen_bank: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                      />
                    ) : null}
                    <span className="print-only">{formatCurrency(formData.komisen_bank)}</span>
                  </td>
                  <td></td>
                </tr>

                {/* Cek tak laku */}
                <tr>
                  <td className="ps-4">Cek tak laku</td>
                  <td className="text-end">
                    {canEdit ? (
                      <input
                        type="number"
                        className="form-control form-control-sm text-end no-print-input"
                        style={{ maxWidth: '120px', marginLeft: 'auto' }}
                        value={formData.cek_tak_laku || ''}
                        onChange={(e) => setFormData({ ...formData, cek_tak_laku: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                      />
                    ) : null}
                    <span className="print-only">{formatCurrency(formData.cek_tak_laku)}</span>
                  </td>
                  <td></td>
                </tr>

                {/* Lain-lain Pendahuluan */}
                <tr>
                  <td className="ps-4">Lain-lain Pendahuluan</td>
                  <td className="text-end">
                    {canEdit ? (
                      <input
                        type="number"
                        className="form-control form-control-sm text-end no-print-input"
                        style={{ maxWidth: '120px', marginLeft: 'auto' }}
                        value={formData.lain_lain_pendahuluan || ''}
                        onChange={(e) => setFormData({ ...formData, lain_lain_pendahuluan: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                      />
                    ) : null}
                    <span className="print-only">{formatCurrency(formData.lain_lain_pendahuluan)}</span>
                  </td>
                  <td></td>
                </tr>

                {/* Pembayaran bulan semasa dengan bulan_perkiraan (CAMPUR - ada dalam bank = bank rendah, tiada dalam buku tunai) */}
                {formData.transaksi_pembayaran_tolak.map((t) => {
                  const amount = Number(t.debit_amount);
                  const perkiraanLabel = t.bulan_perkiraan === 'bulan_sebelum' ? 'kira ke bulan sebelum' : 'kira ke bulan depan';

                  return (
                    <tr key={`campur-pembayaran-${t.id}`}>
                      <td className="ps-4" style={{ fontSize: '0.9em' }}>
                        Pembayaran ({perkiraanLabel}): {t.payment_details || t.customer_eft_no || '-'}
                      </td>
                      <td className="text-end">{formatCurrency(amount)}</td>
                      <td></td>
                    </tr>
                  );
                })}

                {/* Terimaan dari bulan lain yang dikira dalam bulan ini (CAMPUR - tiada dalam bank, ada dalam buku tunai = bank rendah) */}
                {formData.transaksi_dari_bulan_lain
                  .filter(t => Number(t.credit_amount) > 0)
                  .map((t) => {
                    const amount = Number(t.credit_amount);
                    const sumberLabel = t.sumber_bulan === 'bulan_lepas' ? 'dari bulan lepas' : 'dari bulan hadapan';

                    return (
                      <tr key={`campur-terimaan-lain-${t.id}`}>
                        <td className="ps-4" style={{ fontSize: '0.9em' }}>
                          Terimaan ({sumberLabel}): {t.payment_details || t.customer_eft_no || '-'}
                        </td>
                        <td className="text-end">{formatCurrency(amount)}</td>
                        <td></td>
                      </tr>
                    );
                  })}

                {/* Jumlah Campur */}
                <tr>
                  <td></td>
                  <td></td>
                  <td className="text-end">{formatCurrency(jumlahCampur)}</td>
                </tr>

                {/* (Tolak) Header */}
                <tr>
                  <td colSpan={3} className="pt-3"><strong>(Tolak)</strong></td>
                </tr>

                {/* Cek belum dikemukakan ke bank */}
                <tr>
                  <td className="ps-4">Cek belum dikemukakan ke bank</td>
                  <td className="text-end">( {formatCurrency(formData.cek_belum_dikemukakan)} )</td>
                  <td></td>
                </tr>

                {/* Dividen/hibah */}
                <tr>
                  <td className="ps-4">Dividen / hibah</td>
                  <td className="text-end">
                    {canEdit ? (
                      <div className="d-flex align-items-center justify-content-end">
                        <span>(</span>
                        <input
                          type="number"
                          className="form-control form-control-sm text-end no-print-input mx-1"
                          style={{ maxWidth: '100px' }}
                          value={formData.dividen_hibah || ''}
                          onChange={(e) => setFormData({ ...formData, dividen_hibah: parseFloat(e.target.value) || 0 })}
                          step="0.01"
                        />
                        <span>)</span>
                      </div>
                    ) : null}
                    <span className="print-only">( {formatCurrency(formData.dividen_hibah)} )</span>
                  </td>
                  <td></td>
                </tr>

                {/* Terimaan bulan semasa dengan bulan_perkiraan (TOLAK - ada dalam bank = bank tinggi, tiada dalam buku tunai) */}
                {formData.transaksi_terimaan_campur.map((t) => {
                  const amount = Number(t.credit_amount);
                  const perkiraanLabel = t.bulan_perkiraan === 'bulan_sebelum' ? 'kira ke bulan sebelum' : 'kira ke bulan depan';

                  return (
                    <tr key={`tolak-terimaan-${t.id}`}>
                      <td className="ps-4" style={{ fontSize: '0.9em' }}>
                        Terimaan ({perkiraanLabel}): {t.payment_details || t.customer_eft_no || '-'}
                      </td>
                      <td className="text-end">( {formatCurrency(amount)} )</td>
                      <td></td>
                    </tr>
                  );
                })}

                {/* Pembayaran dari bulan lain yang dikira dalam bulan ini (TOLAK - tiada dalam bank, ada dalam buku tunai = bank tinggi) */}
                {formData.transaksi_dari_bulan_lain
                  .filter(t => Number(t.debit_amount) > 0)
                  .map((t) => {
                    const amount = Number(t.debit_amount);
                    const sumberLabel = t.sumber_bulan === 'bulan_lepas' ? 'dari bulan lepas' : 'dari bulan hadapan';

                    return (
                      <tr key={`tolak-pembayaran-lain-${t.id}`}>
                        <td className="ps-4" style={{ fontSize: '0.9em' }}>
                          Pembayaran ({sumberLabel}): {t.payment_details || t.customer_eft_no || '-'}
                        </td>
                        <td className="text-end">( {formatCurrency(amount)} )</td>
                        <td></td>
                      </tr>
                    );
                  })}

                {/* Jumlah Tolak */}
                <tr>
                  <td></td>
                  <td></td>
                  <td className="text-end">( {formatCurrency(jumlahTolak)} )</td>
                </tr>

                {/* Baki seperti di buku tunai */}
                <tr>
                  <td className="pt-4"><strong>Baki seperti di buku tunai</strong></td>
                  <td></td>
                  <td className="text-end pt-4" style={{ borderTop: '2px solid #000', borderBottom: '3px double #000' }}>
                    <strong>{formatCurrency(bakiBukuTunai)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Footer note */}
            <div className="text-center mt-5 pt-4" style={{ fontSize: '11px', borderTop: '1px solid #000' }}>
              <em>"Perbuatan salahguna kuasa penyelewengan dan mengemukakan tuntutan palsu adalah<br/>
              kesalahan di bawah Akta Suruhanjaya Pencegahan Rasuah Malaysia 2009".</em>
            </div>
          </div>
        </div>

        {/* Notes Section - No print */}
        {canEdit && (
          <div className="card mt-4 no-print">
            <div className="card-body">
              <label className="form-label">
                <i className="bi bi-sticky me-2"></i>
                Nota Tambahan
              </label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.nota || ''}
                onChange={(e) => setFormData({ ...formData, nota: e.target.value })}
                placeholder="Masukkan nota jika perlu..."
              ></textarea>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="card mt-4 no-print">
          <div className="card-body">
            <h6 className="card-title">
              <i className="bi bi-info-circle me-2"></i>
              Maklumat
            </h6>
            <ul className="mb-0 small text-muted">
              <li><strong>Terimaan belum dimasukkan ke bank:</strong> Nilai terimaan dari bulan lepas yang ditandakan "Bawa ke Bulan Depan"</li>
              <li><strong>Cek belum dikemukakan ke bank:</strong> Nilai pembayaran dari bulan lepas yang ditandakan "Bawa ke Bulan Depan"</li>
              <li>Nilai-nilai ini dikira secara automatik berdasarkan transaksi yang ditandakan di senarai transaksi</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media print {
          .no-print, .no-print * {
            display: none !important;
          }
          .no-print-input {
            display: none !important;
          }
          .print-only {
            display: inline !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
        @media screen {
          .print-only {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
