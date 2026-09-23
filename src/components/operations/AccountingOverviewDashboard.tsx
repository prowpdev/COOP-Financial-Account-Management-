import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Scale,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';
import { Account, Branch, JournalEntry } from '../../types';

interface AccountingOverviewDashboardProps {
  accounts: Account[];
  journals: JournalEntry[];
  branches: Branch[];
  selectedBranch: string;
  onNavigateToTab: (tab: any) => void;
  onNewVoucher: (type: 'JV' | 'OR' | 'CD') => void;
}

export const AccountingOverviewDashboard: React.FC<AccountingOverviewDashboardProps> = ({
  accounts = [],
  journals = [],
  branches = [],
  selectedBranch = 'all',
  onNavigateToTab,
  onNewVoucher
}) => {
  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  // Filter journals by selected branch
  const filteredJournals = useMemo(() => {
    if (selectedBranch === 'all') return journals;
    return journals.filter(j => j && j.branch_id === selectedBranch);
  }, [journals, selectedBranch]);

  // Compute real-time account balances from journal lines
  const accountBalancesMap = useMemo(() => {
    const map = new Map<string, { debit: number; credit: number }>();
    filteredJournals.forEach(j => {
      (j.lines || []).forEach(l => {
        const current = map.get(l.account_id) || { debit: 0, credit: 0 };
        current.debit += Number(l.debit) || 0;
        current.credit += Number(l.credit) || 0;
        map.set(l.account_id, current);
      });
    });
    return map;
  }, [filteredJournals]);

  // Aggregate major General Ledger groups
  const glGroups = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    const groupDetails = {
      assets: [] as any[],
      liabilities: [] as any[],
      equity: [] as any[],
      revenue: [] as any[],
      expenses: [] as any[]
    };

    accounts.forEach(acc => {
      const lineData = accountBalancesMap.get(acc.id) || { debit: 0, credit: 0 };
      const debit = lineData.debit;
      const credit = lineData.credit;
      const isDebitNormal = (acc.normal_balance || 'Debit').toLowerCase() === 'debit';
      const balance = isDebitNormal ? debit - credit : credit - debit;

      const category = (acc.category || acc.type || '').toLowerCase();
      const code = String(acc.account_code || acc.code || '');

      const item = {
        id: acc.id,
        code: acc.account_code || acc.code,
        name: acc.name,
        normal_balance: acc.normal_balance,
        balance,
        debit,
        credit
      };

      if (category.includes('asset') || code.startsWith('1')) {
        totalAssets += balance;
        if (Math.abs(balance) > 0) groupDetails.assets.push(item);
      } else if (category.includes('liab') || code.startsWith('2')) {
        totalLiabilities += balance;
        if (Math.abs(balance) > 0) groupDetails.liabilities.push(item);
      } else if (category.includes('equity') || category.includes('capital') || code.startsWith('3')) {
        totalEquity += balance;
        if (Math.abs(balance) > 0) groupDetails.equity.push(item);
      } else if (category.includes('rev') || category.includes('income') || code.startsWith('4')) {
        totalRevenue += balance;
        if (Math.abs(balance) > 0) groupDetails.revenue.push(item);
      } else if (category.includes('exp') || code.startsWith('5')) {
        totalExpenses += balance;
        if (Math.abs(balance) > 0) groupDetails.expenses.push(item);
      }
    });

    const netSurplus = totalRevenue - totalExpenses;
    const isBalanceSheetBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity + netSurplus)) < 1.0;

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      netSurplus,
      isBalanceSheetBalanced,
      groupDetails
    };
  }, [accounts, accountBalancesMap]);

  // Overall debits and credits in the book
  const { totalDebits, totalCredits, isEquilibrium } = useMemo(() => {
    let debits = 0;
    let credits = 0;
    filteredJournals.forEach(j => {
      debits += Number(j.total_debit) || 0;
      credits += Number(j.total_credit) || 0;
    });
    return {
      totalDebits: debits,
      totalCredits: credits,
      isEquilibrium: Math.abs(debits - credits) < 0.01
    };
  }, [filteredJournals]);

  // Recent 6 journal entries
  const recentJournals = useMemo(() => {
    const sorted = [...filteredJournals].sort((a, b) => {
      const timeA = new Date(a.posted_at || a.posting_date).getTime();
      const timeB = new Date(b.posted_at || b.posting_date).getTime();
      return timeB - timeA;
    });
    return sorted.slice(0, 6);
  }, [filteredJournals]);

  // Journal types distribution
  const journalTypeCounts = useMemo(() => {
    let jv = 0;
    let or = 0;
    let cd = 0;
    filteredJournals.forEach(j => {
      const type = (j.voucher_type || '').toUpperCase();
      const vNum = (j.voucher_number || '').toUpperCase();
      const ref = (j.reference_type || '').toUpperCase();
      if (type === 'OR' || vNum.includes('-OR-') || ref.includes('PAYMENT') || ref.includes('RECEIPT')) {
        or++;
      } else if (type === 'CD' || vNum.includes('-CD-') || ref.includes('DISBURSEMENT') || ref.includes('EXPENSE')) {
        cd++;
      } else {
        jv++;
      }
    });
    return { jv, or, cd };
  }, [filteredJournals]);

  const selectedBranchName = selectedBranch === 'all'
    ? 'All Branches Consolidated'
    : branches.find(b => b.id === selectedBranch)?.name || 'Main Branch';

  return (
    <div className="space-y-6">
      {/* Top Ledger Group Cards (Asset, Liability, Equity, Revenue, Expense) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Assets (1000s) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden shadow-lg hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">1000 Assets</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono">
            {formatMoney(glGroups.totalAssets)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Debit Normal</span>
            <span className="text-emerald-400 font-semibold">{glGroups.groupDetails.assets.length} Active Accounts</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Liabilities (2000s) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden shadow-lg hover:border-rose-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">2000 Liabilities</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono">
            {formatMoney(glGroups.totalLiabilities)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Credit Normal</span>
            <span className="text-rose-400 font-semibold">{glGroups.groupDetails.liabilities.length} Active Accounts</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Equity (3000s) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden shadow-lg hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">3000 Member Equity</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono">
            {formatMoney(glGroups.totalEquity)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>CBU & Reserves</span>
            <span className="text-amber-400 font-semibold">{glGroups.groupDetails.equity.length} Active Accounts</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Revenue (4000s) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden shadow-lg hover:border-blue-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">4000 Revenue</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono">
            {formatMoney(glGroups.totalRevenue)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Interest & Fees</span>
            <span className="text-blue-400 font-semibold">{glGroups.groupDetails.revenue.length} Active Accounts</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Expenses (5000s) & Net Surplus */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden shadow-lg hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">5000 Expenses</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold text-white font-mono">
            {formatMoney(glGroups.totalExpenses)}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Net Surplus:</span>
            <span className={`font-bold font-mono ${glGroups.netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatMoney(glGroups.netSurplus)}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-3 overflow-hidden">
            <div className="bg-purple-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      {/* Equilibrium & Accounting Equation Status Bar */}
      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${
            isEquilibrium
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-bold text-white">General Ledger Equilibrium</h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isEquilibrium ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {isEquilibrium ? 'Balanced (Debit = Credit)' : 'Unbalanced Variance'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cumulative Debits: <strong className="text-emerald-400 font-mono">{formatMoney(totalDebits)}</strong> • Cumulative Credits: <strong className="text-blue-400 font-mono">{formatMoney(totalCredits)}</strong>
            </p>
          </div>
        </div>

        {/* Quick Voucher Action Shortcuts */}
        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={() => onNewVoucher('JV')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            <span>+ New JV</span>
          </button>
          <button
            onClick={() => onNewVoucher('OR')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            <span>+ New OR</span>
          </button>
          <button
            onClick={() => onNewVoucher('CD')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold cursor-pointer transition"
          >
            <span>+ New CDV</span>
          </button>
        </div>
      </div>

      {/* Main Split: Recent Journal Entries & Journal Books Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Journal Entries List (2 Columns wide on lg) */}
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Recent Journal Entries & Vouchers</h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {filteredJournals.length} Total
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('general_journal')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-semibold cursor-pointer"
            >
              <span>View General Journal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentJournals.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No journal entries recorded for {selectedBranchName}.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {recentJournals.map(j => {
                const type = (j.voucher_type || '').toUpperCase();
                const vNum = (j.voucher_number || '').toUpperCase();
                const isOR = type === 'OR' || vNum.includes('-OR-');
                const isCD = type === 'CD' || vNum.includes('-CD-');

                const badgeColor = isOR
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isCD
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/30';

                const badgeText = isOR ? 'CRJ • OR' : isCD ? 'CDJ • CDV' : 'GJ • JV';

                return (
                  <div key={j.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 px-2 rounded-xl transition">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {badgeText}
                        </span>
                        <span className="font-mono text-xs font-bold text-white">{j.voucher_number}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {j.posting_date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium line-clamp-1">
                        {j.description || 'Journal Voucher Posting'}
                      </p>
                      <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
                        <span>Prepared: {j.created_by || 'Accountant'}</span>
                        <span>•</span>
                        <span>{j.lines?.length || 0} Account Lines</span>
                        {j.member_name && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300 font-sans">Member: {j.member_name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <div className="font-mono font-bold text-emerald-400 text-sm">
                        ₱{(Number(j.total_debit) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-500 font-sans">Balanced Debit/Credit</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Specialized Books Summary & Quick Stats (1 Column wide on lg) */}
        <div className="space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2 pb-2 border-b border-slate-800">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Cooperative Books Distribution</span>
            </h3>

            {/* General Journal */}
            <div
              onClick={() => onNavigateToTab('general_journal')}
              className="p-3 bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">General Journal (GJ)</div>
                  <span className="text-[10px] text-slate-400">Balanced JVs & adjustments</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-blue-400">{journalTypeCounts.jv} entries</div>
                <span className="text-[10px] text-slate-500">Open Book &rarr;</span>
              </div>
            </div>

            {/* Cash Receipt Journal */}
            <div
              onClick={() => onNavigateToTab('cash_receipt_journal')}
              className="p-3 bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Cash Receipt Journal (CRJ)</div>
                  <span className="text-[10px] text-slate-400">Cash inflows & Official Receipts</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-emerald-400">{journalTypeCounts.or} ORs</div>
                <span className="text-[10px] text-slate-500">Open Book &rarr;</span>
              </div>
            </div>

            {/* Cash Disbursement Journal */}
            <div
              onClick={() => onNavigateToTab('cash_disbursement_journal')}
              className="p-3 bg-slate-950/70 border border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Cash Disbursement Journal (CDJ)</div>
                  <span className="text-[10px] text-slate-400">Disbursements & Check Vouchers</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-amber-400">{journalTypeCounts.cd} CDVs</div>
                <span className="text-[10px] text-slate-500">Open Book &rarr;</span>
              </div>
            </div>

            {/* General Ledger */}
            <div
              onClick={() => onNavigateToTab('general_ledger')}
              className="p-3 bg-slate-950/70 border border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Full General Ledger</div>
                  <span className="text-[10px] text-slate-400">Double-entry account balances</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-purple-400">{accounts.length} Accounts</div>
                <span className="text-[10px] text-slate-500">Open Book &rarr;</span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 text-xs space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Real-Time GL Synchronization</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every loan repayment, member share capital deposit, and expense voucher automatically calculates against General Ledger accounts in real-time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
