import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Edit2,
  Check,
  X,
  Search,
  BookOpen,
  ArrowLeftRight,
  DollarSign,
  CreditCard,
  PiggyBank,
  Coins,
  Building2,
  Percent,
  FileText,
  Info,
  SlidersHorizontal,
  Plus,
  RotateCcw,
  Trash2,
  Send,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { api } from '../../services/api';
import { Account, AccountingMapping, User } from '../../types';

interface AccountingMappingsViewProps {
  mappings?: AccountingMapping[];
  accounts?: Account[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}

type DomainFilter = 'all' | 'loans' | 'savings' | 'share_capital' | 'cash' | 'fees' | 'expenses';

export const AccountingMappingsView: React.FC<AccountingMappingsViewProps> = ({
  mappings = [],
  accounts = [],
  currentUser,
  onRefresh,
  showNotice
}) => {
  const safeMappings = Array.isArray(mappings) ? mappings : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [activeDomain, setActiveDomain] = useState<DomainFilter>('all');

  // Edit Mapping Modal
  const [editingMapping, setEditingMapping] = useState<AccountingMapping | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDebit, setEditDebit] = useState('');
  const [editCredit, setEditCredit] = useState('');

  // Add New Mapping Modal
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDebit, setNewDebit] = useState(safeAccounts[0]?.id || 'acc_1110');
  const [newCredit, setNewCredit] = useState(safeAccounts[1]?.id || 'acc_2110');

  // Sample JV Simulation Modal
  const [previewMapping, setPreviewMapping] = useState<AccountingMapping | null>(null);
  const [simulationAmount, setSimulationAmount] = useState<number>(50000);
  const [isPostingTestJV, setIsPostingTestJV] = useState(false);

  // Helper to find account by ID, code, or account_code
  const findAccount = (accIdOrCode?: string): Account | undefined => {
    if (!accIdOrCode) return undefined;
    return safeAccounts.find(a =>
      a.id === accIdOrCode ||
      a.code === accIdOrCode ||
      a.account_code === accIdOrCode
    );
  };

  // Categorize mappings by operational domain
  const getDomain = (m: AccountingMapping): DomainFilter => {
    const type = (m.transaction_type || (m as any).event_type || '').toLowerCase();
    const name = (m.name || '').toLowerCase();
    if (type.includes('loan') || name.includes('loan') || name.includes('amortization') || name.includes('disbursement') || name.includes('principal')) return 'loans';
    if (type.includes('saving') || name.includes('saving') || name.includes('deposit') || name.includes('withdrawal')) return 'savings';
    if (type.includes('share') || name.includes('capital') || name.includes('cbu') || type.includes('cbu') || type.includes('subscription')) return 'share_capital';
    if (type.includes('cash') || name.includes('vault') || name.includes('bank') || name.includes('drawer') || name.includes('transfer')) return 'cash';
    if (type.includes('fee') || name.includes('fee') || name.includes('penalty') || name.includes('interest') || type.includes('interest')) return 'fees';
    if (type.includes('expense') || name.includes('expense') || name.includes('supplies') || name.includes('salary') || name.includes('rent')) return 'expenses';
    return 'loans';
  };

  // Plain-English narrative explaining how the debit and credit interact
  const getAccountingStory = (m: AccountingMapping, drAcc?: Account, crAcc?: Account) => {
    const drName = drAcc ? `${drAcc.code || drAcc.account_code || drAcc.id} (${drAcc.name})` : m.debit_account_id;
    const crName = crAcc ? `${crAcc.code || crAcc.account_code || crAcc.id} (${crAcc.name})` : m.credit_account_id;

    const t = (m.transaction_type || (m as any).event_type || '').toUpperCase();
    if (t.includes('DISBURSEMENT') || t.includes('RELEASE')) {
      return `When a borrower receives loan proceeds: Debits ${drName} to record the cooperative's loan receivable asset, and Credits ${crName} to reflect cash disbursed from branch vault/drawer.`;
    }
    if (t.includes('PRINCIPAL') || t.includes('REPAYMENT') || t.includes('LOAN_PAYMENT')) {
      return `When a borrower repays loan principal: Debits ${drName} to record cash collected into drawer/bank, and Credits ${crName} to reduce outstanding loan receivable balance.`;
    }
    if (t.includes('INTEREST')) {
      return `When loan interest is collected: Debits ${drName} for cash received, and Credits ${crName} to recognize earned operating revenue.`;
    }
    if (t.includes('PENALTY')) {
      return `When default penalty is assessed or collected: Debits ${drName} for cash received, and Credits ${crName} to recognize penalty income.`;
    }
    if (t.includes('FEE')) {
      return `When service/filing fees are deducted or paid: Debits ${drName} for cash received or receivable, and Credits ${crName} to recognize non-interest fee revenue.`;
    }
    if (t.includes('SAVINGS') && (t.includes('DEP') || t.includes('DEPOSIT'))) {
      return `When a member deposits into regular savings: Debits ${drName} to receive cash into drawer, and Credits ${crName} to recognize member deposit liability.`;
    }
    if (t.includes('WITHDRAWAL')) {
      return `When a member withdraws from savings: Debits ${drName} to decrease cooperative deposit liability, and Credits ${crName} for cash released to the member.`;
    }
    if (t.includes('SHARE') || t.includes('CBU') || t.includes('CAPITAL')) {
      return `When member contributes to share capital (CBU): Debits ${drName} to record cash received, and Credits ${crName} to increase member paid-up equity.`;
    }
    if (t.includes('EXPENSE')) {
      return `When paying operational expenses: Debits ${drName} to recognize administrative/operating expense, and Credits ${crName} for cash disbursed.`;
    }
    return `Automatic Journal Voucher: Debits ${drName} and Credits ${crName} to maintain general ledger balance.`;
  };

  const getAccountBadge = (type?: string) => {
    switch ((type || '').toLowerCase()) {
      case 'asset':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'liability':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'equity':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'revenue':
      case 'income':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'expense':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  // Domain Counts
  const domainCounts = useMemo(() => {
    const counts: Record<DomainFilter, number> = {
      all: safeMappings.length,
      loans: 0,
      savings: 0,
      share_capital: 0,
      cash: 0,
      fees: 0,
      expenses: 0
    };
    safeMappings.forEach(m => {
      const d = getDomain(m);
      if (counts[d] !== undefined) {
        counts[d]++;
      }
    });
    return counts;
  }, [safeMappings]);

  // Filtered Mappings with bulletproof null checks
  const filteredMappings = useMemo(() => {
    return safeMappings.filter(m => {
      const q = searchQuery.toLowerCase().trim();
      const domain = getDomain(m);
      const matchesDomain = activeDomain === 'all' || domain === activeDomain;

      if (!q) return matchesDomain;

      const drAcc = findAccount(m.debit_account_id);
      const crAcc = findAccount(m.credit_account_id);

      const name = (m.name || '').toLowerCase();
      const desc = (m.description || '').toLowerCase();
      const type = (m.transaction_type || (m as any).event_type || '').toLowerCase();
      const debit = (m.debit_account_id || '').toLowerCase();
      const credit = (m.credit_account_id || '').toLowerCase();

      const drCode = (drAcc?.code || drAcc?.account_code || '').toLowerCase();
      const drName = (drAcc?.name || '').toLowerCase();
      const crCode = (crAcc?.code || crAcc?.account_code || '').toLowerCase();
      const crName = (crAcc?.name || '').toLowerCase();

      const matchesSearch =
        name.includes(q) ||
        desc.includes(q) ||
        type.includes(q) ||
        debit.includes(q) ||
        credit.includes(q) ||
        drCode.includes(q) ||
        drName.includes(q) ||
        crCode.includes(q) ||
        crName.includes(q);

      return matchesSearch && matchesDomain;
    });
  }, [safeMappings, safeAccounts, searchQuery, activeDomain]);

  // Start Edit Mapping
  const handleStartEdit = (m: AccountingMapping) => {
    const drAcc = findAccount(m.debit_account_id);
    const crAcc = findAccount(m.credit_account_id);
    setEditingMapping(m);
    setEditName(m.name || '');
    setEditDesc(m.description || '');
    // Resolve to exact account ID matching options
    setEditDebit(drAcc?.id || m.debit_account_id || (safeAccounts[0]?.id || ''));
    setEditCredit(crAcc?.id || m.credit_account_id || (safeAccounts[1]?.id || ''));
  };

  // Save Edit Mapping
  const handleSaveEdit = async () => {
    if (!editingMapping) return;
    if (!editDebit || !editCredit) {
      showNotice('error', 'Please select both Debit and Credit accounts.');
      return;
    }
    if (editDebit === editCredit) {
      showNotice('error', 'Debit and Credit accounts cannot be identical for balanced double entry.');
      return;
    }

    try {
      await api.updateMapping(editingMapping.id, {
        name: editName.trim() || editingMapping.name,
        description: editDesc.trim() || editingMapping.description,
        debit_account_id: editDebit,
        credit_account_id: editCredit,
        changed_by: currentUser.name || 'Chief Accountant',
        reason: 'Updated accounting GL mapping via configuration interface'
      });
      showNotice('success', `Mapping for "${editName || editingMapping.name}" updated successfully.`);
      setEditingMapping(null);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update mapping rule.');
    }
  };

  // Add New Mapping Rule
  const handleCreateMapping = async () => {
    if (!newName.trim() || !newType.trim()) {
      showNotice('error', 'Rule name and transaction type key are required.');
      return;
    }
    if (!newDebit || !newCredit) {
      showNotice('error', 'Both Debit and Credit accounts must be selected.');
      return;
    }
    if (newDebit === newCredit) {
      showNotice('error', 'Debit and Credit accounts must be distinct.');
      return;
    }

    try {
      await api.createAccountingMapping({
        name: newName.trim(),
        transaction_type: newType.trim().toUpperCase().replace(/\s+/g, '_'),
        description: newDesc.trim() || `Automated journal mapping for ${newName.trim()}`,
        debit_account_id: newDebit,
        credit_account_id: newCredit,
        changed_by: currentUser.name || 'Chief Accountant'
      });
      showNotice('success', `Created new mapping rule "${newName.trim()}".`);
      setIsAddingNew(false);
      setNewName('');
      setNewType('');
      setNewDesc('');
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to create accounting mapping.');
    }
  };

  // Delete Mapping Rule
  const handleDeleteMapping = async (m: AccountingMapping) => {
    if (!window.confirm(`Are you sure you want to delete mapping "${m.name}"? Transactions using this event will no longer be mapped automatically.`)) {
      return;
    }
    try {
      await api.deleteMapping(m.id);
      showNotice('success', `Mapping rule "${m.name}" deleted.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to delete mapping rule.');
    }
  };

  // Reset to CDA Standard Baseline Mappings
  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all transaction mappings to the standard CDA-compliant double-entry rules? Any custom rule overrides will be restored to defaults.')) {
      return;
    }
    try {
      await api.resetDefaultMappings();
      showNotice('success', 'Accounting mappings reset to CDA standard defaults.');
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to reset accounting mappings.');
    }
  };

  // Test Post Simulated Voucher to GL
  const handlePostTestJV = async () => {
    if (!previewMapping) return;
    const amount = Number(simulationAmount) || 50000;
    const drAcc = findAccount(previewMapping.debit_account_id);
    const crAcc = findAccount(previewMapping.credit_account_id);

    setIsPostingTestJV(true);
    try {
      const res = await api.createManualJournal({
        posting_date: new Date().toISOString().split('T')[0],
        branch_id: 'branch_tar',
        description: `Simulated Test JV: ${previewMapping.name} (${previewMapping.transaction_type})`,
        reference_type: previewMapping.transaction_type || 'TEST_SIMULATION',
        performed_by: currentUser.name || 'System Accountant',
        lines: [
          { account_id: drAcc?.id || previewMapping.debit_account_id, debit: amount, credit: 0 },
          { account_id: crAcc?.id || previewMapping.credit_account_id, debit: 0, credit: amount }
        ]
      });
      showNotice('success', `Test voucher ${res.data?.voucher_number || 'JV'} successfully posted to General Ledger!`);
      setPreviewMapping(null);
      window.dispatchEvent(new CustomEvent('coop:data-changed'));
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to post test journal voucher.');
    } finally {
      setIsPostingTestJV(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Description & Actions */}
      <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <BookOpen className="w-4 h-4" />
              <span>General Ledger Rule Engine</span>
              <span>•</span>
              <span className="text-slate-400">CDA Double-Entry Compliance</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">
              Dynamic Accounting &amp; GL Event Mappings
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Every loan release, repayment, savings deposit, share capital contribution, and expense automatically triggers balanced double-entry General Ledger vouchers. Configure which accounts receive the debit and credit entries below.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 shrink-0">
            <button
              id="btn-add-mapping"
              onClick={() => setIsAddingNew(true)}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Mapping Rule</span>
            </button>

            <button
              id="btn-reset-mappings"
              onClick={handleResetDefaults}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Restore standard CDA cooperative chart of account mappings"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>Reset CDA Defaults</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-200">{safeMappings.length} Rules Active</span>
            </div>
          </div>
        </div>

        {/* Filter Pills and Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Domain Chips */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => setActiveDomain('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'all'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              All Rules ({domainCounts.all})
            </button>
            <button
              onClick={() => setActiveDomain('loans')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'loans'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Loans ({domainCounts.loans})</span>
            </button>
            <button
              onClick={() => setActiveDomain('savings')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'savings'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5 text-blue-400" />
              <span>Savings ({domainCounts.savings})</span>
            </button>
            <button
              onClick={() => setActiveDomain('share_capital')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'share_capital'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-purple-400" />
              <span>Share Capital ({domainCounts.share_capital})</span>
            </button>
            <button
              onClick={() => setActiveDomain('cash')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'cash'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Cash &amp; Banking ({domainCounts.cash})</span>
            </button>
            <button
              onClick={() => setActiveDomain('fees')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'fees'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5 text-rose-400" />
              <span>Fees &amp; Income ({domainCounts.fees})</span>
            </button>
            <button
              onClick={() => setActiveDomain('expenses')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'expenses'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-orange-400" />
              <span>Expenses ({domainCounts.expenses})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search mappings, events, or accounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mappings Visual Flow Grid */}
      <div className="space-y-4">
        {filteredMappings.map(m => {
          const drAcc = findAccount(m.debit_account_id);
          const crAcc = findAccount(m.credit_account_id);
          const story = getAccountingStory(m, drAcc, crAcc);

          return (
            <div
              key={m.id}
              className="bg-slate-900/80 hover:bg-slate-900 rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition shadow space-y-4"
            >
              {/* Top Row: Event Name, Code & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-bold text-white tracking-tight">{m.name}</span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-slate-950 text-emerald-400 border border-slate-800 font-semibold">
                      {m.transaction_type || (m as any).event_type}
                    </span>
                    {(m as any).is_system === false && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Custom Rule
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => {
                      setPreviewMapping(m);
                      setSimulationAmount(50000);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
                    title="Preview and simulate balanced Journal Voucher"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Sample JV</span>
                  </button>

                  <button
                    id={`btn-edit-mapping-${m.id}`}
                    onClick={() => handleStartEdit(m)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Configure GL Mapping</span>
                  </button>

                  {!(m as any).is_system && (
                    <button
                      onClick={() => handleDeleteMapping(m)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 border border-slate-700 transition cursor-pointer"
                      title="Delete custom mapping rule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Visual Flow: Operational Trigger ──▶ Debit (Dr) ──▶ Credit (Cr) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                {/* Debit Side (Dr) */}
                <div className="md:col-span-5 bg-slate-950/80 rounded-xl p-4 border border-emerald-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs uppercase font-bold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>DEBIT (Dr) Account</span>
                      </div>
                      {drAcc ? (
                        <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${getAccountBadge(drAcc.type || drAcc.category)}`}>
                          {drAcc.type || drAcc.category}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                          Unresolved Account
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5">
                      <div className="text-sm font-bold text-white tracking-wide">
                        {drAcc ? `${drAcc.code || drAcc.account_code} — ${drAcc.name}` : m.debit_account_id}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Normal Balance: <span className="font-semibold text-slate-300">{drAcc?.normal_balance || 'Debit'}</span>
                        {drAcc?.report_group ? ` • ${drAcc.report_group}` : drAcc?.category ? ` • ${drAcc.category}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-emerald-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Debit increases Asset &amp; Expense accounts</span>
                  </div>
                </div>

                {/* Transfer Arrow Indicator */}
                <div className="md:col-span-2 flex flex-col items-center justify-center p-2 text-slate-500">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-950 border border-slate-800 text-emerald-400 shadow-md">
                    <ArrowLeftRight className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-2 text-center">
                    Double-Entry Balanced Posting
                  </span>
                </div>

                {/* Credit Side (Cr) */}
                <div className="md:col-span-5 bg-slate-950/80 rounded-xl p-4 border border-blue-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs uppercase font-bold text-blue-400">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span>CREDIT (Cr) Account</span>
                      </div>
                      {crAcc ? (
                        <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${getAccountBadge(crAcc.type || crAcc.category)}`}>
                          {crAcc.type || crAcc.category}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                          Unresolved Account
                        </span>
                      )}
                    </div>
                    <div className="mt-2.5">
                      <div className="text-sm font-bold text-white tracking-wide">
                        {crAcc ? `${crAcc.code || crAcc.account_code} — ${crAcc.name}` : m.credit_account_id}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Normal Balance: <span className="font-semibold text-slate-300">{crAcc?.normal_balance || 'Credit'}</span>
                        {crAcc?.report_group ? ` • ${crAcc.report_group}` : crAcc?.category ? ` • ${crAcc.category}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-blue-300 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Credit increases Liability, Equity &amp; Revenue</span>
                  </div>
                </div>
              </div>

              {/* Explanatory Story Banner */}
              <div className="bg-slate-950/90 rounded-xl px-4 py-3 border border-slate-800 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  <span className="font-bold text-emerald-400">Accounting Logic: </span>
                  {story}
                </p>
              </div>
            </div>
          );
        })}

        {filteredMappings.length === 0 && (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
            <p className="text-sm font-semibold text-slate-300">No accounting mappings match your search or filter.</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or selecting another operational domain.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveDomain('all');
              }}
              className="mt-3 inline-flex items-center space-x-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 cursor-pointer"
            >
              <span>Clear filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Edit Mapping Modal */}
      {editingMapping && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Configure GL Rule</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{editingMapping.name}</h3>
              </div>
              <button
                onClick={() => setEditingMapping(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Rule Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Rule / Event Title
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Operational Description
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Debit Account Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Debit (Dr) Account
                </label>
                <select
                  value={editDebit}
                  onChange={(e) => setEditDebit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {safeAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code || a.account_code} — {a.name} ({a.type || a.category} • {a.normal_balance})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Debiting this account increases Assets &amp; Expenses, and decreases Liabilities &amp; Equity.</p>
              </div>

              {/* Credit Account Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
                  Credit (Cr) Account
                </label>
                <select
                  value={editCredit}
                  onChange={(e) => setEditCredit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {safeAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code || a.account_code} — {a.name} ({a.type || a.category} • {a.normal_balance})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">Crediting this account increases Liabilities, Equity, and Revenue, and decreases Assets.</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingMapping(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-save-edit-mapping"
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white shadow transition cursor-pointer"
              >
                Save Mapping Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Mapping Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Create New GL Rule</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Add Accounting Mapping Rule</h3>
              </div>
              <button
                onClick={() => setIsAddingNew(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dividend Distribution"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                    Event Type Key *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DIVIDEND_PAYOUT"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Describe when this event triggers..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Debit Account Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Debit (Dr) Account *
                </label>
                <select
                  value={newDebit}
                  onChange={(e) => setNewDebit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {safeAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code || a.account_code} — {a.name} ({a.type || a.category} • {a.normal_balance})
                    </option>
                  ))}
                </select>
              </div>

              {/* Credit Account Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
                  Credit (Cr) Account *
                </label>
                <select
                  value={newCredit}
                  onChange={(e) => setNewCredit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {safeAccounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code || a.account_code} — {a.name} ({a.type || a.category} • {a.normal_balance})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddingNew(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-slate-300 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-add-mapping"
                onClick={handleCreateMapping}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white shadow transition cursor-pointer"
              >
                Create Mapping Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Journal Voucher Preview Modal */}
      {previewMapping && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Simulated Voucher Preview</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Sample Journal Voucher (JV)</h3>
              </div>
              <button
                onClick={() => setPreviewMapping(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Amount Slider / Input */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-300">Transaction Simulation Amount:</span>
                <p className="text-[11px] text-slate-500">Test how the rule posts at different values</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-emerald-400">₱</span>
                <input
                  type="number"
                  value={simulationAmount}
                  onChange={(e) => setSimulationAmount(Math.max(1, Number(e.target.value) || 0))}
                  className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold text-right focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>VOUCHER NO: JV-SIM-{new Date().getFullYear()}-001</span>
                <span>DATE: {new Date().toISOString().split('T')[0]}</span>
              </div>
              <p className="text-slate-300 font-sans text-xs">
                <span className="font-bold text-emerald-400">PARTICULARS: </span>
                Automatic posting for {previewMapping.name} ({previewMapping.transaction_type || (previewMapping as any).event_type})
              </p>

              <table className="w-full text-left mt-2">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-1">Account Description</th>
                    <th className="py-1 text-right">Debit (₱)</th>
                    <th className="py-1 text-right">Credit (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(() => {
                    const drAcc = findAccount(previewMapping.debit_account_id);
                    const crAcc = findAccount(previewMapping.credit_account_id);
                    const amt = Number(simulationAmount) || 50000;
                    const formatted = new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amt);

                    return (
                      <>
                        <tr>
                          <td className="py-2.5 text-emerald-300">
                            <span className="font-bold">{drAcc?.code || drAcc?.account_code || previewMapping.debit_account_id}</span> -{' '}
                            {drAcc?.name || 'Debit Account'}
                          </td>
                          <td className="py-2.5 text-right font-bold text-white">{formatted}</td>
                          <td className="py-2.5 text-right text-slate-600">—</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 pl-4 text-blue-300">
                            <span className="font-bold">{crAcc?.code || crAcc?.account_code || previewMapping.credit_account_id}</span> -{' '}
                            {crAcc?.name || 'Credit Account'}
                          </td>
                          <td className="py-2.5 text-right text-slate-600">—</td>
                          <td className="py-2.5 text-right font-bold text-white">{formatted}</td>
                        </tr>
                        <tr className="border-t border-slate-700 font-bold bg-slate-900/60">
                          <td className="py-2 px-1 text-slate-300 uppercase text-[11px]">Total Balanced Postings</td>
                          <td className="py-2 text-right text-emerald-400">₱{formatted}</td>
                          <td className="py-2 text-right text-emerald-400">₱{formatted}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePostTestJV}
                disabled={isPostingTestJV}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-bold text-white shadow transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isPostingTestJV ? 'Posting...' : 'Post Test Voucher to GL'}</span>
              </button>

              <button
                onClick={() => setPreviewMapping(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
