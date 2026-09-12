import React, { useState, useEffect } from 'react';
import { Coins, Plus, X, Building2 } from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { api } from '../../services/api';
import { Branch, CashAccount, ShareCapitalAccount, User } from '../../types';

interface ShareCapitalModuleProps {
  branches?: Branch[];
  cashAccounts: CashAccount[];
  currentUser: User;
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
}

export const ShareCapitalModule: React.FC<ShareCapitalModuleProps> = ({
  branches = [],
  cashAccounts = [],
  currentUser,
  selectedBranchId,
  onSelectBranch
}) => {
  const [accounts, setAccounts] = useState<ShareCapitalAccount[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState<ShareCapitalAccount | null>(null);
  const [payAmount, setPayAmount] = useState(1000);
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
      const res = await api.getShareCapitalAccounts();
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

  const shareCols: ExcelColumn<ShareCapitalAccount>[] = [
    {
      key: 'account_number',
      header: 'CBU Account',
      width: '150px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-amber-500/20 text-amber-300 border-amber-500/30'
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
      key: 'subscribed_amount',
      header: 'Subscribed Amount',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    {
      key: 'paid_up_shares',
      header: 'Paid-Up Shares',
      width: '130px',
      type: 'number',
      align: 'center',
      sortable: true,
      render: (val) => `${val || 0} sh`
    },
    {
      key: 'paid_up_amount',
      header: 'Paid-Up Amount',
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
      width: '140px',
      align: 'center',
      render: (_, row) => (
        <button
          onClick={() => {
            setActiveAccount(row);
            setPayAmount(1000);
          }}
          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
        >
          + Deposit Share Capital
        </button>
      )
    }
  ];

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

        {/* Branch Filter Selector */}
        <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Building2 className="w-3.5 h-3.5 text-amber-400" />
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
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  Post Equity Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Capital Excel Table */}
      <ExcelGridTable
        title="Member Share Capital (CBU) Subscriptions Ledger"
        subtitle="Spreadsheet overview of member equity subscriptions, paid-up capital, formula summary bar, and CSV export."
        exportFileName="share_capital_ledger"
        data={filteredAccounts}
        columns={shareCols}
        defaultSortKey="account_number"
      />
    </div>
  );
};
