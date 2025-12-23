'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface Module {
  id: string;
  nama: string;
  icon: string;
  path: string;
  urutan: number;
  is_active: boolean;
}

interface Permission {
  module_id: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: 'Admin',
  bendahari: 'Bendahari',
  head_imam: 'Ketua Imam',
  aset: 'Pegawai Aset',
  pegawai: 'Pegawai',
  khairat: 'AJK Khairat',
  imam: 'Imam',
  bilal: 'Bilal',
  imam_jumaat: 'Imam Jumaat',
  bilal_jumaat: 'Bilal Jumaat',
  penceramah: 'Penceramah',
};

const INTERNAL_ROLES = ['admin', 'bendahari', 'head_imam', 'aset', 'pegawai', 'khairat'];
const PETUGAS_ROLES = ['imam', 'bilal', 'imam_jumaat', 'bilal_jumaat', 'penceramah'];

export default function PermissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [modules, setModules] = useState<Module[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [permissions, setPermissions] = useState<Record<string, Permission>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [settingUp, setSettingUp] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      if (session?.user?.role !== 'admin') {
        router.push('/dashboard');
      } else {
        checkSetup();
      }
    }
  }, [status, session, router]);

  const checkSetup = async () => {
    try {
      const res = await fetch('/api/permissions/setup');
      const data = await res.json();

      if (!data.ready) {
        setSetupNeeded(true);
        setLoading(false);
      } else {
        setSetupNeeded(false);
        fetchModules();
      }
    } catch (err) {
      console.error('Check setup error:', err);
      setSetupNeeded(true);
      setLoading(false);
    }
  };

  const runSetup = async () => {
    try {
      setSettingUp(true);
      setError('');

      const res = await fetch('/api/permissions/setup', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setSuccess('Setup berjaya. Memuatkan data...');
        setSetupNeeded(false);
        setTimeout(() => {
          setSuccess('');
          fetchModules();
        }, 1500);
      } else {
        throw new Error(data.error || 'Setup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan setup');
    } finally {
      setSettingUp(false);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/permissions/modules?active=true');
      const data = await res.json();
      setModules(data.data || []);
      fetchPermissions(selectedRole);
    } catch (err) {
      console.error('Fetch modules error:', err);
      setError('Gagal memuatkan senarai modul');
      setLoading(false);
    }
  };

  const fetchPermissions = async (role: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/permissions?role=${encodeURIComponent(role)}`);
      const data = await res.json();

      // Convert array to object keyed by module_id
      const permsObj: Record<string, Permission> = {};
      (data.data || []).forEach((p: any) => {
        permsObj[p.module_id] = {
          module_id: p.module_id,
          can_view: Boolean(p.can_view),
          can_create: Boolean(p.can_create),
          can_edit: Boolean(p.can_edit),
          can_delete: Boolean(p.can_delete),
        };
      });

      // Ensure all modules have permissions entry
      modules.forEach((mod) => {
        if (!permsObj[mod.id]) {
          permsObj[mod.id] = {
            module_id: mod.id,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
          };
        }
      });

      setPermissions(permsObj);
    } catch (err) {
      console.error('Fetch permissions error:', err);
      setError('Gagal memuatkan kebenaran');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    fetchPermissions(role);
  };

  const handlePermissionChange = (moduleId: string, field: keyof Permission, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      },
    }));
  };

  const handleToggleAll = (moduleId: string, checked: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        module_id: moduleId,
        can_view: checked,
        can_create: checked,
        can_edit: checked,
        can_delete: checked,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      const permissionsArray = Object.values(permissions);

      const res = await fetch('/api/permissions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          permissions: permissionsArray,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan kebenaran');
      }

      setSuccess(`Kebenaran untuk ${ROLE_DISPLAY_NAMES[selectedRole] || selectedRole} berjaya dikemaskini`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan kebenaran');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || (loading && !setupNeeded)) {
    return (
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container py-5 text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Memuatkan data...</p>
        </div>
      </div>
    );
  }

  if (setupNeeded) {
    return (
      <div className="min-vh-100 bg-light">
        <Navbar />
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="card border-0 shadow-sm">
                <div className="card-body text-center p-5">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
                    style={{ width: '80px', height: '80px', backgroundColor: '#f0fdf4' }}
                  >
                    <i className="bi bi-database-gear text-success" style={{ fontSize: '2.5rem' }}></i>
                  </div>
                  <h4 className="mb-3">Setup Diperlukan</h4>
                  <p className="text-muted mb-4">
                    Jadual pengurusan kebenaran belum dicipta. Klik butang di bawah untuk mencipta jadual dan data awal.
                  </p>

                  {error && (
                    <div className="alert alert-danger mb-4">
                      <i className="bi bi-exclamation-circle me-2"></i>
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success mb-4">
                      <i className="bi bi-check-circle me-2"></i>
                      {success}
                    </div>
                  )}

                  <button
                    className="btn btn-success btn-lg px-5"
                    onClick={runSetup}
                    disabled={settingUp}
                  >
                    {settingUp ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Sedang Setup...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-play-circle me-2"></i>
                        Jalankan Setup
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-light">
      <Navbar />
      <div className="container py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">
              <i className="bi bi-shield-lock-fill me-2" style={{ color: '#059669' }}></i>
              Pengurusan Kebenaran
            </h3>
            <p className="text-muted mb-0">Tetapkan akses modul untuk setiap peranan</p>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
          </div>
        )}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-circle me-2"></i>
            {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        <div className="row g-4">
          {/* Role Selection */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white">
                <h6 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  Pilih Peranan
                </h6>
              </div>
              <div className="card-body p-0">
                {/* Internal Roles */}
                <div className="px-3 py-2 bg-light border-bottom">
                  <small className="fw-semibold text-muted">PENGGUNA DALAMAN</small>
                </div>
                <div className="list-group list-group-flush">
                  {INTERNAL_ROLES.map((role) => (
                    <button
                      key={role}
                      className={`list-group-item list-group-item-action d-flex align-items-center ${
                        selectedRole === role ? 'active' : ''
                      }`}
                      onClick={() => handleRoleChange(role)}
                      style={selectedRole === role ? { backgroundColor: '#059669', borderColor: '#059669' } : {}}
                    >
                      <i className={`bi bi-person-fill me-2 ${selectedRole === role ? '' : 'text-muted'}`}></i>
                      {ROLE_DISPLAY_NAMES[role] || role}
                    </button>
                  ))}
                </div>

                {/* Petugas Roles */}
                <div className="px-3 py-2 bg-light border-bottom border-top">
                  <small className="fw-semibold text-muted">PETUGAS</small>
                </div>
                <div className="list-group list-group-flush">
                  {PETUGAS_ROLES.map((role) => (
                    <button
                      key={role}
                      className={`list-group-item list-group-item-action d-flex align-items-center ${
                        selectedRole === role ? 'active' : ''
                      }`}
                      onClick={() => handleRoleChange(role)}
                      style={selectedRole === role ? { backgroundColor: '#059669', borderColor: '#059669' } : {}}
                    >
                      <i className={`bi bi-person me-2 ${selectedRole === role ? '' : 'text-muted'}`}></i>
                      {ROLE_DISPLAY_NAMES[role] || role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Permissions Table */}
          <div className="col-md-9">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="bi bi-table me-2"></i>
                  Kebenaran untuk: <strong className="text-success">{ROLE_DISPLAY_NAMES[selectedRole] || selectedRole}</strong>
                </h6>
                <button
                  className="btn btn-success"
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
                      <i className="bi bi-check-lg me-2"></i>
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: '30%' }}>Modul</th>
                        <th className="text-center" style={{ width: '14%' }}>
                          <span title="Boleh lihat/akses modul">Lihat</span>
                        </th>
                        <th className="text-center" style={{ width: '14%' }}>
                          <span title="Boleh cipta rekod baru">Cipta</span>
                        </th>
                        <th className="text-center" style={{ width: '14%' }}>
                          <span title="Boleh edit rekod">Edit</span>
                        </th>
                        <th className="text-center" style={{ width: '14%' }}>
                          <span title="Boleh padam rekod">Padam</span>
                        </th>
                        <th className="text-center" style={{ width: '14%' }}>
                          <span title="Pilih/Nyahpilih semua">Semua</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((mod) => {
                        const perm = permissions[mod.id] || {
                          can_view: false,
                          can_create: false,
                          can_edit: false,
                          can_delete: false,
                        };
                        const allChecked = perm.can_view && perm.can_create && perm.can_edit && perm.can_delete;

                        return (
                          <tr key={mod.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                  style={{ width: '32px', height: '32px', backgroundColor: '#f0fdf4' }}
                                >
                                  <i className={`${mod.icon} text-success`}></i>
                                </div>
                                <div>
                                  <div className="fw-semibold">{mod.nama}</div>
                                  <small className="text-muted">{mod.path}</small>
                                </div>
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="form-check d-flex justify-content-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={perm.can_view}
                                  onChange={(e) => handlePermissionChange(mod.id, 'can_view', e.target.checked)}
                                  style={{ width: '1.2em', height: '1.2em' }}
                                />
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="form-check d-flex justify-content-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={perm.can_create}
                                  onChange={(e) => handlePermissionChange(mod.id, 'can_create', e.target.checked)}
                                  style={{ width: '1.2em', height: '1.2em' }}
                                />
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="form-check d-flex justify-content-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={perm.can_edit}
                                  onChange={(e) => handlePermissionChange(mod.id, 'can_edit', e.target.checked)}
                                  style={{ width: '1.2em', height: '1.2em' }}
                                />
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="form-check d-flex justify-content-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={perm.can_delete}
                                  onChange={(e) => handlePermissionChange(mod.id, 'can_delete', e.target.checked)}
                                  style={{ width: '1.2em', height: '1.2em' }}
                                />
                              </div>
                            </td>
                            <td className="text-center">
                              <div className="form-check d-flex justify-content-center">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={allChecked}
                                  onChange={(e) => handleToggleAll(mod.id, e.target.checked)}
                                  style={{ width: '1.2em', height: '1.2em' }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="card-footer bg-white">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Perubahan akan berkuatkuasa serta-merta selepas disimpan
                  </small>
                  <button
                    className="btn btn-success"
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
                        <i className="bi bi-check-lg me-2"></i>
                        Simpan Perubahan
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="card border-0 shadow-sm mt-3">
              <div className="card-body">
                <h6 className="mb-3">
                  <i className="bi bi-info-circle me-2 text-muted"></i>
                  Penerangan Kebenaran
                </h6>
                <div className="row g-3">
                  <div className="col-md-3">
                    <div className="d-flex align-items-center">
                      <span className="badge bg-primary me-2">Lihat</span>
                      <small className="text-muted">Akses dan lihat modul</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="d-flex align-items-center">
                      <span className="badge bg-success me-2">Cipta</span>
                      <small className="text-muted">Tambah rekod baru</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="d-flex align-items-center">
                      <span className="badge bg-warning text-dark me-2">Edit</span>
                      <small className="text-muted">Ubah rekod sedia ada</small>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="d-flex align-items-center">
                      <span className="badge bg-danger me-2">Padam</span>
                      <small className="text-muted">Hapus rekod</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
