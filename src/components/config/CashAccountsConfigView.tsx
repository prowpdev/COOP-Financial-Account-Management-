import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  Building2,
  Landmark,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  ArrowLeftRight,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Sliders,
  Layers,
  Coins
} from 'lucide-react';
import { api } from '../../services/api';
import { CashAccount, Branch, Account, User } from '../../types';

interface CashAccountsConfigViewProps {
  cashAccounts?: CashAccount[];
  branches?: Branch[];
  accounts?: Account[];
  currentUser?: User;
  onRefresh?: () => void;
  showNotice?: (type: 'success' | 'error', msg: string) => void;
}

type DepositoryCategory = 'ALL' | 'TELLER' | 'VAULT' | 'BANK' | 'PETTY' | 'DIGITAL';

export const CashAccountsConfigView: React.FC<CashAccountsConfigViewProps> = ({
  cashAccounts: initialAccounts,
  branches: initialBranches,
  accounts: initialCoa,
  currentUser,
  onRefresh,
  showNotice
}) => {
  const [cashList, setCashList] = useState<CashAccount[]>(initialAccounts || []);
  const [branchList, setBranchList] = useState<Branch[]>(initialBranches || []);
  const [coaList, setCoaList] = useState<Account[]>(initialCoa || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isAligning, setIsAligning] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DepositoryCategory>('ALL');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [mappingStatusFilter, setMappingStatusFilter] = useState<'ALL' | 'MAPPED' | 'UNMAPPED'>('ALL');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashAccount | null>(null);
  const [mappingAccount, setMappingAccount] = useState<CashAccount | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [selectedMappingGl, setSelectedMappingGl] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    category_preset: 'TELLER',
    account_number: '',
    bank_name: '',
    branch_id: '',
    gl_account_id: 'acc_1110',
    opening_balance: 10000,
    active: true
  });

  // Transfer Form State
  const [transferData, setTransferData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: 50000,
    transaction_date: new Date().toISOString().split('T')[0],
    notes: 'Depository Fund Rebalancing'
  });

  // In-app alert notification
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerNotice = (type: 'success' | 'error', message: string) => {
    if (showNotice) {
      showNotice(type, message);
    } else {
      setAlert({ type, message });
      setTimeout(() => setAlert(null), 5000);
    }
  };

  // Fetch full data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cashRes, coaRes, branchesRes] = await Promise.all([
        api.getCashAccounts(),
        api.getAccounts(),
        api.getBranches()
      ]);

      if (cashRes && cashRes.data) {
        setCashList(Array.isArray(cashRes.data) ? cashRes.data : []);
      }
      if (coaRes && coaRes.data) {
        setCoaList(Array.isArray(coaRes.data) ? coaRes.data : []);
      }
      if (branchesRes && branchesRes.data) {
        setBranchList(Array.isArray(branchesRes.data) ? branchesRes.data : []);
      }
    } catch (err: any) {
      console.error('Failed to load cash accounts data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialAccounts || initialAccounts.length === 0) {
      fetchData();
    } else {
      setCashList(initialAccounts);
    }
  }, [initialAccounts]);

  useEffect(() => {
    if (initialBranches && initialBranches.length > 0) setBranchList(initialBranches);
  }, [initialBranches]);

  useEffect(() => {
    if (initialCoa && initialCoa.length > 0) setCoaList(initialCoa);
  }, [initialCoa]);

  // Helper to categorize account
  const getAccountCategory = (acc: CashAccount): DepositoryCategory => {
    const num = (acc.account_number || '').toUpperCase();
    const name = (acc.name || '').toLowerCase();
    const bank = (acc.bank_name || '').toLowerCase();
    const gl = acc.gl_account_id;

    if (num.startsWith('VLT-') || name.includes('vault') || gl === 'acc_1112') return 'VAULT';
    if (gl === 'acc_1120' || gl === 'acc_1121' || bank.includes('bank') || name.includes('bank') || name.includes('checking') || name.includes('savings dep')) return 'BANK';
    if (gl === 'acc_1130' || name.includes('maya') || name.includes('gcash') || name.includes('wallet') || name.includes('digital')) return 'DIGITAL';
    if (gl === 'acc_1111' || name.includes('petty') || bank.includes('petty')) return 'PETTY';
    return 'TELLER';
  };

  // Liquidity Statistics calculation
  const stats = useMemo(() => {
    let totalLiquidity = 0;
    let vaultTotal = 0;
    let tellerTotal = 0;
    let bankTotal = 0;
    let digitalTotal = 0;
    let pettyTotal = 0;
    let unmappedCount = 0;

    cashList.forEach(acc => {
      const bal = Number(acc.current_balance) || 0;
      totalLiquidity += bal;
      const cat = getAccountCategory(acc);

      if (cat === 'VAULT') vaultTotal += bal;
      else if (cat === 'TELLER') tellerTotal += bal;
      else if (cat === 'BANK') bankTotal += bal;
      else if (cat === 'DIGITAL') digitalTotal += bal;
      else if (cat === 'PETTY') pettyTotal += bal;

      // Check GL mapping validity
      const matchedGl = coaList.find(c => c.id === acc.gl_account_id || c.code === acc.gl_account_id || (c as any).account_code === acc.gl_account_id);
      if (!matchedGl) unmappedCount++;
    });

    return {
      totalLiquidity,
      vaultTotal,
      tellerTotal,
      bankTotal,
      digitalTotal,
      pettyTotal,
      unmappedCount,
      totalAccounts: cashList.length
    };
  }, [cashList, coaList]);

  // Filtered accounts list
  const filteredAccounts = useMemo(() => {
    return cashList.filter(acc => {
      // Search
      const q = searchQuery.toLowerCase();
      const gl = coaList.find(c => c.id === acc.gl_account_id || c.code === acc.gl_account_id);
      const glText = gl ? `${gl.code} ${gl.name}`.toLowerCase() : '';
      const matchesSearch =
        !searchQuery ||
        acc.name.toLowerCase().includes(q) ||
        acc.account_number.toLowerCase().includes(q) ||
        acc.bank_name.toLowerCase().includes(q) ||
        glText.includes(q);

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== 'ALL') {
        const cat = getAccountCategory(acc);
        if (cat !== selectedCategory) return false;
      }

      // Branch filter
      if (selectedBranch !== 'all' && acc.branch_id !== selectedBranch) {
        return false;
      }

      // Mapping Status filter
      if (mappingStatusFilter === 'MAPPED') {
        return !!gl;
      }
      if (mappingStatusFilter === 'UNMAPPED') {
        return !gl;
      }

      return true;
    });
  }, [cashList, searchQuery, selectedCategory, selectedBranch, mappingStatusFilter, coaList]);

  // Handle Opening Account Modal
  const openAddModal = () => {
    const defaultBranch = branchList[0]?.id || 'branch_tar';
    setFormData({
      name: '',
      category_preset: 'TELLER',
      account_number: `COH-${branchList[0]?.code || 'TAR'}-02`,
      bank_name: 'Cash Drawer Float',
      branch_id: defaultBranch,
      gl_account_id: 'acc_1110',
      opening_balance: 50000,
      active: true
    });
    setEditingAccount(null);
    setIsAddOpen(true);
  };

  // Preset configuration change
  const handleCategoryPresetChange = (preset: string) => {
    const branch = branchList.find(b => b.id === formData.branch_id) || branchList[0];
    const bCode = branch?.code || 'TAR';

    if (preset === 'TELLER') {
      setFormData(prev => ({
        ...prev,
        category_preset: preset,
        account_number: `COH-${bCode}-02`,
        bank_name: 'Cash Drawer Float',
        gl_account_id: 'acc_1110'
      }));
    } else if (preset === 'VAULT') {
      setFormData(prev => ({
        ...prev,
        category_preset: preset,
        account_number: `VLT-${bCode}-01`,
        bank_name: `${branch?.name || 'Branch'} Vault Safety Depository`,
        gl_account_id: ''
      }));
    } else if (preset === 'BANK') {
      setFormData(prev => ({
        ...prev,
        category_preset: preset,
        account_number: 'LBP-2026-9912',
        bank_name: 'Land Bank of the Philippines',
        gl_account_id: 'acc_1120'
      }));
    } else if (preset === 'DIGITAL') {
      setFormData(prev => ({
        ...prev,
        category_preset: preset,
        account_number: 'MYA-0988-1122',
        bank_name: 'Maya Philippines, Inc.',
        gl_account_id: 'acc_1130'
      }));
    } else if (preset === 'PETTY') {
      setFormData(prev => ({
        ...prev,
        category_preset: preset,
        account_number: `PCF-${bCode}-01`,
        bank_name: 'Revolving Petty Cash Safe',
        gl_account_id: 'acc_1111'
      }));
    }
  };

  // Open Edit Modal
  const openEditModal = (acc: CashAccount) => {
    setEditingAccount(acc);
    setFormData({
      name: acc.name,
      category_preset: getAccountCategory(acc),
      account_number: acc.account_number,
      bank_name: acc.bank_name,
      branch_id: acc.branch_id,
      gl_account_id: acc.gl_account_id,
      opening_balance: acc.opening_balance,
      active: acc.active
    });
    setIsAddOpen(true);
  };

  // Save Account (Create or Update)
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAccount) {
        await api.updateCashAccount(editingAccount.id, {
          name: formData.name,
          account_number: formData.account_number,
          bank_name: formData.bank_name,
          branch_id: formData.branch_id,
          gl_account_id: formData.gl_account_id,
          active: formData.active,
          changed_by: currentUser?.name || 'Admin',
          reason: 'Updated cash/bank account parameters and GL mapping'
        });
        triggerNotice('success', `Updated depository account "${formData.name}".`);
      } else {
        await api.createCashAccount({
          name: formData.name,
          account_number: formData.account_number,
          bank_name: formData.bank_name,
          branch_id: formData.branch_id,
          gl_account_id: formData.gl_account_id,
          opening_balance: Number(formData.opening_balance) || 0,
          current_balance: Number(formData.opening_balance) || 0,
          active: formData.active,
          changed_by: currentUser?.name || 'Admin',
          reason: 'Created new cash/bank depository'
        });
        triggerNotice('success', `Created new depository "${formData.name}".`);
      }
      setIsAddOpen(false);
      setEditingAccount(null);
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      triggerNotice('error', err.message || 'Failed to save cash account.');
    }
  };

  // Open Direct Quick GL Mapping Modal
  const openQuickGlModal = (acc: CashAccount) => {
    setMappingAccount(acc);
    setSelectedMappingGl(acc.gl_account_id || 'acc_1110');
  };

  // Save Quick GL Mapping
  const handleSaveQuickGl = async () => {
    if (!mappingAccount) return;
    try {
      await api.updateCashAccount(mappingAccount.id, {
        gl_account_id: selectedMappingGl,
        changed_by: currentUser?.name || 'Finance Officer',
        reason: `Remapped GL Account to ${selectedMappingGl}`
      });
      const gl = coaList.find(c => c.id === selectedMappingGl || c.code === selectedMappingGl);
      triggerNotice('success', `Mapped "${mappingAccount.name}" to GL ${gl ? `${gl.code} - ${gl.name}` : selectedMappingGl}.`);
      setMappingAccount(null);
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      triggerNotice('error', err.message || 'Failed to update GL account mapping.');
    }
  };

  // Delete Account
  const handleDeleteAccount = async (acc: CashAccount) => {
    if (!confirm(`Are you sure you want to delete depository "${acc.name}" (${acc.account_number})?`)) {
      return;
    }
    try {
      await api.deleteCashAccount(acc.id);
      triggerNotice('success', `Deleted depository account "${acc.name}".`);
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      triggerNotice('error', err.message || 'Failed to delete account.');
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (acc: CashAccount) => {
    try {
      const nextActive = !acc.active;
      await api.updateCashAccount(acc.id, {
        active: nextActive,
        changed_by: currentUser?.name || 'Admin',
        reason: `${nextActive ? 'Activated' : 'Deactivated'} depository account`
      });
      triggerNotice('success', `Account "${acc.name}" is now ${nextActive ? 'Active' : 'Inactive'}.`);
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      triggerNotice('error', err.message || 'Failed to toggle account status.');
    }
  };

  // Execute Transfer & Generate JV
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.from_account_id || !transferData.to_account_id) {
      triggerNotice('error', 'Please select both source and destination accounts.');
      return;
    }
    if (transferData.from_account_id === transferData.to_account_id) {
      triggerNotice('error', 'Source and destination accounts must be different.');
      return;
    }
    if (transferData.amount <= 0) {
      triggerNotice('error', 'Transfer amount must be greater than zero.');
      return;
    }

    try {
      await api.transferCash({
        from_account_id: transferData.from_account_id,
        to_account_id: transferData.to_account_id,
        amount: Number(transferData.amount),
        transaction_date: transferData.transaction_date,
        notes: transferData.notes,
        performed_by: currentUser?.name || 'Finance Officer'
      });
      triggerNotice('success', `Successfully transferred ₱${Number(transferData.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} with balanced Journal Voucher posted!`);
      setIsTransferOpen(false);
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      triggerNotice('error', err.message || 'Transfer failed.');
    }
  };

  // Auto-Align CDA Mappings
  const handleAutoAlign = async () => {
    setIsAligning(true);
    try {
      const res = await api.autoAlignCashAccountsGl();
      if (res && res.success) {
        triggerNotice('success', `Auto-aligned ${res.count || 0} cash and bank accounts to CDA standard Chart of Accounts!`);
        await fetchData();
        if (onRefresh) onRefresh();
      }
    } catch (err: any) {
      triggerNotice('error', err.message || 'Auto-alignment failed.');
    } finally {
      setIsAligning(false);
    }
  };

  // Relevant Chart of Accounts filtered by Assets & Cash
  const cashRelevantCoa = useMemo(() => {
    return coaList.filter(a => {
      const cat = (a.type || a.category || '').toLowerCase();
      const code = String(a.code || (a as any).account_code || '');
      return cat.includes('asset') || code.startsWith('11') || code.startsWith('1');
    });
  }, [coaList]);

  return (
    <div className="space-y-6">
      {/* Alert banner if notice prop not present */}
      {alert && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold ${
            alert.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{alert.message}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <Landmark className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Dynamic Cash & Bank Accounts Mapping
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Manage branch cash vaults, cashier teller drawers, commercial bank depositories, and digital clearing wallets.
            Every cash movement links directly to the General Ledger via dynamic double-entry GL account mappings.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-auto-align-cda"
            onClick={handleAutoAlign}
            disabled={isAligning}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-50 shadow-sm"
            title="Automatically aligns Land Bank to 1120, DBP to 1121, Vaults to 1112, and Tellers to 1110"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAligning ? 'animate-spin' : 'text-amber-400'}`} />
            <span>{isAligning ? 'Aligning...' : 'Auto-Align CDA Mappings'}</span>
          </button>

          <button
            id="btn-transfer-depository"
            onClick={() => {
              if (cashList.length >= 2) {
                setTransferData({
                  from_account_id: cashList[0].id,
                  to_account_id: cashList[1].id,
                  amount: 25000,
                  transaction_date: new Date().toISOString().split('T')[0],
                  notes: 'Depository Vault / Float Rebalancing'
                });
                setIsTransferOpen(true);
              } else {
                triggerNotice('error', 'At least two cash accounts are required for transfer.');
              }
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition cursor-pointer shadow-sm"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>Transfer / Rebalance</span>
          </button>

          <button
            id="btn-open-depository"
            onClick={openAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-900/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Open Depository</span>
          </button>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Refresh Account Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Liquidity */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Liquidity</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-400 mt-1 font-mono">
            ₱{stats.totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center space-x-1">
            <span className="text-slate-300 font-semibold">{stats.totalAccounts}</span>
            <span>monitored depositories</span>
          </div>
        </div>

        {/* Vault Reserves */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Cash in Vaults</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-blue-300 mt-1 font-mono">
            ₱{stats.vaultTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Mapped to <span className="font-mono text-slate-300">1112</span> Safe Reserves
          </div>
        </div>

        {/* Teller Cash Drawers */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Teller Drawers</span>
            <Wallet className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-indigo-300 mt-1 font-mono">
            ₱{stats.tellerTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            Mapped to <span className="font-mono text-slate-300">1110</span> Cash on Hand
          </div>
        </div>

        {/* Bank Deposits */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Bank Depositories</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-purple-300 mt-1 font-mono">
            ₱{stats.bankTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            LBP & DBP Operating accounts
          </div>
        </div>

        {/* GL Alignment Health */}
        <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>GL Sync Status</span>
            {stats.unmappedCount === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className="text-lg sm:text-xl font-bold text-white mt-1">
            {stats.unmappedCount === 0 ? (
              <span className="text-emerald-400 text-sm flex items-center space-x-1">
                <span>100% Mapped</span>
              </span>
            ) : (
              <span className="text-amber-400 text-sm">
                {stats.unmappedCount} Unmapped
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {stats.unmappedCount === 0 ? 'All sub-ledgers tied to GL' : 'Action required: Map GL'}
          </div>
        </div>
      </div>

      {/* Toolbar & Category Filters */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center overflow-x-auto space-x-1.5 pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Depositories', count: cashList.length },
              { id: 'TELLER', label: 'Teller Drawers', count: cashList.filter(a => getAccountCategory(a) === 'TELLER').length },
              { id: 'VAULT', label: 'Cash Vaults', count: cashList.filter(a => getAccountCategory(a) === 'VAULT').length },
              { id: 'BANK', label: 'Bank Accounts', count: cashList.filter(a => getAccountCategory(a) === 'BANK').length },
              { id: 'DIGITAL', label: 'Digital Wallets', count: cashList.filter(a => getAccountCategory(a) === 'DIGITAL').length },
              { id: 'PETTY', label: 'Petty Cash', count: cashList.filter(a => getAccountCategory(a) === 'PETTY').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as DepositoryCategory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center space-x-1.5 cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === tab.id ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Branch & Search Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Branches</option>
              {branchList.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>

            <select
              value={mappingStatusFilter}
              onChange={e => setMappingStatusFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="ALL">All Mapping Status</option>
              <option value="MAPPED">Mapped Only</option>
              <option value="UNMAPPED">Unmapped Only</option>
            </select>
          </div>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search depositories by name, account number, institution, or mapped GL code/account..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Cash Accounts Cards Grid */}
      {filteredAccounts.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
            <Wallet className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-300">No Cash Accounts Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No depository accounts match your filter criteria. You can clear the search filter or open a new depository account.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open Cash/Bank Account</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map(acc => {
            const category = getAccountCategory(acc);
            const branch = branchList.find(b => b.id === acc.branch_id);
            const glAccount = coaList.find(
              c => c.id === acc.gl_account_id || c.code === acc.gl_account_id || (c as any).account_code === acc.gl_account_id
            );

            // Icon by category
            const CatIcon =
              category === 'VAULT'
                ? ShieldCheck
                : category === 'BANK'
                ? Building2
                : category === 'DIGITAL'
                ? Landmark
                : category === 'PETTY'
                ? Coins
                : Wallet;

            const categoryBadgeColor =
              category === 'VAULT'
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : category === 'BANK'
                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                : category === 'DIGITAL'
                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                : category === 'PETTY'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

            return (
              <div
                key={acc.id}
                className={`bg-slate-900/90 rounded-2xl border transition-all duration-200 flex flex-col justify-between hover:border-slate-700 hover:shadow-lg ${
                  acc.active ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
                }`}
              >
                {/* Card Header */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start space-x-2.5">
                      <div className={`p-2 rounded-xl border mt-0.5 ${categoryBadgeColor}`}>
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white leading-tight">{acc.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-1.5">
                          <span>{acc.bank_name || 'Direct Depository'}</span>
                          <span>•</span>
                          <span className="text-slate-300">{branch?.name || 'All Branches'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                        {acc.account_number}
                      </span>
                    </div>
                  </div>

                  {/* Balance Display */}
                  <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Sub-Ledger Balance
                      </span>
                      <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                        ₱{Number(acc.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        Currency
                      </span>
                      <div className="text-xs font-semibold text-slate-300 mt-0.5">
                        {acc.currency || 'PHP'}
                      </div>
                    </div>
                  </div>

                  {/* GL Mapping Section (Featured & Interactive) */}
                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-slate-400 text-xs font-medium">
                        <Layers className="w-3.5 h-3.5 text-emerald-400" />
                        <span>General Ledger Mapping:</span>
                      </div>
                      <button
                        onClick={() => openQuickGlModal(acc)}
                        className="flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                        title="Change GL Account mapping"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>Map GL</span>
                      </button>
                    </div>

                    {glAccount ? (
                      <div className="flex items-center justify-between bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-700/80">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {glAccount.code}
                          </span>
                          <span className="text-xs font-medium text-slate-200 truncate max-w-[170px]" title={glAccount.name}>
                            {glAccount.name}
                          </span>
                        </div>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/30 text-amber-300">
                        <div className="flex items-center space-x-1.5 text-xs">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>GL ID: {acc.gl_account_id} (Unresolved)</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-amber-400">Fix</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleActive(acc)}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md cursor-pointer transition ${
                        acc.active
                          ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {acc.active ? 'Active' : 'Inactive'}
                    </button>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Op: ₱{Number(acc.opening_balance || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setTransferData(prev => ({
                          ...prev,
                          from_account_id: acc.id,
                          to_account_id: cashList.find(c => c.id !== acc.id)?.id || ''
                        }));
                        setIsTransferOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Transfer from this depository"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title="Edit Account Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(acc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Delete Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ADD / EDIT CASH ACCOUNT & GL MAPPING           */}
      {/* ======================================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {editingAccount ? `Edit Depository: ${editingAccount.name}` : 'Open New Cash / Bank Depository'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddOpen(false);
                  setEditingAccount(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-5 space-y-4">
              {/* Category Quick Presets (Only on Add) */}
              {!editingAccount && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Depository Type Preset
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'TELLER', label: 'Teller Drawer', gl: '1110' },
                      { id: 'VAULT', label: 'Cash Vault', gl: '1112' },
                      { id: 'BANK', label: 'Bank Acct', gl: '1120' },
                      { id: 'DIGITAL', label: 'Digital Wallet', gl: '1130' },
                      { id: 'PETTY', label: 'Petty Cash', gl: '1111' }
                    ].map(preset => (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleCategoryPresetChange(preset.id)}
                        className={`px-2.5 py-1.5 rounded-xl border text-center transition cursor-pointer ${
                          formData.category_preset === preset.id
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[11px]">{preset.label}</div>
                        <div className="text-[9px] font-mono text-slate-500">GL: {preset.gl}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Account Name */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Account Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Urdaneta Branch Vault Safe / Land Bank Operating"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Account Number */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Depository / Account Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. COH-TAR-02 or LBP-1920-3341"
                    value={formData.account_number}
                    onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Bank / Institution */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Bank / Custodian Institution *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Land Bank of the Philippines"
                    value={formData.bank_name}
                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Assigned Branch */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Assigned Branch *</label>
                  <select
                    value={formData.branch_id}
                    onChange={e => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {branchList.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Opening Balance (Only for new) */}
                <div>
                  <label className="text-xs font-medium text-slate-300">
                    Opening Float Balance (₱)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={!!editingAccount}
                    value={formData.opening_balance}
                    onChange={e => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>

                {/* Mapped GL Account (Critical Dynamic Mapping) */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-400">
                      Mapped General Ledger Account *
                    </label>
                    <span className="text-[10px] text-slate-400">CDA Standard Chart of Accounts</span>
                  </div>
                  <select
                    value={formData.gl_account_id}
                    onChange={e => setFormData({ ...formData, gl_account_id: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-emerald-300 font-medium focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <optgroup label="Cash & Cash Equivalents">
                      {cashRelevantCoa.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name} ({acc.category || acc.type})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other Accounts">
                      {coaList
                        .filter(a => !cashRelevantCoa.some(c => c.id === a.id))
                        .map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} — {acc.name} ({acc.category || acc.type})
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Receipts debit this GL account; disbursements credit this GL account during daily operations.
                  </p>
                </div>

                {/* Active Checkbox */}
                <div className="sm:col-span-2 flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="chk-active-depository"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="chk-active-depository" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Account is active and operational for cashier disbursements & loan releases
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    setEditingAccount(null);
                  }}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-950 cursor-pointer"
                >
                  {editingAccount ? 'Save Changes' : 'Open Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: QUICK GL ACCOUNT MAPPING DIALOG                */}
      {/* ======================================================== */}
      {mappingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400">
                  <Layers className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Configure GL Account Mapping</h3>
              </div>
              <button onClick={() => setMappingAccount(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
                <div className="text-xs font-bold text-white">{mappingAccount.name}</div>
                <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                  <span className="font-mono text-slate-300">{mappingAccount.account_number}</span>
                  <span>•</span>
                  <span>{mappingAccount.bank_name}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-400 block mb-1">
                  Select Target Chart of Accounts (COA) Account
                </label>
                <select
                  value={selectedMappingGl}
                  onChange={e => setSelectedMappingGl(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  <optgroup label="Standard Cash & Cash Equivalents">
                    {cashRelevantCoa.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} — {acc.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="All Asset Accounts">
                    {coaList
                      .filter(a => !cashRelevantCoa.some(c => c.id === a.id))
                      .map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.code} — {acc.name}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Explanatory preview */}
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 text-xs space-y-1 text-slate-300">
                <div className="font-semibold text-slate-200">Accounting Impact:</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When payments, loan disbursements, or member savings deposits interact with{' '}
                  <strong className="text-white">{mappingAccount.name}</strong>, the system will dynamically post debits/credits
                  to the selected GL account above.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMappingAccount(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickGl}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                >
                  Save GL Mapping
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: CASH REBALANCE & TRANSFER SIMULATOR            */}
      {/* ======================================================== */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Intra-Depository Fund Transfer</h3>
              </div>
              <button onClick={() => setIsTransferOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* From Account */}
                <div>
                  <label className="text-xs font-medium text-slate-300">From Depository (Credit GL)</label>
                  <select
                    value={transferData.from_account_id}
                    onChange={e => setTransferData({ ...transferData, from_account_id: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {cashList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (₱{Number(c.current_balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Account */}
                <div>
                  <label className="text-xs font-medium text-slate-300">To Depository (Debit GL)</label>
                  <select
                    value={transferData.to_account_id}
                    onChange={e => setTransferData({ ...transferData, to_account_id: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {cashList.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (₱{Number(c.current_balance).toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Transfer Amount (₱) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={transferData.amount}
                    onChange={e => setTransferData({ ...transferData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="text-xs font-medium text-slate-300">Posting Date *</label>
                  <input
                    type="date"
                    required
                    value={transferData.transaction_date}
                    onChange={e => setTransferData({ ...transferData, transaction_date: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-300">Voucher Remarks / Purpose</label>
                  <input
                    type="text"
                    value={transferData.notes}
                    onChange={e => setTransferData({ ...transferData, notes: e.target.value })}
                    placeholder="e.g. Branch Vault to Teller Float replenishment"
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Simulated Journal Voucher */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold border-b border-slate-800 pb-1">
                  <span>Generated Journal Voucher Lines:</span>
                  <span className="text-emerald-400">Balanced (1:1)</span>
                </div>
                <div className="grid grid-cols-3 text-[11px] pt-1 text-slate-300 font-mono">
                  <div>
                    Dr:{' '}
                    {coaList.find(c => c.id === cashList.find(a => a.id === transferData.to_account_id)?.gl_account_id)?.code || '1110'}
                  </div>
                  <div className="truncate">
                    {cashList.find(a => a.id === transferData.to_account_id)?.name || 'Destination'}
                  </div>
                  <div className="text-right text-emerald-400">
                    ₱{Number(transferData.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="grid grid-cols-3 text-[11px] text-slate-300 font-mono">
                  <div>
                    Cr:{' '}
                    {coaList.find(c => c.id === cashList.find(a => a.id === transferData.from_account_id)?.gl_account_id)?.code || '1110'}
                  </div>
                  <div className="truncate">
                    {cashList.find(a => a.id === transferData.from_account_id)?.name || 'Source'}
                  </div>
                  <div className="text-right text-slate-300">
                    ₱{Number(transferData.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-md shadow-cyan-950"
                >
                  Post Transfer & JV
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashAccountsConfigView;
