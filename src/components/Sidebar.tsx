import React from 'react';
import {
  LayoutDashboard,
  Settings2,
  Users,
  CreditCard,
  PiggyBank,
  Coins,
  BookOpen,
  BarChart3,
  CheckCircle,
  FileSpreadsheet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  X
} from 'lucide-react';
import { FeatureToggle } from '../types';

export type TabKey =
  | 'dashboard'
  | 'configuration'
  | 'excel_workbench'
  | 'members'
  | 'loans'
  | 'savings'
  | 'share_capital'
  | 'accounting'
  | 'reports'
  | 'audit_logs'
  | 'verification';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  featureToggles: FeatureToggle[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenMemberPortal?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  featureToggles,
  isCollapsed = false,
  onToggleCollapse,
  onOpenMemberPortal,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const isFeatureEnabled = (key: string) => {
    const feat = featureToggles.find(f => f.key === key);
    return feat ? feat.enabled : true;
  };

  const navItems = [
    {
      id: 'dashboard' as TabKey,
      label: 'Executive Dashboard',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      alwaysShow: true
    },
    {
      id: 'configuration' as TabKey,
      label: 'System Configuration',
      shortLabel: 'Config',
      icon: Settings2,
      badge: 'Core',
      alwaysShow: true
    },
    {
      id: 'excel_workbench' as TabKey,
      label: 'Excel Grid Workbench',
      shortLabel: 'Excel',
      icon: FileSpreadsheet,
      badge: 'Grid',
      alwaysShow: true
    },
    {
      id: 'members' as TabKey,
      label: 'Member Registry',
      shortLabel: 'Members',
      icon: Users,
      alwaysShow: true
    },
    {
      id: 'loans' as TabKey,
      label: 'Loans & Credit Facility',
      shortLabel: 'Loans',
      icon: CreditCard,
      featureKey: 'feature_loans'
    },
    {
      id: 'savings' as TabKey,
      label: 'Savings & Deposits',
      shortLabel: 'Savings',
      icon: PiggyBank,
      featureKey: 'feature_savings'
    },
    {
      id: 'share_capital' as TabKey,
      label: 'Share Capital (CBU)',
      shortLabel: 'Capital',
      icon: Coins,
      featureKey: 'feature_share_capital'
    },
    {
      id: 'accounting' as TabKey,
      label: 'Books of Accounts & General Ledger',
      shortLabel: 'Journals & GL',
      icon: BookOpen,
      featureKey: 'feature_accounting'
    },
    {
      id: 'reports' as TabKey,
      label: 'Financial Statements',
      shortLabel: 'Reports',
      icon: BarChart3,
      featureKey: 'feature_reports'
    },
    {
      id: 'audit_logs' as TabKey,
      label: 'Audit Logs',
      shortLabel: 'Audit Logs',
      icon: ShieldCheck,
      badge: 'CDA',
      alwaysShow: true
    },
    {
      id: 'verification' as TabKey,
      label: 'Flexibility Test Suite',
      shortLabel: '15 Tests',
      icon: CheckCircle,
      badge: '15/15',
      alwaysShow: true
    }
  ];

  const visibleItems = navItems.filter(item => {
    if (item.alwaysShow) return true;
    if (item.featureKey) return isFeatureEnabled(item.featureKey);
    return true;
  });

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-0
          transition-all duration-300 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0
          h-full md:min-h-[calc(100vh-4rem)]
          ${isCollapsed ? 'md:w-20' : 'md:w-64'}
          w-72 md:w-auto
          ${isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar Header with Collapse / Expand Toggle & Mobile Close */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {!isCollapsed && (
              <p className="px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Coop Modules
              </p>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {/* Desktop collapse button */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar'}
                className={`hidden md:block p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer ${
                  isCollapsed ? 'mx-auto' : ''
                }`}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-emerald-400" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Mobile close drawer button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                title="Close menu"
                className="md:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="p-2.5 space-y-1 overflow-y-auto flex-1">
          {/* Dedicated Member Portal Navigation Entry (Relocated to Sidebar) */}
          {onOpenMemberPortal && (
            <div className="mb-2.5 pb-2 border-b border-slate-800/80">
              <button
                id="sidebar-btn-member-portal"
                onClick={() => {
                  onOpenMemberPortal();
                  if (onCloseMobile) onCloseMobile();
                }}
                title={isCollapsed ? 'Member Portal (Self-Service Dashboard & Passbook)' : undefined}
                className={`w-full flex items-center rounded-xl font-semibold transition cursor-pointer group ${
                  isCollapsed
                    ? 'justify-center p-3 bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'justify-between px-3 py-2.5 bg-gradient-to-r from-emerald-950/80 to-teal-950/80 hover:from-emerald-900 hover:to-teal-900 text-emerald-200 border border-emerald-500/40 shadow-sm'
                }`}
              >
                <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition shrink-0">
                    <UserCircle className="w-4 h-4 text-emerald-300" />
                  </div>
                  {!isCollapsed && (
                    <div className="text-left truncate">
                      <div className="text-sm font-bold text-white group-hover:text-emerald-200 tracking-tight flex items-center space-x-1.5 truncate">
                        <span>Member Portal</span>
                      </div>
                      <p className="text-[10px] text-emerald-400 font-medium truncate">
                        Passbook, Loans, Savings & Calculator
                      </p>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-500/40 uppercase tracking-wider shrink-0">
                    Portal
                  </span>
                )}
              </button>
            </div>
          )}

          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                title={isCollapsed ? item.label : undefined}
                className={`sidebar-menu-btn w-full flex items-center rounded-xl text-sm font-medium transition cursor-pointer ${
                  isCollapsed
                    ? 'justify-center p-3'
                    : 'justify-between px-3 py-2.5'
                } ${
                  isActive
                    ? 'sidebar-nav-active bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'sidebar-nav-item text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className={`flex items-center truncate ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'sidebar-icon-active text-emerald-400' : 'sidebar-icon text-slate-400'}`} />
                  {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-tight shrink-0 ${
                    isActive ? 'sidebar-badge-active bg-emerald-500/30 text-emerald-200' : 'sidebar-badge bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info Box */}
        <div className="mt-auto p-3 border-t border-slate-800">
          {isCollapsed ? (
            <div className="flex justify-center" title="Zero Code-Change Architecture">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
          ) : (
            <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Zero Code-Change Architecture</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Business rules, GL mappings, rates & workflows dynamically maintained in database.
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

