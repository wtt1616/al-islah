'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { MonthlySchedule, PrayerTime } from '@/types';
import { getUserColor } from '@/lib/userColors';

interface Personnel {
  id: number;
  name: string;
}

interface PersonnelLists {
  imams: Personnel[];
  bilals: Personnel[];
  siaks: Personnel[];
  tadabbur: Personnel[];
  tahsin: Personnel[];
  imamJumaat: Personnel[];
}

interface DayData {
  date: string;
  dayOfWeek: number;
  dayNumber: number;
  schedules: MonthlySchedule[];
}

const PRAYER_TIMES: PrayerTime[] = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
const DAYS_MALAY = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
const MONTHS_MALAY = [
  'Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun',
  'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'
];

export default function ManageSchedulePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [schedules, setSchedules] = useState<MonthlySchedule[]>([]);
  const [personnel, setPersonnel] = useState<PersonnelLists>({
    imams: [], bilals: [], siaks: [], tadabbur: [], tahsin: [], imamJumaat: []
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Current month/year selection
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Edit modal state
  const [editModal, setEditModal] = useState<{
    open: boolean;
    schedule: MonthlySchedule | null;
    date: string;
    type: string;
    role: string;
    prayerTime?: PrayerTime;
  }>({ open: false, schedule: null, date: '', type: '', role: '' });
  const [editPetugasId, setEditPetugasId] = useState<number | null>(null);

  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session) {
      const role = (session.user as any).role;
      if (role !== 'head_imam' && role !== 'admin') {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/monthly-schedules?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.schedules || []);
        setPersonnel(data.personnel || { imams: [], bilals: [], siaks: [], tadabbur: [], tahsin: [], imamJumaat: [] });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session, fetchData]);

  const showAlert = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const generateSchedule = async () => {
    if (!confirm(`Jana jadual untuk ${MONTHS_MALAY[selectedMonth - 1]} ${selectedYear}?`)) {
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/monthly-schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth, year: selectedYear })
      });

      const data = await res.json();
      if (res.ok) {
        showAlert('success', data.message || 'Jadual berjaya dijana!');
        fetchData();
      } else {
        showAlert('danger', data.error || 'Gagal menjana jadual');
      }
    } catch (error) {
      showAlert('danger', 'Ralat menjana jadual');
    } finally {
      setGenerating(false);
    }
  };

  const deleteAllSchedules = async () => {
    if (!confirm(`Padam SEMUA jadual untuk ${MONTHS_MALAY[selectedMonth - 1]} ${selectedYear}?`)) {
      return;
    }

    try {
      const res = await fetch(
        `/api/monthly-schedules?month=${selectedMonth}&year=${selectedYear}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        showAlert('success', 'Jadual berjaya dipadam');
        fetchData();
      } else {
        showAlert('danger', 'Gagal memadam jadual');
      }
    } catch (error) {
      showAlert('danger', 'Ralat memadam jadual');
    }
  };

  const openEditModal = (
    schedule: MonthlySchedule | null,
    date: string,
    type: string,
    role: string,
    prayerTime?: PrayerTime
  ) => {
    setEditModal({ open: true, schedule, date, type, role, prayerTime });
    setEditPetugasId(schedule?.petugas_id || null);
  };

  const saveEdit = async () => {
    try {
      if (editModal.schedule) {
        // Update existing
        const res = await fetch(`/api/monthly-schedules/${editModal.schedule.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petugas_id: editPetugasId })
        });
        if (res.ok) {
          showAlert('success', 'Jadual dikemaskini');
          fetchData();
        } else {
          showAlert('danger', 'Gagal mengemaskini');
        }
      } else {
        // Create new
        const res = await fetch('/api/monthly-schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            schedule_date: editModal.date,
            schedule_type: editModal.type,
            prayer_time: editModal.prayerTime || null,
            petugas_id: editPetugasId,
            petugas_role: editModal.role,
            month_number: selectedMonth,
            year: selectedYear
          })
        });
        if (res.ok) {
          showAlert('success', 'Jadual ditambah');
          fetchData();
        } else {
          showAlert('danger', 'Gagal menambah');
        }
      }
      setEditModal({ open: false, schedule: null, date: '', type: '', role: '' });
    } catch (error) {
      showAlert('danger', 'Ralat menyimpan');
    }
  };

  const getPersonnelList = (role: string): Personnel[] => {
    switch (role) {
      case 'imam': return personnel.imams;
      case 'bilal': return personnel.bilals;
      case 'siak': return personnel.siaks;
      case 'tadabbur': return personnel.tadabbur;
      case 'tahsin': return personnel.tahsin;
      case 'imam_jumaat': return personnel.imamJumaat;
      default: return [];
    }
  };

  // Build calendar data
  const getDaysInMonth = (): DayData[] => {
    const days: DayData[] = [];
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0);

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(selectedYear, selectedMonth - 1, d);
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const daySchedules = schedules.filter(s => s.schedule_date === dateStr);

      days.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
        dayNumber: d,
        schedules: daySchedules
      });
    }

    return days;
  };

  const getSchedule = (daySchedules: MonthlySchedule[], type: string, role: string, prayerTime?: PrayerTime): MonthlySchedule | undefined => {
    return daySchedules.find(s =>
      s.schedule_type === type &&
      s.petugas_role === role &&
      (prayerTime ? s.prayer_time === prayerTime : true)
    );
  };

  const changeMonth = (delta: number) => {
    let newMonth = selectedMonth + delta;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  // Distribution stats
  const getDistribution = (role: string): Map<number, { name: string; count: number }> => {
    const dist = new Map<number, { name: string; count: number }>();
    schedules.filter(s => s.petugas_role === role && s.petugas_id).forEach(s => {
      if (s.petugas_id) {
        const existing = dist.get(s.petugas_id);
        if (existing) {
          existing.count++;
        } else {
          dist.set(s.petugas_id, { name: s.petugas_name || 'Unknown', count: 1 });
        }
      }
    });
    return dist;
  };

  if (status === 'loading' || !session) {
    return (
      <div className="loading">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  const days = getDaysInMonth();
  const firstDayOfWeek = days[0]?.dayOfWeek || 0;

  return (
    <>
      <Navbar />
      <div className="container-fluid mt-4 px-3">
        {alert && (
          <div className={`alert alert-${alert.type} alert-dismissible`} role="alert">
            {alert.message}
            <button type="button" className="btn-close" onClick={() => setAlert(null)}></button>
          </div>
        )}

        {/* Header */}
        <div className="row mb-4">
          <div className="col-md-6">
            <h2 className="mb-1">
              <i className="bi bi-calendar-month me-2 text-success"></i>
              Jadual Bulanan
            </h2>
            <p className="text-muted mb-0">
              {MONTHS_MALAY[selectedMonth - 1]} {selectedYear}
            </p>
          </div>
          <div className="col-md-6 text-end">
            <div className="btn-group me-2">
              <button className="btn btn-outline-secondary" onClick={() => changeMonth(-1)}>
                <i className="bi bi-chevron-left"></i>
              </button>
              <button className="btn btn-outline-primary" onClick={() => {
                setSelectedMonth(now.getMonth() + 1);
                setSelectedYear(now.getFullYear());
              }}>
                Bulan Ini
              </button>
              <button className="btn btn-outline-secondary" onClick={() => changeMonth(1)}>
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
            <button
              className="btn btn-success me-2"
              onClick={generateSchedule}
              disabled={generating || schedules.length > 0}
            >
              {generating ? (
                <><span className="spinner-border spinner-border-sm me-2"></span>Menjana...</>
              ) : (
                <><i className="bi bi-magic me-2"></i>Jana Jadual</>
              )}
            </button>
            {schedules.length > 0 && (
              <button className="btn btn-danger" onClick={deleteAllSchedules}>
                <i className="bi bi-trash me-2"></i>Padam Semua
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-6">
            <div className="card bg-success text-white">
              <div className="card-body py-2">
                <small className="opacity-75">Jumlah Slot</small>
                <h4 className="mb-0">{schedules.length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="card bg-primary text-white">
              <div className="card-body py-2">
                <small className="opacity-75">Solat</small>
                <h4 className="mb-0">{schedules.filter(s => s.schedule_type === 'prayer').length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-4">
            <div className="card bg-info text-white">
              <div className="card-body py-2">
                <small className="opacity-75">Tadabbur</small>
                <h4 className="mb-0">{schedules.filter(s => s.schedule_type === 'tadabbur').length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-4">
            <div className="card bg-warning text-dark">
              <div className="card-body py-2">
                <small className="opacity-75">Tahsin</small>
                <h4 className="mb-0">{schedules.filter(s => s.schedule_type === 'tahsin').length}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-2 col-4">
            <div className="card bg-dark text-white">
              <div className="card-body py-2">
                <small className="opacity-75">Imam Jumaat</small>
                <h4 className="mb-0">{schedules.filter(s => s.schedule_type === 'imam_jumaat').length}</h4>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : (
          <>
            {/* Calendar Grid */}
            <div className="card mb-4">
              <div className="card-body p-2">
                <div className="table-responsive">
                  <table className="table table-bordered mb-0" style={{ fontSize: '0.7rem' }}>
                    <thead>
                      <tr className="bg-success text-white">
                        {DAYS_MALAY.map((day) => (
                          <th key={day} className="text-center py-2" style={{ width: '14.28%' }}>
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const rows = [];
                        let currentDay = 0;

                        // Calculate number of weeks needed
                        const totalCells = firstDayOfWeek + days.length;
                        const numWeeks = Math.ceil(totalCells / 7);

                        for (let week = 0; week < numWeeks; week++) {
                          const cells = [];
                          for (let dow = 0; dow < 7; dow++) {
                            const cellIndex = week * 7 + dow;
                            const dayIndex = cellIndex - firstDayOfWeek;

                            if (dayIndex < 0 || dayIndex >= days.length) {
                              cells.push(<td key={`empty-${cellIndex}`} className="bg-light"></td>);
                            } else {
                              const day = days[dayIndex];
                              const isFriday = day.dayOfWeek === 5;

                              cells.push(
                                <td key={day.date} className="p-1" style={{
                                  verticalAlign: 'top',
                                  minHeight: '150px',
                                  backgroundColor: isFriday ? '#f8f9fa' : undefined
                                }}>
                                  <div className="fw-bold mb-1 text-center" style={{
                                    backgroundColor: isFriday ? '#000' : '#059669',
                                    color: 'white',
                                    borderRadius: '4px',
                                    padding: '2px'
                                  }}>
                                    {day.dayNumber}
                                  </div>

                                  {/* Prayer schedules */}
                                  {PRAYER_TIMES.map(pt => {
                                    const imamSched = getSchedule(day.schedules, 'prayer', 'imam', pt);
                                    const bilalSched = getSchedule(day.schedules, 'prayer', 'bilal', pt);
                                    const siakSched = getSchedule(day.schedules, 'prayer', 'siak', pt);

                                    return (
                                      <div key={pt} className="mb-1 p-1 rounded" style={{
                                        backgroundColor: '#f0f9ff',
                                        border: '1px solid #e0e7ff'
                                      }}>
                                        <div className="fw-bold text-center" style={{ fontSize: '0.6rem', color: '#1e40af' }}>
                                          {pt}
                                        </div>
                                        <div
                                          className="text-truncate cursor-pointer"
                                          style={{
                                            fontSize: '0.6rem',
                                            backgroundColor: imamSched?.petugas_id ? getUserColor(imamSched.petugas_id).bg : '#fee2e2',
                                            color: imamSched?.petugas_id ? getUserColor(imamSched.petugas_id).text : '#991b1b',
                                            padding: '1px 3px',
                                            borderRadius: '2px',
                                            cursor: 'pointer'
                                          }}
                                          onClick={() => openEditModal(imamSched || null, day.date, 'prayer', 'imam', pt)}
                                          title={`Imam: ${imamSched?.petugas_name || 'Kosong'}`}
                                        >
                                          I: {imamSched?.petugas_name || '-'}
                                        </div>
                                        <div
                                          className="text-truncate"
                                          style={{
                                            fontSize: '0.6rem',
                                            backgroundColor: bilalSched?.petugas_id ? getUserColor(bilalSched.petugas_id).bg : '#fee2e2',
                                            color: bilalSched?.petugas_id ? getUserColor(bilalSched.petugas_id).text : '#991b1b',
                                            padding: '1px 3px',
                                            borderRadius: '2px',
                                            cursor: 'pointer'
                                          }}
                                          onClick={() => openEditModal(bilalSched || null, day.date, 'prayer', 'bilal', pt)}
                                          title={`Bilal: ${bilalSched?.petugas_name || 'Kosong'}`}
                                        >
                                          B: {bilalSched?.petugas_name || '-'}
                                        </div>
                                        <div
                                          className="text-truncate"
                                          style={{
                                            fontSize: '0.6rem',
                                            backgroundColor: siakSched?.petugas_id ? getUserColor(siakSched.petugas_id).bg : '#fef3c7',
                                            color: siakSched?.petugas_id ? getUserColor(siakSched.petugas_id).text : '#92400e',
                                            padding: '1px 3px',
                                            borderRadius: '2px',
                                            cursor: 'pointer'
                                          }}
                                          onClick={() => openEditModal(siakSched || null, day.date, 'prayer', 'siak', pt)}
                                          title={`Siak: ${siakSched?.petugas_name || 'Kosong'}`}
                                        >
                                          S: {siakSched?.petugas_name || '-'}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Tadabbur (Mon-Fri only) */}
                                  {day.dayOfWeek >= 1 && day.dayOfWeek <= 5 && (
                                    <div
                                      className="p-1 rounded mb-1"
                                      style={{
                                        backgroundColor: '#ecfdf5',
                                        border: '1px solid #a7f3d0',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => {
                                        const sched = getSchedule(day.schedules, 'tadabbur', 'tadabbur');
                                        openEditModal(sched || null, day.date, 'tadabbur', 'tadabbur');
                                      }}
                                    >
                                      <div className="fw-bold text-center" style={{ fontSize: '0.6rem', color: '#047857' }}>
                                        Tadabbur
                                      </div>
                                      <div className="text-center text-truncate" style={{ fontSize: '0.6rem' }}>
                                        {getSchedule(day.schedules, 'tadabbur', 'tadabbur')?.petugas_name || '-'}
                                      </div>
                                    </div>
                                  )}

                                  {/* Tahsin (Daily) */}
                                  <div
                                    className="p-1 rounded mb-1"
                                    style={{
                                      backgroundColor: '#fef3c7',
                                      border: '1px solid #fcd34d',
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                      const sched = getSchedule(day.schedules, 'tahsin', 'tahsin');
                                      openEditModal(sched || null, day.date, 'tahsin', 'tahsin');
                                    }}
                                  >
                                    <div className="fw-bold text-center" style={{ fontSize: '0.6rem', color: '#92400e' }}>
                                      Tahsin
                                    </div>
                                    <div className="text-center text-truncate" style={{ fontSize: '0.6rem' }}>
                                      {getSchedule(day.schedules, 'tahsin', 'tahsin')?.petugas_name || '-'}
                                    </div>
                                  </div>

                                  {/* Imam Jumaat (Friday only) */}
                                  {isFriday && (
                                    <div
                                      className="p-1 rounded"
                                      style={{
                                        backgroundColor: '#1f2937',
                                        border: '1px solid #000',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => {
                                        const sched = getSchedule(day.schedules, 'imam_jumaat', 'imam_jumaat');
                                        openEditModal(sched || null, day.date, 'imam_jumaat', 'imam_jumaat');
                                      }}
                                    >
                                      <div className="fw-bold text-center text-white" style={{ fontSize: '0.6rem' }}>
                                        Imam Jumaat
                                      </div>
                                      <div className="text-center text-white text-truncate" style={{ fontSize: '0.6rem' }}>
                                        {getSchedule(day.schedules, 'imam_jumaat', 'imam_jumaat')?.petugas_name || '-'}
                                      </div>
                                    </div>
                                  )}
                                </td>
                              );
                            }
                          }
                          rows.push(<tr key={week}>{cells}</tr>);
                        }
                        return rows;
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Distribution Legend */}
            {schedules.length > 0 && (
              <div className="card">
                <div className="card-header py-2">
                  <h6 className="mb-0">Pengagihan Tugas</h6>
                </div>
                <div className="card-body py-2">
                  <div className="row">
                    {['imam', 'bilal', 'siak', 'tadabbur', 'tahsin', 'imam_jumaat'].map(role => {
                      const dist = getDistribution(role);
                      if (dist.size === 0) return null;

                      const roleLabels: Record<string, string> = {
                        imam: 'Imam',
                        bilal: 'Bilal',
                        siak: 'Siak',
                        tadabbur: 'Tadabbur',
                        tahsin: 'Tahsin',
                        imam_jumaat: 'Imam Jumaat'
                      };

                      return (
                        <div key={role} className="col-md-4 col-6 mb-2">
                          <strong style={{ fontSize: '0.75rem' }}>{roleLabels[role]}</strong>
                          <div className="d-flex flex-wrap gap-1 mt-1">
                            {Array.from(dist.entries())
                              .sort((a, b) => b[1].count - a[1].count)
                              .map(([id, data]) => {
                                const color = getUserColor(id);
                                return (
                                  <span
                                    key={id}
                                    className="badge"
                                    style={{
                                      backgroundColor: color.bg,
                                      color: color.text,
                                      border: `1px solid ${color.border}`,
                                      fontSize: '0.65rem'
                                    }}
                                  >
                                    {data.name}: {data.count}x
                                  </span>
                                );
                              })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {editModal.open && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  {editModal.schedule ? 'Kemaskini' : 'Tambah'} Jadual
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditModal({ open: false, schedule: null, date: '', type: '', role: '' })}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-bold">Tarikh</label>
                  <input type="text" className="form-control" value={editModal.date} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Jenis</label>
                  <input
                    type="text"
                    className="form-control"
                    value={`${editModal.type}${editModal.prayerTime ? ` - ${editModal.prayerTime}` : ''}`}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Peranan</label>
                  <input type="text" className="form-control" value={editModal.role} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold">Petugas</label>
                  <select
                    className="form-select"
                    value={editPetugasId || ''}
                    onChange={(e) => setEditPetugasId(e.target.value ? parseInt(e.target.value) : null)}
                  >
                    <option value="">-- Pilih Petugas --</option>
                    {getPersonnelList(editModal.role).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditModal({ open: false, schedule: null, date: '', type: '', role: '' })}
                >
                  Batal
                </button>
                <button type="button" className="btn btn-success" onClick={saveEdit}>
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
