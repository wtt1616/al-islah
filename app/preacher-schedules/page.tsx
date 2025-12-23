'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Preacher {
  id: number;
  name: string;
  photo: string | null;
  nama_bank: string | null;
  no_akaun: string | null;
  is_active: number;
}

interface Schedule {
  schedule_date: string;
  subuh_preacher_id: number | null;
  dhuha_preacher_id: number | null;
  maghrib_preacher_id: number | null;
  friday_preacher_id: number | null;
  friday_dhuha_preacher_id: number | null;
  subuh_banner: string | null;
  dhuha_banner: string | null;
  maghrib_banner: string | null;
  friday_banner: string | null;
  friday_dhuha_banner: string | null;
  notes: string;
}

interface CalendarDay {
  date: Date;
  dateString: string;
  isCurrentMonth: boolean;
  subuh_preacher_id: number | null;
  dhuha_preacher_id: number | null;
  maghrib_preacher_id: number | null;
  friday_preacher_id: number | null;
  friday_dhuha_preacher_id: number | null;
  notes: string;
}

export default function PreacherSchedulesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preachers, setPreachers] = useState<Preacher[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [schedules, setSchedules] = useState<Map<string, Schedule>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [uploadingBanner, setUploadingBanner] = useState<string | null>(null);
  const [selectedDateForBanner, setSelectedDateForBanner] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchPreachers();
      fetchSchedules();
    }
  }, [session, currentDate]);

  useEffect(() => {
    generateCalendar();
  }, [currentDate]);

  const fetchPreachers = async () => {
    try {
      const response = await fetch('/api/preachers?active=true');
      const data = await response.json();

      if (response.ok) {
        setPreachers(data.preachers);
      }
    } catch (err) {
      console.error('Error fetching preachers:', err);
    }
  };

  const fetchSchedules = async () => {
    try {
      // Calculate the date range for the calendar view (includes prev/next month days)
      const firstDay = new Date(year, month - 1, 1);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 41); // 42 days total (6 weeks)

      const startDateStr = formatLocalDate(startDate);
      const endDateStr = formatLocalDate(endDate);

      const response = await fetch(
        `/api/preacher-schedules?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      const data = await response.json();

      if (response.ok) {
        const scheduleMap = new Map<string, Schedule>();
        data.schedules.forEach((schedule: any) => {
          // Date is already formatted as YYYY-MM-DD from the API
          const dateString = schedule.schedule_date;

          scheduleMap.set(dateString, {
            schedule_date: dateString,
            subuh_preacher_id: schedule.subuh_preacher_id,
            dhuha_preacher_id: schedule.dhuha_preacher_id,
            maghrib_preacher_id: schedule.maghrib_preacher_id,
            friday_preacher_id: schedule.friday_preacher_id,
            friday_dhuha_preacher_id: schedule.friday_dhuha_preacher_id,
            subuh_banner: schedule.subuh_banner || null,
            dhuha_banner: schedule.dhuha_banner || null,
            maghrib_banner: schedule.maghrib_banner || null,
            friday_banner: schedule.friday_banner || null,
            friday_dhuha_banner: schedule.friday_dhuha_banner || null,
            notes: schedule.notes || ''
          });
        });

        setSchedules(scheduleMap);
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendar = () => {
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days: CalendarDay[] = [];
    const currentDateIter = new Date(startDate);

    // Generate 6 weeks (42 days) to cover all possible month layouts
    for (let i = 0; i < 42; i++) {
      const dateString = formatLocalDate(currentDateIter);
      const isCurrentMonth = currentDateIter.getMonth() === month - 1;

      days.push({
        date: new Date(currentDateIter),
        dateString,
        isCurrentMonth,
        subuh_preacher_id: null,
        dhuha_preacher_id: null,
        maghrib_preacher_id: null,
        friday_preacher_id: null,
        friday_dhuha_preacher_id: null,
        notes: ''
      });

      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    setCalendarDays(days);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handlePreacherChange = (
    dateString: string,
    type: 'subuh' | 'dhuha' | 'maghrib' | 'friday' | 'friday_dhuha',
    preacherId: number | null
  ) => {
    // Ensure date is always in YYYY-MM-DD format
    const normalizedDate = dateString.split('T')[0];

    const newSchedules = new Map(schedules);
    const existing = newSchedules.get(normalizedDate) || {
      schedule_date: normalizedDate,
      subuh_preacher_id: null,
      dhuha_preacher_id: null,
      maghrib_preacher_id: null,
      friday_preacher_id: null,
      friday_dhuha_preacher_id: null,
      subuh_banner: null,
      dhuha_banner: null,
      maghrib_banner: null,
      friday_banner: null,
      friday_dhuha_banner: null,
      notes: ''
    };

    if (type === 'subuh') {
      existing.subuh_preacher_id = preacherId;
    } else if (type === 'dhuha') {
      existing.dhuha_preacher_id = preacherId;
    } else if (type === 'maghrib') {
      existing.maghrib_preacher_id = preacherId;
    } else if (type === 'friday') {
      existing.friday_preacher_id = preacherId;
    } else if (type === 'friday_dhuha') {
      existing.friday_dhuha_preacher_id = preacherId;
    }

    newSchedules.set(normalizedDate, existing);
    setSchedules(newSchedules);
  };

  const handleSaveSchedules = async () => {
    if (session?.user?.role !== 'head_imam') {
      setError('Only Head Imam can save preacher schedules');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const schedulesArray = Array.from(schedules.values())
        .filter(
          (schedule) => schedule.subuh_preacher_id || schedule.dhuha_preacher_id || schedule.maghrib_preacher_id || schedule.friday_preacher_id || schedule.friday_dhuha_preacher_id ||
            schedule.subuh_banner || schedule.dhuha_banner || schedule.maghrib_banner || schedule.friday_banner || schedule.friday_dhuha_banner
        )
        .map((schedule) => ({
          ...schedule,
          // Ensure schedule_date is in YYYY-MM-DD format (remove any timestamp)
          schedule_date: schedule.schedule_date.split('T')[0]
        }));

      if (schedulesArray.length === 0) {
        setError('No schedules to save. Please select at least one preacher.');
        setSaving(false);
        return;
      }

      const response = await fetch('/api/preacher-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedules: schedulesArray })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`${data.message} (${schedulesArray.length} schedule${schedulesArray.length > 1 ? 's' : ''} saved)`);
        // Refresh schedules from database
        await fetchSchedules();
        // Auto-hide success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to save schedules');
      }
    } catch (err) {
      console.error('Error saving schedules:', err);
      setError('Failed to save schedules: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBannerUpload = async (dateString: string, slot: string, file: File) => {
    const uploadKey = `${dateString}-${slot}`;
    setUploadingBanner(uploadKey);
    setError('');

    try {
      const formData = new FormData();
      formData.append('banner', file);

      const response = await fetch('/api/preacher-schedules/banner', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload banner');
      }

      // Update the schedule with the new banner URL
      handleBannerChange(dateString, slot as any, data.url);
      setSuccess('Banner berjaya dimuat naik');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload banner');
    } finally {
      setUploadingBanner(null);
    }
  };

  const handleBannerChange = (
    dateString: string,
    slot: 'subuh' | 'dhuha' | 'maghrib' | 'friday' | 'friday_dhuha',
    bannerUrl: string | null
  ) => {
    const normalizedDate = dateString.split('T')[0];
    const newSchedules = new Map(schedules);
    const existing = newSchedules.get(normalizedDate) || {
      schedule_date: normalizedDate,
      subuh_preacher_id: null,
      dhuha_preacher_id: null,
      maghrib_preacher_id: null,
      friday_preacher_id: null,
      friday_dhuha_preacher_id: null,
      subuh_banner: null,
      dhuha_banner: null,
      maghrib_banner: null,
      friday_banner: null,
      friday_dhuha_banner: null,
      notes: ''
    };

    const bannerField = `${slot}_banner` as keyof Schedule;
    (existing as any)[bannerField] = bannerUrl;

    newSchedules.set(normalizedDate, existing);
    setSchedules(newSchedules);
  };

  const getBannerFilename = (url: string | null): string => {
    if (!url) return '';
    const parts = url.split('/');
    return parts[parts.length - 1];
  };

  const getPreacherName = (preacherId: number | null): string => {
    if (!preacherId) return '-';
    const preacher = preachers.find((p) => p.id === preacherId);
    return preacher ? preacher.name : '-';
  };

  const renderPreacherInfo = (preacherId: number | null, showBankInfo: boolean = false) => {
    if (!preacherId) return <span className="text-muted">-</span>;

    const preacher = preachers.find((p) => p.id === preacherId);
    if (!preacher) return <span className="text-muted">-</span>;

    return (
      <div className="d-flex align-items-center gap-2">
        {preacher.photo ? (
          <img
            src={preacher.photo}
            alt={preacher.name}
            width={30}
            height={30}
            className="rounded-circle preacher-photo-schedule"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
            style={{ width: '30px', height: '30px', fontSize: '12px' }}
          >
            <i className="bi bi-person-fill"></i>
          </div>
        )}
        <div>
          <span className="small">{preacher.name}</span>
          {showBankInfo && preacher.nama_bank && preacher.no_akaun && (
            <div className="small text-muted" style={{ fontSize: '0.75rem' }}>
              <i className="bi bi-bank me-1"></i>
              {preacher.nama_bank}: {preacher.no_akaun}
            </div>
          )}
        </div>
      </div>
    );
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

  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-outline-secondary" onClick={() => router.back()}>
            <i className="bi bi-arrow-left me-2"></i>Kembali
          </button>
          <h1 className="mb-0">Jadual Ceramah - {monthName}</h1>
        </div>
        <div className="btn-group">
          <button
            className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setViewMode('calendar')}
          >
            <i className="bi bi-calendar-month me-2"></i>
            Calendar View
          </button>
          <button
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => setViewMode('list')}
          >
            <i className="bi bi-list-ul me-2"></i>
            List View
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show no-print" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show no-print" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <button className="btn btn-outline-secondary no-print" onClick={handlePreviousMonth}>
              <i className="bi bi-chevron-left"></i> Previous
            </button>
            <h3 className="mb-0">{monthName}</h3>
            <button className="btn btn-outline-secondary no-print" onClick={handleNextMonth}>
              Next <i className="bi bi-chevron-right"></i>
            </button>
          </div>

          {viewMode === 'calendar' ? (
            <div className="table-responsive">
              <table className="table table-bordered calendar-table">
                <thead>
                  <tr>
                    <th>Sunday</th>
                    <th>Monday</th>
                    <th>Tuesday</th>
                    <th>Wednesday</th>
                    <th>Thursday</th>
                    <th>Friday</th>
                    <th>Saturday</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }, (_, weekIndex) => (
                    <tr key={weekIndex}>
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const dayData = calendarDays[weekIndex * 7 + dayIndex];
                        if (!dayData) return null;

                        const schedule = schedules.get(dayData.dateString);
                        const isHeadImam = session?.user?.role === 'head_imam';

                        return (
                          <td
                            key={dayIndex}
                            className={`calendar-day ${!dayData.isCurrentMonth ? 'other-month' : ''}`}
                          >
                            <div className="day-number">
                              {dayData.date.getDate()}
                            </div>
                            {dayData.isCurrentMonth && (() => {
                              const dayOfWeek = dayData.date.getDay(); // 0=Sunday, 1=Monday, 4=Thursday, 5=Friday

                              // Monday (1) - No preaching
                              if (dayOfWeek === 1) {
                                return (
                                  <div className="preacher-slots text-center">
                                    <small className="text-muted">No Preaching</small>
                                  </div>
                                );
                              }

                              // Thursday (4) - Kuliah Subuh and Kuliah Maghrib
                              if (dayOfWeek === 4) {
                                return (
                                  <div className="preacher-slots">
                                    <div className="slot mb-2">
                                      <small className="text-muted d-block">Kuliah Subuh</small>
                                      {isHeadImam ? (
                                        <>
                                          <select
                                            className="form-select form-select-sm no-print"
                                            value={schedule?.subuh_preacher_id || ''}
                                            onChange={(e) =>
                                              handlePreacherChange(
                                                dayData.dateString,
                                                'subuh',
                                                e.target.value ? parseInt(e.target.value) : null
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            {preachers.map((p) => (
                                              <option key={p.id} value={p.id}>
                                                {p.name}
                                              </option>
                                            ))}
                                          </select>
                                          <div className="small print-only">
                                            {renderPreacherInfo(schedule?.subuh_preacher_id || null)}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="small">
                                          {renderPreacherInfo(schedule?.subuh_preacher_id || null)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="slot">
                                      <small className="text-muted d-block">Kuliah Maghrib</small>
                                      {isHeadImam ? (
                                        <>
                                          <select
                                            className="form-select form-select-sm no-print"
                                            value={schedule?.maghrib_preacher_id || ''}
                                            onChange={(e) =>
                                              handlePreacherChange(
                                                dayData.dateString,
                                                'maghrib',
                                                e.target.value ? parseInt(e.target.value) : null
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            {preachers.map((p) => (
                                              <option key={p.id} value={p.id}>
                                                {p.name}
                                              </option>
                                            ))}
                                          </select>
                                          <div className="small print-only">
                                            {renderPreacherInfo(schedule?.maghrib_preacher_id || null)}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="small">
                                          {renderPreacherInfo(schedule?.maghrib_preacher_id || null)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              // Friday (5) - Kuliah Dhuha and Friday Preach
                              if (dayOfWeek === 5) {
                                return (
                                  <div className="preacher-slots">
                                    <div className="slot mb-2">
                                      <small className="text-muted d-block">Kuliah Dhuha</small>
                                      {isHeadImam ? (
                                        <>
                                          <select
                                            className="form-select form-select-sm no-print"
                                            value={schedule?.friday_dhuha_preacher_id || ''}
                                            onChange={(e) =>
                                              handlePreacherChange(
                                                dayData.dateString,
                                                'friday_dhuha',
                                                e.target.value ? parseInt(e.target.value) : null
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            {preachers.map((p) => (
                                              <option key={p.id} value={p.id}>
                                                {p.name}
                                              </option>
                                            ))}
                                          </select>
                                          <div className="small print-only">
                                            {renderPreacherInfo(schedule?.friday_dhuha_preacher_id || null)}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="small">
                                          {renderPreacherInfo(schedule?.friday_dhuha_preacher_id || null)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="slot">
                                      <small className="text-muted d-block">Tazkirah Jumaat</small>
                                      {isHeadImam ? (
                                        <>
                                          <select
                                            className="form-select form-select-sm no-print"
                                            value={schedule?.friday_preacher_id || ''}
                                            onChange={(e) =>
                                              handlePreacherChange(
                                                dayData.dateString,
                                                'friday',
                                                e.target.value ? parseInt(e.target.value) : null
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            {preachers.map((p) => (
                                              <option key={p.id} value={p.id}>
                                                {p.name}
                                              </option>
                                            ))}
                                          </select>
                                          <div className="small print-only">
                                            {renderPreacherInfo(schedule?.friday_preacher_id || null)}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="small">
                                          {renderPreacherInfo(schedule?.friday_preacher_id || null)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }

                              // Other days - Subuh, Dhuha (weekend), and Maghrib
                              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

                              return (
                                <div className="preacher-slots">
                                  <div className="slot mb-2">
                                    <small className="text-muted d-block">Kuliah Subuh</small>
                                    {isHeadImam ? (
                                      <>
                                        <select
                                          className="form-select form-select-sm no-print"
                                          value={schedule?.subuh_preacher_id || ''}
                                          onChange={(e) =>
                                            handlePreacherChange(
                                              dayData.dateString,
                                              'subuh',
                                              e.target.value ? parseInt(e.target.value) : null
                                            )
                                          }
                                        >
                                          <option value="">-</option>
                                          {preachers.map((p) => (
                                            <option key={p.id} value={p.id}>
                                              {p.name}
                                            </option>
                                          ))}
                                        </select>
                                        <div className="small print-only">
                                          {renderPreacherInfo(schedule?.subuh_preacher_id || null)}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="small">
                                        {renderPreacherInfo(schedule?.subuh_preacher_id || null)}
                                      </div>
                                    )}
                                  </div>
                                  {isWeekend && (
                                    <div className="slot mb-2">
                                      <small className="text-muted d-block">Dhuha</small>
                                      {isHeadImam ? (
                                        <>
                                          <select
                                            className="form-select form-select-sm no-print"
                                            value={schedule?.dhuha_preacher_id || ''}
                                            onChange={(e) =>
                                              handlePreacherChange(
                                                dayData.dateString,
                                                'dhuha',
                                                e.target.value ? parseInt(e.target.value) : null
                                              )
                                            }
                                          >
                                            <option value="">-</option>
                                            {preachers.map((p) => (
                                              <option key={p.id} value={p.id}>
                                                {p.name}
                                              </option>
                                            ))}
                                          </select>
                                          <div className="small print-only">
                                            {renderPreacherInfo(schedule?.dhuha_preacher_id || null)}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="small">
                                          {renderPreacherInfo(schedule?.dhuha_preacher_id || null)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="slot">
                                    <small className="text-muted d-block">Kuliah Maghrib</small>
                                    {isHeadImam ? (
                                      <>
                                        <select
                                          className="form-select form-select-sm no-print"
                                          value={schedule?.maghrib_preacher_id || ''}
                                          onChange={(e) =>
                                            handlePreacherChange(
                                              dayData.dateString,
                                              'maghrib',
                                              e.target.value ? parseInt(e.target.value) : null
                                            )
                                          }
                                        >
                                          <option value="">-</option>
                                          {preachers.map((p) => (
                                            <option key={p.id} value={p.id}>
                                              {p.name}
                                            </option>
                                          ))}
                                        </select>
                                        <div className="small print-only">
                                          {renderPreacherInfo(schedule?.maghrib_preacher_id || null)}
                                        </div>
                                      </>
                                    ) : (
                                      <div className="small">
                                        {renderPreacherInfo(schedule?.maghrib_preacher_id || null)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Preaching Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  {calendarDays
                    .filter((day) => day.isCurrentMonth)
                    .map((day) => {
                      const schedule = schedules.get(day.dateString);
                      const isHeadImam = session?.user?.role === 'head_imam';
                      const dayName = day.date.toLocaleDateString('en-US', { weekday: 'long' });
                      const dayOfWeek = day.date.getDay();

                      // Monday (1) - No preaching
                      if (dayOfWeek === 1) {
                        return (
                          <tr key={day.dateString} className="table-secondary">
                            <td>{day.date.getDate()}</td>
                            <td>{dayName}</td>
                            <td className="text-muted">No Preaching</td>
                          </tr>
                        );
                      }

                      // Thursday (4) - Kuliah Subuh and Kuliah Maghrib
                      if (dayOfWeek === 4) {
                        return (
                          <tr key={day.dateString}>
                            <td>{day.date.getDate()}</td>
                            <td>{dayName}</td>
                            <td>
                              <div className="mb-2">
                                <strong>Kuliah Subuh:</strong>{' '}
                                {isHeadImam ? (
                                  <select
                                    className="form-select d-inline-block w-auto"
                                    value={schedule?.subuh_preacher_id || ''}
                                    onChange={(e) =>
                                      handlePreacherChange(
                                        day.dateString,
                                        'subuh',
                                        e.target.value ? parseInt(e.target.value) : null
                                      )
                                    }
                                  >
                                    <option value="">-</option>
                                    {preachers.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  renderPreacherInfo(schedule?.subuh_preacher_id || null)
                                )}
                              </div>
                              <div>
                                <strong>Kuliah Maghrib:</strong>{' '}
                                {isHeadImam ? (
                                  <select
                                    className="form-select d-inline-block w-auto"
                                    value={schedule?.maghrib_preacher_id || ''}
                                    onChange={(e) =>
                                      handlePreacherChange(
                                        day.dateString,
                                        'maghrib',
                                        e.target.value ? parseInt(e.target.value) : null
                                      )
                                    }
                                  >
                                    <option value="">-</option>
                                    {preachers.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  renderPreacherInfo(schedule?.maghrib_preacher_id || null)
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Friday (5) - Kuliah Dhuha and Khutbah Jumaat
                      if (dayOfWeek === 5) {
                        return (
                          <tr key={day.dateString}>
                            <td>{day.date.getDate()}</td>
                            <td>{dayName}</td>
                            <td>
                              <div className="mb-2">
                                <strong>Kuliah Dhuha:</strong>{' '}
                                {isHeadImam ? (
                                  <select
                                    className="form-select d-inline-block w-auto"
                                    value={schedule?.friday_dhuha_preacher_id || ''}
                                    onChange={(e) =>
                                      handlePreacherChange(
                                        day.dateString,
                                        'friday_dhuha',
                                        e.target.value ? parseInt(e.target.value) : null
                                      )
                                    }
                                  >
                                    <option value="">-</option>
                                    {preachers.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  renderPreacherInfo(schedule?.friday_dhuha_preacher_id || null)
                                )}
                              </div>
                              <div>
                                <strong>Tazkirah Jumaat:</strong>{' '}
                                {isHeadImam ? (
                                  <select
                                    className="form-select d-inline-block w-auto"
                                    value={schedule?.friday_preacher_id || ''}
                                    onChange={(e) =>
                                      handlePreacherChange(
                                        day.dateString,
                                        'friday',
                                        e.target.value ? parseInt(e.target.value) : null
                                      )
                                    }
                                  >
                                    <option value="">-</option>
                                    {preachers.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  renderPreacherInfo(schedule?.friday_preacher_id || null)
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      // Other days - Subuh, Dhuha (weekend), and Maghrib
                      const isWeekendList = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday

                      return (
                        <tr key={day.dateString}>
                          <td>{day.date.getDate()}</td>
                          <td>{dayName}</td>
                          <td>
                            <div className="mb-2">
                              <strong>Kuliah Subuh:</strong>{' '}
                              {isHeadImam ? (
                                <select
                                  className="form-select d-inline-block w-auto"
                                  value={schedule?.subuh_preacher_id || ''}
                                  onChange={(e) =>
                                    handlePreacherChange(
                                      day.dateString,
                                      'subuh',
                                      e.target.value ? parseInt(e.target.value) : null
                                    )
                                  }
                                >
                                  <option value="">-</option>
                                  {preachers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                renderPreacherInfo(schedule?.subuh_preacher_id || null)
                              )}
                            </div>
                            {isWeekendList && (
                              <div className="mb-2">
                                <strong>Dhuha:</strong>{' '}
                                {isHeadImam ? (
                                  <select
                                    className="form-select d-inline-block w-auto"
                                    value={schedule?.dhuha_preacher_id || ''}
                                    onChange={(e) =>
                                      handlePreacherChange(
                                        day.dateString,
                                        'dhuha',
                                        e.target.value ? parseInt(e.target.value) : null
                                      )
                                    }
                                  >
                                    <option value="">-</option>
                                    {preachers.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  renderPreacherInfo(schedule?.dhuha_preacher_id || null)
                                )}
                              </div>
                            )}
                            <div>
                              <strong>Kuliah Maghrib:</strong>{' '}
                              {isHeadImam ? (
                                <select
                                  className="form-select d-inline-block w-auto"
                                  value={schedule?.maghrib_preacher_id || ''}
                                  onChange={(e) =>
                                    handlePreacherChange(
                                      day.dateString,
                                      'maghrib',
                                      e.target.value ? parseInt(e.target.value) : null
                                    )
                                  }
                                >
                                  <option value="">-</option>
                                  {preachers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                renderPreacherInfo(schedule?.maghrib_preacher_id || null)
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {session?.user?.role === 'head_imam' && (
            <div className="mt-3 d-flex gap-2 no-print">
              <button
                className="btn btn-primary"
                onClick={handleSaveSchedules}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    Save Schedules
                  </>
                )}
              </button>
              <button className="btn btn-outline-secondary" onClick={handlePrint}>
                <i className="bi bi-printer me-2"></i>
                Print
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Preacher List with Bank Info */}
      {session?.user?.role === 'head_imam' && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="bi bi-people me-2"></i>
              Senarai Penceramah & Maklumat Bank
            </h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Foto</th>
                    <th>Nama</th>
                    <th>Nama Bank</th>
                    <th>No. Akaun</th>
                  </tr>
                </thead>
                <tbody>
                  {preachers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        Tiada penceramah aktif
                      </td>
                    </tr>
                  ) : (
                    preachers.map((preacher) => (
                      <tr key={preacher.id}>
                        <td>
                          {preacher.photo ? (
                            <img
                              src={preacher.photo}
                              alt={preacher.name}
                              width={40}
                              height={40}
                              className="rounded-circle"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <div
                              className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
                              style={{ width: '40px', height: '40px' }}
                            >
                              <i className="bi bi-person-fill"></i>
                            </div>
                          )}
                        </td>
                        <td className="align-middle">{preacher.name}</td>
                        <td className="align-middle">
                          {preacher.nama_bank || <span className="text-muted">-</span>}
                        </td>
                        <td className="align-middle">
                          {preacher.no_akaun || <span className="text-muted">-</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Banner Upload Section - Head Imam Only */}
      {session?.user?.role === 'head_imam' && (
        <div className="card mb-4">
          <div className="card-header" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white' }}>
            <h5 className="mb-0">
              <i className="bi bi-image me-2"></i>
              Upload Banner Kuliah
            </h5>
          </div>
          <div className="card-body">
            <p className="text-muted mb-3">
              <i className="bi bi-info-circle me-1"></i>
              Muat naik banner/poster untuk setiap slot kuliah. Banner akan dipaparkan di halaman utama (public).
              <br />
              <small>Format: JPEG, PNG, WebP, GIF. Maksimum 5MB. Auto-resize jika melebihi 1080x1920.</small>
            </p>

            {/* Date Selector */}
            <div className="mb-3">
              <label className="form-label fw-bold">Pilih Tarikh:</label>
              <select
                className="form-select"
                style={{ maxWidth: '300px' }}
                value={selectedDateForBanner || ''}
                onChange={(e) => setSelectedDateForBanner(e.target.value || null)}
              >
                <option value="">-- Pilih tarikh --</option>
                {calendarDays
                  .filter((day) => day.isCurrentMonth)
                  .map((day) => {
                    const dayOfWeek = day.date.getDay();
                    // Skip Monday (1) - No preaching
                    if (dayOfWeek === 1) return null;

                    const dayName = day.date.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' });
                    return (
                      <option key={day.dateString} value={day.dateString}>
                        {dayName}
                      </option>
                    );
                  })}
              </select>
            </div>

            {selectedDateForBanner && (() => {
              const selectedDay = calendarDays.find((d) => d.dateString === selectedDateForBanner);
              if (!selectedDay) return null;

              const dayOfWeek = selectedDay.date.getDay();
              const schedule = schedules.get(selectedDateForBanner);
              const isFriday = dayOfWeek === 5;
              const isThursday = dayOfWeek === 4;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              // Define slots based on day
              let slots: { key: string; label: string; bannerKey: keyof Schedule }[] = [];

              if (isFriday) {
                slots = [
                  { key: 'friday_dhuha', label: 'Kuliah Dhuha Jumaat', bannerKey: 'friday_dhuha_banner' },
                  { key: 'friday', label: 'Tazkirah Jumaat', bannerKey: 'friday_banner' }
                ];
              } else if (isThursday) {
                // Thursday - Kuliah Subuh and Kuliah Maghrib
                slots = [
                  { key: 'subuh', label: 'Kuliah Subuh', bannerKey: 'subuh_banner' },
                  { key: 'maghrib', label: 'Kuliah Maghrib', bannerKey: 'maghrib_banner' }
                ];
              } else {
                slots = [
                  { key: 'subuh', label: 'Kuliah Subuh', bannerKey: 'subuh_banner' },
                  { key: 'maghrib', label: 'Kuliah Maghrib', bannerKey: 'maghrib_banner' }
                ];
                if (isWeekend) {
                  slots.splice(1, 0, { key: 'dhuha', label: 'Kuliah Dhuha', bannerKey: 'dhuha_banner' });
                }
              }

              return (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '200px' }}>Slot Kuliah</th>
                        <th>Banner</th>
                        <th style={{ width: '200px' }}>Tindakan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {slots.map((slot) => {
                        const bannerUrl = schedule?.[slot.bannerKey] as string | null;
                        const uploadKey = `${selectedDateForBanner}-${slot.key}`;
                        const isUploading = uploadingBanner === uploadKey;

                        return (
                          <tr key={slot.key}>
                            <td className="fw-bold align-middle">{slot.label}</td>
                            <td className="align-middle">
                              {bannerUrl ? (
                                <div className="d-flex align-items-center gap-2">
                                  <i className="bi bi-file-image text-success"></i>
                                  <span className="text-success">{getBannerFilename(bannerUrl)}</span>
                                  <a
                                    href={bannerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm btn-outline-primary"
                                  >
                                    <i className="bi bi-eye"></i>
                                  </a>
                                </div>
                              ) : (
                                <span className="text-muted">Tiada banner</span>
                              )}
                            </td>
                            <td className="align-middle">
                              <div className="d-flex gap-2">
                                <label className="btn btn-sm btn-primary mb-0" style={{ cursor: 'pointer' }}>
                                  {isUploading ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                  ) : (
                                    <>
                                      <i className="bi bi-upload me-1"></i>
                                      Upload
                                    </>
                                  )}
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    style={{ display: 'none' }}
                                    disabled={isUploading}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleBannerUpload(selectedDateForBanner, slot.key, file);
                                      }
                                      e.target.value = '';
                                    }}
                                  />
                                </label>
                                {bannerUrl && (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleBannerChange(selectedDateForBanner, slot.key as any, null)}
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {selectedDateForBanner && (
              <div className="alert alert-info mt-3">
                <i className="bi bi-lightbulb me-2"></i>
                Selepas upload banner, pastikan klik <strong>"Save Schedules"</strong> di atas untuk menyimpan perubahan.
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .calendar-table {
          table-layout: fixed;
        }
        .calendar-day {
          height: 150px;
          vertical-align: top;
          padding: 8px;
        }
        .calendar-day.other-month {
          background-color: #f8f9fa;
          opacity: 0.5;
        }
        .day-number {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .preacher-slots {
          font-size: 0.875rem;
        }
        .slot select {
          font-size: 0.75rem;
        }
        .print-only {
          display: none;
        }
        .other-month {
          opacity: 0.4;
        }

        @media print {
          /* Print styles are handled in globals.css */
        }
      `}</style>
    </div>
  );
}
