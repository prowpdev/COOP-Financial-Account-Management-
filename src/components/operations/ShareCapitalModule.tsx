import React, { useState, useEffect } from 'react';
import { Coins, Plus, X, Building2, Pencil, Trash2, CheckCircle, AlertTriangle, UserCheck, Percent, Settings, ShieldCheck } from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { api } from '../../services/api';
import { Account, Branch, CashAccount, Member, ShareCapitalAccount, ShareCapitalSetting, User } from '../../types';
import { ShareCapitalSettingsView } from '../config/ShareCapitalSettingsView';

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
  const [scSettings, setScSettings] = useState<ShareCapitalSetting[]>([]);
  const [chartAccounts, setChartAccounts] = useState<Account[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState<ShareCapitalAccount | null>(null);
  const [editingAccount, setEditingAccount] = useState<ShareCapitalAccount | null>(null);
  const [payAmount, setPayAmount] = useState(1000);
  const [cashAccountId, setCashAccountId] = useState(cashAccounts[0]?.id || 'cash_01');
  const [notice, setNotice] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [newAccount, setNewAccount] = useState({
    member_id: '',
    account_number: '',
    branch_id: '',
    par_value: 100,
    subscribed_shares: 100,
    paid_up_shares: 0,
    status: 'Active'
  });

  const [editForm, setEditForm] = useState({
    account_number: '',
    branch_id: '',
    par_value: 100,
    subscribed_shares: 100,
    subscribed_amount: 10000,
    paid_up_shares: 0,
    paid_up_amount: 0,
    status: 'Active'
  });

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

  const loadSettings = async () => {
    try {
      const [resSettings, resAccounts] = await Promise.all([
        api.getShareCapitalSettings(),
        api.getChartOfAccounts()
      ]);
      const stList = Array.isArray(resSettings.data) ? resSettings.data : [];
      setScSettings(stList);
      setChartAccounts(Array.isArray(resAccounts.data) ? resAccounts.data : []);
      if (stList.length > 0) {
        const active = stList[0];
        setNewAccount(prev => ({
          ...prev,
          par_value: Number(active.par_value_per_share) || 100,
          subscribed_shares: Number(active.min_subscription_shares) || 100,
          paid_up_shares: Number(active.min_paid_up_shares) || 25
        }));
      }
    } catch (err) {
      console.warn('Failed to load share capital settings in module:', err);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadSettings();
    api.getMembers()
      .then(res => setMembers(Array.isArray(res.data) ? res.data : []))
      .catch(err => setCreateError(err.message));
  }, []);

  const activePolicy = scSettings[0] || null;

  const safeAccounts = Array.isArray(accounts) ? accounts : [];
  const safeCashAccounts = Array.isArray(cashAccounts) ? cashAccounts : [];

  // Filter accounts by branch
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

  // Existing member IDs with share capital accounts (to prevent duplication)
  const existingMemberIds = new Set(safeAccounts.map(a => a.member_id));
  const availableMembers = members.filter(m => !existingMemberIds.has(m.id));

  // Initialize edit form when an account is selected for editing
  const handleOpenEdit = (acc: ShareCapitalAccount) => {
    const mem = members.find(m => m.id === acc.member_id);
    const par = acc.par_value || 100;
    setEditingAccount(acc);
    setEditError(null);
    setEditForm({
      account_number: acc.account_number || '',
      branch_id: acc.branch_id || mem?.branch_id || branches[0]?.id || 'branch_tar',
      par_value: par,
      subscribed_shares: acc.subscribed_shares ?? 100,
      subscribed_amount: acc.subscribed_amount ?? ((acc.subscribed_shares ?? 100) * par),
      paid_up_shares: acc.paid_up_shares ?? 0,
      paid_up_amount: acc.paid_up_amount ?? ((acc.paid_up_shares ?? 0) * par),
      status: acc.status || 'Active'
    });
  };

  // Submit edits
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    setEditError(null);

    const subShares = Number(editForm.subscribed_shares);
    const paidShares = Number(editForm.paid_up_shares);
    const par = Number(editForm.par_value) || 100;

    if (subShares < 0) {
      setEditError('Subscribed shares cannot be negative.');
      return;
    }
    if (paidShares < 0) {
      setEditError('Paid-up shares cannot be negative.');
      return;
    }
    if (paidShares > subShares) {
      setEditError(`Paid-up shares (${paidShares}) cannot exceed subscribed shares (${subShares}).`);
      return;
    }

    setIsSavingEdit(true);
    try {
      const calcSubAmount = subShares * par;
      const calcPaidAmount = paidShares * par;

      await api.updateShareCapitalAccount(editingAccount.id, {
        account_number: editForm.account_number.trim() || undefined,
        branch_id: editForm.branch_id,
        par_value: par,
        subscribed_shares: subShares,
        subscribed_amount: calcSubAmount,
        paid_up_shares: paidShares,
        paid_up_amount: calcPaidAmount,
        status: editForm.status,
        performed_by: currentUser.name
      });

      setEditingAccount(null);
      setNotice(`Share capital account ${editingAccount.account_number} updated successfully.`);
      setTimeout(() => setNotice(null), 4000);
      await loadAccounts();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update share capital account.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Account Deletion
  const handleDeleteAccount = async (acc: ShareCapitalAccount) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete Share Capital Account ${acc.account_number} for ${acc.member_name}?\n\nThis will remove the ledger record.`
    );
    if (!confirmDelete) return;

    try {
      await api.deleteShareCapitalAccount(acc.id);
      setNotice(`Account ${acc.account_number} deleted successfully.`);
      setTimeout(() => setNotice(null), 4000);
      await loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account.');
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount) return;

    try {
      const shares = Math.floor(payAmount / (activeAccount.par_value || 100));
      await api.payShareCapital({
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

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!newAccount.member_id) {
      setCreateError('Please select a member.');
      return;
    }

    // Check duplicate member
    if (existingMemberIds.has(newAccount.member_id)) {
      const existing = safeAccounts.find(a => a.member_id === newAccount.member_id);
      setCreateError(`This member already has an active Share Capital account (${existing?.account_number || ''}). Duplicates are prohibited.`);
      return;
    }

    const subShares = Number(newAccount.subscribed_shares);
    const paidShares = Number(newAccount.paid_up_shares);
    const par = Number(newAccount.par_value) || 100;

    if (subShares <= 0) {
      setCreateError('Subscribed shares must be greater than zero.');
      return;
    }
    if (paidShares < 0) {
      setCreateError('Paid-up shares cannot be negative.');
      return;
    }
    if (paidShares > subShares) {
      setCreateError(`Paid-up shares (${paidShares}) cannot exceed subscribed shares (${subShares}).`);
      return;
    }

    const selectedMem = members.find(m => m.id === newAccount.member_id);
    const branchToSave = newAccount.branch_id || selectedMem?.branch_id || branches[0]?.id || 'branch_tar';

    try {
      const subscribedAmount = subShares * par;
      const paidUpAmount = paidShares * par;

      await api.createShareCapitalAccount({
        member_id: newAccount.member_id,
        account_number: newAccount.account_number ? newAccount.account_number.trim() : undefined,
        branch_id: branchToSave, // Save member branch directly to database
        par_value: par,
        subscribed_shares: subShares,
        subscribed_amount: subscribedAmount,
        paid_up_shares: paidShares,
        paid_up_amount: paidUpAmount,
        status: newAccount.status,
        performed_by: currentUser.name
      });

      setIsCreating(false);
      setNotice(`Share Capital account opened successfully for ${selectedMem?.first_name} ${selectedMem?.last_name}. Branch assigned: ${branches.find(b => b.id === branchToSave)?.name || branchToSave}`);
      await loadAccounts();
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create share capital account.');
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  // Summary Metrics
  const totalSubscribed = filteredAccounts.reduce((sum, a) => sum + (Number(a.subscribed_amount) || 0), 0);
  const totalPaidUp = filteredAccounts.reduce((sum, a) => sum + (Number(a.paid_up_amount) || 0), 0);
  const overallPaidRatio = totalSubscribed > 0 ? ((totalPaidUp / totalSubscribed) * 100).toFixed(1) : '0.0';

  const shareCols: ExcelColumn<ShareCapitalAccount>[] = [
    {
      key: 'account_number',
      header: 'CBU Account',
      width: '140px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-mono'
    },
    {
      key: 'member_name',
      header: 'Member Owner',
      width: '210px',
      type: 'text',
      sortable: true,
      render: (_, row) => (
        <span className="font-semibold text-white">{row.member_name}</span>
      )
    },
    {
      key: 'branch_name',
      header: 'Branch (Saved in DB)',
      width: '160px',
      type: 'text',
      sortable: true,
      render: (_, row: any) => {
        const br = branches.find(b => b.id === row.branch_id);
        const name = row.branch_name || br?.name || 'Main Branch';
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{name}</span>
          </span>
        );
      }
    },
    {
      key: 'subscribed_shares',
      header: 'Subscribed (Shares)',
      width: '130px',
      type: 'number',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <div className="text-right">
          <span className="font-semibold text-slate-200">{val || 0} sh</span>
          <div className="text-[10px] text-slate-400">{formatMoney(row.subscribed_amount)}</div>
        </div>
      )
    },
    {
      key: 'paid_up_shares',
      header: 'Paid-Up (Shares)',
      width: '130px',
      type: 'number',
      align: 'right',
      sortable: true,
      render: (val, row) => (
        <div className="text-right">
          <span className="font-semibold text-emerald-300">{val || 0} sh</span>
          <div className="text-[10px] text-emerald-400 font-medium">{formatMoney(row.paid_up_amount)}</div>
        </div>
      )
    },
    {
      key: 'paid_up_amount',
      header: 'Fulfillment',
      width: '140px',
      align: 'center',
      render: (_, row) => {
        const sub = row.subscribed_shares || 1;
        const paid = row.paid_up_shares || 0;
        const pct = Math.min(100, Math.round((paid / sub) * 100));
        return (
          <div className="w-full px-2">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-slate-400">{pct}%</span>
              <span className={pct >= 100 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {pct >= 100 ? 'Fully Paid' : `₱${((row.subscribed_amount || 0) - (row.paid_up_amount || 0)).toLocaleString()} bal`}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: (status) => {
        if (status === 'Active') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (status === 'Withdrawn') return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      }
    },
    {
      key: 'id',
      header: 'Actions',
      width: '210px',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => handleOpenEdit(row)}
            title="Edit Subscribed Shares, Paid-Up, Par Value, or Branch"
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 cursor-pointer transition"
          >
            <Pencil className="w-3 h-3 text-amber-400" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => {
              setActiveAccount(row);
              setPayAmount(1000);
            }}
            title="Post Share Capital Payment"
            className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
          >
            <Coins className="w-3 h-3" />
            <span>Deposit</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span>Capital Build-Up (CBU)</span>
            <span>•</span>
            <span className="text-slate-400">Equity GL Account 3110</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Share Capital Subscriptions & Paid-Up Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage member subscribed and paid-up shares. Contributions automatically post to Cooperative Equity accounts with branch synchronization.
          </p>
        </div>

        {/* Controls: Branch Filter & Open Account */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
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

          <button
            type="button"
            id="btn-open-cbu-settings"
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer transition shadow"
            title="Configure cooperative Par Value and CBU policies"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span>Coop Policy (Par: ₱{activePolicy?.par_value_per_share || 100})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const firstAvailable = availableMembers[0] || members[0];
              const memBranch = firstAvailable?.branch_id || branches[0]?.id || 'branch_tar';
              setNewAccount({
                member_id: firstAvailable?.id || '',
                account_number: `CBU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
                branch_id: memBranch,
                par_value: Number(activePolicy?.par_value_per_share) || 100,
                subscribed_shares: Number(activePolicy?.min_subscription_shares) || 100,
                paid_up_shares: Number(activePolicy?.min_paid_up_shares) || 0,
                status: 'Active'
              });
              setCreateError(null);
              setIsCreating(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open Share Capital Account</span>
          </button>
        </div>
      </div>

      {/* Cooperative Policy Quick-Bar */}
      {activePolicy && (
        <div className="bg-slate-900/90 rounded-xl px-4 py-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Cooperative Par Value:</span>
              <span className="font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
                ₱{Number(activePolicy.par_value_per_share || 100).toFixed(2)} / share
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Min. Subscription:</span>
              <span className="font-semibold text-white">
                {activePolicy.min_subscription_shares} shares (₱{(activePolicy.min_subscription_shares * activePolicy.par_value_per_share).toLocaleString()})
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">Min. Paid-Up:</span>
              <span className="font-semibold text-white">
                {activePolicy.min_paid_up_shares} shares (₱{(activePolicy.min_paid_up_shares * activePolicy.par_value_per_share).toLocaleString()})
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 font-medium">CDA Limit:</span>
              <span className="font-semibold text-amber-400">
                {activePolicy.max_share_holding_percentage}% max / member
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="text-amber-400 hover:text-amber-300 font-medium text-xs flex items-center space-x-1 cursor-pointer"
          >
            <span>Edit Policy & Par Value</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Subscribed Capital</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-bold text-white mt-1">{formatMoney(totalSubscribed)}</p>
          <span className="text-[11px] text-slate-500">Committed Member Capital</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Paid-Up Capital</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-bold text-emerald-400 mt-1">{formatMoney(totalPaidUp)}</p>
          <span className="text-[11px] text-slate-500">Active Liquid Equity</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Subscription Fulfillment</span>
            <Percent className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-xl font-bold text-sky-400 mt-1">{overallPaidRatio}%</p>
          <span className="text-[11px] text-slate-500">Paid-Up vs. Subscribed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">CBU Accounts (Members)</span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-bold text-white mt-1">{filteredAccounts.length}</p>
          <span className="text-[11px] text-slate-500">De-duplicated Member Ledgers</span>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CREATE ACCOUNT MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Open Share Capital (CBU) Account</h3>
                <p className="text-xs text-slate-400">Establish a member subscription ledger and save member branch</p>
              </div>
              <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {availableMembers.length === 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>All registered members currently have an active Share Capital account. Duplicate accounts are prevented. To adjust subscribed shares, please use the <strong>Edit</strong> button on the member's account.</span>
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-4">
              {/* Member Selection */}
              <div>
                <label className="text-xs text-slate-300 font-medium flex items-center justify-between">
                  <span>Member</span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {availableMembers.length} eligible without CBU
                  </span>
                </label>
                <select
                  required
                  value={newAccount.member_id}
                  onChange={e => {
                    const selectedId = e.target.value;
                    const selected = members.find(m => m.id === selectedId);
                    setNewAccount(prev => ({
                      ...prev,
                      member_id: selectedId,
                      branch_id: selected?.branch_id || prev.branch_id || branches[0]?.id || 'branch_tar'
                    }));
                  }}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Select member --</option>
                  {members.map(member => {
                    const alreadyHas = existingMemberIds.has(member.id);
                    return (
                      <option
                        key={member.id}
                        value={member.id}
                        disabled={alreadyHas}
                        className={alreadyHas ? 'text-slate-500 bg-slate-900' : 'text-white bg-slate-800'}
                      >
                        {member.member_no} - {member.first_name} {member.last_name} {alreadyHas ? ' (Already has CBU)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Branch Selection (Requirement 3: Save to Database) */}
              <div>
                <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Member Branch (Saved to Database)</span>
                </label>
                <select
                  value={newAccount.branch_id}
                  onChange={e => setNewAccount({ ...newAccount, branch_id: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">-- Select branch --</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  This branch will be saved directly on the share capital account database record.
                </p>
              </div>

              {/* Account Number */}
              <div>
                <label className="text-xs text-slate-300 font-medium">Account Number</label>
                <input
                  value={newAccount.account_number}
                  onChange={e => setNewAccount({ ...newAccount, account_number: e.target.value })}
                  placeholder="e.g. CBU-2026-00005"
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              {/* Subscription Parameters */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Par Value / Share (₱)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={newAccount.par_value}
                    onChange={e => setNewAccount({ ...newAccount, par_value: Number(e.target.value) || 100 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Subscribed Shares</label>
                  <input
                    type="number"
                    min="1"
                    value={newAccount.subscribed_shares}
                    onChange={e => setNewAccount({ ...newAccount, subscribed_shares: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Initial Paid-Up Shares</label>
                  <input
                    type="number"
                    min="0"
                    max={newAccount.subscribed_shares}
                    value={newAccount.paid_up_shares}
                    onChange={e => setNewAccount({ ...newAccount, paid_up_shares: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Status</label>
                  <select
                    value={newAccount.status}
                    onChange={e => setNewAccount({ ...newAccount, status: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Transferred">Transferred</option>
                  </select>
                </div>
              </div>

              {/* Capital Calculation Preview */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-750 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Subscribed Capital:</span>
                  <strong className="text-white">₱{(newAccount.subscribed_shares * newAccount.par_value).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Paid-Up Capital:</span>
                  <strong className="text-emerald-400">₱{(newAccount.paid_up_shares * newAccount.par_value).toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700">
                  <span>Remaining to Pay:</span>
                  <span className="text-amber-400 font-medium">
                    ₱{((newAccount.subscribed_shares - newAccount.paid_up_shares) * newAccount.par_value).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableMembers.length === 0}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer shadow transition"
                >
                  Create CBU Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ACCOUNT MODAL (Requirement 2: Edit Subscribed Shares etc.) */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-amber-400" />
                  <h3 className="text-base font-bold text-white">Edit Share Capital Account</h3>
                </div>
                <p className="text-xs text-slate-400">
                  {editingAccount.member_name} • Account {editingAccount.account_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Member Identification (Read-only) */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Member Owner</span>
                  <span className="font-semibold text-white text-sm">{editingAccount.member_name}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  {editingAccount.account_number}
                </span>
              </div>

              {/* Account Number & Branch */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Account Number</label>
                  <input
                    type="text"
                    value={editForm.account_number}
                    onChange={e => setEditForm({ ...editForm, account_number: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Branch</span>
                  </label>
                  <select
                    value={editForm.branch_id}
                    onChange={e => setEditForm({ ...editForm, branch_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subscription Editing: Subscribed Shares & Paid-Up Shares */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Par Value / Share (₱)</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={editForm.par_value}
                    onChange={e => {
                      const par = Number(e.target.value) || 100;
                      setEditForm(prev => ({
                        ...prev,
                        par_value: par,
                        subscribed_amount: prev.subscribed_shares * par,
                        paid_up_amount: prev.paid_up_shares * par
                      }));
                    }}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium">Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Withdrawn">Withdrawn</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Subscribed Shares (Highlighted) */}
                <div className="bg-slate-800/90 p-3 rounded-xl border border-amber-500/30">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-amber-300 font-semibold">Subscribed Shares</label>
                    <span className="text-[10px] text-slate-400">Equity commitment</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={editForm.subscribed_shares}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setEditForm(prev => ({
                        ...prev,
                        subscribed_shares: val,
                        subscribed_amount: val * prev.par_value
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white"
                  />
                  <div className="text-xs text-slate-300 mt-1.5 font-medium">
                    Total: <span className="text-amber-400 font-bold">₱{(editForm.subscribed_shares * editForm.par_value).toLocaleString()}</span>
                  </div>
                </div>

                {/* Paid-Up Shares */}
                <div className="bg-slate-800/90 p-3 rounded-xl border border-emerald-500/30">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-emerald-300 font-semibold">Paid-Up Shares</label>
                    <span className="text-[10px] text-slate-400">Actual capital</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={editForm.paid_up_shares}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setEditForm(prev => ({
                        ...prev,
                        paid_up_shares: val,
                        paid_up_amount: val * prev.par_value
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400"
                  />
                  <div className="text-xs text-slate-300 mt-1.5 font-medium">
                    Total: <span className="text-emerald-400 font-bold">₱{(editForm.paid_up_shares * editForm.par_value).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Equity Fulfillment Bar */}
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Equity Fulfillment:</span>
                  <span className="font-bold text-white">
                    {editForm.subscribed_shares > 0
                      ? `${Math.round((editForm.paid_up_shares / editForm.subscribed_shares) * 100)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, editForm.subscribed_shares > 0 ? (editForm.paid_up_shares / editForm.subscribed_shares) * 100 : 0)}%`
                    }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Unpaid Subscription:</span>
                  <span className="text-amber-400 font-medium">
                    ₱{Math.max(0, (editForm.subscribed_shares - editForm.paid_up_shares) * editForm.par_value).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleDeleteAccount(editingAccount)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold cursor-pointer transition border border-rose-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer shadow transition"
                  >
                    {isSavingEdit ? 'Saving...' : 'Save Account Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTRIBUTION / PAYMENT MODAL */}
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
                <p className="text-[10px] text-slate-400 mt-1">
                  Par value: ₱{activeAccount.par_value || 100}/share ({Math.floor(payAmount / (activeAccount.par_value || 100))} shares)
                </p>
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

      {/* Cooperative Share Capital Policy Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Cooperative Share Capital & Par Value Settings</h3>
                  <p className="text-xs text-slate-400">
                    Define institutional par value per share, minimum subscriptions, CDA statutory caps, and GL equity linkages.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ShareCapitalSettingsView
              settings={scSettings}
              accounts={chartAccounts}
              currentUser={currentUser}
              onRefresh={() => {
                loadSettings();
                loadAccounts();
              }}
              showNotice={(type, msg) => {
                setNotice(msg);
                setTimeout(() => setNotice(null), 5000);
              }}
            />
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
