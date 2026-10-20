import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileText,
  Printer,
  Download,
  Search,
  Filter,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CreditCard,
  PiggyBank,
  Landmark,
  User,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';
import { CoopProfile, User as UserType, Branch, Member } from '../../types';
import { PrintableSubsidiaryLedgerModal, SubsidiaryLedgerAccount, SubsidiaryLedgerEntry } from './PrintableSubsidiaryLedgerModal';
import { SearchableSelect, SearchableOption } from '../common/SearchableSelect';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';

interface SubsidiaryLedgerReportProps {
  branchId?: string;
  branches?: Branch[];
  members?: Member[];
  currentUser?: UserType;
  coopProfile?: CoopProfile;
  periodId?: string;
  startDate?: string;
  endDate?: string;
  periodName?: string;
}

export const SubsidiaryLedgerReport: React.FC<SubsidiaryLedgerReportProps> = ({
  branchId = 'all',
  branches = [],
  members = [],
  currentUser,
  coopProfile,
  periodId,
  startDate,
  endDate,
  periodName = 'Current Period'
}) => {
  // Ledger Type filter: 'all' | 'loans' | 'savings' | 'share_capital'
  const [ledgerType, setLedgerType] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateScope, setDateScope] = useState<'all' | 'period'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'grid' | 'excel'>('excel');
  const [excelSubTab, setExcelSubTab] = useState<'entries' | 'accounts'>('entries');

  // Searchable member options
  const memberOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: 'all', label: `All Members (${members.length})`, badge: 'All' },
      ...members.map(m => ({
        value: m.id,
        label: `${m.first_name} ${m.last_name}`,
        code: m.member_no || 'MEM',
        description: m.address ? `${m.address} · ${m.contact_no || ''}` : (m.contact_no || ''),
        searchTerms: `${m.member_no || ''} ${m.first_name || ''} ${m.last_name || ''} ${m.contact_no || ''} ${m.tin || ''}`
      }))
    ];
  }, [members]);

  // Expanded cards set
  const [expandedAccountIds, setExpandedAccountIds] = useState<Set<string>>(new Set());

  // Data state
  const [accounts, setAccounts] = useState<SubsidiaryLedgerAccount[]>([]);
  const [allEntries, setAllEntries] = useState<SubsidiaryLedgerEntry[]>([]);
  const [summary, setSummary] = useState({
    total_loans_disbursed: 0,
    total_principal_collected: 0,
    total_interest_collected: 0,
    total_penalty_collected: 0,
    total_outstanding_loans: 0,
    total_savings_balance: 0,
    total_savings_deposits: 0,
    total_savings_withdrawals: 0,
    total_share_capital_balance: 0,
    total_shares_count: 0,
    accounts_count: 0,
    entries_count: 0
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Print modal state
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [printTargetAccount, setPrintTargetAccount] = useState<SubsidiaryLedgerAccount | null>(null);

  // Fetch report data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await api.getSubsidiaryLedgerReport({
        period_id: dateScope === 'period' ? periodId : undefined,
        branch_id: branchId !== 'all' ? branchId : undefined,
        member_id: selectedMemberId !== 'all' ? selectedMemberId : undefined,
        ledger_type: ledgerType,
        start_date: dateScope === 'period' ? startDate : undefined,
        end_date: dateScope === 'period' ? endDate : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date_scope: dateScope
      });

      if (res && res.data) {
        setAccounts(res.data.accounts || []);
        setAllEntries(res.data.all_entries || []);
        if (res.data.summary) {
          setSummary(res.data.summary);
        }
      }
    } catch (err: any) {
      console.error('Failed to load subsidiary ledger report:', err);
      setErrorMessage(err.message || 'Unable to retrieve subsidiary ledger data.');
    } finally {
      setIsLoading(false);
    }
  }, [branchId, selectedMemberId, ledgerType, startDate, endDate, periodId, statusFilter, dateScope]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle card expansion
  const toggleAccountExpand = (id: string) => {
    setExpandedAccountIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedAccountIds(new Set(accounts.map(a => a.id)));
  };

  const collapseAll = () => {
    setExpandedAccountIds(new Set());
  };

  // Filter accounts by search query
  const filteredAccounts = useMemo(() => {
    if (!searchQuery.trim()) return accounts;
    const q = searchQuery.toLowerCase();
    return accounts.filter(acc =>
      acc.account_number.toLowerCase().includes(q) ||
      acc.member_name.toLowerCase().includes(q) ||
      acc.member_no.toLowerCase().includes(q) ||
      acc.product_name.toLowerCase().includes(q) ||
      acc.entries.some(e => e.ref_no.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
    );
  }, [accounts, searchQuery]);

  // Filter entries for grid view
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return allEntries;
    const q = searchQuery.toLowerCase();
    return allEntries.filter(e =>
      e.account_number.toLowerCase().includes(q) ||
      e.member_name.toLowerCase().includes(q) ||
      e.member_no.toLowerCase().includes(q) ||
      e.ref_no.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  }, [allEntries, searchQuery]);

  const formatCurrency = (val: number | undefined) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(val || 0);

  // CSV Export handler
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    const periodLabel = startDate && endDate ? `${startDate} to ${endDate}` : periodName;

    csvContent += `"Cooperative Subsidiary Ledger Audit Report"\r\n`;
    csvContent += `"Branch:","${branchId === 'all' ? 'All Branches' : branchId}"\r\n`;
    csvContent += `"Period:","${periodLabel}"\r\n`;
    csvContent += `"Ledger Scope:","${ledgerType.toUpperCase()}"\r\n`;
    csvContent += `"Generated:","${new Date().toLocaleString()}"\r\n\r\n`;

    csvContent += `"Account #","Ledger Type","Member Number","Member Name","Date","Ref / OR #","Description","Debit (PHP)","Credit (PHP)","Principal Paid (PHP)","Interest Paid (PHP)","Penalty / Fees (PHP)","Running Balance (PHP)"\r\n`;

    filteredAccounts.forEach(acc => {
      acc.entries.forEach(e => {
        const mem = (acc.member_name || '').replace(/"/g, '""');
        const desc = (e.description || '').replace(/"/g, '""');
        csvContent += `"${acc.account_number}","${acc.ledger_type}","${acc.member_no}","${mem}","${e.date}","${e.ref_no}","${desc}",${e.debit || 0},${e.credit || 0},${e.principal_paid || 0},${e.interest_paid || 0},${(e.penalty_paid || 0) + (e.fee_paid || 0)},${e.running_balance || 0}\r\n`;
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subsidiary_ledger_${ledgerType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel Grid Columns for Subsidiary Ledger Entries
  const entryColumns: ExcelColumn<SubsidiaryLedgerEntry>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Posting Date',
      width: '110px',
      sortable: true,
      filterable: true,
      type: 'date',
      render: (v) => <span className="font-mono text-xs text-slate-300">{v}</span>
    },
    {
      key: 'account_number',
      header: 'Account #',
      width: '130px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs font-bold text-emerald-400">#{v}</span>
    },
    {
      key: 'ledger_type',
      header: 'Ledger Type',
      width: '120px',
      sortable: true,
      filterable: true,
      type: 'badge',
      render: (v) => {
        const isLoan = v === 'loan' || v === 'loans';
        const isSavings = v === 'savings' || v === 'saving';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            isLoan
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : isSavings
              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          }`}>
            {isLoan ? 'Loan' : isSavings ? 'Savings' : 'Share Capital'}
          </span>
        );
      }
    },
    {
      key: 'member_no',
      header: 'Member #',
      width: '110px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs text-slate-300">{v}</span>
    },
    {
      key: 'member_name',
      header: 'Member Full Name',
      width: '180px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-medium text-xs text-white">{v}</span>
    },
    {
      key: 'ref_no',
      header: 'Ref / OR #',
      width: '130px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs text-amber-400 font-semibold">{v || '-'}</span>
    },
    {
      key: 'type',
      header: 'Classification',
      width: '140px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="text-xs text-slate-300 font-medium">{v || 'Movement'}</span>
    },
    {
      key: 'description',
      header: 'Particulars / Description',
      width: '240px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="text-xs text-slate-300 truncate block" title={v}>{v}</span>
    },
    {
      key: 'debit',
      header: 'Debit (₱)',
      width: '120px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs tabular-nums text-slate-200">
          {Number(v) > 0 ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
        </span>
      )
    },
    {
      key: 'credit',
      header: 'Credit (₱)',
      width: '120px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs tabular-nums text-slate-200">
          {Number(v) > 0 ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
        </span>
      )
    },
    {
      key: 'principal_paid',
      header: 'Principal (₱)',
      width: '120px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs tabular-nums text-emerald-400 font-bold">
          {Number(v) > 0 ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
        </span>
      )
    },
    {
      key: 'interest_paid',
      header: 'Interest (₱)',
      width: '120px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs tabular-nums text-amber-400 font-bold">
          {Number(v) > 0 ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
        </span>
      )
    },
    {
      key: 'penalty_paid',
      header: 'Penalty/Fees (₱)',
      width: '130px',
      align: 'right',
      type: 'currency',
      sortable: true,
      accessor: (r) => (Number(r.penalty_paid) || 0) + (Number(r.fee_paid) || 0),
      render: (_, r) => {
        const total = (Number(r.penalty_paid) || 0) + (Number(r.fee_paid) || 0);
        return (
          <span className="font-mono text-xs tabular-nums text-slate-400">
            {total > 0 ? total.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
          </span>
        );
      }
    },
    {
      key: 'running_balance',
      header: 'Running Bal (₱)',
      width: '140px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs tabular-nums font-black text-white">
          ₱{Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    }
  ], []);

  // Excel Grid Columns for Subsidiary Accounts Master
  const accountColumns: ExcelColumn<SubsidiaryLedgerAccount>[] = useMemo(() => [
    {
      key: 'account_number',
      header: 'Account #',
      width: '130px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs font-bold text-emerald-400">#{v}</span>
    },
    {
      key: 'ledger_type',
      header: 'Ledger Type',
      width: '120px',
      sortable: true,
      filterable: true,
      type: 'badge',
      render: (v) => {
        const isLoan = v === 'loan' || v === 'loans';
        const isSavings = v === 'savings' || v === 'saving';
        return (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
            isLoan
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : isSavings
              ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          }`}>
            {isLoan ? 'Loan' : isSavings ? 'Savings' : 'Share Capital'}
          </span>
        );
      }
    },
    {
      key: 'member_no',
      header: 'Member #',
      width: '110px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs text-slate-300">{v}</span>
    },
    {
      key: 'member_name',
      header: 'Member Name',
      width: '190px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-semibold text-xs text-white">{v}</span>
    },
    {
      key: 'product_name',
      header: 'Product / Plan',
      width: '180px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="text-xs text-slate-300 font-medium">{v}</span>
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      sortable: true,
      filterable: true,
      type: 'badge',
      render: (v) => (
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
          v === 'Active' || v === 'Released'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : v === 'Fully Paid'
            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
        }`}>
          {v}
        </span>
      )
    },
    {
      key: 'interest_rate',
      header: 'Rate (%)',
      width: '90px',
      align: 'right',
      sortable: true,
      render: (v) => <span className="font-mono text-xs text-slate-300">{v !== undefined && v !== null ? `${v}%` : '-'}</span>
    },
    {
      key: 'original_principal',
      header: 'Principal / Plan (₱)',
      width: '140px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs tabular-nums text-slate-200">
          {Number(v) > 0 ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
        </span>
      )
    },
    {
      key: 'total_principal_paid',
      header: 'Principal Paid (₱)',
      width: '140px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs tabular-nums text-emerald-400 font-bold">
          {Number(v) > 0 ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
        </span>
      )
    },
    {
      key: 'total_interest_paid',
      header: 'Total Interest (₱)',
      width: '130px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs tabular-nums text-amber-400 font-bold">
          {Number(v) > 0 ? Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
        </span>
      )
    },
    {
      key: 'current_balance',
      header: 'Current Bal (₱)',
      width: '140px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs tabular-nums font-black text-white">
          ₱{Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'entries_count',
      header: 'Movements',
      width: '100px',
      align: 'center',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
          {v || 0}
        </span>
      )
    }
  ], []);

  const openPrintModal = (account?: SubsidiaryLedgerAccount) => {
    setPrintTargetAccount(account || null);
    setIsPrintModalOpen(true);
  };

  const activeBranchName = branches.find(b => b.id === branchId)?.name || 'All Branches';

  return (
    <div className="space-y-6">
      {/* Header and Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Cooperative Subsidiary Ledgers (SL)
              </h2>
              <p className="text-xs text-slate-400">
                Audit-compliant sub-ledger accounts tracking individual movements, interest, repayments, and balances
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Excel View Mode Button */}
          <button
            onClick={() => setViewMode(viewMode === 'excel' ? 'cards' : 'excel')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              viewMode === 'excel'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700'
            }`}
            title="Toggle Excel Spreadsheet Grid View"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{viewMode === 'excel' ? 'Statements View' : 'Excel View'}</span>
          </button>

          <button
            onClick={() => openPrintModal()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/40 transition cursor-pointer"
            title="Open printable official statement or export as PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official Ledger / PDF</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refresh Ledger Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Financial Movement Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Disbursed
          </span>
          <p className="text-sm sm:text-base font-bold font-mono text-white mt-1">
            {formatCurrency(summary.total_loans_disbursed)}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Loan Releases</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Principal Repaid
          </span>
          <p className="text-sm sm:text-base font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(summary.total_principal_collected)}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Credits Applied</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Interest Collected
          </span>
          <p className="text-sm sm:text-base font-bold font-mono text-amber-400 mt-1">
            {formatCurrency(summary.total_interest_collected)}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Revenue Realized</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Outstanding Loans
          </span>
          <p className="text-sm sm:text-base font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(summary.total_outstanding_loans)}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Remaining Principal</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Savings Deposits
          </span>
          <p className="text-sm sm:text-base font-bold font-mono text-teal-400 mt-1">
            {formatCurrency(summary.total_savings_balance)}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">Member Net Savings</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Share Capital (CBU)
          </span>
          <p className="text-sm sm:text-base font-bold font-mono text-indigo-400 mt-1">
            {formatCurrency(summary.total_share_capital_balance)}
          </p>
          <span className="text-[10px] text-slate-500 block mt-0.5">{summary.total_shares_count.toLocaleString()} Total Shares</span>
        </div>
      </div>

      {/* Comprehensive Filter Workbench */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Ledger Type Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-xl">
            <button
              onClick={() => setLedgerType('all')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                ledgerType === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Ledgers</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">
                {accounts.length}
              </span>
            </button>

            <button
              onClick={() => setLedgerType('loans')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                ledgerType === 'loans'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Loans Ledger</span>
            </button>

            <button
              onClick={() => setLedgerType('savings')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                ledgerType === 'savings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Savings Deposits</span>
            </button>

            <button
              onClick={() => setLedgerType('share_capital')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                ledgerType === 'share_capital'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Share Capital (CBU)</span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setViewMode('excel')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1.5 cursor-pointer ${
                  viewMode === 'excel'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel View</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">
                  {excelSubTab === 'entries' ? filteredEntries.length : filteredAccounts.length}
                </span>
              </button>

              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Account Statements
              </button>

              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Audit Movement Grid
              </button>
            </div>

            {viewMode === 'excel' && (
              <div className="flex items-center p-1 bg-slate-950/70 border border-slate-800 rounded-xl text-xs">
                <button
                  onClick={() => setExcelSubTab('entries')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    excelSubTab === 'entries'
                      ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Transactions ({filteredEntries.length})
                </button>
                <button
                  onClick={() => setExcelSubTab('accounts')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                    excelSubTab === 'accounts'
                      ? 'bg-slate-800 text-emerald-400 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Accounts ({filteredAccounts.length})
                </button>
              </div>
            )}

            {viewMode === 'cards' && (
              <div className="flex items-center space-x-1">
                <button
                  onClick={expandAll}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800/80">
          {/* Member Search / Selector */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <User className="w-3 h-3 text-emerald-400" />
                <span>Filter by Member</span>
              </span>
              {selectedMemberId !== 'all' && (
                <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded font-normal">
                  Active Filter
                </span>
              )}
            </label>
            <SearchableSelect
              options={memberOptions}
              value={selectedMemberId}
              onChange={setSelectedMemberId}
              placeholder="Search member name or ID..."
              searchPlaceholder="Type member name, ID, or phone..."
              alwaysShowSearch={true}
              icon={<User className="w-3.5 h-3.5 text-emerald-400" />}
              buttonClassName="py-1.5 text-xs bg-slate-950"
            />
          </div>

          {/* Date Scope Filter */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span>Ledger Movement Scope</span>
            </label>
            <select
              value={dateScope}
              onChange={(e) => setDateScope(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">Complete History (All Movements)</option>
              <option value="period">Current Cutoff ({periodName})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">
              Account Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Approved">Approved</option>
              <option value="Released">Released</option>
              <option value="Fully Paid">Fully Paid / Closed</option>
              <option value="Past Due">Past Due / Delinquent</option>
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1 block">
              Search Accounts or Vouchers
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account #, OR #, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
          <p className="text-sm font-medium">Reconciling subsidiary ledgers and computing running balances...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No Accounts Match Criteria</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try resetting the ledger filter, clearing the member search query, or choosing a wider date range.
          </p>
        </div>
      ) : viewMode === 'excel' ? (
        /* View 1: Excel Grid View for Subsidiary Ledger */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {excelSubTab === 'entries' ? (
            <ExcelGridTable
              data={filteredEntries}
              columns={entryColumns}
              title={`Subsidiary Ledger Postings · ${periodName}`}
              subtitle={`Displaying ${filteredEntries.length} chronological sub-ledger transactions for ${ledgerType.toUpperCase()} accounts.`}
              exportFileName={`subsidiary_ledger_entries_${ledgerType}_${Date.now()}`}
              defaultSortKey="date"
              defaultSortDir="asc"
              isLoading={isLoading}
              emptyMessage="No subsidiary transactions found matching the selected filters."
              toolbarExtra={
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Dataset:</span>
                  <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                    <button
                      onClick={() => setExcelSubTab('entries')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                        excelSubTab === 'entries'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Entries ({filteredEntries.length})
                    </button>
                    <button
                      onClick={() => setExcelSubTab('accounts')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                        excelSubTab === 'accounts'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Accounts ({filteredAccounts.length})
                    </button>
                  </div>
                </div>
              }
            />
          ) : (
            <ExcelGridTable
              data={filteredAccounts}
              columns={accountColumns}
              title={`Subsidiary Account Master · ${periodName}`}
              subtitle={`Summary balances and details for ${filteredAccounts.length} subsidiary accounts.`}
              exportFileName={`subsidiary_account_master_${ledgerType}_${Date.now()}`}
              defaultSortKey="account_number"
              defaultSortDir="asc"
              isLoading={isLoading}
              emptyMessage="No subsidiary accounts found matching the selected filters."
              toolbarExtra={
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400">Dataset:</span>
                  <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                    <button
                      onClick={() => setExcelSubTab('entries')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                        excelSubTab === 'entries'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Entries ({filteredEntries.length})
                    </button>
                    <button
                      onClick={() => setExcelSubTab('accounts')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition ${
                        excelSubTab === 'accounts'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Accounts ({filteredAccounts.length})
                    </button>
                  </div>
                </div>
              }
            />
          )}
        </div>
      ) : viewMode === 'cards' ? (
        /* View 1: Account Statement Cards */
        <div className="space-y-4">
          {filteredAccounts.map((account) => {
            const isExpanded = expandedAccountIds.has(account.id);
            const isLoan = account.ledger_type === 'loan' || account.ledger_type === 'loans';
            const isSavings = account.ledger_type === 'savings' || account.ledger_type === 'saving';
            const isCbu = account.ledger_type === 'share_capital' || account.ledger_type === 'cbu';

            return (
              <div
                key={account.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition"
              >
                {/* Account Card Header */}
                <div
                  onClick={() => toggleAccountExpand(account.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 select-none transition"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className={`p-2.5 rounded-xl border mt-0.5 ${
                      isLoan
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : isSavings
                        ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    }`}>
                      {isLoan ? <CreditCard className="w-5 h-5" /> : isSavings ? <PiggyBank className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          #{account.account_number}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                          {account.product_name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          account.status === 'Active' || account.status === 'Released'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : account.status === 'Fully Paid'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {account.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mt-1.5">
                        <span className="font-semibold text-white">
                          {account.member_name}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="font-mono text-slate-400">
                          CID: {account.member_no}
                        </span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-400">
                          Branch: {account.branch_name || 'Main Branch'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        {isLoan ? 'Outstanding Principal' : 'Current Balance'}
                      </span>
                      <p className="text-base font-black font-mono text-emerald-400">
                        {formatCurrency(account.current_balance)}
                      </p>
                      <span className="text-[10px] text-slate-500 block">
                        {account.entries_count} recorded movements
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPrintModal(account);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                        title="Print this Account's Official Subsidiary Ledger"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      <div className="p-1 rounded-lg text-slate-400">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Ledger Movement Table */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/60 p-4 sm:p-5 space-y-4">
                    {/* Micro Metadata Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                      {isLoan ? (
                        <>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Disbursed Principal</span>
                            <span className="font-mono font-bold text-white">{formatCurrency(account.original_principal)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Interest & Terms</span>
                            <span className="font-medium text-slate-200">{account.interest_rate}% p.a. · {account.terms_months} mos</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Principal Repaid</span>
                            <span className="font-mono font-bold text-emerald-400">{formatCurrency(account.total_principal_paid)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Interest & Fees Paid</span>
                            <span className="font-mono font-bold text-amber-400">
                              {formatCurrency((account.total_interest_paid || 0) + (account.total_penalty_paid || 0))}
                            </span>
                          </div>
                        </>
                      ) : isCbu ? (
                        <>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Subscribed Shares</span>
                            <span className="font-mono font-bold text-white">{account.subscribed_shares || 0} shares</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Subscribed Amount</span>
                            <span className="font-mono font-bold text-slate-200">{formatCurrency(account.subscribed_amount)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Paid-Up Capital</span>
                            <span className="font-mono font-bold text-indigo-400">{formatCurrency(account.current_balance)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Account Status</span>
                            <span className="font-bold text-emerald-400">{account.status}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Annual Interest Rate</span>
                            <span className="font-medium text-white">{account.interest_rate || 0}% p.a.</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Deposits</span>
                            <span className="font-mono font-bold text-teal-400">{formatCurrency(account.total_deposits)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Withdrawals</span>
                            <span className="font-mono font-bold text-rose-400">{formatCurrency(account.total_withdrawals)}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase font-semibold block">Current Net Balance</span>
                            <span className="font-mono font-bold text-emerald-400">{formatCurrency(account.current_balance)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Chronological Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                            <th className="py-2.5 px-3 font-semibold">Date</th>
                            <th className="py-2.5 px-3 font-semibold">Ref / OR #</th>
                            <th className="py-2.5 px-3 font-semibold">Particulars</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Debit / Release (₱)</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Credit / Payment (₱)</th>
                            {isLoan && (
                              <>
                                <th className="py-2.5 px-3 font-semibold text-right text-emerald-400">Principal Paid (₱)</th>
                                <th className="py-2.5 px-3 font-semibold text-right text-amber-400">Interest Paid (₱)</th>
                                <th className="py-2.5 px-3 font-semibold text-right text-slate-400">Penalty & Fees (₱)</th>
                              </>
                            )}
                            <th className="py-2.5 px-3 font-semibold text-right">Outstanding Balance (₱)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 font-mono">
                          {account.entries.length === 0 ? (
                            <tr>
                              <td colSpan={isLoan ? 9 : 6} className="py-6 text-center text-slate-500 italic">
                                No movements recorded in this statement.
                              </td>
                            </tr>
                          ) : (
                            account.entries.map((entry) => (
                              <tr key={entry.id} className="hover:bg-slate-800/30 transition">
                                <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{entry.date}</td>
                                <td className="py-2 px-3 text-emerald-400 font-bold whitespace-nowrap">{entry.ref_no}</td>
                                <td className="py-2 px-3 font-sans text-slate-200">
                                  <span>{entry.description}</span>
                                </td>
                                <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap">
                                  {entry.debit > 0 ? entry.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap">
                                  {entry.credit > 0 ? entry.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                </td>
                                {isLoan && (
                                  <>
                                    <td className="py-2 px-3 text-right text-emerald-400 font-bold whitespace-nowrap">
                                      {entry.principal_paid && entry.principal > 0 ? entry.principal.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="py-2 px-3 text-right text-amber-400 font-bold whitespace-nowrap">
                                      {entry.interest_paid && entry.interest_paid > 0 ? entry.interest_paid.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                    <td className="py-2 px-3 text-right text-slate-400 whitespace-nowrap">
                                      {((entry.penalty_paid || 0) + (entry.fee_paid || 0)) > 0 ? ((entry.penalty_paid || 0) + (entry.fee_paid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                                    </td>
                                  </>
                                )}
                                <td className="py-2 px-3 text-right font-black text-white whitespace-nowrap">
                                  {entry.running_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        <tfoot className="bg-slate-900 font-bold border-t border-slate-800">
                          <tr>
                            <td colSpan={3} className="py-2 px-3 text-right text-slate-400 font-sans uppercase text-[10px]">
                              Ending Statement Balance
                            </td>
                            <td className="py-2 px-3 text-right text-slate-300 font-mono">
                              {account.entries.reduce((s, e) => s + (e.debit || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-300 font-mono">
                              {account.entries.reduce((s, e) => s + (e.credit || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            {isLoan && (
                              <>
                                <td className="py-2 px-3 text-right text-emerald-400 font-mono">
                                  {(account.total_principal_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-3 text-right text-amber-400 font-mono">
                                  {(account.total_interest_paid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-2 px-3 text-right text-slate-400 font-mono">
                                  {((account.total_penalty_paid || 0) + (account.total_fees_paid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                              </>
                            )}
                            <td className="py-2 px-3 text-right text-emerald-400 font-mono font-black text-xs">
                              {account.current_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* View 2: Audit Flat Grid View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Displaying <strong>{filteredEntries.length}</strong> transactions across active accounts</span>
            <span className="font-mono text-emerald-400">Chronological Sort: Oldest to Newest</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 font-semibold">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Account #</th>
                  <th className="py-3 px-3">Member Name</th>
                  <th className="py-3 px-3">Ref / OR #</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-right">Debit (₱)</th>
                  <th className="py-3 px-3 text-right">Credit (₱)</th>
                  <th className="py-3 px-3 text-right text-emerald-400">Principal Paid</th>
                  <th className="py-3 px-3 text-right text-amber-400">Interest Paid</th>
                  <th className="py-3 px-3 text-right text-slate-400">Penalty & Fees</th>
                  <th className="py-3 px-3 text-right">Balance (₱)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {filteredEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-300 whitespace-nowrap">{e.date}</td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        e.ledger_type === 'loan'
                          ? 'bg-amber-500/10 text-amber-400'
                          : e.ledger_type === 'savings'
                          ? 'bg-teal-500/10 text-teal-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}>
                        {e.ledger_type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-emerald-400 font-bold whitespace-nowrap">{e.account_number}</td>
                    <td className="py-2 px-3 font-sans text-white whitespace-nowrap">{e.member_name}</td>
                    <td className="py-2 px-3 text-slate-400 whitespace-nowrap">{e.ref_no}</td>
                    <td className="py-2 px-3 font-sans text-slate-200">{e.description}</td>
                    <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap">
                      {e.debit > 0 ? e.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300 whitespace-nowrap">
                      {e.credit > 0 ? e.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-emerald-400 font-bold whitespace-nowrap">
                      {e.principal_paid && e.principal_paid > 0 ? e.principal_paid.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-amber-400 font-bold whitespace-nowrap">
                      {e.interest_paid && e.interest_paid > 0 ? e.interest_paid.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-400 whitespace-nowrap">
                      {((e.penalty_paid || 0) + (e.fee_paid || 0)) > 0 ? ((e.penalty_paid || 0) + (e.fee_paid || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-black text-white whitespace-nowrap">
                      {e.running_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official CDA Printable & Downloadable PDF Modal */}
      {isPrintModalOpen && (
        <PrintableSubsidiaryLedgerModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          coopProfile={coopProfile}
          currentUser={currentUser}
          periodName={periodName}
          startDate={startDate}
          endDate={endDate}
          branchName={activeBranchName}
          ledgerTypeFilter={ledgerType}
          selectedAccount={printTargetAccount}
          accounts={filteredAccounts}
          summary={summary}
        />
      )}
    </div>
  );
};
