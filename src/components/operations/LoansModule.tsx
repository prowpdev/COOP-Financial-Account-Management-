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
  AlertCircle,
  UserPlus,
  RefreshCw,
  Eye,
  FileText,
  Pencil,
  Layers
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { LoanApplicationsView } from './LoanApplicationsView';
import { IndividualLoanLedgerModal } from './IndividualLoanLedgerModal';
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
const loanStatuses = {
  Draft: 'Draft',
  Submitted: 'Submitted',
  Approved: 'Approved',
  Released: 'Released',
  Active: 'Active',
  'Fully Paid': 'Fully Paid',
  'Past Due': 'Past Due',
  Restructured: 'Restructured',
};
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

  // Sub-tab Navigation (Active Loans vs Loan Applications)
  const [loansSubTab, setLoansSubTab] = useState<'active' | 'applications'>('active');
  const [pendingAppsCount, setPendingAppsCount] = useState<number>(0);

  const [editLoan, setEditLoan] = useState(null)

  // Apply/Originate Modal State
  const [isOriginating, setIsOriginating] = useState(false);
  const [originateError, setOriginateError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeedingMembers, setIsSeedingMembers] = useState(false);
  const [updateLoanForm, setupdateLoanForm] = useState(
    {
    "id": "ln_a996947f2798",
    "loan_account_no": "LN-2026-34365",
    "member_id": "mem_000002",
    "loan_product_id": "lp_regular",
    "product_version": 1,
    "branch_id": "branch_tar",
    "principal_amount": "10000.00",
    "annual_interest_rate": "10.00",
    "interest_calculation_method": "Diminishing Balance",
    "term_months": 12,
    "payment_frequency": "Monthly",
    "disbursement_date": "2026-09-22",
    "first_due_date": "2026-10-22",
    "maturity_date": "2027-09-22",
    "processing_fee": "0.00",
    "service_fee": "0.00",
    "net_disbursed": "10000.00",
    "disbursed_from_cash_account_id": "cash_01",
    "status": "Submitted",
    "current_balance": "10000.00",
    "total_principal_paid": "0.00",
    "total_interest_paid": "0.00",
    "total_penalty_paid": "0.00",
    "total_fees_paid": "0.00",
    "approved_by": "Administrator",
    "approved_date": "2026-09-22",
    "created_at": "2026-09-22 10:49:36",
    "member_name": "Maria Santos",
    "member_no": "MEM-2026-0002",
    "product_name": "Regular Multi-Purpose Loan",
    "product_code": "LP-REG",
    "branch_name": "Main Tarlac Central Branch"
  }
  );
  const [origForm, setOrigForm] = useState({
    member_id: '',
    loan_product_id: '',
    principal_amount: 30000,
    term_months: 12,
    cash_account_id: '',
    branch_id: ''
  });
  const [previewSchedule, setPreviewSchedule] = useState<any>(null);

  // Repayment Modal State
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayCashAccount, setRepayCashAccount] = useState('');
  const [repayError, setRepayError] = useState<string | null>(null);
  const [isRepaying, setIsRepaying] = useState(false);

  // Schedule View Modal State
  const [selectedLoanForSchedule, setSelectedLoanForSchedule] = useState<Loan | null>(null);
  const [selectedLoanForLedger, setSelectedLoanForLedger] = useState<Loan | null>(null);
  const [loanScheduleData, setLoanScheduleData] = useState<any[]>([]); // total_installment
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [currentBillDue, setCurrentBillDue] = useState('');
  const [maxRepayAmount, setMaxRepayAmount] = useState();



