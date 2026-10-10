import React, { useState, useEffect } from 'react';
import {
  UserCircle,
  Building2,
  MapPin,
  Mail,
  Phone,
  Shield,
  Key,
  Check,
  Save,
  Edit3,
  AlertTriangle,
  Calendar,
  DollarSign,
  FileText,
  Sparkles,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Briefcase,
  X,
  Clock,
  ArrowRight
} from 'lucide-react';
import { User, Branch, CoopProfile } from '../../types';
import { api } from '../../services/api';

interface UserProfileViewProps {
  currentUser: User;
  branches: Branch[];
  cooperative?: CoopProfile;
  onUpdateUser?: (updatedUser: User) => void;
  onNavigateTab?: (tab: any) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  branches,
  cooperative,
  onUpdateUser,
  onNavigateTab
}) => {
  const [userProfile, setUserProfile] = useState<User>(currentUser);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Form Fields
  const [formData, setFormData] = useState({
    full_name: currentUser.name || currentUser.full_name || '',
    username: currentUser.username || '',
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    address: currentUser.address || '',
    title: currentUser.title || currentUser.role_name || '',
    bio: currentUser.bio || '',
    branch_id: currentUser.branch_id || (branches[0]?.id || 'branch_tar'),
    cooperative_id: currentUser.cooperative_id || 'coop_01',
    password: '',
    confirm_password: '',
    current_password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Synchronize when currentUser changes or initial mount
  useEffect(() => {
    loadProfile();
  }, [currentUser.id]);

  const loadProfile = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const res = await api.getUserProfile(currentUser.id);
      if (res.success && res.data) {
        setUserProfile(res.data);
        setFormData({
          full_name: res.data.name || res.data.full_name || '',
          username: res.data.username || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
          title: res.data.title || res.data.role_name || '',
          bio: res.data.bio || '',
          branch_id: res.data.branch_id || currentUser.branch_id || 'branch_tar',
          cooperative_id: res.data.cooperative_id || 'coop_01',
          password: '',
          confirm_password: '',
          current_password: ''
        });
      }
    } catch (err: any) {
      // Fallback to existing currentUser prop
      setUserProfile(currentUser);
      setFormData({
        full_name: currentUser.name || currentUser.full_name || '',
        username: currentUser.username || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        address: currentUser.address || '',
        title: currentUser.title || currentUser.role_name || '',
        bio: currentUser.bio || '',
        branch_id: currentUser.branch_id || 'branch_tar',
        cooperative_id: currentUser.cooperative_id || 'coop_01',
        password: '',
        confirm_password: '',
        current_password: ''
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setFormData({
      full_name: userProfile.name || userProfile.full_name || '',
      username: userProfile.username || '',
      email: userProfile.email || '',
      phone: userProfile.phone || '',
      address: userProfile.address || '',
      title: userProfile.title || userProfile.role_name || '',
      bio: userProfile.bio || '',
      branch_id: userProfile.branch_id || 'branch_tar',
      cooperative_id: userProfile.cooperative_id || 'coop_01',
      password: '',
      confirm_password: '',
      current_password: ''
    });
    setIsEditing(false);
    setIsChangingPassword(false);
    setFeedback(null);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    // Validation
    if (!formData.full_name.trim()) {
      setFeedback({ type: 'error', message: 'Full Name is required.' });
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }
    if (!formData.username.trim()) {
      setFeedback({ type: 'error', message: 'Username is required.' });
      return;
    }

    if (isChangingPassword) {
      if (!formData.password) {
        setFeedback({ type: 'error', message: 'Please specify your new password.' });
        return;
      }
      if (formData.password.length < 6) {
        setFeedback({ type: 'error', message: 'Password must be at least 6 characters long.' });
        return;
      }
      if (formData.password !== formData.confirm_password) {
        setFeedback({ type: 'error', message: 'New password and password confirmation do not match.' });
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: any = {
        id: userProfile.id,
        full_name: formData.full_name.trim(),
        name: formData.full_name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        title: formData.title.trim(),
        bio: formData.bio.trim(),
        branch_id: formData.branch_id,
        cooperative_id: formData.cooperative_id
      };

      if (isChangingPassword && formData.password) {
        payload.password = formData.password;
        if (formData.current_password) {
          payload.current_password = formData.current_password;
        }
      }

      const res = await api.updateUserProfile(userProfile.id, payload);

      if (res.success && res.data) {
        setUserProfile(res.data);
        setIsEditing(false);
        setIsChangingPassword(false);
        setFormData(prev => ({
          ...prev,
          password: '',
          confirm_password: '',
          current_password: ''
        }));
        setFeedback({ type: 'success', message: 'Profile updated and saved to database successfully.' });
        if (onUpdateUser) {
          onUpdateUser(res.data);
        }
      } else {
        throw new Error(res.message || 'Failed to update profile.');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'An error occurred while saving profile changes.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Find assigned branch details
  const activeBranch = branches.find(b => b.id === (isEditing ? formData.branch_id : userProfile.branch_id)) || {
    id: userProfile.branch_id || 'branch_tar',
    name: userProfile.branch_name || 'Main Branch - Tarlac',
    code: userProfile.branch_code || 'TAR',
    address: userProfile.branch_address || 'Poblacion Plaza, Tarlac City, Philippines',
    phone: userProfile.branch_phone || '+63 (045) 982-1200',
    manager_name: userProfile.branch_manager || 'Engr. Jhomel Ignacio',
    active: true
  };

  // Organization cooperative data
  const coopData = {
    name: userProfile.cooperative_name || cooperative?.name || 'Multipurpose Cooperative System',
    registration_no: userProfile.cooperative_registration_no || cooperative?.registration_no || 'CDA-REG-9502-100234',
    tax_id: userProfile.cooperative_tax_id || '005-891-234-000',
    address: userProfile.cooperative_address || cooperative?.address || 'Poblacion Plaza, Tarlac City, Philippines',
    phone: userProfile.cooperative_phone || cooperative?.contact_phone || '+63 (045) 982-1200',
    email: userProfile.cooperative_email || cooperative?.contact_email || 'admin@mayapcare.coop',
    currency: userProfile.cooperative_currency || cooperative?.currency_code || 'PHP (₱)',
    fiscal_year: userProfile.cooperative_fiscal_year || 'Calendar Year (Jan 01 - Dec 31)'
  };

  // Check unsaved changes
  const hasUnsavedChanges = isEditing && (
    formData.full_name !== (userProfile.name || userProfile.full_name || '') ||
    formData.email !== (userProfile.email || '') ||
    formData.username !== (userProfile.username || '') ||
    formData.phone !== (userProfile.phone || '') ||
    formData.address !== (userProfile.address || '') ||
    formData.title !== (userProfile.title || userProfile.role_name || '') ||
    formData.bio !== (userProfile.bio || '') ||
    formData.branch_id !== userProfile.branch_id ||
    Boolean(formData.password)
  );

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (nameStr.substring(0, 2) || 'US').toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Top Header Card / Hero Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Decorative subtle background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Pill with Status */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-lg shadow-blue-900/30 ring-4 ring-slate-800">
                {getInitials(userProfile.name || userProfile.full_name || userProfile.username)}
              </div>
              <div
                title="Account is Active and Verified"
                className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-4 ring-slate-900"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            {/* Identity details */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {userProfile.name || userProfile.full_name || 'Staff User'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {userProfile.role_name || userProfile.role_id || 'Staff Officer'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Status
                </span>
              </div>

              <p className="text-sm text-slate-400 font-mono flex items-center gap-2">
                <span>@{userProfile.username}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-sans">{userProfile.email || 'No email registered'}</span>
              </p>

              {/* Quick Branch & Cooperative Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 text-slate-300 border border-slate-700/60 shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-400">Cooperative:</span>
                  <strong className="text-emerald-300 font-medium">{coopData.name}</strong>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800/90 text-slate-300 border border-slate-700/60 shadow-sm">
                  <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-slate-400">Branch:</span>
                  <strong className="text-blue-300 font-medium">{activeBranch.name}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={loadProfile}
              disabled={isLoading || isSaving}
              title="Refresh profile details from backend"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-lg shadow-blue-900/30 transition cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Personal Information</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-900/30 transition cursor-pointer disabled:opacity-60"
                >
                  <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Unsaved changes alert bar */}
        {hasUnsavedChanges && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-amber-300 bg-amber-500/10 px-3.5 py-2 rounded-xl border border-amber-500/20">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>You have unsaved changes to your personal details. Click "Save Changes" to commit them to the database.</span>
            </div>
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="text-xs font-bold text-amber-200 underline hover:text-white cursor-pointer ml-3"
            >
              Save Now
            </button>
          </div>
        )}
      </div>

      {/* Feedback banner (Success / Error notification) */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dual Organization Overview Grid: Cooperative & Branch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Cooperative Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md hover:border-emerald-500/40 transition duration-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Assigned Cooperative</h3>
                  <p className="text-xs text-slate-400">Apex Entity & Institutional Registry</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Assigned Entity
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Official Cooperative Name
                </div>
                <div className="text-sm font-bold text-emerald-300">{coopData.name}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 block mb-0.5">CDA Registration No.</span>
                  <span className="font-mono font-medium text-slate-200">{coopData.registration_no}</span>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Tax Identification (TIN)</span>
                  <span className="font-mono font-medium text-slate-200">{coopData.tax_id}</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-slate-300">
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{coopData.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{coopData.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{coopData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fiscal Cycle: {coopData.fiscal_year}</span>
                </div>
              </div>
            </div>
          </div>

          {onNavigateTab && (
            <div className="mt-5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => onNavigateTab('configuration')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
              >
                <span>View Cooperative Configuration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Branch Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-md hover:border-blue-500/40 transition duration-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Assigned Branch Office</h3>
                  <p className="text-xs text-slate-400">Operational Unit & Ledger Assignment</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Operating Unit
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Branch Name & Code
                  </span>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-mono text-[10px] font-bold rounded">
                    {activeBranch.code || 'MAIN'}
                  </span>
                </div>
                <div className="text-sm font-bold text-blue-300">{activeBranch.name}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Branch Manager</span>
                  <span className="font-medium text-slate-200">{activeBranch.manager_name || 'Branch Manager'}</span>
                </div>
                <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 block mb-0.5">Branch Status</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Operational & Active
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1 text-slate-300">
                <div className="flex items-start gap-2 text-xs">
                  <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{activeBranch.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>{activeBranch.phone || '+63 (045) 982-1200'}</span>
                </div>
              </div>

              {isEditing && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Transfer / Reassign Branch
                  </label>
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {onNavigateTab && (
            <div className="mt-5 pt-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => onNavigateTab('members')}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                <span>View Branch Members</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Profile Details Form / View */}
      <form onSubmit={handleSaveChanges} className="space-y-6">
        {/* Personal Information Card (Editable) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-blue-400" />
                <span>Personal Information</span>
              </h3>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update your personal details below and click "Save Changes".'
                  : 'Your account and personal identity profile within the cooperative.'}
              </p>
            </div>

            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer self-start sm:self-auto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-400">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Jhomel Ignacio"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs font-medium text-slate-200">
                  {userProfile.name || userProfile.full_name || '—'}
                </div>
              )}
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                System Username <span className="text-rose-400">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="e.g. admin01"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs font-mono text-emerald-400">
                  @{userProfile.username || '—'}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-rose-400">*</span>
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="e.g. jhomel@example.com"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userProfile.email || '—'}</span>
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Contact / Mobile Number
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. +63 912 345 6789"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userProfile.phone || 'Not specified'}</span>
                </div>
              )}
            </div>

            {/* Title / Role Designation */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Job Title / Position
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior Loan Officer / Branch Auditor"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userProfile.title || userProfile.role_name || 'Staff Member'}</span>
                </div>
              )}
            </div>

            {/* Physical Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Residential / Work Location
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g. Tarlac City, Tarlac"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              ) : (
                <div className="px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-200 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{userProfile.address || 'Not specified'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio / Work Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Professional Bio & Remarks
            </label>
            {isEditing ? (
              <textarea
                name="bio"
                rows={3}
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Brief summary of duties, responsibilities, or contact notes..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            ) : (
              <div className="px-3.5 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs text-slate-300 min-h-[4rem] leading-relaxed">
                {userProfile.bio || 'No professional bio provided.'}
              </div>
            )}
          </div>
        </div>

        {/* Security & Credentials Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span>Security & Access Rights</span>
              </h3>
              <p className="text-xs text-slate-400">
                Credentials, assigned permissions, and system access role.
              </p>
            </div>

            <span className="px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 font-semibold text-xs border border-indigo-500/20">
              Role: {userProfile.role_name || userProfile.role_id}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Account Metadata */}
            <div className="space-y-3">
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>User System ID:</span>
                  </span>
                  <code className="text-slate-200 font-mono text-[11px]">{userProfile.id}</code>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-400" />
                    <span>Account Created:</span>
                  </span>
                  <span className="text-slate-200">
                    {userProfile.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Last Sign-In:</span>
                  </span>
                  <span className="text-emerald-300 font-medium">
                    {userProfile.last_login ? new Date(userProfile.last_login).toLocaleString() : 'Recent session'}
                  </span>
                </div>
              </div>

              {/* Granted Permissions Display */}
              <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Granted Access Permissions
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
  {(Array.isArray(userProfile.role_permissions)
    ? userProfile.role_permissions
    : typeof userProfile.role_permissions === "string"
      ? JSON.parse(userProfile.role_permissions || "[]")
      : [
          "member.view",
          "member.create",
          "loan.view",
          "loan.create",
          "savings.view",
          "accounting.view",
        ]
  ).map((perm: string, idx: number) => (
    <span
      key={idx}
      className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] font-mono"
    >
      {perm}
    </span>
  ))}
</div>
              </div>
            </div>

            {/* Password Change Sub-section */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Account Password</span>
                </div>
                {!isChangingPassword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setIsChangingPassword(true);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer underline"
                  >
                    Change Password
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setFormData(prev => ({ ...prev, password: '', confirm_password: '', current_password: '' }));
                    }}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel Change
                  </button>
                )}
              </div>

              {!isChangingPassword ? (
                <div className="text-xs text-slate-400 space-y-1">
                  <p>••••••••••••••••</p>
                  <p className="text-[11px] text-slate-500">
                    Password was verified during sign-in. To update your password, click "Change Password" above.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 pt-2 text-xs animate-in fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter minimum 6 characters"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 pr-9 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  {formData.password && formData.confirm_password && (
                    <div className="text-[11px]">
                      {formData.password === formData.confirm_password ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Passwords match
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Passwords do not match
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Linked Documents & KYC Records Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-teal-400" />
                <span>Linked User Documents & Uploads</span>
              </h3>
              <p className="text-xs text-slate-400">
                Official documents, government IDs, and signature forms attached to your account.
              </p>
            </div>

            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('user_documents')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 text-xs font-semibold border border-slate-700 transition cursor-pointer self-start sm:self-auto"
              >
                <span>Document Repository</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-semibold text-white">Need to upload credentials or compliance files?</span>
              <p className="text-slate-400 text-[11px]">
                You can upload PDF certificates, IDs, and appointment records in the User Document Management Module.
              </p>
            </div>
            {onNavigateTab && (
              <button
                type="button"
                onClick={() => onNavigateTab('user_documents')}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow transition cursor-pointer shrink-0"
              >
                Manage My Documents
              </button>
            )}
          </div>
        </div>

        {/* Bottom Save & Cancel Controls when editing */}
        {isEditing && (
          <div className="sticky bottom-4 z-20 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
            <div className="text-xs text-slate-300 hidden sm:block">
              Remember to save your changes to update your account across all branches.
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/40 transition cursor-pointer disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
