import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Printer,
  Search,
  Filter,
  User,
  RotateCcw,
  BookOpen,
  CreditCard,
  PiggyBank,
  Coins,
  Receipt,
  FileText,
  Building2,
  Calendar
} from 'lucide-react';
import { Account, Branch, JournalEntry, Member } from '../../types';
import { SearchableSelect, SearchableOption } from '../common/SearchableSelect';
import { api } from '../../services/api';

interface AccountLedgerReportProps {
  accounts: Account[];
  journals: JournalEntry[];
  branches: Branch[];
  selectedBranch: string;
  members?: Member[];
}

type LedgerRow = {
  id: string;
  date: string;
  voucher: string;
  voucherType: string;
  source: string;
  sourceType: string;
  particulars: string;
  branch: string;
  branchId: string;
  memberId: string | null;
  memberName: string | null;
  memberNo: string | null;
  debit: number;
  credit: number;
  balance: number;
};

const money = (value: number) =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(value || 0);

const csvCell = (value: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const AccountLedgerReport: React.FC<AccountLedgerReportProps> = ({
  accounts,
  journals,
  branches,
  selectedBranch,
  members: propMembers = []
}) => {
  const [internalMembers, setInternalMembers] = useState<Member[]>([]);
  const [accountId, setAccountId] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback: If parent did not provide members or it's empty, fetch from api
  useEffect(() => {
    if (propMembers.length > 0) {
      setInternalMembers(propMembers);
    } else {
      api.getMembers()
        .then(res => {
          if (res?.data && Array.isArray(res.data)) {
            setInternalMembers(res.data);
          }
        })
        .catch(err => console.error('Failed to fetch members for account ledger:', err));
    }
  }, [propMembers]);

  const allMembers = propMembers.length > 0 ? propMembers : internalMembers;

  const account = accounts.find(item => item.id === accountId);

  // Default to first account with journal entries or first account
  useEffect(() => {
    if (accountId || !accounts.length) return;
    const accountWithEntries = accounts.find(item =>
      journals.some(journal => (journal.lines || []).some(line => line.account_id === item.id))
    );
    setAccountId(accountWithEntries?.id || accounts[0].id);
  }, [accountId, accounts, journals]);

  // Map each journal line to an enriched ledger row with subsidiary member & source categorization
  const sourceRows = useMemo(() => {
    return journals.flatMap(journal =>
      (journal.lines || [])
        .filter(line => line.account_id === accountId)
        .map((line, index) => {
          // 1. Resolve Subsidiary Member Link
          let matchedMemberId: string | null = null;
          if (line.subsidiary_type?.toLowerCase() === 'member' && line.subsidiary_id) {
            matchedMemberId = line.subsidiary_id;
          } else if (journal.member_id) {
            matchedMemberId = journal.member_id;
          } else if (
            (journal.reference_type === 'MEMBER' ||
              journal.reference_type === 'LOAN' ||
              journal.reference_type === 'CASH_RECEIPT') &&
            journal.reference_id
          ) {
            matchedMemberId = journal.reference_id;
          }

          let matchedMember: Member | undefined;
          if (matchedMemberId) {
            matchedMember = allMembers.find(
              m => m.id === matchedMemberId || m.member_no === matchedMemberId
            );
          }

          const memberName = matchedMember
            ? matchedMember.last_name && matchedMember.first_name
              ? `${matchedMember.last_name}, ${matchedMember.first_name}${matchedMember.middle_name ? ` ${matchedMember.middle_name[0]}.` : ''}`
              : `${matchedMember.first_name || ''} ${matchedMember.last_name || ''}`.trim()
            : journal.member_name || (line.subsidiary_type === 'Member' ? line.subsidiary_id : null);

          const memberNo = matchedMember?.member_no || (line.subsidiary_type === 'Member' ? line.subsidiary_id : null);

          // 2. Classify Transaction Source / Type
          const refType = String(journal.reference_type || '').toUpperCase();
          const desc = String(journal.description || '').toLowerCase();
          const voucher = String(journal.voucher_number || '').toUpperCase();
          const voucherType = String(journal.voucher_type || '').toUpperCase();

          let sourceType = 'OTHER';
          if (
            desc.includes('loan release') ||
            desc.includes('loan disbursement') ||
            desc.includes('approved/released') ||
            refType.includes('DISBURSEMENT') && desc.includes('loan')
          ) {
            sourceType = 'LOAN_RELEASE';
          } else if (
            desc.includes('loan payment') ||
            desc.includes('amortization') ||
            desc.includes('principal') ||
            desc.includes('repayment') ||
            desc.includes('interest on loan')
          ) {
            sourceType = 'LOAN_PAYMENT';
          } else if (refType.includes('LOAN') || desc.includes('loan')) {
            sourceType = 'LOAN_GENERAL';
          } else if (
            refType.includes('SAVING') ||
            desc.includes('savings deposit') ||
            desc.includes('savings withdrawal') ||
            desc.includes('saving')
          ) {
            sourceType = 'SAVINGS';
          } else if (
            refType.includes('SHARE') ||
            desc.includes('share capital') ||
            desc.includes('cbu') ||
            desc.includes('paidup share')
          ) {
            sourceType = 'SHARE_CAPITAL';
          } else if (voucherType === 'OR' || refType.includes('CASH_RECEIPT') || voucher.startsWith('OR-')) {
            sourceType = 'CASH_RECEIPT';
          } else if (voucherType === 'CD' || refType.includes('DISBURSEMENT') || voucher.startsWith('CD-')) {
            sourceType = 'DISBURSEMENT';
          } else if (voucherType === 'JV' || refType.includes('JOURNAL') || voucher.startsWith('JV-')) {
            sourceType = 'JOURNAL_ENTRY';
          }

          return {
            id: `${journal.id}-${line.id || index}`,
            date: journal.posting_date,
            voucher: journal.voucher_number,
            voucherType: journal.voucher_type || 'JV',
            source: journal.reference_type,
            sourceType,
            particulars: journal.description,
            branch: branches.find(branch => branch.id === journal.branch_id)?.name || 'Main Branch',
            branchId: journal.branch_id,
            memberId: matchedMember?.id || matchedMemberId || null,
            memberName: memberName || null,
            memberNo: memberNo || null,
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
            balance: 0
          };
        })
    ).sort((a, b) => a.date.localeCompare(b.date) || a.voucher.localeCompare(b.voucher));
  }, [journals, accountId, branches, allMembers]);

  // Filter evaluation predicate
  const matchesRowFilters = (row: typeof sourceRows[0], ignoreDate = false) => {
    // 1. Branch filter
    if (selectedBranch !== 'all' && row.branchId !== selectedBranch) return false;

    // 2. Member filter
    if (selectedMemberId !== 'all') {
      if (selectedMemberId === 'unassigned') {
        if (row.memberId) return false;
      } else {
        if (row.memberId !== selectedMemberId) return false;
      }
    }

    // 3. Transaction Source / Type filter
    if (selectedSourceType !== 'all') {
      if (selectedSourceType === 'LOAN_ALL') {
        if (!['LOAN_RELEASE', 'LOAN_PAYMENT', 'LOAN_GENERAL'].includes(row.sourceType)) return false;
      } else if (selectedSourceType === 'LOAN_PAYMENT') {
        if (row.sourceType !== 'LOAN_PAYMENT') return false;
      } else if (selectedSourceType === 'LOAN_RELEASE') {
        if (row.sourceType !== 'LOAN_RELEASE') return false;
      } else if (selectedSourceType === 'SAVINGS') {
        if (row.sourceType !== 'SAVINGS') return false;
      } else if (selectedSourceType === 'SHARE_CAPITAL') {
        if (row.sourceType !== 'SHARE_CAPITAL') return false;
      } else if (selectedSourceType === 'CASH_RECEIPT') {
        if (row.sourceType !== 'CASH_RECEIPT') return false;
      } else if (selectedSourceType === 'DISBURSEMENT') {
        if (row.sourceType !== 'DISBURSEMENT') return false;
      } else if (selectedSourceType === 'JOURNAL_ENTRY') {
        if (row.sourceType !== 'JOURNAL_ENTRY') return false;
      }
    }

    // 4. Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inPart = String(row.particulars || '').toLowerCase().includes(q);
      const inVoucher = String(row.voucher || '').toLowerCase().includes(q);
      const inMember = String(row.memberName || '').toLowerCase().includes(q);
      const inMemNo = String(row.memberNo || '').toLowerCase().includes(q);
      const inBranch = String(row.branch || '').toLowerCase().includes(q);
      if (!inPart && !inVoucher && !inMember && !inMemNo && !inBranch) return false;
    }

    // 5. Date filters (if not calculating opening balance)
    if (!ignoreDate) {
      if (fromDate && row.date < fromDate) return false;
      if (toDate && row.date > toDate) return false;
    }

    return true;
  };

  const normalMultiplier = account?.normal_balance === 'Credit' ? -1 : 1;

  // Dynamic Opening Balance recalculation: sum of filtered transactions prior to fromDate
  const openingBalance = useMemo(() => {
    if (!fromDate) return 0;
    return sourceRows
      .filter(row => row.date < fromDate && matchesRowFilters(row, true))
      .reduce((sum, row) => sum + (row.debit - row.credit) * normalMultiplier, 0);
  }, [sourceRows, fromDate, normalMultiplier, selectedBranch, selectedMemberId, selectedSourceType, searchQuery]);

  // In-period filtered rows with dynamic running balances
  const rows = useMemo(() => {
    let balance = openingBalance;

    return sourceRows
      .filter(row => matchesRowFilters(row, false))
      .map(row => {
        balance += (row.debit - row.credit) * normalMultiplier;
        return {
          ...row,
          balance
        } as LedgerRow;
      });
  }, [sourceRows, fromDate, toDate, openingBalance, normalMultiplier, selectedBranch, selectedMemberId, selectedSourceType, searchQuery]);

  // Aggregate totals dynamically computed from active filtered records
  const totals = useMemo(() => {
    return rows.reduce(
      (sum, row) => ({
        debit: sum.debit + row.debit,
        credit: sum.credit + row.credit
      }),
      { debit: 0, credit: 0 }
    );
  }, [rows]);

  const selectedMemberObj = useMemo(() => {
    if (selectedMemberId === 'all' || selectedMemberId === 'unassigned') return null;
    return allMembers.find(m => m.id === selectedMemberId);
  }, [allMembers, selectedMemberId]);

  const branchLabel =
    selectedBranch === 'all'
      ? 'All Branches'
      : branches.find(branch => branch.id === selectedBranch)?.name || 'Branch';

  const periodLabel = `${fromDate || 'Beginning'} to ${toDate || 'Present'}`;

  const memberFilterLabel = useMemo(() => {
    if (selectedMemberId === 'all') return 'All Members (Consolidated)';
    if (selectedMemberId === 'unassigned') return 'General Cooperative Entries (No Member)';
    if (selectedMemberObj) {
      return `${selectedMemberObj.last_name}, ${selectedMemberObj.first_name} (${selectedMemberObj.member_no})`;
    }
    return 'Specific Member';
  }, [selectedMemberId, selectedMemberObj]);

  const sourceFilterLabel = useMemo(() => {
    const map: Record<string, string> = {
      all: 'All Transaction Types',
      LOAN_ALL: 'All Loan Transactions (Releases & Payments)',
      LOAN_PAYMENT: 'Loan Payments / Principal Amortizations',
      LOAN_RELEASE: 'Loan Releases / Disbursements',
      SAVINGS: 'Savings Deposits & Withdrawals',
      SHARE_CAPITAL: 'Share Capital (CBU) Contributions',
      CASH_RECEIPT: 'Cash Receipts (Official Receipts - OR)',
      DISBURSEMENT: 'Cash Disbursements (Check / Voucher - CD)',
      JOURNAL_ENTRY: 'General Journal Vouchers (JV)'
    };
    return map[selectedSourceType] || selectedSourceType;
  }, [selectedSourceType]);

  const isFilterActive =
    selectedMemberId !== 'all' ||
    selectedSourceType !== 'all' ||
    fromDate !== '' ||
    toDate !== '' ||
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedMemberId('all');
    setSelectedSourceType('all');
    setFromDate('');
    setToDate('');
    setSearchQuery('');
  };

  const exportCsv = () => {
    if (!account) return;
    const lines = [
      ['Cooperative General Ledger Account Report', account.name],
      ['GL Account Code', account.code || account.account_code || ''],
      ['Classification', account.type || ''],
      ['Normal Balance', account.normal_balance || 'Debit'],
      ['Branch Scope', branchLabel],
      ['Period', periodLabel],
      ['Member Filter', memberFilterLabel],
      ['Transaction Type Filter', sourceFilterLabel],
      ['Generated On', new Date().toISOString()],
      [],
      ['Date', 'Voucher No.', 'Source / Type', 'Member Subsidiary', 'Member No.', 'Particulars', 'Branch', 'Debit (PHP)', 'Credit (PHP)', 'Running Balance (PHP)'],
      ['Opening balance', '', '', '', '', 'Prior period balance for active filters', '', '', '', openingBalance],
      ...rows.map(row => [
        row.date,
        row.voucher,
        row.source || row.sourceType,
        row.memberName || 'General / Cooperative',
        row.memberNo || '—',
        row.particulars,
        row.branch,
        row.debit,
        row.credit,
        row.balance
      ]),
      ['Period Totals', '', '', '', '', `Filtered entries count: ${rows.length}`, '', totals.debit, totals.credit, rows.at(-1)?.balance ?? openingBalance]
    ].map(row => row.map(csvCell).join(',')).join('\r\n');

    const filename = `account_ledger_${account.code || 'GL'}_${selectedMemberId !== 'all' ? `member_${selectedMemberObj?.member_no || 'filtered'}_` : ''}${new Date().toISOString().slice(0, 10)}.csv`;
    const url = URL.createObjectURL(new Blob([lines], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const accountOptions: SearchableOption[] = useMemo(() => {
    return accounts.map(item => {
      const glType = item.type || item.category || 'Asset';
      return {
        value: item.id,
        label: `${item.name} (${glType})`,
        code: item.account_code || item.code,
        type: glType,
        description: `GL Code: ${item.account_code || item.code || 'N/A'} • Normal Balance: ${item.normal_balance || 'Credit'}`,
        searchTerms: `${item.account_code || item.code || ''} ${item.name} ${glType} ${item.normal_balance || ''} GL Account`
      };
    });
  }, [accounts]);

  const memberOptions: SearchableOption[] = useMemo(() => {
    const list: SearchableOption[] = [
      {
        value: 'all',
        label: 'All Members (Consolidated Ledger)',
        code: 'ALL',
        description: 'Display all journal entries across every member and general transactions'
      },
      {
        value: 'unassigned',
        label: 'General Cooperative Entries Only',
        code: 'GENERAL',
        description: 'Entries not linked to any specific member subsidiary account'
      }
    ];

    allMembers.forEach(m => {
      const mid = m.middle_name ? ` ${m.middle_name[0].toUpperCase()}.` : '';
      const formattedName =
        m.last_name && m.first_name ? `${m.last_name}, ${m.first_name}${mid}` : `${m.first_name} ${m.last_name}`;
      list.push({
        value: m.id,
        label: formattedName,
        code: m.member_no,
        type: m.member_type_name || 'Member',
        badge: m.branch_name,
        description: `Member ID: ${m.member_no} • Branch: ${m.branch_name || 'Main Branch'}`,
        searchTerms: `${m.member_no} ${m.first_name} ${m.last_name} ${m.branch_name || ''} ${m.tin_number || ''}`
      });
    });

    return list;
  }, [allMembers]);

  return (
    <section className="space-y-4">
      {/* Filter and Control Panel */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 print:hidden space-y-4">
        {/* Row 1: Primary Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* GL Account Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              General Ledger Account <span className="text-emerald-400 font-normal">({accounts.length})</span>
            </label>
            <SearchableSelect
              options={accountOptions}
              value={accountId}
              onChange={setAccountId}
              placeholder="Search or select GL account..."
              searchPlaceholder="Filter accounts by code, name, or GL type..."
              showGLTypeBadge={true}
              alwaysShowSearch={true}
              minOptionsForSearch={6}
            />
          </div>

          {/* Member Selector (SearchableSelect) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Filter by Member</span>
              </span>
              {selectedMemberId !== 'all' && (
                <span className="text-[10px] text-blue-400 font-normal bg-blue-500/10 px-1.5 py-0.5 rounded">
                  Filtered
                </span>
              )}
            </label>
            <SearchableSelect
              options={memberOptions}
              value={selectedMemberId}
              onChange={setSelectedMemberId}
              placeholder="All Members or Select Specific..."
              searchPlaceholder="Search member name or member ID..."
              alwaysShowSearch={true}
              minOptionsForSearch={4}
            />
          </div>

          {/* Transaction Type / Source Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center space-x-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Transaction Type / Source</span>
            </label>
            <select
              value={selectedSourceType}
              onChange={e => setSelectedSourceType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Transaction Types</option>
              <optgroup label="Loan Operations">
                <option value="LOAN_ALL">All Loan Transactions (Releases & Repayments)</option>
                <option value="LOAN_RELEASE">Loan Releases / Disbursements</option>
                <option value="LOAN_PAYMENT">Loan Payments / Principal Amortizations</option>
              </optgroup>
              <optgroup label="Savings & Equity">
                <option value="SAVINGS">Savings Deposits & Withdrawals</option>
                <option value="SHARE_CAPITAL">Share Capital (CBU) Contributions</option>
              </optgroup>
              <optgroup label="Cash & Journal Vouchers">
                <option value="CASH_RECEIPT">Cash Receipts (Official Receipts - OR)</option>
                <option value="DISBURSEMENT">Cash Disbursements (Check / Voucher - CD)</option>
                <option value="JOURNAL_ENTRY">General Journal Vouchers (JV)</option>
              </optgroup>
            </select>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={event => setFromDate(event.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">To</label>
              <input
                type="date"
                value={toDate}
                onChange={event => setToDate(event.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Row 2: Search Query, Preset Chips & Action Buttons */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          {/* Quick Filter Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Presets:</span>
            <button
              onClick={() => setSelectedSourceType('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                selectedSourceType === 'all'
                  ? 'bg-slate-800 text-white border border-slate-600'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setSelectedSourceType('LOAN_RELEASE')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                selectedSourceType === 'LOAN_RELEASE'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-950 text-rose-400 hover:text-rose-300 border border-slate-800'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              <span>Loan Releases</span>
            </button>
            <button
              onClick={() => setSelectedSourceType('LOAN_PAYMENT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                selectedSourceType === 'LOAN_PAYMENT'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-950 text-amber-400 hover:text-amber-300 border border-slate-800'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              <span>Loan Payments</span>
            </button>
            <button
              onClick={() => setSelectedSourceType('SAVINGS')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                selectedSourceType === 'SAVINGS'
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-950 text-purple-400 hover:text-purple-300 border border-slate-800'
              }`}
            >
              <PiggyBank className="w-3 h-3" />
              <span>Savings</span>
            </button>
            <button
              onClick={() => setSelectedSourceType('SHARE_CAPITAL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                selectedSourceType === 'SHARE_CAPITAL'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-blue-400 hover:text-blue-300 border border-slate-800'
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>Share Capital</span>
            </button>
            <button
              onClick={() => setSelectedSourceType('JOURNAL_ENTRY')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1 ${
                selectedSourceType === 'JOURNAL_ENTRY'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-emerald-400 hover:text-emerald-300 border border-slate-800'
              }`}
            >
              <BookOpen className="w-3 h-3" />
              <span>Manual JV</span>
            </button>
          </div>

          {/* Search Input & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search particulars or voucher..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer transition"
                title="Clear all active filters"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Reset</span>
              </button>
            )}

            <button
              onClick={exportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 rounded-xl text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer transition shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>

        {/* Live Active Filters & Dynamic KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 text-xs">
          <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Filtered Records</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="text-base font-bold text-white">{rows.length}</span>
              <span className="text-[11px] text-slate-500">of {sourceRows.length} lines</span>
            </div>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Period Total Debits</span>
            <span className="text-base font-bold text-emerald-400 font-mono mt-0.5 block">{money(totals.debit)}</span>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Period Total Credits</span>
            <span className="text-base font-bold text-blue-400 font-mono mt-0.5 block">{money(totals.credit)}</span>
          </div>

          <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800">
            <span className="text-slate-400 text-[10px] block uppercase font-medium">Ending Balance</span>
            <span className="text-base font-bold text-white font-mono mt-0.5 block">
              {money(rows.at(-1)?.balance ?? openingBalance)}
            </span>
          </div>
        </div>

        {/* Active Filter Callout Badge */}
        {isFilterActive && (
          <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300">
            <span className="font-semibold text-emerald-400">Active Criteria:</span>
            {selectedMemberId !== 'all' && (
              <span className="px-2 py-0.5 bg-emerald-900/60 rounded text-[11px] font-mono">
                Member: {memberFilterLabel}
              </span>
            )}
            {selectedSourceType !== 'all' && (
              <span className="px-2 py-0.5 bg-emerald-900/60 rounded text-[11px]">
                Type: {sourceFilterLabel}
              </span>
            )}
            {(fromDate || toDate) && (
              <span className="px-2 py-0.5 bg-emerald-900/60 rounded text-[11px]">
                Dates: {periodLabel}
              </span>
            )}
            {searchQuery && (
              <span className="px-2 py-0.5 bg-emerald-900/60 rounded text-[11px]">
                Keyword: "{searchQuery}"
              </span>
            )}
            <button
              onClick={handleResetFilters}
              className="ml-auto text-[11px] text-amber-300 hover:text-amber-200 underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Printable Report Document */}
      <div
        id="account-ledger-print"
        className="bg-slate-900 rounded-2xl border border-slate-800 p-6 print:bg-white print:text-black print:border-0 print:p-0 space-y-4"
      >
        <header className="border-b border-slate-700 pb-4 mb-4 print:border-slate-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-emerald-400 print:text-slate-700 flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4" />
                <span>General Ledger Subsidiary Account Report</span>
              </p>
              <h2 className="text-xl font-bold text-white mt-1 print:text-black">
                {account ? `${account.account_code || account.code} — ${account.name}` : 'Select an account'}
              </h2>
            </div>
            <div className="text-right text-xs text-slate-400 print:text-slate-600">
              <p>Period: <strong className="text-white print:text-black">{periodLabel}</strong></p>
              {selectedMemberId !== 'all' && (
                <p className="text-blue-400 print:text-black font-semibold mt-0.5">
                  Filtered Member: {memberFilterLabel}
                </p>
              )}
              {selectedSourceType !== 'all' && (
                <p className="text-amber-400 print:text-black font-semibold mt-0.5">
                  Filtered Type: {sourceFilterLabel}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-xs text-slate-400 print:text-slate-600">
            <span>Classification: <strong className="text-slate-200 print:text-black">{account?.type || '—'}</strong></span>
            <span>Normal balance: <strong className="text-slate-200 print:text-black">{account?.normal_balance || 'Debit'}</strong></span>
            <span>Branch Scope: <strong className="text-slate-200 print:text-black">{branchLabel}</strong></span>
            <span>Showing: <strong className="text-slate-200 print:text-black">{rows.length} lines</strong></span>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs print:text-[10px]">
            <thead className="bg-slate-800 text-slate-300 uppercase tracking-wide print:bg-slate-100 print:text-black">
              <tr>
                <th className="p-2.5">Date</th>
                <th className="p-2.5">Voucher</th>
                <th className="p-2.5">Source / Type</th>
                <th className="p-2.5">Member / Subsidiary</th>
                <th className="p-2.5">Particulars</th>
                <th className="p-2.5">Branch</th>
                <th className="p-2.5 text-right">Debit</th>
                <th className="p-2.5 text-right">Credit</th>
                <th className="p-2.5 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              {/* Dynamic Opening Balance Row */}
              <tr className="bg-slate-950/60 font-semibold text-slate-200 print:bg-slate-50 print:text-black">
                <td className="p-2.5" colSpan={8}>
                  Opening balance {fromDate ? `(Prior to ${fromDate} for active filters)` : '(Beginning of records)'}
                </td>
                <td className="p-2.5 text-right font-mono font-bold text-white print:text-black">
                  {money(openingBalance)}
                </td>
              </tr>

              {rows.map(row => {
                let sourceBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                if (row.sourceType === 'LOAN_RELEASE') {
                  sourceBadgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
                } else if (row.sourceType === 'LOAN_PAYMENT') {
                  sourceBadgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
                } else if (row.sourceType === 'SAVINGS') {
                  sourceBadgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40';
                } else if (row.sourceType === 'SHARE_CAPITAL') {
                  sourceBadgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
                } else if (row.sourceType === 'JOURNAL_ENTRY') {
                  sourceBadgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
                }

                return (
                  <tr key={row.id} className="text-slate-300 hover:bg-slate-800/40 transition print:text-black">
                    <td className="p-2.5 whitespace-nowrap font-mono text-slate-400 print:text-slate-700">{row.date}</td>
                    <td className="p-2.5 font-mono font-semibold text-emerald-400 print:text-black">{row.voucher}</td>
                    <td className="p-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] border font-semibold ${sourceBadgeColor}`}>
                        {row.source || row.sourceType}
                      </span>
                    </td>
                    <td className="p-2.5 whitespace-nowrap">
                      {row.memberName ? (
                        <div>
                          <span className="font-semibold text-white print:text-black block">{row.memberName}</span>
                          {row.memberNo && (
                            <span className="text-[10px] text-slate-400 print:text-slate-600 font-mono">
                              {row.memberNo}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500 print:text-slate-500 italic text-[11px]">General / Unassigned</span>
                      )}
                    </td>
                    <td className="p-2.5 min-w-48 text-slate-200 print:text-black">{row.particulars}</td>
                    <td className="p-2.5 text-slate-400 print:text-slate-600">{row.branch}</td>
                    <td className="p-2.5 text-right font-mono text-emerald-400 print:text-black font-medium">
                      {row.debit ? money(row.debit) : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono text-blue-400 print:text-black font-medium">
                      {row.credit ? money(row.credit) : '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-white print:text-black">
                      {money(row.balance)}
                    </td>
                  </tr>
                );
              })}

              {!rows.length && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    No posted transactions match the selected account, member, transaction type, and date criteria.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-slate-800 font-bold text-white print:bg-slate-100 print:text-black">
              <tr>
                <td className="p-2.5" colSpan={6}>
                  Period totals ({rows.length} records matching active filters)
                </td>
                <td className="p-2.5 text-right font-mono text-emerald-400 print:text-black">{money(totals.debit)}</td>
                <td className="p-2.5 text-right font-mono text-blue-400 print:text-black">{money(totals.credit)}</td>
                <td className="p-2.5 text-right font-mono text-white print:text-black">
                  {money(rows.at(-1)?.balance ?? openingBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-4 text-[10px] text-slate-500 print:text-slate-500">
          Generated {new Date().toLocaleString()} • Authorized General Ledger Subsidiary Account Report • Dynamic Running Balance & CDA Standard Double-Entry Accounting.
        </p>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #account-ledger-print, #account-ledger-print * { visibility: visible; }
          #account-ledger-print { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: landscape; margin: 12mm; }
        }
      `}</style>
    </section>
  );
};
