import React from 'react';
import { Building2, ShieldCheck, RefreshCw, CheckCircle2, UserCircle, MapPin } from 'lucide-react';
import { Branch, User } from '../types';

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
  isResetting
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Organization */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-900/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">{cooperativeName || 'Cooperative Core'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                  Config-Driven Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">CDA Reg. No. CDA-REG-9502-100234</p>
            </div>
          </div>

          {/* Quick Controls: Branch Selector, Role Switcher, Compliance Button */}
          <div className="flex items-center space-x-3">
            {/* Branch Switcher */}
            <div className="flex items-center bg-slate-800/90 rounded-lg px-2.5 py-1.5 border border-slate-700">
              <MapPin className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
              <select
                id="branch-selector"
                value={selectedBranchId}
                onChange={(e) => onSelectBranch(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
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
            <div className="flex items-center bg-slate-800/90 rounded-lg px-2.5 py-1.5 border border-slate-700">
              <UserCircle className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
              <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Role:</span>
              <select
                id="user-role-switcher"
                value={currentUser.id}
                onChange={(e) => {
                  const u = users.find(user => user.id === e.target.value);
                  if (u) onSwitchUser(u);
                }}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id} className="bg-slate-800 text-slate-200">
                    {u.name} ({u.role_name})
                  </option>
                ))}
              </select>
            </div>

            {/* 15 Criteria Verification Button */}
            <button
              id="open-verification-btn"
              onClick={onOpenVerification}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span className="hidden md:inline">15 Criteria Tests</span>
              <span className="bg-emerald-700 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold">15/15</span>
            </button>

            {/* Reset Database Button */}
            <button
              id="reset-seed-btn"
              onClick={onResetSeed}
              disabled={isResetting}
              title="Reset database to clean seed"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isResetting ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
