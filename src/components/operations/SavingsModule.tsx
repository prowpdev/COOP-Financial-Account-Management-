import React, { useState, useEffect } from 'react';
import { PiggyBank, Plus, ArrowUpRight, ArrowDownLeft, X } from 'lucide-react';
import { api } from '../../services/api';
import { CashAccount, SavingsAccount, User } from '../../types';

interface SavingsModuleProps {
  cashAccounts: CashAccount[];
  currentUser: User;
}

export const SavingsModule: React.FC<SavingsModuleProps> = ({
  cashAccounts,
  currentUser
}) => {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState<SavingsAccount | null>(null);
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [amount, setAmount] = useState(1000);
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || 'cash_01');
  const [notice, setNotice] = useState<string | null>(null);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const res = await api.getSavingsAccounts();
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

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
                  {cashAccounts.map(c => (
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

      {/* Accounts Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
            <tr>
              <th className="py-3 px-4">Account No.</th>
              <th className="py-3 px-4">Member Owner</th>
              <th className="py-3 px-4">Facility Type</th>
              <th className="py-3 px-4">Current Balance</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {accounts.map(a => (
              <tr key={a.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-4 font-mono font-bold text-white">{a.account_number}</td>
                <td className="py-3 px-4 font-medium text-slate-200">{a.member_name}</td>
                <td className="py-3 px-4 text-slate-400">{a.product_name}</td>
                <td className="py-3 px-4 font-bold text-emerald-400 text-sm">
                  {formatMoney(a.balance)}
                </td>
                <td className="py-3 px-4">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                    {a.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      setActiveAccount(a);
                      setAmount(1000);
                      setTxType('DEPOSIT');
                    }}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                  >
                    Deposit / Withdraw
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
