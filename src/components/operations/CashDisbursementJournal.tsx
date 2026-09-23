import React, { useState, useMemo } from 'react';
import {
  ArrowUpRight,
  Plus,
  Filter,
  Download,
  Calendar,
  Building2,
  DollarSign,
  User,
  CheckCircle2,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { JournalEntry, Branch, Account } from '../../types';

interface CashDisbursementJournalProps {
  journals: JournalEntry[];
  branches: Branch[];
  accounts: Account[];
  selectedBranch: string;
  onSelectBranch: (branchId: string) => void;
  onNewDisbursement: () => void;
}

export const CashDisbursementJournal: React.FC<CashDisbursementJournalProps> = ({
  journals,
  branches,
  accounts,
  selectedBranch,
  onSelectBranch,
  onNewDisbursement
}) => {
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Cooperative Standard: Filter transactions representing Cash Disbursements (Check / Cash Vouchers)
  // These include LOAN_RELEASE, SAVINGS_WITHDRAWAL, EXPENSE_PAYMENT, or CASH_DISBURSEMENT / CD prefix
  const disbursementJournals = useMemo(() => {
    return journals.filter(j => {
      if (!j) return false;
      const ref = (j.reference_type || '').toUpperCase();
      const vNum = (j.voucher_number || '').toUpperCase();
      const vType = (j.voucher_type || '').toUpperCase();

      const isDisbursement =
        vType === 'CD' ||
        vType === 'CDJ' ||
        vNum.includes('-CD-') ||
        vNum.startsWith('CD') ||
        ref.includes('RELEASE') ||
        ref.includes('WITHDRAWAL') ||
        ref.includes('EXPENSE') ||
        ref.includes('DISBURSEMENT') ||
        ref.includes('PAYOUT');

      if (!isDisbursement) return false;
      if (selectedBranch !== 'all' && j.branch_id !== selectedBranch) return false;
      if (dateFilter && j.posting_date !== dateFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesDesc = (j.description || '').toLowerCase().includes(term);
        const matchesVoucher = (j.voucher_number || '').toLowerCase().includes(term);
        const matchesMember = (j.member_name || '').toLowerCase().includes(term);
        if (!matchesDesc && !matchesVoucher && !matchesMember) return false;
      }

      return true;
    });
  }, [journals, selectedBranch, dateFilter, searchTerm]);

  // Aggregate metrics
  const totalDisbursementAmount = useMemo(() => {
    return disbursementJournals.reduce((sum, j) => sum + (Number(j.total_credit) || 0), 0);
  }, [disbursementJournals]);

  const cashCreditedAmount = useMemo(() => {
    let total = 0;
    disbursementJournals.forEach(j => {
      (j.lines || []).forEach(l => {
        // Match cash accounts (1110 Cash on Hand, 1120 Bank, etc.)
        const acc = accounts.find(a => a.id === l.account_id);
        const code = acc?.code || l.account_code || '';
        if (code.startsWith('11') || code.startsWith('10')) {
          total += Number(l.credit) || 0;
        }
      });
    });
    return total > 0 ? total : totalDisbursementAmount;
  }, [disbursementJournals, accounts, totalDisbursementAmount]);

  const columns: ExcelColumn<JournalEntry>[] = [
    {
      key: 'voucher_number',
      header: 'CDV / Check Voucher No.',
      width: '160px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    },
    {
      key: 'posting_date',
      header: 'Disbursement Date',
      width: '120px',
      type: 'date',
      align: 'center',
      sortable: true
    },
    {
      key: 'branch_id',
      header: 'Branch',
      width: '150px',
      type: 'text',
      sortable: true,
      render: (val) => branches.find(b => b.id === val)?.name || 'Main Branch'
    },
    {
      key: 'member_name',
      header: 'Payee / Borrower / Vendor',
      width: '200px',
      type: 'text',
      sortable: true,
      render: (val, item) => val || item.description?.split(' ')[0] || 'Designated Payee'
    },
    {
      key: 'reference_type',
      header: 'Disbursement Purpose',
      width: '160px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: (val) => {
        if (String(val).includes('LOAN')) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
        if (String(val).includes('SAVINGS') || String(val).includes('WITHDRAW')) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
        if (String(val).includes('EXPENSE')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      },
      render: (val) => {
        const str = String(val || 'CASH_DISBURSEMENT');
        if (str === 'LOAN_RELEASE') return 'Loan Principal Release';
        if (str === 'SAVINGS_WITHDRAWAL') return 'Savings Withdrawal';
        if (str === 'EXPENSE_PAYMENT') return 'Operational Expense';
        if (str === 'CASH_DISBURSEMENT') return 'Cash Disbursement';
        return str.replace(/_/g, ' ');
      }
    },
    {
      key: 'description',
      header: 'Particulars & Authority',
      width: '280px',
      type: 'text',
      sortable: true
    },
    {
      key: 'total_credit',
      header: 'Amount Disbursed (₱)',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="font-mono font-bold text-amber-400">
          ₱{(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'created_by',
      header: 'Disbursing Officer',
      width: '160px',
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
      badgeColor: () => 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Module Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Cash Outflow (CDJ)</span>
            <div className="text-xl font-bold text-white mt-1">
              ₱{totalDisbursementAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-amber-400 font-medium">Authoritative cash disbursement book</span>
          </div>
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Disbursement Vouchers (CDV)</span>
            <div className="text-xl font-bold text-amber-400 mt-1">
              {disbursementJournals.length} <span className="text-xs text-slate-400 font-normal">vouchers</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Sequential CDV / Check Registry</span>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cash / Bank Relinquished</span>
            <div className="text-xl font-bold text-white mt-1">
              ₱{cashCreditedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Credited to 1110 / 1120 accounts</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-amber-400" />
            <span>CDJ Filter:</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedBranch}
              onChange={e => onSelectBranch(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Branches</option>
              {branches.map(b => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              placeholder="Filter date"
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="text-[10px] text-slate-400 hover:text-white ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <button
          onClick={onNewDisbursement}
          className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Cash Disbursement (CDV)</span>
        </button>
      </div>

      {/* Excel Table for Cash Disbursement Journal */}
      <ExcelGridTable
        title="Cash Disbursement Journal (CDJ)"
        subtitle="Specialized cooperative book of original entry recording all cash payouts, bank transfers, loan releases, member withdrawals, and vendor disbursements."
        exportFileName="cash_disbursement_journal_cda"
        data={disbursementJournals}
        columns={columns}
        defaultSortKey="posting_date"
        defaultSortDir="desc"
      />
    </div>
  );
};
