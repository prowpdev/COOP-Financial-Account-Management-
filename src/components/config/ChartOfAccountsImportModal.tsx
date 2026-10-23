import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  Check,
  AlertCircle,
  Download,
  Info,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Layers,
  ArrowRight,
  Sliders,
  Filter
} from 'lucide-react';
import { Account, User } from '../../types';
import { api } from '../../services/api';

export interface ChartOfAccountsImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  currentUser: User;
  onImportSuccess: (result: { count: number; inserted: number; updated: number }) => void;
}

interface ParsedAccountRow {
  rowNumber: number;
  account_code: string;
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  report_group: string;
  normal_balance: 'Debit' | 'Credit';
  parent_account_code: string;
  description: string;
  is_active: boolean;
  isExisting: boolean;
  isValid: boolean;
  error?: string;
  raw: Record<string, string>;
}

// Sample CDA Standard Chart of Accounts template data
const SAMPLE_COA_CSV_ROWS = [
  ['account_code', 'name', 'category', 'report_group', 'normal_balance', 'parent_account_code', 'description', 'is_active'],
  ['1100', 'Cash and Cash Equivalents', 'Asset', 'Current Assets', 'Debit', '', 'Control account for all liquid funds and bank repositories', '1'],
  ['1110', 'Cash on Hand - Tellers', 'Asset', 'Current Assets', 'Debit', '1100', 'Petty cash and daily cashier vault drawers', '1'],
  ['1120', 'Cash in Bank - Land Bank of the Philippines', 'Asset', 'Current Assets', 'Debit', '1100', 'LBP primary operating clearing depository', '1'],
  ['1200', 'Loans Receivable - Control', 'Asset', 'Loans and Receivables', 'Debit', '', 'Aggregate control account for all active member loan facilities', '1'],
  ['1210', 'Loans Receivable - Regular Multi-Purpose', 'Asset', 'Loans and Receivables', 'Debit', '1200', 'Principal balance of outstanding member multi-purpose loans', '1'],
  ['1220', 'Loans Receivable - Emergency Micro-Loans', 'Asset', 'Loans and Receivables', 'Debit', '1200', 'Emergency calamity and express medical credit lines', '1'],
  ['1290', 'Allowance for Probable Loan Losses', 'Asset', 'Contra-Asset', 'Credit', '1200', 'Provision for PAR and non-performing loan impairments', '1'],
  ['2100', 'Deposit Liabilities - Control', 'Liability', 'Deposit Liabilities', 'Credit', '', 'Control account for all member demand and term deposit liabilities', '1'],
  ['2110', 'Savings Deposits - Regular', 'Liability', 'Deposit Liabilities', 'Credit', '2100', 'Withdrawable member deposit savings balances', '1'],
  ['3100', 'Members Equity & Share Capital - Control', 'Equity', 'Share Capital', 'Credit', '', 'Summary control account for subscribed and paid-up share capital', '1'],
  ['3110', 'Paid-Up Share Capital - Common (Voting)', 'Equity', 'Share Capital', 'Credit', '3100', 'Member common share capital subscribed and paid', '1'],
  ['3210', 'Statutory Reserve Fund (General)', 'Equity', 'Statutory Reserves', 'Credit', '', 'Mandatory 10% statutory reserve mandated by CDA', '1'],
  ['4110', 'Interest Income from Regular Loans', 'Revenue', 'Operating Revenue', 'Credit', '', 'Interest realized and earned on member loan amortizations', '1'],
  ['4210', 'Service and Processing Fees Income', 'Revenue', 'Operating Revenue', 'Credit', '', 'Service fees, loan processing, and filing charges', '1'],
  ['5110', 'Salaries and Wages - Office Staff', 'Expense', 'Administrative Expenses', 'Debit', '', 'Compensation and basic pay for cooperative branch personnel', '1'],
  ['5210', 'Office Supplies and Printing Expenses', 'Expense', 'Administrative Expenses', 'Debit', '', 'Forms, official receipts, stationery, and toner', '1']
];

