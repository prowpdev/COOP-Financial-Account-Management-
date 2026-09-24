import React, { useState, useEffect, useRef } from 'react';
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
  Database,
  Wand2,
  LogIn,
  MoreVertical,
  Layers,
  Sparkles
} from 'lucide-react';
import { Branch, User } from '../types';
import { getApiBase, setApiBase, DEFAULT_API_BASE, api } from '../services/api';
import { SqlSchemaModal } from './common/SqlSchemaModal';
import { NotificationBell } from './common/NotificationBell';
import { TabKey } from './Sidebar';

import Notice from './Notice';
import { useNotice } from './useNotice';

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
  isOpenMobileSidebar?: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  isLargeText?: boolean;
  onToggleTextSize?: () => void;
  onOpenSetupWizard?: () => void;
  onOpenAuthModal?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
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
  isResetting: isResettingProp = false,
  isSidebarCollapsed = false,
  onToggleSidebar,
  isOpenMobileSidebar = false,
  theme = 'dark',
  onToggleTheme,
  isLargeText = false,
  onToggleTextSize,
  onOpenSetupWizard,
  onOpenAuthModal,
  onLogout,
  onNavigateTab
}) => {
  const [apiEndpoint, setApiEndpointState] = useState(getApiBase());
  const [showApiModal, setShowApiModal] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [customEndpointInput, setCustomEndpointInput] = useState(getApiBase());
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [usersState, setUsersState] = useState(users);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const {
    notice,
    showNotice,
    hideNotice,
  } = useNotice();

  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const populateUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsersState(res.data || []);
    } catch (e) {
      console.error('Failed to populate users:', e);
    }
  };

  useEffect(() => {
    populateUsers();
  }, []);

  useEffect(() => {
    const handleEndpointChange = (e: any) => {
      setApiEndpointState(e.detail || getApiBase());
    };
    window.addEventListener('coop:api-endpoint-changed', handleEndpointChange);
    return () => window.removeEventListener('coop:api-endpoint-changed', handleEndpointChange);
  }, []);

  // Close mobile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMobileMenu]);

  const handleSeedDatabase = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    setShowMobileMenu(false);
    try {
      await api.LoadSeeders();
      showNotice('Sample cooperative database seeded successfully with members, loans, savings, and balanced journals!', 'success');
      await populateUsers();
      window.dispatchEvent(new Event('coop:data-changed'));
    } catch (error: any) {
      showNotice(
        error?.message || 'Failed to seed database.',
        'error'
      );
    } finally {
      setIsSeeding(false);
    }
  };

  const handleResetSeedDatabase = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setShowMobileMenu(false);
    try {
      await api.ResetSeeders();
      showNotice('Database reset successfully to baseline CDA chart of accounts and settings.', 'success');
      await populateUsers();
      window.dispatchEvent(new Event('coop:data-changed'));
    } catch (error: any) {
      showNotice(
        error?.message || 'Failed to reset database.',
        'error'
      );
    } finally {
      setIsResetting(false);
    }
  };

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
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
      {notice && (
        <Notice
          message={notice.message}
          type={notice.type}
          onClose={hideNotice}
          reload={true}
        />
      )}
      <div className="max-w-[1720px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          {/* Brand & Sidebar Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* Sidebar Toggle Button (works on both mobile drawer and desktop collapse) */}
            {onToggleSidebar && (
              <button
                id="btn-toggle-sidebar"
                onClick={onToggleSidebar}
                title={isSidebarCollapsed || !isOpenMobileSidebar ? 'Open/Expand navigation menu' : 'Close/Collapse navigation menu'}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer shrink-0"
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-emerald-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-300" />
                )}
              </button>
            )}

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/30 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="truncate">
              <div className="flex items-center space-x-2 truncate">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white truncate">
                  {cooperativeName || 'Agri-Coop Multipurpose'}
                </span>
                <span className="hidden lg:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 shrink-0">
                  Agri-Coop Core
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 font-medium truncate">
                CDA Reg. No. CDA-REG-9502-100234 • Agriculture & Multi-Purpose
              </p>
            </div>
          </div>

          {/* Right Controls: Branch Selector, Notification Bell & Actions */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Branch Switcher (Responsive) */}
            <div className="flex items-center bg-slate-800/90 rounded-xl px-2 sm:px-2.5 py-1.5 border border-slate-700 max-w-[140px] sm:max-w-none">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 mr-1 sm:mr-1.5 shrink-0" />
              <select
                id="branch-selector"
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer pr-1 truncate"
              >
                <option value="all" className="bg-slate-800 text-slate-200">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id} className="bg-slate-800 text-slate-200">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Persona / User Switcher (Hidden on small screens, accessible in mobile menu) */}
            <div className="hidden lg:flex items-center bg-slate-800/90 rounded-xl px-2.5 py-1.5 border border-slate-700">
              <UserCircle className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
              <span className="text-xs text-slate-400 mr-1 hidden xl:inline">Role:</span>
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
                    {u.username} ({u.role_id})
                  </option>
                ))}
              </select>
            </div>

            {/* Notification Bell Icon for Loan Applications & Interest Alerts */}
            <NotificationBell onNavigateTab={onNavigateTab} />

            {/* Desktop Buttons */}
            {/* Seed Database (Desktop) */}
            <button
              id="btn-populate-sample-data"
              disabled={isSeeding || isResetting}
              onClick={() => handleSeedDatabase()}
              className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer text-xs disabled:opacity-50"
            >
              <Server className={`w-3.5 h-3.5 text-emerald-400 ${isSeeding ? 'animate-spin' : ''}`} />
              <span className="font-mono text-[11px] text-emerald-300 truncate max-w-[120px]">
                {isSeeding ? 'Seeding...' : 'Populate Sample'}
              </span>
            </button>

            {/* Setup Wizard Button (Desktop) */}
            {onOpenSetupWizard && (
              <button
                id="open-setup-wizard-btn"
                onClick={onOpenSetupWizard}
                title="System Setup Wizard & Data Reset Center"
                className="hidden md:flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-emerald-200" />
                <span>Setup Wizard</span>
              </button>
            )}

            {/* 15 Criteria Verification Button (Desktop) */}
            <button
              id="open-verification-btn"
              onClick={onOpenVerification}
              className="hidden lg:flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span className="hidden xl:inline">15 Criteria</span>
              <span className="bg-emerald-700 text-emerald-100 text-xs px-1.5 py-0.2 rounded-full font-bold">15/15</span>
            </button>

            {/* Text Size Accessibility Toggle */}
            {onToggleTextSize && (
              <button
                id="btn-toggle-text-size"
                onClick={onToggleTextSize}
                title={isLargeText ? 'Switch to Standard text size' : 'Increase text size (Accessible mode)'}
                className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              >
                <Type className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-semibold">{isLargeText ? 'A⁺' : 'A'}</span>
              </button>
            )}

            {/* Dark / Light Mode Toggle */}
            {onToggleTheme && (
              <button
                id="btn-toggle-theme"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
                className="hidden sm:flex p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-blue-400" />
                )}
              </button>
            )}

            {/* Sign Out (Desktop) */}
            {onLogout && (
              <button
                id="btn-header-logout"
                onClick={onLogout}
                title="Sign out of system"
                className="hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800/50 transition cursor-pointer text-xs"
              >
                <LogIn className="w-3.5 h-3.5 rotate-180" />
                <span>Sign Out</span>
              </button>
            )}

            {/* Refresh / Reload App */}
            <button
              id="reset-seed-btn"
              onClick={onResetSeed}
              disabled={isResetting}
              title="Reload the app"
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Mobile "More" Menu Toggle Button (< md / < lg) */}
            <div className="relative" ref={mobileMenuRef}>
              <button
                id="btn-header-mobile-more"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                title="More actions and settings"
                className="md:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Mobile Dropdown Menu */}
              {showMobileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Role Switcher in Mobile */}
                  <div className="p-2 bg-slate-800/80 rounded-xl mb-1">
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mb-1">
                      <UserCircle className="w-4 h-4 text-blue-400" />
                      <span>Active Role / User:</span>
                    </div>
                    <select
                      value={currentUser.id}
                      onChange={(e) => {
                        const u = users.find(user => user.id === e.target.value);
                        if (u) {
                          onSwitchUser(u);
                          setShowMobileMenu(false);
                        }
                      }}
                      className="w-full bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded-lg p-1.5 focus:outline-none"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.role_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Setup Wizard */}
                  {onOpenSetupWizard && (
                    <button
                      onClick={() => {
                        onOpenSetupWizard();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-slate-800 text-left cursor-pointer"
                    >
                      <Wand2 className="w-4 h-4 text-emerald-400" />
                      <span>Setup Wizard</span>
                    </button>
                  )}

                  {/* 15 Criteria */}
                  <button
                    onClick={() => {
                      onOpenVerification();
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-800 cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>15 Criteria Tests</span>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">15/15</span>
                  </button>

                  {/* Dark/Light mode on mobile */}
                  {onToggleTheme && (
                    <button
                      onClick={() => {
                        onToggleTheme();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
                      <span>{theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                    </button>
                  )}

                  {/* Text Size Accessibility */}
                  {onToggleTextSize && (
                    <button
                      onClick={() => {
                        onToggleTextSize();
                        setShowMobileMenu(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                    >
                      <Type className="w-4 h-4 text-amber-400" />
                      <span>{isLargeText ? 'Standard Font Size' : 'Accessible Large Font Size'}</span>
                    </button>
                  )}

                  {/* Populate Sample Data */}
                  <button
                    onClick={handleSeedDatabase}
                    disabled={isSeeding || isResetting}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-emerald-300 hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span>Populate Sample Data</span>
                  </button>

                  {/* Reset Database */}
                  <button
                    onClick={handleResetSeedDatabase}
                    disabled={isSeeding || isResetting}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-slate-800 cursor-pointer disabled:opacity-50"
                  >
                    <Server className="w-4 h-4 text-rose-400" />
                    <span>Reset Database to Baseline</span>
                  </button>

                  {/* SQL Schema Guide */}
                  <button
                    onClick={() => {
                      setShowSqlModal(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 cursor-pointer"
                  >
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Database (SQL Schema)</span>
                  </button>

                  {/* Sign Out */}
                  {onLogout && (
                    <button
                      onClick={() => {
                        setShowMobileMenu(false);
                        onLogout();
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-950/40 cursor-pointer border-t border-slate-800 mt-1 pt-2"
                    >
                      <LogIn className="w-4 h-4 rotate-180 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  )}
                </div>
              )}
            </div>
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
                  placeholder="/api"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-slate-800/70 p-3 rounded-xl border border-slate-700/60 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                  <Check className="w-3.5 h-3.5" />
                  <span>Active Endpoint: {apiEndpoint}</span>
                </div>
                <p>
                  • Default <code className="text-emerald-300 font-mono">/api</code> connects directly to the built-in cooperative backend.
                </p>
                <p>
                  • For external PHP MVC servers (e.g. Laragon/Valet), you can specify your custom URL (e.g. <code className="text-slate-300 font-mono">http://localhost:8000/api</code>).
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


