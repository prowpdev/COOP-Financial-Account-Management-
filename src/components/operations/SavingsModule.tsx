import React, { useState, useEffect } from 'react';
import { PiggyBank, Plus, ArrowUpRight, ArrowDownLeft, X, Building2 } from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { api } from '../../services/api';
import { Branch, CashAccount, SavingsAccount, User } from '../../types';

interface SavingsModuleProps {
  branches?: Branch[];
  cashAccounts: CashAccount[];
  currentUser: User;
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
}

export const SavingsModule: React.FC<SavingsModuleProps> = ({
  branches = [],
  cashAccounts = [],
  currentUser,
  selectedBranchId,
  onSelectBranch
}) => {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState<SavingsAccount | null>(null);
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [amount, setAmount] = useState(1000);
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || 'cash_01');
  const [notice, setNotice] = useState<string | null>(null);

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

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSavingsAccounts();
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeCashAccounts = Array.isArray(cashAccounts) ? cashAccounts : [];

  const filteredAccounts = selectedBranch === 'all'
    ? safeAccounts
    : safeAccounts.filter(a => a && (a as any).branch_id === selectedBranch);

  const availableCashAccounts = selectedBranch === 'all'
    ? safeCashAccounts
    : safeCashAccounts.filter(c => c && c.branch_id === selectedBranch);

  useEffect(() => {
    if (availableCashAccounts.length > 0 && !availableCashAccounts.some(c => c.id === cashAccountId)) {
      setCashAccountId(availableCashAccounts[0].id);
    }
  }, [selectedBranch, cashAccounts]);

  const handleTransact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;

    try {
      const res = await api.transactSavings({
        account_id: activeAccount.id,
        type: txType,
        amount,
        cash_account_id: cashAccountId,
        performed_by: currentUser.name,
        notes: `${txType} processed by ${currentUser.name}`
      });
      setActiveAccount(null);
      setNotice(`${txType} of ₱${amount.toLocaleString()} successful! Ref #${res.data.transaction_no}.`);
      setTimeout(() => setNotice(null), 4000);
      loadAccounts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const savingsCols: ExcelColumn<SavingsAccount>[] = [
    {
      key: 'account_number',
      header: 'Account Number',
      width: '150px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      key: 'member_name',
      header: 'Member Owner',
      width: '240px',
      type: 'text',
      sortable: true,
      render: (_, row) => (
        <span className="font-semibold text-white">{row.member_name}</span>
      )
    },
    {
      key: 'product_name',
      header: 'Deposit Product',
      width: '200px',
      type: 'text',
      sortable: true
    },
    {
      key: 'balance',
      header: 'Account Balance',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    {
      key: 'branch_name',
      header: 'Branch',
      width: '150px',
      type: 'text',
      sortable: true,
      render: (_, row: any) => row.branch_name || 'Tarlac Main Branch'
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
    {
      key: 'id',
      header: 'Actions',
      width: '150px',
      align: 'center',
      render: (_, row) => (
        <button
          onClick={() => {
            setActiveAccount(row);
            setAmount(1000);
            setTxType('DEPOSIT');
          }}
          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
        >
          + Deposit / Withdrawal
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Deposit Liabilities</span>
            <span>•</span>
            <span className="text-slate-400">GL Account 2110</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Savings Accounts & Deposits
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Member savings deposits and withdrawal transactions with automated double-entry accounting vouchers.
          </p>
        </div>

        {/* Branch Filter Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
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
      </div>

      {notice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* Transaction Modal */}
      {activeAccount && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Savings Transaction</h3>
                <p className="text-xs text-slate-400">Account: {activeAccount.account_number}</p>
              </div>
              <button onClick={() => setActiveAccount(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransact} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTxType('DEPOSIT')}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txType === 'DEPOSIT'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Deposit (+)
                </button>
                <button
                  type="button"
                  onClick={() => setTxType('WITHDRAWAL')}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    txType === 'WITHDRAWAL'
                      ? 'bg-rose-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Withdrawal (-)
                </button>
              </div>

              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Member:</span>
                  <span className="font-semibold text-white">{activeAccount.member_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Balance:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {formatMoney(activeAccount.balance)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium">Transaction Amount (₱)</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={amount}
                  onChange={e => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium">Cash Vault / Drawer</label>
                <select
                  value={cashAccountId}
                  onChange={e => setCashAccountId(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                >
                  {(availableCashAccounts.length > 0 ? availableCashAccounts : cashAccounts).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveAccount(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  Submit & Post GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts Excel Table */}
      <ExcelGridTable
        title="Member Savings Accounts Ledger"
        subtitle="Spreadsheet overview of deposit liabilities by member and product with formula summary bar and CSV export."
        exportFileName="savings_accounts_ledger"
        data={filteredAccounts}
        columns={savingsCols}
        defaultSortKey="account_number"
      />
    </div>
  );
};
