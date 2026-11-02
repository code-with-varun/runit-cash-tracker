import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Activity,
  Database,
  Search,
  UserPlus,
  Trash2,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Key,
  Calendar,
  Layers,
  Lock,
  ArrowRight
} from 'lucide-react';
import {
  getAdminUsersAPI,
  updateAdminUserAPI,
  createAdminUserAPI,
  deleteAdminUserAPI
} from '../utils/api';
import SlicerBar from './SlicerBar';
import DataTablePagination, { useDataTablePagination } from './DataTablePagination';

export default function SuperAdminView({ currentAdmin }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalTransactions: 0, totalCategories: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [message, setMessage] = useState(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAdminUsersAPI();
      if (res && res.users) {
        setUsers(res.users);
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.error('Failed to load admin users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAdminUserAPI({ id: user.id, status: nextStatus });
      setMessage({ type: 'success', text: `User ${user.username} is now ${nextStatus}` });
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const handleToggleRole = async (user) => {
    if (String(user.id) === String(currentAdmin?.id)) {
      alert("You cannot change your own superadmin role.");
      return;
    }
    const nextRole = user.role === 'superadmin' ? 'user' : 'superadmin';
    try {
      await updateAdminUserAPI({ id: user.id, role: nextRole });
      setMessage({ type: 'success', text: `Role for ${user.username} updated to ${nextRole}` });
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update user role' });
    }
  };

  const handleDeleteUser = async (user) => {
    if (String(user.id) === String(currentAdmin?.id)) {
      alert("You cannot delete your own superadmin account.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${user.username}" and all their financial data?`)) {
      return;
    }
    try {
      await deleteAdminUserAPI(user.id);
      setMessage({ type: 'success', text: `User ${user.username} deleted successfully` });
      loadUsers();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete user' });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      alert("Please fill all required fields.");
      return;
    }
    try {
      const res = await createAdminUserAPI({
        name: newName.trim(),
        username: newUsername.trim(),
        password: newPassword.trim(),
        role: newRole,
      });
      if (res && res.success) {
        setMessage({ type: 'success', text: `User ${newUsername} created successfully` });
        setIsAddModalOpen(false);
        setNewName('');
        setNewUsername('');
        setNewPassword('');
        setNewRole('user');
        loadUsers();
      } else {
        alert(res?.error || "Failed to create user");
      }
    } catch (err) {
      alert("Error creating user: " + err.message);
    }
  };

  const matchesMulti = (filterVal, itemVal) => {
    if (!filterVal || filterVal === 'ALL') return true;
    if (Array.isArray(filterVal)) {
      if (filterVal.length === 0 || filterVal.includes('ALL')) return true;
      return filterVal.includes(itemVal);
    }
    return filterVal === itemVal;
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = matchesMulti(roleFilter, u.role);
    const uStatus = (u.status || 'active').toLowerCase();
    const matchesStatus = matchesMulti(statusFilter, uStatus);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedItems: paginatedUsers,
    PaginationComponent,
    getSortHeaderProps,
    renderSortIndicator
  } = useDataTablePagination(filteredUsers, 10);

  const adminSlicerGroups = [
    {
      id: 'role',
      label: 'Role Access',
      icon: ShieldCheck,
      selected: roleFilter,
      onChange: setRoleFilter,
      options: [
        { value: 'ALL', label: 'All Roles', count: users.length },
        { value: 'superadmin', label: 'Super Admin', count: users.filter(u => u.role === 'superadmin').length, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
        { value: 'user', label: 'Standard User', count: users.filter(u => u.role === 'user').length, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      icon: CheckCircle2,
      selected: statusFilter,
      onChange: setStatusFilter,
      options: [
        { value: 'ALL', label: 'All Statuses', count: users.length },
        { value: 'active', label: 'Active', count: users.filter(u => (u.status || 'active').toLowerCase() === 'active').length, color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
        { value: 'inactive', label: 'Inactive', count: users.filter(u => (u.status || '').toLowerCase() === 'inactive').length, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' }
      ]
    }
  ];

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Top Banner */}
      <div className="card glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} color="#ef4444" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, letterSpacing: '-0.02em' }}>
                Super Admin Console
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                System-wide user accounts, permissions, and database records control
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.78125rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                border: 'none',
                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
              }}
            >
              <UserPlus size={15} />
              <span>+ Add User</span>
            </button>

            <button
              onClick={loadUsers}
              className="btn btn-ghost btn-sm"
              style={{ padding: '0.45rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
              title="Refresh Users"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {message && (
          <div style={{
            marginTop: '0.875rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '8px',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: message.type === 'success' ? '#10b981' : '#ef4444',
            fontSize: '0.78125rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            {message.type === 'success' ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Stats Ribbon */}
      <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
        <div className="card glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Registered Users
            </span>
            <Users size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3b82f6', marginTop: '0.25rem' }}>
            {stats.totalUsers}
          </div>
        </div>

        <div className="card glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Platform Transactions
            </span>
            <Activity size={16} color="var(--accent-cr)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-cr)', marginTop: '0.25rem' }}>
            {stats.totalTransactions}
          </div>
        </div>

        <div className="card glass-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
              Category Masters
            </span>
            <Layers size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#f59e0b', marginTop: '0.25rem' }}>
            {stats.totalCategories}
          </div>
        </div>
      </div>

      {/* Analytical Slicers Bar */}
      <SlicerBar
        groups={adminSlicerGroups}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name or @username..."
        totalCount={users.length}
        filteredCount={filteredUsers.length}
        defaultCollapsed={true}
        onResetAll={() => {
          setSearchTerm('');
          setRoleFilter('ALL');
          setStatusFilter('ALL');
        }}
        title="Admin User Slicers"
      />

      {/* Users Table */}
      <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>
              System Registered Users ({filteredUsers.length})
            </h3>
            <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
              Manage credentials, roles, and account accessibility
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            No users match active filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.8125rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                <th {...getSortHeaderProps('name')} style={{ padding: '0.65rem' }}>User {renderSortIndicator('name')}</th>
                <th {...getSortHeaderProps('role')} style={{ padding: '0.65rem' }}>Role {renderSortIndicator('role')}</th>
                <th {...getSortHeaderProps('status')} style={{ padding: '0.65rem' }}>Status {renderSortIndicator('status')}</th>
                <th {...getSortHeaderProps('tx_count')} style={{ padding: '0.65rem', textAlign: 'center' }}>Transactions {renderSortIndicator('tx_count')}</th>
                <th {...getSortHeaderProps('cat_count')} style={{ padding: '0.65rem', textAlign: 'center' }}>Categories {renderSortIndicator('cat_count')}</th>
                <th {...getSortHeaderProps('created_at')} style={{ padding: '0.65rem' }}>Registered {renderSortIndicator('created_at')}</th>
                <th style={{ padding: '0.65rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => {
                const isCurrent = String(u.id) === String(currentAdmin?.id);
                const isSuper = u.role === 'superadmin';
                const isActive = u.status === 'active';

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.65rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: isSuper ? '#ef4444' : 'var(--primary-brand)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: '700'
                        }}>
                          {(u.name || u.username).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {u.name || u.username} {isCurrent && <span style={{ fontSize: '0.65rem', color: 'var(--accent-cr)' }}>(You)</span>}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                            @{u.username}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '0.65rem' }}>
                      <button
                        onClick={() => handleToggleRole(u)}
                        disabled={isCurrent}
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: '700',
                          border: 'none',
                          cursor: isCurrent ? 'default' : 'pointer',
                          background: isSuper ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: isSuper ? '#ef4444' : '#3b82f6'
                        }}
                        title={isCurrent ? 'Your role' : 'Click to toggle role'}
                      >
                        {u.role.toUpperCase()}
                      </button>
                    </td>

                    <td style={{ padding: '0.65rem' }}>
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isCurrent}
                        style={{
                          padding: '0.15rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.6875rem',
                          fontWeight: '700',
                          border: 'none',
                          cursor: isCurrent ? 'default' : 'pointer',
                          background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                          color: isActive ? '#10b981' : '#94a3b8'
                        }}
                        title={isCurrent ? 'Your status' : 'Click to toggle status'}
                      >
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </button>
                    </td>

                    <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: '700' }}>
                      {u.txCount || 0}
                    </td>

                    <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: '700' }}>
                      {u.catCount || 0}
                    </td>

                    <td style={{ padding: '0.65rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {u.createdAt ? String(u.createdAt).substring(0, 10) : '—'}
                    </td>

                    <td style={{ padding: '0.65rem', textAlign: 'right' }}>
                      {!isCurrent && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="btn btn-ghost btn-sm"
                          title="Delete User & Data"
                          style={{ padding: '0.25rem', color: 'var(--accent-dr)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        )}

        {/* DataTable Pagination Bar */}
        <PaginationComponent itemLabel="users" pageSizeOptions={[10, 25, 50, 'ALL']} />
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1000 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '420px', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1875rem', fontWeight: '800', marginBottom: '1rem' }}>
              Create User Account
            </h3>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. johndoe"
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '0.25rem' }}>
                  System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '0.8125rem' }}
                >
                  <option value="user">Standard User (Personal Finance Only)</option>
                  <option value="superadmin">Super Admin (System Control)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ background: '#ef4444', border: 'none' }}
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
