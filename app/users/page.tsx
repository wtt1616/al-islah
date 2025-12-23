'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { User } from '@/types';

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'imam',
    phone: '',
    is_active: true,
  });
  const [alert, setAlert] = useState<{ type: string; message: string } | null>(null);
  const [sortColumn, setSortColumn] = useState<'name' | 'role' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (session) {
      const role = (session.user as any).role;
      if (role !== 'admin') {
        router.push('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [status, session, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showAlert('success', `User ${editingUser ? 'updated' : 'created'} successfully!`);
        setShowModal(false);
        resetForm();
        fetchUsers();
      } else {
        const error = await response.json();
        showAlert('danger', error.error || 'Failed to save user');
      }
    } catch (error) {
      showAlert('danger', 'Error saving user');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      phone: user.phone || '',
      is_active: user.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showAlert('success', 'User deleted successfully!');
        fetchUsers();
      } else {
        showAlert('danger', 'Failed to delete user');
      }
    } catch (error) {
      showAlert('danger', 'Error deleting user');
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'imam',
      phone: '',
      is_active: true,
    });
  };

  const showAlert = (type: string, message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSort = (column: 'name' | 'role') => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getSortedUsers = () => {
    if (!sortColumn) return users;

    return [...users].sort((a, b) => {
      let aValue = a[sortColumn];
      let bValue = b[sortColumn];

      // Convert to lowercase for case-insensitive sorting
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  if (status === 'loading' || !session) {
    return (
      <div className="loading">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

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
          <div className="col-md-8">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-people me-3" style={{ fontSize: '2.5rem', color: '#059669' }}></i>
              <div>
                <h2 className="mb-1">Manage Users</h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                  <i className="bi bi-shield-check me-2"></i>
                  Add, edit, and manage system users
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-4 text-end d-flex align-items-center justify-content-end">
            <button
              className="btn btn-success d-flex align-items-center"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
            >
              <i className="bi bi-person-plus me-2"></i>Add New User
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="row g-3 mb-4">
          <div className="col-md-3 col-sm-6">
            <div className="card h-100" style={{
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              border: 'none',
              color: 'white'
            }}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 opacity-75 small">Total Users</p>
                    <h4 className="mb-0 fw-bold" style={{ color: 'white' }}>{users.length}</h4>
                  </div>
                  <i className="bi bi-people" style={{ fontSize: '2rem', opacity: '0.3' }}></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-3 col-sm-6">
            <div className="card h-100" style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: 'white'
            }}>
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 opacity-75 small">Active</p>
                    <h4 className="mb-0 fw-bold" style={{ color: 'white' }}>{users.filter(u => u.is_active).length}</h4>
                  </div>
                  <i className="bi bi-check-circle" style={{ fontSize: '2rem', opacity: '0.3' }}></i>
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
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 opacity-75 small">Imams</p>
                    <h4 className="mb-0 fw-bold" style={{ color: 'white' }}>{users.filter(u => u.role === 'imam').length}</h4>
                  </div>
                  <i className="bi bi-person-badge" style={{ fontSize: '2rem', opacity: '0.3' }}></i>
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
              <div className="card-body py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <p className="mb-0 opacity-75 small">Bilals</p>
                    <h4 className="mb-0 fw-bold" style={{ color: 'white' }}>{users.filter(u => u.role === 'bilal').length}</h4>
                  </div>
                  <i className="bi bi-person-check" style={{ fontSize: '2rem', opacity: '0.3' }}></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner-border text-success" role="status"></div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header text-white">
              <h5 className="mb-0">
                <i className="bi bi-table me-2"></i>Users Directory
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('name')}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <span>Name</span>
                          <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                            {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </span>
                        </div>
                      </th>
                      <th>Email</th>
                      <th
                        style={{ cursor: 'pointer', userSelect: 'none' }}
                        onClick={() => handleSort('role')}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <span>Role</span>
                          <span style={{ marginLeft: '8px', fontSize: '14px' }}>
                            {sortColumn === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
                          </span>
                        </div>
                      </th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedUsers().map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className="badge bg-primary">{user.role}</span>
                        </td>
                        <td>{user.phone || '-'}</td>
                        <td>
                          <span
                            className={`badge ${
                              user.is_active ? 'bg-success' : 'bg-secondary'
                            }`}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleEdit(user)}
                          >
                            <i className="bi bi-pencil me-1"></i>Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(user.id)}
                          >
                            <i className="bi bi-trash me-1"></i>Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div
            className="modal show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <div className="modal-dialog">
              <div className="modal-content" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                <div className="modal-header" style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  borderBottom: 'none',
                  color: 'white'
                }}>
                  <h5 className="modal-title fw-bold d-flex align-items-center">
                    <i className={`bi ${editingUser ? 'bi-pencil-square' : 'bi-person-plus'} me-2`}></i>
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-control"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">
                        Password {editingUser && '(leave blank to keep current)'}
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        required={!editingUser}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <select
                        className="form-select"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        required
                      >
                        <option value="admin">Admin</option>
                        <option value="head_imam">Head Imam</option>
                        <option value="imam">Imam</option>
                        <option value="bilal">Bilal</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Phone</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                    {editingUser && (
                      <div className="mb-3 form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) =>
                            setFormData({ ...formData, is_active: e.target.checked })
                          }
                        />
                        <label className="form-check-label" htmlFor="is_active">
                          Active
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-success">
                      {editingUser ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
