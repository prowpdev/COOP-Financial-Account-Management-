import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Printer,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Scale,
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  PiggyBank,
  Wallet,
  Coins
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { api } from '../../services/api';
import { Branch } from '../../types';

interface FinancialReportsViewProps {
  branches?: Branch[];
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
}

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  branches = [],
  selectedBranchId,
  onSelectBranch
}) => {
  const [reportType, setReportType] = useState<'trial_balance' | 'balance_sheet' | 'income_statement' | 'cda_statutory'>('trial_balance');
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedBranchId !== undefined) {
      setSelectedBranch(selectedBranchId);
    }
  }, [selectedBranchId]);

  const handleBranchChange = (newBranchId: string) => {
    setSelectedBranch(newBranchId);
    if (onSelectBranch) {
      onSelectBranch(newBranchId);
    }
  };

  const loadReport = async () => {
    setIsLoading(true);
    try {
      const branchParam = selectedBranch !== 'all' ? selectedBranch : undefined;
      const res = await api.getFinancialReport(reportType, branchParam);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, selectedBranch]);

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const activeBranchName = useMemo(() => {
    if (selectedBranch === 'all') return 'Consolidated (All Branches)';
    return branches.find(b => b.id === selectedBranch)?.name || 'Branch';
  }, [selectedBranch, branches]);

  const downloadStatementCSV = () => {
    if (!data) return;
    let csvContent = 'data:text/csv;charset=utf-8,';
    const branchName = activeBranchName;
    const filterNote = showZeroBalances ? 'Full Chart of Accounts (All Records)' : 'Active Accounts Only (Balances != 0)';

    if (reportType === 'trial_balance') {
      csvContent += `"Trial Balance - ${branchName}"\r\n`;
      csvContent += `"Filter View:","${filterNote}"\r\n`;
      csvContent += `"Generated:","${new Date().toLocaleString()}"\r\n\r\n`;
      csvContent += `"Account Code","Account Name","Classification","Debit","Credit"\r\n`;
      const rows = showZeroBalances ? (data.accounts || []) : (data.accounts || []).filter((a: any) => (a.debit || 0) > 0 || (a.credit || 0) > 0);
      rows.forEach((a: any) => {
        csvContent += `"${a.code}","${a.name}","${a.type}",${a.debit || 0},${a.credit || 0}\r\n`;
      });
      csvContent += `"TOTALS","","Balanced Equilibrium",${data.total_debit || 0},${data.total_credit || 0}\r\n`;
    } else if (reportType === 'balance_sheet') {
      csvContent += `"Statement of Financial Condition (Balance Sheet) - ${branchName}"\r\n`;
      csvContent += `"Filter View:","${filterNote}"\r\n`;
      csvContent += `"Generated:","${new Date().toLocaleString()}"\r\n\r\n`;
      csvContent += `"Category / Classification","Account Code","Account Name","Amount (PHP)"\r\n`;

      const filterItems = (items: any[]) => showZeroBalances ? (items || []) : (items || []).filter((i: any) => i.balance !== 0);

      const assets = filterItems(data.assets);
      assets.forEach((a: any) => {
        csvContent += `"Assets","${a.code || ''}","${a.name}",${a.balance || 0}\r\n`;
      });
      csvContent += `"Total Assets","","Total Assets",${data.total_assets || 0}\r\n\r\n`;

      const liab = filterItems(data.liabilities);
      liab.forEach((l: any) => {
        csvContent += `"Liabilities","${l.code || ''}","${l.name}",${l.balance || 0}\r\n`;
      });
      csvContent += `"Total Liabilities","","Total Liabilities",${data.total_liabilities || 0}\r\n\r\n`;

      const eq = filterItems(data.equity);
      eq.forEach((e: any) => {
        csvContent += `"Equity","${e.code || ''}","${e.name}",${e.balance || 0}\r\n`;
      });
      csvContent += `"Total Equity","","Total Equity",${data.total_equity || 0}\r\n\r\n`;
      csvContent += `"Total Liabilities & Equity","","Total Liabilities & Equity",${data.total_liabilities_and_equity || 0}\r\n`;
      csvContent += `"Equilibrium Check","","${data.is_balanced ? 'BALANCED' : 'OUT OF BALANCE'}",${data.total_assets - data.total_liabilities_and_equity}\r\n`;
    } else if (reportType === 'income_statement') {
      csvContent += `"Statement of Operations (Income Statement) - ${branchName}"\r\n`;
      csvContent += `"Filter View:","${filterNote}"\r\n`;
      csvContent += `"Generated:","${new Date().toLocaleString()}"\r\n\r\n`;
      csvContent += `"Classification","Account Code","Account Name","Amount (PHP)"\r\n`;

      const filterItems = (items: any[]) => showZeroBalances ? (items || []) : (items || []).filter((i: any) => i.balance !== 0);

      const rev = filterItems(data.revenues);
      rev.forEach((r: any) => {
        csvContent += `"Gross Operating Revenue","${r.code || ''}","${r.name}",${r.balance || 0}\r\n`;
      });
      csvContent += `"Total Operating Revenue","","Total Gross Revenue",${data.total_revenue || 0}\r\n\r\n`;

      const exp = filterItems(data.expenses);
      exp.forEach((e: any) => {
        csvContent += `"Operating Expense","${e.code || ''}","${e.name}",${e.balance || 0}\r\n`;
      });
      csvContent += `"Total Operating Expenses","","Total Operating Expenses",${data.total_expense || 0}\r\n\r\n`;
      csvContent += `"Net Surplus for Allocation","","Current Operating Net Surplus",${data.net_surplus || 0}\r\n`;
    } else if (reportType === 'cda_statutory') {
      const net = data.net_surplus || 0;
      csvContent += `"CDA Statutory Reserve Allocation - ${branchName}"\r\n`;
      csvContent += `"Current Operating Net Surplus:","${net}"\r\n`;
      csvContent += `"Generated:","${new Date().toLocaleString()}"\r\n\r\n`;
      csvContent += `"Fund / Statutory Reserve","Statutory Requirement %","Allocated Amount (PHP)"\r\n`;
      csvContent += `"General Reserve Fund (Min 10%)","10%",${Number((net * 0.10).toFixed(2))}\r\n`;
      csvContent += `"Cooperative Education & Training Fund (CETF 10%)","10%",${Number((net * 0.10).toFixed(2))}\r\n`;
      csvContent += `"Community Development Fund (Min 3%)","3%",${Number((net * 0.03).toFixed(2))}\r\n`;
      csvContent += `"Optional Fund (Max 7%)","7%",${Number((net * 0.07).toFixed(2))}\r\n`;
      csvContent += `"Interest on Share Capital & Patronage Refund (70%)","70%",${Number((net * 0.70).toFixed(2))}\r\n`;
      csvContent += `"Total Distributable Net Surplus","100%",${net}\r\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_${selectedBranch}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const trialBalanceCols: ExcelColumn<any>[] = [
    {
      key: 'code',
      header: 'Account Code',
      width: '140px',
      type: 'text',
      align: 'center',
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-emerald-400">{val}</span>
    },
    {
      key: 'name',
      header: 'Account Name',
      width: '280px',
      type: 'text',
      sortable: true,
      render: (val) => <span className="font-medium text-white">{val}</span>
    },
    {
      key: 'type',
      header: 'Classification',
      width: '140px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: (val) => {
        const u = String(val || '').toUpperCase();
        if (u.includes('ASSET')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (u.includes('LIABILIT')) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        if (u.includes('EQUITY') || u.includes('SURPLUS')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        if (u.includes('REVENUE') || u.includes('INCOME')) return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      }
    },
    {
      key: 'debit',
      header: 'Debit Balance (₱)',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    {
      key: 'credit',
      header: 'Credit Balance (₱)',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true
    }
  ];

  // Helper filters based on showZeroBalances
  const filterList = (items: any[]) => {
    if (!items) return [];
    if (showZeroBalances) return items;
    return items.filter((item: any) => (item.balance !== 0 && item.balance !== '0' && item.balance !== undefined) || (item.debit > 0 || item.credit > 0));
  };

  const filteredTbAccounts = useMemo(() => {
    if (!data?.accounts) return [];
    if (showZeroBalances) return data.accounts;
    return data.accounts.filter((a: any) => (a.debit || 0) > 0 || (a.credit || 0) > 0);
  }, [data?.accounts, showZeroBalances]);

  // Breakdown categorization for Balance Sheet
  const assetBreakdown = useMemo(() => {
    const all = data?.assets || [];
    const current = all.filter((a: any) => a.report_group === 'Current Assets' || a.code?.startsWith('11'));
    const loans = all.filter((a: any) => a.report_group === 'Loans and Receivables' || a.report_group === 'Receivables' || a.report_group === 'Contra-Asset' || a.code?.startsWith('12') || a.code?.startsWith('13'));
    const ppe = all.filter((a: any) => a.report_group === 'Property, Plant & Equipment' || a.report_group === 'Non-current Assets' || a.code?.startsWith('15'));
    return {
      current: filterList(current),
      loans: filterList(loans),
      ppe: filterList(ppe),
      totalCurrent: data?.total_current_assets ?? current.reduce((s: number, a: any) => s + (a.balance || 0), 0),
      totalLoans: data?.total_loans_receivables ?? loans.reduce((s: number, a: any) => s + (a.balance || 0), 0),
      totalPpe: data?.total_ppe ?? ppe.reduce((s: number, a: any) => s + (a.balance || 0), 0)
    };
  }, [data?.assets, data?.total_current_assets, data?.total_loans_receivables, data?.total_ppe, showZeroBalances]);

  const liabBreakdown = useMemo(() => {
    const all = data?.liabilities || [];
    const deposits = all.filter((l: any) => l.report_group === 'Deposit Liabilities' || l.code?.startsWith('21'));
    const payables = all.filter((l: any) => l.report_group !== 'Deposit Liabilities' && !l.code?.startsWith('21'));
    return {
      deposits: filterList(deposits),
      payables: filterList(payables),
      totalDeposits: data?.total_deposit_liabilities ?? deposits.reduce((s: number, l: any) => s + (l.balance || 0), 0),
      totalPayables: data?.total_current_liabilities ?? payables.reduce((s: number, l: any) => s + (l.balance || 0), 0)
    };
  }, [data?.liabilities, data?.total_deposit_liabilities, data?.total_current_liabilities, showZeroBalances]);

  const equityBreakdown = useMemo(() => {
    const all = data?.equity || [];
    const shareCap = all.filter((e: any) => (e.report_group === 'Share Capital' || e.code?.startsWith('31')) && e.code !== '3900');
    const reserves = all.filter((e: any) => (e.report_group === 'Statutory Reserves' || e.code?.startsWith('32')) && e.code !== '3900');
    const surplus = all.find((e: any) => e.code === '3900' || e.report_group === 'Equity Surplus');
    return {
      shareCapital: filterList(shareCap),
      reserves: filterList(reserves),
      surplusItem: surplus,
      totalShareCap: data?.total_share_capital ?? shareCap.reduce((s: number, e: any) => s + (e.balance || 0), 0),
      totalReserves: data?.total_reserves ?? reserves.reduce((s: number, e: any) => s + (e.balance || 0), 0),
      netSurplus: data?.net_surplus ?? surplus?.balance ?? 0
    };
  }, [data?.equity, data?.total_share_capital, data?.total_reserves, data?.net_surplus, showZeroBalances]);

  const revenuesList = useMemo(() => filterList(data?.revenues || []), [data?.revenues, showZeroBalances]);
  const expensesList = useMemo(() => filterList(data?.expenses || []), [data?.expenses, showZeroBalances]);

  const isBalanced = data?.is_balanced !== false && Math.abs((data?.total_assets || 0) - (data?.total_liabilities_and_equity || 0)) < 0.01;

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Financial Statements & Compliance</span>
            <span>•</span>
            <span className="text-slate-400">CDA Standard Chart of Accounts</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Financial Reports & CDA Compliance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generated directly from the configuration-driven double-entry general ledger engine.
          </p>
        </div>

        {/* Global Controls: Branch Selector, Zero-Balance Toggle, Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter Selector */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Branches (Consolidated)</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Zero Balances Toggle */}
          <button
            onClick={() => setShowZeroBalances(!showZeroBalances)}
            className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition cursor-pointer ${
              showZeroBalances
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={showZeroBalances ? 'Showing all chart of accounts (including zero balances)' : 'Showing only accounts with active balances'}
          >
            {showZeroBalances ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
            <span>{showZeroBalances ? 'Full CDA Chart' : 'Active Balances Only'}</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={downloadStatementCSV}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 cursor-pointer"
            title="Download active report as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {/* Refresh */}
          <button
            onClick={loadReport}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 cursor-pointer"
            title="Refresh Report"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setReportType('trial_balance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            reportType === 'trial_balance'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Trial Balance Grid
        </button>
        <button
          onClick={() => setReportType('balance_sheet')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            reportType === 'balance_sheet'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Statement of Financial Condition (Balance Sheet)
        </button>
        <button
          onClick={() => setReportType('income_statement')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            reportType === 'income_statement'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Statement of Operations (Income Statement)
        </button>
        <button
          onClick={() => setReportType('cda_statutory')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            reportType === 'cda_statutory'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          CDA Statutory Reserve Allocation
        </button>
      </div>

      {/* Report Content Body */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-sm">
        {isLoading && (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-emerald-400" />
            <p className="text-xs">Computing live statement from general ledger records...</p>
          </div>
        )}

        {/* 1. TRIAL BALANCE TAB */}
        {!isLoading && data && reportType === 'trial_balance' && (
          <div className="space-y-4">
            {/* Equilibrium Status Banner & KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Debit Activity
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                  {formatMoney(data.total_debit)}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Standard Normal Debit Balances</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Credit Activity
                </span>
                <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                  {formatMoney(data.total_credit)}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Standard Normal Credit Balances</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Net Ledger Variance
                </span>
                <span className={`text-xl font-bold font-mono mt-1 block ${Math.abs(data.variance || 0) < 0.01 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatMoney(Math.abs(data.variance || 0))}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {Math.abs(data.variance || 0) < 0.01 ? 'Zero Discrepancy' : 'Unbalanced Variance'}
                </span>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                data.is_balanced !== false && Math.abs(data.variance || 0) < 0.01
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider block">
                    Equilibrium Status
                  </span>
                  <div className="flex items-center space-x-1.5 mt-1">
                    <Scale className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold tracking-tight">
                      {data.is_balanced !== false && Math.abs(data.variance || 0) < 0.01
                        ? 'PERFECTLY BALANCED'
                        : 'OUT OF BALANCE'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] opacity-80 mt-1 block">
                  {filteredTbAccounts.length} CDA Accounts Displayed ({showZeroBalances ? 'All' : 'Active Balances'})
                </span>
              </div>
            </div>

            <ExcelGridTable
              title="Consolidated General Ledger Trial Balance"
              subtitle={`Live balance summary across all CDA chart of accounts for ${activeBranchName}. Enforces mathematical debit/credit equilibrium.`}
              exportFileName={`trial_balance_${selectedBranch}`}
              data={filteredTbAccounts}
              columns={trialBalanceCols}
              defaultSortKey="code"
            />
          </div>
        )}

        {/* 2. STATEMENT OF FINANCIAL CONDITION (BALANCE SHEET) */}
        {!isLoading && data && reportType === 'balance_sheet' && (
          <div className="space-y-6">
            {/* Header Strip with Equilibrium Indicator */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Statement of Financial Condition
                  </h3>
                  <span className="text-xs text-slate-400 font-normal">(Balance Sheet)</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  CDA Standard: Assets = Liabilities + Equity (including Current Period Undivided Surplus)
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs px-3 py-1 bg-slate-800 text-emerald-400 rounded-lg font-mono font-medium border border-slate-700">
                  {activeBranchName}
                </span>

                <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                  isBalanced
                    ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-950/40 text-rose-400 border-rose-500/30'
                }`}>
                  {isBalanced ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Balanced Equilibrium (A = L + E)</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      <span>Discrepancy: {formatMoney(Math.abs((data.total_assets || 0) - (data.total_liabilities_and_equity || 0)))}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Equilibrium Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Assets
                  </span>
                  <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
                    {formatMoney(data.total_assets)}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Cash, Loans Portfolio & Equipment</span>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Liabilities
                  </span>
                  <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">
                    {formatMoney(data.total_liabilities)}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Member Savings & Term Deposits</span>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                  <PiggyBank className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Total Members' Equity
                  </span>
                  <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                    {formatMoney(data.total_equity)}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Share Capital, Reserves & Net Surplus</span>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <Coins className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Categorized Balance Sheet Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: ASSETS */}
              <div className="space-y-4">
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                  <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Assets (Resources Owned)</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {formatMoney(data.total_assets)}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Current Assets */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                        <span>Current Assets (Cash, Vaults & Banks)</span>
                        <span className="font-mono text-slate-200">{formatMoney(assetBreakdown.totalCurrent)}</span>
                      </div>
                      <div className="divide-y divide-slate-900 mt-1">
                        {assetBreakdown.current.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-1">No active cash accounts</p>
                        ) : (
                          assetBreakdown.current.map((item: any) => (
                            <div key={item.code} className="flex justify-between items-center py-1.5 text-xs">
                              <span className="text-slate-400 flex items-center space-x-2">
                                <span className="font-mono text-[10px] text-slate-500">{item.code}</span>
                                <span>{item.name}</span>
                              </span>
                              <span className="font-mono text-slate-200 font-medium">{formatMoney(item.balance)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Loans & Receivables */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                        <span>Loans and Receivables (Portfolio)</span>
                        <span className="font-mono text-slate-200">{formatMoney(assetBreakdown.totalLoans)}</span>
                      </div>
                      <div className="divide-y divide-slate-900 mt-1">
                        {assetBreakdown.loans.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-1">No active loans outstanding</p>
                        ) : (
                          assetBreakdown.loans.map((item: any) => (
                            <div key={item.code} className="flex justify-between items-center py-1.5 text-xs">
                              <span className="text-slate-400 flex items-center space-x-2">
                                <span className="font-mono text-[10px] text-slate-500">{item.code}</span>
                                <span>{item.name}</span>
                              </span>
                              <span className="font-mono text-slate-200 font-medium">{formatMoney(item.balance)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Property & Equipment */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                        <span>Property, Plant & Equipment</span>
                        <span className="font-mono text-slate-200">{formatMoney(assetBreakdown.totalPpe)}</span>
                      </div>
                      <div className="divide-y divide-slate-900 mt-1">
                        {assetBreakdown.ppe.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-1">No property equipment balances</p>
                        ) : (
                          assetBreakdown.ppe.map((item: any) => (
                            <div key={item.code} className="flex justify-between items-center py-1.5 text-xs">
                              <span className="text-slate-400 flex items-center space-x-2">
                                <span className="font-mono text-[10px] text-slate-500">{item.code}</span>
                                <span>{item.name}</span>
                              </span>
                              <span className="font-mono text-slate-200 font-medium">{formatMoney(item.balance)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Total Assets Summary Bar */}
                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white bg-slate-900/60 p-3 rounded-lg">
                      <span className="text-emerald-400">TOTAL ASSETS</span>
                      <span className="font-mono text-emerald-400 text-base">{formatMoney(data.total_assets)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: LIABILITIES & EQUITY */}
              <div className="space-y-4">
                {/* 1. Liabilities */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                  <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
                      <PiggyBank className="w-3.5 h-3.5" />
                      <span>Liabilities (Member Deposits & Payables)</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {formatMoney(data.total_liabilities)}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Deposit Liabilities */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                        <span>Deposit Liabilities (Savings & Time Deposits)</span>
                        <span className="font-mono text-slate-200">{formatMoney(liabBreakdown.totalDeposits)}</span>
                      </div>
                      <div className="divide-y divide-slate-900 mt-1">
                        {liabBreakdown.deposits.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-1">No active member deposits</p>
                        ) : (
                          liabBreakdown.deposits.map((item: any) => (
                            <div key={item.code} className="flex justify-between items-center py-1.5 text-xs">
                              <span className="text-slate-400 flex items-center space-x-2">
                                <span className="font-mono text-[10px] text-slate-500">{item.code}</span>
                                <span>{item.name}</span>
                              </span>
                              <span className="font-mono text-slate-200 font-medium">{formatMoney(item.balance)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Payables */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                        <span>Current Liabilities & Accruals</span>
                        <span className="font-mono text-slate-200">{formatMoney(liabBreakdown.totalPayables)}</span>
                      </div>
                      <div className="divide-y divide-slate-900 mt-1">
                        {liabBreakdown.payables.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-1">No unpaid accounts payable</p>
                        ) : (
                          liabBreakdown.payables.map((item: any) => (
                            <div key={item.code} className="flex justify-between items-center py-1.5 text-xs">
                              <span className="text-slate-400 flex items-center space-x-2">
                                <span className="font-mono text-[10px] text-slate-500">{item.code}</span>
                                <span>{item.name}</span>
                              </span>
                              <span className="font-mono text-slate-200 font-medium">{formatMoney(item.balance)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-blue-400">
                      <span>TOTAL LIABILITIES</span>
                      <span className="font-mono text-sm">{formatMoney(data.total_liabilities)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Equity */}
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
                  <div className="bg-slate-900/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
                      <Coins className="w-3.5 h-3.5" />
                      <span>Members' Equity & Retained Surplus</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {formatMoney(data.total_equity)}
                    </span>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Share Capital */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                        <span>Paid-Up Share Capital (CBU)</span>
                        <span className="font-mono text-slate-200">{formatMoney(equityBreakdown.totalShareCap)}</span>
                      </div>
                      <div className="divide-y divide-slate-900 mt-1">
                        {equityBreakdown.shareCapital.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-1">No share capital accounts</p>
                        ) : (
                          equityBreakdown.shareCapital.map((item: any) => (
                            <div key={item.code} className="flex justify-between items-center py-1.5 text-xs">
                              <span className="text-slate-400 flex items-center space-x-2">
                                <span className="font-mono text-[10px] text-slate-500">{item.code}</span>
                                <span>{item.name}</span>
                              </span>
                              <span className="font-mono text-slate-200 font-medium">{formatMoney(item.balance)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Statutory Reserves */}
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-300 pb-1.5 border-b border-slate-800">
                        <span>Statutory & Discretionary Reserves</span>
                        <span className="font-mono text-slate-200">{formatMoney(equityBreakdown.totalReserves)}</span>
                      </div>
                      <div className="divide-y divide-slate-900 mt-1">
                        {equityBreakdown.reserves.length === 0 ? (
                          <p className="text-[11px] text-slate-500 italic py-1">No reserve fund balances</p>
                        ) : (
                          equityBreakdown.reserves.map((item: any) => (
                            <div key={item.code} className="flex justify-between items-center py-1.5 text-xs">
                              <span className="text-slate-400 flex items-center space-x-2">
                                <span className="font-mono text-[10px] text-slate-500">{item.code}</span>
                                <span>{item.name}</span>
                              </span>
                              <span className="font-mono text-slate-200 font-medium">{formatMoney(item.balance)}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Current Period Net Surplus Line Item (Balancing Asset = Liab + Equity) */}
                    <div className="bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-lg flex justify-between items-center text-xs">
                      <span className="text-emerald-300 flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-emerald-500/80">3900</span>
                        <span className="font-semibold">Current Period Undivided Net Surplus / (Deficit)</span>
                      </span>
                      <span className={`font-mono font-bold ${equityBreakdown.netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formatMoney(equityBreakdown.netSurplus)}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold text-amber-400">
                      <span>TOTAL MEMBERS' EQUITY</span>
                      <span className="font-mono text-sm">{formatMoney(data.total_equity)}</span>
                    </div>
                  </div>
                </div>

                {/* Final Total Liabilities & Equity Box */}
                <div className={`p-4 rounded-xl border flex justify-between items-center font-bold text-sm shadow-md ${
                  isBalanced
                    ? 'bg-slate-950 border-emerald-500/40 text-white'
                    : 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                }`}>
                  <span className="tracking-tight">TOTAL LIABILITIES & EQUITY</span>
                  <span className={`font-mono text-base ${isBalanced ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatMoney(data.total_liabilities_and_equity)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. STATEMENT OF OPERATIONS (INCOME STATEMENT) */}
        {!isLoading && data && reportType === 'income_statement' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header Strip */}
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Statement of Operations
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  CDA Standard: Gross Operating Revenues - Operating Expenses = Net Surplus for Allocation
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-slate-800 text-emerald-400 rounded-lg font-mono font-medium border border-slate-700">
                {activeBranchName}
              </span>
            </div>

            {/* Top Operational Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Gross Revenues
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
                  {formatMoney(data.total_revenue)}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Interest, Fees & Penalties</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Operating Expenses
                </span>
                <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
                  {formatMoney(data.total_expense)}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Staff, Rent, Utilities & Interest</span>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                (data.net_surplus || 0) >= 0
                  ? 'bg-emerald-950/30 border-emerald-500/40'
                  : 'bg-rose-950/30 border-rose-500/40'
              }`}>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Net Surplus / (Deficit)
                  </span>
                  <span className={`text-xl font-bold font-mono mt-1 block ${
                    (data.net_surplus || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {formatMoney(data.net_surplus)}
                  </span>
                </div>
                <span className="text-[10px] opacity-80 mt-1 text-slate-400 block">
                  {(data.net_surplus || 0) >= 0 ? 'Positive Operating Surplus' : 'Operating Deficit'}
                </span>
              </div>
            </div>

            {/* Revenues Section */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-emerald-400 pb-2 border-b border-slate-800">
                <span className="flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Gross Operating Revenues</span>
                </span>
                <span className="font-mono text-sm">{formatMoney(data.total_revenue)}</span>
              </div>

              <div className="divide-y divide-slate-900">
                {revenuesList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No operating revenues recorded</p>
                ) : (
                  revenuesList.map((r: any) => (
                    <div key={r.code} className="flex justify-between items-center py-2 text-xs">
                      <span className="text-slate-300 flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-slate-500">{r.code}</span>
                        <span>{r.name}</span>
                      </span>
                      <span className="font-mono text-emerald-400 font-semibold">{formatMoney(r.balance)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between font-bold text-xs text-white pt-2 border-t border-slate-800">
                <span>Total Gross Operating Revenue</span>
                <span className="font-mono text-emerald-400 text-sm">{formatMoney(data.total_revenue)}</span>
              </div>
            </div>

            {/* Expenses Section */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-rose-400 pb-2 border-b border-slate-800">
                <span className="flex items-center space-x-1.5">
                  <TrendingDown className="w-4 h-4" />
                  <span>Operating & Administrative Expenses</span>
                </span>
                <span className="font-mono text-sm">{formatMoney(data.total_expense)}</span>
              </div>

              <div className="divide-y divide-slate-900">
                {expensesList.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2">No operating expenses recorded</p>
                ) : (
                  expensesList.map((e: any) => (
                    <div key={e.code} className="flex justify-between items-center py-2 text-xs">
                      <span className="text-slate-300 flex items-center space-x-2">
                        <span className="font-mono text-[10px] text-slate-500">{e.code}</span>
                        <span>{e.name}</span>
                      </span>
                      <span className="font-mono text-rose-400 font-semibold">{formatMoney(e.balance)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-between font-bold text-xs text-white pt-2 border-t border-slate-800">
                <span>Total Operating Expenses</span>
                <span className="font-mono text-rose-400 text-sm">{formatMoney(data.total_expense)}</span>
              </div>
            </div>

            {/* Net Operating Surplus Card */}
            <div className="p-5 bg-gradient-to-r from-slate-950 to-slate-900 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Result of Operations
                </span>
                <h4 className="text-lg font-bold text-white tracking-tight mt-0.5">
                  Net Surplus Available for Statutory Allocation
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distributable to General Reserve, CETF, Community Fund, and Patronage Refund.
                </p>
              </div>

              <div className="text-right">
                <span className={`text-2xl font-black font-mono tracking-tight block ${
                  (data.net_surplus || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {formatMoney(data.net_surplus)}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  ₱{Number(data.total_revenue || 0).toLocaleString()} (Rev) - ₱{Number(data.total_expense || 0).toLocaleString()} (Exp)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. CDA STATUTORY RESERVE ALLOCATION */}
        {!isLoading && data && reportType === 'cda_statutory' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">CDA Statutory Reserve Distribution</h3>
                <p className="text-xs text-slate-400">
                  Automatic allocation of Net Surplus based on configured cooperative statutory percentages.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-slate-800 text-emerald-400 rounded-lg font-mono">
                {activeBranchName}
              </span>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
              <div className="flex justify-between items-center text-sm font-bold text-white pb-3 border-b border-slate-800">
                <span className="flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Distributable Net Surplus</span>
                </span>
                <span className="text-emerald-400 font-mono text-base">{formatMoney(data.net_surplus || 0)}</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>General Reserve Fund (Min 10%)</span>
                  <span className="font-mono font-semibold text-white">{formatMoney((data.net_surplus || 0) * 0.10)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Cooperative Education & Training Fund (CETF 10%)</span>
                  <span className="font-mono font-semibold text-white">{formatMoney((data.net_surplus || 0) * 0.10)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Community Development Fund (Min 3%)</span>
                  <span className="font-mono font-semibold text-white">{formatMoney((data.net_surplus || 0) * 0.03)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800 text-slate-300">
                  <span>Optional Fund (Max 7%)</span>
                  <span className="font-mono font-semibold text-white">{formatMoney((data.net_surplus || 0) * 0.07)}</span>
                </div>
                <div className="flex justify-between py-2 font-bold text-sm text-emerald-400 pt-2 border-t border-slate-800">
                  <span>Interest on Share Capital & Patronage Refund (70%)</span>
                  <span className="font-mono">{formatMoney((data.net_surplus || 0) * 0.70)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
