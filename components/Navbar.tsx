'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  const userRole = (session.user as any).role;
  const additionalRoles: string[] = (session.user as any).additionalRoles || [];
  const allRoles = [userRole, ...additionalRoles];

  // Helper function to check if user has any of the specified roles
  const hasRole = (...roles: string[]) => allRoles.some(r => roles.includes(r));

  return (
    <nav className="navbar navbar-expand-lg navbar-dark no-print" style={{
      background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065f46 100%)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      borderBottom: '3px solid #f59e0b'
    }}>
      <div className="container-fluid">
        <Link className="navbar-brand d-flex align-items-center" href="/dashboard">
          <i className="bi bi-mosque me-2" style={{ fontSize: '1.75rem' }}></i>
          <span>iSAR</span>
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-label="Toggle navigation"
          style={{
            minHeight: '44px',
            minWidth: '44px',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Dashboard - All users */}
            <li className="nav-item">
              <Link
                className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
                href="/dashboard"
              >
                <i className="bi bi-speedometer2 me-1"></i>
                Dashboard
              </Link>
            </li>

            {/* Jadual Solat - head_imam, admin */}
            {(userRole === 'head_imam' || userRole === 'admin') && (
              <li className="nav-item dropdown">
                <a
                  className={`nav-link dropdown-toggle ${
                    pathname === '/schedules/manage' ||
                    pathname === '/preacher-schedules' ||
                    pathname === '/dashboard/unavailability' ||
                    pathname === '/dashboard/whatsapp-test'
                      ? 'active' : ''
                  }`}
                  href="#"
                  id="jadualDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-calendar-week me-1"></i>
                  Penjadualan
                </a>
                <ul className="dropdown-menu" aria-labelledby="jadualDropdown">
                  <li>
                    <Link className="dropdown-item" href="/schedules/manage">
                      <i className="bi bi-calendar-plus me-2"></i>
                      Urus Jadual
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/preacher-schedules">
                      <i className="bi bi-person-video3 me-2"></i>
                      Jadual Penceramah
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/unavailability">
                      <i className="bi bi-calendar-x me-2"></i>
                      Senarai Ketidakhadiran
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/whatsapp-test">
                      <i className="bi bi-whatsapp me-2"></i>
                      WhatsApp Test
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Preacher Schedules - for imam/bilal only (no dropdown) */}
            {hasRole('imam', 'bilal') && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${pathname === '/preacher-schedules' ? 'active' : ''}`}
                    href="/preacher-schedules"
                  >
                    <i className="bi bi-person-video3 me-1"></i>
                    Jadual Penceramah
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${pathname === '/availability' ? 'active' : ''}`}
                    href="/availability"
                  >
                    <i className="bi bi-calendar-check me-1"></i>
                    Kehadiran Saya
                  </Link>
                </li>
              </>
            )}

            {/* Pengurusan Aset - admin, inventory_staff */}
            {(userRole === 'admin' || userRole === 'inventory_staff') && (
              <li className="nav-item dropdown">
                <a
                  className={`nav-link dropdown-toggle ${pathname.startsWith('/aset') ? 'active' : ''}`}
                  href="#"
                  id="asetDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-box-seam me-1"></i>
                  Aset
                </a>
                <ul className="dropdown-menu" aria-labelledby="asetDropdown">
                  <li>
                    <Link className="dropdown-item" href="/aset">
                      <i className="bi bi-speedometer2 me-2"></i>
                      Dashboard Aset
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" href="/aset/lokasi">
                      <i className="bi bi-geo-alt me-2"></i>
                      Lokasi
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/aset/pemeriksaan">
                      <i className="bi bi-clipboard-check me-2"></i>
                      Pemeriksaan
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/aset/penyelenggaraan">
                      <i className="bi bi-tools me-2"></i>
                      Penyelenggaraan
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/aset/pergerakan">
                      <i className="bi bi-arrow-left-right me-2"></i>
                      Pergerakan/Pinjaman
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" href="/aset/pelupusan">
                      <i className="bi bi-trash me-2"></i>
                      Pelupusan
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/aset/kehilangan">
                      <i className="bi bi-search me-2"></i>
                      Kehilangan/Hapus Kira
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" href="/aset/laporan">
                      <i className="bi bi-file-earmark-text me-2"></i>
                      Laporan BR-AMS
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Kewangan - bendahari, admin, head_imam */}
            {(userRole === 'admin' || userRole === 'bendahari' || userRole === 'head_imam') && (
              <li className="nav-item dropdown">
                <a
                  className={`nav-link dropdown-toggle ${pathname.startsWith('/financial') ? 'active' : ''}`}
                  href="#"
                  id="financialDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-cash-coin me-1"></i>
                  Kewangan
                </a>
                <ul className="dropdown-menu dropdown-menu-lg" aria-labelledby="financialDropdown" style={{ minWidth: '280px' }}>
                  <li>
                    <Link className="dropdown-item" href="/financial">
                      <i className="bi bi-bank me-2"></i>
                      Penyata Bank
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/financial/penyesuaian-bank">
                      <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                      Penyesuaian Bank
                    </Link>
                  </li>
                  {(userRole === 'admin' || userRole === 'bendahari') && (
                    <>
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <Link className="dropdown-item" href="/financial/categories">
                          <i className="bi bi-folder me-2"></i>
                          Kategori
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item" href="/financial/keywords">
                          <i className="bi bi-key me-2"></i>
                          Keyword Auto-Kategori
                        </Link>
                      </li>

                      <li><hr className="dropdown-divider" /></li>

                      {/* Nota Butiran Baki */}
                      <li className="dropdown-header text-muted small">
                        <i className="bi bi-journal-bookmark me-1"></i>
                        Nota Butiran Baki
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-butiran-baki">
                          Baki 1 Januari
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-butiran-baki-31dis">
                          Baki 31 Disember
                        </Link>
                      </li>

                      <li><hr className="dropdown-divider" /></li>

                      {/* Nota Penerimaan */}
                      <li className="dropdown-header text-muted small">
                        <i className="bi bi-arrow-down-circle me-1 text-success"></i>
                        Nota Penerimaan
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-penerimaan-sumbangan-am">
                          Sumbangan Am
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-penerimaan-sumbangan-khas">
                          Sumbangan Khas
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-penerimaan-elaun">
                          Elaun
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-penerimaan-pelaburan">
                          Pelaburan
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-penerimaan-deposit">
                          Deposit
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-penerimaan-hasil-sewaan">
                          Hasil Sewaan
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-penerimaan-lain">
                          Lain-lain
                        </Link>
                      </li>

                      <li><hr className="dropdown-divider" /></li>

                      {/* Nota Pembayaran */}
                      <li className="dropdown-header text-muted small">
                        <i className="bi bi-arrow-up-circle me-1 text-danger"></i>
                        Nota Pembayaran
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-pembayaran-pentadbiran">
                          Pentadbiran
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-pembayaran-sumber-manusia">
                          Sumber Manusia
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-pembayaran-pembangunan">
                          Pembangunan
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-pembayaran-dakwah">
                          Dakwah
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-pembayaran-khidmat-sosial">
                          Khidmat Sosial
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item ps-4" href="/financial/nota-pembayaran-aset">
                          Aset
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </li>
            )}

            {/* Laporan - bendahari, admin, head_imam */}
            {(userRole === 'admin' || userRole === 'bendahari' || userRole === 'head_imam') && (
              <li className="nav-item dropdown">
                <a
                  className={`nav-link dropdown-toggle ${pathname.startsWith('/dashboard/reports') ? 'active' : ''}`}
                  href="#"
                  id="reportsDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-file-earmark-text me-1"></i>
                  Laporan
                </a>
                <ul className="dropdown-menu dropdown-menu-lg" aria-labelledby="reportsDropdown" style={{ minWidth: '280px' }}>
                  {/* BR-KMS Reports */}
                  <li className="dropdown-header text-muted small">Laporan BR-KMS</li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/reports/anggaran">
                      <i className="bi bi-graph-up me-2"></i>
                      BR-KMS-001: Anggaran
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/reports/buku-tunai">
                      <i className="bi bi-journal-text me-2"></i>
                      BR-KMS-002: Buku Tunai
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/reports/laporan-bulanan">
                      <i className="bi bi-calendar3 me-2"></i>
                      BR-KMS-018: Laporan Bulanan
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/reports/penyata-kewangan-tahunan">
                      <i className="bi bi-file-earmark-spreadsheet me-2"></i>
                      BR-KMS-019: Penyata Tahunan
                    </Link>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  {/* Nota Baki */}
                  <li className="dropdown-header text-muted small">Nota Butiran Baki</li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/reports/nota-butiran-baki">
                      <i className="bi bi-journal-bookmark me-2"></i>
                      Baki 1 Januari
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/reports/nota-butiran-baki-31dis">
                      <i className="bi bi-journal-bookmark-fill me-2"></i>
                      Baki 31 Disember
                    </Link>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  {/* Nota Penerimaan - Flat list with header */}
                  <li className="dropdown-header text-muted small">
                    <i className="bi bi-arrow-down-circle me-1 text-success"></i>
                    Nota Penerimaan
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-penerimaan-sumbangan-am">
                      Sumbangan Am
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-penerimaan-sumbangan-khas">
                      Sumbangan Khas
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-penerimaan-elaun">
                      Elaun
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-penerimaan-pelaburan">
                      Pelaburan
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-penerimaan-deposit">
                      Deposit
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-penerimaan-hasil-sewaan">
                      Hasil Sewaan
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-penerimaan-lain">
                      Lain-lain
                    </Link>
                  </li>

                  <li><hr className="dropdown-divider" /></li>

                  {/* Nota Pembayaran - Flat list with header */}
                  <li className="dropdown-header text-muted small">
                    <i className="bi bi-arrow-up-circle me-1 text-danger"></i>
                    Nota Pembayaran
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-pembayaran-pentadbiran">
                      Pentadbiran
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-pembayaran-sumber-manusia">
                      Sumber Manusia
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-pembayaran-pembangunan">
                      Pembangunan
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-pembayaran-dakwah">
                      Dakwah
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-pembayaran-khidmat-sosial">
                      Khidmat Sosial
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item ps-4" href="/dashboard/reports/nota-pembayaran-aset">
                      Aset
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Aktiviti - admin, head_imam */}
            {(userRole === 'admin' || userRole === 'head_imam') && (
              <li className="nav-item dropdown">
                <a
                  className={`nav-link dropdown-toggle ${
                    pathname === '/dashboard/permohonan-majlis' ||
                    pathname === '/dashboard/aktiviti' ||
                    pathname === '/kalendar-aktiviti'
                      ? 'active' : ''
                  }`}
                  href="#"
                  id="aktivitiDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-calendar-event me-1"></i>
                  Aktiviti
                </a>
                <ul className="dropdown-menu" aria-labelledby="aktivitiDropdown">
                  <li>
                    <Link className="dropdown-item" href="/dashboard/permohonan-majlis">
                      <i className="bi bi-calendar-check me-2"></i>
                      Permohonan Majlis
                    </Link>
                  </li>
                  {userRole === 'admin' && (
                    <li>
                      <Link className="dropdown-item" href="/dashboard/aktiviti">
                        <i className="bi bi-calendar-plus me-2"></i>
                        Aktiviti Surau
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" href="/kalendar-aktiviti">
                      <i className="bi bi-calendar3 me-2"></i>
                      Kalendar Aktiviti
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Khairat - admin, head_imam, khairat */}
            {(userRole === 'admin' || userRole === 'head_imam' || userRole === 'khairat') && (
              <li className="nav-item">
                <Link
                  className={`nav-link ${pathname.startsWith('/dashboard/khairat') ? 'active' : ''}`}
                  href="/dashboard/khairat"
                >
                  <i className="bi bi-heart me-1"></i>
                  Khairat
                </Link>
              </li>
            )}

            {/* Pentadbiran - admin only */}
            {userRole === 'admin' && (
              <li className="nav-item dropdown">
                <a
                  className={`nav-link dropdown-toggle ${
                    pathname === '/users' ||
                    pathname === '/admin/roles' ||
                    pathname === '/admin/permissions' ||
                    pathname === '/preachers/manage' ||
                    pathname === '/dashboard/maklumbalas' ||
                    pathname === '/dashboard/tender' ||
                    pathname === '/dashboard/sumbang-derma' ||
                    pathname.startsWith('/dashboard/komuniti2u')
                      ? 'active' : ''
                  }`}
                  href="#"
                  id="pentadbiranDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  <i className="bi bi-gear me-1"></i>
                  Pentadbiran
                </a>
                <ul className="dropdown-menu" aria-labelledby="pentadbiranDropdown">
                  <li>
                    <Link className="dropdown-item" href="/users">
                      <i className="bi bi-people me-2"></i>
                      Urus Pengguna
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/admin/roles">
                      <i className="bi bi-person-gear me-2"></i>
                      Pengurusan Peranan
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/admin/permissions">
                      <i className="bi bi-shield-lock me-2"></i>
                      Pengurusan Kebenaran
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/preachers/manage">
                      <i className="bi bi-person-video3 me-2"></i>
                      Urus Penceramah
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/komuniti2u">
                      <i className="bi bi-shop me-2"></i>
                      Komuniti 2U
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/komuniti2u/categories">
                      <i className="bi bi-tags me-2"></i>
                      Kategori Komuniti2U
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/tender">
                      <i className="bi bi-file-earmark-text me-2"></i>
                      Tender
                    </Link>
                  </li>
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/maklumbalas">
                      <i className="bi bi-chat-left-text me-2"></i>
                      Maklum Balas Awam
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="/dashboard/sumbang-derma">
                      <i className="bi bi-hand-thumbs-up me-2"></i>
                      Sumbang & Derma
                    </Link>
                  </li>
                </ul>
              </li>
            )}
          </ul>

          <div className="d-flex align-items-center">
            {/* Help Button - visible to all users */}
            <Link
              href="/help"
              className="btn btn-outline-light btn-sm me-2"
              title="Bantuan"
            >
              <i className="bi bi-question-circle me-1"></i>
              <span className="d-none d-md-inline">Bantuan</span>
            </Link>

            <div className="dropdown">
              <button
                className="btn btn-outline-light btn-sm dropdown-toggle"
                type="button"
                id="userDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <i className="bi bi-person-circle me-1"></i>
                {session.user?.name}
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li className="dropdown-header text-muted small">
                  {userRole === 'admin' ? 'Administrator' :
                   userRole === 'head_imam' ? 'Head Imam' :
                   userRole === 'bendahari' ? 'Bendahari' :
                   userRole === 'inventory_staff' ? 'Staf Inventori' :
                   userRole === 'imam' ? 'Imam' :
                   userRole === 'bilal' ? 'Bilal' : userRole}
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <Link className="dropdown-item" href="/dashboard/profile">
                    <i className="bi bi-person me-2"></i>
                    Profil Saya
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={async () => {
                      console.log('Logout button clicked');
                      try {
                        await signOut({ redirect: false });
                        console.log('SignOut completed, redirecting...');
                        window.location.href = '/login';
                      } catch (error) {
                        console.error('Logout error:', error);
                      }
                    }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>
                    Log Keluar
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
