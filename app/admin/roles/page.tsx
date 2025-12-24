'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  user_type: string;
  role: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
}

interface CustomRole {
  id: number;
  role_key: string;
  role_label: string;
  category: 'pengguna_dalaman' | 'petugas';
  description: string | null;
  is_active: boolean;
}

const defaultInternalRoles = [
  { value: 'admin', label: 'Admin', isSystem: true },
  { value: 'bendahari', label: 'Bendahari', isSystem: true },
  { value: 'aset', label: 'Pegawai Aset', isSystem: true },
  { value: 'pegawai', label: 'Pegawai', isSystem: true },
];

const defaultPetugasRoles = [
  { value: 'head_imam', label: 'Ketua Imam', isSystem: true },
  { value: 'imam', label: 'Imam', isSystem: true },
  { value: 'bilal', label: 'Bilal', isSystem: true },
  { value: 'imam_jumaat', label: 'Imam Jumaat', isSystem: true },
  { value: 'bilal_jumaat', label: 'Bilal Jumaat', isSystem: true },
  { value: 'penceramah', label: 'Penceramah', isSystem: true },
];

const userTypes = [
  { value: 'pengguna_dalaman', label: 'Pengguna Dalaman' },
  { value: 'petugas', label: 'Petugas' },
];

export default function RolesManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ user_type: '', role: '', roles: [] as string[], additional_petugas_roles: [] as string[] });

  // Custom roles state
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [addRoleForm, setAddRoleForm] = useState({
    role_key: '',
    role_label: '',
    category: 'pengguna_dalaman' as 'pengguna_dalaman' | 'petugas',
    description: ''
  });
  const [addingRole, setAddingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);

  // Combined roles (system + custom)
  const internalRoles = [
    ...defaultInternalRoles,
    ...customRoles.filter(r => r.category === 'pengguna_dalaman' && r.is_active).map(r => ({
      value: r.role_key,
      label: r.role_label,
      isSystem: false
    }))
  ];

  const petugasRoles = [
    ...defaultPetugasRoles,
    ...customRoles.filter(r => r.category === 'petugas' && r.is_active).map(r => ({
      value: r.role_key,
      label: r.role_label,
      isSystem: false
    }))
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session && (session.user as any).role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session) {
      fetchUsers();
      fetchCustomRoles();
    }
  }, [session, filter]);

  const fetchCustomRoles = async () => {
    try {
      const response = await fetch('/api/admin/custom-roles');
      if (response.ok) {
        const data = await response.json();
        setCustomRoles(data.data);
      }
    } catch (error) {
      console.error('Error fetching custom roles:', error);
    }
  };

  const handleAddRole = async () => {
    if (!addRoleForm.role_key || !addRoleForm.role_label) {
      showAlert('danger', 'Sila lengkapkan semua maklumat wajib');
      return;
    }

    setAddingRole(true);
    try {
      const response = await fetch('/api/admin/custom-roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addRoleForm)
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Peranan baru berjaya ditambah');
        setShowAddRoleModal(false);
        setAddRoleForm({ role_key: '', role_label: '', category: 'pengguna_dalaman', description: '' });
        fetchCustomRoles();
      } else {
        showAlert('danger', data.error || 'Gagal menambah peranan');
      }
    } catch (error) {
      console.error('Error adding role:', error);
      showAlert('danger', 'Ralat semasa menambah peranan');
    } finally {
      setAddingRole(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch('/api/admin/custom-roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingRole.id,
          role_label: editingRole.role_label,
          description: editingRole.description,
          is_active: editingRole.is_active
        })
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Peranan berjaya dikemaskini');
        setEditingRole(null);
        fetchCustomRoles();
      } else {
        showAlert('danger', data.error || 'Gagal mengemaskini peranan');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showAlert('danger', 'Ralat semasa mengemaskini peranan');
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm('Adakah anda pasti untuk memadam peranan ini?')) return;

    setDeletingRoleId(id);
    try {
      const response = await fetch(`/api/admin/custom-roles?id=${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', 'Peranan berjaya dipadam');
        fetchCustomRoles();
      } else {
        showAlert('danger', data.error || 'Gagal memadam peranan');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      showAlert('danger', 'Ralat semasa memadam peranan');
    } finally {
      setDeletingRoleId(null);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/roles?user_type=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getRoleLabel = (role: string): string => {
    const allRoles = [...internalRoles, ...petugasRoles];
    const found = allRoles.find(r => r.value === role);
    return found ? found.label : role;
  };

  const getUserTypeLabel = (userType: string): string => {
    const found = userTypes.find(t => t.value === userType);
    return found ? found.label : userType;
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);

    const userRoles = user.roles || [];
    const petugasRoleValues = [...defaultPetugasRoles.map(r => r.value), ...customRoles.filter(r => r.category === 'petugas' && r.is_active).map(r => r.role_key)];
    const internalRoleValues = [...defaultInternalRoles.map(r => r.value), ...customRoles.filter(r => r.category === 'pengguna_dalaman' && r.is_active).map(r => r.role_key)];

    if (user.user_type === 'pengguna_dalaman') {
      // For pengguna_dalaman: get internal roles from user.role and user.roles
      const internalUserRoles = userRoles.filter(r => internalRoleValues.includes(r));
      // Include the main role if it's an internal role
      if (user.role && internalRoleValues.includes(user.role) && !internalUserRoles.includes(user.role)) {
        internalUserRoles.unshift(user.role);
      }
      setEditForm({
        user_type: user.user_type,
        role: user.role || '',
        roles: internalUserRoles.length > 0 ? internalUserRoles : (user.role ? [user.role] : []),
        additional_petugas_roles: userRoles.filter(r => petugasRoleValues.includes(r)),
      });
    } else {
      // For petugas: roles array has their petugas roles
      const petugasUserRoles = userRoles.filter(r => petugasRoleValues.includes(r));
      // Include the main role if it's a petugas role
      if (user.role && petugasRoleValues.includes(user.role) && !petugasUserRoles.includes(user.role)) {
        petugasUserRoles.unshift(user.role);
      }
      setEditForm({
        user_type: user.user_type || 'petugas',
        role: user.role || '',
        roles: petugasUserRoles.length > 0 ? petugasUserRoles : (user.role ? [user.role] : []),
        additional_petugas_roles: [],
      });
    }
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditForm({ user_type: '', role: '', roles: [], additional_petugas_roles: [] });
  };

  const handleUserTypeChange = (newUserType: string) => {
    setEditForm({
      user_type: newUserType,
      role: '',
      roles: [],
      additional_petugas_roles: [],
    });
  };

  const handleAdditionalPetugasRoleToggle = (role: string) => {
    setEditForm((prev) => {
      const currentRoles = prev.additional_petugas_roles || [];
      if (currentRoles.includes(role)) {
        return { ...prev, additional_petugas_roles: currentRoles.filter((r) => r !== role) };
      } else {
        return { ...prev, additional_petugas_roles: [...currentRoles, role] };
      }
    });
  };

  const handleRoleToggle = (role: string) => {
    setEditForm((prev) => {
      const currentRoles = prev.roles || [];
      if (currentRoles.includes(role)) {
        // Remove role if already selected
        const newRoles = currentRoles.filter((r) => r !== role);
        return { ...prev, roles: newRoles, role: newRoles[0] || '' };
      } else {
        // Add role
        const newRoles = [...currentRoles, role];
        return { ...prev, roles: newRoles, role: prev.role || role };
      }
    });
  };

  const handleSaveRole = async () => {
    if (!editingUser) {
      showAlert('danger', 'Tiada pengguna dipilih');
      return;
    }

    // Validate at least one role is selected
    if (!editForm.roles || editForm.roles.length === 0) {
      showAlert('danger', 'Sila pilih sekurang-kurangnya satu peranan');
      return;
    }

    // Validate user_type is set
    if (!editForm.user_type) {
      showAlert('danger', 'Jenis pengguna tidak ditetapkan');
      return;
    }

    try {
      const payload: any = {
        user_id: editingUser.id,
        user_type: editForm.user_type,
        roles: editForm.roles,
        role: editForm.roles[0], // Primary role is the first selected
      };

      if (editForm.user_type === 'pengguna_dalaman') {
        // Include additional petugas roles if any
        if (editForm.additional_petugas_roles && editForm.additional_petugas_roles.length > 0) {
          payload.additional_petugas_roles = editForm.additional_petugas_roles;
        }
      }

      console.log('Saving role with payload:', payload);

      const response = await fetch('/api/admin/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Response:', data);

      if (response.ok) {
        showAlert('success', `Peranan ${editingUser.name} berjaya dikemaskini`);
        closeEditModal();
        fetchUsers();
      } else {
        showAlert('danger', data.error || 'Gagal mengemaskini peranan');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      showAlert('danger', 'Ralat semasa mengemaskini peranan: ' + (error as Error).message);
    }
  };

  const getRoleBadgeClass = (userType: string): string => {
    return userType === 'pengguna_dalaman' ? 'bg-primary' : 'bg-success';
  };

  if (status === 'loading' || !session) {
    return (
      <div className="loading">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  // Group users by type
  const internalUsers = users.filter(u => u.user_type === 'pengguna_dalaman');
  const petugasUsers = users.filter(u => u.user_type === 'petugas' || !u.user_type);

  return (
    <>
      <Navbar />
      <div className="container mt-4">
        {alert && (
          <div className={`alert alert-${alert.type} alert-custom`} role="alert">
            {alert.message}
          </div>
        )}

        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-people-fill me-3" style={{ fontSize: '2.5rem', color: '#059669' }}></i>
              <div>
                <h2 className="mb-1">Pengurusan Peranan</h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                  <i className="bi bi-info-circle me-2"></i>
                  Urus peranan pengguna sistem iSAR
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Add Role Button */}
        <div className="card mb-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('all')}
                >
                  Semua ({users.length})
                </button>
                <button
                  className={`btn ${filter === 'pengguna_dalaman' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setFilter('pengguna_dalaman')}
                >
                  <i className="bi bi-building me-1"></i>
                  Pengguna Dalaman ({internalUsers.length})
                </button>
                <button
                  className={`btn ${filter === 'petugas' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setFilter('petugas')}
                >
                  <i className="bi bi-person-badge me-1"></i>
                  Petugas ({petugasUsers.length})
                </button>
              </div>
              <button
                className="btn btn-warning"
                onClick={() => setShowAddRoleModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Tambah Peranan Baru
              </button>
            </div>
          </div>
        </div>

        {/* Custom Roles Section */}
        {customRoles.length > 0 && (
          <div className="card mb-4">
            <div className="card-header bg-warning text-dark">
              <h5 className="mb-0">
                <i className="bi bi-tag me-2"></i>
                Peranan Khas ({customRoles.length})
              </h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Kod Peranan</th>
                      <th>Label</th>
                      <th>Kategori</th>
                      <th>Penerangan</th>
                      <th>Status</th>
                      <th>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customRoles.map((role) => (
                      <tr key={role.id}>
                        <td><code>{role.role_key}</code></td>
                        <td><strong>{role.role_label}</strong></td>
                        <td>
                          <span className={`badge ${role.category === 'pengguna_dalaman' ? 'bg-primary' : 'bg-success'}`}>
                            {role.category === 'pengguna_dalaman' ? 'Pengguna Dalaman' : 'Petugas'}
                          </span>
                        </td>
                        <td>{role.description || '-'}</td>
                        <td>
                          <span className={`badge ${role.is_active ? 'bg-success' : 'bg-secondary'}`}>
                            {role.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setEditingRole({ ...role })}
                              title="Edit"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={deletingRoleId === role.id}
                              title="Padam"
                            >
                              {deletingRoleId === role.id ? (
                                <span className="spinner-border spinner-border-sm"></span>
                              ) : (
                                <i className="bi bi-trash"></i>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : (
          <div className="row">
            {/* Pengguna Dalaman Section */}
            {(filter === 'all' || filter === 'pengguna_dalaman') && internalUsers.length > 0 && (
              <div className="col-12 mb-4">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-building me-2"></i>
                      Pengguna Dalaman
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Nama</th>
                            <th>Email</th>
                            <th>No. Telefon</th>
                            <th>Peranan</th>
                            <th>Status</th>
                            <th>Tindakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {internalUsers.map((user) => {
                            // Get petugas roles from user.roles array (for cross-category support)
                            const petugasRoleValues = [...defaultPetugasRoles.map(r => r.value), ...customRoles.filter(r => r.category === 'petugas' && r.is_active).map(r => r.role_key)];
                            const userPetugasRoles = (user.roles || []).filter(r => petugasRoleValues.includes(r));

                            return (
                              <tr key={user.id}>
                                <td>
                                  <strong>{user.name}</strong>
                                </td>
                                <td>{user.email}</td>
                                <td>{user.phone || '-'}</td>
                                <td>
                                  <div className="d-flex flex-wrap gap-1">
                                    {user.role && <span className="badge bg-primary">{getRoleLabel(user.role)}</span>}
                                    {userPetugasRoles.map((r, idx) => (
                                      <span key={idx} className="badge bg-success">{getRoleLabel(r)}</span>
                                    ))}
                                    {!user.role && userPetugasRoles.length === 0 && (
                                      <span className="badge bg-secondary">Tiada Peranan</span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                    {user.is_active ? 'Aktif' : 'Tidak Aktif'}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() => openEditModal(user)}
                                  >
                                    <i className="bi bi-pencil me-1"></i>
                                    Ubah Peranan
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Petugas Section */}
            {(filter === 'all' || filter === 'petugas') && petugasUsers.length > 0 && (
              <div className="col-12 mb-4">
                <div className="card">
                  <div className="card-header bg-success text-white">
                    <h5 className="mb-0">
                      <i className="bi bi-person-badge me-2"></i>
                      Petugas
                    </h5>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Nama</th>
                            <th>Email</th>
                            <th>No. Telefon</th>
                            <th>Peranan</th>
                            <th>Status</th>
                            <th>Tindakan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {petugasUsers.map((user) => (
                            <tr key={user.id}>
                              <td>
                                <strong>{user.name}</strong>
                              </td>
                              <td>{user.email}</td>
                              <td>{user.phone || '-'}</td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map((r, idx) => (
                                    <span key={idx} className="badge bg-success">{getRoleLabel(r)}</span>
                                  ))}
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                                  {user.is_active ? 'Aktif' : 'Tidak Aktif'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => openEditModal(user)}
                                >
                                  <i className="bi bi-pencil me-1"></i>
                                  Ubah Peranan
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {users.length === 0 && (
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <i className="bi bi-people" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
                    <p className="text-muted mt-3">Tiada pengguna dijumpai</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="card mt-4">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="bi bi-info-circle me-2"></i>
              Penerangan Peranan
            </h6>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6 className="text-primary">
                  <i className="bi bi-building me-2"></i>
                  Pengguna Dalaman
                </h6>
                <ul className="list-unstyled ms-3">
                  <li><strong>Admin</strong> - Pentadbir sistem dengan akses penuh</li>
                  <li><strong>Bendahari</strong> - Pengurusan kewangan surau</li>
                  <li><strong>Pegawai Aset</strong> - Pengurusan inventori dan aset</li>
                  <li><strong>Pegawai</strong> - Pegawai surau am</li>
                </ul>
              </div>
              <div className="col-md-6">
                <h6 className="text-success">
                  <i className="bi bi-person-badge me-2"></i>
                  Petugas
                </h6>
                <ul className="list-unstyled ms-3">
                  <li><strong>Ketua Imam</strong> - Ketua imam surau</li>
                  <li><strong>Imam</strong> - Imam solat harian</li>
                  <li><strong>Bilal</strong> - Bilal solat harian</li>
                  <li><strong>Imam Jumaat</strong> - Imam khusus solat Jumaat</li>
                  <li><strong>Bilal Jumaat</strong> - Bilal khusus solat Jumaat</li>
                  <li><strong>Penceramah</strong> - Penceramah kuliah/ceramah</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square me-2"></i>
                  Ubah Peranan
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={closeEditModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label"><strong>Nama Pengguna</strong></label>
                  <p className="form-control-plaintext">{editingUser.name}</p>
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Jenis Pengguna</strong></label>
                  <select
                    className="form-select"
                    value={editForm.user_type}
                    onChange={(e) => handleUserTypeChange(e.target.value)}
                  >
                    {userTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Peranan {editForm.user_type === 'pengguna_dalaman' ? 'Dalaman' : 'Petugas'}</strong></label>
                  {editForm.user_type === 'pengguna_dalaman' ? (
                    <div className="border rounded p-3">
                      <small className="text-muted d-block mb-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Pilih satu atau lebih peranan untuk pengguna dalaman ini
                      </small>
                      {internalRoles.map((role) => (
                        <div key={role.value} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`internal-role-${role.value}`}
                            checked={editForm.roles?.includes(role.value) || false}
                            onChange={() => handleRoleToggle(role.value)}
                          />
                          <label className="form-check-label" htmlFor={`internal-role-${role.value}`}>
                            {role.label}
                          </label>
                        </div>
                      ))}
                      {editForm.roles?.length === 0 && (
                        <small className="text-danger d-block mt-2">
                          Sila pilih sekurang-kurangnya satu peranan
                        </small>
                      )}
                    </div>
                  ) : (
                    <div className="border rounded p-3">
                      <small className="text-muted d-block mb-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Pilih satu atau lebih peranan untuk petugas ini
                      </small>
                      {petugasRoles.map((role) => (
                        <div key={role.value} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`role-${role.value}`}
                            checked={editForm.roles?.includes(role.value) || false}
                            onChange={() => handleRoleToggle(role.value)}
                          />
                          <label className="form-check-label" htmlFor={`role-${role.value}`}>
                            {role.label}
                          </label>
                        </div>
                      ))}
                      {editForm.roles?.length === 0 && (
                        <small className="text-danger d-block mt-2">
                          Sila pilih sekurang-kurangnya satu peranan
                        </small>
                      )}
                    </div>
                  )}
                </div>

                {/* Additional Petugas Roles for Pengguna Dalaman */}
                {editForm.user_type === 'pengguna_dalaman' && (
                  <div className="mb-3">
                    <label className="form-label"><strong>Peranan Petugas Tambahan</strong> <span className="text-muted">(Pilihan)</span></label>
                    <div className="border rounded p-3">
                      <small className="text-muted d-block mb-2">
                        <i className="bi bi-info-circle me-1"></i>
                        Pilih jika pengguna ini juga berperanan sebagai petugas
                      </small>
                      {petugasRoles.map((role) => (
                        <div key={role.value} className="form-check">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`additional-${role.value}`}
                            checked={editForm.additional_petugas_roles?.includes(role.value) || false}
                            onChange={() => handleAdditionalPetugasRoleToggle(role.value)}
                          />
                          <label className="form-check-label" htmlFor={`additional-${role.value}`}>
                            {role.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Perubahan peranan akan berkuat kuasa selepas pengguna log masuk semula.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditModal}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSaveRole}
                >
                  <i className="bi bi-check-lg me-1"></i>
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Tambah Peranan Baru
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowAddRoleModal(false);
                    setAddRoleForm({ role_key: '', role_label: '', category: 'pengguna_dalaman', description: '' });
                  }}
                  disabled={addingRole}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">
                    <strong>Kod Peranan</strong> <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="contoh: khairat"
                    value={addRoleForm.role_key}
                    onChange={(e) => setAddRoleForm({ ...addRoleForm, role_key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    disabled={addingRole}
                  />
                  <small className="text-muted">
                    Huruf kecil, nombor, dan underscore sahaja. Contoh: khairat, ajk_masjid
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <strong>Label Peranan</strong> <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="contoh: AJK Khairat"
                    value={addRoleForm.role_label}
                    onChange={(e) => setAddRoleForm({ ...addRoleForm, role_label: e.target.value })}
                    disabled={addingRole}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Kategori</strong></label>
                  <select
                    className="form-select"
                    value={addRoleForm.category}
                    onChange={(e) => setAddRoleForm({ ...addRoleForm, category: e.target.value as 'pengguna_dalaman' | 'petugas' })}
                    disabled={addingRole}
                  >
                    <option value="pengguna_dalaman">Pengguna Dalaman</option>
                    <option value="petugas">Petugas</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Penerangan</strong></label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Penerangan ringkas tentang peranan ini"
                    value={addRoleForm.description}
                    onChange={(e) => setAddRoleForm({ ...addRoleForm, description: e.target.value })}
                    disabled={addingRole}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowAddRoleModal(false);
                    setAddRoleForm({ role_key: '', role_label: '', category: 'pengguna_dalaman', description: '' });
                  }}
                  disabled={addingRole}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-warning"
                  onClick={handleAddRole}
                  disabled={addingRole || !addRoleForm.role_key || !addRoleForm.role_label}
                >
                  {addingRole ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Menambah...</>
                  ) : (
                    <><i className="bi bi-plus-lg me-1"></i>Tambah</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Custom Role Modal */}
      {editingRole && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-pencil-square me-2"></i>
                  Edit Peranan Khas
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setEditingRole(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label"><strong>Kod Peranan</strong></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingRole.role_key}
                    disabled
                  />
                  <small className="text-muted">Kod peranan tidak boleh diubah</small>
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Label Peranan</strong></label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingRole.role_label}
                    onChange={(e) => setEditingRole({ ...editingRole, role_label: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label"><strong>Penerangan</strong></label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={editingRole.description || ''}
                    onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="mb-3">
                  <div className="form-check form-switch">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="roleActiveSwitch"
                      checked={editingRole.is_active}
                      onChange={(e) => setEditingRole({ ...editingRole, is_active: e.target.checked })}
                    />
                    <label className="form-check-label" htmlFor="roleActiveSwitch">
                      Peranan Aktif
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingRole(null)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpdateRole}
                >
                  <i className="bi bi-check-lg me-1"></i>
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
