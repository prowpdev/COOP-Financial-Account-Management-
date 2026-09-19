import React, { useState, useEffect } from 'react';
import {
  Coins,
  Building2,
  ShieldCheck,
  Edit3,
  Plus,
  FileText,
  CheckCircle2,
  AlertCircle,
  Percent,
  History,
  Scale,
  X,
  Save,
  Info
} from 'lucide-react';
import { Account, ShareCapitalSetting, User } from '../../types';
import { api } from '../../services/api';

interface ShareCapitalSettingsViewProps {
  settings?: ShareCapitalSetting[];
  accounts: Account[];
  currentUser: User;
  onRefresh?: () => void;
  showNotice: (type: 'success' | 'error', msg: string) => void;
}

export const ShareCapitalSettingsView: React.FC<ShareCapitalSettingsViewProps> = ({
  settings: initialSettings = [],
  accounts = [],
  currentUser,
  onRefresh,
  showNotice
}) => {
  const [settingsList, setSettingsList] = useState<ShareCapitalSetting[]>(initialSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSetting, setEditingSetting] = useState<ShareCapitalSetting | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    par_value_per_share: 100,
    min_subscription_shares: 100,
    min_paid_up_shares: 25,
    max_share_holding_percentage: 10.0,
    transfer_fee: 100,
    withdrawal_rule: 'Subject to Board approval and 30-day prior written notice',
    accounting_account_id: 'acc_3110',
    reason: ''
  });

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.getShareCapitalSettings();
      if (res.data && res.data.length > 0) {
        setSettingsList(res.data);
      }
    } catch (err: any) {
      console.error('Failed to load share capital settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSettings || initialSettings.length === 0) {
      fetchSettings();
    } else {
      setSettingsList(initialSettings);
    }
  }, [initialSettings]);

  const activeSetting: ShareCapitalSetting = settingsList[0] || {
    id: 'sc_setting_01',
    cooperative_id: 'coop_01',
    par_value_per_share: 100,
    min_subscription_shares: 100,
    min_paid_up_shares: 25,
    max_share_holding_percentage: 10,
    transfer_fee: 100,
    withdrawal_rule: 'Subject to Board approval and 30-day prior written notice',
    accounting_account_id: 'acc_3110'
  };

  const equityAccounts = accounts.filter(a => 
    a.category === 'Equity' || 
    (a as any).type === 'Equity' || 
    a.account_code?.startsWith('3') || 
    (a as any).code?.startsWith('3')
  );

  const selectedGlAccount = accounts.find(a => a.id === activeSetting.accounting_account_id);

  const handleOpenEdit = (setting: ShareCapitalSetting) => {
    setEditingSetting(setting);
    setIsCreatingNew(false);
    setFormError(null);
    setFormData({
      par_value_per_share: Number(setting.par_value_per_share) || 100,
      min_subscription_shares: Number(setting.min_subscription_shares) || 100,
      min_paid_up_shares: Number(setting.min_paid_up_shares) || 25,
      max_share_holding_percentage: Number(setting.max_share_holding_percentage) || 10,
      transfer_fee: Number(setting.transfer_fee) || 100,
      withdrawal_rule: setting.withdrawal_rule || 'Subject to Board approval and 30-day prior written notice',
      accounting_account_id: setting.accounting_account_id || 'acc_3110',
      reason: ''
    });
  };

  const handleOpenCreate = () => {
    setEditingSetting(null);
    setIsCreatingNew(true);
    setFormError(null);
    setFormData({
      par_value_per_share: 100,
      min_subscription_shares: 100,
      min_paid_up_shares: 25,
      max_share_holding_percentage: 10,
      transfer_fee: 100,
      withdrawal_rule: 'Subject to Board approval and 30-day prior written notice',
      accounting_account_id: equityAccounts[0]?.id || 'acc_3110',
      reason: 'Created new cooperative share capital policy setting'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parValue = Number(formData.par_value_per_share);
    const minSub = Number(formData.min_subscription_shares);
    const minPaid = Number(formData.min_paid_up_shares);
    const maxHolding = Number(formData.max_share_holding_percentage);

    if (parValue <= 0) {
      setFormError('Par value per share must be greater than zero.');
      return;
    }
    if (minSub <= 0) {
      setFormError('Minimum subscription shares must be greater than zero.');
      return;
    }
    if (minPaid < 0) {
      setFormError('Minimum paid-up shares cannot be negative.');
      return;
    }
    if (minPaid > minSub) {
      setFormError(`Minimum paid-up shares (${minPaid}) cannot exceed minimum subscription shares (${minSub}).`);
      return;
    }
    if (maxHolding <= 0 || maxHolding > 100) {
      setFormError('Maximum share holding percentage must be between 1% and 100% (CDA standard is 10%).');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreatingNew) {
        await api.createShareCapitalSetting({
          ...formData,
          cooperative_id: 'coop_01',
          changed_by: currentUser.name,
          reason: formData.reason || 'Created new share capital policy version'
        });
        showNotice('success', 'Cooperative share capital setting created successfully.');
      } else if (editingSetting) {
        await api.updateShareCapitalSetting(editingSetting.id, {
          ...formData,
          changed_by: currentUser.name,
          reason: formData.reason || 'Updated cooperative share capital policy parameters'
        });
        showNotice('success', 'Cooperative share capital setting updated successfully.');
      }

      setEditingSetting(null);
      setIsCreatingNew(false);
      await fetchSettings();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save share capital setting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minSubTotal = Number(formData.min_subscription_shares || 0) * Number(formData.par_value_per_share || 0);
  const minPaidTotal = Number(formData.min_paid_up_shares || 0) * Number(formData.par_value_per_share || 0);
  const paidRatio = minSubTotal > 0 ? ((minPaidTotal / minSubTotal) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Share Capital (CBU) Cooperative Settings</h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
              CDA Art. 60 Compliant
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure the cooperative's statutory share capital baseline, nominal par value per share, subscription minimums, and equity ledger mappings.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-edit-cbu-setting"
            onClick={() => handleOpenEdit(activeSetting)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Policy Settings</span>
          </button>
          <button
            id="btn-create-cbu-setting"
            onClick={handleOpenCreate}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New Policy Version</span>
          </button>
        </div>
      </div>

      {/* Regulatory Context Callout */}
      <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/80 flex items-start space-x-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-slate-200">
            Why Par Value is saved in <code className="text-emerald-400 font-mono">share_capital_settings</code>:
          </p>
          <p className="text-slate-400 leading-relaxed">
            Under Philippine Cooperative Law (RA 9520) and CDA standard operating rules, a cooperative's <strong>Par Value per Share</strong> (standard ₱100.00/share) is an institutional policy mandated by the Articles of Cooperation and By-Laws. Member share capital is non-speculative and strictly issued/redeemed at par value. Saving this at the cooperative configuration level ensures that all member subscriptions, minimum paid-up calculations, and the 10% statutory ownership ceiling remain uniform and audit-compliant across all branches.
          </p>
        </div>
      </div>

      {/* Active Policy Highlight Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 rounded-2xl p-6 border border-emerald-800/40 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Institutional Policy Baseline
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Setting Identifier: <span className="font-mono text-slate-300">{activeSetting.id}</span> • Cooperative: <span className="text-emerald-400 font-semibold">{activeSetting.cooperative_id}</span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Active In Production</span>
            </span>
          </div>
        </div>

        {/* Core Financial Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Par Value */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Par Value / Share</span>
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              ₱{Number(activeSetting.par_value_per_share || 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] text-slate-400">Nominal statutory value per 1 share</p>
          </div>

          {/* Min Subscription */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Min. Subscription</span>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {activeSetting.min_subscription_shares} <span className="text-sm font-normal text-slate-400">shares</span>
            </div>
            <p className="text-[10px] text-cyan-400">
              ₱{(Number(activeSetting.min_subscription_shares || 0) * Number(activeSetting.par_value_per_share || 0)).toLocaleString()} total committed
            </p>
          </div>

          {/* Min Paid Up */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Min. Initial Paid-Up</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {activeSetting.min_paid_up_shares} <span className="text-sm font-normal text-slate-400">shares</span>
            </div>
            <p className="text-[10px] text-emerald-400">
              ₱{(Number(activeSetting.min_paid_up_shares || 0) * Number(activeSetting.par_value_per_share || 0)).toLocaleString()} initial deposit requirement
            </p>
          </div>

          {/* Max Shareholding */}
          <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Max Shareholding Cap</span>
              <Percent className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">
              {activeSetting.max_share_holding_percentage}%
            </div>
            <p className="text-[10px] text-slate-400">CDA Art. 60 single-member limit</p>
          </div>
        </div>

        {/* Secondary Parameters & Accounting Mapping */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">Share Transfer Fee</div>
            <div className="text-lg font-bold text-slate-100">
              ₱{Number(activeSetting.transfer_fee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-400">Charged on member-to-member assignment</p>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">Equity GL Account (Chart of Accounts)</div>
            <div className="text-sm font-bold text-emerald-300">
              {selectedGlAccount ? `${selectedGlAccount.account_code || (selectedGlAccount as any).code} — ${selectedGlAccount.name}` : activeSetting.accounting_account_id}
            </div>
            <p className="text-[11px] text-slate-400">General Ledger account credited on share deposits</p>
          </div>

          <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800 space-y-1.5">
            <div className="text-xs font-semibold text-slate-300">Withdrawal & Termination Policy</div>
            <div className="text-xs text-slate-200 line-clamp-2">
              {activeSetting.withdrawal_rule || 'Subject to Board approval and 30-day prior written notice'}
            </div>
            <p className="text-[11px] text-slate-400">Governance condition on membership cessation</p>
          </div>
        </div>
      </div>

      {/* Historical Settings & Revision Ledger */}
      {settingsList.length > 1 && (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">All Cooperative Setting Versions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-400">
                <tr>
                  <th className="p-2.5">Version / ID</th>
                  <th className="p-2.5">Par Value</th>
                  <th className="p-2.5">Min Subscribed</th>
                  <th className="p-2.5">Min Paid-Up</th>
                  <th className="p-2.5">Max Holding %</th>
                  <th className="p-2.5">GL Account</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {settingsList.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-mono text-emerald-400">
                      {st.id} {idx === 0 && <span className="ml-1 text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800">Active</span>}
                    </td>
                    <td className="p-2.5 font-semibold text-white">₱{st.par_value_per_share}</td>
                    <td className="p-2.5">{st.min_subscription_shares} shares (₱{(st.min_subscription_shares * st.par_value_per_share).toLocaleString()})</td>
                    <td className="p-2.5">{st.min_paid_up_shares} shares (₱{(st.min_paid_up_shares * st.par_value_per_share).toLocaleString()})</td>
                    <td className="p-2.5">{st.max_share_holding_percentage}%</td>
                    <td className="p-2.5 font-mono text-slate-400">{st.accounting_account_id}</td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleOpenEdit(st)}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CDA Governance Guidelines Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Scale className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">CDA Article 60 Protection</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            No member of a primary cooperative shall own or hold more than ten percent (10%) of the share capital of the cooperative. This prevents monopolization and preserves democratic member control ("One Member, One Vote").
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-cyan-400">
            <Coins className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Capital Build-Up (CBU)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Members subscribe to a commitment of shares at joining. Monthly contributions or patronage allocations systematically credit paid-up shares at the statutory par value until the subscription commitment is fully completed.
          </p>
        </div>

        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-2">
          <div className="flex items-center space-x-2 text-amber-400">
            <ShieldCheck className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Interest on Share Capital (ISC)</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Annual cooperative net surpluses allocate statutory statutory reserves (General Reserve, Education, Community Development) and distribute Interest on Share Capital (ISC) pro-rata based on members' paid-up share capital.
          </p>
        </div>
      </div>

      {/* CREATE / EDIT SETTING MODAL */}
      {(editingSetting || isCreatingNew) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/40">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {isCreatingNew ? 'Create Cooperative Share Capital Setting' : `Edit Share Capital Policy (${editingSetting?.id})`}
                </h3>
              </div>
              <button
                onClick={() => { setEditingSetting(null); setIsCreatingNew(false); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-900/40 border border-red-700/50 rounded-xl flex items-center space-x-2 text-red-200 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Par Value Per Share */}
              <div className="bg-emerald-950/30 rounded-xl p-4 border border-emerald-800/40 space-y-2">
                <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                  <span>Par Value Per Share (₱) *</span>
                  <span className="text-[11px] font-normal text-slate-400">Established in By-Laws</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={formData.par_value_per_share}
                  onChange={e => setFormData({ ...formData, par_value_per_share: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-emerald-700/50 rounded-lg px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-400">
                  This nominal share price applies to all member subscriptions and CBU equity accounts. Standard CDA cooperative par value is ₱100.00, ₱500.00, or ₱1,000.00.
                </p>
              </div>

              {/* Subscriptions & Paid-Up Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Min. Subscription Shares *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.min_subscription_shares}
                    onChange={e => setFormData({ ...formData, min_subscription_shares: parseInt(e.target.value, 10) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Equivalent to: <strong className="text-white">₱{minSubTotal.toLocaleString()}</strong> committed
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Min. Initial Paid-Up Shares *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.min_paid_up_shares}
                    onChange={e => setFormData({ ...formData, min_paid_up_shares: parseInt(e.target.value, 10) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Equivalent to: <strong className="text-emerald-400">₱{minPaidTotal.toLocaleString()}</strong> ({paidRatio}% of sub)
                  </span>
                </div>
              </div>

              {/* Max Holding & Transfer Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Max Share Holding Limit (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.1"
                    required
                    value={formData.max_share_holding_percentage}
                    onChange={e => setFormData({ ...formData, max_share_holding_percentage: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Statutory limit per member (CDA standard: 10%)
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Share Certificate Transfer Fee (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={formData.transfer_fee}
                    onChange={e => setFormData({ ...formData, transfer_fee: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Administrative fee for share transfers
                  </span>
                </div>
              </div>

              {/* Linked GL Account */}
              <div>
                <label className="text-xs font-semibold text-slate-300">Chart of Accounts (Equity GL Account) *</label>
                <select
                  value={formData.accounting_account_id}
                  onChange={e => setFormData({ ...formData, accounting_account_id: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:outline-none focus:border-emerald-500"
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_code || (acc as any).code} — {acc.name} ({acc.category || (acc as any).type})
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  General Ledger account for Member Common Share Capital (usually 3110)
                </span>
              </div>

              {/* Withdrawal Rule */}
              <div>
                <label className="text-xs font-semibold text-slate-300">Withdrawal / Termination Governance Rule</label>
                <textarea
                  rows={2}
                  value={formData.withdrawal_rule}
                  onChange={e => setFormData({ ...formData, withdrawal_rule: e.target.value })}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Subject to Board approval and 30-day prior written notice"
                />
              </div>

              {/* Change Reason for Audit */}
              <div>
                <label className="text-xs font-semibold text-slate-300">Reason for Policy Change (Audit Trail Log)</label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={e => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., General Assembly Resolution No. 2026-04 on Par Value"
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Live Preview Summary */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="font-semibold text-slate-300">Policy Preview:</div>
                <div className="text-slate-400">
                  • 1 Share = <span className="text-emerald-400 font-bold">₱{formData.par_value_per_share}</span>
                  {' '}• Min. Subscription = <span className="text-white font-bold">{formData.min_subscription_shares} shares (₱{minSubTotal.toLocaleString()})</span>
                  {' '}• Min. Paid-Up = <span className="text-emerald-400 font-bold">{formData.min_paid_up_shares} shares (₱{minPaidTotal.toLocaleString()})</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setEditingSetting(null); setIsCreatingNew(false); }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Saving...' : isCreatingNew ? 'Create Policy Setting' : 'Save Policy Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
