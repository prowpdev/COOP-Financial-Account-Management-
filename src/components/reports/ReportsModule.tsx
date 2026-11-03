import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  Layers,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  BookOpen,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Clock,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { PrintableReportModal } from './PrintableReportModal';
import { SubsidiaryLedgerReport } from './SubsidiaryLedgerReport';
import { AccountLedgerReport } from './AccountLedgerReport';
import { SearchableSelect, SearchableOption } from '../common/SearchableSelect';
import { api } from '../../services/api';
import { Account, Branch, Member, User, CoopProfile, JournalEntry } from '../../types';

interface ReportsModuleProps {
  accounts: Account[];
  branches: Branch[];
  members?: Member[];
  currentUser?: User;
  coopProfile?: CoopProfile;
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
}

interface AccountingPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'Open' | 'Closed' | string;
  fiscal_year?: string;
}

type SubmoduleTab = 'subsidiary_ledger' | 'journal_ledger' | 'account_ledger' | 'member_ledger';

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  accounts = [],
  branches = [],
  members: propMembers = [],
  currentUser,
  coopProfile,
  selectedBranchId,
  onSelectBranch
}) => {
  // Accounting Periods state
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Primary Universal Filters
  const [selectedBranch, setSelectedBranch] = useState<string>(
    selectedBranchId || currentUser?.branch_id || 'all'
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [membersList, setMembersList] = useState<Member[]>(propMembers);

  // GL Category & Account Filters (for Journal & GL views)
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGlCodes, setSelectedGlCodes] = useState<Set<string>>(new Set());
  const [selectedQuickGl, setSelectedQuickGl] = useState<string>('all');
  const [journalSearchQuery, setJournalSearchQuery] = useState('');

  // Submodule Tab
  const [activeTab, setActiveTab] = useState<SubmoduleTab>('subsidiary_ledger');

  // Loaded Datasets
  const [glLines, setGlLines] = useState<any[]>([]);
  const [memberTransactions, setMemberTransactions] = useState<any[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Sync branches prop
  useEffect(() => {
    if (selectedBranchId !== undefined) {
      setSelectedBranch(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Sync initial GL accounts
  useEffect(() => {
    if (accounts.length > 0 && selectedGlCodes.size === 0) {
      const allCodes = new Set(
        accounts.map(a => String(a.account_code || a.code || a.id))
      );
      setSelectedGlCodes(allCodes);
    }
  }, [accounts]);

  // Load accounting periods & members
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [periodsRes, membersRes] = await Promise.all([
          api.getAccountingPeriods().catch(() => ({ success: false, data: [] })),
          api.getMembers().catch(() => ({ success: false, data: [] }))
        ]);

        let loadedPeriods: AccountingPeriod[] = periodsRes.data || [];
        if (loadedPeriods.length === 0) {
          loadedPeriods = [
            { id: 'period_2026_01', name: 'January 2026', start_date: '2026-01-01', end_date: '2026-01-31', status: 'Closed' },
            { id: 'period_2026_02', name: 'February 2026', start_date: '2026-02-01', end_date: '2026-02-28', status: 'Closed' },
            { id: 'period_2026_03', name: 'March 2026', start_date: '2026-03-01', end_date: '2026-03-31', status: 'Open' },
            { id: 'period_2026_04', name: 'April 2026', start_date: '2026-04-01', end_date: '2026-04-30', status: 'Open' },
            { id: 'period_2026_05', name: 'May 2026', start_date: '2026-05-01', end_date: '2026-05-31', status: 'Open' },
            { id: 'period_2026_06', name: 'June 2026', start_date: '2026-06-01', end_date: '2026-06-30', status: 'Open' },
            { id: 'period_2026_07', name: 'July 2026', start_date: '2026-07-01', end_date: '2026-07-31', status: 'Open' },
            { id: 'period_2026_08', name: 'August 2026', start_date: '2026-08-01', end_date: '2026-08-31', status: 'Open' },
            { id: 'period_2026_09', name: 'September 2026', start_date: '2026-09-01', end_date: '2026-09-30', status: 'Open' },
            { id: 'period_2026_10', name: 'October 2026', start_date: '2026-10-01', end_date: '2026-10-31', status: 'Open' },
            { id: 'period_2026_11', name: 'November 2026', start_date: '2026-11-01', end_date: '2026-11-30', status: 'Open' },
            { id: 'period_2026_12', name: 'December 2026', start_date: '2026-12-01', end_date: '2026-12-31', status: 'Open' }
          ];
        }
        setPeriods(loadedPeriods);

        const octPeriod = loadedPeriods.find(p => p.id === 'period_2026_10' || p.name.toLowerCase().includes('october'));
        if (octPeriod) {
          setSelectedPeriodId(octPeriod.id);
        } else if (loadedPeriods.length > 0) {
          setSelectedPeriodId(loadedPeriods[0].id);
        }

        if (membersRes.data && membersRes.data.length > 0) {
          setMembersList(membersRes.data);
        }
      } catch (err) {
        console.error('Failed to load initial report references:', err);
      }
    };

    fetchInitialData();
  }, []);

  // Selected period object
  const activePeriod = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId) || periods[0] || null;
  }, [periods, selectedPeriodId]);

  // Load Report Data
  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const startDate = isCustomDateRange ? customStartDate : activePeriod?.start_date;
      const endDate = isCustomDateRange ? customEndDate : activePeriod?.end_date;

      const [glRes, memRes, jnlRes] = await Promise.all([
        api.getReportJournalEntries({
          period_id: isCustomDateRange ? undefined : selectedPeriodId,
          branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
          member_id: selectedMemberId !== 'all' ? selectedMemberId : undefined,
          start_date: startDate,
          end_date: endDate
        }),
        api.getReportMemberTransactions({
          period_id: isCustomDateRange ? undefined : selectedPeriodId,
          branch_id: selectedBranch !== 'all' ? selectedBranch : undefined,
          member_id: selectedMemberId !== 'all' ? selectedMemberId : undefined,
          start_date: startDate,
          end_date: endDate
        }),
        api.getJournals(selectedBranch !== 'all' ? selectedBranch : undefined).catch(() => ({ success: false, data: [] }))
      ]);

      if (glRes.success && glRes.data) {
        setGlLines(glRes.data.lines || []);
      }
      if (memRes.success && memRes.data) {
        setMemberTransactions(memRes.data.transactions || []);
      }
      if (jnlRes && jnlRes.data) {
        setJournals(Array.isArray(jnlRes.data) ? jnlRes.data : []);
      }
    } catch (err: any) {
      console.error('Failed to load ledger transactions:', err);
      setErrorMessage(err.message || 'Error retrieving accounting period transactions.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriodId, selectedBranch, selectedMemberId, isCustomDateRange, customStartDate, customEndDate, activePeriod]);

  // Trigger load on filter changes
  useEffect(() => {
    if (selectedPeriodId || isCustomDateRange) {
      loadReportData();
    }
  }, [selectedPeriodId, selectedBranch, selectedMemberId, isCustomDateRange, loadReportData]);

  // Handle branch change
  const handleBranchChange = (newBranch: string) => {
    setSelectedBranch(newBranch);
    if (onSelectBranch) {
      onSelectBranch(newBranch);
    }
  };

  // Category quick filter handler
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      const allCodes = new Set(accounts.map(a => String(a.account_code || a.code || a.id)));
      setSelectedGlCodes(allCodes);
      setSelectedQuickGl('all');
    } else {
      const filteredAccounts = accounts.filter(a => {
        const cat = (a.category || a.type || '').toLowerCase();
        if (category === 'Revenue') return cat === 'revenue' || cat === 'income';
        return cat === category.toLowerCase();
      });
      const codes = new Set(filteredAccounts.map(a => String(a.account_code || a.code || a.id)));
      setSelectedGlCodes(codes);
      setSelectedQuickGl('all');
    }
  };

  // Specific GL account selector handler
  const handleQuickGlChange = (val: string) => {
    setSelectedQuickGl(val);
    if (!val || val === 'all') {
      if (selectedCategory !== 'all') {
        handleCategorySelect(selectedCategory);
      } else {
        const allCodes = new Set(accounts.map(a => String(a.account_code || a.code || a.id)));
        setSelectedGlCodes(allCodes);
      }
    } else {
      setSelectedGlCodes(new Set([val]));
    }
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSelectedBranch('all');
    if (onSelectBranch) onSelectBranch('all');
    setSelectedMemberId('all');
    setSelectedCategory('all');
    setSelectedQuickGl('all');
    setJournalSearchQuery('');
    setIsCustomDateRange(false);
    const allCodes = new Set(accounts.map(a => String(a.account_code || a.code || a.id)));
    setSelectedGlCodes(allCodes);
    if (periods.length > 0) {
      const octPeriod = periods.find(p => p.id === 'period_2026_10' || p.name.toLowerCase().includes('october'));
      setSelectedPeriodId(octPeriod ? octPeriod.id : periods[0].id);
    }
  };

  const isFilterActive =
    selectedBranch !== 'all' ||
    selectedMemberId !== 'all' ||
    selectedCategory !== 'all' ||
    selectedQuickGl !== 'all' ||
    isCustomDateRange ||
    journalSearchQuery.trim() !== '';

  // Filtered GL Lines
  const filteredGlLines = useMemo(() => {
    let lines = glLines;

    // Filter by selected GL accounts
    if (selectedGlCodes.size > 0 && selectedGlCodes.size < accounts.length) {
      lines = lines.filter(line => {
        const code = String(line.account_code || line.account_id);
        return selectedGlCodes.has(code) || selectedGlCodes.has(line.account_id);
      });
    }

    // Filter by text search query
    if (journalSearchQuery.trim()) {
      const q = journalSearchQuery.toLowerCase();
      lines = lines.filter(l =>
        (l.voucher_number || '').toLowerCase().includes(q) ||
        (l.reference_id || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.account_name || '').toLowerCase().includes(q) ||
        (l.account_code || '').toLowerCase().includes(q) ||
        (l.member_name || '').toLowerCase().includes(q)
      );
    }

    return lines;
  }, [glLines, selectedGlCodes, accounts.length, journalSearchQuery]);

  // Filtered Member Transactions
  const filteredMemberTransactions = useMemo(() => {
    return memberTransactions;
  }, [memberTransactions]);

  // Calculated totals for GL Lines
  const glTotals = useMemo(() => {
    const totalDebit = filteredGlLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const totalCredit = filteredGlLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return {
      totalDebit,
      totalCredit,
      netBalance: totalDebit - totalCredit,
      rowCount: filteredGlLines.length
    };
  }, [filteredGlLines]);

  // Calculated totals for Member Transactions
  const memberTotals = useMemo(() => {
    const totalDebit = filteredMemberTransactions.reduce((s, t) => s + (Number(t.debit) || 0), 0);
    const totalCredit = filteredMemberTransactions.reduce((s, t) => s + (Number(t.credit) || 0), 0);
    return {
      totalDebit,
      totalCredit,
      netBalance: totalCredit - totalDebit,
      rowCount: filteredMemberTransactions.length
    };
  }, [filteredMemberTransactions]);

  const activeTotals = activeTab === 'journal_ledger' ? glTotals : memberTotals;

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const activeBranchName = useMemo(() => {
    if (selectedBranch === 'all') return 'Consolidated (All Branches)';
    return branches.find(b => b.id === selectedBranch)?.name || 'Branch';
  }, [selectedBranch, branches]);

  const selectedMemberName = useMemo(() => {
    if (selectedMemberId === 'all') return undefined;
    const m = membersList.find(mem => mem.id === selectedMemberId);
    return m ? `${m.member_no || ''} - ${m.first_name} ${m.last_name}` : undefined;
  }, [selectedMemberId, membersList]);

  // Searchable member options
  const memberOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: 'all', label: `All Members (Consolidated - ${membersList.length})`, badge: 'All' },
      ...membersList.map(m => ({
        value: m.id,
        label: `${m.first_name} ${m.last_name}`,
        code: m.member_no || 'MEM',
        description: m.address ? `${m.address} · ${m.contact_no || ''}` : (m.contact_no || ''),
        searchTerms: `${m.member_no || ''} ${m.first_name || ''} ${m.last_name || ''} ${m.contact_no || ''} ${m.tin || ''}`
      }))
    ];
  }, [membersList]);

  // Searchable GL account options
  const glAccountOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: 'all', label: `All GL Accounts (${accounts.length} Total)`, badge: 'All' },
      ...accounts.map(a => {
        const code = String(a.account_code || a.code || a.id);
        return {
          value: code,
          label: a.name,
          code: code,
          type: a.type || a.category,
          searchTerms: `${code} ${a.name} ${a.type || a.category || ''} ${a.normal_balance || ''}`
        };
      })
    ];
  }, [accounts]);

  // Excel Grid Columns for GL Lines
  const glColumns: ExcelColumn<any>[] = useMemo(() => [
    {
      key: 'posting_date',
      header: 'Posting Date',
      width: '110px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs text-slate-300">{v}</span>
    },
    {
      key: 'voucher_number',
      header: 'Voucher #',
      width: '130px',
      sortable: true,
      filterable: true,
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {v}
        </span>
      )
    },
    {
      key: 'reference_id',
      header: 'Reference ID / Ref',
      width: '150px',
      sortable: true,
      filterable: true,
      render: (v, row) => (
        <span className="font-mono text-xs font-semibold text-amber-400">
          {v || row.voucher_number || '-'}
        </span>
      )
    },
    {
      key: 'account_code',
      header: 'GL Code',
      width: '100px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs text-slate-400">{v}</span>
    },
    {
      key: 'account_name',
      header: 'Account Title',
      width: '240px',
      sortable: true,
      filterable: true,
      render: (v, row) => (
        <div>
          <span className="font-medium text-xs text-white">{v}</span>
          <span className="block text-[10px] text-slate-400">{row.account_category}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Memo / Description',
      width: '280px',
      sortable: true,
      filterable: true,
      render: (v, row) => (
        <div className="truncate text-xs text-slate-300" title={v}>
          <span>{v}</span>
          {row.member_name && (
            <span className="ml-1 text-[10px] text-emerald-300 font-medium">
              ({row.member_name})
            </span>
          )}
        </div>
      )
    },
    {
      key: 'debit',
      header: 'Debit (₱)',
      width: '130px',
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
      width: '130px',
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
      key: 'branch_name',
      header: 'Branch',
      width: '140px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="text-xs text-slate-400">{v}</span>
    }
  ], []);

  // Excel Grid Columns for Member Transactions
  const memberColumns: ExcelColumn<any>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Date',
      width: '110px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs text-slate-300">{v}</span>
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
      width: '200px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-semibold text-xs text-white">{v}</span>
    },
    {
      key: 'product_type',
      header: 'Product Category',
      width: '140px',
      sortable: true,
      filterable: true,
      render: (v) => (
        <span className="text-xs text-emerald-400 font-medium">
          {v}
        </span>
      )
    },
    {
      key: 'reference_no',
      header: 'Ref / OR #',
      width: '130px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs font-semibold text-amber-400">{v}</span>
    },
    {
      key: 'description',
      header: 'Transaction Details',
      width: '260px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="text-xs text-slate-300 truncate" title={v}>{v}</span>
    },
    {
      key: 'gl_code',
      header: 'GL Code',
      width: '100px',
      sortable: true,
      filterable: true,
      render: (v, row) => (
        <span className="font-mono text-xs text-slate-400" title={row.gl_name}>
          {v}
        </span>
      )
    },
    {
      key: 'debit',
      header: 'Debit / Out (₱)',
      width: '130px',
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
      header: 'Credit / In (₱)',
      width: '130px',
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
      key: 'principal_amount',
      header: 'Principal (₱)',
      width: '130px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v, row) => {
        const val = Number(v || row.principal_paid || row.principal || 0);
        return (
          <span className="font-mono text-xs tabular-nums text-emerald-400 font-semibold">
            {val > 0 ? val.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
          </span>
        );
      }
    },
    {
      key: 'interest_amount',
      header: 'Interest (₱)',
      width: '130px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v, row) => {
        const val = Number(v || row.interest_paid || row.interest || 0);
        return (
          <span className="font-mono text-xs tabular-nums text-amber-400 font-semibold">
            {val > 0 ? val.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
          </span>
        );
      }
    },
    {
      key: 'branch_name',
      header: 'Branch',
      width: '140px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="text-xs text-slate-400">{v}</span>
    }
  ], []);

  // CSV Export handler
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    const periodLabel = activePeriod ? `${activePeriod.name} (${activePeriod.start_date} to ${activePeriod.end_date})` : 'Custom Period';

    if (activeTab === 'journal_ledger') {
      csvContent += `"General Ledger Journal Postings Audit - ${activeBranchName}"\r\n`;
      csvContent += `"Accounting Period:","${periodLabel}"\r\n`;
      csvContent += `"GL Scope:","${selectedGlCodes.size} of ${accounts.length} GL Accounts Selected"\r\n`;
      if (selectedMemberName) csvContent += `"Member Filter:","${selectedMemberName}"\r\n`;
      csvContent += `"Generated:","${new Date().toLocaleString()}"\r\n\r\n`;

      csvContent += `"Posting Date","Voucher Number","GL Code","Account Name","Category","Memo / Description","Member Name","Debit (PHP)","Credit (PHP)","Branch"\r\n`;

      filteredGlLines.forEach(l => {
        const desc = (l.description || '').replace(/"/g, '""');
        const mem = (l.member_name || '').replace(/"/g, '""');
        const acc = (l.account_name || '').replace(/"/g, '""');
        csvContent += `"${l.posting_date}","${l.voucher_number}","${l.account_code}","${acc}","${l.account_category}","${desc}","${mem}",${l.debit || 0},${l.credit || 0},"${l.branch_name}"\r\n`;
      });

      csvContent += `"TOTALS","","","","","",${glTotals.totalDebit},${glTotals.totalCredit},""\r\n`;
    } else {
      csvContent += `"Member Subsidiary Ledger Transaction Report - ${activeBranchName}"\r\n`;
      csvContent += `"Accounting Period:","${periodLabel}"\r\n`;
      if (selectedMemberName) csvContent += `"Member Filter:","${selectedMemberName}"\r\n`;
      csvContent += `"Generated:","${new Date().toLocaleString()}"\r\n\r\n`;

      csvContent += `"Date","Member Number","Member Name","Product Type","Reference #","Description","GL Code","Debit / Out (PHP)","Credit / In (PHP)","Branch"\r\n`;

      filteredMemberTransactions.forEach(t => {
        const mem = (t.member_name || '').replace(/"/g, '""');
        const desc = (t.description || '').replace(/"/g, '""');
        csvContent += `"${t.date}","${t.member_no}","${mem}","${t.product_type}","${t.reference_no}","${desc}","${t.gl_code}",${t.debit || 0},${t.credit || 0},"${t.branch_name}"\r\n`;
      });

      csvContent += `"TOTALS","","","","","","",${memberTotals.totalDebit},${memberTotals.totalCredit},""\r\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `coopflex_${activeTab}_${activePeriod?.id || 'export'}_${Date.now()}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* ========================================================
          1. CLEAN MODULE HEADER (Title, Subtitle & Action Buttons)
          ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Reports & General Ledgers
                </h1>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono font-medium border border-slate-700">
                  CDA Philippine Standards
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official cooperative subsidiary ledgers, double-entry journal vouchers, and audit workbench with synchronized filtering.
              </p>
            </div>
          </div>

          {/* Header Action Buttons (Single Row, Unwrapped) */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Download RFC-4180 CSV export"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer disabled:opacity-50"
              title="Open audit-ready printable document preview"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={loadReportData}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh ledger data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* ========================================================
            2. UNIFIED UNIVERSAL FILTER BAR (Zero Duplicate Fields)
            ======================================================== */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Branch Scope Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Branch Scope</span>
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => handleBranchChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">Consolidated (All Branches)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Accounting Period Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Accounting Period</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomDateRange(!isCustomDateRange)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  {isCustomDateRange ? 'Use Periods' : 'Custom Dates'}
                </button>
              </div>

              {!isCustomDateRange ? (
                <select
                  value={selectedPeriodId}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({period.start_date} → {period.end_date})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
                    title="Start Date"
                  />
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
                    title="End Date"
                  />
                </div>
              )}
            </div>

            {/* Single Authoritative Member Filter */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300 flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Member Filter</span>
                </label>
                {selectedMemberId !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setSelectedMemberId('all')}
                    className="text-[10px] text-rose-400 hover:text-rose-300 cursor-pointer flex items-center space-x-0.5"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <SearchableSelect
                options={memberOptions}
                value={selectedMemberId}
                onChange={setSelectedMemberId}
                placeholder="All Members (Consolidated)..."
                searchPlaceholder="Search member name, ID, or contact..."
                alwaysShowSearch={true}
                icon={<Users className="w-3.5 h-3.5 text-emerald-400" />}
                buttonClassName="py-2 text-xs bg-slate-950"
              />
            </div>

            {/* GL Account Selector (Contextual for Journal & GL Drilldown) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300 flex items-center space-x-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GL Account Filter</span>
                </label>
                {selectedGlCodes.size !== accounts.length && (
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('all')}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    All Accounts
                  </button>
                )}
              </div>
              <SearchableSelect
                options={glAccountOptions}
                value={selectedQuickGl}
                onChange={handleQuickGlChange}
                placeholder="All GL Accounts..."
                searchPlaceholder="Filter accounts by code or name..."
                showGLTypeBadge={true}
                alwaysShowSearch={true}
                icon={<Layers className="w-3.5 h-3.5 text-emerald-400" />}
                buttonClassName="py-2 text-xs bg-slate-950"
              />
            </div>
          </div>

          {/* Active Filter Metadata Summary Strip */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <span>
                Scope: <strong className="text-white font-medium">{activeBranchName}</strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                Period:{' '}
                <strong className="text-white font-medium">
                  {activePeriod ? `${activePeriod.name} (${activePeriod.start_date} → ${activePeriod.end_date})` : `${customStartDate} → ${customEndDate}`}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                Member:{' '}
                <strong className="text-white font-medium">
                  {selectedMemberName || 'All Members'}
                </strong>
              </span>
              {selectedGlCodes.size !== accounts.length && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>
                    GL Filter:{' '}
                    <strong className="text-emerald-400 font-medium">
                      {selectedGlCodes.size} of {accounts.length} Accounts
                    </strong>
                  </span>
                </>
              )}
            </div>

            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-rose-400 transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================
          3. SUBMODULE TABS (Clean Segmented Buttons)
          ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('subsidiary_ledger')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'subsidiary_ledger'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Subsidiary Ledgers (SL)</span>
          </button>

          <button
            onClick={() => setActiveTab('journal_ledger')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'journal_ledger'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Journal Ledgers (JV & Postings)</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-950/70 font-mono text-slate-300">
              {filteredGlLines.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('account_ledger')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'account_ledger'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Account Ledger Drilldown</span>
          </button>

          <button
            onClick={() => setActiveTab('member_ledger')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'member_ledger'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Member Transaction Audit</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-950/70 font-mono text-slate-300">
              {filteredMemberTransactions.length}
            </span>
          </button>
        </div>

        {/* Tab Status / Audit Indicator */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          {activeTab === 'journal_ledger' ? (
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="text-slate-500">Equilibrium:</span>
              <span className="font-mono font-medium text-emerald-400">
                Dr {formatMoney(glTotals.totalDebit)} = Cr {formatMoney(glTotals.totalCredit)}
              </span>
              {Math.abs(glTotals.totalDebit - glTotals.totalCredit) < 0.01 ? (
                <span className="text-[10px] text-emerald-400 flex items-center font-medium ml-1">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-0.5 inline" /> Balanced
                </span>
              ) : (
                <span className="text-[10px] text-rose-400 font-bold ml-1">
                  Variance: ₱{(glTotals.totalDebit - glTotals.totalCredit).toFixed(2)}
                </span>
              )}
            </div>
          ) : activeTab === 'member_ledger' ? (
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="text-slate-500">Active Members in Period:</span>
              <span className="font-mono font-medium text-emerald-400">
                {new Set(filteredMemberTransactions.map(t => t.member_id)).size} Members
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="text-slate-500">Ledger Standard:</span>
              <span className="font-mono font-medium text-emerald-400">
                CDA Philippine Cooperative Accounting Framework
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          4. SUBMODULE VIEW RENDERERS
          ======================================================== */}

      {/* SUBMODULE 1: SUBSIDIARY LEDGER */}
      {activeTab === 'subsidiary_ledger' && (
        <SubsidiaryLedgerReport
          hideHeader={true}
          branchId={selectedBranch}
          branches={branches}
          members={membersList}
          currentUser={currentUser}
          coopProfile={coopProfile}
          periodId={!isCustomDateRange ? selectedPeriodId : undefined}
          startDate={isCustomDateRange ? customStartDate : activePeriod?.start_date}
          endDate={isCustomDateRange ? customEndDate : activePeriod?.end_date}
          periodName={activePeriod?.name || 'Selected Period'}
          selectedMemberId={selectedMemberId}
          onSelectMember={setSelectedMemberId}
        />
      )}

      {/* SUBMODULE 2: JOURNAL LEDGERS (JV & GENERAL JOURNAL) */}
      {activeTab === 'journal_ledger' && (
        <div className="space-y-4">
          {/* Quick Category Filter Bar & Journal Search (Replaces Duplicate Checkbox Drawer) */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 text-xs">
              <span className="text-slate-400 text-[11px] font-medium mr-1.5 flex items-center space-x-1">
                <Filter className="w-3 h-3 text-emerald-400" />
                <span>Account Class:</span>
              </span>
              {[
                { key: 'all', label: 'All Accounts' },
                { key: 'Asset', label: 'Assets' },
                { key: 'Liability', label: 'Liabilities' },
                { key: 'Equity', label: 'Equity' },
                { key: 'Revenue', label: 'Revenue' },
                { key: 'Expense', label: 'Expenses' }
              ].map(cat => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => handleCategorySelect(cat.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedCategory === cat.key
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick Journal Memo/Voucher Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search memo, voucher #, or ref..."
                value={journalSearchQuery}
                onChange={(e) => setJournalSearchQuery(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64"
              />
              {journalSearchQuery && (
                <button
                  type="button"
                  onClick={() => setJournalSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* General Ledger Table View */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <ExcelGridTable
              data={filteredGlLines}
              columns={glColumns}
              title={`Journal Ledgers & Postings · ${activePeriod?.name || 'Current Period'}`}
              subtitle={`Showing ${filteredGlLines.length} double-entry voucher lines filtered by ${activeBranchName}.`}
              exportFileName={`journal_ledgers_${activePeriod?.id || 'export'}`}
              defaultSortKey="posting_date"
              defaultSortDir="asc"
              isLoading={isLoading}
              emptyMessage="No journal voucher postings found matching the selected accounting period and filters."
            />
          </div>

          {/* Financial Equilibrium Summary Strip */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-medium">Total Lines</span>
                <span className="font-mono font-bold text-white text-sm">{glTotals.rowCount}</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-medium">Total Debits (Dr)</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{formatMoney(glTotals.totalDebit)}</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-medium">Total Credits (Cr)</span>
                <span className="font-mono font-bold text-blue-400 text-sm">{formatMoney(glTotals.totalCredit)}</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-medium">Equilibrium Variance</span>
                <span className={`font-mono font-bold text-sm ${Math.abs(glTotals.netBalance) < 0.01 ? 'text-slate-300' : 'text-rose-400'}`}>
                  {formatMoney(glTotals.netBalance)}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMODULE 3: ACCOUNT LEDGER DRILLDOWN */}
      {activeTab === 'account_ledger' && (
        <AccountLedgerReport
          accounts={accounts}
          journals={journals}
          branches={branches}
          selectedBranch={selectedBranch}
          members={membersList}
        />
      )}

      {/* SUBMODULE 4: MEMBER TRANSACTIONS AUDIT */}
      {activeTab === 'member_ledger' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <ExcelGridTable
              data={filteredMemberTransactions}
              columns={memberColumns}
              title={`Member Subsidiary Ledger Audit · ${activePeriod?.name || 'Current Period'}`}
              subtitle={`Historical transactions across Savings, Share Capital (CBU), and Loans for ${activeBranchName}.`}
              exportFileName={`member_subsidiary_${activePeriod?.id || 'export'}`}
              defaultSortKey="date"
              defaultSortDir="asc"
              isLoading={isLoading}
              emptyMessage="No member transactions found matching the selected accounting period and branch."
            />
          </div>

          {/* Member Transactions Total Strip */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-medium">Transactions</span>
                <span className="font-mono font-bold text-white text-sm">{memberTotals.rowCount}</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-medium">Total Outflow / Debits</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{formatMoney(memberTotals.totalDebit)}</span>
              </div>
              <div className="h-6 w-px bg-slate-800 hidden sm:block" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase block font-medium">Total Inflow / Credits</span>
                <span className="font-mono font-bold text-blue-400 text-sm">{formatMoney(memberTotals.totalCredit)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Report Modal */}
      <PrintableReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        coopProfile={coopProfile}
        currentUser={currentUser}
        periodName={activePeriod?.name || 'Selected Period'}
        startDate={activePeriod?.start_date || customStartDate}
        endDate={activePeriod?.end_date || customEndDate}
        branchName={activeBranchName}
        activeSheet={activeTab === 'subsidiary_ledger' ? 'member' : activeTab === 'member_ledger' ? 'member' : 'gl'}
        selectedGlAccountsCount={selectedGlCodes.size}
        totalGlAccountsCount={accounts.length}
        selectedMemberName={selectedMemberName}
        glLines={filteredGlLines}
        memberTransactions={filteredMemberTransactions}
        totals={activeTotals}
      />
    </div>
  );
};
