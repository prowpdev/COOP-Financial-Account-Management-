import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Users,
  Lock,
  Mail,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sprout,
  Briefcase,
  ChevronRight,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  Layers,
  KeyRound,
  FileCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { User as UserType, Member, AuthSession } from '../../types';

interface AuthPortalProps {
  onSuccess: (session: AuthSession) => void;
  initialMode?: 'staff' | 'member';
}

export const AuthPortal: React.FC<AuthPortalProps> = ({
  onSuccess,
  initialMode = 'staff'
}) => {
  const [activePortal, setActivePortal] = useState<'staff' | 'member'>(initialMode);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Dropdown data
  const [branches, setBranches] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [memberTypes, setMemberTypes] = useState<any[]>([]);

  // Staff Login fields
  const [staffIdentifier, setStaffIdentifier] = useState('admin');
  const [staffPassword, setStaffPassword] = useState('Admin@123456');

  // Staff Register fields
  const [staffFullName, setStaffFullName] = useState('');
  const [staffRegUsername, setStaffRegUsername] = useState('');
  const [staffRegEmail, setStaffRegEmail] = useState('');
  const [staffRegPassword, setStaffRegPassword] = useState('');
  const [staffRegRoleId, setStaffRegRoleId] = useState('role_loan_officer');
  const [staffRegBranchId, setStaffRegBranchId] = useState('branch_tar');

  // Member Login fields
  const [memberIdentifier, setMemberIdentifier] = useState('MEM-2026-0001');
  const [memberPassword, setMemberPassword] = useState('123456');

  // Member Register fields
  const [memFirstName, setMemFirstName] = useState('');
  const [memMiddleName, setMemMiddleName] = useState('');
  const [memLastName, setMemLastName] = useState('');
  const [memGender, setMemGender] = useState('Male');
  const [memBirthdate, setMemBirthdate] = useState('1988-05-12');
  const [memPhone, setMemPhone] = useState('+63 917 ');
  const [memEmail, setMemEmail] = useState('');
  const [memAddress, setMemAddress] = useState('Poblacion, Victoria, Tarlac');
  const [memBranchId, setMemBranchId] = useState('branch_tar');
  const [memTypeId, setMemTypeId] = useState('mt_regular');
  const [memFarmHectares, setMemFarmHectares] = useState('2.5');
  const [memPrimaryCrop, setMemPrimaryCrop] = useState('Rice & Organic Vegetables');
  const [memPassword, setMemPassword] = useState('123456');

  // Fetch branches, roles, and member types for dropdowns
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [bRes, rRes, mRes] = await Promise.all([
          api.getBranches(),
          api.getUserRoles(),
          api.getMemberTypes()
        ]);
        if (bRes?.data) setBranches(bRes.data);
        if (rRes?.data) setRoles(rRes.data);
        if (mRes?.data) setMemberTypes(mRes.data);
      } catch (err) {
        console.error('Failed to load portal metadata:', err);
      }
    };
    loadMetadata();
  }, []);

  const handleStaffLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.login({
        username: staffIdentifier.includes('@') ? undefined : staffIdentifier,
        email: staffIdentifier.includes('@') ? staffIdentifier : undefined,
        password: staffPassword
      });

      if (res.success && res.data?.user) {
        setSuccessMessage(`Welcome back, ${res.data.user.name}! Accessing management dashboard...`);
        setTimeout(() => {
          onSuccess({
            type: 'staff',
            user: res.data.user,
            token: res.data.token
          });
        }, 300);
      } else {
        setErrorMessage(res.message || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to the cooperative server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStaffRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!staffFullName || !staffRegUsername || !staffRegEmail || !staffRegPassword) {
      setErrorMessage('Please fill in all required fields.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.register({
        full_name: staffFullName,
        username: staffRegUsername,
        email: staffRegEmail,
        password: staffRegPassword,
        role_id: staffRegRoleId,
        branch_id: staffRegBranchId
      });

      if (res.success && res.data) {
        setSuccessMessage('Staff account created successfully! Signing in...');
        setTimeout(() => {
          onSuccess({
            type: 'staff',
            user: res.data,
            token: `token_${Date.now()}`
          });
        }, 400);
      } else {
        setErrorMessage(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred during staff registration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await api.memberLogin({
        identifier: memberIdentifier,
        password: memberPassword
      });

      if (res.success && res.data?.member) {
        setSuccessMessage(`Welcome back, ${res.data.member.first_name}! Loading your Member Dashboard...`);
        setTimeout(() => {
          onSuccess({
            type: 'member',
            member: res.data.member,
            token: res.data.token
          });
        }, 300);
      } else {
        setErrorMessage(res.message || 'Member account not found. Please verify your Member Number.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error connecting to cooperative member services.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMemberRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    if (!memFirstName || !memLastName || !memPhone) {
      setErrorMessage('First name, last name, and contact phone are required.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.memberRegister({
        first_name: memFirstName,
        middle_name: memMiddleName,
        last_name: memLastName,
        gender: memGender,
        birthdate: memBirthdate,
        phone: memPhone,
        email: memEmail,
        address: memAddress,
        branch_id: memBranchId,
        member_type_id: memTypeId,
        custom_field_values: {
          farm_hectares: Number(memFarmHectares) || 0,
          primary_crop: memPrimaryCrop
        },
        password: memPassword
      });

      if (res.success && res.data?.member) {
        setSuccessMessage(`Welcome to Mayap Care Cooperative! Your Member No. is ${res.data.member.member_no}. Opening your dashboard...`);
        setTimeout(() => {
          onSuccess({
            type: 'member',
            member: res.data.member,
            token: res.data.token
          });
        }, 500);
      } else {
        setErrorMessage(res.message || 'Member enrollment failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error submitting membership registration.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Staff Logins
  const quickStaffLogin = (userRole: string, username: string) => {
    setStaffIdentifier(username);
    setStaffPassword('Admin@123456');
    setAuthMode('login');
    setTimeout(() => {
      api.login({ username, password: 'Admin@123456' }).then((res) => {
        if (res.success && res.data?.user) {
          onSuccess({ type: 'staff', user: res.data.user, token: res.data.token });
        }
      });
    }, 50);
  };

  // Quick Member Logins
  const quickMemberLogin = (memberNo: string) => {
    setMemberIdentifier(memberNo);
    setMemberPassword('123456');
    setAuthMode('login');
    setTimeout(() => {
      api.memberLogin({ identifier: memberNo, password: '123456' }).then((res) => {
        if (res.success && res.data?.member) {
          onSuccess({ type: 'member', member: res.data.member, token: res.data.token });
        }
      });
    }, 50);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Brand Bar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/20">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Mayap Care Agriculture Coop.
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  CDA Reg. 9502-100234
                </span>
              </div>
              <p className="text-xs text-slate-400">Integrated Agricultural Credit & Financial Management System</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>CDA Compliant</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>Tarlac • Urdaneta • San Fernando • Gerona</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-xl">
          {/* Main Card */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden backdrop-blur-xl">
            {/* Dual Portal Switcher: Staff Management vs Member Portal */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-950 border-b border-slate-800 text-xs font-semibold">
              <button
                type="button"
                id="tab-portal-staff"
                onClick={() => {
                  setActivePortal('staff');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-3 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  activePortal === 'staff'
                    ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700/80 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Staff & Management</span>
              </button>

              <button
                type="button"
                id="tab-portal-member"
                onClick={() => {
                  setActivePortal('member');
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className={`py-3 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  activePortal === 'member'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Member Portal</span>
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                  New
                </span>
              </button>
            </div>

            {/* Portal Header & Sub-Tabs */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-800/60 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center space-x-2">
                  <span>
                    {activePortal === 'staff' ? 'Staff Core Access' : 'Cooperative Member Portal'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activePortal === 'staff'
                    ? 'Official sign in for loan officers, cashiers, auditors & managers.'
                    : 'View your loans, deposits, share capital, passbook and schedules.'}
                </p>
              </div>

              {/* Toggle Login vs Register */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  id="auth-mode-login"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    authMode === 'login'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  id="auth-mode-register"
                  onClick={() => {
                    setAuthMode('register');
                    setErrorMessage('');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                    authMode === 'register'
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            {/* Notifications */}
            {errorMessage && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center space-x-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* FORM BODY */}
            <div className="p-6">
              {/* ---------------------------------------------------- */}
              {/* STAFF PORTAL LOGIN */}
              {/* ---------------------------------------------------- */}
              {activePortal === 'staff' && authMode === 'login' && (
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Staff Username or Email
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="staff-login-username"
                        type="text"
                        value={staffIdentifier}
                        onChange={(e) => setStaffIdentifier(e.target.value)}
                        placeholder="e.g. admin or loan_officer"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Password
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Demo: <code className="text-emerald-400 font-mono">Admin@123456</code>
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="staff-login-password"
                        type="password"
                        value={staffPassword}
                        onChange={(e) => setStaffPassword(e.target.value)}
                        placeholder="Enter your password"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-submit-staff-login"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Enter Staff Core Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* 1-Click Demo Staff Role Selector */}
                  <div className="pt-4 border-t border-slate-800/80">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Quick Demo Role Access (1-Click Sign In):
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={() => quickStaffLogin('role_admin', 'admin')}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center space-x-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-200">Admin</p>
                          <p className="text-[10px] text-slate-400">admin</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickStaffLogin('role_loan_officer', 'loan_officer')}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center space-x-2 cursor-pointer"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-200">Loan Officer</p>
                          <p className="text-[10px] text-slate-400">loan_officer</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => quickStaffLogin('role_teller', 'teller')}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition flex items-center space-x-2 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <div className="truncate">
                          <p className="font-semibold text-slate-200">Cashier / Teller</p>
                          <p className="text-[10px] text-slate-400">teller</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ---------------------------------------------------- */}
              {/* STAFF PORTAL REGISTRATION */}
              {/* ---------------------------------------------------- */}
              {activePortal === 'staff' && authMode === 'register' && (
                <form onSubmit={handleStaffRegister} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={staffFullName}
                        onChange={(e) => setStaffFullName(e.target.value)}
                        placeholder="e.g. Maria Clara Santos"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={staffRegUsername}
                        onChange={(e) => setStaffRegUsername(e.target.value)}
                        placeholder="e.g. msantos"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={staffRegEmail}
                        onChange={(e) => setStaffRegEmail(e.target.value)}
                        placeholder="e.g. msantos@coopflex.ph"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={staffRegPassword}
                        onChange={(e) => setStaffRegPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Assigned Role
                      </label>
                      <select
                        value={staffRegRoleId}
                        onChange={(e) => setStaffRegRoleId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {roles.length > 0 ? (
                          roles.map((r) => (
                            <option key={r.id} value={r.id} className="bg-slate-900">
                              {r.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="role_loan_officer">Loan Officer</option>
                            <option value="role_teller">Cashier / Teller</option>
                            <option value="role_auditor">Internal Auditor</option>
                            <option value="role_general_manager">General Manager</option>
                            <option value="role_admin">System Administrator</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Branch Assignment
                      </label>
                      <select
                        value={staffRegBranchId}
                        onChange={(e) => setStaffRegBranchId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {branches.length > 0 ? (
                          branches.map((b) => (
                            <option key={b.id} value={b.id} className="bg-slate-900">
                              {b.name} ({b.code})
                            </option>
                          ))
                        ) : (
                          <option value="branch_tar">Tarlac Main Branch (TAR)</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Create Staff Account</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ---------------------------------------------------- */}
              {/* MEMBER PORTAL LOGIN */}
              {/* ---------------------------------------------------- */}
              {activePortal === 'member' && authMode === 'login' && (
                <form onSubmit={handleMemberLogin} className="space-y-4">
                  <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-3 text-xs text-emerald-200/90 flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-300">Cooperative Member Self-Service</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Access your loan amortization schedules, savings ledger, capital build-up (CBU), and official receipts anytime.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Member Number, Phone, or Email
                    </label>
                    <div className="relative">
                      <FileCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="member-login-identifier"
                        type="text"
                        value={memberIdentifier}
                        onChange={(e) => setMemberIdentifier(e.target.value)}
                        placeholder="e.g. MEM-2026-0001 or juan.delacruz@tar-agri.ph"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        Password or PIN
                      </label>
                      <span className="text-[11px] text-slate-500">
                        Default Demo PIN: <code className="text-emerald-400 font-mono">123456</code>
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        id="member-login-password"
                        type="password"
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        placeholder="Enter password (default 123456)"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <button
                    id="btn-submit-member-login"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950/50 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Sign In to Member Dashboard</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* 1-Click Quick Member Selector */}
                  <div className="hide pt-4 border-t border-slate-800/80">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Select Sample Cooperative Member (1-Click Test):
                    </p>
                    <div className="space-y-2 text-xs">
                      <button
                        type="button"
                        id="quick-member-juan"
                        onClick={() => quickMemberLogin('MEM-2026-0001')}
                        className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-600/50 transition flex items-center justify-between text-left cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-xs">
                            JD
                          </div>
                          <div>
                            <p className="font-bold text-slate-200 group-hover:text-white">Juan Dela Cruz</p>
                            <p className="text-[11px] text-slate-400">MEM-2026-0001 • Agri Member (Rice & Corn)</p>
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold">
                          Active Loan & Savings
                        </span>
                      </button>

                      <button
                        type="button"
                        id="quick-member-maria"
                        onClick={() => quickMemberLogin('MB-2026-0002')}
                        className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-600/50 transition flex items-center justify-between text-left cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-xs">
                            MS
                          </div>
                          <div>
                            <p className="font-bold text-slate-200 group-hover:text-white">Maria Santos Reyes</p>
                            <p className="text-[11px] text-slate-400">MB-2026-0002 • Organic Vegetables</p>
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-teal-500/20 text-teal-300 font-semibold">
                          Regular Loan & CBU
                        </span>
                      </button>

                      <button
                        type="button"
                        id="quick-member-rodrigo"
                        onClick={() => quickMemberLogin('MB-2026-0003')}
                        className="w-full p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-600/50 transition flex items-center justify-between text-left cursor-pointer group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-xs">
                            RM
                          </div>
                          <div>
                            <p className="font-bold text-slate-200 group-hover:text-white">Rodrigo Mendoza</p>
                            <p className="text-[11px] text-slate-400">MB-2026-0003 • Agri-Farm Supplies</p>
                          </div>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 font-semibold">
                          Emergency Loan & CBU
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* ---------------------------------------------------- */}
              {/* MEMBER PORTAL REGISTRATION */}
              {/* ---------------------------------------------------- */}
              {activePortal === 'member' && authMode === 'register' && (
                <form onSubmit={handleMemberRegister} className="space-y-3.5">
                  <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
                    <p className="font-semibold text-emerald-300">New Member Online Application</p>
                    <p className="text-[11px] text-slate-300">
                      Instantly generates your cooperative Member Number and provisions your CBU and Savings passbook.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                      <input
                        type="text"
                        value={memFirstName}
                        onChange={(e) => setMemFirstName(e.target.value)}
                        placeholder="First Name"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Middle Name</label>
                      <input
                        type="text"
                        value={memMiddleName}
                        onChange={(e) => setMemMiddleName(e.target.value)}
                        placeholder="Middle Name"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={memLastName}
                        onChange={(e) => setMemLastName(e.target.value)}
                        placeholder="Last Name"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Mobile / Phone *</label>
                      <input
                        type="text"
                        value={memPhone}
                        onChange={(e) => setMemPhone(e.target.value)}
                        placeholder="+63 9XX XXX XXXX"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={memEmail}
                        onChange={(e) => setMemEmail(e.target.value)}
                        placeholder="Optional"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Branch</label>
                      <select
                        value={memBranchId}
                        onChange={(e) => setMemBranchId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {branches.length > 0 ? (
                          branches.map((b) => (
                            <option key={b.id} value={b.id} className="bg-slate-900">
                              {b.name}
                            </option>
                          ))
                        ) : (
                          <option value="branch_tar">Tarlac Main Branch</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Membership Type</label>
                      <select
                        value={memTypeId}
                        onChange={(e) => setMemTypeId(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {memberTypes.length > 0 ? (
                          memberTypes.map((t) => (
                            <option key={t.id} value={t.id} className="bg-slate-900">
                              {t.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="mt_regular">Regular Agricultural Member</option>
                            <option value="mt_associate">Associate Micro-Entrepreneur</option>
                            <option value="mt_lab">Laboratory / Youth Member</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Farm Land (Hectares)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={memFarmHectares}
                        onChange={(e) => setMemFarmHectares(e.target.value)}
                        placeholder="e.g. 2.5"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Crops / Business</label>
                      <input
                        type="text"
                        value={memPrimaryCrop}
                        onChange={(e) => setMemPrimaryCrop(e.target.value)}
                        placeholder="e.g. Palay / Corn / Vegetables"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Residential Address</label>
                      <input
                        type="text"
                        value={memAddress}
                        onChange={(e) => setMemAddress(e.target.value)}
                        placeholder="Barangay, Municipality, Province"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Password for Online Portal</label>
                      <input
                        type="password"
                        value={memPassword}
                        onChange={(e) => setMemPassword(e.target.value)}
                        placeholder="Create a password"
                        required
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Submit Registration & Enter Dashboard</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center mt-6 text-xs text-slate-500">
            Mayap Care Agriculture Cooperative Core System • CDA Compliant • Automated Ledger Engine
          </div>
        </div>
      </main>
    </div>
  );
};
