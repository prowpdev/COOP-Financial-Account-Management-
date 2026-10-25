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
  HelpCircle,
  Layers,
  ArrowRight,
  Sliders,
  Filter,
  CreditCard
} from 'lucide-react';
import { LoanProduct, User, Account } from '../../types';
import { api } from '../../services/api';

export interface LoanProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: LoanProduct[];
  accounts?: Account[];
  currentUser: User;
  onImportSuccess: (result: { count: number; inserted: number; updated: number }) => void;
}

interface ParsedLoanProductRow {
  rowNumber: number;
  code: string;
  name: string;
  description: string;
  min_amount: number;
  max_amount: number;
  min_term_months: number;
  max_term_months: number;
  default_term_months: number;
  annual_interest_rate: number;
  interest_calculation_method: string;
  payment_frequency: string;
  grace_period_days: number;
  processing_fee_percentage: number;
  service_fee_fixed: number;
  other_fee: number;
  penalty_rate_percentage: number;
  collateral_required: boolean;
  guarantor_required: boolean;
  required_documents: string[];
  gl_receivable_account_id: string;
  gl_interest_income_account_id: string;
  effective_from: string;
  effective_until: string | null;
  active: boolean;
  isExisting: boolean;
  isValid: boolean;
  error?: string;
  raw: Record<string, string>;
}

// Sample CDA Standard Loan Products Template
const SAMPLE_LOAN_PRODUCT_ROWS = [
  [
    'code',
    'name',
    'description',
    'min_amount',
    'max_amount',
    'min_term_months',
    'max_term_months',
    'default_term_months',
    'annual_interest_rate',
    'interest_calculation_method',
    'payment_frequency',
    'grace_period_days',
    'processing_fee_percentage',
    'service_fee_fixed',
    'other_fee',
    'penalty_rate_percentage',
    'collateral_required',
    'guarantor_required',
    'required_documents',
    'gl_receivable_account_id',
    'gl_interest_income_account_id',
    'effective_from',
    'effective_until',
    'active'
  ],
  [
    'LP-AGRI-01',
    'Agricultural Crop Production Loan',
    'Seasonal credit for rice and corn seed inputs and fertilizer',
    '10000',
    '300000',
    '3',
    '12',
    '6',
    '6.0',
    'Diminishing Balance',
    'Monthly',
    '0',
    '1.5',
    '250',
    '0',
    '2.0',
    '1',
    '1',
    'Valid Government ID; Land Ownership/Tenancy Proof',
    'acc_1210',
    'acc_4110',
    '2026-01-01',
    '',
    '1'
  ],
  [
    'LP-EMERG-02',
    'Emergency Calamity & Medical Microloan',
    'Quick-disbursing assistance for medical emergencies and storms',
    '2000',
    '30000',
    '1',
    '6',
    '3',
    '4.5',
    'Flat Rate',
    'Semi-monthly',
    '0',
    '0',
    '100',
    '0',
    '1.5',
    '0',
    '0',
    'Valid Government ID; Medical Certificate/Barangay Certificate',
    'acc_1210',
    'acc_4110',
    '2026-01-01',
    '',
    '1'
  ],
  [
    'LP-MSME-03',
    'Small Enterprise Commercial Loan',
    'Working capital and inventory expansion for member sari-sari stores',
    '25000',
    '500000',
    '6',
    '36',
    '12',
    '8.0',
    'Diminishing Balance',
    'Monthly',
    '15',
    '2.0',
    '500',
    '100',
    '2.5',
    '1',
    '1',
    'Valid Government ID; DTI/Barangay Business Permit; Financial Records',
    'acc_1210',
    'acc_4110',
    '2026-01-01',
    '',
    '1'
  ],
  [
    'LP-SALARY-04',
    'Regular Member Salary Loan',
    'Institutional payroll-backed loan with monthly amortization deductions',
    '5000',
    '200000',
    '3',
    '24',
    '12',
    '6.5',
    'Equal Amortization',
    'Monthly',
    '0',
    '1.0',
    '150',
    '0',
    '2.0',
    '0',
    '1',
    'Valid Government ID; 3 Months Payslip; Certificate of Employment',
    'acc_1210',
    'acc_4110',
    '2026-01-01',
    '',
    '1'
  ],
  [
    'LP-EDUC-05',
    'Educational Assistance Loan',
    'Low-rate tuition fee financing for member dependents',
    '5000',
    '50000',
    '3',
    '10',
    '5',
    '5.0',
    'Equal Amortization',
    'Monthly',
    '0',
    '0.5',
    '100',
    '0',
    '1.0',
    '0',
    '0',
    'Valid Government ID; School Assessment / Registration Form',
    'acc_1210',
    'acc_4110',
    '2026-01-01',
    '',
    '1'
  ]
];

