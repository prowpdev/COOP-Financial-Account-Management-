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
  FileSpreadsheet
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
  | 'verification';

interface SidebarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  featureToggles: FeatureToggle[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  featureToggles
}) => {
  const isFeatureEnabled = (key: string) => {
    const feat = featureToggles.find(f => f.key === key);
    return feat ? feat.enabled : true;
  };

  const navItems = [
    {
      id: 'dashboard' as TabKey,
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
      alwaysShow: true
    },
    {
      id: 'configuration' as TabKey,
      label: 'System Configuration',
      icon: Settings2,
      badge: 'Core Engine',
      alwaysShow: true
    },
    {
      id: 'excel_workbench' as TabKey,
      label: 'Excel Grid Workbench',
      icon: FileSpreadsheet,
      badge: 'Spreadsheet',
      alwaysShow: true
    },
    {
      id: 'members' as TabKey,
      label: 'Member Registry',
      icon: Users,
      alwaysShow: true
    },
    {
      id: 'loans' as TabKey,
      label: 'Loans & Credit Facility',
      icon: CreditCard,
      featureKey: 'feature_loans'
    },
    {
      id: 'savings' as TabKey,
      label: 'Savings & Deposits',
      icon: PiggyBank,
      featureKey: 'feature_savings'
    },
    {
      id: 'share_capital' as TabKey,
      label: 'Share Capital (CBU)',
      icon: Coins,
      featureKey: 'feature_share_capital'
    },
    {
      id: 'accounting' as TabKey,
      label: 'General Accounting & GL',
      icon: BookOpen,
      featureKey: 'feature_accounting'
    },
    {
      id: 'reports' as TabKey,
      label: 'Financial Statements',
      icon: BarChart3,
      featureKey: 'feature_reports'
    },
    {
      id: 'verification' as TabKey,
      label: 'Flexibility Test Suite',
      icon: CheckCircle,
      badge: '15 Tests',
      alwaysShow: true
    }
  ];

  const visibleItems = navItems.filter(item => {
    if (item.alwaysShow) return true;
    if (item.featureKey) return isFeatureEnabled(item.featureKey);
    return true;
  });

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Cooperative Modules
        </p>
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight shrink-0 ${
                  isActive ? 'bg-emerald-500/30 text-emerald-200' : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Zero Code-Change Arch</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
            All business rules, rates, Chart of Accounts, workflows & formulas are dynamic database records.
          </p>
        </div>
      </div>
    </aside>
  );
};
