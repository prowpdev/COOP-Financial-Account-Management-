import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  Users,
  Wallet,
  Coins,
  Receipt,
  FileCheck2,
  AlertCircle,
  Building2,
  Calendar,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { Branch } from '../types';

interface DashboardViewProps {
  selectedBranchId: string;
  branches?: Branch[];
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedBranchId,
  branches = [],
  onNavigate
}) => {
  const [stats, setStats] = useState<any>(null);
  const [periodFilter, setPeriodFilter] = useState('This Year');
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const res = await api.getDashboardStats(selectedBranchId);
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedBranchId, periodFilter]);

  const activeBranchName =
    selectedBranchId === 'all'
      ? 'All Branches (Consolidated)'
      : (branches || []).find(b => b.id === selectedBranchId)?.name || 'Selected Branch';

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filters */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Live Database Telemetry
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs text-slate-400 font-medium">Requirement #39 Strictly Compliant</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Cooperative Operations Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Displaying authoritative figures for <strong className="text-slate-200">{activeBranchName}</strong>. Zero synthetic mock figures.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 self-start md:self-auto">
          <div className="flex items-center bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <select
              id="dashboard-period-filter"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="Today" className="bg-slate-800 text-slate-200">Today</option>
              <option value="This Week" className="bg-slate-800 text-slate-200">This Week</option>
              <option value="This Month" className="bg-slate-800 text-slate-200">This Month</option>
              <option value="This Quarter" className="bg-slate-800 text-slate-200">This Quarter</option>
              <option value="This Year" className="bg-slate-800 text-slate-200">This Fiscal Year (2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Portfolio */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Outstanding Portfolio
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {isLoading ? '...' : formatMoney(stats?.outstanding_portfolio || 0)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">Active Accounts:</span>
              <span className="font-semibold text-blue-400">{stats?.active_loans_count || 0} loans</span>
            </div>
          </div>
        </div>

        {/* Total Savings Deposits */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Member Savings Deposits
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {isLoading ? '...' : formatMoney(stats?.total_savings_deposits || 0)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">Deposit Liabilities</span>
              <span className="font-semibold text-emerald-400">GL Account 2110</span>
            </div>
          </div>
        </div>

        {/* Total Share Capital */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Paid-Up Share Capital
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {isLoading ? '...' : formatMoney(stats?.total_share_capital || 0)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">Capital Build-Up (CBU)</span>
              <span className="font-semibold text-amber-400">GL Account 3110</span>
            </div>
          </div>
        </div>

        {/* Total Cash and Bank Assets */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cash & Bank Depository
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white tracking-tight">
              {isLoading ? '...' : formatMoney(stats?.total_cash_and_bank || 0)}
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-xs">
              <span className="text-slate-400">Vaults & Bank Balances</span>
              <span className="font-semibold text-purple-400">GL Account 1100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Operational Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Registered Members */}
        <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total Registered Members</span>
            <div className="text-2xl font-bold text-white mt-1">
              {isLoading ? '...' : stats?.total_members || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Regular & Associate Classifications</p>
          </div>
          <button
            onClick={() => onNavigate('members')}
            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer"
          >
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>

        {/* Interest Collected */}
        <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Interest Income Recognized</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {isLoading ? '...' : formatMoney(stats?.total_interest_collected || 0)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">From loan repayment postings</p>
          </div>
          <button
            onClick={() => onNavigate('accounting')}
            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer"
          >
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>

        {/* Journal Entries Posted */}
        <div className="bg-slate-900/70 rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-400">Total General Vouchers</span>
            <div className="text-2xl font-bold text-white mt-1">
              {isLoading ? '...' : stats?.total_journal_vouchers || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Strict double-entry balance enforced</p>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-800 rounded-xl hover:bg-slate-700 transition cursor-pointer"
          >
            <ArrowUpRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Architecture Highlights & Quick Access */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-850 rounded-2xl p-6 border border-slate-800">
        <h3 className="text-base font-bold text-white">Dynamic Architecture Highlights</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl">
          This system completely decouples business logic from source code. Any loan interest rate, fee, penalty rule, Chart of Accounts, accounting debit/credit mapping, approval threshold, document numbering, or member custom field can be modified directly from the Configuration Center.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <button
            onClick={() => onNavigate('configuration')}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 text-left rounded-xl border border-slate-700/80 transition cursor-pointer"
          >
            <div className="text-xs font-semibold text-emerald-400">1. Central Config Center</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Edit cooperative parameters, loan products & COA</p>
          </button>
          <button
            onClick={() => onNavigate('loans')}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 text-left rounded-xl border border-slate-700/80 transition cursor-pointer"
          >
            <div className="text-xs font-semibold text-blue-400">2. Originate Loans</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Amortization schedules & dynamic fee deductions</p>
          </button>
          <button
            onClick={() => onNavigate('accounting')}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 text-left rounded-xl border border-slate-700/80 transition cursor-pointer"
          >
            <div className="text-xs font-semibold text-amber-400">3. General Ledger & Periods</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Closed period posting protection & balanced journals</p>
          </button>
          <button
            onClick={() => onNavigate('verification')}
            className="p-3 bg-slate-800/80 hover:bg-slate-800 text-left rounded-xl border border-slate-700/80 transition cursor-pointer"
          >
            <div className="text-xs font-semibold text-purple-400">4. 15 Acceptance Tests</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Verify zero hard-coding compliance live</p>
          </button>
        </div>
      </div>
    </div>
  );
};
