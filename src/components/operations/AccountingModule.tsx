import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Calendar,
  FileSpreadsheet,
  LayoutGrid,
  Layers,
  Building2,
  FileText,
  ArrowLeftRight,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  DollarSign,
  Activity,
  Scale
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { AccountLedgerReport } from '../reports/AccountLedgerReport';
import { AccountingMappingsView } from '../config/AccountingMappingsView';
import { CashAccountsConfigView } from '../config/CashAccountsConfigView';
import { CashReceiptJournal } from './CashReceiptJournal';
import { CashDisbursementJournal } from './CashDisbursementJournal';
import { AccountingOverviewDashboard } from './AccountingOverviewDashboard';
import { GLReconciliationView } from './GLReconciliationView';
import { api } from '../../services/api';
import { Account, Branch, JournalEntry, User, AccountingMapping } from '../../types';

interface AccountingModuleProps {
  accounts: Account[];
  branches: Branch[];
  currentUser: User;
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
}

export type AccountingTabKey =
  | 'overview'
  | 'reconciliation'
  | 'general_ledger'
  | 'general_journal'
  | 'cash_receipt_journal'
  | 'cash_disbursement_journal'
  | 'voucher_cards'
  | 'account_report'
  | 'mappings'
  | 'cash_banks';

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  accounts,
  branches,
  currentUser,
  selectedBranchId,
  onSelectBranch
}) => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [mappings, setMappings] = useState<AccountingMapping[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingJV, setIsCreatingJV] = useState(false);
  const [voucherTypeToCreate, setVoucherTypeToCreate] = useState<'JV' | 'OR' | 'CD'>('JV');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<AccountingTabKey>('overview');

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

  const [membersList, setMembersList] = useState<any[]>([]);

  useEffect(() => {
    api.getMembers().then(res => {
      if (res && res.data) setMembersList(res.data);
    }).catch(err => console.error(err));
  }, []);

  const [jvForm, setJvForm] = useState({
    posting_date: new Date().toISOString().split('T')[0],
    branch_id: selectedBranch !== 'all' ? selectedBranch : (branches[0]?.id || 'branch_tar'),
    description: '',
    member_id: '',
    voucher_type: 'JV' as 'JV' | 'OR' | 'CD',
    lines: [
      { account_id: 'acc_5110', debit: 1500, credit: 0, subsidiary_type: '' as any, subsidiary_id: '' as any },
      { account_id: 'acc_1110', debit: 0, credit: 1500, subsidiary_type: '' as any, subsidiary_id: '' as any }
    ]
  });

  const loadJournals = async () => {
    setIsLoading(true);
    try {
      const res = await api.getJournals();
      setJournals(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setJournals([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMappings = async () => {
    try {
      const res = await api.getAccountingMappings();
      if (res && res.data) {
        setMappings(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadJournals();
    loadMappings();
    const handleDataChanged = () => {
      loadJournals();
      loadMappings();
    };
    window.addEventListener('coop:data-changed', handleDataChanged);
    return () => window.removeEventListener('coop:data-changed', handleDataChanged);
  }, []);

  // Columns for General Journal / Voucher Register Table
  const generalJournalCols: ExcelColumn<JournalEntry>[] = [
    {
      key: 'voucher_number',
      header: 'Voucher / Ref No.',
      width: '150px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: (val, item) => {
        const v = String(val || item.voucher_number || '').toUpperCase();
        if (v.includes('-OR-') || v.startsWith('OR')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (v.includes('-CD-') || v.startsWith('CD')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      }
    },
    {
      key: 'branch_id',
      header: 'Branch',
      width: '150px',
      type: 'text',
      sortable: true,
      render: (val) => branches.find(b => b.id === val)?.name || 'Main Branch'
    },
    { key: 'posting_date', header: 'Posting Date', width: '120px', type: 'date', align: 'center', sortable: true },
    {
      key: 'reference_type',
      header: 'Book / Stream',
      width: '150px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: (val) => {
        const s = String(val);
        if (s.includes('PAYMENT') || s.includes('DEPOSIT') || s.includes('RECEIPT')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (s.includes('RELEASE') || s.includes('WITHDRAW') || s.includes('EXPENSE')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      }
    },
    { key: 'description', header: 'Particulars & Explanation', width: '280px', type: 'text', sortable: true },
    {
      key: 'total_debit',
      header: 'Total Debit (₱)',
      width: '150px',
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="font-mono font-bold text-emerald-400">
          ₱{(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'total_credit',
      header: 'Total Credit (₱)',
      width: '150px',
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="font-mono font-bold text-blue-400">
          ₱{(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    { key: 'created_by', header: 'Prepared By', width: '140px', type: 'text', sortable: true },
    {
      key: 'posted_at',
      header: 'Posted Timestamp',
      width: '170px',
      type: 'date',
      sortable: true,
      render: (val) => <span className="text-slate-400">{val ? new Date(val).toLocaleString() : '-'}</span>
    }
  ];

  const safeJournals = Array.isArray(journals) ? journals : [];

  const filteredJournals = useMemo(() => {
    if (selectedBranch === 'all') return safeJournals;
    return safeJournals.filter(j => j && j.branch_id === selectedBranch);
  }, [safeJournals, selectedBranch]);

  // Flattened General Ledger Line Items
  const flattenedLedgerLines = useMemo(() => {
    const lines: any[] = [];
    filteredJournals.forEach(j => {
      (j.lines || []).forEach((l, idx) => {
        lines.push({
          id: `${j.id}_${l.id || idx}`,
          voucher_number: j.voucher_number,
          posting_date: j.posting_date,
          reference_type: j.reference_type,
          voucher_desc: j.description,
          account_code: l.account_code,
          account_name: l.account_name,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          created_by: j.created_by,
          branch_name: branches.find(b => b.id === j.branch_id)?.name || 'Main Branch'
        });
      });
    });
    return lines;
  }, [filteredJournals, branches]);

  const generalLedgerCols: ExcelColumn<any>[] = [
    {
      key: 'voucher_number',
      header: 'Voucher / Ref No.',
      width: '140px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: (val) => {
        const v = String(val || '').toUpperCase();
        if (v.includes('-OR-') || v.startsWith('OR')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (v.includes('-CD-') || v.startsWith('CD')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      }
    },
    { key: 'posting_date', header: 'Posting Date', width: '115px', type: 'date', align: 'center', sortable: true },
    {
      key: 'account_code',
      header: 'Account Code',
      width: '120px',
      type: 'text',
      align: 'center',
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-emerald-400">{val}</span>
    },
    { key: 'account_name', header: 'Account Title', width: '230px', type: 'text', sortable: true },
    { key: 'voucher_desc', header: 'Transaction Particulars & Description', width: '270px', type: 'text', sortable: true },
    {
      key: 'debit',
      header: 'Debit (₱)',
      width: '140px',
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (val) => Number(val) > 0 ? (
        <span className="font-mono font-medium text-emerald-400">
          ₱{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ) : <span className="text-slate-600">-</span>
    },
    {
      key: 'credit',
      header: 'Credit (₱)',
      width: '140px',
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (val) => Number(val) > 0 ? (
        <span className="font-mono font-medium text-blue-400">
          ₱{Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ) : <span className="text-slate-600">-</span>
    },
    {
      key: 'reference_type',
      header: 'Origin Module',
      width: '140px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-slate-800 text-slate-300 border-slate-700'
    },
    { key: 'branch_name', header: 'Branch', width: '140px', type: 'text', sortable: true }
  ];

  const handleAddLine = () => {
    setJvForm(prev => ({
      ...prev,
      lines: [...prev.lines, { account_id: accounts[0]?.id || 'acc_1110', debit: 0, credit: 0, subsidiary_type: '' as any, subsidiary_id: '' as any }]
    }));
  };

  const handleRemoveLine = (index: number) => {
    if (jvForm.lines.length <= 2) {
      alert('A journal entry must have at least 2 balanced debit and credit lines.');
      return;
    }
    setJvForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index)
    }));
  };

  const totalDebit = Number(jvForm.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0).toFixed(2));
  const totalCredit = Number(jvForm.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0).toFixed(2));
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const openCreateModal = (type: 'JV' | 'OR' | 'CD') => {
    setErrorMsg(null);
    setVoucherTypeToCreate(type);
    
    let defaultDesc = '';
    let defaultLines = [
      { account_id: 'acc_5110', debit: 1500, credit: 0, subsidiary_type: '' as any, subsidiary_id: '' as any },
      { account_id: 'acc_1110', debit: 0, credit: 1500, subsidiary_type: '' as any, subsidiary_id: '' as any }
    ];

    if (type === 'OR') {
      defaultDesc = 'Cash collection / Member fee deposit';
      defaultLines = [
        { account_id: 'acc_1110', debit: 1000, credit: 0, subsidiary_type: 'Cash' as any, subsidiary_id: 'cash_01' as any },
        { account_id: 'acc_4210', debit: 0, credit: 1000, subsidiary_type: '' as any, subsidiary_id: '' as any }
      ];
    } else if (type === 'CD') {
      defaultDesc = 'Disbursement for branch operational supplies';
      defaultLines = [
        { account_id: 'acc_5220', debit: 2500, credit: 0, subsidiary_type: '' as any, subsidiary_id: '' as any },
        { account_id: 'acc_1110', debit: 0, credit: 2500, subsidiary_type: 'Cash' as any, subsidiary_id: 'cash_01' as any }
      ];
    }

    setJvForm({
      posting_date: new Date().toISOString().split('T')[0],
      branch_id: selectedBranch !== 'all' ? selectedBranch : (branches[0]?.id || 'branch_tar'),
      description: defaultDesc,
      member_id: '',
      voucher_type: type,
      lines: defaultLines
    });
    setIsCreatingJV(true);
  };

  const handlePostJV = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isBalanced) {
      setErrorMsg(`Debit (₱${totalDebit}) must equal Credit (₱${totalCredit}). The voucher must balance.`);
      return;
    }

    try {
      const res = await api.createManualJournal({
        ...jvForm,
        voucher_type: voucherTypeToCreate,
        performed_by: currentUser.name
      });
      setIsCreatingJV(false);
      const label =
        voucherTypeToCreate === 'OR' ? 'Cash Receipt (OR)' :
        voucherTypeToCreate === 'CD' ? 'Cash Disbursement (CDV)' : 'General Journal Voucher (JV)';
      setSuccessMsg(`${label} ${res.data.voucher_number} posted successfully to the General Ledger.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      loadJournals();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error posting journal entry');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  // Quick stats across all books
  const stats = useMemo(() => {
    let receiptsCount = 0;
    let receiptsSum = 0;
    let disbursementsCount = 0;
    let disbursementsSum = 0;
    let jvCount = 0;

    filteredJournals.forEach(j => {
      const v = (j.voucher_number || '').toUpperCase();
      const t = (j.voucher_type || '').toUpperCase();
      const r = (j.reference_type || '').toUpperCase();

      if (t === 'OR' || v.includes('-OR-') || r.includes('PAYMENT') || r.includes('DEPOSIT') || r.includes('RECEIPT')) {
        receiptsCount++;
        receiptsSum += Number(j.total_debit) || 0;
      } else if (t === 'CD' || v.includes('-CD-') || r.includes('RELEASE') || r.includes('WITHDRAW') || r.includes('EXPENSE')) {
        disbursementsCount++;
        disbursementsSum += Number(j.total_credit) || 0;
      } else {
        jvCount++;
      }
    });

    return { receiptsCount, receiptsSum, disbursementsCount, disbursementsSum, jvCount };
  }, [filteredJournals]);

  return (
    <div className="space-y-6">
      {/* Header and Branch / Action Controls */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Cooperative Books of Accounts</span>
            <span>•</span>
            <span className="text-slate-400">CDA Standard General Ledger & Specialized Journals</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            General Ledger & Cooperative Journals
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Complete cooperative accounting suite maintaining the General Ledger, General Journal, Cash Receipt Journal (CRJ), and Cash Disbursement Journal (CDJ) with double-entry balance enforcement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={selectedBranch}
              onChange={e => handleBranchChange(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Quick-Buttons for New Cooperative Vouchers */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-new-jv"
              onClick={() => openCreateModal('JV')}
              className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              title="Post a General Journal Entry (JV)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New JV</span>
            </button>
            <button
              id="btn-new-or"
              onClick={() => openCreateModal('OR')}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              title="Issue Cash Receipt / Official Receipt (OR)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New OR (CRJ)</span>
            </button>
            <button
              id="btn-new-cdv"
              onClick={() => openCreateModal('CD')}
              className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              title="Issue Cash Disbursement Voucher (CDV)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New CDV (CDJ)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Books Navigation Bar */}
      <div className="flex items-center overflow-x-auto pb-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shadow-inner gap-1.5">
        <button
          id="tab-accounting-overview"
          onClick={() => setViewMode('overview')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'overview'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-300" />
          <span>Accounting Overview</span>
        </button>

        <button
          id="tab-gl-reconciliation"
          onClick={() => setViewMode('reconciliation')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'reconciliation'
              ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400/40'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-400" />
          <span>GL Reconciliation</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">Auto</span>
        </button>

        <button
          id="tab-general-ledger"
          onClick={() => setViewMode('general_ledger')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'general_ledger'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>General Ledger</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">{flattenedLedgerLines.length}</span>
        </button>

        <button
          id="tab-general-journal"
          onClick={() => setViewMode('general_journal')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'general_journal'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>General Journal</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20">{filteredJournals.length}</span>
        </button>

        <button
          id="tab-cash-receipt-journal"
          onClick={() => setViewMode('cash_receipt_journal')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'cash_receipt_journal'
              ? 'bg-emerald-700 text-white shadow-md ring-1 ring-emerald-400/40'
              : 'text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          <span>Cash Receipt Journal</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">CRJ</span>
        </button>

        <button
          id="tab-cash-disbursement-journal"
          onClick={() => setViewMode('cash_disbursement_journal')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'cash_disbursement_journal'
              ? 'bg-amber-700 text-white shadow-md ring-1 ring-amber-400/40'
              : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-amber-400" />
          <span>Cash Disbursement Journal</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold">CDJ</span>
        </button>

        <button
          id="tab-voucher-cards"
          onClick={() => setViewMode('voucher_cards')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'voucher_cards'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Voucher Cards</span>
        </button>

        <button
          id="tab-account-report"
          onClick={() => setViewMode('account_report')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'account_report'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Account Ledger Report</span>
        </button>

        <button
          id="tab-gl-mappings"
          onClick={() => setViewMode('mappings')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'mappings'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>GL Mappings</span>
        </button>

        <button
          id="tab-cash-banks"
          onClick={() => setViewMode('cash_banks')}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
            viewMode === 'cash_banks'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" />
          <span>Cash & Banks</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Manual Entry Modal (General Journal / Cash Receipt / Cash Disbursement) */}
      {isCreatingJV && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>
                    {voucherTypeToCreate === 'OR' && 'Record Cash Receipt (Official Receipt)'}
                    {voucherTypeToCreate === 'CD' && 'Record Cash Disbursement Voucher (CDV)'}
                    {voucherTypeToCreate === 'JV' && 'Create Balanced General Journal Voucher (JV)'}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {voucherTypeToCreate}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Strict double-entry balance enforced. Automatic posting to General Ledger and designated journal book.
                </p>
              </div>
              <button onClick={() => setIsCreatingJV(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePostJV} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Voucher Type</label>
                  <select
                    value={voucherTypeToCreate}
                    onChange={e => {
                      const newType = e.target.value as 'JV' | 'OR' | 'CD';
                      setVoucherTypeToCreate(newType);
                      setJvForm(prev => ({ ...prev, voucher_type: newType }));
                    }}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="JV">General Journal Voucher (JV)</option>
                    <option value="OR">Cash Receipt / Official Receipt (OR)</option>
                    <option value="CD">Cash Disbursement Voucher (CDV)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Posting Date</label>
                  <input
                    type="date"
                    required
                    value={jvForm.posting_date}
                    onChange={e => setJvForm({ ...jvForm, posting_date: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Branch Location</label>
                  <select
                    value={jvForm.branch_id}
                    onChange={e => setJvForm({ ...jvForm, branch_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>

                {/* Associated Member Selector */}
                <div className="sm:col-span-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium">
                      Member / Payee / Payor <span className="text-slate-500 font-normal">(Optional — links to member statement)</span>
                    </label>
                    {jvForm.member_id && (
                      <button
                        type="button"
                        onClick={() => {
                          const m = membersList.find(x => x.id === jvForm.member_id);
                          const name = m ? `${m.first_name} ${m.last_name}` : 'Member';
                          setJvForm(prev => ({
                            ...prev,
                            description: `${name} paid membership and share capital`,
                            lines: [
                              { account_id: 'acc_1110', debit: 1500, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
                              { account_id: 'acc_4210', debit: 0, credit: 500, subsidiary_type: 'Member', subsidiary_id: prev.member_id },
                              { account_id: 'acc_3110', debit: 0, credit: 1000, subsidiary_type: 'Member', subsidiary_id: prev.member_id }
                            ]
                          }));
                        }}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
                      >
                        ⚡ Template: Paid Membership & Share Capital
                      </button>
                    )}
                  </div>
                  <select
                    value={jvForm.member_id}
                    onChange={e => {
                      const mId = e.target.value;
                      const m = membersList.find(x => x.id === mId);
                      setJvForm(prev => ({
                        ...prev,
                        member_id: mId,
                        description: mId ? `${m?.first_name} ${m?.last_name} transaction` : prev.description
                      }));
                    }}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="">None / General Cooperative Entry</option>
                    {membersList.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.first_name} {m.last_name} ({m.member_no}) - {m.branch_name || 'Member'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs text-slate-300 font-medium">Transaction Particulars & Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan dela Cruz share capital deposit or office supplies payment"
                    value={jvForm.description}
                    onChange={e => setJvForm({ ...jvForm, description: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Journal Lines Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Debits & Credits</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    + Add Accounting Line
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {jvForm.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                      <select
                        value={line.account_id}
                        onChange={e => {
                          const copy = [...jvForm.lines];
                          copy[idx].account_id = e.target.value;
                          setJvForm({ ...jvForm, lines: copy });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Debit"
                        value={line.debit || ''}
                        onChange={e => {
                          const copy = [...jvForm.lines];
                          copy[idx].debit = parseFloat(e.target.value) || 0;
                          setJvForm({ ...jvForm, lines: copy });
                        }}
                        className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white text-right"
                      />
                      <input
                        type="number"
                        placeholder="Credit"
                        value={line.credit || ''}
                        onChange={e => {
                          const copy = [...jvForm.lines];
                          copy[idx].credit = parseFloat(e.target.value) || 0;
                          setJvForm({ ...jvForm, lines: copy });
                        }}
                        className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white text-right"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Balances summary */}
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <div>
                    Total Debit: <strong className="text-emerald-400 font-mono">₱{totalDebit.toLocaleString()}</strong>
                  </div>
                  <div>
                    Total Credit: <strong className="text-blue-400 font-mono">₱{totalCredit.toLocaleString()}</strong>
                  </div>
                  <div>
                    Balance Status:{' '}
                    <strong className={isBalanced ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {isBalanced ? '✓ EQUAL & BALANCED' : '⚠ UNBALANCED'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingJV(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-post-journal-voucher"
                  type="submit"
                  disabled={!isBalanced}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  Post to Cooperative Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main View Area Routing Based on viewMode */}
      {viewMode === 'overview' && (
        <AccountingOverviewDashboard
          accounts={accounts}
          journals={journals}
          branches={branches}
          selectedBranch={selectedBranch}
          onNavigateToTab={(tab) => setViewMode(tab)}
          onNewVoucher={(type) => openCreateModal(type)}
        />
      )}

      {viewMode === 'reconciliation' && (
        <GLReconciliationView
          branches={branches}
          selectedBranch={selectedBranch}
          onSelectBranch={(id) => {
            setSelectedBranch(id);
            if (onSelectBranch) onSelectBranch(id);
          }}
          onNavigateToTab={(tab) => setViewMode(tab)}
        />
      )}

      {viewMode === 'general_ledger' && (
        <ExcelGridTable
          title="General Ledger (GL)"
          subtitle="Comprehensive itemized general ledger lines recording all debits and credits across all cooperative accounts, departments, and branch locations."
          exportFileName="general_ledger_cda"
          data={flattenedLedgerLines}
          columns={generalLedgerCols}
          defaultSortKey="posting_date"
          defaultSortDir="desc"
        />
      )}

      {viewMode === 'general_journal' && (
        <ExcelGridTable
          title="General Journal (GJ)"
          subtitle="Chronological book of original entry recording all adjusting entries, opening balances, non-cash transactions, and double-entry journal vouchers."
          exportFileName="general_journal_cda"
          data={filteredJournals}
          columns={generalJournalCols}
          defaultSortKey="posting_date"
          defaultSortDir="desc"
        />
      )}

      {viewMode === 'cash_receipt_journal' && (
        <CashReceiptJournal
          journals={journals}
          branches={branches}
          accounts={accounts}
          selectedBranch={selectedBranch}
          onSelectBranch={handleBranchChange}
          onNewReceipt={() => openCreateModal('OR')}
        />
      )}

      {viewMode === 'cash_disbursement_journal' && (
        <CashDisbursementJournal
          journals={journals}
          branches={branches}
          accounts={accounts}
          selectedBranch={selectedBranch}
          onSelectBranch={handleBranchChange}
          onNewDisbursement={() => openCreateModal('CD')}
        />
      )}

      {viewMode === 'voucher_cards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Displaying {filteredJournals.length} cooperative voucher records</span>
            <span>Vouchers: General Journal (JV), Cash Receipt (OR), Cash Disbursement (CDV)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJournals.map(j => {
              const vNum = (j.voucher_number || '').toUpperCase();
              const vType = (j.voucher_type || '').toUpperCase();
              const isOR = vType === 'OR' || vNum.includes('-OR-') || vNum.startsWith('OR');
              const isCD = vType === 'CD' || vNum.includes('-CD-') || vNum.startsWith('CD');
              
              const borderBadge =
                isOR ? 'border-emerald-500/40 bg-emerald-950/20' :
                isCD ? 'border-amber-500/40 bg-amber-950/20' : 'border-blue-500/30 bg-slate-900';

              const voucherLabel =
                isOR ? 'Cash Receipt / OR' :
                isCD ? 'Cash Disbursement (CDV)' : 'General Journal Voucher (JV)';

              return (
                <div key={j.id} className={`rounded-2xl p-5 border shadow-sm space-y-3 ${borderBadge}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sm text-emerald-400">{j.voucher_number}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                        isOR ? 'bg-emerald-500/20 text-emerald-300' :
                        isCD ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {voucherLabel}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white font-mono">
                        {formatMoney(j.total_debit)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                        {j.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300">{j.description}</p>

                  {/* Lines preview */}
                  <div className="overflow-x-auto border-t border-slate-800/80 pt-2">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="text-[10px] text-slate-500 uppercase font-semibold">
                        <tr>
                          <th className="py-1 px-2">Account Title</th>
                          <th className="py-1 px-2 text-right">Debit (₱)</th>
                          <th className="py-1 px-2 text-right">Credit (₱)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {j.lines?.map(l => (
                          <tr key={l.id}>
                            <td className="py-1 px-2">
                              <span className="text-slate-400 mr-2">{l.account_code}</span>
                              <span className="text-slate-200 font-sans">{l.account_name}</span>
                            </td>
                            <td className="py-1 px-2 text-right text-emerald-400 font-medium">
                              {l.debit > 0 ? formatMoney(l.debit) : '-'}
                            </td>
                            <td className="py-1 px-2 text-right text-blue-400 font-medium">
                              {l.credit > 0 ? formatMoney(l.credit) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                    <span>Officer: {j.created_by}</span>
                    <span>Date: {j.posting_date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === 'account_report' && (
        <AccountLedgerReport
          accounts={accounts}
          journals={journals}
          branches={branches}
          selectedBranch={selectedBranch}
        />
      )}

      {viewMode === 'mappings' && (
        <AccountingMappingsView
          mappings={mappings}
          accounts={accounts}
          currentUser={currentUser}
          onRefresh={() => {
            loadMappings();
            loadJournals();
          }}
          showNotice={(type, msg) => {
            if (type === 'success') {
              setSuccessMsg(msg);
              setTimeout(() => setSuccessMsg(null), 5000);
            } else {
              setErrorMsg(msg);
            }
          }}
        />
      )}

      {viewMode === 'cash_banks' && (
        <CashAccountsConfigView
          accounts={accounts}
          branches={branches}
          currentUser={currentUser}
          onRefresh={() => {
            loadJournals();
          }}
          showNotice={(type, msg) => {
            if (type === 'success') {
              setSuccessMsg(msg);
              setTimeout(() => setSuccessMsg(null), 5000);
            } else {
              setErrorMsg(msg);
            }
          }}
        />
      )}
    </div>
  );
};
