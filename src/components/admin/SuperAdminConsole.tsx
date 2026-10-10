import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldAlert,
  Building2,
  Sliders,
  Search,
  Plus,
  Edit2,
  Check,
  X,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileSpreadsheet,
  Globe2,
  UserCheck,
  UserX
} from 'lucide-react';
import { User, UserRole, Branch, CoopProfile } from '../../types';
import { api } from '../../services/api';

interface SuperAdminConsoleProps {
  currentUser: User;
  branches: Branch[];
  cooperativeProfile?: CoopProfile | null;
  onRefresh?: () => void;
  onNavigateToAudit?: () => void;
}

export const SuperAdminConsole: React.FC<SuperAdminConsoleProps> = ({
  currentUser,
  branches = [],
  cooperativeProfile,
  onRefresh,
  onNavigateToAudit
}) => {
  // Navigation Tabs within Super Admin Console
  const [activeConsoleTab, setActiveConsoleTab] = useState<'users' | 'roles' | 'branches' | 'cooperative'>('users');

  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [branchList, setBranchList] = useState<Branch[]>(branches);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);

  const [isEditRoleOpen, setIsEditRoleOpen] = useState(false);
  const [selectedRoleForEdit, setSelectedRoleForEdit] = useState<UserRole | null>(null);

  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [selectedBranchForEdit, setSelectedBranchForEdit] = useState<Branch | null>(null);

  // Forms
  const [userForm, setUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role_id: 'role_loan_officer',
    branch_id: branches[0]?.id || 'branch_tar',
    active: true
  });

  const [roleEditForm, setRoleEditForm] = useState<{
    name: string;
    description: string;
    permissions: string[];
  }>({
    name: '',
    description: '',
    permissions: []
  });

  const [branchForm, setBranchForm] = useState({
    code: '',
    name: '',
    address: '',
    phone: '',
    manager_name: ''
  });

  // Cooperative Form
  const [coopForm, setCoopForm] = useState({
    name: cooperativeProfile?.name || 'Mayap Care Agriculture Cooperative',
    registration_no: cooperativeProfile?.registration_no || 'CDA-REG-2024-8849',
    tax_id: cooperativeProfile?.tax_id || '009-847-231-000',
    address: cooperativeProfile?.address || 'Provincial Capitol Compound, Tarlac City',
    phone: cooperativeProfile?.phone || '+63 45 982 1000',
    email: cooperativeProfile?.email || 'office@mayapcare.coop',
    currency: cooperativeProfile?.currency || 'PHP',
    currency_symbol: cooperativeProfile?.currency_symbol || '₱',
    fiscal_year: cooperativeProfile?.fiscal_year || 'Calendar Year (Jan 1 - Dec 31)'
  });

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Load All Console Data
  const loadConsoleData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes, branchesRes] = await Promise.all([
        api.getUsersList(),
        api.getUserRoles(),
        api.getBranches()
      ]);

      if (usersRes.data) {
        setUsers(usersRes.data);
      }
      if (rolesRes.data) {
        setRoles(rolesRes.data);
      }
      if (branchesRes.data) {
        setBranchList(branchesRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load superadmin console data:', err);
      showToast('error', 'Unable to retrieve administrative directory records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConsoleData();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      if (branchFilter !== 'all' && user.branch_id !== branchFilter) return false;
      if (roleFilter !== 'all' && user.role_id !== roleFilter) return false;
      if (statusFilter !== 'all') {
        const isActive = user.active !== false;
        if (statusFilter === 'active' && !isActive) return false;
        if (statusFilter === 'inactive' && isActive) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (user.full_name || user.name || '').toLowerCase().includes(q);
        const matchesUser = (user.username || '').toLowerCase().includes(q);
        const matchesEmail = (user.email || '').toLowerCase().includes(q);
        const matchesRole = (user.role_name || '').toLowerCase().includes(q);
        const matchesBranch = (user.branch_name || '').toLowerCase().includes(q);
        if (!matchesName && !matchesUser && !matchesEmail && !matchesRole && !matchesBranch) return false;
      }
      return true;
    });
  }, [users, branchFilter, roleFilter, statusFilter, searchQuery]);

  // Handle Quick Toggle Status
  const handleToggleUserStatus = async (user: User) => {
    const nextState = !(user.active !== false);
    try {
      await api.toggleUserStatus(user.id, nextState);
      setUsers(prev =>
        prev.map(u => (u.id === user.id ? { ...u, active: nextState } : u))
      );
      showToast('success', `User account "${user.username}" is now ${nextState ? 'Active' : 'Deactivated'}.`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user status.');
    }
  };

  // Handle Open Create User Modal
  const handleOpenAddUser = () => {
    setUserForm({
      username: '',
      full_name: '',
      email: '',
      phone: '',
      password: '',
      role_id: roles[0]?.id || 'role_loan_officer',
      branch_id: branchList[0]?.id || 'branch_tar',
      active: true
    });
    setIsAddUserOpen(true);
  };

  // Submit Create User
  const handleSubmitCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.full_name || !userForm.email) {
      showToast('error', 'Full Name, Username, and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createUser({
        ...userForm,
        password: userForm.password || 'admin123'
      });
      showToast('success', res.message || `User account "${userForm.username}" provisioned successfully.`);
      setIsAddUserOpen(false);
      await loadConsoleData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setUserForm({
      username: user.username,
      full_name: user.full_name || user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role_id: user.role_id,
      branch_id: user.branch_id,
      active: user.active !== false
    });
    setIsEditUserOpen(true);
  };

  // Submit Edit User
  const handleSubmitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        full_name: userForm.full_name,
        email: userForm.email,
        phone: userForm.phone,
        role_id: userForm.role_id,
        branch_id: userForm.branch_id,
        active: userForm.active
      };
      if (userForm.password.trim()) {
        payload.password = userForm.password.trim();
      }

      await api.updateUser(selectedUserForEdit.id, payload);
      showToast('success', `User "${selectedUserForEdit.username}" updated successfully.`);
      setIsEditUserOpen(false);
      await loadConsoleData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to modify user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Role Permissions Modal
  const handleOpenEditRole = (role: UserRole) => {
    setSelectedRoleForEdit(role);
    setRoleEditForm({
      name: role.name,
      description: role.description || '',
      permissions: [...(role.permissions || [])]
    });
    setIsEditRoleOpen(true);
  };

  const handleTogglePermission = (perm: string) => {
    setRoleEditForm(prev => {
      const exists = prev.permissions.includes(perm);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(p => p !== perm)
          : [...prev.permissions, perm]
      };
    });
  };

  // Submit Role Edit
  const handleSubmitEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoleForEdit) return;

    setIsSubmitting(true);
    try {
      await api.updateUserRole(selectedRoleForEdit.id, roleEditForm);
      showToast('success', `Role "${roleEditForm.name}" updated successfully.`);
      setIsEditRoleOpen(false);
      await loadConsoleData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Branch Handlers
  const handleOpenAddBranch = () => {
    setBranchForm({
      code: '',
      name: '',
      address: '',
      phone: '',
      manager_name: ''
    });
    setIsAddBranchOpen(true);
  };

  const handleSubmitCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.name) {
      showToast('error', 'Branch name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createBranch(branchForm);
      showToast('success', `Branch "${branchForm.name}" registered successfully.`);
      setIsAddBranchOpen(false);
      await loadConsoleData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to register new branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditBranch = (b: Branch) => {
    setSelectedBranchForEdit(b);
    setBranchForm({
      code: b.code || '',
      name: b.name,
      address: b.address || '',
      phone: b.phone || b.contact_number || '',
      manager_name: b.manager_name || ''
    });
    setIsEditBranchOpen(true);
  };

  const handleSubmitEditBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranchForEdit) return;

    setIsSubmitting(true);
    try {
      await api.updateBranch(selectedBranchForEdit.id, branchForm);
      showToast('success', `Branch "${branchForm.name}" updated successfully.`);
      setIsEditBranchOpen(false);
      await loadConsoleData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Available permissions pool
  const standardPermissionsList = [
    { key: 'users.view', label: 'View User Directory', category: 'Governance' },
    { key: 'users.create', label: 'Provision Users', category: 'Governance' },
    { key: 'users.edit', label: 'Modify User Profiles', category: 'Governance' },
    { key: 'users.activate', label: 'Activate/Deactivate Accounts', category: 'Governance' },
    { key: 'roles.view', label: 'View System Roles', category: 'Governance' },
    { key: 'roles.edit', label: 'Modify Permissions', category: 'Governance' },
    { key: 'branches.view', label: 'View Branches', category: 'Governance' },
    { key: 'branches.create', label: 'Create Branches', category: 'Governance' },
    { key: 'branches.edit', label: 'Modify Branches', category: 'Governance' },
    { key: 'cooperative.view', label: 'View Coop Profile', category: 'Governance' },
    { key: 'cooperative.edit', label: 'Modify Coop Profile', category: 'Governance' },
    { key: 'audit.view', label: 'Audit Trail Access', category: 'Governance' },
    { key: 'audit.export', label: 'Export Audit Records', category: 'Governance' },
    { key: 'loan.view', label: 'View Loans', category: 'Operations' },
    { key: 'loan.approve', label: 'Approve Loans', category: 'Operations' },
    { key: 'loan.release', label: 'Disburse Loans', category: 'Operations' },
    { key: 'journal.view', label: 'View General Ledger', category: 'Accounting' },
    { key: 'journal.post', label: 'Post Journal Entries', category: 'Accounting' },
    { key: 'period.close', label: 'Close Fiscal Periods', category: 'Accounting' },
    { key: 'member.view', label: 'View Member Registry', category: 'Operations' },
    { key: 'member.create', label: 'Onboard Members', category: 'Operations' },
    { key: 'reports.view', label: 'Financial Reports Access', category: 'Reporting' }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner: Super Admin Governance Authority */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Super Administrator Governance Console
                </h1>
                <span className="text-xs text-emerald-400 font-mono font-medium">
                  role_superadmin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full governance authority over User Accounts, Role Assignments, Branches, Cooperative Settings, and Global Audit Trails.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {onNavigateToAudit && (
              <button
                type="button"
                onClick={onNavigateToAudit}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                <span>Audit Logs Trail</span>
              </button>
            )}

            <button
              type="button"
              onClick={loadConsoleData}
              disabled={isLoading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 mt-5 border-t border-slate-800 pt-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveConsoleTab('users')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
              activeConsoleTab === 'users'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>User Management ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConsoleTab('roles')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
              activeConsoleTab === 'roles'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>User Roles & Permissions ({roles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConsoleTab('branches')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
              activeConsoleTab === 'branches'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Branches ({branchList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveConsoleTab('cooperative')}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center space-x-2 whitespace-nowrap ${
              activeConsoleTab === 'cooperative'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Globe2 className="w-4 h-4" />
            <span>Cooperative Profile</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center space-x-2.5 transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: USER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeConsoleTab === 'users' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-0">
              <div className="relative min-w-[220px] flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search name, username, email..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Branch Filter */}
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Branches ({branchList.length})</option>
                {branchList.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Roles</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Accounts Only</option>
                <option value="inactive">Deactivated Only</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleOpenAddUser}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Staff User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Assigned Branch</th>
                    <th className="py-3 px-4">Role Assignment</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Last Activity</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No user accounts match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const isActive = user.active !== false;
                      const isSuper = user.role_id === 'role_superadmin' || user.is_super_admin;
                      return (
                        <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">
                              {user.full_name || user.name || user.username}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                              <span>@{user.username}</span>
                              {user.email && (
                                <>
                                  <span>·</span>
                                  <span>{user.email}</span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="text-slate-200">
                              {user.branch_name || user.branch_id || 'Tarlac Main Branch'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {user.branch_id}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-medium ${isSuper ? 'text-amber-400' : 'text-slate-200'}`}>
                                {user.role_name || user.role_id}
                              </span>
                              {isSuper && (
                                <span className="text-[10px] text-amber-500 font-mono">
                                  [GOV]
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(user)}
                              title={isActive ? 'Click to deactivate user' : 'Click to activate user'}
                              className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-500/30'
                                  : 'bg-rose-950/60 text-rose-300 hover:bg-rose-900/60 border border-rose-500/30'
                              }`}
                            >
                              {isActive ? (
                                <>
                                  <UserCheck className="w-3 h-3 text-emerald-400" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="w-3 h-3 text-rose-400" />
                                  <span>Inactive</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEditUser(user)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition cursor-pointer inline-flex items-center space-x-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER ROLES & PERMISSIONS */}
      {/* ========================================================================= */}
      {activeConsoleTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-white">System Role Definitions & Capabilities</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Role permissions dictate access boundaries across cooperative modules and administrative functions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(role => {
              const isSuper = role.id === 'role_superadmin';
              return (
                <div
                  key={role.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-bold ${isSuper ? 'text-amber-400' : 'text-white'}`}>
                        {role.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {role.user_count ?? 0} {role.user_count === 1 ? 'user' : 'users'}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {role.id}
                    </div>

                    <p className="text-xs text-slate-400 mt-2 min-h-[36px]">
                      {role.description || 'No description configured for this role.'}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-800">
                      <div className="text-[11px] text-slate-400 font-semibold mb-1.5 flex items-center justify-between">
                        <span>Assigned Permissions</span>
                        <span className="font-mono text-emerald-400">
                          {role.permissions?.length || 0} granted
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                        {(role.permissions || []).map(perm => (
                          <span
                            key={perm}
                            className="text-[10px] bg-slate-950 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono"
                          >
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleOpenEditRole(role)}
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Configure Permissions</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: BRANCHES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeConsoleTab === 'branches' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white">Cooperative Branch Registry</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every member, transaction, loan, and staff account is linked via branch_id foreign keys.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddBranch}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register New Branch</span>
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-medium">
                  <th className="py-3 px-4">Branch Code & Name</th>
                  <th className="py-3 px-4">Address / Municipality</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Branch Manager</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {branchList.map(branch => (
                  <tr key={branch.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{branch.name}</span>
                        {branch.is_main && (
                          <span className="text-[10px] bg-emerald-950 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                            Main
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Code: {branch.code} · ID: {branch.id}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {branch.address || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {branch.phone || branch.contact_number || '—'}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {branch.manager_name || '—'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="text-emerald-400 font-medium">
                        Active
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditBranch(branch)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition cursor-pointer inline-flex items-center space-x-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COOPERATIVE PROFILE */}
      {/* ========================================================================= */}
      {activeConsoleTab === 'cooperative' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-white">Cooperative Institutional Information</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Governing profile used across CDA regulatory disclosures, receipts, and system headers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Cooperative Name</label>
              <input
                type="text"
                value={coopForm.name}
                onChange={e => setCoopForm({ ...coopForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">CDA Registration Number</label>
              <input
                type="text"
                value={coopForm.registration_no}
                onChange={e => setCoopForm({ ...coopForm, registration_no: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tax Identification Number (TIN)</label>
              <input
                type="text"
                value={coopForm.tax_id}
                onChange={e => setCoopForm({ ...coopForm, tax_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Official Email Address</label>
              <input
                type="email"
                value={coopForm.email}
                onChange={e => setCoopForm({ ...coopForm, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Official Telephone / Mobile</label>
              <input
                type="text"
                value={coopForm.phone}
                onChange={e => setCoopForm({ ...coopForm, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Primary Operating Currency</label>
              <input
                type="text"
                value={`${coopForm.currency} (${coopForm.currency_symbol})`}
                disabled
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">Headquarters Office Address</label>
              <input
                type="text"
                value={coopForm.address}
                onChange={e => setCoopForm({ ...coopForm, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={async () => {
                setIsSubmitting(true);
                try {
                  await api.saveCoopProfile(coopForm);
                  showToast('success', 'Cooperative institutional parameters updated.');
                  if (onRefresh) onRefresh();
                } catch (err: any) {
                  showToast('error', err.message || 'Failed to update cooperative profile.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Cooperative Parameters'}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD NEW USER */}
      {/* ========================================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Provision New User Account</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={userForm.full_name}
                  onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                  placeholder="e.g. Maria Santos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="e.g. msantos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Temporary Password</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Defaults to admin123"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. msantos@coopflex.ph"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role Assignment</label>
                  <select
                    value={userForm.role_id}
                    onChange={e => setUserForm({ ...userForm, role_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch Assignment</label>
                  <select
                    value={userForm.branch_id}
                    onChange={e => setUserForm({ ...userForm, branch_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {branchList.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="text-xs text-slate-300 flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.active}
                    onChange={e => setUserForm({ ...userForm, active: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                  />
                  <span>Activate account immediately</span>
                </label>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                  >
                    {isSubmitting ? 'Saving...' : 'Create Account'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT USER */}
      {/* ========================================================================= */}
      {isEditUserOpen && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  <span>Modify User: @{selectedUserForEdit.username}</span>
                </h3>
                <p className="text-[11px] text-slate-400">ID: {selectedUserForEdit.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditUserOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditUser} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userForm.full_name}
                  onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={e => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">User Role</label>
                  <select
                    value={userForm.role_id}
                    onChange={e => setUserForm({ ...userForm, role_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Branch</label>
                  <select
                    value={userForm.branch_id}
                    onChange={e => setUserForm({ ...userForm, branch_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {branchList.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="Enter new password if changing"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <label className="text-xs text-slate-300 flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.active}
                    onChange={e => setUserForm({ ...userForm, active: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-emerald-500"
                  />
                  <span>Account Active</span>
                </label>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditUserOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                  >
                    {isSubmitting ? 'Updating...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT ROLE PERMISSIONS */}
      {/* ========================================================================= */}
      {isEditRoleOpen && selectedRoleForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg p-5 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Configure Permissions: {selectedRoleForEdit.name}</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">{selectedRoleForEdit.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditRoleOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditRole} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  value={roleEditForm.name}
                  onChange={e => setRoleEditForm({ ...roleEditForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Role Description</label>
                <input
                  type="text"
                  value={roleEditForm.description}
                  onChange={e => setRoleEditForm({ ...roleEditForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  Grantable System Capabilities ({roleEditForm.permissions.length} selected)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {standardPermissionsList.map(perm => {
                    const isChecked = roleEditForm.permissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start space-x-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm.key)}
                          className="mt-0.5 rounded bg-slate-900 border-slate-800 text-emerald-500"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold leading-tight">{perm.label}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.key}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditRoleOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                >
                  {isSubmitting ? 'Saving...' : 'Apply Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT BRANCH */}
      {/* ========================================================================= */}
      {(isAddBranchOpen || isEditBranchOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>{isAddBranchOpen ? 'Register New Branch' : `Edit Branch: ${selectedBranchForEdit?.name}`}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddBranchOpen(false);
                  setIsEditBranchOpen(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={isAddBranchOpen ? handleSubmitCreateBranch : handleSubmitEditBranch}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={branchForm.name}
                  onChange={e => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="e.g. Urdaneta Agri-Center Branch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Branch Code (3-4 Letters)</label>
                <input
                  type="text"
                  value={branchForm.code}
                  onChange={e => setBranchForm({ ...branchForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. URD"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Address / Municipality</label>
                <input
                  type="text"
                  value={branchForm.address}
                  onChange={e => setBranchForm({ ...branchForm, address: e.target.value })}
                  placeholder="Barangay, City, Province"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={branchForm.phone}
                  onChange={e => setBranchForm({ ...branchForm, phone: e.target.value })}
                  placeholder="+63 45 XXX XXXX"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Designated Manager</label>
                <input
                  type="text"
                  value={branchForm.manager_name}
                  onChange={e => setBranchForm({ ...branchForm, manager_name: e.target.value })}
                  placeholder="e.g. Roberto Valenzuela"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddBranchOpen(false);
                    setIsEditBranchOpen(false);
                  }}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                >
                  {isSubmitting ? 'Saving...' : isAddBranchOpen ? 'Register Branch' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
