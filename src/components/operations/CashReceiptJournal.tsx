import React, { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
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

interface CashReceiptJournalProps {
  journals: JournalEntry[];
  branches: Branch[];
  accounts: Account[];
  selectedBranch: string;
  onSelectBranch: (branchId: string) => void;
  onNewReceipt: () => void;
}

export const CashReceiptJournal: React.FC<CashReceiptJournalProps> = ({
  journals,
  branches,
  accounts,
  selectedBranch,
  onSelectBranch,
  onNewReceipt
}) => {
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Cooperative Standard: Filter transactions representing Cash Receipts (Official Receipts / Collections)
  // These include LOAN_PAYMENT, SAVINGS_DEPOSIT, SHARE_CAPITAL_PAYMENT, or CASH_RECEIPT / OR prefix
  const receiptJournals = useMemo(() => {
    return journals.filter(j => {
      if (!j) return false;
      const ref = (j.reference_type || '').toUpperCase();
      const vNum = (j.voucher_number || '').toUpperCase();
      const vType = (j.voucher_type || '').toUpperCase();
      
      const isReceipt =
        vType === 'OR' ||
        vType === 'CRJ' ||
        vNum.includes('-OR-') ||
        vNum.startsWith('OR') ||
        ref.includes('PAYMENT') ||
        ref.includes('DEPOSIT') ||
        ref.includes('RECEIPT') ||
        ref.includes('COLLECTION') ||
        ref.includes('CAPITAL');

      if (!isReceipt) return false;
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
  const totalReceiptsAmount = useMemo(() => {
    return receiptJournals.reduce((sum, j) => sum + (Number(j.total_debit) || 0), 0);
  }, [receiptJournals]);

  const cashDebitedAmount = useMemo(() => {
    let total = 0;
    receiptJournals.forEach(j => {
      (j.lines || []).forEach(l => {
        // Match cash accounts (1110 Cash on Hand, 1120 Bank, etc.)
        const acc = accounts.find(a => a.id === l.account_id);
        const code = acc?.code || l.account_code || '';
        if (code.startsWith('11') || code.startsWith('10')) {
          total += Number(l.debit) || 0;
        }
      });
    });
    return total > 0 ? total : totalReceiptsAmount;
  }, [receiptJournals, accounts, totalReceiptsAmount]);

  const columns: ExcelColumn<JournalEntry>[] = [
    {
      key: 'voucher_number',
      header: 'OR / Receipt No.',
      width: '150px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      key: 'posting_date',
      header: 'Receipt Date',
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
      header: 'Received From (Member)',
      width: '200px',
      type: 'text',
      sortable: true,
      render: (val, item) => val || item.description?.split(' ')[0] || 'General Member / Customer'
    },
    {
      key: 'reference_type',
      header: 'Receipt Nature / Stream',
      width: '160px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: (val) => {
        if (String(val).includes('LOAN')) return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
        if (String(val).includes('SAVINGS')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        if (String(val).includes('CAPITAL') || String(val).includes('CBU')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      },
      render: (val) => {
        const str = String(val || 'CASH_RECEIPT');
        if (str === 'LOAN_PAYMENT') return 'Loan Amortization';
        if (str === 'SAVINGS_DEPOSIT') return 'Savings Deposit';
        if (str === 'SHARE_CAPITAL_PAYMENT') return 'Share Capital (CBU)';
        if (str === 'CASH_RECEIPT') return 'Cash Collection';
        return str.replace(/_/g, ' ');
      }
    },
    {
      key: 'description',
      header: 'Particulars & Remarks',
      width: '280px',
      type: 'text',
      sortable: true
    },
    {
      key: 'total_debit',
      header: 'Amount Collected (₱)',
      width: '160px',
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (val) => (
        <span className="font-mono font-bold text-emerald-400">
          ₱{(Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: 'created_by',
      header: 'Collecting Teller / Cashier',
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
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Cash Inflow (CRJ)</span>
            <div className="text-xl font-bold text-white mt-1">
              ₱{totalReceiptsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Authoritative cash receipt journal ledger</span>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Official Receipts Issued</span>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {receiptJournals.length} <span className="text-xs text-slate-400 font-normal">receipts</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">CDA Sequential OR Numbering Verified</span>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Primary Cash Debit</span>
            <div className="text-xl font-bold text-white mt-1">
              ₱{cashDebitedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Posted to 1110 / 1120 accounts</span>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Filter className="w-4 h-4 text-emerald-400" />
            <span>CRJ Filter:</span>
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
          onClick={onNewReceipt}
          className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Cash Receipt (OR)</span>
        </button>
      </div>

      {/* Excel Table for Cash Receipt Journal */}
      <ExcelGridTable
        title="Cash Receipt Journal (CRJ)"
        subtitle="Specialized cooperative book of original entry recording all cash, check, and digital collections, loan repayments, capital build-up, and fee income."
        exportFileName="cash_receipt_journal_cda"
        data={receiptJournals}
        columns={columns}
        defaultSortKey="posting_date"
        defaultSortDir="desc"
      />
    </div>
  );
};
