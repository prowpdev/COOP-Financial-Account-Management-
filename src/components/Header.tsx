import React, { useState, useEffect } from 'react';
import {
  Building2,
  RefreshCw,
  CheckCircle2,
  UserCircle,
  MapPin,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Type,
  Server,
  ExternalLink,
  Check,
  X,
  Database
} from 'lucide-react';
import { Branch, User } from '../types';
import { getApiBase, setApiBase, DEFAULT_API_BASE } from '../services/api';
import { SqlSchemaModal } from './common/SqlSchemaModal';

interface HeaderProps {
  cooperativeName: string;
  branches: Branch[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenVerification: () => void;
  onResetSeed: () => void;
  isResetting: boolean;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isLargeText?: boolean;
  onToggleTextSize?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cooperativeName,
  branches,
  selectedBranchId,
  onSelectBranch,
  currentUser,
  users,
  onSwitchUser,
  onOpenVerification,
  onResetSeed,
  isResetting,
  isSidebarCollapsed = false,
  onToggleSidebar,
  theme = 'dark',
  onToggleTheme,
  isLargeText = false,
  onToggleTextSize
}) => {
  const [apiEndpoint, setApiEndpointState] = useState(getApiBase());
  const [showApiModal, setShowApiModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [customEndpointInput, setCustomEndpointInput] = useState(getApiBase());
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    const handleEndpointChange = (e: any) => {
      setApiEndpointState(e.detail || getApiBase());
    };
    window.addEventListener('coop:api-endpoint-changed', handleEndpointChange);
    return () => window.removeEventListener('coop:api-endpoint-changed', handleEndpointChange);
  }, []);

  const handleSaveEndpoint = () => {
    setApiBase(customEndpointInput);
    setApiEndpointState(customEndpointInput);
    setIsSavedNotice(true);
    setTimeout(() => {
      setIsSavedNotice(false);
      setShowApiModal(false);
    }, 1500);
  };
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand & Organization */}
          <div className="flex items-center space-x-3 min-w-0">
            {/* Sidebar Collapse Toggle Button */}
            {onToggleSidebar && (
              <button
                id="btn-toggle-sidebar"
                onClick={onToggleSidebar}
                title={isSidebarCollapsed ? 'Expand sidebar navigation' : 'Collapse sidebar navigation'}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shrink-0"
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-emerald-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-300" />
                )}
              </button>
            )}

            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/30 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-bold text-base tracking-tight text-white truncate">
                  {cooperativeName || 'Mayap Care Agriculture Coop.'}
                </span>
                <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 shrink-0">
                  Agri-Coop Core
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium truncate">CDA Reg. No. CDA-REG-9502-100234 • Agriculture & Multi-Purpose</p>
            </div>
          </div>

          {/* Quick Controls: Branch Selector, Role Switcher, Accessibility & Compliance */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {/* Branch Switcher */}
            <div className="flex items-center bg-slate-800/90 rounded-xl px-2.5 py-1.5 border border-slate-700">
              <MapPin className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
              <select
                id="branch-selector"
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="all" className="bg-slate-800 text-slate-200">All Branches (Consolidated)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="bg-slate-800 text-slate-200">
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Persona / User Switcher */}
            <div className="hidden lg:flex items-center bg-slate-800/90 rounded-xl px-2.5 py-1.5 border border-slate-700">
              <UserCircle className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
              <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Role:</span>
              <select
                id="user-role-switcher"
                value={currentUser.id}
                onChange={(e) => {
                  const u = users.find(user => user.id === e.target.value);
                  if (u) onSwitchUser(u);
                }}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-800 text-slate-200">
                    {u.name} ({u.role_name})
                  </option>
                ))}
              </select>
            </div>

            {/* PHP MVC API Endpoint Pill */}
            <button
              id="api-endpoint-pill"
              onClick={() => {
                setCustomEndpointInput(apiEndpoint);
                setShowApiModal(true);
              }}
              title="Click to view or edit API endpoint"
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-[11px] text-emerald-300 truncate max-w-[130px]">
                {apiEndpoint.replace(/^https?:\/\//, '')}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>

            {/* SQL Schema & PHP MVC Guide Button */}
            <button
              id="btn-sql-schema"
              onClick={() => setShowSqlModal(true)}
              title="View SQL Schema & PHP MVC Backend Guide"
              className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-[11px] text-slate-200">Database (SQL)</span>
            </button>

            {/* Text Size Accessibility Toggle (Feature 3) */}
            {onToggleTextSize && (
              <button
                id="btn-toggle-text-size"
                onClick={onToggleTextSize}
                title={isLargeText ? 'Switch to Standard text size' : 'Increase text size (Accessible mode)'}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              >
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold">{isLargeText ? 'A⁺ Large' : 'A Normal'}</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle (Feature 1) */}
            {onToggleTheme && (
              <button
                id="btn-toggle-theme"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-400" />
                )}
              </button>
            )}

            {/* 15 Criteria Verification Button */}
            <button
              id="open-verification-btn"
              onClick={onOpenVerification}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span className="hidden md:inline">15 Criteria</span>
              <span className="bg-emerald-700 text-emerald-100 text-xs px-1.5 py-0.2 rounded-full font-bold">15/15</span>
            </button>

            {/* Reset Database Button */}
            <button
              id="reset-seed-btn"
              onClick={onResetSeed}
              disabled={isResetting}
              title="Reset database to clean seed"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* API Endpoint Configuration Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">PHP MVC Backend Endpoint</h3>
                  <p className="text-xs text-slate-400">Cooperative API Connection Manager</p>
                </div>
              </div>
              <button
                onClick={() => setShowApiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Your cooperative data layer is configured to communicate with the PHP MVC backend:
              </p>
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Active API Endpoint URL
                </label>
                <input
                  type="text"
                  value={customEndpointInput}
                  onChange={(e) => setCustomEndpointInput(e.target.value)}
                  placeholder="http://cooperative-api.test/api"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Configured Target: http://cooperative-api.test/api</span>
                </div>
                <p>
                  • In local dev (Laragon/Valet/Apache), calls connect directly to your PHP MVC server.
                </p>
                <p>
                  • In Cloud Sandbox preview where local domains cannot be routed, seamless fallback keeps all views operational.
                </p>
              </div>

              {isSavedNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 flex items-center space-x-2 text-xs">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>API endpoint updated successfully!</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCustomEndpointInput(DEFAULT_API_BASE)}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Reset to Default ({DEFAULT_API_BASE})
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowApiModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveEndpoint}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow transition cursor-pointer"
                >
                  Save Endpoint
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* SQL Schema & PHP MVC Guide Modal */}
      <SqlSchemaModal
        isOpen={showSqlModal}
        onClose={() => setShowSqlModal(false)}
      />
    </header>
  );
};

