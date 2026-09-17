import React, { useState, useEffect } from 'react';
import { PiggyBank, Plus, ArrowUpRight, ArrowDownLeft, X, Building2 } from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { api } from '../../services/api';
import { Account, Branch, CashAccount, Member, SavingsAccount, SavingsProduct, User } from '../../types';

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
  const [members, setMembers] = useState<Member[]>([]);
  const [savingsProducts, setSavingsProducts] = useState<SavingsProduct[]>([]);
  const [coaAccounts, setCoaAccounts] = useState<Account[]>([]);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    min_balance_to_earn_interest: 1000,
    annual_interest_rate: 2,
    interest_calculation_method: 'Average Daily Balance',
    min_opening_deposit: 500,
    maintaining_balance: 500,
    gl_liability_account_id: '',
    gl_interest_expense_account_id: '',
    active: true
  });
  const [isOpening, setIsOpening] = useState(false);
  const [opening, setOpening] = useState({ member_id: '', savings_product_id: '', branch_id: '' });
  const [openError, setOpenError] = useState<string | null>(null);
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
    Promise.all([api.getMembers(), api.getSavingsProducts(), api.getAccounts()])
      .then(([memberRes, productRes, accountsRes]) => {
        setMembers(Array.isArray(memberRes.data) ? memberRes.data : []);
        setSavingsProducts(Array.isArray(productRes.data) ? productRes.data : []);
        setCoaAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : []);
      })
      .catch(err => setOpenError(err.message || 'Failed to load account opening options.'));
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
        savings_account_id: activeAccount.id,
        transaction_type: txType,
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

  const openSavingsAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setOpenError(null);
    const member = members.find(item => item.id === opening.member_id);
    const branchId = opening.branch_id || member?.branch_id || selectedBranch;
    if (!opening.member_id || !opening.savings_product_id || !branchId || branchId === 'all') {
      setOpenError('Member, savings product, and branch are required.');
      return;
    }

    try {
      const res = await api.createSavingsAccount({
        member_id: opening.member_id,
        savings_product_id: opening.savings_product_id,
        branch_id: branchId,
        opened_date: new Date().toISOString().split('T')[0],
        balance: 0,
        initial_deposit: 0,
        status: 'Active'
      });
      setIsOpening(false);
      setNotice(`Savings account ${res.data?.account_number || ''} opened successfully.`);
      setOpening({ member_id: '', savings_product_id: '', branch_id: '' });
      await loadAccounts();
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setOpenError(err.message || 'Failed to open savings account.');
    }
  };

  const createSavingsProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductError(null);
    if (!newProduct.code || !newProduct.name || !newProduct.gl_liability_account_id || !newProduct.gl_interest_expense_account_id) {
      setProductError('Code, name, and both GL accounts are required.');
      return;
    }
    try {
      const res = await api.createSavingsProduct(newProduct);
      setSavingsProducts(prev => [...prev, res.data]);
      setIsCreatingProduct(false);
      setNotice(`Savings product "${newProduct.name}" created successfully.`);
      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      setProductError(err.message || 'Failed to create savings product.');
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
          <button
            type="button"
            onClick={() => {
              const firstMember = members[0];
              setOpening({
                member_id: firstMember?.id || '',
                savings_product_id: savingsProducts.find(product => product.active !== false)?.id || savingsProducts[0]?.id || '',
                branch_id: selectedBranch !== 'all' ? selectedBranch : firstMember?.branch_id || branches[0]?.id || ''
              });
              setOpenError(null);
              setIsOpening(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Open Savings Account</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setNewProduct(prev => ({
                ...prev,
                code: `SAV-${Math.floor(100 + Math.random() * 900)}`,
                gl_liability_account_id: coaAccounts.find(account => account.id === 'acc_2110')?.id || coaAccounts[0]?.id || '',
                gl_interest_expense_account_id: coaAccounts.find(account => account.id === 'acc_2220')?.id || coaAccounts[0]?.id || ''
              }));
              setProductError(null);
              setIsCreatingProduct(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Savings Product</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold">
          {notice}
        </div>
      )}

      {isCreatingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Savings Product</h3>
              <button type="button" onClick={() => setIsCreatingProduct(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            {productError && <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{productError}</p>}
            <form onSubmit={createSavingsProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-300 font-medium">Product Code</label><input required value={newProduct.code} onChange={e => setNewProduct({ ...newProduct, code: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" /></div>
              <div><label className="text-xs text-slate-300 font-medium">Product Name</label><input required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" /></div>
              <div><label className="text-xs text-slate-300 font-medium">Minimum Balance to Earn Interest</label><input type="number" step="0.01" value={newProduct.min_balance_to_earn_interest} onChange={e => setNewProduct({ ...newProduct, min_balance_to_earn_interest: Number(e.target.value) || 0 })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" /></div>
              <div><label className="text-xs text-slate-300 font-medium">Annual Interest Rate (%)</label><input type="number" step="0.01" value={newProduct.annual_interest_rate} onChange={e => setNewProduct({ ...newProduct, annual_interest_rate: Number(e.target.value) || 0 })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" /></div>
              <div><label className="text-xs text-slate-300 font-medium">Interest Calculation Method</label><select value={newProduct.interest_calculation_method} onChange={e => setNewProduct({ ...newProduct, interest_calculation_method: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"><option>Average Daily Balance</option><option>Monthly Minimum Balance</option><option>Fixed Term Maturity</option></select></div>
              <div><label className="text-xs text-slate-300 font-medium">Minimum Opening Deposit</label><input type="number" step="0.01" value={newProduct.min_opening_deposit} onChange={e => setNewProduct({ ...newProduct, min_opening_deposit: Number(e.target.value) || 0 })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" /></div>
              <div><label className="text-xs text-slate-300 font-medium">Maintaining Balance</label><input type="number" step="0.01" value={newProduct.maintaining_balance} onChange={e => setNewProduct({ ...newProduct, maintaining_balance: Number(e.target.value) || 0 })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white" /></div>
              <div><label className="text-xs text-slate-300 font-medium">GL Liability Account</label><select required value={newProduct.gl_liability_account_id} onChange={e => setNewProduct({ ...newProduct, gl_liability_account_id: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"><option value="">Select account</option>{coaAccounts.map(account => <option key={account.id} value={account.id}>{account.code || account.account_code} - {account.name}</option>)}</select></div>
              <div><label className="text-xs text-slate-300 font-medium">GL Interest Expense Account</label><select required value={newProduct.gl_interest_expense_account_id} onChange={e => setNewProduct({ ...newProduct, gl_interest_expense_account_id: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"><option value="">Select account</option>{coaAccounts.map(account => <option key={account.id} value={account.id}>{account.code || account.account_code} - {account.name}</option>)}</select></div>
              <div className="sm:col-span-2 flex items-center justify-between pt-3 border-t border-slate-800"><label className="text-xs text-slate-300"><input type="checkbox" checked={newProduct.active} onChange={e => setNewProduct({ ...newProduct, active: e.target.checked })} className="mr-2" />Active product</label><div className="flex gap-2"><button type="button" onClick={() => setIsCreatingProduct(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl">Cancel</button><button type="submit" className="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl">Create Product</button></div></div>
            </form>
          </div>
        </div>
      )}

      {isOpening && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Open Savings Account</h3>
              <button type="button" onClick={() => setIsOpening(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            {openError && <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{openError}</p>}
            {members.length === 0 || savingsProducts.length === 0 ? (
              <p className="text-xs text-amber-300">Members and active savings products are required before opening an account.</p>
            ) : (
              <form onSubmit={openSavingsAccount} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Member</label>
                  <select value={opening.member_id} onChange={e => setOpening({ ...opening, member_id: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    {members.map(member => <option key={member.id} value={member.id}>{member.member_no} - {member.first_name} {member.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Savings Product</label>
                  <select value={opening.savings_product_id} onChange={e => setOpening({ ...opening, savings_product_id: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    {savingsProducts.map(product => <option key={product.id} value={product.id}>{product.code} - {product.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Branch</label>
                  <select value={opening.branch_id} onChange={e => setOpening({ ...opening, branch_id: e.target.value })} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white">
                    {branches.map(branch => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button type="button" onClick={() => setIsOpening(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer">Open Account</button>
                </div>
              </form>
            )}
          </div>
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
      {filteredAccounts.length > 0 ? (
        <ExcelGridTable
          title="Member Savings Accounts Ledger"
          subtitle="Spreadsheet overview of deposit liabilities by member and product with formula summary bar and CSV export."
          exportFileName="savings_accounts_ledger"
          data={filteredAccounts}
          columns={savingsCols}
          defaultSortKey="account_number"
        />
      ) : (
        <div className="bg-slate-900 rounded-2xl p-10 border border-slate-800 text-center">
          <PiggyBank className="w-10 h-10 mx-auto text-slate-500" />
          <h2 className="mt-3 text-sm font-semibold text-white">No savings accounts found</h2>
          <p className="mt-1 text-xs text-slate-400">
            The savings_accounts table currently has no records for the selected branch.
          </p>
        </div>
      )}
    </div>
  );
};