export const ChartOfAccountsImportModal: React.FC<ChartOfAccountsImportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  currentUser,
  onImportSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [showPasteText, setShowPasteText] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<'upsert' | 'insert'>('upsert');
  const [filterPreviewStatus, setFilterPreviewStatus] = useState<'all' | 'new' | 'update' | 'error'>('all');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ count: number; inserted: number; updated: number; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map existing accounts for quick lookup by code
  const existingAccountsMap = useMemo(() => {
    const map = new Map<string, Account>();
    accounts.forEach(a => {
      const code = String(a.account_code || a.code || '').trim();
      if (code) map.set(code.toLowerCase(), a);
    });
    return map;
  }, [accounts]);

  // Robust CSV Parser
  const parseCsvIntoRows = (text: string): ParsedAccountRow[] => {
    if (!text || !text.trim()) return [];

    // Parse CSV lines respecting quotes
    const lines: string[] = [];
    let curLine = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (ch === '"') {
        if (inQuotes && text[i + 1] === '"') {
          curLine += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        if (curLine.trim()) lines.push(curLine);
        curLine = '';
      } else {
        curLine += ch;
      }
    }
    if (curLine.trim()) lines.push(curLine);

    if (lines.length < 2) return [];

    // Parse a line into cells
    const parseCells = (line: string): string[] => {
      const cells: string[] = [];
      let cell = '';
      let inside = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (inside && line[i + 1] === '"') {
            cell += '"';
            i++;
          } else {
            inside = !inside;
          }
        } else if (c === ',' && !inside) {
          cells.push(cell.trim());
          cell = '';
        } else {
          cell += c;
        }
      }
      cells.push(cell.trim());
      return cells;
    };

    const rawHeaders = parseCells(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase().replace(/[\s_-]+/g, '_'));

    const normalizeCat = (raw: string): 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense' => {
      const s = raw.toLowerCase().trim();
      if (s.startsWith('asset')) return 'Asset';
      if (s.startsWith('liab')) return 'Liability';
      if (s.startsWith('equit')) return 'Equity';
      if (s.startsWith('rev') || s.startsWith('incom')) return 'Revenue';
      if (s.startsWith('exp')) return 'Expense';
      return 'Asset';
    };

    const normalizeBal = (raw: string, cat: string): 'Debit' | 'Credit' => {
      const s = raw.toLowerCase().trim();
      if (s.startsWith('d') || s === 'dr') return 'Debit';
      if (s.startsWith('c') || s === 'cr') return 'Credit';
      return (cat === 'Asset' || cat === 'Expense') ? 'Debit' : 'Credit';
    };

    const defaultReportGroup = (cat: string): string => {
      switch (cat) {
        case 'Asset': return 'Current Assets';
        case 'Liability': return 'Deposit Liabilities';
        case 'Equity': return 'Share Capital';
        case 'Revenue': return 'Operating Revenue';
        case 'Expense': return 'Administrative Expenses';
        default: return 'Operating';
      }
    };

    const parsed: ParsedAccountRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = parseCells(lines[i]);
      if (cells.every(c => !c)) continue; // skip blank line

      const rowMap: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowMap[h] = cells[idx] !== undefined ? cells[idx] : '';
      });

      // Extract code
      const code = String(
        rowMap.account_code || rowMap.code || rowMap.account_no || rowMap.gl_code || rowMap.account_number || ''
      ).trim();

      // Extract name
      const name = String(
        rowMap.name || rowMap.account_name || rowMap.title || rowMap.account_title || ''
      ).trim();

      const rawCat = rowMap.category || rowMap.type || rowMap.account_category || rowMap.account_type || rowMap.class || '';
      const category = normalizeCat(rawCat);

      const rawBal = rowMap.normal_balance || rowMap.balance_type || rowMap.balance || rowMap.dr_cr || '';
      const normal_balance = normalizeBal(rawBal, category);

      const report_group = String(
        rowMap.report_group || rowMap.group || rowMap.statement_group || rowMap.sub_category || defaultReportGroup(category)
      ).trim() || defaultReportGroup(category);

      const parent_account_code = String(
        rowMap.parent_account_code || rowMap.parent_code || rowMap.parent_account_id || rowMap.parent_id || rowMap.parent_account || rowMap.parent || ''
      ).trim();

      const description = String(
        rowMap.description || rowMap.desc || rowMap.notes || rowMap.remarks || rowMap.memo || ''
      ).trim();

      let is_active = true;
      const rawActive = rowMap.is_active !== undefined ? rowMap.is_active : (rowMap.active !== undefined ? rowMap.active : rowMap.status);
      if (rawActive !== undefined && rawActive !== '') {
        const s = String(rawActive).toLowerCase().trim();
        is_active = !['0', 'false', 'inactive', 'no', 'n', 'disabled'].includes(s);
      }

      const isExisting = Boolean(code && existingAccountsMap.has(code.toLowerCase()));

      let isValid = true;
      let error = '';

      if (!code) {
        isValid = false;
        error = 'Missing account code';
      } else if (!name) {
        isValid = false;
        error = 'Missing account title / name';
      }

      parsed.push({
        rowNumber: i + 1,
        account_code: code,
        name,
        category,
        report_group,
        normal_balance,
        parent_account_code,
        description,
        is_active,
        isExisting,
        isValid,
        error,
        raw: rowMap
      });
    }

    return parsed;
  };

  // Parsed rows computed from active input (file text or pasted text)
  const parsedRows = useMemo(() => {
    return parseCsvIntoRows(csvRawText);
  }, [csvRawText, existingAccountsMap]);

  // Statistics
  const stats = useMemo(() => {
    const total = parsedRows.length;
    const valid = parsedRows.filter(r => r.isValid).length;
    const invalid = parsedRows.filter(r => !r.isValid).length;
    const existing = parsedRows.filter(r => r.isValid && r.isExisting).length;
    const newItems = parsedRows.filter(r => r.isValid && !r.isExisting).length;
    return { total, valid, invalid, existing, newItems };
  }, [parsedRows]);

  // Filtered rows for preview table
  const previewRows = useMemo(() => {
    if (filterPreviewStatus === 'new') return parsedRows.filter(r => r.isValid && !r.isExisting);
    if (filterPreviewStatus === 'update') return parsedRows.filter(r => r.isValid && r.isExisting);
    if (filterPreviewStatus === 'error') return parsedRows.filter(r => !r.isValid);
    return parsedRows;
  }, [parsedRows, filterPreviewStatus]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const processFile = (f: File) => {
    setFile(f);
    setSubmitError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvRawText(content || '');
    };
    reader.onerror = () => {
      setSubmitError('Failed to read the selected CSV file.');
    };
    reader.readAsText(f);
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && (dropped.name.endsWith('.csv') || dropped.type.includes('csv') || dropped.type.includes('text'))) {
      processFile(dropped);
    } else {
      setSubmitError('Please upload a valid .csv file.');
    }
  };

  // Download Sample Template CSV
  const handleDownloadTemplate = () => {
    const csvContent = SAMPLE_COA_CSV_ROWS.map(row =>
      row.map(cell => {
        if (cell.includes(',') || cell.includes('"')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    ).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cda_chart_of_accounts_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset form
  const handleReset = () => {
    setFile(null);
    setCsvRawText('');
    setSubmitError(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Execute import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setSubmitError('No valid accounts found to import.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payloadAccounts = validRows.map(r => ({
        account_code: r.account_code,
        code: r.account_code,
        name: r.name,
        category: r.category,
        report_group: r.report_group,
        normal_balance: r.normal_balance,
        parent_account_code: r.parent_account_code || null,
        description: r.description || null,
        is_active: r.is_active
      }));

      const res = await api.importChartOfAccountsCsv({
        accounts: payloadAccounts,
        mode: importMode,
        performed_by: currentUser.name || 'Accountant'
      });

      if (res && res.success) {
        setImportResult({
          count: res.count,
          inserted: res.inserted,
          updated: res.updated,
          message: res.message || `Successfully imported ${res.count} accounts.`
        });
        onImportSuccess({
          count: res.count,
          inserted: res.inserted,
          updated: res.updated
        });
      } else {
        setSubmitError(res?.message || 'Failed to import chart of accounts.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred during import.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Import Chart of Accounts</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-semibold uppercase">
                  CSV Batch Mode
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload or paste CSV with CDA standard GL codes, account classifications, and parent hierarchies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Success Banner */}
          {importResult ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Import Completed Successfully!</h3>
                <p className="text-sm text-slate-300 mt-1">{importResult.message}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Processed</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{importResult.count}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">New Created</span>
                  <span className="text-lg font-bold text-blue-400 font-mono">{importResult.inserted}</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Updated</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">{importResult.updated}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  Import Another File
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/40 transition cursor-pointer"
                >
                  Done & Return to COA
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Informative Guidance & Template Download Box */}
              <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <BookOpen className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 space-y-1">
                    <span className="font-bold text-white block">CDA Standard Chart of Accounts Format</span>
                    <p className="text-slate-400 leading-relaxed">
                      Columns recognized: <code className="text-emerald-300 font-mono">account_code</code>, <code className="text-emerald-300 font-mono">name</code>, <code className="text-emerald-300 font-mono">category</code> (Asset, Liability, Equity, Revenue, Expense), <code className="text-emerald-300 font-mono">normal_balance</code> (Debit/Credit), <code className="text-emerald-300 font-mono">report_group</code>, <code className="text-emerald-300 font-mono">parent_account_code</code>, <code className="text-emerald-300 font-mono">description</code>, <code className="text-emerald-300 font-mono">is_active</code>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center space-x-2 px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sample Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {!parsedRows.length && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center transition ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-slate-700 hover:border-slate-600 bg-slate-900/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".csv,text/csv,text/plain"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-emerald-400 mb-3 border border-slate-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">
                    Drop your Chart of Accounts CSV file here
                  </h3>
                  <p className="text-xs text-slate-400 mb-4 max-w-sm mx-auto">
                    Upload an export from another accounting system or CDA template. We will validate codes and hierarchy before saving.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/40 transition cursor-pointer"
                    >
                      Browse Computer (.csv)
                    </button>
                    <button
                      onClick={() => setShowPasteText(!showPasteText)}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
                    >
                      {showPasteText ? 'Hide Text Area' : 'Paste CSV Text'}
                    </button>
                  </div>
                </div>
              )}

              {/* Paste Text Area (Collapsible) */}
              {showPasteText && !parsedRows.length && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Paste raw CSV rows (including header):</span>
                    <span className="text-[10px] text-slate-500">Comma-separated</span>
                  </label>
                  <textarea
                    rows={6}
                    value={csvRawText}
                    onChange={(e) => setCsvRawText(e.target.value)}
                    placeholder="account_code,name,category,report_group,normal_balance,parent_account_code&#10;1110,Cash on Hand - Tellers,Asset,Current Assets,Debit,1100&#10;1120,Cash in Bank - Land Bank,Asset,Current Assets,Debit,1100"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Preview & Validation Results Section */}
              {parsedRows.length > 0 && (
                <div className="space-y-4">
                  
                  {/* File summary bar & action strip */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    <div className="flex items-center space-x-2.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-xs font-bold text-white block">
                          {file ? file.name : 'Pasted CSV Data'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {parsedRows.length} rows loaded & parsed
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleReset}
                        className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Counters */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Rows</span>
                      <span className="text-base font-bold text-white font-mono">{stats.total}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-blue-400 block">New Accounts</span>
                      <span className="text-base font-bold text-blue-400 font-mono">{stats.newItems}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">Updates</span>
                      <span className="text-base font-bold text-amber-400 font-mono">{stats.existing}</span>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                      <span className="text-[10px] uppercase font-bold text-rose-400 block">Errors</span>
                      <span className="text-base font-bold text-rose-400 font-mono">{stats.invalid}</span>
                    </div>
                  </div>

                  {/* Import Configuration Controls */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Import Behavior Mode</span>
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Choose how to handle accounts that already exist in your Chart of Accounts.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                        <button
                          type="button"
                          onClick={() => setImportMode('upsert')}
                          className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            importMode === 'upsert'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Upsert (Add & Update)
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportMode('insert')}
                          className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            importMode === 'insert'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Insert Only (Skip Existing)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preview Table Header & Filter Tabs */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setFilterPreviewStatus('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          filterPreviewStatus === 'all'
                            ? 'bg-slate-800 text-white font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        All ({stats.total})
                      </button>
                      <button
                        onClick={() => setFilterPreviewStatus('new')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          filterPreviewStatus === 'new'
                            ? 'bg-blue-500/20 text-blue-300 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        New ({stats.newItems})
                      </button>
                      <button
                        onClick={() => setFilterPreviewStatus('update')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          filterPreviewStatus === 'update'
                            ? 'bg-amber-500/20 text-amber-300 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Updates ({stats.existing})
                      </button>
                      {stats.invalid > 0 && (
                        <button
                          onClick={() => setFilterPreviewStatus('error')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                            filterPreviewStatus === 'error'
                              ? 'bg-rose-500/20 text-rose-300 font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Errors ({stats.invalid})
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Showing {previewRows.length} rows
                    </span>
                  </div>

                  {/* Interactive Preview Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800 max-h-64">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 sticky top-0 z-10">
                        <tr>
                          <th className="py-2 px-2.5">Row</th>
                          <th className="py-2 px-2.5">Status</th>
                          <th className="py-2 px-2.5">Code</th>
                          <th className="py-2 px-2.5">Account Title</th>
                          <th className="py-2 px-2.5">Category</th>
                          <th className="py-2 px-2.5">Balance</th>
                          <th className="py-2 px-2.5">Report Group</th>
                          <th className="py-2 px-2.5">Parent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                        {previewRows.slice(0, 50).map((row) => (
                          <tr key={row.rowNumber} className="hover:bg-slate-800/40 transition">
                            <td className="py-2 px-2.5 text-slate-500">{row.rowNumber}</td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              {!row.isValid ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  {row.error || 'Invalid'}
                                </span>
                              ) : row.isExisting ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Update Existing
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  New Account
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2.5 font-bold text-emerald-400">{row.account_code || '—'}</td>
                            <td className="py-2 px-2.5 font-sans font-medium text-white max-w-[200px] truncate" title={row.name}>
                              {row.name || '—'}
                            </td>
                            <td className="py-2 px-2.5 whitespace-nowrap">
                              <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                row.category === 'Asset' ? 'text-blue-400 bg-blue-500/10' :
                                row.category === 'Liability' ? 'text-amber-400 bg-amber-500/10' :
                                row.category === 'Equity' ? 'text-purple-400 bg-purple-500/10' :
                                row.category === 'Revenue' ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'
                              }`}>
                                {row.category}
                              </span>
                            </td>
                            <td className="py-2 px-2.5 text-slate-300">{row.normal_balance}</td>
                            <td className="py-2 px-2.5 font-sans text-slate-400 truncate max-w-[140px]">{row.report_group}</td>
                            <td className="py-2 px-2.5 text-slate-400">{row.parent_account_code || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {previewRows.length > 50 && (
                    <p className="text-[11px] text-slate-500 text-center font-mono">
                      Showing first 50 rows of {previewRows.length}. All valid rows will be imported.
                    </p>
                  )}
                </div>
              )}

              {/* Error Alert */}
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!importResult && (
          <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between bg-slate-900/90">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>

            {parsedRows.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  Ready to process <strong>{stats.valid}</strong> account{stats.valid === 1 ? '' : 's'}
                </span>
                <button
                  onClick={handleExecuteImport}
                  disabled={isSubmitting || stats.valid === 0}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Importing Accounts...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Import {stats.valid} Account{stats.valid === 1 ? '' : 's'}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
