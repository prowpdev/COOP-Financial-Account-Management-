import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  Square,
  Layers,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  CreditCard
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { PrintableReportModal } from './PrintableReportModal';
import { SubsidiaryLedgerReport } from './SubsidiaryLedgerReport';
import { SearchableSelect, SearchableOption } from '../common/SearchableSelect';
import { api } from '../../services/api';
import { Account, Branch, Member, User, CoopProfile } from '../../types';

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

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  accounts = [],
  branches = [],
  members: propMembers = [],
  currentUser,
  coopProfile,
  selectedBranchId,
  onSelectBranch
}) => {
  // Periods state
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Branch & Member filters
  const [selectedBranch, setSelectedBranch] = useState<string>(
    selectedBranchId || currentUser?.branch_id || 'all'
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [membersList, setMembersList] = useState<Member[]>(propMembers);

  // GL Accounts checkboxes state
  const [selectedGlCodes, setSelectedGlCodes] = useState<Set<string>>(new Set());
  const [selectedQuickGl, setSelectedQuickGl] = useState<string>('all');
  const [glSearchQuery, setGlSearchQuery] = useState('');
  const [isGlPanelExpanded, setIsGlPanelExpanded] = useState(true);

  // Sheet tab state: 'gl' | 'member' | 'subsidiary_ledger'
  const [activeSheet, setActiveSheet] = useState<'gl' | 'member' | 'subsidiary_ledger'>('subsidiary_ledger');

  // Data state
  const [glLines, setGlLines] = useState<any[]>([]);
  const [memberTransactions, setMemberTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Sync branches prop
  useEffect(() => {
    if (selectedBranchId !== undefined) {
      setSelectedBranch(selectedBranchId);
    }
  }, [selectedBranchId]);

  // Sync initial GL accounts: default all selected
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
          // Fallback standard 12 months for 2026
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

        // Default to October 2026 if present (per user prompt example), else first open or latest period
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

      const [glRes, memRes] = await Promise.all([
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
        })
      ]);

      if (glRes.success && glRes.data) {
        setGlLines(glRes.data.lines || []);
      }
      if (memRes.success && memRes.data) {
        setMemberTransactions(memRes.data.transactions || []);
      }
    } catch (err: any) {
      console.error('Failed to load ledger transactions:', err);
      setErrorMessage(err.message || 'Error retrieving accounting period transactions.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriodId, selectedBranch, selectedMemberId, isCustomDateRange, customStartDate, customEndDate, activePeriod]);

  // Re-fetch when period, branch, or member changes
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

  // GL Account toggles
  const handleToggleGlCode = (code: string) => {
    setSelectedGlCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const handleSelectAllGl = () => {
    const all = new Set(accounts.map(a => String(a.account_code || a.code || a.id)));
    setSelectedGlCodes(all);
  };

  const handleClearAllGl = () => {
    setSelectedGlCodes(new Set());
  };

  const handleSelectCategory = (cat: string) => {
    const matched = accounts
      .filter(a => {
        const c = (a.category || a.type || '').toLowerCase();
        return c.includes(cat.toLowerCase());
      })
      .map(a => String(a.account_code || a.code || a.id));

    setSelectedGlCodes(prev => {
      const next = new Set(prev);
      matched.forEach(code => next.add(code));
      return next;
    });
  };

  // Filtered accounts for display in checkbox panel
  const displayedGlAccounts = useMemo(() => {
    if (!glSearchQuery.trim()) return accounts;
    const q = glSearchQuery.toLowerCase();
    return accounts.filter(a => {
      const code = String(a.account_code || a.code || '').toLowerCase();
      const name = (a.name || '').toLowerCase();
      const cat = (a.category || a.type || '').toLowerCase();
      return code.includes(q) || name.includes(q) || cat.includes(q);
    });
  }, [accounts, glSearchQuery]);

  // Filtered GL Lines according to checked GL accounts
  const filteredGlLines = useMemo(() => {
    if (selectedGlCodes.size === 0) return [];
    return glLines.filter(line => {
      const code = String(line.account_code || line.account_id);
      return selectedGlCodes.has(code) || selectedGlCodes.has(line.account_id);
    });
  }, [glLines, selectedGlCodes]);

  // Filtered Member Transactions according to checked GL accounts
  const filteredMemberTransactions = useMemo(() => {
    if (selectedGlCodes.size === 0) return [];
    return memberTransactions.filter(tx => {
      const code = String(tx.gl_code || '');
      return selectedGlCodes.has(code) || selectedGlCodes.has(`acc_${code}`);
    });
  }, [memberTransactions, selectedGlCodes]);

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

  const activeTotals = activeSheet === 'gl' ? glTotals : memberTotals;

  // Formatting helpers
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

  const handleQuickGlChange = (val: string) => {
    setSelectedQuickGl(val);
    if (!val || val === 'all') {
      const allCodes = new Set(accounts.map(a => String(a.account_code || a.code || a.id)));
      setSelectedGlCodes(allCodes);
    } else {
      setSelectedGlCodes(new Set([val]));
    }
  };

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
      width: '140px',
      sortable: true,
      filterable: true,
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {v}
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
      key: 'running_balance',
      header: 'Balance (₱)',
      width: '140px',
      align: 'right',
      type: 'currency',
      sortable: true,
      render: (v) => (
        <span className="font-mono text-xs font-semibold tabular-nums text-emerald-400">
          {Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'branch_name',
      header: 'Branch',
      width: '150px',
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
      width: '120px',
      sortable: true,
      filterable: true,
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-emerald-400">
          {v}
        </span>
      )
    },
    {
      key: 'member_name',
      header: 'Member Full Name',
      width: '220px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-medium text-xs text-white">{v}</span>
    },
    {
      key: 'product_type',
      header: 'Classification',
      width: '160px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="text-xs text-slate-300">{v}</span>
    },
    {
      key: 'reference_no',
      header: 'Ref / OR #',
      width: '140px',
      sortable: true,
      filterable: true,
      render: (v) => <span className="font-mono text-xs text-slate-400">{v}</span>
    },
    {
      key: 'description',
      header: 'Description',
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

    if (activeSheet === 'gl') {
      csvContent += `"General Ledger Transaction Audit Report - ${activeBranchName}"\r\n`;
      csvContent += `"Accounting Period:","${periodLabel}"\r\n`;
      csvContent += `"GL Scope:","${selectedGlCodes.size} of ${accounts.length} GL Accounts Selected"\r\n`;
      if (selectedMemberName) csvContent += `"Member Filter:","${selectedMemberName}"\r\n`;
      csvContent += `"Generated:","${new Date().toLocaleString()}"\r\n\r\n`;

      csvContent += `"Posting Date","Voucher Number","Voucher Type","GL Code","Account Name","Category","Memo / Description","Member Name","Debit (PHP)","Credit (PHP)","Running Balance (PHP)","Branch"\r\n`;

      filteredGlLines.forEach(l => {
        const desc = (l.description || '').replace(/"/g, '""');
        const mem = (l.member_name || '').replace(/"/g, '""');
        const acc = (l.account_name || '').replace(/"/g, '""');
        csvContent += `"${l.posting_date}","${l.voucher_number}","${l.voucher_type}","${l.account_code}","${acc}","${l.account_category}","${desc}","${mem}",${l.debit || 0},${l.credit || 0},${l.running_balance || 0},"${l.branch_name}"\r\n`;
      });

      csvContent += `"TOTALS","","","","","","",${glTotals.totalDebit},${glTotals.totalCredit},${glTotals.netBalance},""\r\n`;
    } else {
      csvContent += `"Member Subsidiary Ledger Transaction Report - ${activeBranchName}"\r\n`;
      csvContent += `"Accounting Period:","${periodLabel}"\r\n`;
      csvContent += `"GL Scope:","${selectedGlCodes.size} of ${accounts.length} GL Accounts Selected"\r\n`;
      if (selectedMemberName) csvContent += `"Member Filter:","${selectedMemberName}"\r\n`;
      csvContent += `"Generated:","${new Date().toLocaleString()}"\r\n\r\n`;

      csvContent += `"Date","Member Number","Member Name","Product Type","Account Number","Reference #","Description","GL Code","Debit / Out (PHP)","Credit / In (PHP)","Branch"\r\n`;

      filteredMemberTransactions.forEach(t => {
        const mem = (t.member_name || '').replace(/"/g, '""');
        const desc = (t.description || '').replace(/"/g, '""');
        csvContent += `"${t.date}","${t.member_no}","${mem}","${t.product_type}","${t.account_number}","${t.reference_no}","${desc}","${t.gl_code}",${t.debit || 0},${t.credit || 0},"${t.branch_name}"\r\n`;
      });

      csvContent += `"TOTALS","","","","","","","",${memberTotals.totalDebit},${memberTotals.totalCredit},""\r\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const fileName = `coopflex_${activeSheet}_report_${activePeriod?.id || 'export'}_${Date.now()}.csv`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/20">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tight flex items-center space-x-2">
                  <span>Reports & General Ledger Workbench</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Audit General Ledger accounts & member transactions filtered by CDA accounting periods with dynamic GL toggling.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              disabled={isLoading || (activeSheet === 'gl' ? filteredGlLines.length === 0 : filteredMemberTransactions.length === 0)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold shadow transition cursor-pointer disabled:opacity-50"
              title="Download RFC-4180 CSV export"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              disabled={isLoading}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50"
              title="Open audit-ready printable document preview"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF / Print</span>
            </button>

            <button
              onClick={loadReportData}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh transaction data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Filter Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Accounting Period Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Accounting Period</span>
              </span>
              <button
                type="button"
                onClick={() => setIsCustomDateRange(!isCustomDateRange)}
                className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
              >
                {isCustomDateRange ? 'Use Periods' : 'Custom Dates'}
              </button>
            </label>

            {!isCustomDateRange ? (
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name} ({period.start_date} to {period.end_date}) · {period.status}
                  </option>
                ))}
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  title="Start Date"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                  title="End Date"
                />
              </div>
            )}
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Branch Scope</span>
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => handleBranchChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Consolidated (All Branches)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Searchable Member Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Member Filter</span>
              </span>
              {selectedMemberId !== 'all' && (
                <span className="text-[10px] text-emerald-400 font-normal">Filtered</span>
              )}
            </label>
            <SearchableSelect
              options={memberOptions}
              value={selectedMemberId}
              onChange={setSelectedMemberId}
              placeholder="Search member name or ID..."
              searchPlaceholder="Type member name, ID, or phone..."
              alwaysShowSearch={true}
              icon={<Users className="w-3.5 h-3.5 text-emerald-400" />}
              buttonClassName="py-2 text-xs bg-slate-950"
            />
          </div>

          {/* Searchable GL Account Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>GL Account Filter</span>
              </span>
              {selectedGlCodes.size !== accounts.length && (
                <span className="text-[10px] text-emerald-400 font-normal">
                  {selectedGlCodes.size} Selected
                </span>
              )}
            </label>
            <SearchableSelect
              options={glAccountOptions}
              value={selectedQuickGl}
              onChange={handleQuickGlChange}
              placeholder="Search GL account code or title..."
              searchPlaceholder="Type GL code, title (Asset, Expense, etc.)..."
              showGLTypeBadge={true}
              alwaysShowSearch={true}
              icon={<Layers className="w-3.5 h-3.5 text-emerald-400" />}
              buttonClassName="py-2 text-xs bg-slate-950"
            />
          </div>

          {/* Active Period Stat Preview */}
          <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Period Cutoff</span>
            <div className="text-xs font-bold text-white mt-0.5 flex items-center space-x-2 truncate">
              <span className="truncate">{activePeriod ? activePeriod.name : 'Custom Selection'}</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold shrink-0 ${activePeriod?.status === 'Open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'}`}>
                {activePeriod?.status || 'Active'}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
              {activePeriod ? `${activePeriod.start_date} → ${activePeriod.end_date}` : `${customStartDate} → ${customEndDate}`}
            </span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 3-Sheet Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveSheet('subsidiary_ledger')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeSheet === 'subsidiary_ledger'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Sheet 1: Subsidiary Ledger (Loans, Savings, CBU)</span>
            <span className="ml-1 text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold uppercase">
              Official Statements
            </span>
          </button>

          <button
            onClick={() => setActiveSheet('gl')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeSheet === 'gl'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sheet 2: General Ledger Postings</span>
            <span className="ml-1 text-[10px] px-2 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {filteredGlLines.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSheet('member')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer ${
              activeSheet === 'member'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Sheet 3: Member Transactions Audit</span>
            <span className="ml-1 text-[10px] px-2 py-0.2 rounded-full bg-slate-950/60 font-mono">
              {filteredMemberTransactions.length}
            </span>
          </button>
        </div>

        {/* Status Equilibrium / Scope Badge */}
        <div className="hidden lg:flex items-center space-x-2 text-xs">
          {activeSheet === 'gl' ? (
            <div className="flex items-center space-x-1.5 text-slate-300">
              <span className="text-slate-500">Equilibrium:</span>
              <span className="font-mono font-semibold text-emerald-400">
                Dr ₱{glTotals.totalDebit.toLocaleString()} = Cr ₱{glTotals.totalCredit.toLocaleString()}
              </span>
              {Math.abs(glTotals.totalDebit - glTotals.totalCredit) < 0.01 ? (
                <span className="text-[10px] text-emerald-400 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 ml-1 inline" /> Balanced
                </span>
              ) : (
                <span className="text-[10px] text-rose-400 font-bold">
                  Variance: ₱{(glTotals.totalDebit - glTotals.totalCredit).toFixed(2)}
                </span>
              )}
            </div>
          ) : activeSheet === 'member' ? (
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="text-slate-500">Active Member Count:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {new Set(filteredMemberTransactions.map(t => t.member_id)).size} Members
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-slate-300">
              <span className="text-slate-500">Regulatory Framework:</span>
              <span className="font-mono font-semibold text-emerald-400">
                CDA Philippine Standards · SL to GL Reconciled
              </span>
            </div>
          )}
        </div>
      </div>

      {activeSheet === 'subsidiary_ledger' ? (
        <SubsidiaryLedgerReport
          branchId={selectedBranch}
          branches={branches}
          members={membersList}
          currentUser={currentUser}
          coopProfile={coopProfile}
          periodId={!isCustomDateRange ? selectedPeriodId : undefined}
          startDate={isCustomDateRange ? customStartDate : activePeriod?.start_date}
          endDate={isCustomDateRange ? customEndDate : activePeriod?.end_date}
          periodName={activePeriod?.name || 'Selected Period'}
        />
      ) : (
        <>
          {/* GL Accounts Checkboxes Selection Drawer */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">General Ledger Accounts Filter</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {selectedGlCodes.size} of {accounts.length} Accounts Included
                </span>
              </div>

              {/* Search & Quick Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <input
                    type="text"
                    placeholder="Search GL code or title..."
                    value={glSearchQuery}
                    onChange={(e) => setGlSearchQuery(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-48 sm:w-56"
                  />
                </div>

                <button
                  onClick={handleSelectAllGl}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium border border-slate-700 transition cursor-pointer"
                >
                  Select All
                </button>
                <button
                  onClick={handleClearAllGl}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium border border-slate-700 transition cursor-pointer"
                >
                  Deselect All
                </button>

                {/* Quick Category Buttons */}
                <button
                  onClick={() => handleSelectCategory('Asset')}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-800 transition cursor-pointer"
                >
                  + Assets
                </button>
                <button
                  onClick={() => handleSelectCategory('Liability')}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-800 transition cursor-pointer"
                >
                  + Liab
                </button>
                <button
                  onClick={() => handleSelectCategory('Equity')}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-800 transition cursor-pointer"
                >
                  + Equity
                </button>
                <button
                  onClick={() => handleSelectCategory('Revenue')}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-800 transition cursor-pointer"
                >
                  + Revenue
                </button>
                <button
                  onClick={() => handleSelectCategory('Expense')}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-[10px] font-semibold border border-slate-800 transition cursor-pointer"
                >
                  + Expense
                </button>

                <button
                  onClick={() => setIsGlPanelExpanded(!isGlPanelExpanded)}
                  className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                  title={isGlPanelExpanded ? 'Collapse GL Panel' : 'Expand GL Panel'}
                >
                  {isGlPanelExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checkbox Grid */}
            {isGlPanelExpanded && (
              <div className="pt-3 max-h-52 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {displayedGlAccounts.map((acc) => {
                    const code = String(acc.account_code || acc.code || acc.id);
                    const isChecked = selectedGlCodes.has(code) || selectedGlCodes.has(acc.id);

                    return (
                      <label
                        key={acc.id}
                        className={`flex items-center space-x-2 p-2 rounded-xl border text-xs cursor-pointer transition select-none ${
                          isChecked
                            ? 'bg-slate-800/90 border-emerald-500/40 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleGlCode(code)}
                          className="rounded border-slate-700 text-emerald-600 focus:ring-0 shrink-0"
                        />
                        <div className="truncate">
                          <span className="font-mono font-semibold text-emerald-400 mr-1.5">{code}</span>
                          <span className="text-xs truncate">{acc.name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Main Excel Grid Container */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {activeSheet === 'gl' ? (
              <ExcelGridTable
                data={filteredGlLines}
                columns={glColumns}
                title={`General Ledger Entries · ${activePeriod?.name || 'Current Period'}`}
                subtitle={`Showing ${filteredGlLines.length} journal postings filtered by ${selectedGlCodes.size} GL accounts.`}
                exportFileName={`gl_entries_${activePeriod?.id || 'export'}`}
                defaultSortKey="posting_date"
                defaultSortDir="asc"
                isLoading={isLoading}
                emptyMessage={
                  selectedGlCodes.size === 0
                    ? 'No GL accounts are selected. Please select at least one GL account from the filter above.'
                    : 'No journal lines found matching the selected accounting period, branch, and GL accounts.'
                }
              />
            ) : (
              <ExcelGridTable
                data={filteredMemberTransactions}
                columns={memberColumns}
                title={`Member Subsidiary Transactions · ${activePeriod?.name || 'Current Period'}`}
                subtitle={`Showing ${filteredMemberTransactions.length} member transactions across Savings, Share Capital, and Loans.`}
                exportFileName={`member_tx_${activePeriod?.id || 'export'}`}
                defaultSortKey="date"
                defaultSortDir="asc"
                isLoading={isLoading}
                emptyMessage={
                  selectedGlCodes.size === 0
                    ? 'No GL accounts are selected. Please select at least one GL account from the filter above.'
                    : 'No member transactions found matching the selected accounting period and filters.'
                }
              />
            )}
          </div>

          {/* Summary Footer Strip */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center space-x-4">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Total Records</span>
                <span className="font-mono font-bold text-white text-sm">{activeTotals.rowCount} Lines</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Sum Debit (Dr)</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{formatMoney(activeTotals.totalDebit)}</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Sum Credit (Cr)</span>
                <span className="font-mono font-bold text-blue-400 text-sm">{formatMoney(activeTotals.totalCredit)}</span>
              </div>
              <div className="h-6 w-px bg-slate-800" />
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Net Balance</span>
                <span className="font-mono font-bold text-white text-sm">{formatMoney(activeTotals.netBalance || 0)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download CSV</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
            </div>
          </div>
        </>
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
        activeSheet={activeSheet === 'subsidiary_ledger' ? 'member' : activeSheet}
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
