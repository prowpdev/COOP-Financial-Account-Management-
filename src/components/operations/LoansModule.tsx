import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  ArrowDownRight,
  Calculator,
  Receipt,
  CheckCircle2,
  Calendar,
  X,
  Building2,
  AlertCircle
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { api } from '../../services/api';
import { Branch, CashAccount, Loan, LoanProduct, Member, User } from '../../types';

interface LoansModuleProps {
  branches: Branch[];
  loanProducts: LoanProduct[];
  cashAccounts: CashAccount[];
  currentUser: User;
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
}

export const LoansModule: React.FC<LoansModuleProps> = ({
  branches = [],
  loanProducts = [],
  cashAccounts = [],
  currentUser,
  selectedBranchId,
  onSelectBranch
}) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [isLoading, setIsLoading] = useState(true);
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

  // Originate Modal
  const [isOriginating, setIsOriginating] = useState(false);
  const [origForm, setOrigForm] = useState({
    member_id: '',
    loan_product_id: loanProducts[0]?.id || '',
    principal_amount: 30000,
    term_months: 12,
    cash_account_id: cashAccounts[0]?.id || 'cash_01',
    branch_id: branches[0]?.id || 'branch_tar'
  });
  const [previewSchedule, setPreviewSchedule] = useState<any>(null);

  useEffect(() => {
    if (!origForm.loan_product_id && loanProducts.length > 0) {
      setOrigForm(prev => ({ ...prev, loan_product_id: loanProducts[0].id }));
    }
  }, [loanProducts]);

  // Repayment Modal
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState(2500);
  const [repayCashAccount, setRepayCashAccount] = useState(cashAccounts[0]?.id || 'cash_01');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [lRes, mRes] = await Promise.all([api.getLoans(), api.getMembers()]);
      const safeLoans = Array.isArray(lRes.data) ? lRes.data : [];
      const safeMembers = Array.isArray(mRes.data) ? mRes.data : [];
      setLoans(safeLoans);
      setMembers(safeMembers);
      if (safeMembers.length > 0 && !origForm.member_id) {
        setOrigForm(prev => ({ ...prev, member_id: safeMembers[0].id }));
      }
    } catch (err) {
      console.error(err);
      setLoans([]);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update schedule preview when product or principal changes
  useEffect(() => {
    const prod = loanProducts.find(p => p.id === origForm.loan_product_id);
    if (!prod) return;

    api.calculateSchedule({
      principal: origForm.principal_amount,
      annual_rate: prod.annual_interest_rate,
      term_months: origForm.term_months || prod.default_term_months,
      frequency: prod.payment_frequency,
      method: prod.interest_calculation_method,
      start_date: new Date().toISOString().split('T')[0]
    }).then(res => setPreviewSchedule(res.data)).catch(console.error);
  }, [origForm.loan_product_id, origForm.principal_amount, origForm.term_months]);

  const handleOriginate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.originateLoan({
        ...origForm,
        performed_by: currentUser.name
      });
      setIsOriginating(false);
      setNotice(`Loan ${res.data.loan_account_no} disbursed! Journal Entry ${res.accounting_posting.journal_entry?.voucher_number} posted.`);
      setTimeout(() => setNotice(null), 5000);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanForRepay) return;

    try {
      const res = await api.repayLoan(selectedLoanForRepay.id, {
        amount: repayAmount,
        cash_account_id: repayCashAccount,
        performed_by: currentUser.name,
        notes: `Over-the-counter collection by ${currentUser.name}`
      });
      setSelectedLoanForRepay(null);
      setNotice(
        `Repayment OR #${res.payment.receipt_no} processed! Allocated: Principal ₱${res.allocation.principal_amount.toLocaleString()}, Interest ₱${res.allocation.interest_amount.toLocaleString()}.`
      );
      setTimeout(() => setNotice(null), 5000);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const selectedProduct = loanProducts.find(p => p.id === origForm.loan_product_id);

  const loanCols: ExcelColumn<Loan>[] = [
    {
      key: 'loan_account_no',
      header: 'Account No.',
      width: '140px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      key: 'member_name',
      header: 'Borrower',
      width: '210px',
      type: 'text',
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-semibold text-white">{row.member_name}</div>
          <div className="text-[10px] text-slate-400">{row.member_no}</div>
        </div>
      )
    },
    {
      key: 'product_name',
      header: 'Product & Ver',
      width: '180px',
      type: 'text',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-200 font-medium">{row.product_name}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
            v{row.product_version}
          </span>
        </div>
      )
    },
    {
      key: 'principal_amount',
      header: 'Principal (₱)',
      width: '140px',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    {
      key: 'current_balance',
      header: 'Current Balance (₱)',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true
    },
    {
      key: 'annual_interest_rate',
      header: 'Interest Rate',
      width: '120px',
      type: 'percent',
      align: 'right',
      sortable: true
    },
    {
      key: 'term_months',
      header: 'Term (Mos)',
      width: '100px',
      type: 'number',
      align: 'center',
      sortable: true
    },
    {
      key: 'branch_name',
      header: 'Branch',
      width: '140px',
      type: 'text',
      sortable: true
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: (val) =>
        val === 'Active'
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          : val === 'Fully Paid'
          ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      key: 'id',
      header: 'Actions',
      width: '110px',
      align: 'center',
      render: (_, row) =>
        row.current_balance > 0 ? (
          <button
            id={`btn-repay-loan-${row.id}`}
            onClick={() => {
              setSelectedLoanForRepay(row);
              setRepayAmount(Math.min(5000, row.current_balance));
            }}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
          >
            Repay
          </button>
        ) : (
          <span className="text-xs text-slate-500 font-medium">Settled</span>
        )
    }
  ];

  const safeLoansList = Array.isArray(loans) ? loans : [];
  const safeMembersList = Array.isArray(members) ? members : [];

  const filteredLoans = selectedBranch === 'all'
    ? safeLoansList
    : safeLoansList.filter(l => l && l.branch_id === selectedBranch);

  const branchMembers = selectedBranch === 'all'
    ? safeMembersList
    : safeMembersList.filter(m => m && m.branch_id === selectedBranch);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Dynamic Lending Engine</span>
            <span>•</span>
            <span className="text-slate-400">Versioned Product Retention</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Loans & Credit Facility
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Originate loans using active loan products. Past loans preserve their contracted interest rate and schedule even if product rules change.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Branch Filter Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
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

          <button
            id="btn-originate-loan"
            onClick={() => {
              setOrigForm(prev => ({
                ...prev,
                branch_id: selectedBranch !== 'all' ? selectedBranch : (branches[0]?.id || 'branch_tar'),
                member_id: branchMembers[0]?.id || members[0]?.id || ''
              }));
              setIsOriginating(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Apply for New Loan</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* Origination Wizard Modal */}
      {isOriginating && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Originate Cooperative Loan</h3>
                <p className="text-xs text-slate-400">
                  Select member and loan product. Loan disbursements automatically post to General Ledger.
                </p>
              </div>
              <button onClick={() => setIsOriginating(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOriginate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Borrowing Member</label>
                  <select
                    value={origForm.member_id}
                    onChange={e => setOrigForm({ ...origForm, member_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.member_no} - {m.first_name} {m.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Configured Loan Product</label>
                  <select
                    value={origForm.loan_product_id}
                    onChange={e => {
                      const pid = e.target.value;
                      const prod = loanProducts.find(p => p.id === pid);
                      setOrigForm({
                        ...origForm,
                        loan_product_id: pid,
                        term_months: prod?.default_term_months || 12
                      });
                    }}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    {loanProducts.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.annual_interest_rate}% {p.interest_calculation_method}) - v{p.version}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Principal Amount (₱)</label>
                  <input
                    type="number"
                    step="1000"
                    required
                    value={origForm.principal_amount}
                    onChange={e => setOrigForm({ ...origForm, principal_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Term (Months)</label>
                  <input
                    type="number"
                    required
                    value={origForm.term_months}
                    onChange={e => setOrigForm({ ...origForm, term_months: parseInt(e.target.value) || 1 })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Disbursing Cash Vault / Bank Account</label>
                  <select
                    value={origForm.cash_account_id}
                    onChange={e => setOrigForm({ ...origForm, cash_account_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    {cashAccounts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Balance: ₱{c.current_balance?.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Branch Jurisdiction</label>
                  <select
                    value={origForm.branch_id}
                    onChange={e => setOrigForm({ ...origForm, branch_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Fee Deductions Preview */}
              {selectedProduct && (
                <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Dynamic Product Deduction Rules:</span>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <div>
                      Processing Fee ({selectedProduct.processing_fee_percentage}%):{' '}
                      <strong className="text-white">
                        ₱{((origForm.principal_amount * (selectedProduct.processing_fee_percentage || 0)) / 100).toFixed(2)}
                      </strong>
                    </div>
                    <div>
                      Service Fee (Fixed):{' '}
                      <strong className="text-white">₱{selectedProduct.service_fee_fixed}</strong>
                    </div>
                    <div>
                      Net Disbursed to Member:{' '}
                      <strong className="text-emerald-400">
                        ₱{(origForm.principal_amount - ((origForm.principal_amount * (selectedProduct.processing_fee_percentage || 0)) / 100) - selectedProduct.service_fee_fixed).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Amortization schedule preview */}
              {previewSchedule && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold">Calculated Installment:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      ₱{previewSchedule.installment_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} / {selectedProduct?.payment_frequency}
                    </span>
                  </div>
                  <div className="max-h-44 overflow-y-auto border border-slate-800 rounded-lg">
                    <table className="w-full text-left text-[11px] text-slate-300">
                      <thead className="bg-slate-800 text-slate-400 sticky top-0">
                        <tr>
                          <th className="p-1.5">No.</th>
                          <th className="p-1.5">Due Date</th>
                          <th className="p-1.5">Principal</th>
                          <th className="p-1.5">Interest</th>
                          <th className="p-1.5">Total Due</th>
                          <th className="p-1.5">Remaining Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80">
                        {previewSchedule.schedule?.slice(0, 8).map((item: any) => (
                          <tr key={item.installment_no}>
                            <td className="p-1.5 font-bold">#{item.installment_no}</td>
                            <td className="p-1.5 text-slate-400">{item.due_date}</td>
                            <td className="p-1.5">₱{item.principal?.toLocaleString()}</td>
                            <td className="p-1.5 text-emerald-400">₱{item.interest?.toLocaleString()}</td>
                            <td className="p-1.5 text-white font-semibold">₱{item.total_installment?.toLocaleString()}</td>
                            <td className="p-1.5 text-slate-400">₱{item.principal_balance?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewSchedule.schedule?.length > 8 && (
                    <p className="text-[10px] text-slate-500 text-center">
                      Showing first 8 of {previewSchedule.schedule.length} installments
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOriginating(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  Disburse & Post to Accounting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repay Loan Modal */}
      {selectedLoanForRepay && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Collect Loan Repayment</h3>
                <p className="text-xs text-slate-400">
                  Account: {selectedLoanForRepay.loan_account_no}
                </p>
              </div>
              <button onClick={() => setSelectedLoanForRepay(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRepay} className="space-y-4">
              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Borrower:</span>
                  <span className="font-semibold text-white">{selectedLoanForRepay.member_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Current Outstanding Balance:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    {formatMoney(selectedLoanForRepay.current_balance)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Contracted Interest Rate:</span>
                  <span className="text-slate-200">{selectedLoanForRepay.annual_interest_rate}% p.a. (v{selectedLoanForRepay.product_version})</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium">Repayment Amount (₱)</label>
                <input
                  type="number"
                  step="50"
                  required
                  value={repayAmount}
                  onChange={e => setRepayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium">Receiving Cash Account</label>
                <select
                  value={repayCashAccount}
                  onChange={e => setRepayCashAccount(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                >
                  {cashAccounts.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Settlement Preview info */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-0.5">
                <span className="text-emerald-400 font-semibold block">Dynamic Payment Allocation Order Applied:</span>
                <span>1. Penalties → 2. Accrued Interest → 3. Charges/Fees → 4. Loan Principal</span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedLoanForRepay(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-repayment"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  Confirm & Post Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loans Excel Grid Table */}
      <ExcelGridTable
        title="Credit & Loan Facilities Registry"
        subtitle="Live spreadsheet of all originated loans and credit accounts. Supports multi-column sorting, search filtering, formula summary bar, TSV clipboard copy, and CSV export."
        exportFileName="cooperative_loans_ledger"
        data={filteredLoans}
        columns={loanCols}
        defaultSortKey="loan_account_no"
      />
    </div>
  );
};
