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
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../../services/api';
import { Account, AccountingMapping, User } from '../../types';

interface AccountingMappingsViewProps {
  mappings: AccountingMapping[];
  accounts: Account[];
  currentUser: User;
  onRefresh: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}

type DomainFilter = 'all' | 'loans' | 'savings' | 'share_capital' | 'cash' | 'fees';

export const AccountingMappingsView: React.FC<AccountingMappingsViewProps> = ({
  mappings,
  accounts,
  currentUser,
  onRefresh,
  showNotice
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDomain, setActiveDomain] = useState<DomainFilter>('all');
  const [editingMapping, setEditingMapping] = useState<AccountingMapping | null>(null);
  const [editDebit, setEditDebit] = useState('');
  const [editCredit, setEditCredit] = useState('');
  const [previewMapping, setPreviewMapping] = useState<AccountingMapping | null>(null);

  // Categorize mappings by operational domain
  const getDomain = (m: AccountingMapping): DomainFilter => {
    const type = (m.transaction_type || '').toLowerCase();
    const name = (m.name || '').toLowerCase();
    if (type.includes('loan') || name.includes('loan') || name.includes('amortization') || name.includes('disbursement')) return 'loans';
    if (type.includes('saving') || name.includes('saving') || name.includes('deposit') || name.includes('withdrawal')) return 'savings';
    if (type.includes('share') || name.includes('capital') || name.includes('cbu') || type.includes('cbu')) return 'share_capital';
    if (type.includes('cash') || name.includes('vault') || name.includes('bank') || name.includes('drawer')) return 'cash';
    if (type.includes('fee') || name.includes('fee') || name.includes('penalty') || name.includes('interest')) return 'fees';
    return 'loans';
  };

  // Plain-English narrative explaining how the debit and credit interact
  const getAccountingStory = (m: AccountingMapping, drAcc?: Account, crAcc?: Account) => {
    const drName = drAcc ? `${drAcc.code} (${drAcc.name})` : m.debit_account_id;
    const crName = crAcc ? `${crAcc.code} (${crAcc.name})` : m.credit_account_id;

    const t = (m.transaction_type || '').toUpperCase();
    if (t.includes('DISBURSEMENT') || t.includes('LOAN_RELEASE')) {
      return `When a borrower receives their loan principal: Debits ${drName} to record cooperative's loan receivable asset, and Credits ${crName} to reflect cash disbursed from teller drawer.`;
    }
    if (t.includes('PRINCIPAL') || t.includes('REPAYMENT')) {
      return `When a borrower repays loan principal: Debits ${drName} to increase cash collected, and Credits ${crName} to reduce the outstanding loan balance.`;
    }
    if (t.includes('INTEREST')) {
      return `When loan interest is collected: Debits ${drName} for cash received, and Credits ${crName} to recognize interest earned.`;
    }
    if (t.includes('SAVINGS') && t.includes('DEPOSIT')) {
      return `When a member deposits into regular savings: Debits ${drName} to receive cash, and Credits ${crName} to recognize member deposit liability.`;
    }
    if (t.includes('WITHDRAWAL')) {
      return `When a member withdraws from savings: Debits ${drName} to decrease cooperative deposit liability, and Credits ${crName} for cash released to member.`;
    }
    if (t.includes('SHARE') || t.includes('CBU')) {
      return `When member pays share capital (CBU): Debits ${drName} to record cash received, and Credits ${crName} to increase member equity.`;
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

  const filteredMappings = useMemo(() => {
    return mappings.filter(m => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.transaction_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.debit_account_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.credit_account_id.toLowerCase().includes(searchQuery.toLowerCase());

      const domain = getDomain(m);
      const matchesDomain = activeDomain === 'all' || domain === activeDomain;

      return matchesSearch && matchesDomain;
    });
  }, [mappings, searchQuery, activeDomain]);

  const handleStartEdit = (m: AccountingMapping) => {
    setEditingMapping(m);
    setEditDebit(m.debit_account_id);
    setEditCredit(m.credit_account_id);
  };

  const handleSaveEdit = async () => {
    if (!editingMapping) return;
    try {
      await api.updateMapping(editingMapping.id, {
        debit_account_id: editDebit,
        credit_account_id: editCredit,
        changed_by: currentUser.name,
        reason: 'Adjusted dynamic accounting mapping via visual interface'
      });
      showNotice('success', `Mapping for "${editingMapping.name}" updated successfully.`);
      setEditingMapping(null);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update mapping');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <BookOpen className="w-4 h-4" />
              <span>General Ledger Rule Engine</span>
              <span>•</span>
              <span className="text-slate-400">Zero Code CDA Compliance</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight mt-1">
              Dynamic Accounting &amp; GL Event Mappings
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Every loan release, repayment, savings deposit, and share capital transaction automatically generates balanced, double-entry General Ledger vouchers. Configure which accounts receive the debit and credit entries below.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-200">{mappings.length} Automated Rules Active</span>
          </div>
        </div>

        {/* Filter Pills and Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Domain Chips */}
          <div className="flex items-center flex-wrap gap-1.5">
            <button
              onClick={() => setActiveDomain('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              All Rules ({mappings.length})
            </button>
            <button
              onClick={() => setActiveDomain('loans')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'loans'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Loans &amp; Lending</span>
            </button>
            <button
              onClick={() => setActiveDomain('savings')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'savings'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Savings Deposits</span>
            </button>
            <button
              onClick={() => setActiveDomain('share_capital')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'share_capital'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Share Capital</span>
            </button>
            <button
              onClick={() => setActiveDomain('cash')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeDomain === 'cash'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Cash &amp; Banking</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search mappings or GL codes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Mappings Visual Flow Grid */}
      <div className="space-y-4">
        {filteredMappings.map(m => {
          const drAcc = accounts.find(a => a.id === m.debit_account_id);
          const crAcc = accounts.find(a => a.id === m.credit_account_id);
          const story = getAccountingStory(m, drAcc, crAcc);

          return (
            <div
              key={m.id}
              className="bg-slate-800/70 hover:bg-slate-800/90 rounded-2xl p-5 border border-slate-700/80 transition shadow-sm space-y-4"
            >
              {/* Top Row: Event Name, Code & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
                <div>
                  <div className="flex items-center space-x-2.5">
                    <span className="text-base font-bold text-white tracking-tight">{m.name}</span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-900 text-emerald-400 border border-slate-700 font-semibold">
                      {m.transaction_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => setPreviewMapping(m)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
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
                </div>
              </div>

              {/* Visual Flow: Operational Trigger ──▶ Debit (Dr) ──▶ Credit (Cr) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                {/* Debit Side (Dr) */}
                <div className="md:col-span-5 bg-slate-900/90 rounded-xl p-3.5 border border-emerald-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs uppercase font-bold text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span>DEBIT (Dr) Account</span>
                      </div>
                      {drAcc && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${getAccountBadge(drAcc.type)}`}>
                          {drAcc.type}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-bold text-white tracking-wide">
                        {drAcc ? `${drAcc.code} — ${drAcc.name}` : m.debit_account_id}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Normal Balance: <span className="font-semibold text-slate-300">{drAcc?.normal_balance || 'Debit'}</span>
                        {drAcc?.category ? ` • ${drAcc.category}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transfer Arrow Indicator */}
                <div className="md:col-span-2 flex flex-col items-center justify-center p-1 text-slate-500">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-emerald-400">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">
                    Balanced Posting
                  </span>
                </div>

                {/* Credit Side (Cr) */}
                <div className="md:col-span-5 bg-slate-900/90 rounded-xl p-3.5 border border-blue-500/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs uppercase font-bold text-blue-400">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        <span>CREDIT (Cr) Account</span>
                      </div>
                      {crAcc && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-md border font-semibold ${getAccountBadge(crAcc.type)}`}>
                          {crAcc.type}
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-bold text-white tracking-wide">
                        {crAcc ? `${crAcc.code} — ${crAcc.name}` : m.credit_account_id}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Normal Balance: <span className="font-semibold text-slate-300">{crAcc?.normal_balance || 'Credit'}</span>
                        {crAcc?.category ? ` • ${crAcc.category}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory Story Banner */}
              <div className="bg-slate-900/60 rounded-xl px-3.5 py-2.5 border border-slate-700/50 flex items-start space-x-2">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  <span className="font-semibold text-emerald-300">Accounting Logic: </span>
                  {story}
                </p>
              </div>
            </div>
          );
        })}

        {filteredMappings.length === 0 && (
          <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700/60">
            <p className="text-sm font-semibold text-slate-300">No accounting mappings match your search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveDomain('all');
              }}
              className="mt-2 text-xs text-emerald-400 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Edit Mapping Modal */}
      {editingMapping && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Configure Mapping Rule</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{editingMapping.name}</h3>
              </div>
              <button
                onClick={() => setEditingMapping(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Select which General Ledger Chart of Accounts are updated when this operational event occurs.
            </p>

            <div className="space-y-4">
              {/* Debit Account Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Debit (Dr) Account
                </label>
                <select
                  value={editDebit}
                  onChange={(e) => setEditDebit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-medium focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name} ({a.type} • {a.normal_balance})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">This account balance will increase if it has a normal Debit balance (Asset / Expense).</p>
              </div>

              {/* Credit Account Picker */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-400">
                  Credit (Cr) Account
                </label>
                <select
                  value={editCredit}
                  onChange={(e) => setEditCredit(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-medium focus:outline-none focus:border-blue-500"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name} ({a.type} • {a.normal_balance})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">This account balance will increase if it has a normal Credit balance (Liability / Equity / Income).</p>
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
                onClick={handleSaveEdit}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold text-white shadow transition cursor-pointer"
              >
                Save Mapping Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sample Journal Voucher Preview Modal */}
      {previewMapping && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Simulated Voucher</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Sample Journal Voucher (JV)</h3>
              </div>
              <button
                onClick={() => setPreviewMapping(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>VOUCHER NO: JV-2026-0042</span>
                <span>DATE: 2026-09-11</span>
              </div>
              <p className="text-slate-300 font-sans">
                <span className="font-bold text-emerald-400">PARTICULARS: </span>
                Automatic posting for {previewMapping.name} ({previewMapping.transaction_type})
              </p>

              <table className="w-full text-left mt-2">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1">Account Description</th>
                    <th className="py-1 text-right">Debit (₱)</th>
                    <th className="py-1 text-right">Credit (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2 text-emerald-300">
                      {accounts.find(a => a.id === previewMapping.debit_account_id)?.code || previewMapping.debit_account_id} -{' '}
                      {accounts.find(a => a.id === previewMapping.debit_account_id)?.name || 'Debit Account'}
                    </td>
                    <td className="py-2 text-right font-bold text-white">50,000.00</td>
                    <td className="py-2 text-right text-slate-600">—</td>
                  </tr>
                  <tr>
                    <td className="py-2 pl-4 text-blue-300">
                      {accounts.find(a => a.id === previewMapping.credit_account_id)?.code || previewMapping.credit_account_id} -{' '}
                      {accounts.find(a => a.id === previewMapping.credit_account_id)?.name || 'Credit Account'}
                    </td>
                    <td className="py-2 text-right text-slate-600">—</td>
                    <td className="py-2 text-right font-bold text-white">50,000.00</td>
                  </tr>
                  <tr className="border-t border-slate-700 font-bold">
                    <td className="py-2 text-slate-300 uppercase">Total Balanced Postings</td>
                    <td className="py-2 text-right text-emerald-400">₱50,000.00</td>
                    <td className="py-2 text-right text-emerald-400">₱50,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
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
