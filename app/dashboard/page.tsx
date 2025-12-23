'use client';

import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Schedule, User } from '@/types';
import { getUserColor } from '@/lib/userColors';

interface PreacherSchedule {
  schedule_date: string;
  subuh_preacher_id: number | null;
  dhuha_preacher_id: number | null;
  maghrib_preacher_id: number | null;
  friday_preacher_id: number | null;
  friday_dhuha_preacher_id: number | null;
  subuh_preacher_name?: string;
  dhuha_preacher_name?: string;
  maghrib_preacher_name?: string;
  friday_preacher_name?: string;
  friday_dhuha_preacher_name?: string;
  subuh_preacher_photo?: string | null;
  dhuha_preacher_photo?: string | null;
  maghrib_preacher_photo?: string | null;
  friday_preacher_photo?: string | null;
  friday_dhuha_preacher_photo?: string | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [imams, setImams] = useState<User[]>([]);
  const [bilals, setBilals] = useState<User[]>([]);
  const [preacherSchedules, setPreacherSchedules] = useState<PreacherSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    totalSchedules: 0,
    totalImams: 0,
    totalBilals: 0,
    upcomingDuties: 0
  });

  // Refs for auto-scrolling to today's column on mobile
  const scheduleTableRef = useRef<HTMLDivElement>(null);
  const preacherTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    // Redirect bendahari to financial dashboard
    if (session?.user.role === 'bendahari') {
      router.push('/financial/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchSchedules();
    }
  }, [session, selectedWeek]);

  const getWednesday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Calculate days to Wednesday (day 3) for the week containing this date
    // Week runs from Wednesday to Tuesday
    // If today is Wednesday (3), Thursday (4), Friday (5), Saturday (6): use this week's Wednesday
    // If today is Sunday (0), Monday (1), Tuesday (2): use this week's Wednesday (which is ahead)
    let diff;
    if (day === 0) {
      // Sunday: go back 4 days to get Wednesday of this week
      diff = -4;
    } else if (day === 1) {
      // Monday: go back 5 days to get Wednesday of this week
      diff = -5;
    } else if (day === 2) {
      // Tuesday: go back 6 days to get Wednesday of this week
      diff = -6;
    } else {
      // Wednesday (3), Thursday (4), Friday (5), Saturday (6): go back (day - 3) days
      diff = 3 - day;
    }
    const wednesday = new Date(d);
    wednesday.setDate(d.getDate() + diff);
    return wednesday;
  };

  const formatDateOnly = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Auto-scroll to today's column on mobile/PWA after data loads
  const scrollToTodayColumn = () => {
    const today = formatDateOnly(new Date());
    const wednesday = getWednesday(selectedWeek);
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(wednesday);
      date.setDate(wednesday.getDate() + i);
      days.push(formatDateOnly(date));
    }
    const todayIndex = days.indexOf(today);

    if (todayIndex >= 0) {
      // Scroll schedule table
      if (scheduleTableRef.current) {
        const table = scheduleTableRef.current.querySelector('table');
        if (table) {
          const headerCells = table.querySelectorAll('thead th');
          if (headerCells[todayIndex + 1]) {
            const cell = headerCells[todayIndex + 1] as HTMLElement;
            scheduleTableRef.current.scrollLeft = Math.max(0, cell.offsetLeft - 60);
          }
        }
      }

      // Scroll preacher table
      if (preacherTableRef.current) {
        const table = preacherTableRef.current.querySelector('table');
        if (table) {
          const headerCells = table.querySelectorAll('thead th');
          if (headerCells[todayIndex + 1]) {
            const cell = headerCells[todayIndex + 1] as HTMLElement;
            preacherTableRef.current.scrollLeft = Math.max(0, cell.offsetLeft - 60);
          }
        }
      }
    }
  };

  // Use multiple attempts to ensure scroll works on PWA
  useEffect(() => {
    if (!loading && schedules.length > 0) {
      // Retry multiple times with increasing delays
      const t1 = setTimeout(scrollToTodayColumn, 100);
      const t2 = setTimeout(scrollToTodayColumn, 300);
      const t3 = setTimeout(scrollToTodayColumn, 600);
      const t4 = setTimeout(scrollToTodayColumn, 1000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [loading, schedules, selectedWeek]);

  const fetchSchedules = async () => {
    setLoading(true);
    const wednesday = getWednesday(selectedWeek);
    const tuesday = new Date(wednesday);
    tuesday.setDate(wednesday.getDate() + 6);

    const startDate = formatDateOnly(wednesday);
    const endDate = formatDateOnly(tuesday);

    try {
      const [schedulesRes, imamsRes, bilalsRes, preacherSchedulesRes] = await Promise.all([
        fetch(`/api/schedules?start_date=${startDate}&end_date=${endDate}`),
        fetch('/api/users?role=imam'),
        fetch('/api/users?role=bilal'),
        fetch(`/api/preacher-schedules?startDate=${startDate}&endDate=${endDate}`),
      ]);

      let schedulesData: Schedule[] = [];
      let imamsData: User[] = [];
      let bilalsData: User[] = [];

      if (schedulesRes.ok) {
        schedulesData = await schedulesRes.json();
        setSchedules(schedulesData);
      }
      if (imamsRes.ok) {
        imamsData = await imamsRes.json();
        setImams(imamsData);
      }
      if (bilalsRes.ok) {
        bilalsData = await bilalsRes.json();
        setBilals(bilalsData);
      }
      if (preacherSchedulesRes.ok) {
        const data = await preacherSchedulesRes.json();
        setPreacherSchedules(data.schedules || []);
      }

      // Calculate stats
      const now = new Date();
      const upcoming = schedulesData.filter((s: Schedule) => new Date(s.date) >= now);

      setStats({
        totalSchedules: schedulesData.length,
        totalImams: imamsData.filter((u: User) => u.is_active).length,
        totalBilals: bilalsData.filter((u: User) => u.is_active).length,
        upcomingDuties: upcoming.length
      });
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const changeWeek = (direction: number) => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(newDate.getDate() + direction * 7);
    setSelectedWeek(newDate);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-MY', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const getWeekDateRange = (weekOffset: number = 0) => {
    const targetDate = new Date(selectedWeek);
    targetDate.setDate(targetDate.getDate() + weekOffset * 7);

    const wednesday = getWednesday(targetDate);
    const tuesday = new Date(wednesday);
    tuesday.setDate(wednesday.getDate() + 6);

    const formatShort = (date: Date) => {
      return date.toLocaleDateString('en-MY', {
        day: 'numeric',
        month: 'short'
      });
    };

    return `${formatShort(wednesday)} - ${formatShort(tuesday)}`;
  };

  const getDaysOfWeek = () => {
    const wednesday = getWednesday(selectedWeek);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(wednesday);
      date.setDate(wednesday.getDate() + i);
      days.push(formatDateOnly(date));
    }
    return days;
  };

  const getScheduleForSlot = (date: string, prayerTime: string) => {
    return schedules.find(
      (s) => s.date.split('T')[0] === date && s.prayer_time === prayerTime
    );
  };

  const getPreacherScheduleForDate = (date: string) => {
    return preacherSchedules.find(
      (ps) => ps.schedule_date === date
    );
  };

  const renderPreacherInfo = (name?: string, photo?: string | null) => {
    if (!name) return <span className="text-muted">-</span>;

    return (
      <div className="d-flex align-items-center gap-1">
        {photo ? (
          <img
            src={photo}
            alt={name}
            width={20}
            height={20}
            className="rounded-circle"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div
            className="rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white"
            style={{ width: '20px', height: '20px', fontSize: '10px' }}
          >
            <i className="bi bi-person-fill"></i>
          </div>
        )}
        <span>{name}</span>
      </div>
    );
  };

  if (status === 'loading' || !session) {
    return (
      <div className="loading">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const days = getDaysOfWeek();
  const prayerTimes = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
  const wednesday = getWednesday(selectedWeek);
  const tuesday = new Date(wednesday);
  tuesday.setDate(wednesday.getDate() + 6);

  return (
    <>
      <Navbar />
      <div className="container mt-4 mb-5">
        {/* Page Header */}
        <div className="row mb-4 no-print">
          <div className="col-md-8">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-calendar-week me-3" style={{ fontSize: '2.5rem', color: '#059669' }}></i>
              <div>
                <h2 className="mb-1">Prayer Schedule</h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                  <i className="bi bi-calendar-range me-2"></i>
                  {wednesday.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} - {tuesday.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 text-end d-flex align-items-center justify-content-end">
            <button className="btn btn-outline-success" onClick={handlePrint}>
              <i className="bi bi-printer me-2"></i>Print Schedule
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="row g-4 mb-4 no-print">
          <div className="col-md-3 col-sm-6">
            <div className="card h-100" style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: 'none',
              color: 'white'
            }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="mb-1 opacity-75" style={{ fontSize: '0.875rem' }}>This Week</p>
                    <h3 className="mb-0 fw-bold" style={{ fontSize: '2rem', color: 'white' }}>{stats.totalSchedules}</h3>
                    <p className="mb-0 mt-1" style={{ fontSize: '0.875rem' }}>Total Schedules</p>
                  </div>
                  <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <i className="bi bi-calendar-check" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="card h-100" style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              color: 'white'
            }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="mb-1 opacity-75" style={{ fontSize: '0.875rem' }}>Active</p>
                    <h3 className="mb-0 fw-bold" style={{ fontSize: '2rem', color: 'white' }}>{stats.totalImams}</h3>
                    <p className="mb-0 mt-1" style={{ fontSize: '0.875rem' }}>Imams Available</p>
                  </div>
                  <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <i className="bi bi-person-badge" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="card h-100" style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              border: 'none',
              color: 'white'
            }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="mb-1 opacity-75" style={{ fontSize: '0.875rem' }}>Active</p>
                    <h3 className="mb-0 fw-bold" style={{ fontSize: '2rem', color: 'white' }}>{stats.totalBilals}</h3>
                    <p className="mb-0 mt-1" style={{ fontSize: '0.875rem' }}>Bilals Available</p>
                  </div>
                  <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <i className="bi bi-person-check" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="card h-100" style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              color: 'white'
            }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="mb-1 opacity-75" style={{ fontSize: '0.875rem' }}>Upcoming</p>
                    <h3 className="mb-0 fw-bold" style={{ fontSize: '2rem', color: 'white' }}>{stats.upcomingDuties}</h3>
                    <p className="mb-0 mt-1" style={{ fontSize: '0.875rem' }}>Prayer Duties</p>
                  </div>
                  <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                    <i className="bi bi-clock-history" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="card mb-4 no-print" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
              <button
                className="btn btn-secondary d-flex flex-column align-items-center justify-content-center"
                onClick={() => changeWeek(-1)}
                style={{ minHeight: '44px', flex: '1 1 auto' }}
              >
                <div className="d-flex align-items-center">
                  <i className="bi bi-chevron-left me-1"></i>
                  <span className="d-none d-sm-inline">Previous Week</span>
                  <span className="d-inline d-sm-none">Prev</span>
                </div>
                <small className="text-white-50 mt-1">{getWeekDateRange(-1)}</small>
              </button>
              <button
                className="btn btn-primary d-flex flex-column align-items-center justify-content-center"
                onClick={() => setSelectedWeek(new Date())}
                style={{ minWidth: '120px', minHeight: '44px', flex: '1 1 auto' }}
              >
                <div className="d-flex align-items-center">
                  <i className="bi bi-calendar-check me-1"></i>
                  <span className="d-none d-sm-inline">Current Week</span>
                  <span className="d-inline d-sm-none">Today</span>
                </div>
                <small className="text-white-50 mt-1">{getWeekDateRange(0)}</small>
              </button>
              <button
                className="btn btn-secondary d-flex flex-column align-items-center justify-content-center"
                onClick={() => changeWeek(1)}
                style={{ minHeight: '44px', flex: '1 1 auto' }}
              >
                <div className="d-flex align-items-center">
                  <span className="d-none d-sm-inline">Next Week</span>
                  <span className="d-inline d-sm-none">Next</span>
                  <i className="bi bi-chevron-right ms-1"></i>
                </div>
                <small className="text-white-50 mt-1">{getWeekDateRange(1)}</small>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="alert alert-warning">
            No schedule available for this week.
          </div>
        ) : (
          <>
            {/* Schedule Table */}
            <div className="card mb-3">
              <div className="card-header text-white">
                <h5 className="mb-0">
                  <i className="bi bi-table me-2"></i>Weekly Prayer Schedule
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive" ref={scheduleTableRef}>
                <table className="table table-bordered prayer-schedule-table" style={{ fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.4rem' }}>Prayer Time</th>
                      {days.map((date) => (
                        <th key={date} style={{ padding: '0.4rem' }}>{formatDate(date)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prayerTimes.map((prayer) => (
                      <tr key={prayer}>
                        <td className="prayer-time-cell" style={{ padding: '0.4rem' }}>{prayer}</td>
                        {days.map((date) => {
                          const schedule = getScheduleForSlot(date, prayer);
                          // Special styling for Jumaat (Friday Zohor prayer) - black background, white text
                          const dayOfWeek = new Date(date).getDay(); // 5 = Friday
                          const isJumaat = dayOfWeek === 5 && prayer === 'Zohor';
                          const jumaatStyle = { bg: '#000000', text: '#FFFFFF', border: '#333333' };

                          return (
                            <td key={`${date}-${prayer}`} style={{ padding: '0.3rem' }}>
                              {schedule ? (
                                <div>
                                  <div
                                    className="mb-1 p-1 rounded"
                                    style={{
                                      backgroundColor: isJumaat ? jumaatStyle.bg : getUserColor(schedule.imam_id).bg,
                                      border: `1px solid ${isJumaat ? jumaatStyle.border : getUserColor(schedule.imam_id).border}`,
                                    }}
                                  >
                                    <span style={{ color: isJumaat ? jumaatStyle.text : getUserColor(schedule.imam_id).text, fontWeight: 'bold' }}>Imam: {schedule.imam_name}</span>
                                  </div>
                                  <div
                                    className="p-1 rounded"
                                    style={{
                                      backgroundColor: isJumaat ? jumaatStyle.bg : getUserColor(schedule.bilal_id).bg,
                                      border: `1px solid ${isJumaat ? jumaatStyle.border : getUserColor(schedule.bilal_id).border}`,
                                    }}
                                  >
                                    <span style={{ color: isJumaat ? jumaatStyle.text : getUserColor(schedule.bilal_id).text, fontWeight: 'bold' }}>Bilal: {schedule.bilal_name}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </div>

            {/* Jadual Ceramah */}
            <div className="card mb-3 mt-4">
              <div className="card-header text-white">
                <h5 className="mb-0">
                  <i className="bi bi-megaphone me-2"></i>Jadual Ceramah
                </h5>
              </div>
              <div className="card-body">
                <div className="table-responsive" ref={preacherTableRef}>
                  <table className="table table-bordered" style={{ fontSize: '0.75rem' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '0.4rem' }}>Preaching Slot</th>
                        {days.map((date) => (
                          <th key={date} style={{ padding: '0.4rem' }}>{formatDate(date)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="prayer-time-cell" style={{ padding: '0.4rem' }}>Subuh</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          // Monday (1) and Thursday (4) - No preaching
                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-subuh`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

                          // Friday (5) - No Subuh preaching (only Friday preach)
                          if (dayOfWeek === 5) {
                            return (
                              <td key={`${date}-subuh`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                -
                              </td>
                            );
                          }

                          return (
                            <td key={`${date}-subuh`} style={{ padding: '0.3rem' }}>
                              {renderPreacherInfo(preacherSchedule?.subuh_preacher_name, preacherSchedule?.subuh_preacher_photo)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="prayer-time-cell" style={{ padding: '0.4rem' }}>Dhuha (Weekend)</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          // Monday (1) and Thursday (4) - No preaching
                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-dhuha`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

                          // Only show Dhuha on weekends (Sunday=0, Saturday=6)
                          if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                            return (
                              <td key={`${date}-dhuha`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                -
                              </td>
                            );
                          }

                          return (
                            <td key={`${date}-dhuha`} style={{ padding: '0.3rem' }}>
                              {renderPreacherInfo(preacherSchedule?.dhuha_preacher_name, preacherSchedule?.dhuha_preacher_photo)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="prayer-time-cell" style={{ padding: '0.4rem' }}>Kuliah Dhuha (Jumaat)</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          // Monday (1) and Thursday (4) - No preaching
                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-friday-dhuha`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

                          // Only Friday (5) has Kuliah Dhuha
                          if (dayOfWeek !== 5) {
                            return (
                              <td key={`${date}-friday-dhuha`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                -
                              </td>
                            );
                          }

                          return (
                            <td key={`${date}-friday-dhuha`} style={{ padding: '0.3rem' }}>
                              {renderPreacherInfo(preacherSchedule?.friday_dhuha_preacher_name, preacherSchedule?.friday_dhuha_preacher_photo)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="prayer-time-cell" style={{ padding: '0.4rem' }}>Khutbah Jumaat</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          // Monday (1) and Thursday (4) - No preaching
                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-friday`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

                          // Only Friday (5) has Friday preach
                          if (dayOfWeek !== 5) {
                            return (
                              <td key={`${date}-friday`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                -
                              </td>
                            );
                          }

                          return (
                            <td key={`${date}-friday`} style={{ padding: '0.3rem' }}>
                              {renderPreacherInfo(preacherSchedule?.friday_preacher_name, preacherSchedule?.friday_preacher_photo)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="prayer-time-cell" style={{ padding: '0.4rem' }}>Maghrib</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          // Monday (1) and Thursday (4) - No preaching
                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-maghrib`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

                          // Friday (5) - No Maghrib preaching (only Friday preach)
                          if (dayOfWeek === 5) {
                            return (
                              <td key={`${date}-maghrib`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                -
                              </td>
                            );
                          }

                          return (
                            <td key={`${date}-maghrib`} style={{ padding: '0.3rem' }}>
                              {renderPreacherInfo(preacherSchedule?.maghrib_preacher_name, preacherSchedule?.maghrib_preacher_photo)}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </>
  );
}
