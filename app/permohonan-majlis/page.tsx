'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import PublicFooter from '@/components/PublicFooter';

const PERALATAN_OPTIONS = [
  { id: 'meja_makan', label: 'Meja Makan' },
  { id: 'kerusi_makan', label: 'Kerusi Makan' },
  { id: 'pa_system', label: 'PA System' },
  { id: 'pinggan', label: 'Pinggan' },
  { id: 'gelas', label: 'Gelas' },
  { id: 'perkhidmatan_katering', label: 'Perkhidmatan Katering' },
];

const HARI_OPTIONS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

export default function PermohonanMajlisPage() {
  const [formData, setFormData] = useState({
    nama_pemohon: '',
    no_kad_pengenalan: '',
    alamat: '',
    no_telefon_rumah: '',
    no_handphone: '',
    tajuk_majlis: '',
    tarikh_majlis: '',
    hari_majlis: '',
    masa_majlis: '',
    waktu_majlis: '',
    jumlah_jemputan: '',
    peralatan: [] as string[],
    peralatan_lain: '',
    bersetuju_terma: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePeralatanChange = (id: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      peralatan: checked
        ? [...prev.peralatan, id]
        : prev.peralatan.filter(p => p !== id)
    }));
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setFormData(prev => ({ ...prev, tarikh_majlis: date }));

    if (date) {
      // Auto-detect day of week
      const dayOfWeek = new Date(date).getDay();
      const hariMap = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
      setFormData(prev => ({ ...prev, tarikh_majlis: date, hari_majlis: hariMap[dayOfWeek] }));

      // Check existing bookings
      try {
        const res = await fetch(`/api/permohonan-majlis?check_date=${date}`);
        const data = await res.json();
        setExistingBookings(data.bookings || []);
      } catch (err) {
        console.error('Error checking date:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.bersetuju_terma) {
      setError('Sila setuju dengan terma dan syarat untuk meneruskan permohonan.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/permohonan-majlis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghantar permohonan');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Gagal menghantar permohonan. Sila cuba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-vh-100 bg-light py-5">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div className="card shadow-sm">
                <div className="card-body text-center py-5">
                  <div className="mb-4">
                    <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '4rem' }}></i>
                  </div>
                  <h3 className="text-success mb-3">Permohonan Berjaya Dihantar!</h3>
                  <p className="text-muted mb-4">
                    Terima kasih atas permohonan anda. Pihak pengurusan Surau Ar-Raudhah akan
                    menghubungi anda selepas permohonan diproses.
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    <Link href="/" className="btn btn-outline-secondary">
                      <i className="bi bi-arrow-left me-2"></i>
                      Kembali ke Laman Utama
                    </Link>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSuccess(false);
                        setFormData({
                          nama_pemohon: '',
                          no_kad_pengenalan: '',
                          alamat: '',
                          no_telefon_rumah: '',
                          no_handphone: '',
                          tajuk_majlis: '',
                          tarikh_majlis: '',
                          hari_majlis: '',
                          masa_majlis: '',
                          waktu_majlis: '',
                          jumlah_jemputan: '',
                          peralatan: [],
                          peralatan_lain: '',
                          bersetuju_terma: false
                        });
                      }}
                    >
                      Buat Permohonan Baru
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        {/* Back Button */}
        <div className="mb-3">
          <Link href="/" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Kembali
          </Link>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow-sm">
              {/* Header */}
              <div className="card-header bg-white border-bottom-0 pt-4">
                <div className="text-center mb-3">
                  <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                    <Image
                      src="/logo-surau.png"
                      alt="Logo Surau Ar-Raudhah"
                      width={80}
                      height={80}
                      style={{ objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="text-start">
                      <h4 className="mb-0 fw-bold" style={{ color: '#8B0000' }}>SURAU AR-RAUDHAH</h4>
                      <small className="text-muted">
                        Lot 41907, Jalan Impian Makmur 3,<br />
                        Saujana Impian, 43000 Kajang, Selangor Darul Ehsan
                      </small>
                    </div>
                  </div>
                  <hr />
                  <h5 className="fw-bold text-dark mb-0">BORANG KEBENARAN MENGADAKAN MAJLIS</h5>
                  <h5 className="fw-bold text-dark">DI SURAU AR-RAUDHAH</h5>
                </div>
              </div>

              <div className="card-body px-4 pb-4">
                {error && (
                  <div className="alert alert-danger">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* Applicant Details */}
                  <div className="mb-4">
                    <h6 className="text-secondary border-bottom pb-2 mb-3">
                      <i className="bi bi-person me-2"></i>Maklumat Pemohon
                    </h6>

                    <div className="mb-3">
                      <label className="form-label">Nama Penuh <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="nama_pemohon"
                        value={formData.nama_pemohon}
                        onChange={handleInputChange}
                        required
                        placeholder="Nama seperti dalam kad pengenalan"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">No. Kad Pengenalan <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="no_kad_pengenalan"
                        value={formData.no_kad_pengenalan}
                        onChange={handleInputChange}
                        required
                        placeholder="Contoh: 800101-01-1234"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Alamat <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleInputChange}
                        required
                        rows={2}
                        placeholder="Alamat penuh"
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">No. Telefon Rumah</label>
                        <input
                          type="tel"
                          className="form-control"
                          name="no_telefon_rumah"
                          value={formData.no_telefon_rumah}
                          onChange={handleInputChange}
                          placeholder="Contoh: 03-12345678"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">No. Handphone <span className="text-danger">*</span></label>
                        <input
                          type="tel"
                          className="form-control"
                          name="no_handphone"
                          value={formData.no_handphone}
                          onChange={handleInputChange}
                          required
                          placeholder="Contoh: 012-3456789"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="mb-4">
                    <h6 className="text-secondary border-bottom pb-2 mb-3">
                      <i className="bi bi-calendar-event me-2"></i>Maklumat Majlis
                    </h6>

                    <div className="mb-3">
                      <label className="form-label">Tajuk Majlis / Program <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        className="form-control"
                        name="tajuk_majlis"
                        value={formData.tajuk_majlis}
                        onChange={handleInputChange}
                        required
                        placeholder="Contoh: Majlis Akad Nikah / Kenduri Kesyukuran"
                      />
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tarikh Majlis <span className="text-danger">*</span></label>
                        <input
                          type="date"
                          className="form-control"
                          name="tarikh_majlis"
                          value={formData.tarikh_majlis}
                          onChange={handleDateChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Hari Majlis</label>
                        <input
                          type="text"
                          className="form-control"
                          name="hari_majlis"
                          value={formData.hari_majlis}
                          readOnly
                          placeholder="Auto-detect dari tarikh"
                        />
                      </div>
                    </div>

                    {existingBookings.length > 0 && (
                      <div className="alert alert-warning mb-3">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        <strong>Perhatian:</strong> Terdapat {existingBookings.length} tempahan pada tarikh ini:
                        <ul className="mb-0 mt-2">
                          {existingBookings.map((booking, idx) => (
                            <li key={idx}>
                              {booking.tajuk_majlis} - {booking.waktu_majlis} ({booking.status})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Masa Majlis <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="masa_majlis"
                          value={formData.masa_majlis}
                          onChange={handleInputChange}
                          required
                          placeholder="Contoh: 5 petang (Selepas Asar)"
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Waktu <span className="text-danger">*</span></label>
                        <select
                          className="form-select"
                          name="waktu_majlis"
                          value={formData.waktu_majlis}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="">-- Pilih Waktu --</option>
                          <option value="pagi">Pagi</option>
                          <option value="petang">Petang</option>
                          <option value="malam">Malam</option>
                        </select>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Jumlah Jemputan <span className="text-danger">*</span></label>
                      <div className="input-group" style={{ maxWidth: '200px' }}>
                        <input
                          type="number"
                          className="form-control"
                          name="jumlah_jemputan"
                          value={formData.jumlah_jemputan}
                          onChange={handleInputChange}
                          required
                          min="1"
                          placeholder="0"
                        />
                        <span className="input-group-text">orang</span>
                      </div>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div className="mb-4">
                    <h6 className="text-secondary border-bottom pb-2 mb-3">
                      <i className="bi bi-tools me-2"></i>Peralatan Yang Diperlukan
                    </h6>

                    <div className="row">
                      {PERALATAN_OPTIONS.map((item) => (
                        <div className="col-md-6 mb-2" key={item.id}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={item.id}
                              checked={formData.peralatan.includes(item.id)}
                              onChange={(e) => handlePeralatanChange(item.id, e.target.checked)}
                            />
                            <label className="form-check-label" htmlFor={item.id}>
                              {item.label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3">
                      <label className="form-label">Lain-lain (jika ada)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="peralatan_lain"
                        value={formData.peralatan_lain}
                        onChange={handleInputChange}
                        placeholder="Nyatakan peralatan lain yang diperlukan"
                      />
                    </div>
                  </div>

                  {/* Terms and Agreement */}
                  <div className="mb-4">
                    <div className="card bg-light">
                      <div className="card-body">
                        <p className="mb-3" style={{ fontStyle: 'italic' }}>
                          "Dengan ini, saya akan memastikan kebersihan & kemudahan Surau Ar-Raudhah,
                          Impian Makmur dijaga dengan baik dan sempurna selepas sahaja selesai majlis tersebut."
                        </p>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="bersetuju_terma"
                            name="bersetuju_terma"
                            checked={formData.bersetuju_terma}
                            onChange={handleInputChange}
                            required
                          />
                          <label className="form-check-label" htmlFor="bersetuju_terma">
                            Saya bersetuju dengan terma dan syarat di atas <span className="text-danger">*</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="d-grid">
                    <button
                      type="submit"
                      className="btn btn-success btn-lg"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Menghantar...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-send me-2"></i>
                          Hantar Permohonan
                        </>
                      )}
                    </button>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 pt-3 border-top">
                    <p className="text-muted small mb-2">
                      <strong>Sebarang pertanyaan boleh merujuk kepada:</strong>
                    </p>
                    <ul className="list-unstyled text-muted small">
                      <li><strong>Pengerusi:</strong> Hj Mohd Shafik Hj Mohd Taha di talian 013-645 3396</li>
                      <li><strong>Setiausaha:</strong> En. Nurul Hisyam Ismail di talian 012-670 9502</li>
                      <li><strong>Siak:</strong> En. Kamal Dzulfaqar Ramlee di talian 012-974 3858</li>
                    </ul>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