const handleRepayBtn = async (
  event: React.MouseEvent<HTMLButtonElement>,
  row: Loan
) => {
  event.preventDefault();

  setSelectedLoanForRepay(row);
  setRepayError(null);

  try {
    const res = await api.getLoanSchedule(row.id);

    const schedules = Array.isArray(res.data) ? res.data : [];

    // Find the first installment that is not fully paid
    const nextSchedule = schedules.find(
      (item) => String(item.status).toLowerCase() !== 'paid'
    );

    if (!nextSchedule) {
      setCurrentBillDue(0);
      setMaxRepayAmount(0);
      setRepayError('This loan has no remaining unpaid installments.');
      return;
    }

    const principal = Number(nextSchedule.principal || 0);
    const interest = Number(nextSchedule.interest || 0);
    const fee = Number(nextSchedule.fee || 0);

    const paidPrincipal = Number(nextSchedule.paid_principal || 0);
    const paidInterest = Number(nextSchedule.paid_interest || 0);
    const paidFee = Number(nextSchedule.paid_fee || 0);

    // Calculate what remains for THIS installment
    const remainingPrincipal = Math.max(0, principal - paidPrincipal);
    const remainingInterest = Math.max(0, interest - paidInterest);
    const remainingFee = Math.max(0, fee - paidFee);

    const remainingDue =
      remainingPrincipal +
      remainingInterest +
      remainingFee;

    setCurrentBillDue(Number(remainingDue.toFixed(2)));

    // Maximum payment can be the remaining loan balance/payment due,
    // depending on your business rule.
    setMaxRepayAmount(Number(remainingDue.toFixed(2)));

    console.log('Next installment:', nextSchedule);
    console.log('Remaining principal:', remainingPrincipal);
    console.log('Remaining interest:', remainingInterest);
    console.log('Remaining fee:', remainingFee);
    console.log('Remaining due:', remainingDue);

  } catch (error) {
    console.error('Failed to load loan schedule:', error);
    setRepayError('Unable to load the loan schedule.');
  }
};
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

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [lRes, mRes, aRes] = await Promise.all([
        api.getLoans(),
        api.getMembers(),
        api.getLoanApplications({ status: 'Pending' })
      ]);
      const safeLoans = Array.isArray(lRes.data) ? lRes.data : [];
      const safeMembers = Array.isArray(mRes.data) ? mRes.data : [];
      const applications = Array.isArray(aRes.data) ? aRes.data : [];
      setLoans(safeLoans);
      setMembers(safeMembers);
      const pendingApps = applications.filter(
        app => app.status === 'Pending'
      ).length;
      setPendingAppsCount(pendingApps);
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

  // Synchronize origForm defaults as data populates
  useEffect(() => {
    if (loanProducts.length > 0 && !origForm.loan_product_id) {
      const defaultProd = loanProducts.find(p => p.active) || loanProducts[0];
      setOrigForm(prev => ({
        ...prev,
        loan_product_id: defaultProd.id,
        term_months: defaultProd.default_term_months || prev.term_months || 12,
        principal_amount: defaultProd.min_amount || prev.principal_amount || 30000
      }));
    }
  }, [loanProducts]);

  useEffect(() => {
    if (members.length > 0 && !origForm.member_id) {
      setOrigForm(prev => ({ ...prev, member_id: members[0].id }));
    }
  }, [members]);

  useEffect(() => {
    if (cashAccounts.length > 0 && !origForm.cash_account_id) {
      setOrigForm(prev => ({ ...prev, cash_account_id: cashAccounts[0].id }));
    }
    if (cashAccounts.length > 0 && !repayCashAccount) {
      setRepayCashAccount(cashAccounts[0].id);
    }
  }, [cashAccounts]);

  useEffect(() => {
    if (branches.length > 0 && !origForm.branch_id) {
      setOrigForm(prev => ({ ...prev, branch_id: branches[0].id }));
    }
  }, [branches]);

  // Open Originate modal with smart pre-population
  const handleOpenOriginate = () => {
    setOriginateError(null);
    const activeProducts = loanProducts.filter(p => p.active);
    const defaultProd = activeProducts[0] || loanProducts[0];
    const defaultBranch = branches.find(b => b.id === (selectedBranch !== 'all' ? selectedBranch : 'branch_tar')) || branches[0];
    const availableMembers = selectedBranch !== 'all'
      ? members.filter(m => m.branch_id === selectedBranch)
      : members;
    const defaultMember = (availableMembers[0] || members[0])?.id || '';
    const defaultCash = cashAccounts[0]?.id || 'cash_01';
    const defaultPrincipal = defaultProd?.min_amount || 30000;
    const defaultTerm = defaultProd?.default_term_months || 12;

    setOrigForm({
      member_id: defaultMember,
      loan_product_id: defaultProd?.id || '',
      principal_amount: defaultPrincipal,
      term_months: defaultTerm,
      cash_account_id: defaultCash,
      branch_id: defaultBranch?.id || 'branch_tar'
    });

    if (defaultProd) {
      api.calculateSchedule({
        principal: defaultPrincipal,
        annual_rate: defaultProd.annual_interest_rate,
        term_months: defaultTerm,
        frequency: defaultProd.payment_frequency,
        method: defaultProd.interest_calculation_method,
        start_date: new Date().toISOString().split('T')[0]
      }).then(res => {
        if (res && res.data) setPreviewSchedule(res.data);
      }).catch(console.error);
    }

    setIsOriginating(true);
  };

  // Seed sample members directly if table is empty
  const handleSeedMembers = async () => {
    setIsSeedingMembers(true);
    setOriginateError(null);
    try {
      await api.seedSampleMembers();
      await loadData();
      setNotice('Cooperative demo members loaded! You can now select a borrower.');
      setTimeout(() => setNotice(null), 5000);
    } catch (err: any) {
      setOriginateError(err.message || 'Failed to seed sample members');
    } finally {
      setIsSeedingMembers(false);
    }
  };
 
  // Update schedule preview when product or principal changes
  useEffect(() => {
    const prod = loanProducts.find(p => p.id === origForm.loan_product_id);
    if (!prod || !origForm.principal_amount || origForm.principal_amount <= 0) {
      setPreviewSchedule(null);
      return;
    }

    api.calculateSchedule({
      principal: origForm.principal_amount,
      annual_rate: prod.annual_interest_rate,
      term_months: origForm.term_months || prod.default_term_months || 12,
      frequency: prod.payment_frequency,
      method: prod.interest_calculation_method,
      start_date: new Date().toISOString().split('T')[0]
    }).then(res => {
      if (res && res.data) {
        setPreviewSchedule(res.data);
      }
    }).catch(console.error);
  }, [origForm.loan_product_id, origForm.principal_amount, origForm.term_months, loanProducts]);

  const handleOriginate = async (e: React.FormEvent) => {
    e.preventDefault();
    setOriginateError(null);

    if (!origForm.member_id) {
      setOriginateError('Please select a borrowing cooperative member.');
      return;
    }
    if (!origForm.loan_product_id) {
      setOriginateError('Please select a loan product.');
      return;
    }
    if (!origForm.principal_amount || origForm.principal_amount <= 0) {
      setOriginateError('Principal amount must be a positive number greater than zero.');
      return;
    }

    const prod = loanProducts.find(p => p.id === origForm.loan_product_id);
    if (prod?.min_amount && origForm.principal_amount < prod.min_amount) {
      setOriginateError(`Principal amount (₱${origForm.principal_amount.toLocaleString()}) cannot be less than minimum ₱${prod.min_amount.toLocaleString()} for ${prod.name}.`);
      return;
    }
    if (prod?.max_amount && origForm.principal_amount > prod.max_amount) {
      setOriginateError(`Principal amount (₱${origForm.principal_amount.toLocaleString()}) cannot exceed maximum ₱${prod.max_amount.toLocaleString()} for ${prod.name}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.applyLoan({
        ...origForm,
        performed_by: currentUser.name
      });
      setIsOriginating(false);
      setNotice(`Loan ${res.data.loan_account_no} successfully submitted! Journal entry ${res.accounting_posting?.journal_entry?.voucher_number || 'Posted'} recorded in General Ledger.`);
      setTimeout(() => setNotice(null), 6000);
      await loadData();
    } catch (err: any) {
      setOriginateError(err.message || 'Failed to apply and disburse loan');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepayAmount(currentBillDue);
    if (!selectedLoanForRepay) return;
    setRepayError(null);

    if (!repayAmount || repayAmount <= 0) {
      setRepayError('Repayment amount must be greater than zero.');
      return;
    }
   
    
    setIsRepaying(true);
    try {
      const res = await api.repayLoan(selectedLoanForRepay.id, {
        amount: repayAmount,
        cash_account_id: repayCashAccount || cashAccounts[0]?.id || 'cash_01',
        performed_by: currentUser.name,
        notes: `Over-the-counter collection by ${currentUser.name}`
      });
      setSelectedLoanForRepay(null);
      setNotice(
        `Repayment OR #${res.payment.receipt_no} processed! Allocated: Principal ₱${res.allocation.principal_amount.toLocaleString()}, Interest ₱${res.allocation.interest_amount.toLocaleString()}.`
      );
      setTimeout(() => setNotice(null), 5000);
      await loadData();
    } catch (err: any) {
      setRepayError(err.message || 'Failed to process loan repayment');
    } finally {
      setIsRepaying(false);
    }
  };
  // const loadLoanSchedule = async (loan:Loan) =>{
    
  // };
 const handleUpdateLoan = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const loanId = updateLoanForm.id;
    const status = updateLoanForm.status;

    console.log('Updating:', loanId, status);

    await api.updateLoan(loanId, { status });

    console.log('Update successful. Reloading...');

    await loadData();

    console.log('Reload complete');

    setEditLoan(false);

    setNotice(
      `${updateLoanForm.loan_account_no} status updated to ${status}`
    );

    setTimeout(() => setNotice(null), 5000);

  } catch (error) {
    console.error('Error updating loan:', error);
  }
};

  const handleUpdateLoanStatus = async (e: React.MouseEvent, row: Loan, newStatus: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await api.updateLoan(Number(row.id) || (row.id as any), { status: newStatus });
      setNotice(`Loan ${row.loan_account_no} status updated to ${newStatus}`);
      setTimeout(() => setNotice(null), 5000);
      await loadData();
    } catch (error) {
      console.error('Error updating loan status:', error);
    }
  };

  const handleSubmitLoan = (e: React.MouseEvent, row: Loan) => handleUpdateLoanStatus(e, row, 'Submitted');
  const handleReviewLoan = (e: React.MouseEvent, row: Loan) => handleUpdateLoanStatus(e, row, 'Under Review');
  const handleApproveLoan = (e: React.MouseEvent, row: Loan) => handleUpdateLoanStatus(e, row, 'Approved');
  const handleRejectLoan = (e: React.MouseEvent, row: Loan) => handleUpdateLoanStatus(e, row, 'Rejected');
  const handleReleaseLoan = (e: React.MouseEvent, row: Loan) => handleUpdateLoanStatus(e, row, 'Released');
  const handleActivateLoan = (e: React.MouseEvent, row: Loan) => handleUpdateLoanStatus(e, row, 'Active');
  const handleEditLoan = async (event,row) => {
  setEditLoan(row)
  setupdateLoanForm(
    {
      "id": row.id,
      "loan_account_no": row.loan_account_no,
      "member_id": row.member_id,
      "loan_product_id": row.loan_product_id,
      "product_version": row.product_version,
      "branch_id": row.branch_id,
      "principal_amount": row.principal_amount,
      "annual_interest_rate": row.annual_interest_rate,
      "interest_calculation_method": row.interest_calculation_method,
      "term_months": row.term_months,
      "payment_frequency": row.payment_frequency,
      "disbursement_date": row.disbursement_date,
      "first_due_date": row.first_due_date,
      "maturity_date": row.maturity_date,
      "processing_fee": row.processing_fee,
      "service_fee": row.service_fee,
      "net_disbursed": row.net_disbursed,
      "disbursed_from_cash_account_id": row.disbursed_from_cash_account_id,
      "status": row.status,
      "current_balance": row.current_balance,
      "total_principal_paid": row.total_principal_paid,
      "total_interest_paid": row.total_interest_paid,
      "total_penalty_paid": row.total_penalty_paid,
      "total_fees_paid": row.total_fees_paid,
      "approved_by": row.approved_by,
      "approved_date": row.approved_date,
      "created_at": row.created_at,
      "member_name": row.member_name,
      "member_no": row.member_no,
      "product_name": row.product_name,
      "product_code": row.product_code,
      "branch_name": row.branch_name
    }
  )

  console.log(updateLoanForm);
  
  
  };
  const handleViewSchedule = async (loan: Loan) => {
    setSelectedLoanForSchedule(loan);
    setIsLoadingSchedule(true);
    try {
      const res = await api.getLoanSchedule(loan.id);
      setLoanScheduleData(Array.isArray(res.data) ? res.data : []);
      
      
    } catch (err) {
      console.warn('Failed to fetch schedule:', err);
      setLoanScheduleData([]);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  const selectedProduct = loanProducts.find(p => p.id === origForm.loan_product_id);
  const selectedCash = cashAccounts.find(c => c.id === origForm.cash_account_id);

  // Safe fee calculation
  const procRate = Number(selectedProduct?.processing_fee_percentage || 0);
  const procFee = Number(((origForm.principal_amount * procRate) / 100).toFixed(2));
  const servFee = Number(selectedProduct?.service_fee_fixed || 0);
  const netDisbursed = Math.max(0, Number((origForm.principal_amount - procFee - servFee).toFixed(2)));

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
      width: '180px',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center space-x-1.5 justify-center">
          <button
            type="button"
            title="Individual Loan Subsidiary Ledger"
            onClick={() => setSelectedLoanForLedger(row)}
            className="inline-flex items-center justify-center
                       w-7 h-7 rounded-md
                       bg-emerald-500/10 text-emerald-400
                       border border-emerald-500/30
                       hover:bg-emerald-500/20
                       hover:text-emerald-300
                       hover:border-emerald-500/50
                       transition-all duration-150
                       cursor-pointer"
          >
            <FileText size={14} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            title="Edit Loan"
            onClick={(event) => handleEditLoan(event,row)}
            className="inline-flex items-center justify-center
                       w-7 h-7 rounded-md
                       bg-blue-500/10 text-blue-400
                       border border-blue-500/30
                       hover:bg-blue-500/20
                       hover:text-blue-300
                       hover:border-blue-500/50
                       transition-all duration-150
                       cursor-pointer"
          >
            <Pencil size={14} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleViewSchedule(row)}
            title="View Amortization Schedule"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {(() => {
          switch (row.status) {
            case 'Draft':
              return (
                <button
                  id={`btn-submit-loan-${row.id}`}
                  onClick={(event) => handleSubmitLoan(event, row)}
                  className="px-2.5 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
                >
                  Submit
                </button>
              );

            case 'Submitted':
              return (
                <button
                  id={`btn-review-loan-${row.id}`}
                  onClick={(event) => handleReviewLoan(event, row)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
                >
                  Review
                </button>
              );

            case 'Under Review':
              return (
                <div className="flex gap-1">
                  <button
                    id={`btn-approve-loan-${row.id}`}
                    onClick={(event) => handleApproveLoan(event, row)}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
                  >
                    Approve
                  </button>

                  <button
                    id={`btn-reject-loan-${row.id}`}
                    onClick={(event) => handleRejectLoan(event, row)}
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
                  >
                    Reject
                  </button>
                </div>
              );

            case 'Approved':
              return (
                <button
                  id={`btn-release-loan-${row.id}`}
                  onClick={(event) => handleReleaseLoan(event, row)}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
                >
                  Release
                </button>
              );

            case 'Rejected':
              return (
                <button
                  id={`btn-rejected-loan-${row.id}`}
                  disabled
                  className="px-2.5 py-1 bg-red-400 text-white rounded-lg text-xs font-semibold cursor-not-allowed shadow opacity-70"
                >
                  Rejected
                </button>
              );

            case 'Released':
              return (
                <button
                  id={`btn-activate-loan-${row.id}`}
                  onClick={(event) => handleActivateLoan(event, row)}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
                >
                  Activate
                </button>
              );

            case 'Active':
              return row.current_balance > 0 ? (
                <button
                  id={`btn-repay-loan-${row.id}`}
                  onClick={(event) => handleRepayBtn(event, row)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
                >
                  Repay
                </button>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  Settled
                </span>
              );

            default:
              return null;
            }
          })()}
        </div>
      )
    },

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
            onClick={handleOpenOriginate}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Apply for New Loan</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{notice}</span>
        </div>
      )}

      {/* Sub-navigation tabs: Active Loans vs Loan Applications */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        <button
          id="tab-active-loans"
          onClick={() => setLoansSubTab('active')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            loansSubTab === 'active'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Active Loans Portfolio</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            loansSubTab === 'active' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-400'
          }`}>
            {filteredLoans.length}
          </span>
        </button>

        <button
          id="tab-loan-applications"
          onClick={() => setLoansSubTab('applications')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            loansSubTab === 'applications'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Loan Applications & Approval Workflow</span>
          {pendingAppsCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-extrabold animate-pulse">
              {pendingAppsCount} PENDING
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
              0
            </span>
          )}
        </button>
      </div>

      {loansSubTab === 'applications' ? (
        <LoanApplicationsView
          branches={branches}
          loanProducts={loanProducts}
          cashAccounts={cashAccounts}
          currentUser={currentUser}
          selectedBranchId={selectedBranch}
          onSelectBranch={handleBranchChange}
          onLoanOriginated={() => {
            loadData();
          }}
          onSwitchToActiveLoans={() => setLoansSubTab('active')}
        />
      ) : (
        <>
          {/* Origination Wizard Modal */}
     {isOriginating && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Apply & Originate Cooperative Loan</h3>
                <p className="text-xs text-slate-400">
                  Select member and loan product. Loan disbursements automatically post to General Ledger.
                </p>
              </div>
              <button onClick={() => setIsOriginating(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {originateError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span className="flex-1">{originateError}</span>
              </div>
            )}

            {members.length === 0 ? (
              <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="text-sm font-semibold text-amber-200">No Cooperative Members Found</div>
                <p className="text-xs text-amber-300/80 max-w-md mx-auto">
                  A loan requires an active member to serve as the borrower. You can populate demo agricultural cooperative members with one click.
                </p>
                <button
                  type="button"
                  onClick={handleSeedMembers}
                  disabled={isSeedingMembers}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition"
                >
                  {isSeedingMembers ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading demo members...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Load Demo Members</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleOriginate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Borrowing Member</label>
                    <select
                      value={origForm.member_id}
                      onChange={e => setOrigForm({ ...origForm, member_id: e.target.value })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
                    >
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.member_no} - {m.first_name} {m.last_name} ({m.branch_name || 'Main'})
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
                        setOrigForm(prev => {
                          let nextPrincipal = prev.principal_amount;
                          if (prod?.min_amount && nextPrincipal < prod.min_amount) {
                            nextPrincipal = prod.min_amount;
                          } else if (prod?.max_amount && nextPrincipal > prod.max_amount) {
                            nextPrincipal = prod.max_amount;
                          }
                          return {
                            ...prev,
                            loan_product_id: pid,
                            principal_amount: nextPrincipal,
                            term_months: prod?.default_term_months || prev.term_months || 12
                          };
                        });
                      }}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
                    >
                      {loanProducts.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.annual_interest_rate}% {p.interest_calculation_method}) - v{p.version}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-300 font-medium">Principal Amount (₱)</label>
                      {selectedProduct && (
                        <span className="text-[10px] text-slate-400">
                          Min: ₱{selectedProduct.min_amount?.toLocaleString()} | Max: ₱{selectedProduct.max_amount?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      step="1000"
                      required
                      value={origForm.principal_amount}
                      onChange={e => setOrigForm({ ...origForm, principal_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Term (Months)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      required
                      value={origForm.term_months}
                      onChange={e => setOrigForm({ ...origForm, term_months: parseInt(e.target.value) || 1 })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-300 font-medium">Disbursing Cash Vault / Bank Account</label>
                      {selectedCash && (
                        <span className="text-[10px] text-emerald-400">
                          Bal: ₱{selectedCash.current_balance?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <select
                      value={origForm.cash_account_id}
                      onChange={e => setOrigForm({ ...origForm, cash_account_id: e.target.value })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
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
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
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
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dynamic Product Deduction Rules:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                      <div className="bg-slate-900/60 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[11px]">Processing Fee ({procRate}%):</span>
                        <strong className="text-white text-xs">₱{procFee.toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[11px]">Service Fee (Fixed):</span>
                        <strong className="text-white text-xs">₱{servFee.toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-slate-400 block text-[11px]">Net Disbursed to Member:</span>
                        <strong className="text-emerald-400 text-xs">₱{netDisbursed.toFixed(2)}</strong>
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
                    disabled={isSubmitting || members.length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl cursor-pointer shadow flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying & Disbursing Loan...</span>
                      </>
                    ) : (
                      <span>Disburse & Post to Accounting</span>
                    )}
                  </button>
                </div>
              </form>
            )}
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

            {repayError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span className="flex-1">{repayError}</span>
              </div>
            )}

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
                  min="1"
                  step="0.01"
                  max={maxRepayAmount}
                  required
                  value={currentBillDue}
                  onChange={e => setCurrentBillDue(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium">Receiving Cash Account</label>
                <select
                  value={repayCashAccount}
                  onChange={e => setRepayCashAccount(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
                >
                  {cashAccounts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (₱{c.current_balance?.toLocaleString()})</option>
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
                  disabled={isRepaying}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer shadow flex items-center space-x-2"
                >
                  {isRepaying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting Journal...</span>
                    </>
                  ) : (
                    <span>Confirm & Post Journal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Loan Modal */}
      {editLoan && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Apply & Originate Cooperative Loan</h3>
                <p className="text-xs text-slate-400">
                  Select member and loan product. Loan disbursements automatically post to General Ledger.
                </p>
              </div>
              <button onClick={() => setEditLoan(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {originateError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span className="flex-1">{originateError}</span>
              </div>
            )}

            {members.length === 0 ? (
              <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="text-sm font-semibold text-amber-200">No Cooperative Members Found</div>
                <p className="text-xs text-amber-300/80 max-w-md mx-auto">
                  A loan requires an active member to serve as the borrower. You can populate demo agricultural cooperative members with one click.
                </p>
                <button
                  type="button"
                  onClick={handleSeedMembers}
                  disabled={isSeedingMembers}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition"
                >
                  {isSeedingMembers ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Loading demo members...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Load Demo Members</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateLoan} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Borrowing Member</label>
                    <select
                      disabled
                      value={updateLoanForm.member_id}
                      onChange={e => setupdateLoanForm({ ...origForm, member_id: e.target.value })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
                    >
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.member_no} - {m.first_name} {m.last_name} ({m.branch_name || 'Main'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Configured Loan Product</label>
                    <select
                      disabled
                      value={updateLoanForm.loan_product_id}
                      onChange={e => {
                        const pid = e.target.value;
                        const prod = loanProducts.find(p => p.id === pid);
                        setupdateLoanForm(prev => {
                          let nextPrincipal = prev.principal_amount;
                          if (prod?.min_amount && nextPrincipal < prod.min_amount) {
                            nextPrincipal = prod.min_amount;
                          } else if (prod?.max_amount && nextPrincipal > prod.max_amount) {
                            nextPrincipal = prod.max_amount;
                          }
                          return {
                            ...prev,
                            loan_product_id: pid,
                            principal_amount: nextPrincipal,
                            term_months: prod?.default_term_months || prev.term_months || 12
                          };
                        });
                      }}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
                    >
                      {loanProducts.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.annual_interest_rate}% {p.interest_calculation_method}) - v{p.version}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-300 font-medium">Principal Amount (₱)</label>
                      {selectedProduct && (
                        <span className="text-[10px] text-slate-400">
                          Min: ₱{selectedProduct.min_amount?.toLocaleString()} | Max: ₱{selectedProduct.max_amount?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <input
                      disabled
                      type="number"
                      step="1000"
                      required
                      value={updateLoanForm.principal_amount}
                      onChange={e => setupdateLoanForm({ ...updateLoanForm, principal_amount: parseFloat(e.target.value) || 0 })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-300 font-medium">Term (Months)</label>
                    <input
                      disabled
                      type="number"
                      min="1"
                      max="120"
                      required
                      value={updateLoanForm.term_months}
                      onChange={e => setupdateLoanForm({ ...updateLoanForm, term_months: parseInt(e.target.value) || 1 })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="text-xs text-slate-300 font-medium">Disbursing Cash Vault / Bank Account</label>
                      {selectedCash && (
                        <span className="text-[10px] text-emerald-400">
                          Bal: ₱{selectedCash.current_balance?.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <select
                      disabled
                      value={updateLoanForm.cash_account_id}
                      onChange={e => setupdateLoanForm({ ...updateLoanForm, cash_account_id: e.target.value })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
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
                      disabled
                      value={updateLoanForm.branch_id}
                      onChange={e => setupdateLoanForm({ ...updateLoanForm, branch_id: e.target.value })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-emerald-300 font-medium">Status</label>
                    <select
                      value={updateLoanForm.status}
                      onChange={e => setupdateLoanForm({ ...updateLoanForm, status: e.target.value })}
                      className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer focus:border-emerald-500 focus:outline-none"
                    >
                    <option value="">Update Status</option>
                    {Object.entries(loanStatuses).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                    
                    
                    </select>
                  </div>
                </div>

                {/* Dynamic Fee Deductions Preview */}
                {selectedProduct && (
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-xs">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dynamic Product Deduction Rules:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1.5">
                      <div className="bg-slate-900/60 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[11px]">Processing Fee ({procRate}%):</span>
                        <strong className="text-white text-xs">₱{procFee.toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[11px]">Service Fee (Fixed):</span>
                        <strong className="text-white text-xs">₱{servFee.toFixed(2)}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-slate-400 block text-[11px]">Net Disbursed to Member:</span>
                        <strong className="text-emerald-400 text-xs">₱{netDisbursed.toFixed(2)}</strong>
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
                    onClick={() => setEditLoan(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || members.length === 0}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl cursor-pointer shadow flex items-center space-x-2"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Applying & Disbursing Loan...</span>
                      </>
                    ) : (
                      <span>Save</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    

      {/* Schedule Detail Inspection Modal */}
      {selectedLoanForSchedule && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 max-h-[92vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <span>Amortization Schedule & Ledger</span>
                  <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-md">
                    {selectedLoanForSchedule.loan_account_no}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Borrower: <strong className="text-slate-200">{selectedLoanForSchedule.member_name}</strong> • Product: {selectedLoanForSchedule.product_name} • Rate: {selectedLoanForSchedule.annual_interest_rate}% p.a.
                </p>
              </div>
              <button onClick={() => setSelectedLoanForSchedule(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Principal</span>
                <span className="font-bold text-white text-sm">{formatMoney(selectedLoanForSchedule.principal_amount)}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Balance</span>
                <span className="font-bold text-emerald-400 text-sm">{formatMoney(selectedLoanForSchedule.current_balance)}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Principal Paid</span>
                <span className="font-bold text-blue-400 text-sm">{formatMoney(selectedLoanForSchedule.total_principal_paid)}</span>
              </div>
              <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Interest Paid</span>
                <span className="font-bold text-purple-400 text-sm">{formatMoney(selectedLoanForSchedule.total_interest_paid)}</span>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/90 text-slate-400 sticky top-0">
                  <tr>
                    <th className="p-2">Installment</th>
                    <th className="p-2">Due Date</th>
                    <th className="p-2 text-right">Principal</th>
                    <th className="p-2 text-right">Interest</th>
                    <th className="p-2 text-right">Total Installment</th>
                    <th className="p-2 text-right">Balance</th>
                    <th className="p-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {isLoadingSchedule ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                        Loading schedule...
                      </td>
                    </tr>
                  ) : loanScheduleData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No schedule entries recorded for this loan.
                      </td>
                    </tr>
                  ) : (
                    loanScheduleData.map((item: any) => (
                      <tr key={item.id || item.installment_no} className="hover:bg-slate-800/40">
                        <td className="p-2 font-bold text-slate-200">#{item.installment_no}</td>
                        <td className="p-2 text-slate-400">{item.due_date}</td>
                        <td className="p-2 text-right">₱{item.principal?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right text-emerald-400">₱{item.interest?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right font-semibold text-white">₱{item.total_installment?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-right text-slate-400">₱{item.principal_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="p-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.status === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLoanForSchedule(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
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

      {/* Individual Borrower Loan Subsidiary Ledger Modal */}
      {selectedLoanForLedger && (
        <IndividualLoanLedgerModal
          loan={selectedLoanForLedger}
          onClose={() => setSelectedLoanForLedger(null)}
          onRepay={() => {
            const l = selectedLoanForLedger;
            setSelectedLoanForLedger(null);
            handleRepayBtn({ preventDefault: () => {} } as any, l);
          }}
        />
      )}
        </>
      )}
    </div>
  );
};
