import React, { useState } from 'react';
import {
  X,
  UserCircle,
  LogIn,
  UserPlus,
  ShieldCheck,
  Building2,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { Branch, User } from '../../types';
import { api } from '../../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  branches: Branch[];
  onLoginSuccess: (user: User) => void;
  onUserRegistered?: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  branches,
  onLoginSuccess,
  onUserRegistered
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Login Form
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  // Register Form
  const [regForm, setRegForm] = useState({
    full_name: '',
    username: '',
    email: '',
    role_id: 'role_loan_officer',
    branch_id: branches[0]?.id || 'branch_tar',
    password: '',
    confirm_password: ''
  });

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      // Attempt API login
      const res = await api.login({
        username: loginForm.username,
        password: loginForm.password
      });

      if (res.success && res.data?.user) {
        setSuccessMessage(`Authenticated as ${res.data.user.name}`);
        onLoginSuccess(res.data.user);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        throw new Error(res.message || 'Invalid credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please verify your username and password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (regForm.password !== regForm.confirm_password) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (regForm.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.register({
        full_name: regForm.full_name,
        username: regForm.username,
        email: regForm.email,
        role_id: regForm.role_id,
        branch_id: regForm.branch_id,
        password: regForm.password
      });

      if (res.success) {
        const newUser: User = res.data;
        setSuccessMessage(`Account created for ${newUser.name}! Logging you in...`);
        if (onUserRegistered) onUserRegistered(newUser);
        onLoginSuccess(newUser);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Check if username or email is already taken.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 'role_admin', name: 'System Administrator' },
    { id: 'role_manager', name: 'General / Branch Manager' },
    { id: 'role_accountant', name: 'Chief / Branch Accountant' },
    { id: 'role_loan_officer', name: 'Credit & Loan Evaluation Officer' },
    { id: 'role_teller', name: 'Teller / Cashier' },
    { id: 'role_bod', name: 'Board of Directors' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 p-6 border-b border-slate-800 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {mode === 'login' ? 'Cooperative System Authentication' : 'Create User Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {mode === 'login'
                  ? 'Sign in to access role-governed accounting and loan modules'
                  : 'Register a cooperative staff member or loan officer'}
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 mt-5">
            <button
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New User</span>
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-4">
          {/* Notifications */}
          {errorMessage && (
            <div className="bg-red-950/60 border border-red-500/40 text-red-300 p-3 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Username or Email Address
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={loginForm.username}
                    onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                    placeholder="e.g. admin or loan.officer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="Enter account password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoading ? 'Signing In...' : 'Sign In to Cooperative Core'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={regForm.full_name}
                  onChange={e => setRegForm({ ...regForm, full_name: e.target.value })}
                  placeholder="e.g. Maria Clara Santos"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.username}
                    onChange={e => setRegForm({ ...regForm, username: e.target.value.toLowerCase().replace(/\s+/g, '.') })}
                    placeholder="e.g. maria.santos"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="maria@mayapcare.coop"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={regForm.role_id}
                    onChange={e => setRegForm({ ...regForm, role_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Assigned Branch
                  </label>
                  <select
                    value={regForm.branch_id}
                    onChange={e => setRegForm({ ...regForm, branch_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regForm.password}
                    onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    value={regForm.confirm_password}
                    onChange={e => setRegForm({ ...regForm, confirm_password: e.target.value })}
                    placeholder="Re-enter password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isLoading ? 'Creating Account...' : 'Register User & Sign In'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
