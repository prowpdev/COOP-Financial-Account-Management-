import React, { useState, useEffect } from 'react';
import {
  Scale,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Building2,
  Printer,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Search,
  ExternalLink,
  Coins,
  CreditCard,
  PiggyBank,
  Landmark,
  ArrowRight,
  Filter
} from 'lucide-react';
import { api } from '../../services/api';
import { Branch } from '../../types';

interface GLReconciliationViewProps {
  branches: Branch[];
  selectedBranch: string;
  onSelectBranch: (id: string) => void;
  onNavigateToTab: (tab: any) => void;
}

export const GLReconciliationView: React.FC<GLReconciliationViewProps> = ({
  branches,
  selectedBranch,
  onSelectBranch,
  onNavigateToTab
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCheck, setExpandedCheck] = useState<string | null>('chk_share_capital');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'variance' | 'reconciled'>('all');

  const loadReconciliation = async () => {
    setIsLoading(true);
    try {
      const res = await api.getGLReconciliation(selectedBranch !== 'all' ? selectedBranch : undefined);
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load GL reconciliation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReconciliation();
  }, [selectedBranch]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const exportCSV = () => {
    if (!data || !data.checks) return;

    const summaryHeaders = [
      'Sub-Ledger Module',
      'Control GL Code',
      'Control GL Account Name',
      'Normal Balance',
      'Sub-Ledger Total (₱)',
      'GL Control Account Balance (₱)',
      'Variance (₱)',
      'Reconciliation Status',
      'Account / Facility Count'
    ];

    const summaryRows = data.checks.map((c: any) => [
      `"${c.name}"`,
      `"${c.control_gl_code}"`,
      `"${c.control_gl_name}"`,
      `"${c.normal_balance}"`,
      (c.subledger_balance || 0).toFixed(2),
      (c.gl_balance || 0).toFixed(2),
      (c.variance || 0).toFixed(2),
      c.is_reconciled ? 'RECONCILED' : 'DISCREPANCY DETECTED',
      c.items_count || 0
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `"General Ledger to Sub-Ledger Automated Reconciliation Report"\r\n`;
    csvContent += `"Audit Timestamp: ${data.timestamp || new Date().toISOString()}"\r\n`;
    csvContent += `"Branch Scope: ${selectedBranch === 'all' ? 'All Branches Consolidated' : branches.find(b => b.id === selectedBranch)?.name || 'Branch'}"\r\n\r\n`;
    csvContent += [summaryHeaders.join(','), ...summaryRows.map((r: any) => r.join(','))].join('\n');

    csvContent += '\r\n\r\n"Detailed Subsidiary Breakdown"\r\n';
    csvContent += '"Module","Identifier","Member / Account Name","Facility / Sub-ledger Balance (₱)","Status"\r\n';

    data.checks.forEach((c: any) => {
      (c.breakdown || []).forEach((b: any) => {
        csvContent += `"${c.name}","${b.account_number || b.id}","${(b.member_name || b.name || '').replace(/"/g, '""')}",${(b.subledger_balance || 0).toFixed(2)},"${b.status || 'Active'}"\r\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GL_Reconciliation_Report_${selectedBranch}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const checks = data?.checks || [];
  const filteredChecks = checks.filter((c: any) => {
    if (statusFilter === 'variance') return !c.is_reconciled;
    if (statusFilter === 'reconciled') return c.is_reconciled;
    return true;
  });

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'chk_share_capital':
        return <Coins className="w-5 h-5 text-amber-400" />;
      case 'chk_loans':
        return <CreditCard className="w-5 h-5 text-blue-400" />;
      case 'chk_savings':
        return <PiggyBank className="w-5 h-5 text-emerald-400" />;
      case 'chk_cash_bank':
        return <Landmark className="w-5 h-5 text-purple-400" />;
      default:
        return <Scale className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Automated Audit & Compliance Tool</span>
            <span>•</span>
            <span className="text-slate-400">Sub-Ledger to General Ledger Integrity Checks</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2">
            <Scale className="w-6 h-6 text-emerald-400" />
            <span>General Ledger Automated Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Continuously compares member subsidiary records (Share Capital / CBU, Loans Portfolio, Savings Deposits, and Cash Vaults) against their corresponding GL control accounts, highlighting variances and balancing status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedBranch}
              onChange={e => onSelectBranch(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Branches Consolidated</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={loadReconciliation}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer transition disabled:opacity-50"
            title="Re-run automated reconciliation check"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-verify</span>
          </button>

          <button
            onClick={exportCSV}
            disabled={isLoading || !data}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer transition disabled:opacity-50"
            title="Download reconciliation statement as CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Global Reconciliation Status Banner */}
      {data && (
        <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          data.all_reconciled
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`p-3 rounded-2xl ${
              data.all_reconciled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {data.all_reconciled ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {data.all_reconciled
                    ? 'All Cooperative Sub-Ledgers Are Fully Reconciled'
                    : 'Discrepancy / Variance Detected in Sub-Ledger Balances'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  data.all_reconciled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {data.all_reconciled ? '100% In-Sync' : 'Action Required'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {data.all_reconciled
                  ? 'All member individual accounts (Share Capital, Loans, Savings, and Cash Accounts) match their control General Ledger accounts with zero variance.'
                  : `Total absolute reconciliation variance across control accounts is ${formatMoney(data.total_variance_magnitude)}. Inspect the itemized accounts below to identify unbalanced transactions.`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs shrink-0 font-mono">
            <div className="bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Audit Timestamp</span>
              <span className="text-white font-medium">{new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <div className="bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-sans">Active Modules</span>
              <span className="text-emerald-400 font-bold">{checks.length} Sub-ledgers</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Sub-Ledgers ({checks.length})
          </button>
          <button
            onClick={() => setStatusFilter('variance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'variance' ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Variances Only ({checks.filter((c: any) => !c.is_reconciled).length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('reconciled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              statusFilter === 'reconciled' ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Reconciled ({checks.filter((c: any) => c.is_reconciled).length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search member or account no..."
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            className="bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs w-48"
          />
          {searchFilter && (
            <button onClick={() => setSearchFilter('')} className="text-slate-500 hover:text-white">
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Main Reconciliation Check Cards */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            Scanning ledger transactions and performing cross-verification integrity checks...
          </div>
        ) : filteredChecks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 rounded-2xl border border-slate-800">
            No reconciliation modules match the selected filter.
          </div>
        ) : (
          filteredChecks.map((check: any) => {
            const isExpanded = expandedCheck === check.id;
            const variance = Number(check.variance) || 0;
            const isReconciled = check.is_reconciled;

            // Filter child records if search active
            const filteredBreakdown = (check.breakdown || []).filter((b: any) => {
              if (!searchFilter.trim()) return true;
              const term = searchFilter.toLowerCase();
              return (
                (b.member_name && b.member_name.toLowerCase().includes(term)) ||
                (b.account_number && b.account_number.toLowerCase().includes(term)) ||
                (b.name && b.name.toLowerCase().includes(term)) ||
                (b.member_no && b.member_no.toLowerCase().includes(term))
              );
            });

            return (
              <div
                key={check.id}
                className={`bg-slate-900 border rounded-2xl overflow-hidden transition shadow-lg ${
                  isReconciled ? 'border-slate-800 hover:border-slate-700' : 'border-amber-500/50 hover:border-amber-500'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedCheck(isExpanded ? null : check.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer bg-slate-950/40 hover:bg-slate-850/40 transition select-none"
                >
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                      {getModuleIcon(check.id)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-base font-bold text-white">{check.name}</h3>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          GL {check.control_gl_code}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isReconciled
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isReconciled ? 'RECONCILED' : 'VARIANCE DETECTED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Control Account: <strong className="text-slate-200">{check.control_gl_name}</strong> ({check.normal_balance} Normal) • {check.items_count} Subsidiary Records
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Financial comparison cards */}
                    <div className="grid grid-cols-3 gap-3 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">Sub-Ledger Total</span>
                        <span className="text-xs font-bold text-white font-mono">{formatMoney(check.subledger_balance)}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">GL Account Balance</span>
                        <span className="text-xs font-bold text-blue-400 font-mono">{formatMoney(check.gl_balance)}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">Variance</span>
                        <span className={`text-xs font-bold font-mono ${isReconciled ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {variance > 0 ? `+${formatMoney(variance)}` : formatMoney(variance)}
                        </span>
                      </div>
                    </div>

                    <div className="text-slate-400 pl-2">
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-emerald-400" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Drill-down details */}
                {isExpanded && (
                  <div className="p-5 border-t border-slate-800 bg-slate-950/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-slate-300">
                        Itemized subsidiary accounts comprising the sub-ledger balance of <strong className="text-white font-mono">{formatMoney(check.subledger_balance)}</strong>:
                      </div>

                      <div className="flex items-center space-x-2">
                        {check.id === 'chk_share_capital' && (
                          <button
                            onClick={() => onNavigateToTab('general_journal')}
                            className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1 cursor-pointer font-medium"
                          >
                            <span>Inspect Share Deposit Journals</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {check.id === 'chk_loans' && (
                          <button
                            onClick={() => onNavigateToTab('cash_receipt_journal')}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1 cursor-pointer font-medium"
                          >
                            <span>Inspect Loan Collections</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Drill-down Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3">Account / Ref No.</th>
                            <th className="py-2.5 px-3">Member / Subsidiary Name</th>
                            <th className="py-2.5 px-3">Status</th>
                            {check.id === 'chk_share_capital' && <th className="py-2.5 px-3 text-right">Subscribed (₱)</th>}
                            {check.id === 'chk_share_capital' && <th className="py-2.5 px-3 text-right">Shares</th>}
                            {check.id === 'chk_loans' && <th className="py-2.5 px-3 text-right">Original Principal (₱)</th>}
                            <th className="py-2.5 px-4 text-right text-emerald-400 font-bold">Sub-Ledger Balance (₱)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 bg-slate-900/40 font-mono">
                          {filteredBreakdown.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                                No subsidiary records match the search term.
                              </td>
                            </tr>
                          ) : (
                            filteredBreakdown.map((item: any, idx: number) => (
                              <tr key={item.id || idx} className="hover:bg-slate-800/40 transition">
                                <td className="py-2.5 px-3 font-mono text-slate-300 font-semibold">
                                  {item.account_number || item.id}
                                </td>
                                <td className="py-2.5 px-3 font-sans text-white">
                                  <div className="flex items-center space-x-2">
                                    <span>{item.member_name || item.name}</span>
                                    {item.member_no && (
                                      <span className="text-[10px] text-slate-400 font-mono">({item.member_no})</span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-sans">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    item.status === 'Active' || item.status === 'Approved'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}>
                                    {item.status || 'Active'}
                                  </span>
                                </td>
                                {check.id === 'chk_share_capital' && (
                                  <td className="py-2.5 px-3 text-right text-slate-300">
                                    {formatMoney(item.subscribed_amount)}
                                  </td>
                                )}
                                {check.id === 'chk_share_capital' && (
                                  <td className="py-2.5 px-3 text-right text-amber-300">
                                    {item.shares?.toLocaleString() || 0}
                                  </td>
                                )}
                                {check.id === 'chk_loans' && (
                                  <td className="py-2.5 px-3 text-right text-slate-300">
                                    {formatMoney(item.principal_amount)}
                                  </td>
                                )}
                                <td className="py-2.5 px-4 text-right text-emerald-400 font-bold bg-slate-950/30">
                                  {formatMoney(item.subledger_balance)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="bg-slate-900 text-white font-semibold border-t border-slate-800 text-xs font-mono">
                          <tr>
                            <td colSpan={check.id === 'chk_share_capital' ? 5 : check.id === 'chk_loans' ? 4 : 3} className="py-2.5 px-3 uppercase tracking-wider text-slate-400 font-sans">
                              Sub-Ledger Total Balance ({filteredBreakdown.length} records)
                            </td>
                            <td className="py-2.5 px-4 text-right text-emerald-400 font-bold">
                              {formatMoney(filteredBreakdown.reduce((sum: number, b: any) => sum + (Number(b.subledger_balance) || 0), 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Audit Guide */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-2">
        <h4 className="text-xs font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>CDA Standard Sub-Ledger to General Ledger Equilibrium Rules</span>
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          In cooperative accounting, individual member subsidiary balances (Share Capital Accounts, Loan Balances, and Savings Ledgers) must at all times match their corresponding GL control accounts (GL 3110, GL 1210, and GL 2110). When a variance occurs, review any manual journal vouchers (JV) posted directly without member subsidiary tags or check for pending cashier collections.
        </p>
      </div>
    </div>
  );
};
