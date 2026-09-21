import React, { useEffect, useState } from 'react';
import { api } from '../../lib/apiClient';
import { useAuth, ROLE_GROUPS, hasRole } from '../../auth/AuthContext';
import Table from '../../components/Table';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';

const ROLES = [
  { value: 'system_admin', label: 'System Administrator' },
  { value: 'school_head', label: 'School Head' },
  { value: 'drrm_coordinator', label: 'DRRM Coordinator' },
  { value: 'drrm_team_member', label: 'DRRM Team Member' },
  { value: 'teacher_employee', label: 'Teacher / Employee' },
  { value: 'security_utility', label: 'Security / Utility Personnel' },
];

const EMPTY_CREATE_FORM = { employeeId: '', firstName: '', lastName: '', email: '', password: '', role: 'teacher_employee', position: '', department: '', contactNumber: '' };
const EMPTY_EDIT_FORM = { firstName: '', lastName: '', email: '', role: 'teacher_employee', position: '', department: '', contactNumber: '' };

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const canManage = hasRole(currentUser, ROLE_GROUPS.ADMIN_ONLY);

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState('');

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const load = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (!showInactive) params.set('isActive', 'true');
    if (search) params.set('search', search);
    api.get(`/users?${params.toString()}`).then(setUsers).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
  };
  useEffect(load, [showInactive, search]);

  const handleCreateChange = (field) => (e) => setCreateForm((f) => ({ ...f, [field]: e.target.value }));
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', createForm);
      setShowCreateForm(false);
      setCreateForm(EMPTY_CREATE_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setEditForm({
      firstName: u.first_name, lastName: u.last_name, email: u.email, role: u.role,
      position: u.position || '', department: u.department || '', contactNumber: u.contact_number || '',
    });
  };
  const handleEditChange = (field) => (e) => setEditForm((f) => ({ ...f, [field]: e.target.value }));
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${editingUser.id}`, editForm);
      setEditingUser(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (u) => {
    try {
      if (u.is_active) {
        await api.delete(`/users/${u.id}`);
      } else {
        await api.put(`/users/${u.id}`, { isActive: true });
      }
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/users/${resetPasswordUser.id}/reset-password`, { password: newPassword });
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (err) {
      setError(err.message);
    }
  };

  const roleLabel = (value) => ROLES.find((r) => r.value === value)?.label || value;

  const columns = [
    { key: 'name', header: 'Name', render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r) => roleLabel(r.role) },
    { key: 'position', header: 'Position', render: (r) => r.position || '—' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge value={r.is_active ? 'active' : 'inactive'} /> },
    { key: 'actions', header: '', render: (r) => (
        canManage && (
          <div className="flex gap-2 whitespace-nowrap">
            <button onClick={() => openEdit(r)} className="text-xs font-medium text-brand-700 hover:underline">Edit</button>
            <button onClick={() => setResetPasswordUser(r)} className="text-xs font-medium text-brand-700 hover:underline">Reset Password</button>
            <button
              onClick={() => toggleActive(r)}
              className={`text-xs font-medium hover:underline ${r.is_active ? 'text-risk-critical' : 'text-green-700'}`}
            >
              {r.is_active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        )
      ) },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage staff accounts and roles.</p>
        </div>
        {canManage && <Button onClick={() => setShowCreateForm(true)}>+ Add User</Button>}
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="text-sm rounded-lg border border-slate-300 px-3 py-1.5 w-full sm:w-64"
        />
        <label className="flex items-center gap-1.5 text-sm text-slate-600">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive accounts
        </label>
      </div>

      {error && !showCreateForm && !editingUser && !resetPasswordUser && <div className="text-sm text-risk-critical mb-3">{error}</div>}
      <Table columns={columns} rows={users} isLoading={isLoading} emptyMessage="No users found." />

      {showCreateForm && (
        <Modal title="Add User" onClose={() => setShowCreateForm(false)} wide>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="First Name" required value={createForm.firstName} onChange={handleCreateChange('firstName')} />
              <FormField label="Last Name" required value={createForm.lastName} onChange={handleCreateChange('lastName')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField type="email" label="Email" required value={createForm.email} onChange={handleCreateChange('email')} />
              <FormField type="password" label="Temporary Password" required value={createForm.password} onChange={handleCreateChange('password')} placeholder="At least 8 characters" />
            </div>
            <FormField as="select" label="Role" required value={createForm.role} onChange={handleCreateChange('role')}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Employee ID" value={createForm.employeeId} onChange={handleCreateChange('employeeId')} />
              <FormField label="Position" value={createForm.position} onChange={handleCreateChange('position')} />
              <FormField label="Department" value={createForm.department} onChange={handleCreateChange('department')} />
            </div>
            <FormField label="Contact Number" value={createForm.contactNumber} onChange={handleCreateChange('contactNumber')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </Modal>
      )}

      {editingUser && (
        <Modal title={`Edit — ${editingUser.first_name} ${editingUser.last_name}`} onClose={() => setEditingUser(null)} wide>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="First Name" required value={editForm.firstName} onChange={handleEditChange('firstName')} />
              <FormField label="Last Name" required value={editForm.lastName} onChange={handleEditChange('lastName')} />
            </div>
            <FormField type="email" label="Email" required value={editForm.email} onChange={handleEditChange('email')} />
            <FormField as="select" label="Role" required value={editForm.role} onChange={handleEditChange('role')}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Position" value={editForm.position} onChange={handleEditChange('position')} />
              <FormField label="Department" value={editForm.department} onChange={handleEditChange('department')} />
            </div>
            <FormField label="Contact Number" value={editForm.contactNumber} onChange={handleEditChange('contactNumber')} />
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </Modal>
      )}

      {resetPasswordUser && (
        <Modal title={`Reset Password — ${resetPasswordUser.first_name} ${resetPasswordUser.last_name}`} onClose={() => setResetPasswordUser(null)}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <FormField
              type="password" label="New Password" required minLength={8}
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <p className="text-xs text-slate-500">Share this new password with the user through a secure channel — it won't be shown again.</p>
            {error && <div className="text-sm text-risk-critical">{error}</div>}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setResetPasswordUser(null)}>Cancel</Button>
              <Button type="submit">Reset Password</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
