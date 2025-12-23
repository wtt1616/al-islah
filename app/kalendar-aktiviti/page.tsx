'use client';

import { useState, useEffect } from 'react';
import PublicFooter from '@/components/PublicFooter';

interface Aktiviti {
  id: number;
  tajuk: string;
  keterangan: string | null;
  tarikh_mula: string;
  tarikh_tamat: string | null;
  masa_mula: string | null;
  masa_tamat: string | null;
  lokasi: string;
  kategori: string;
  penganjur: string | null;
  status: string;
}

const KATEGORI_LABELS: { [key: string]: string } = {
  kuliah: 'Kuliah',
  program_khas: 'Program Khas',
  gotong_royong: 'Gotong-royong',
  mesyuarat: 'Mesyuarat',
  majlis: 'Majlis',
  lain_lain: 'Lain-lain',
};

const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const BULAN = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export default function KalendarAktivitiPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [aktiviti, setAktiviti] = useState<Aktiviti[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedAktiviti, setSelectedAktiviti] = useState<Aktiviti[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    fetchAktiviti();
  }, [year, month]);

  const fetchAktiviti = async () => {
    try {
      setLoading(true);
      const bulan = `${year}-${String(month + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/aktiviti?bulan=${bulan}`);
      const data = await res.json();
      setAktiviti(data.data || []);
    } catch (error) {
      console.error('Error fetching aktiviti:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const formatDateStr = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getAktivitiForDate = (dateStr: string) => {
    return aktiviti.filter(a => {
      const mula = a.tarikh_mula.split('T')[0];
      const tamat = a.tarikh_tamat ? a.tarikh_tamat.split('T')[0] : mula;
      return dateStr >= mula && dateStr <= tamat;
    });
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(year, month + delta, 1);
    setCurrentDate(newDate);
    setSelectedDate(null);
    setSelectedAktiviti([]);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
    setSelectedAktiviti([]);
  };

  const handleDateClick = (dateStr: string) => {
    const aktivitiList = getAktivitiForDate(dateStr);
    setSelectedDate(dateStr);
    setSelectedAktiviti(aktivitiList);
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const formatDisplayDate = (dateStr: string) => {
    // Parse date string as local date to avoid timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Generate calendar days
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split('T')[0];

  const calendarDays: (number | null)[] = [];
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className="min-vh-100 bg-light py-4">
      <div className="container">
        {/* Header */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-6 mb-3 mb-md-0">
                <div className="d-flex align-items-center gap-3">
                  <a
                    href="/login"
                    className="btn btn-outline-secondary btn-sm"
                    title="Kembali ke halaman utama"
                    data-bs-toggle="tooltip"
                  >
                    <i className="bi bi-house-door"></i>
                  </a>
                  <div>
                    <h4 className="mb-0" style={{ color: '#8B0000' }}>
                      <i className="bi bi-calendar-event me-2"></i>
                      Kalendar Aktiviti Surau
                    </h4>
                    <small className="text-muted">Surau Al-Islah, Saujana Impian</small>
                  </div>
                </div>
              </div>
              <div className="col-md-6 text-md-end">
                <div className="btn-group">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => changeMonth(-1)}
                    title="Bulan sebelumnya"
                    data-bs-toggle="tooltip"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={goToToday}
                    title="Pergi ke hari ini"
                    data-bs-toggle="tooltip"
                  >
                    <i className="bi bi-calendar-check"></i>
                  </button>
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => changeMonth(1)}
                    title="Bulan seterusnya"
                    data-bs-toggle="tooltip"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          {/* Calendar */}
          <div className="col-lg-8 mb-4">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0 text-center">
                  {BULAN[month]} {year}
                </h5>
              </div>
              <div className="card-body p-2">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-success" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-bordered mb-0" style={{ tableLayout: 'fixed' }}>
                      <thead>
                        <tr className="table-light">
                          {HARI.map(hari => (
                            <th key={hari} className="text-center py-2" style={{ fontSize: '0.85rem' }}>
                              {hari}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => (
                          <tr key={weekIndex}>
                            {Array.from({ length: 7 }).map((_, dayIndex) => {
                              const dayNum = calendarDays[weekIndex * 7 + dayIndex];
                              if (!dayNum) {
                                return <td key={dayIndex} className="bg-light"></td>;
                              }

                              const dateStr = formatDateStr(year, month, dayNum);
                              const dayAktiviti = getAktivitiForDate(dateStr);
                              const isToday = dateStr === today;
                              const isSelected = dateStr === selectedDate;

                              return (
                                <td
                                  key={dayIndex}
                                  className={`p-1 ${isSelected ? 'bg-warning' : ''}`}
                                  style={{
                                    cursor: 'pointer',
                                    verticalAlign: 'top',
                                    height: '80px',
                                    position: 'relative'
                                  }}
                                  onClick={() => handleDateClick(dateStr)}
                                >
                                  <div
                                    className={`text-end mb-1 ${isToday ? 'fw-bold' : ''}`}
                                    style={{
                                      color: isToday ? '#fff' : undefined,
                                      backgroundColor: isToday ? '#dc3545' : undefined,
                                      borderRadius: isToday ? '50%' : undefined,
                                      width: isToday ? '24px' : undefined,
                                      height: isToday ? '24px' : undefined,
                                      display: isToday ? 'inline-flex' : undefined,
                                      alignItems: isToday ? 'center' : undefined,
                                      justifyContent: isToday ? 'center' : undefined,
                                      float: 'right',
                                      fontSize: '0.85rem'
                                    }}
                                  >
                                    {dayNum}
                                  </div>
                                  <div style={{ clear: 'both' }}>
                                    {dayAktiviti.slice(0, 2).map((a, idx) => (
                                      <div
                                        key={idx}
                                        className="text-truncate bg-success text-white rounded px-1 mb-1"
                                        style={{ fontSize: '0.7rem' }}
                                        title={a.tajuk}
                                      >
                                        {a.tajuk}
                                      </div>
                                    ))}
                                    {dayAktiviti.length > 2 && (
                                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                        +{dayAktiviti.length - 2} lagi
                                      </div>
                                    )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Details */}
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header bg-secondary text-white">
                <h6 className="mb-0">
                  <i className="bi bi-list-ul me-2"></i>
                  {selectedDate ? formatDisplayDate(selectedDate) : 'Pilih tarikh untuk lihat aktiviti'}
                </h6>
              </div>
              <div className="card-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {!selectedDate ? (
                  <p className="text-muted text-center mb-0">
                    Klik pada tarikh di kalendar untuk melihat senarai aktiviti
                  </p>
                ) : selectedAktiviti.length === 0 ? (
                  <p className="text-muted text-center mb-0">
                    Tiada aktiviti pada tarikh ini
                  </p>
                ) : (
                  <div className="list-group list-group-flush">
                    {selectedAktiviti.map(a => (
                      <div key={a.id} className="list-group-item px-0">
                        <h6 className="mb-1 text-success">{a.tajuk}</h6>
                        {a.keterangan && (
                          <p className="mb-2 small text-muted">{a.keterangan}</p>
                        )}
                        <div className="small">
                          {a.masa_mula && (
                            <div>
                              <i className="bi bi-clock me-1"></i>
                              {formatTime(a.masa_mula)}
                              {a.masa_tamat && ` - ${formatTime(a.masa_tamat)}`}
                            </div>
                          )}
                          <div>
                            <i className="bi bi-geo-alt me-1"></i>
                            {a.lokasi}
                          </div>
                          {a.penganjur && (
                            <div>
                              <i className="bi bi-person me-1"></i>
                              {a.penganjur}
                            </div>
                          )}
                          <div>
                            <span className="badge bg-secondary mt-1">
                              {KATEGORI_LABELS[a.kategori] || a.kategori}
                            </span>
                          </div>
                          {a.tarikh_tamat && a.tarikh_tamat.split('T')[0] !== a.tarikh_mula.split('T')[0] && (
                            <div className="text-info mt-1">
                              <i className="bi bi-calendar-range me-1"></i>
                              Sehingga {(() => {
                                const dateStr = a.tarikh_tamat.split('T')[0];
                                const [y, m, d] = dateStr.split('-').map(Number);
                                return new Date(y, m - 1, d).toLocaleDateString('ms-MY');
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Activities */}
            <div className="card mt-3">
              <div className="card-header bg-info text-white">
                <h6 className="mb-0">
                  <i className="bi bi-calendar-check me-2"></i>
                  Aktiviti Akan Datang
                </h6>
              </div>
              <div className="card-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {aktiviti.filter(a => a.tarikh_mula.split('T')[0] >= today).length === 0 ? (
                  <p className="text-muted text-center mb-0 small">
                    Tiada aktiviti akan datang bulan ini
                  </p>
                ) : (
                  <div className="list-group list-group-flush">
                    {aktiviti
                      .filter(a => a.tarikh_mula.split('T')[0] >= today)
                      .slice(0, 5)
                      .map(a => (
                        <div
                          key={a.id}
                          className="list-group-item px-0 py-2"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleDateClick(a.tarikh_mula.split('T')[0])}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong className="small">{a.tajuk}</strong>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {(() => {
                                  const dateStr = a.tarikh_mula.split('T')[0];
                                  const [y, m, d] = dateStr.split('-').map(Number);
                                  return new Date(y, m - 1, d).toLocaleDateString('ms-MY');
                                })()}
                                {a.masa_mula && ` • ${formatTime(a.masa_mula)}`}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
