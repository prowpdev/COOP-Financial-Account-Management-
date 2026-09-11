import React, { useState, useEffect } from 'react';
import { Coins, Plus, X } from 'lucide-react';
import { api } from '../../services/api';
import { CashAccount, ShareCapitalAccount, User } from '../../types';

interface ShareCapitalModuleProps {
  cashAccounts: CashAccount[];
  currentUser: User;
}

export const ShareCapitalModule: React.FC<ShareCapitalModuleProps> = ({
  cashAccounts,
  currentUser
}) => {
  const [accounts, setAccounts] = useState<ShareCapitalAccount[]>([]);
  const [activeAccount, setActiveAccount] = useState<ShareCapitalAccount | null>(null);
  const [payAmount, setPayAmount] = useState(1000);
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || 'cash_01');
  const [notice, setNotice] = useState<string | null>(null);

  const loadAccounts = async () => {
    try {
      const res = await api.getShareCapitalAccounts();
      setAccounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;

    try {
      const shares = Math.floor(payAmount / 100);
      const res = await api.payShareCapital({
        account_id: activeAccount.id,
        shares,
        amount: payAmount,
        cash_account_id: cashAccountId,
        performed_by: currentUser.name
      });
      setActiveAccount(null);
      setNotice(`Share capital contribution of ₱${payAmount.toLocaleString()} (${shares} shares) recorded with Official Receipt.`);
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
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span>Capital Build-Up (CBU)</span>
            <span>•</span>
            <span className="text-slate-400">Equity GL Account 3110</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Share Capital Subscriptions & Paid-Up
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage member subscribed and paid-up shares. Contributions automatically post to Cooperative Equity accounts.
          </p>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* Contribution Modal */}
      {activeAccount && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Share Capital Contribution</h3>
                <p className="text-xs text-slate-400">Account: {activeAccount.account_number}</p>
              </div>
              <button onClick={() => setActiveAccount(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Member:</span>
                  <span className="font-semibold text-white">{activeAccount.member_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subscribed Shares:</span>
                  <span className="text-slate-200">{activeAccount.subscribed_shares} shares ({formatMoney(activeAccount.subscribed_amount)})</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Paid-Up:</span>
                  <span className="font-bold text-amber-400 text-sm">{formatMoney(activeAccount.paid_up_amount)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium">Contribution Amount (₱)</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={payAmount}
                  onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white"
                />
                <p className="text-[10px] text-slate-400 mt-1">Par value: ₱100/share ({Math.floor(payAmount / 100)} shares)</p>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium">Receiving Cash Account</label>
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  Post Equity Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Capital Accounts Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-800 text-slate-400 font-semibold border-b border-slate-700">
            <tr>
              <th className="py-3 px-4">CBU Account</th>
              <th className="py-3 px-4">Member Name</th>
              <th className="py-3 px-4">Subscribed Amount</th>
              <th className="py-3 px-4">Paid-Up Shares</th>
              <th className="py-3 px-4">Paid-Up Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {accounts.map(a => (
              <tr key={a.id} className="hover:bg-slate-800/40 transition">
                <td className="py-3 px-4 font-mono font-bold text-white">{a.account_number}</td>
                <td className="py-3 px-4 font-medium text-slate-200">{a.member_name}</td>
                <td className="py-3 px-4 text-slate-400">
                  {formatMoney(a.subscribed_amount)} ({a.subscribed_shares} sh)
                </td>
                <td className="py-3 px-4 text-slate-200">{a.paid_up_shares} sh</td>
                <td className="py-3 px-4 font-bold text-amber-400 text-sm">
                  {formatMoney(a.paid_up_amount)}
                </td>
                <td className="py-3 px-4">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-semibold">
                    {a.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => {
                      setActiveAccount(a);
                      setPayAmount(1000);
                    }}
                    className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow"
                  >
                    Add Capital
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