export const LoanProductImportModal: React.FC<LoanProductImportModalProps> = ({
  isOpen,
  onClose,
  products,
  accounts = [],
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

  // Map existing products for quick lookup by code
  const existingProductsMap = useMemo(() => {
    const map = new Map<string, LoanProduct>();
    products.forEach(p => {
      const code = String(p.code || '').trim().toLowerCase();
      if (code) map.set(code, p);
    });
    return map;
  }, [products]);

  // Robust CSV Parser respecting quotes
  const parseCsvIntoRows = (text: string): ParsedLoanProductRow[] => {
    if (!text || !text.trim()) return [];

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

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let quotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          if (quotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            quotes = !quotes;
          }
        } else if (c === ',' && !quotes) {
          result.push(cur.trim());
          cur = '';
        } else {
          cur += c;
        }
      }
      result.push(cur.trim());
      return result;
    };

    // Header extraction & normalization
    const rawHeaders = parseLine(lines[0]);
    const normalizedHeaders = rawHeaders.map(h =>
      h.toLowerCase().trim().replace(/[\s\-_]+/g, '_')
    );

    const getCol = (cells: string[], colAliases: string[]): string => {
      for (const alias of colAliases) {
        const idx = normalizedHeaders.indexOf(alias);
        if (idx !== -1 && cells[idx] !== undefined) {
          return cells[idx].trim();
        }
      }
      return '';
    };

    const parsed: ParsedLoanProductRow[] = [];

    for (let idx = 1; idx < lines.length; idx++) {
      const lineStr = lines[idx].trim();
      if (!lineStr) continue;

      const cells = parseLine(lineStr);
      const rawObj: Record<string, string> = {};
      rawHeaders.forEach((h, i) => {
        rawObj[h] = cells[i] || '';
      });

      const code = getCol(cells, ['code', 'product_code', 'loan_product_code', 'id']);
      const name = getCol(cells, ['name', 'product_name', 'loan_name', 'title']);
      const description = getCol(cells, ['description', 'desc', 'remarks', 'purpose']);
      const minAmountStr = getCol(cells, ['min_amount', 'minimum_amount', 'min_principal', 'min']);
      const maxAmountStr = getCol(cells, ['max_amount', 'maximum_amount', 'max_principal', 'max']);
      const minTermStr = getCol(cells, ['min_term_months', 'min_term', 'minimum_term']);
      const maxTermStr = getCol(cells, ['max_term_months', 'max_term', 'maximum_term']);
      const defTermStr = getCol(cells, ['default_term_months', 'default_term', 'term_months', 'term']);
      const rateStr = getCol(cells, ['annual_interest_rate', 'interest_rate', 'annual_rate', 'rate', 'interest']);
      const methodStr = getCol(cells, ['interest_calculation_method', 'calculation_method', 'method', 'calc_method']);
      const freqStr = getCol(cells, ['payment_frequency', 'frequency', 'freq', 'payment_interval']);
      const graceStr = getCol(cells, ['grace_period_days', 'grace_period', 'grace_days']);
      const procFeeStr = getCol(cells, ['processing_fee_percentage', 'processing_fee', 'proc_fee', 'processing_rate']);
      const servFeeStr = getCol(cells, ['service_fee_fixed', 'service_fee', 'serv_fee']);
      const otherFeeStr = getCol(cells, ['other_fee', 'other_fees']);
      const penaltyStr = getCol(cells, ['penalty_rate_percentage', 'penalty_rate', 'penalty']);
      const colReqStr = getCol(cells, ['collateral_required', 'collateral']);
      const guarReqStr = getCol(cells, ['guarantor_required', 'guarantor']);
      const reqDocsStr = getCol(cells, ['required_documents', 'documents', 'docs']);
      const debitGlStr = getCol(cells, ['gl_receivable_account_id', 'debit_account_id', 'receivable_gl', 'gl_receivable']);
      const incomeGlStr = getCol(cells, ['gl_interest_income_account_id', 'interest_gl', 'gl_interest', 'income_gl']);
      const effFromStr = getCol(cells, ['effective_from', 'from_date', 'start_date']);
      const effUntilStr = getCol(cells, ['effective_until', 'until_date', 'end_date']);
      const activeStr = getCol(cells, ['active', 'is_active', 'status']);

      const minAmount = parseFloat(minAmountStr) || 5000;
      const maxAmount = parseFloat(maxAmountStr) || 500000;
      const minTerm = parseInt(minTermStr, 10) || 1;
      const maxTerm = parseInt(maxTermStr, 10) || 60;
      const defTerm = parseInt(defTermStr, 10) || 12;
      const annualRate = parseFloat(rateStr) >= 0 ? parseFloat(rateStr) : 6.0;

      // Normalize Calculation Method
      let method = 'Diminishing Balance';
      const mLower = methodStr.toLowerCase();
      if (mLower.includes('flat')) method = 'Flat Rate';
      else if (mLower.includes('equal') || mLower.includes('amortization')) method = 'Equal Amortization';
      else if (mLower.includes('simple')) method = 'Simple Interest';

      // Normalize Payment Frequency
      let frequency = 'Monthly';
      const fLower = freqStr.toLowerCase();
      if (fLower.includes('semi')) frequency = 'Semi-monthly';
      else if (fLower.includes('week')) frequency = 'Weekly';
      else if (fLower.includes('lump')) frequency = 'Lump Sum';
      else if (fLower.includes('quarter')) frequency = 'Quarterly';

      const graceDays = Math.max(0, parseInt(graceStr, 10) || 0);
      const procFee = Math.max(0, parseFloat(procFeeStr) || 0);
      const servFee = Math.max(0, parseFloat(servFeeStr) || 0);
      const otherFee = Math.max(0, parseFloat(otherFeeStr) || 0);
      const penaltyRate = Math.max(0, parseFloat(penaltyStr) || 2.0);

      const collateralReq = colReqStr === '1' || colReqStr.toLowerCase() === 'true' || colReqStr.toLowerCase() === 'yes';
      const guarantorReq = guarReqStr === '1' || guarReqStr.toLowerCase() === 'true' || guarReqStr.toLowerCase() === 'yes';

      const docsList = reqDocsStr
        ? reqDocsStr.split(/[;,]/).map(d => d.trim()).filter(Boolean)
        : ['Valid Government ID'];

      const effFrom = effFromStr || new Date().toISOString().slice(0, 10);
      const effUntil = effUntilStr || null;

      const active = activeStr === '' || activeStr === '1' || activeStr.toLowerCase() === 'true' || activeStr.toLowerCase() === 'active';

      let isValid = true;
      let error = '';

      if (!code) {
        isValid = false;
        error = 'Product Code is required.';
      } else if (!name) {
        isValid = false;
        error = 'Product Name is required.';
      } else if (minAmount <= 0) {
        isValid = false;
        error = 'Minimum amount must be greater than zero.';
      } else if (maxAmount < minAmount) {
        isValid = false;
        error = 'Maximum amount cannot be less than minimum amount.';
      } else if (minTerm <= 0 || maxTerm < minTerm) {
        isValid = false;
        error = 'Invalid term duration.';
      } else if (annualRate < 0) {
        isValid = false;
        error = 'Interest rate cannot be negative.';
      }

      const isExisting = existingProductsMap.has(code.toLowerCase());

      parsed.push({
        rowNumber: idx + 1,
        code,
        name,
        description,
        min_amount: minAmount,
        max_amount: maxAmount,
        min_term_months: minTerm,
        max_term_months: maxTerm,
        default_term_months: defTerm,
        annual_interest_rate: annualRate,
        interest_calculation_method: method,
        payment_frequency: frequency,
        grace_period_days: graceDays,
        processing_fee_percentage: procFee,
        service_fee_fixed: servFee,
        other_fee: otherFee,
        penalty_rate_percentage: penaltyRate,
        collateral_required: collateralReq,
        guarantor_required: guarantorReq,
        required_documents: docsList,
        gl_receivable_account_id: debitGlStr || 'acc_1210',
        gl_interest_income_account_id: incomeGlStr || 'acc_4110',
        effective_from: effFrom,
        effective_until: effUntil,
        active,
        isExisting,
        isValid,
        error: error || undefined,
        raw: rawObj
      });
    }

    return parsed;
  };

  const parsedRows = useMemo(() => {
    return parseCsvIntoRows(csvRawText);
  }, [csvRawText, existingProductsMap]);

  const stats = useMemo(() => {
    const total = parsedRows.length;
    const errors = parsedRows.filter(r => !r.isValid).length;
    const updates = parsedRows.filter(r => r.isValid && r.isExisting).length;
    const news = parsedRows.filter(r => r.isValid && !r.isExisting).length;
    return { total, errors, updates, news };
  }, [parsedRows]);

  const displayedRows = useMemo(() => {
    if (filterPreviewStatus === 'error') return parsedRows.filter(r => !r.isValid);
    if (filterPreviewStatus === 'update') return parsedRows.filter(r => r.isValid && r.isExisting);
    if (filterPreviewStatus === 'new') return parsedRows.filter(r => r.isValid && !r.isExisting);
    return parsedRows;
  }, [parsedRows, filterPreviewStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onload = event => {
        setCsvRawText(String(event.target?.result || ''));
        setImportResult(null);
        setSubmitError(null);
      };
      reader.readAsText(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (!dropped.name.toLowerCase().endsWith('.csv') && dropped.type !== 'text/csv') {
        setSubmitError('Please drop a valid .csv file.');
        return;
      }
      setFile(dropped);
      const reader = new FileReader();
      reader.onload = event => {
        setCsvRawText(String(event.target?.result || ''));
        setImportResult(null);
        setSubmitError(null);
      };
      reader.readAsText(dropped);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = SAMPLE_LOAN_PRODUCT_ROWS.map(row =>
      row.map(val => (val.includes(',') || val.includes('"') || val.includes(';') ? `"${val.replace(/"/g, '""')}"` : val)).join(',')
    ).join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `coopflex_loan_products_template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportExecute = async () => {
    if (parsedRows.length === 0) return;
    if (stats.errors > 0 && importMode === 'insert') {
      if (!window.confirm(`There are ${stats.errors} rows with format errors that will be skipped. Do you wish to proceed?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const validProductsToImport = parsedRows
        .filter(r => r.isValid)
        .map(r => ({
          code: r.code,
          name: r.name,
          description: r.description,
          min_amount: r.min_amount,
          max_amount: r.max_amount,
          min_term_months: r.min_term_months,
          max_term_months: r.max_term_months,
          default_term_months: r.default_term_months,
          annual_interest_rate: r.annual_interest_rate,
          interest_calculation_method: r.interest_calculation_method,
          payment_frequency: r.payment_frequency,
          grace_period_days: r.grace_period_days,
          processing_fee_percentage: r.processing_fee_percentage,
          service_fee_fixed: r.service_fee_fixed,
          other_fee: r.other_fee,
          penalty_rate_percentage: r.penalty_rate_percentage,
          collateral_required: r.collateral_required,
          guarantor_required: r.guarantor_required,
          required_documents: r.required_documents,
          gl_receivable_account_id: r.gl_receivable_account_id,
          debit_account_id: r.gl_receivable_account_id,
          gl_interest_income_account_id: r.gl_interest_income_account_id,
          effective_from: r.effective_from,
          effective_until: r.effective_until,
          active: r.active
        }));

      const res = await api.importLoanProductsCsv({
        loan_products: validProductsToImport,
        csv_text: csvRawText,
        mode: importMode,
        performed_by: currentUser.name
      });

      if (res && res.success) {
        setImportResult({
          count: res.count,
          inserted: res.inserted,
          updated: res.updated,
          message: res.message || 'Loan products imported successfully.'
        });
        onImportSuccess({
          count: res.count,
          inserted: res.inserted,
          updated: res.updated
        });
      } else {
        throw new Error(res?.message || 'Failed to complete loan products CSV import.');
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setSubmitError(err.message || 'An error occurred during CSV processing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Import Loan Products (CSV)</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                  Full 30-Column Spec
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload or paste loan products CSV data with automatic term, rate, calculation method, and GL account normalization.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              title="Download sample loan products CSV template"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Template</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <strong className="block font-semibold">Import Failed</strong>
                <span>{submitError}</span>
              </div>
            </div>
          )}

          {importResult && (
            <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-700/80 text-emerald-300 text-xs flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-white text-sm">Import Completed Successfully</h4>
                  <p className="text-slate-300 mt-0.5">
                    {importResult.message} ({importResult.inserted} inserted, {importResult.updated} updated).
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs transition cursor-pointer"
              >
                Done
              </button>
            </div>
          )}

          {/* Upload Dropzone & Paste Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`md:col-span-2 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition ${
                isDragging
                  ? 'border-emerald-400 bg-emerald-950/20 text-emerald-300'
                  : file
                  ? 'border-emerald-500/50 bg-slate-950/60 text-slate-300'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-950/40 text-slate-400'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6" />
              </div>
              {file ? (
                <div>
                  <span className="font-bold text-white text-sm">{file.name}</span>
                  <p className="text-xs text-emerald-400 mt-0.5">
                    {(file.size / 1024).toFixed(1)} KB · Ready to preview & import
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Click or drag a new file to replace</p>
                </div>
              ) : (
                <div>
                  <span className="font-semibold text-white text-sm">Choose a CSV file or drag & drop</span>
                  <p className="text-xs text-slate-400 mt-1">
                    Standard comma-separated format with headers: code, name, min_amount, max_amount, annual_interest_rate, etc.
                  </p>
                </div>
              )}
            </div>

            {/* Config & Mode Selection Panel */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Import Settings</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Choose how duplicate product codes should be handled during execution.
                </p>

                <div className="mt-3 space-y-2">
                  <label className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="importMode"
                      value="upsert"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="mt-1 text-emerald-500 focus:ring-emerald-400"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">Upsert (Recommended)</span>
                      <span className="text-[10px] text-slate-400 block">
                        Update existing products matching product code; create new ones.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start space-x-2.5 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="radio"
                      name="importMode"
                      value="insert"
                      checked={importMode === 'insert'}
                      onChange={() => setImportMode('insert')}
                      className="mt-1 text-emerald-500 focus:ring-emerald-400"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">Insert Only</span>
                      <span className="text-[10px] text-slate-400 block">
                        Skip existing products; only create non-existing product codes.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasteText(!showPasteText)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center space-x-1 cursor-pointer self-start"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showPasteText ? 'Hide raw text paste' : 'Or paste raw CSV text'}</span>
              </button>
            </div>
          </div>

          {showPasteText && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Direct CSV Text Input</span>
                <span className="text-[11px] text-slate-500 font-normal">Paste from Excel or Google Sheets</span>
              </label>
              <textarea
                rows={5}
                value={csvRawText}
                onChange={e => {
                  setCsvRawText(e.target.value);
                  setFile(null);
                  setImportResult(null);
                }}
                placeholder="code,name,description,min_amount,max_amount,min_term_months,max_term_months,default_term_months,annual_interest_rate,interest_calculation_method,payment_frequency,..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Validation & Preview Summary Bar */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Pre-Flight Validation Preview ({parsedRows.length} Products Found)
                  </h4>
                </div>

                <div className="flex items-center space-x-1.5 text-xs">
                  <button
                    onClick={() => setFilterPreviewStatus('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                      filterPreviewStatus === 'all'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({stats.total})
                  </button>
                  <button
                    onClick={() => setFilterPreviewStatus('new')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1 ${
                      filterPreviewStatus === 'new'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-emerald-400 hover:text-white'
                    }`}
                  >
                    <span>New ({stats.news})</span>
                  </button>
                  <button
                    onClick={() => setFilterPreviewStatus('update')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1 ${
                      filterPreviewStatus === 'update'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-800 text-amber-400 hover:text-white'
                    }`}
                  >
                    <span>Updates ({stats.updates})</span>
                  </button>
                  {stats.errors > 0 && (
                    <button
                      onClick={() => setFilterPreviewStatus('error')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer flex items-center space-x-1 ${
                        filterPreviewStatus === 'error'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-rose-400 hover:text-white'
                      }`}
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span>Errors ({stats.errors})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/90 text-slate-300 font-semibold sticky top-0 border-b border-slate-700">
                    <tr>
                      <th className="py-2 px-3 whitespace-nowrap">#</th>
                      <th className="py-2 px-3 whitespace-nowrap">Status</th>
                      <th className="py-2 px-3 whitespace-nowrap">Code</th>
                      <th className="py-2 px-3 whitespace-nowrap">Product Name</th>
                      <th className="py-2 px-3 whitespace-nowrap text-right">Min Amount</th>
                      <th className="py-2 px-3 whitespace-nowrap text-right">Max Amount</th>
                      <th className="py-2 px-3 whitespace-nowrap text-center">Term (Mos)</th>
                      <th className="py-2 px-3 whitespace-nowrap text-center">Interest</th>
                      <th className="py-2 px-3 whitespace-nowrap">Calc Method</th>
                      <th className="py-2 px-3 whitespace-nowrap">Frequency</th>
                      <th className="py-2 px-3 whitespace-nowrap">Receivable GL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {displayedRows.map(row => (
                      <tr
                        key={row.rowNumber}
                        className={`hover:bg-slate-800/50 transition ${
                          !row.isValid ? 'bg-rose-950/20' : row.isExisting ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{row.rowNumber}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {!row.isValid ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Error
                            </span>
                          ) : row.isExisting ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Update
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              New
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-white whitespace-nowrap">
                          {row.code || '—'}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-200">
                          {row.name}
                          {row.error && <span className="block text-[10px] text-rose-400 mt-0.5">{row.error}</span>}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                          ₱{row.min_amount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300 whitespace-nowrap">
                          ₱{row.max_amount.toLocaleString()}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-400 whitespace-nowrap">
                          {row.default_term_months} ({row.min_term_months}–{row.max_term_months})
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-emerald-400 font-semibold whitespace-nowrap">
                          {row.annual_interest_rate}%
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                          {row.interest_calculation_method}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-slate-400 text-[11px]">
                          {row.payment_frequency}
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {row.gl_receivable_account_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            {parsedRows.length > 0 ? (
              <span>
                Ready to process <strong className="text-white">{stats.news + stats.updates}</strong> valid loan products.
              </span>
            ) : (
              <span>Load a CSV file to inspect and preview loan products.</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImportExecute}
              disabled={isSubmitting || parsedRows.length === 0 || (stats.news === 0 && stats.updates === 0)}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl shadow-lg shadow-emerald-900/30 flex items-center space-x-2 cursor-pointer transition"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-300" />
                  <span>Processing Import…</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>
                    Import {stats.news + (importMode === 'upsert' ? stats.updates : 0)} Loan Products
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
