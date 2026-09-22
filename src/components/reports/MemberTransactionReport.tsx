import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Printer,
  RefreshCw,
  Search,
  BookOpen,
  Plus,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  User,
  ShieldCheck,
  CreditCard,
  PiggyBank,
  Coins,
  FileSpreadsheet,
  Building2
} from 'lucide-react';
import { api } from '../../services/api';
import { Member } from '../../types';

interface Props {
  members: Member[];
  initialMemberId?: string;
}

const money = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n || 0);

const cell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const MemberTransactionReport: React.FC<Props> = ({ members = [], initialMemberId }) => {
  const safeMembers = Array.isArray(members) ? members : [];
  const [memberId, setMemberId] = useState(initialMemberId || safeMembers[0]?.id || '');
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'manual_jv' | 'share_capital' | 'savings' | 'loans'>('all');
  const [expandedJVs, setExpandedJVs] = useState<Set<string>>(new Set());

  // Modal for quick manual JV posting for this member
  const [showJvModal, setShowJvModal] = useState(false);
  const [postingJv, setPostingJv] = useState(false);
  const [jvSuccess, setJvSuccess] = useState<string | null>(null);
  const [jvError, setJvError] = useState<string | null>(null);
  const [jvLines, setJvLines] = useState<Array<{ account_id: string; debit: number; credit: number; subsidiary_type: string; subsidiary_id: string }>>([
    { account_id: 'acc_1110', debit: 1500, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
    { account_id: 'acc_4210', debit: 0, credit: 500, subsidiary_type: 'Member', subsidiary_id: '' },
    { account_id: 'acc_3110', debit: 0, credit: 1000, subsidiary_type: 'Member', subsidiary_id: '' }
  ]);
  const [jvDescription, setJvDescription] = useState('');
  const [jvDate, setJvDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (initialMemberId) {
      setMemberId(initialMemberId);
    } else if (!memberId && safeMembers.length > 0) {
      setMemberId(safeMembers[0].id);
    }
  }, [initialMemberId, safeMembers, memberId]);

  const load = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const res = await api.getMemberReport(memberId);
      setReport(res.data);
    } catch (e) {
      console.error('Failed to load member report:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [memberId]);

  useEffect(() => {
    const refreshReport = () => load();
    window.addEventListener('coop:data-changed', refreshReport);
    return () => window.removeEventListener('coop:data-changed', refreshReport);
  }, [memberId]);

  const member = report?.member || safeMembers.find(item => item.id === memberId);

  // Initialize or reset JV modal prefill when member changes
  useEffect(() => {
    if (member) {
      const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
      setJvDescription(`${fullName} paid membership and share capital`);
      setJvLines([
        { account_id: 'acc_1110', debit: 1500, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
        { account_id: 'acc_4210', debit: 0, credit: 500, subsidiary_type: 'Member', subsidiary_id: member.id },
        { account_id: 'acc_3110', debit: 0, credit: 1000, subsidiary_type: 'Member', subsidiary_id: member.id }
      ]);
    }
  }, [member]);

  const allTransactions: any[] = report?.transactions || [];

  const filteredRows = useMemo(() => {
    return allTransactions.filter((row: any) => {
      // Date filter
      if (from && row.date < from) return false;
      if (to && row.date > to) return false;

      // Category / Tab filter
      if (activeTab === 'manual_jv') {
        if (!row.is_manual_jv && !row.is_jv) return false;
      } else if (activeTab === 'share_capital') {
        const isShare = row.category === 'Share Capital' || String(row.type).toLowerCase().includes('share') || String(row.description).toLowerCase().includes('share');
        if (!isShare) return false;
      } else if (activeTab === 'savings') {
        const isSav = row.category === 'Savings' || String(row.type).toLowerCase().includes('saving');
        if (!isSav) return false;
      } else if (activeTab === 'loans') {
        const isLoan = row.category === 'Loans' || String(row.type).toLowerCase().includes('loan');
        if (!isLoan) return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inDesc = String(row.description || '').toLowerCase().includes(q);
        const inRef = String(row.reference || '').toLowerCase().includes(q);
        const inType = String(row.type || '').toLowerCase().includes(q);
        const inAcc = String(row.accounts || '').toLowerCase().includes(q);
        if (!inDesc && !inRef && !inType && !inAcc) return false;
      }

      return true;
    });
  }, [allTransactions, from, to, activeTab, searchQuery]);

  const toggleExpand = (rowId: string) => {
    setExpandedJVs(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const handlePostQuickJV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    const totalDeb = jvLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCred = jvLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

    if (Math.abs(totalDeb - totalCred) > 0.01) {
      setJvError(`Debit (₱${totalDeb.toFixed(2)}) must equal Credit (₱${totalCred.toFixed(2)}).`);
      return;
    }

    setPostingJv(true);
    setJvError(null);
    setJvSuccess(null);

    try {
      const payload = {
        posting_date: jvDate,
        branch_id: member.branch_id || 'branch_tar',
        description: jvDescription,
        member_id: member.id,
        member_name: `${member.first_name} ${member.last_name}`,
        reference_type: 'MANUAL_JOURNAL',
        performed_by: 'Chief Accountant',
        lines: jvLines.map(l => ({
          account_id: l.account_id,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          subsidiary_type: l.subsidiary_type || 'Member',
          subsidiary_id: l.subsidiary_id || member.id
        }))
      };

      const res = await api.createManualJournal(payload);
      setJvSuccess(`Journal Voucher ${res.data?.voucher_number || 'JV'} posted successfully.`);
      setTimeout(() => {
        setShowJvModal(false);
        setJvSuccess(null);
      }, 1500);

      await load();
      window.dispatchEvent(new CustomEvent('coop:data-changed'));
    } catch (err: any) {
      setJvError(err.message || 'Failed to post manual journal voucher.');
    } finally {
      setPostingJv(false);
    }
  };

  const applyPreset = (preset: 'both' | 'share_only' | 'membership_only') => {
    if (!member) return;
    const fullName = `${member.first_name} ${member.last_name}`;
    if (preset === 'both') {
      setJvDescription(`${fullName} paid membership and share capital`);
      setJvLines([
        { account_id: 'acc_1110', debit: 1500, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
        { account_id: 'acc_4210', debit: 0, credit: 500, subsidiary_type: 'Member', subsidiary_id: member.id },
        { account_id: 'acc_3110', debit: 0, credit: 1000, subsidiary_type: 'Member', subsidiary_id: member.id }
      ]);
    } else if (preset === 'share_only') {
      setJvDescription(`${fullName} paid share capital (CBU) contribution`);
      setJvLines([
        { account_id: 'acc_1110', debit: 1000, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
        { account_id: 'acc_3110', debit: 0, credit: 1000, subsidiary_type: 'Member', subsidiary_id: member.id }
      ]);
    } else if (preset === 'membership_only') {
      setJvDescription(`${fullName} paid membership fee`);
      setJvLines([
        { account_id: 'acc_1110', debit: 500, credit: 0, subsidiary_type: 'Cash', subsidiary_id: 'cash_01' },
        { account_id: 'acc_4210', debit: 0, credit: 500, subsidiary_type: 'Member', subsidiary_id: member.id }
      ]);
    }
  };
  
  const exportCsv = () => {
    const csv = [
      ['Member Transaction Ledger & Journal Voucher Report', `${member?.first_name || ''} ${member?.last_name || ''}`],
      ['Member No', member?.member_no || ''],
      ['Branch', member?.branch_name || ''],
      ['Generated At', new Date().toISOString()],
      [],
      ['Date', 'Type', 'Voucher / Reference', 'Category', 'Description', 'Accounts Breakdown', 'Debit (PHP)', 'Credit (PHP)', 'Amount (PHP)', 'Status'],
      ...filteredRows.map((row: any) => [
        row.date,
        row.type,
        row.reference || row.voucher_number || '',
        row.category || '',
        row.description,
        row.accounts || '',
        row.debit || 0,
        row.credit || 0,
        row.amount || 0,
        row.status || 'Posted'
      ])
    ]
      .map(row => row.map(cell).join(','))
      .join('\r\n');

    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `member_ledger_${member?.member_no || 'report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const jvCount = allTransactions.filter(r => r.is_manual_jv || r.is_jv).length;
  const shareCount = allTransactions.filter(r => r.category === 'Share Capital' || String(r.type).includes('Share')).length;
  const savingsCount = allTransactions.filter(r => r.category === 'Savings' || String(r.type).includes('Savings')).length;
  const loansCount = allTransactions.filter(r => r.category === 'Loans' || String(r.type).includes('Loan')).length;

  if (!safeMembers || safeMembers.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl p-12 border border-slate-800 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <Printer className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">No Members Available for Reporting</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            The member registry currently has no enrolled cooperative members. Register a member in the registry to generate individual account statements and transaction histories.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Top Filter & Control Panel */}
      <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 print:hidden space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div className="flex-1 max-w-md">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Select Member Account
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
              <select
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white cursor-pointer focus:outline-none focus:border-emerald-500"
              >
                {safeMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.member_no} — {m.first_name} {m.last_name} ({m.branch_name || 'Member'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Date From</label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Date To</label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
              />
            </div>

            <button
              onClick={load}
              className="p-2 mt-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 cursor-pointer"
              title="Refresh Report"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => setShowJvModal(true)}
              className="flex items-center space-x-1.5 mt-4 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow cursor-pointer transition"
              title="Create a manual balanced Journal Voucher for this member"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post Manual JV</span>
            </button>

            <button
              onClick={exportCsv}
              className="flex items-center space-x-1 mt-4 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-white cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1 mt-4 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs text-white cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center space-x-1.5 ${
                activeTab === 'all'
                  ? 'bg-slate-800 text-white border border-slate-600 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>All Ledger Records</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-slate-700 rounded-full">{allTransactions.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('manual_jv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center space-x-1.5 ${
                activeTab === 'manual_jv'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Journal Vouchers (JV)</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-700/80 text-white rounded-full">{jvCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('share_capital')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center space-x-1.5 ${
                activeTab === 'share_capital'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-blue-400 hover:text-blue-300'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Share Capital</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-700/80 text-white rounded-full">{shareCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('savings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center space-x-1.5 ${
                activeTab === 'savings'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              <PiggyBank className="w-3.5 h-3.5" />
              <span>Savings</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-purple-700/80 text-white rounded-full">{savingsCount}</span>
            </button>

            <button
              onClick={() => setActiveTab('loans')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition flex items-center space-x-1.5 ${
                activeTab === 'loans'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Loans</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-700/80 text-white rounded-full">{loansCount}</span>
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search particulars, voucher #..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Printable Report Document */}
      <div
        id="member-report-print"
        className="bg-slate-900 rounded-2xl p-6 border border-slate-800 print:bg-white print:text-black print:border-0 print:p-0 space-y-6"
      >
        {/* Document Header */}
        <header className="border-b border-slate-700 pb-4 print:border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400 print:text-emerald-700">
              <ShieldCheck className="w-4 h-4" />
              <span>Cooperative Member Subsidiary Ledger & Journal History</span>
            </div>
            <h2 className="text-2xl font-bold text-white print:text-black mt-1">
              {member ? `${member.first_name} ${member.middle_name || ''} ${member.last_name}` : 'Select a member'}
            </h2>
            <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
              Member ID: <span className="font-mono text-emerald-400 print:text-black font-semibold">{member?.member_no || '—'}</span> ·
              Branch: <span className="text-slate-300 print:text-black">{member?.branch_name || 'Main Branch'}</span> ·
              Member Type: <span className="text-slate-300 print:text-black">{member?.member_type_name || 'Regular Member'}</span>
            </p>
          </div>

          <div className="text-right text-xs text-slate-400 print:text-slate-600">
            <p>Period: <strong className="text-white print:text-black">{from || 'Beginning'} to {to || 'Present'}</strong></p>
            <p className="mt-0.5">Status: <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold text-[10px]">Active Member</span></p>
          </div>
        </header>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300">
            <span className="text-slate-400 print:text-slate-600 block text-[11px]">Paid-Up Share Capital (CBU)</span>
            <strong className="block text-lg font-bold text-emerald-400 print:text-black mt-1 font-mono">
              {money(report?.summary?.share_capital)}
            </strong>
            <span className="text-[10px] text-slate-500 print:text-slate-600">Includes Manual JV credits</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300">
            <span className="text-slate-400 print:text-slate-600 block text-[11px]">Savings Deposits Balance</span>
            <strong className="block text-lg font-bold text-blue-400 print:text-black mt-1 font-mono">
              {money(report?.summary?.savings_balance)}
            </strong>
            <span className="text-[10px] text-slate-500 print:text-slate-600">Liquid Savings Available</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300">
            <span className="text-slate-400 print:text-slate-600 block text-[11px]">Outstanding Loan Balance</span>
            <strong className="block text-lg font-bold text-amber-400 print:text-black mt-1 font-mono">
              {money(report?.summary?.loan_balance)}
            </strong>
            <span className="text-[10px] text-slate-500 print:text-slate-600">Principal Due Balance</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300">
            <span className="text-slate-400 print:text-slate-600 block text-[11px]">Membership Fees Paid</span>
            <strong className="block text-lg font-bold text-teal-400 print:text-black mt-1 font-mono">
              {money(report?.summary?.membership_fees)}
            </strong>
            <span className="text-[10px] text-slate-500 print:text-slate-600">Recorded via JVs</span>
          </div>

          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 print:bg-slate-100 print:border-slate-300 col-span-2 md:col-span-1">
            <span className="text-slate-400 print:text-slate-600 block text-[11px]">Journal Vouchers (JV)</span>
            <strong className="block text-lg font-bold text-white print:text-black mt-1 font-mono">
              {report?.summary?.jv_count || jvCount} Vouchers
            </strong>
            <span className="text-[10px] text-emerald-400 print:text-emerald-700">Audit-Linked Entries</span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs print:text-[10px]">
            <thead className="bg-slate-950 text-slate-300 print:bg-slate-100 print:text-black uppercase text-[10px] font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3 w-8 print:hidden"></th>
                <th className="p-3">Posting Date</th>
                <th className="p-3">Transaction / Type</th>
                <th className="p-3">Voucher / Reference</th>
                <th className="p-3">Particulars & Linked General Ledger Accounts</th>
                <th className="p-3 text-right">Debit (₱)</th>
                <th className="p-3 text-right">Credit (₱)</th>
                <th className="p-3 text-right">Transaction Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              {filteredRows.map((row: any, rowIndex: number) => {
                const rowKey = `${row.id || row.transaction_id || row.reference || 'transaction'}-${rowIndex}`;
                const isExpanded = expandedJVs.has(rowKey);
                const isJV = row.is_jv || row.is_manual_jv || (row.lines && row.lines.length > 0);

                let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
                if (row.type?.includes('Membership & Share Capital')) {
                  badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-semibold';
                } else if (row.type?.includes('Share Capital')) {
                  badgeClass = 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-semibold';
                } else if (row.type?.includes('Membership Fee')) {
                  badgeClass = 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold';
                } else if (row.type?.includes('Manual JV') || row.type?.includes('Journal Voucher')) {
                  badgeClass = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-semibold';
                } else if (row.type?.includes('Savings')) {
                  badgeClass = 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-semibold';
                } else if (row.type?.includes('Loan payment')) {
                  badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold';
                } else if (row.type?.includes('Loan released')) {
                  badgeClass = 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold';
                }

                return (
                  <React.Fragment key={rowKey}>
                    <tr className={`hover:bg-slate-800/40 transition text-slate-300 print:text-black ${row.is_manual_jv ? 'bg-emerald-950/10' : ''}`}>
                      <td className="p-3 print:hidden">
                        {isJV ? (
                          <button
                            onClick={() => toggleExpand(rowKey)}
                            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white cursor-pointer transition"
                            title="Toggle ledger breakdown"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        ) : null}
                      </td>
                      <td className="p-3 whitespace-nowrap font-mono text-slate-400 print:text-slate-700">{row.date}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] border ${badgeClass}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-semibold text-emerald-400 print:text-black">
                        {row.reference || row.voucher_number || '—'}
                      </td>
                      <td className="p-3 max-w-md">
                        <span className="text-white print:text-black font-medium">{row.description}</span>
                        {row.accounts && (
                          <span className="block text-[11px] text-slate-400 print:text-slate-600 mt-0.5 font-mono">
                            {row.accounts}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-emerald-400 print:text-black">
                        {row.debit ? money(row.debit) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-blue-400 print:text-black">
                        {row.credit ? money(row.credit) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white print:text-black">
                        {money(row.amount)}
                      </td>
                    </tr>

                    {/* Detailed Journal Lines Breakdown if Expanded */}
                    {isExpanded && row.lines && row.lines.length > 0 && (
                      <tr className="bg-slate-950/70 border-b border-slate-800 print:bg-slate-50">
                        <td colSpan={8} className="p-4 pl-12">
                          <div className="space-y-2 border border-slate-800 rounded-lg p-3 bg-slate-900/50 print:bg-white print:border-slate-300">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              <span className="flex items-center space-x-1.5 text-emerald-400">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Double-Entry General Ledger Voucher Breakdown</span>
                              </span>
                              <span>Prepared By: {row.created_by || 'Chief Accountant'}</span>
                            </div>

                            <table className="w-full text-xs mt-2 text-slate-300 print:text-black">
                              <thead className="text-[10px] text-slate-500 uppercase border-b border-slate-800 print:border-slate-200">
                                <tr>
                                  <th className="py-1 text-left">Account Code</th>
                                  <th className="py-1 text-left">Account Name</th>
                                  <th className="py-1 text-left">Subsidiary Link</th>
                                  <th className="py-1 text-right">Debit (₱)</th>
                                  <th className="py-1 text-right">Credit (₱)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 print:divide-slate-200">
                                {row.lines.map((l: any, i: number) => (
                                  <tr key={i}>
                                    <td className="py-1 font-mono text-emerald-400 font-semibold">{l.account_code}</td>
                                    <td className="py-1">{l.account_name}</td>
                                    <td className="py-1 text-slate-400 text-[11px]">
                                      {l.subsidiary_type ? `${l.subsidiary_type}: ${l.subsidiary_id || 'This Member'}` : 'General'}
                                    </td>
                                    <td className="py-1 text-right font-mono text-emerald-400 font-medium">
                                      {l.debit > 0 ? money(l.debit) : '—'}
                                    </td>
                                    <td className="py-1 text-right font-mono text-blue-400 font-medium">
                                      {l.credit > 0 ? money(l.credit) : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No transactions matching the criteria were found for this member in the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-[10px] text-slate-500">
          Generated on {new Date().toLocaleString()} · Authoritative Member Subsidiary Ledger with Journal Vouchers and CDA Standard Accounts.
        </p>
      </div>

      {/* Manual JV Quick Creation Modal */}
      {showJvModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Post Manual JV for Member</h3>
                  <p className="text-xs text-slate-400">
                    {member?.first_name} {member?.last_name} ({member?.member_no})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJvModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Quick Transaction Presets:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('both')}
                  className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  ⚡ Juan paid Membership (₱500) & Share Capital (₱1,000)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('share_only')}
                  className="px-3 py-1.5 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Share Capital (CBU) Only (₱1,000)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('membership_only')}
                  className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Membership Fee Only (₱500)
                </button>
              </div>
            </div>

            {jvError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                {jvError}
              </div>
            )}
            {jvSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{jvSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePostQuickJV} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium">Posting Date</label>
                  <input
                    type="date"
                    required
                    value={jvDate}
                    onChange={e => setJvDate(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium">Branch Location</label>
                  <input
                    type="text"
                    disabled
                    value={member?.branch_name || 'Main Branch - Tarlac'}
                    className="w-full mt-1 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-medium">Transaction Particulars</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan paid membership and share capital"
                    value={jvDescription}
                    onChange={e => setJvDescription(e.target.value)}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {/* Journal Lines Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Journal Voucher Debit & Credit Entries
                </span>
                <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-950">
                  {jvLines.map((line, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs">
                      <div className="flex-1 font-mono text-slate-300">
                        {line.account_id === 'acc_1110' && '1110 - Cash on Hand - Tellers (Asset)'}
                        {line.account_id === 'acc_4210' && '4210 - Membership Fees Income (Revenue)'}
                        {line.account_id === 'acc_3110' && '3110 - Common Share Capital (Equity)'}
                        {!['acc_1110', 'acc_4210', 'acc_3110'].includes(line.account_id) && line.account_id}
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Debit"
                          value={line.debit || ''}
                          onChange={e => {
                            const copy = [...jvLines];
                            copy[idx].debit = parseFloat(e.target.value) || 0;
                            setJvLines(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white text-right font-mono"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Credit"
                          value={line.credit || ''}
                          onChange={e => {
                            const copy = [...jvLines];
                            copy[idx].credit = parseFloat(e.target.value) || 0;
                            setJvLines(copy);
                          }}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white text-right font-mono"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs mt-2">
                    <div>
                      Total Debit: <strong className="text-emerald-400 font-mono">₱{jvLines.reduce((s, l) => s + (Number(l.debit) || 0), 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      Total Credit: <strong className="text-blue-400 font-mono">₱{jvLines.reduce((s, l) => s + (Number(l.credit) || 0), 0).toFixed(2)}</strong>
                    </div>
                    <div>
                      Status: <strong className={Math.abs(jvLines.reduce((s, l) => s + (Number(l.debit) || 0), 0) - jvLines.reduce((s, l) => s + (Number(l.credit) || 0), 0)) < 0.01 ? 'text-emerald-400' : 'text-rose-400'}>
                        {Math.abs(jvLines.reduce((s, l) => s + (Number(l.debit) || 0), 0) - jvLines.reduce((s, l) => s + (Number(l.credit) || 0), 0)) < 0.01 ? 'BALANCED' : 'UNBALANCED'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowJvModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingJv}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  {postingJv ? 'Posting...' : 'Post Journal Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #member-report-print, #member-report-print * { visibility: visible !important; }
          #member-report-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page { size: landscape; margin: 12mm; }
        }
      `}</style>
    </section>
  );
};
