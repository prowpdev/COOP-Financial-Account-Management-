import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Plus, X, AlertCircle, CheckCircle2, Calendar, FileSpreadsheet, LayoutGrid, Layers, Building2, FileText } from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { AccountLedgerReport } from '../reports/AccountLedgerReport';
import { api } from '../../services/api';
import { Account, Branch, JournalEntry, User } from '../../types';

interface AccountingModuleProps {
  accounts: Account[];
  branches: Branch[];
  currentUser: User;
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
}

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  accounts,
  branches,
  currentUser,
  selectedBranchId,
  onSelectBranch
}) => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingJV, setIsCreatingJV] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'vouchers' | 'ledger' | 'cards' | 'account_report'>('vouchers');

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

  const [jvForm, setJvForm] = useState({
    posting_date: new Date().toISOString().split('T')[0],
    branch_id: selectedBranch !== 'all' ? selectedBranch : (branches[0]?.id || 'branch_tar'),
    description: '',
    lines: [
      { account_id: 'acc_5110', debit: 1500, credit: 0 }, // Salaries
      { account_id: 'acc_1110', debit: 0, credit: 1500 }  // Cash
    ]
  });

  const loadJournals = async () => {
    setIsLoading(true);
    try {
      const res = await api.getJournals();
      setJournals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
    window.addEventListener('coop:data-changed', loadJournals);
    return () => window.removeEventListener('coop:data-changed', loadJournals);
  }, []);

  // Columns for Journal Vouchers Table
  const voucherCols: ExcelColumn<JournalEntry>[] = [
    {
      key: 'voucher_number',
      header: 'Voucher No.',
      width: '140px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      key: 'branch_id',
      header: 'Branch',
      width: '160px',
      type: 'text',
      sortable: true,
      render: (val) => branches.find(b => b.id === val)?.name || 'Main Branch'
    },
    { key: 'posting_date', header: 'Posting Date', width: '120px', type: 'date', align: 'center', sortable: true },
    {
      key: 'reference_type',
      header: 'Source / Type',
      width: '130px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    { key: 'description', header: 'Particulars & Description', width: '280px', type: 'text', sortable: true },
    { key: 'total_debit', header: 'Total Debit (₱)', width: '150px', type: 'currency', align: 'right', sortable: true },
    { key: 'total_credit', header: 'Total Credit (₱)', width: '150px', type: 'currency', align: 'right', sortable: true },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    { key: 'created_by', header: 'Prepared By', width: '140px', type: 'text', sortable: true },
    {
      key: 'posted_at',
      header: 'Posted Timestamp',
      width: '170px',
      type: 'date',
      sortable: true,
      render: (val) => <span className="text-slate-400">{new Date(val).toLocaleString()}</span>
    }
  ];

  const filteredJournals = useMemo(() => {
    if (selectedBranch === 'all') return journals;
    return journals.filter(j => j.branch_id === selectedBranch);
  }, [journals, selectedBranch]);

  // Flattened General Ledger Line Items
  const flattenedLedgerLines = useMemo(() => {
    const lines: any[] = [];
    filteredJournals.forEach(j => {
      (j.lines || []).forEach((l, idx) => {
        lines.push({
          id: `${j.id}_${l.id || idx}`,
          voucher_number: j.voucher_number,
          posting_date: j.posting_date,
          reference_type: j.reference_type,
          voucher_desc: j.description,
          account_code: l.account_code,
          account_name: l.account_name,
          debit: l.debit,
          credit: l.credit,
          created_by: j.created_by,
          branch_name: branches.find(b => b.id === j.branch_id)?.name || 'Main Branch'
        });
      });
    });
    return lines;
  }, [filteredJournals, branches]);

  const ledgerCols: ExcelColumn<any>[] = [
    {
      key: 'voucher_number',
      header: 'Voucher No.',
      width: '130px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    { key: 'posting_date', header: 'Date', width: '110px', type: 'date', align: 'center', sortable: true },
    {
      key: 'account_code',
      header: 'Account Code',
      width: '120px',
      type: 'text',
      align: 'center',
      sortable: true,
      render: (val) => <span className="font-mono font-bold text-emerald-400">{val}</span>
    },
    { key: 'account_name', header: 'Account Title', width: '220px', type: 'text', sortable: true },
    { key: 'voucher_desc', header: 'Transaction Particulars', width: '260px', type: 'text', sortable: true },
    { key: 'debit', header: 'Debit (₱)', width: '140px', type: 'currency', align: 'right', sortable: true },
    { key: 'credit', header: 'Credit (₱)', width: '140px', type: 'currency', align: 'right', sortable: true },
    {
      key: 'reference_type',
      header: 'Module Source',
      width: '130px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  ];

  const handleAddLine = () => {
    setJvForm(prev => ({
      ...prev,
      lines: [...prev.lines, { account_id: accounts[0]?.id || 'acc_1110', debit: 0, credit: 0 }]
    }));
  };

  const handleRemoveLine = (index: number) => {
    if (jvForm.lines.length <= 2) {
      alert('A journal voucher must have at least 2 lines.');
      return;
    }
    setJvForm(prev => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index)
    }));
  };

  const totalDebit = jvForm.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = jvForm.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handlePostJV = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!isBalanced) {
      setErrorMsg(`Debit (₱${totalDebit}) must equal Credit (₱${totalCredit}).`);
      return;
    }

    try {
      const res = await api.createManualJournal({
        ...jvForm,
        performed_by: currentUser.name
      });
      setIsCreatingJV(false);
      setSuccessMsg(`Journal Voucher ${res.data.voucher_number} posted successfully.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      loadJournals();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const formatMoney = (val: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val || 0);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>General Ledger</span>
            <span>•</span>
            <span className="text-slate-400">Balanced Double-Entry Enforced</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            General Accounting & Journal Entries
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative general ledger vouchers. Operational modules post here automatically per configured mapping rules.
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

          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setViewMode('vouchers')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'vouchers'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Journal Vouchers</span>
            </button>
            <button
              onClick={() => setViewMode('ledger')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>General Ledger</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Voucher Cards</span>
            </button>
            <button
              onClick={() => setViewMode('account_report')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'account_report' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Account Report</span>
            </button>
          </div>

          <button
            id="btn-new-jv"
            onClick={() => {
              setErrorMsg(null);
              setJvForm(prev => ({
                ...prev,
                branch_id: selectedBranch !== 'all' ? selectedBranch : (branches[0]?.id || 'branch_tar')
              }));
              setIsCreatingJV(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal Voucher</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {/* Manual Journal Modal */}
      {isCreatingJV && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Create Balanced Journal Voucher</h3>
                <p className="text-xs text-slate-400">Posting into closed accounting periods is strictly blocked (Req #29).</p>
              </div>
              <button onClick={() => setIsCreatingJV(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-950/80 border border-rose-500/50 text-rose-300 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePostJV} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Posting Date</label>
                  <input
                    type="date"
                    required
                    value={jvForm.posting_date}
                    onChange={e => setJvForm({ ...jvForm, posting_date: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Tested against accounting period status.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Branch Location</label>
                  <select
                    value={jvForm.branch_id}
                    onChange={e => setJvForm({ ...jvForm, branch_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 font-medium">Transaction Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Office rent and internet utilities allocation"
                    value={jvForm.description}
                    onChange={e => setJvForm({ ...jvForm, description: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Journal Lines Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Journal Lines</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                  >
                    + Add Debit / Credit Entry Line
                  </button>
                </div>

                <div className="space-y-2">
                  {jvForm.lines.map((line, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                      <select
                        value={line.account_id}
                        onChange={e => {
                          const copy = [...jvForm.lines];
                          copy[idx].account_id = e.target.value;
                          setJvForm({ ...jvForm, lines: copy });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white cursor-pointer"
                      >
                        {accounts.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.code} - {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Debit"
                        value={line.debit || ''}
                        onChange={e => {
                          const copy = [...jvForm.lines];
                          copy[idx].debit = parseFloat(e.target.value) || 0;
                          setJvForm({ ...jvForm, lines: copy });
                        }}
                        className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white text-right"
                      />
                      <input
                        type="number"
                        placeholder="Credit"
                        value={line.credit || ''}
                        onChange={e => {
                          const copy = [...jvForm.lines];
                          copy[idx].credit = parseFloat(e.target.value) || 0;
                          setJvForm({ ...jvForm, lines: copy });
                        }}
                        className="w-28 bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white text-right"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Balances summary */}
                <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  <div>
                    Total Debit: <strong className="text-white">₱{totalDebit.toLocaleString()}</strong>
                  </div>
                  <div>
                    Total Credit: <strong className="text-white">₱{totalCredit.toLocaleString()}</strong>
                  </div>
                  <div>
                    Status:{' '}
                    <strong className={isBalanced ? 'text-emerald-400' : 'text-rose-400'}>
                      {isBalanced ? 'BALANCED' : 'UNBALANCED'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingJV(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-post-journal-voucher"
                  type="submit"
                  disabled={!isBalanced}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  Post Journal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main View Area: Vouchers Grid vs Ledger Grid vs Cards */}
      {viewMode === 'vouchers' && (
        <ExcelGridTable
          title="General Journal Voucher Grid"
          subtitle="Interactive spreadsheet grid of all posted journal vouchers. Easily filter by source module, sort by posting date, and export to Excel."
          exportFileName="general_journal_vouchers"
          data={filteredJournals}
          columns={voucherCols}
          defaultSortKey="voucher_number"
        />
      )}

      {viewMode === 'ledger' && (
        <ExcelGridTable
          title="General Ledger Detailed Transaction Journal"
          subtitle="Comprehensive, itemized ledger entries across all cooperative accounts and branches with instant searching and formula summing."
          exportFileName="general_ledger_detailed_journal"
          data={flattenedLedgerLines}
          columns={ledgerCols}
          defaultSortKey="posting_date"
        />
      )}

      {viewMode === 'cards' && (
        <div className="space-y-4">
          {filteredJournals.map(j => (
            <div key={j.id} className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-sm text-emerald-400">{j.voucher_number}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                    {j.reference_type}
                  </span>
                  <span className="text-xs text-slate-400">{j.posting_date}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-white">
                    {formatMoney(j.total_debit)}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                    {j.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300">{j.description}</p>

              {/* Lines preview */}
              <div className="overflow-x-auto border-t border-slate-800/80 pt-2">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[10px] text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-1 px-2">Account</th>
                      <th className="py-1 px-2 text-right">Debit</th>
                      <th className="py-1 px-2 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {j.lines?.map(l => (
                      <tr key={l.id}>
                        <td className="py-1 px-2">
                          <span className="font-mono text-slate-400 mr-2">{l.account_code}</span>
                          <span className="text-slate-200">{l.account_name}</span>
                        </td>
                        <td className="py-1 px-2 text-right text-emerald-400 font-medium">
                          {l.debit > 0 ? formatMoney(l.debit) : '-'}
                        </td>
                        <td className="py-1 px-2 text-right text-blue-400 font-medium">
                          {l.credit > 0 ? formatMoney(l.credit) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                <span>Prepared by: {j.created_by}</span>
                <span>Posted at: {new Date(j.posted_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'account_report' && (
        <AccountLedgerReport
          accounts={accounts}
          journals={journals}
          branches={branches}
          selectedBranch={selectedBranch}
        />
      )}
    </div>
  );
};
