'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getUserColor } from '@/lib/userColors';
import { useToast } from '@/components/Toast';

interface Schedule {
  id: number;
  date: string;
  prayer_time: string;
  imam_id: number;
  bilal_id: number;
  imam_name?: string;
  bilal_name?: string;
}

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
  subuh_banner?: string | null;
  dhuha_banner?: string | null;
  maghrib_banner?: string | null;
  friday_banner?: string | null;
  friday_dhuha_banner?: string | null;
}

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
  image_file: string | null;
  status: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [preacherSchedules, setPreacherSchedules] = useState<PreacherSchedule[]>([]);
  const [schedulesLoading, setSchedulesLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedBanner, setSelectedBanner] = useState<string | null>(null);
  const [aktivitiList, setAktivitiList] = useState<Aktiviti[]>([]);
  const [selectedAktiviti, setSelectedAktiviti] = useState<Aktiviti | null>(null);
  const [prayerTimesData, setPrayerTimesData] = useState<{
    Subuh: string;
    Zohor: string;
    Asar: string;
    Maghrib: string;
    Isyak: string;
  } | null>(null);
  const [prayerTimesLoading, setPrayerTimesLoading] = useState(true);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; countdown: string } | null>(null);
  const router = useRouter();
  const prayerTableRef = useRef<HTMLDivElement>(null);
  const kuliahTableRef = useRef<HTMLDivElement>(null);

  // Define helper functions first (before they are used)
  const getWednesday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Calculate days to Wednesday (day 3) for the week containing this date
    // Week runs from Wednesday to Tuesday
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

  // Scroll to today's column function (defined after helper functions)
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
      // Scroll prayer table
      if (prayerTableRef.current) {
        const table = prayerTableRef.current.querySelector('table');
        if (table) {
          const headerCells = table.querySelectorAll('thead th');
          if (headerCells[todayIndex + 1]) {
            const cell = headerCells[todayIndex + 1] as HTMLElement;
            prayerTableRef.current.scrollLeft = Math.max(0, cell.offsetLeft - 60);
          }
        }
      }
      // Scroll kuliah table
      if (kuliahTableRef.current) {
        const table = kuliahTableRef.current.querySelector('table');
        if (table) {
          const headerCells = table.querySelectorAll('thead th');
          if (headerCells[todayIndex + 1]) {
            const cell = headerCells[todayIndex + 1] as HTMLElement;
            kuliahTableRef.current.scrollLeft = Math.max(0, cell.offsetLeft - 60);
          }
        }
      }
    }
  };

  // Fetch prayer times for Kajang, Selangor (zone SGR01)
  useEffect(() => {
    const fetchPrayerTimes = async () => {
      try {
        setPrayerTimesLoading(true);
        // Using JAKIM e-solat API for Kajang, Selangor (zone SGR01)
        const res = await fetch('/api/prayer-times');
        if (res.ok) {
          const data = await res.json();
          setPrayerTimesData(data);
        }
      } catch (error) {
        console.error('Error fetching prayer times:', error);
      } finally {
        setPrayerTimesLoading(false);
      }
    };
    fetchPrayerTimes();
  }, []);

  // Countdown to next prayer time
  useEffect(() => {
    if (!prayerTimesData) return;

    const calculateNextPrayer = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      const prayers = [
        { name: 'Subuh', time: prayerTimesData.Subuh },
        { name: 'Zohor', time: prayerTimesData.Zohor },
        { name: 'Asar', time: prayerTimesData.Asar },
        { name: 'Maghrib', time: prayerTimesData.Maghrib },
        { name: 'Isyak', time: prayerTimesData.Isyak },
      ];

      // Convert time string (HH:MM) to minutes
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      // Find next prayer
      let nextPrayerInfo = null;
      for (const prayer of prayers) {
        const prayerMinutes = timeToMinutes(prayer.time);
        if (prayerMinutes > currentTime) {
          nextPrayerInfo = prayer;
          break;
        }
      }

      // If no prayer found today, next is Subuh tomorrow
      if (!nextPrayerInfo) {
        nextPrayerInfo = prayers[0]; // Subuh
        const prayerMinutes = timeToMinutes(nextPrayerInfo.time);
        const remainingToday = (24 * 60) - currentTime;
        const totalMinutes = remainingToday + prayerMinutes;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const seconds = 60 - now.getSeconds();

        setNextPrayer({
          name: nextPrayerInfo.name,
          time: nextPrayerInfo.time,
          countdown: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        });
        return;
      }

      // Calculate countdown
      const prayerMinutes = timeToMinutes(nextPrayerInfo.time);
      let diffMinutes = prayerMinutes - currentTime;
      let diffSeconds = 60 - now.getSeconds();

      if (diffSeconds === 60) {
        diffSeconds = 0;
      } else {
        diffMinutes -= 1;
      }

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;

      setNextPrayer({
        name: nextPrayerInfo.name,
        time: nextPrayerInfo.time,
        countdown: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${diffSeconds.toString().padStart(2, '0')}`
      });
    };

    // Calculate immediately
    calculateNextPrayer();

    // Update every second
    const interval = setInterval(calculateNextPrayer, 1000);

    return () => clearInterval(interval);
  }, [prayerTimesData]);

  // Fetch aktiviti with images
  useEffect(() => {
    const fetchAktiviti = async () => {
      try {
        // Get current month for filtering
        const now = new Date();
        const bulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const res = await fetch(`/api/aktiviti?bulan=${bulan}`);
        if (res.ok) {
          const data = await res.json();
          // Filter only aktiviti with images
          const aktivitiWithImages = (data.data || []).filter((a: Aktiviti) => a.image_file);
          setAktivitiList(aktivitiWithImages);
        }
      } catch (error) {
        console.error('Error fetching aktiviti:', error);
      }
    };
    fetchAktiviti();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedWeek]);

  // Auto-scroll to today's column when schedules are loaded
  useEffect(() => {
    if (!schedulesLoading && schedules.length > 0) {
      // Multiple retries to ensure DOM is fully rendered
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
  }, [schedulesLoading, schedules, selectedWeek]);

  const fetchSchedules = async () => {
    setSchedulesLoading(true);
    const wednesday = getWednesday(selectedWeek);
    const tuesday = new Date(wednesday);
    tuesday.setDate(wednesday.getDate() + 6);

    const startDate = formatDateOnly(wednesday);
    const endDate = formatDateOnly(tuesday);

    try {
      const [schedulesRes, preacherSchedulesRes] = await Promise.all([
        fetch(`/api/schedules/public?start_date=${startDate}&end_date=${endDate}`),
        fetch(`/api/preacher-schedules?startDate=${startDate}&endDate=${endDate}`),
      ]);

      if (schedulesRes.ok) {
        const data = await schedulesRes.json();
        setSchedules(data);
      }
      if (preacherSchedulesRes.ok) {
        const data = await preacherSchedulesRes.json();
        setPreacherSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setSchedulesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Emel atau kata laluan tidak sah');
      } else {
        toast.success('Log masuk berjaya!');
        router.push('/dashboard');
      }
    } catch (err) {
      toast.error('Ralat berlaku. Sila cuba lagi.');
    } finally {
      setLoading(false);
    }
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
    return preacherSchedules.find((ps) => ps.schedule_date === date);
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

  // Get banners for today only
  const getBannersForToday = () => {
    const banners: { date: string; slot: string; label: string; preacherName?: string; bannerUrl: string }[] = [];
    const today = formatDateOnly(new Date());

    // Find today's schedule
    const todaySchedule = preacherSchedules.find((ps) => ps.schedule_date === today);
    if (!todaySchedule) return banners;

    const dateObj = new Date(todaySchedule.schedule_date);
    const dayOfWeek = dateObj.getDay();
    const formattedDate = dateObj.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' });

    // Skip Monday (1) and Thursday (4) - No preaching
    if (dayOfWeek === 1 || dayOfWeek === 4) return banners;

    if (dayOfWeek === 5) {
      // Friday
      if (todaySchedule.friday_dhuha_banner) {
        banners.push({
          date: today,
          slot: 'friday_dhuha',
          label: `Kuliah Dhuha Jumaat`,
          preacherName: todaySchedule.friday_dhuha_preacher_name,
          bannerUrl: todaySchedule.friday_dhuha_banner
        });
      }
      if (todaySchedule.friday_banner) {
        banners.push({
          date: today,
          slot: 'friday',
          label: `Tazkirah Jumaat`,
          preacherName: todaySchedule.friday_preacher_name,
          bannerUrl: todaySchedule.friday_banner
        });
      }
    } else {
      // Other days
      if (todaySchedule.subuh_banner) {
        banners.push({
          date: today,
          slot: 'subuh',
          label: `Kuliah Subuh`,
          preacherName: todaySchedule.subuh_preacher_name,
          bannerUrl: todaySchedule.subuh_banner
        });
      }
      if ((dayOfWeek === 0 || dayOfWeek === 6) && todaySchedule.dhuha_banner) {
        banners.push({
          date: today,
          slot: 'dhuha',
          label: `Kuliah Dhuha`,
          preacherName: todaySchedule.dhuha_preacher_name,
          bannerUrl: todaySchedule.dhuha_banner
        });
      }
      if (todaySchedule.maghrib_banner) {
        banners.push({
          date: today,
          slot: 'maghrib',
          label: `Kuliah Maghrib`,
          preacherName: todaySchedule.maghrib_preacher_name,
          bannerUrl: todaySchedule.maghrib_banner
        });
      }
    }

    return banners;
  };

  const days = getDaysOfWeek();
  const prayerTimes = ['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isyak'];
  const wednesday = getWednesday(selectedWeek);
  const tuesday = new Date(wednesday);
  tuesday.setDate(wednesday.getDate() + 6);

  return (
    <div className="min-vh-100" style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)' }}>
      {/* Header */}
      <nav className="navbar navbar-light bg-white shadow-sm" style={{ borderBottom: '3px solid #f59e0b' }}>
        <div className="container-fluid">
          <span className="navbar-brand mb-0 h1 fw-bold d-flex align-items-center" style={{ color: '#059669' }}>
            <i className="bi bi-mosque me-2" style={{ fontSize: '2rem' }}></i>
            <div>
              <div style={{ fontSize: '1.5rem', lineHeight: '1.2' }}>Surau Ar-Raudhah</div>
              <div style={{ fontSize: '0.875rem', fontWeight: '400', color: '#4b5563' }}>(SAR)</div>
            </div>
          </span>
          <div className="d-flex gap-1 gap-md-2 flex-wrap justify-content-end">
            <a
              href="/sumbang-derma"
              className="btn btn-outline-danger d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem',
                borderColor: '#dc3545',
                color: '#dc3545'
              }}
            >
              <i className="bi bi-hand-thumbs-up-fill"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Derma</span>
            </a>
            <a
              href="/kalendar-aktiviti"
              className="btn btn-outline-primary d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem'
              }}
            >
              <i className="bi bi-calendar-event"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Aktiviti</span>
            </a>
            <a
              href="/permohonan-majlis"
              className="btn btn-outline-success d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem'
              }}
            >
              <i className="bi bi-calendar-plus"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Majlis</span>
            </a>
            <a
              href="/maklumbalas"
              className="btn btn-outline-warning d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem'
              }}
            >
              <i className="bi bi-chat-left-text"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Aduan</span>
            </a>
            <a
              href="/khairat"
              className="btn btn-outline-purple d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem',
                borderColor: '#6f42c1',
                color: '#6f42c1'
              }}
            >
              <i className="bi bi-people"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Khairat</span>
            </a>
            <a
              href="/komuniti2u"
              className="btn btn-outline-success d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem'
              }}
            >
              <i className="bi bi-shop"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Komuniti</span>
            </a>
            <a
              href="/soalan-agama"
              className="btn btn-outline-info d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem'
              }}
            >
              <i className="bi bi-book"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Soalan</span>
            </a>
            <a
              href="/tender"
              className="btn btn-outline-dark d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem',
                borderColor: '#0d6efd',
                color: '#0d6efd'
              }}
            >
              <i className="bi bi-file-earmark-text"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Tender</span>
            </a>
            <a
              href="/semak-status"
              className="btn btn-outline-secondary d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem'
              }}
            >
              <i className="bi bi-search"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Semak</span>
            </a>
            <a
              href="/help/public"
              className="btn btn-outline-dark d-flex flex-column align-items-center justify-content-center"
              style={{
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem'
              }}
            >
              <i className="bi bi-question-circle"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Bantuan</span>
            </a>
            <button
              className="btn btn-success d-flex flex-column align-items-center justify-content-center"
              onClick={() => setShowLoginModal(true)}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                border: 'none',
                minWidth: '48px',
                height: 'auto',
                borderRadius: '0.5rem',
                fontSize: '1.1rem',
                padding: '0.4rem 0.3rem'
              }}
            >
              <i className="bi bi-box-arrow-in-right"></i>
              <span style={{ fontSize: '0.6rem', marginTop: '2px', lineHeight: '1.1' }}>Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Prayer Times Section */}
      <div className="py-2" style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)' }}>
        <div className="container-fluid">
          <div className="d-flex align-items-center justify-content-center flex-wrap gap-2 gap-md-4">
            <div className="d-flex align-items-center text-white me-2">
              <i className="bi bi-clock-fill me-2" style={{ fontSize: '1rem' }}></i>
              <span className="fw-bold" style={{ fontSize: '0.85rem' }}>Waktu Solat Kajang</span>
            </div>
            {prayerTimesLoading ? (
              <div className="d-flex align-items-center text-white">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                <span style={{ fontSize: '0.8rem' }}>Memuatkan...</span>
              </div>
            ) : prayerTimesData ? (
              <>
                <div className="d-flex align-items-center px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <i className="bi bi-sunrise text-warning me-1" style={{ fontSize: '0.9rem' }}></i>
                  <span className="text-white" style={{ fontSize: '0.75rem' }}>
                    <span className="fw-bold">Subuh</span> {prayerTimesData.Subuh}
                  </span>
                </div>
                <div className="d-flex align-items-center px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <i className="bi bi-sun text-warning me-1" style={{ fontSize: '0.9rem' }}></i>
                  <span className="text-white" style={{ fontSize: '0.75rem' }}>
                    <span className="fw-bold">Zohor</span> {prayerTimesData.Zohor}
                  </span>
                </div>
                <div className="d-flex align-items-center px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <i className="bi bi-brightness-high text-warning me-1" style={{ fontSize: '0.9rem' }}></i>
                  <span className="text-white" style={{ fontSize: '0.75rem' }}>
                    <span className="fw-bold">Asar</span> {prayerTimesData.Asar}
                  </span>
                </div>
                <div className="d-flex align-items-center px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <i className="bi bi-sunset text-warning me-1" style={{ fontSize: '0.9rem' }}></i>
                  <span className="text-white" style={{ fontSize: '0.75rem' }}>
                    <span className="fw-bold">Maghrib</span> {prayerTimesData.Maghrib}
                  </span>
                </div>
                <div className="d-flex align-items-center px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <i className="bi bi-moon-stars text-warning me-1" style={{ fontSize: '0.9rem' }}></i>
                  <span className="text-white" style={{ fontSize: '0.75rem' }}>
                    <span className="fw-bold">Isyak</span> {prayerTimesData.Isyak}
                  </span>
                </div>
                {/* Next Prayer Countdown */}
                {nextPrayer && (
                  <div
                    className="d-flex align-items-center px-3 py-1 rounded ms-2"
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    <i className="bi bi-hourglass-split text-white me-2" style={{ fontSize: '0.9rem' }}></i>
                    <div className="text-white" style={{ fontSize: '0.75rem' }}>
                      <span className="fw-bold">{nextPrayer.name}</span>
                      <span className="mx-1">dalam</span>
                      <span
                        className="fw-bold"
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {nextPrayer.countdown}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <span className="text-white" style={{ fontSize: '0.8rem' }}>Waktu solat tidak tersedia</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mt-4 pb-5">
        {/* Week Navigation */}
        <div className="card mb-4" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)' }}>
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-4 mb-3 mb-md-0">
                <h4 className="mb-1 d-flex align-items-center" style={{ color: '#059669' }}>
                  <i className="bi bi-calendar-week me-2"></i>
                  Weekly Schedule
                </h4>
                <p className="text-muted mb-0 small">
                  <i className="bi bi-calendar-range me-1"></i>
                  {wednesday.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })} - {tuesday.toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="col-md-8 text-end">
                <div className="btn-group">
                  <button
                    className="btn btn-outline-secondary d-flex align-items-center"
                    onClick={() => changeWeek(-1)}
                    disabled={schedulesLoading}
                  >
                    <i className="bi bi-chevron-left me-1"></i> Previous
                  </button>
                  <button
                    className="btn btn-primary d-flex align-items-center"
                    onClick={() => setSelectedWeek(new Date())}
                    disabled={schedulesLoading}
                  >
                    <i className="bi bi-calendar-check me-1"></i> Current Week
                  </button>
                  <button
                    className="btn btn-outline-secondary d-flex align-items-center"
                    onClick={() => changeWeek(1)}
                    disabled={schedulesLoading}
                  >
                    Next <i className="bi bi-chevron-right ms-1"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner Section - Display at top before schedules (today only) */}
        {!schedulesLoading && getBannersForToday().length > 0 && (
          <div className="card mb-4">
            <div className="card-header text-white">
              <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>
                <i className="bi bi-megaphone-fill me-2"></i>
                Poster Kuliah Hari Ini
              </h6>
            </div>
            <div className="card-body p-2">
              <div className="row g-2 justify-content-center">
                {getBannersForToday().map((banner, index) => (
                  <div key={`${banner.date}-${banner.slot}`} className="col-4 col-md-3 col-lg-2">
                    <div
                      className="shadow-sm"
                      style={{ cursor: 'pointer', transition: 'transform 0.2s', borderRadius: '0.375rem', overflow: 'hidden' }}
                      onClick={() => setSelectedBanner(banner.bannerUrl)}
                      onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                      onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      <img
                        src={banner.bannerUrl}
                        alt={banner.label}
                        style={{
                          width: '100%',
                          height: 'auto',
                          display: 'block'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-muted mb-0 mt-2" style={{ fontSize: '0.7rem' }}>
                <i className="bi bi-hand-index me-1"></i>Tekan poster untuk lihat saiz penuh
              </p>
            </div>
          </div>
        )}

        {schedulesLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading schedules...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="alert alert-warning">
            No schedule available for this week.
          </div>
        ) : (
          <>
            {/* Prayer Schedule */}
            <div className="card mb-4">
              <div className="card-header text-white">
                <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>
                  <i className="bi bi-clock me-2"></i>
                  Prayer Schedule
                </h6>
              </div>
              <div className="card-body">
                <div className="table-responsive" ref={prayerTableRef}>
                  <table className="table table-bordered" style={{ fontSize: '0.75rem' }}>
                    <thead className="table-light">
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
                          <td className="fw-bold" style={{ padding: '0.4rem' }}>{prayer}</td>
                          {days.map((date) => {
                            const schedule = getScheduleForSlot(date, prayer);
                            return (
                              <td key={`${date}-${prayer}`} style={{ padding: '0.3rem' }}>
                                {schedule ? (
                                  <div>
                                    <div
                                      className="mb-1 p-1 rounded"
                                      style={{
                                        backgroundColor: getUserColor(schedule.imam_id).bg,
                                        color: getUserColor(schedule.imam_id).text,
                                        border: `1px solid ${getUserColor(schedule.imam_id).border}`,
                                      }}
                                    >
                                      <strong>Imam:</strong> {schedule.imam_name}
                                    </div>
                                    <div
                                      className="p-1 rounded"
                                      style={{
                                        backgroundColor: getUserColor(schedule.bilal_id).bg,
                                        color: getUserColor(schedule.bilal_id).text,
                                        border: `1px solid ${getUserColor(schedule.bilal_id).border}`,
                                      }}
                                    >
                                      <strong>Bilal:</strong> {schedule.bilal_name}
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

            {/* Jadual Kuliah */}
            <div className="card mb-4">
              <div className="card-header text-white">
                <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>
                  <i className="bi bi-megaphone me-2"></i>
                  Jadual Kuliah
                </h6>
              </div>
              <div className="card-body">
                <div className="table-responsive" ref={kuliahTableRef}>
                  <table className="table table-bordered" style={{ fontSize: '0.75rem' }}>
                    <thead className="table-light">
                      <tr>
                        <th style={{ padding: '0.4rem' }}>Preaching Slot</th>
                        {days.map((date) => (
                          <th key={date} style={{ padding: '0.4rem' }}>{formatDate(date)}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-bold" style={{ padding: '0.4rem' }}>Kuliah Subuh</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-subuh`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

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
                        <td className="fw-bold" style={{ padding: '0.4rem' }}>Dhuha (Weekend)</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-dhuha`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

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
                        <td className="fw-bold" style={{ padding: '0.4rem' }}>Kuliah Dhuha (Jumaat)</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-friday-dhuha`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

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
                        <td className="fw-bold" style={{ padding: '0.4rem' }}>Tazkirah Jumaat</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-friday`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

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
                        <td className="fw-bold" style={{ padding: '0.4rem' }}>Kuliah Maghrib</td>
                        {days.map((date) => {
                          const dateObj = new Date(date);
                          const dayOfWeek = dateObj.getDay();
                          const preacherSchedule = getPreacherScheduleForDate(date);

                          if (dayOfWeek === 1 || dayOfWeek === 4) {
                            return (
                              <td key={`${date}-maghrib`} className="text-center text-muted" style={{ padding: '0.3rem' }}>
                                No Preaching
                              </td>
                            );
                          }

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

            {/* Aktiviti Section - Display activities with images */}
            {aktivitiList.length > 0 && (
              <div className="card mb-4">
                <div className="card-header text-white">
                  <h6 className="mb-0" style={{ fontSize: '0.9rem' }}>
                    <i className="bi bi-calendar-event-fill me-2"></i>
                    Poster Aktiviti Bulan Ini
                  </h6>
                </div>
                <div className="card-body p-2">
                  <div className="row g-2 justify-content-center">
                    {aktivitiList.map((aktiviti) => (
                      <div key={aktiviti.id} className="col-4 col-md-3 col-lg-2">
                        <div
                          className="shadow-sm"
                          style={{ cursor: 'pointer', transition: 'transform 0.2s', borderRadius: '0.375rem', overflow: 'hidden' }}
                          onClick={() => setSelectedAktiviti(aktiviti)}
                          onMouseOver={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                          onMouseOut={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                        >
                          <img
                            src={aktiviti.image_file!}
                            alt={aktiviti.tajuk}
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-muted mb-0 mt-2" style={{ fontSize: '0.7rem' }}>
                    <i className="bi bi-hand-index me-1"></i>Tekan poster untuk lihat saiz penuh
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Banner View Modal */}
      {selectedBanner && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setSelectedBanner(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="position-relative" style={{ maxHeight: '90vh', overflow: 'auto' }}>
              <button
                type="button"
                className="btn btn-light position-fixed"
                style={{ top: '20px', right: '20px', zIndex: 1060 }}
                onClick={() => setSelectedBanner(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <img
                src={selectedBanner}
                alt="Banner"
                style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Aktiviti Image View Modal */}
      {selectedAktiviti && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}
          onClick={() => setSelectedAktiviti(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" style={{ backgroundColor: 'transparent', border: 'none' }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="btn btn-light position-absolute"
                style={{ top: '-45px', right: '0', zIndex: 1060 }}
                onClick={() => setSelectedAktiviti(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
                <img
                  src={selectedAktiviti.image_file!}
                  alt={selectedAktiviti.tajuk}
                  style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto', borderRadius: '0.5rem' }}
                />
              </div>
              {/* Keterangan Section */}
              <div className="mt-3 p-3" style={{ backgroundColor: 'white', borderRadius: '0.5rem' }}>
                <h5 className="mb-2" style={{ color: '#059669' }}>
                  <i className="bi bi-calendar-event me-2"></i>
                  {selectedAktiviti.tajuk}
                </h5>
                {selectedAktiviti.keterangan && (
                  <p className="mb-2 text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedAktiviti.keterangan}
                  </p>
                )}
                <div className="text-muted small">
                  <i className="bi bi-geo-alt me-1"></i>
                  {selectedAktiviti.lokasi}
                  <span className="mx-2">|</span>
                  <i className="bi bi-calendar3 me-1"></i>
                  {new Date(selectedAktiviti.tarikh_mula).toLocaleDateString('ms-MY', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                  {selectedAktiviti.masa_mula && (
                    <>
                      <span className="mx-2">|</span>
                      <i className="bi bi-clock me-1"></i>
                      {selectedAktiviti.masa_mula}
                      {selectedAktiviti.masa_tamat && ` - ${selectedAktiviti.masa_tamat}`}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
              <div className="modal-header" style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderBottom: 'none',
                color: 'white'
              }}>
                <h5 className="modal-title fw-bold d-flex align-items-center">
                  <i className="bi bi-shield-lock me-2"></i>
                  Staff Login
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowLoginModal(false)}
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '2rem' }}>
                <form onSubmit={handleSubmit} autoComplete="off">
                  <input type="text" name="fake-username" autoComplete="username" style={{ display: 'none' }} />
                  <input type="password" name="fake-password" autoComplete="new-password" style={{ display: 'none' }} />

                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="off"
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-success w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
