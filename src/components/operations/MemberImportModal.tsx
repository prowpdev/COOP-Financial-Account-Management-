import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Sliders,
  Users,
  Building2,
  Tag,
  ArrowRight,
  ArrowLeft,
  Download,
  Info,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Branch, CustomField, MemberType, User } from '../../types';
import { api } from '../../services/api';

export interface MemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  memberTypes: MemberType[];
  customFields: CustomField[];
  currentUser: User;
  onImportSuccess?: (result: { importedCount: number; newCustomFields: any[] }) => void;
  onNavigateToFields?: () => void;
}

// Standard columns that exist in the database table 'members'
const STANDARD_DB_COLUMNS = new Set([
  'id',
  'member_no',
  'branch_id',
  'member_type_id',
  'first_name',
  'last_name',
  'middle_name',
  'gender',
  'birthdate',
  'email',
  'phone',
  'tin_number',
  'tin',
  'notes',
  'address',
  'status',
  'joined_date',
  'photo_url',
  'id_photo_url',
  'civil_status',
  'active',
  'custom_field_values'
]);

// Map alias headers to standard columns
const ALIAS_MAP: Record<string, string> = {
  member_id: 'member_no',
  member_number: 'member_no',
  member_no: 'member_no',
  member_code: 'member_no',
  branch: 'branch_name',
  branch_code: 'branch_code',
  branch_name: 'branch_name',
  branch_id: 'branch_id',
  member_type: 'member_type_name',
  member_type_name: 'member_type_name',
  membership_type: 'member_type_name',
  member_type_id: 'member_type_id',
  tier: 'member_type_name',
  classification: 'member_type_name',
  first_name: 'first_name',
  firstname: 'first_name',
  fname: 'first_name',
  given_name: 'first_name',
  last_name: 'last_name',
  lastname: 'last_name',
  lname: 'last_name',
  surname: 'last_name',
  family_name: 'last_name',
  middle_name: 'middle_name',
  middlename: 'middle_name',
  mname: 'middle_name',
  middle_initial: 'middle_name',
  mi: 'middle_name',
  full_name: 'full_name',
  name: 'full_name',
  member_name: 'full_name',
  sex: 'gender',
  gender: 'gender',
  dob: 'birthdate',
  date_of_birth: 'birthdate',
  birth_date: 'birthdate',
  birthdate: 'birthdate',
  email_address: 'email',
  email: 'email',
  mobile: 'phone',
  mobile_number: 'phone',
  mobile_no: 'phone',
  contact: 'phone',
  contact_number: 'phone',
  contact_no: 'phone',
  telephone: 'phone',
  tel_no: 'phone',
  phone: 'phone',
  street_address: 'address',
  home_address: 'address',
  residence: 'address',
  address: 'address',
  tin_number: 'tin_number',
  tin_no: 'tin_number',
  tin: 'tin_number',
  tax_identification_number: 'tin_number',
  tax_id: 'tin_number',
  remarks: 'notes',
  member_notes: 'notes',
  notes: 'notes',
  comments: 'notes',
  date_joined: 'joined_date',
  membership_date: 'joined_date',
  joined_date: 'joined_date',
  join_date: 'joined_date',
  status: 'status',
  civil_status: 'civil_status',
  marital_status: 'civil_status',
  initial_share_capital: 'initial_share_capital',
  share_capital: 'initial_share_capital',
  cbu: 'initial_share_capital',
  paid_up_amount: 'initial_share_capital',
  paid_up_shares: 'paid_up_shares',
  initial_savings: 'initial_savings_deposit',
  savings_deposit: 'initial_savings_deposit',
  savings: 'initial_savings_deposit'
};

function normalizeKey(str: string): string {
  return (str || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function formatKeyToLabel(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function parseCsv(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines: string[] = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if ((char === '\r' && nextChar === '\n') && !insideQuotes) {
      lines.push(currentLine);
      currentLine = '';
      i++;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      lines.push(currentLine);
      currentLine = '';
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  const validLines = lines.filter(l => l.trim().length > 0);
  if (validLines.length === 0) return { headers: [], rows: [] };

  const parseRowCells = (line: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let inQuote = false;
    let delimiter = ',';
    if (!line.includes(',') && line.includes(';')) delimiter = ';';
    else if (!line.includes(',') && line.includes('\t')) delimiter = '\t';

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      const next = line[i + 1];
      if (c === '"') {
        if (inQuote && next === '"') {
          cell += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === delimiter && !inQuote) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = parseRowCells(validLines[0]).map(h => h.replace(/^"|"$/g, '').trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < validLines.length; i++) {
    const values = parseRowCells(validLines[i]);
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] !== undefined ? values[idx].replace(/^"|"$/g, '').trim() : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

interface ColumnMapping {
  rawHeader: string;
  normalizedKey: string;
  targetCategory: 'standard' | 'existing_custom' | 'new_custom' | 'skip';
  targetField: string;
  fieldLabel: string;
  fieldType: 'Text' | 'Number' | 'Date' | 'Currency' | 'Checkbox' | 'Phone' | 'Email';
  sampleValue?: string;
}

export const MemberImportModal: React.FC<MemberImportModalProps> = ({
  isOpen,
  onClose,
  branches = [],
  memberTypes = [],
  customFields = [],
  currentUser,
  onImportSuccess,
  onNavigateToFields
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState<string>('');
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Defaults
  const [defaultBranchId, setDefaultBranchId] = useState<string>(branches[0]?.id || 'branch_tar');
  const [defaultMemberTypeId, setDefaultMemberTypeId] = useState<string>(memberTypes[0]?.id || 'mt_regular');

  // Parsed state
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);

  // Processing state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    imported_count: number;
    new_custom_fields: any[];
    warnings: string[];
  } | null>(null);

  // Set of existing member custom fields
  const existingCustomMap = useMemo(() => {
    const map = new Map<string, CustomField>();
    customFields
      .filter(f => !f.entity || f.entity === 'Member')
      .forEach(f => {
        const key = (f.field_name || f.field_key || '').toLowerCase();
        if (key) map.set(key, f);
      });
    return map;
  }, [customFields]);

  if (!isOpen) return null;

  // Process CSV text into headers, rows, and auto-detect mappings
  const handleProcessCsvText = (text: string, fName?: string) => {
    setErrorMsg(null);
    try {
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0 || rows.length === 0) {
        setErrorMsg('The CSV file appears empty or missing data rows.');
        return;
      }

      setParsedHeaders(headers);
      setParsedRows(rows);
      if (fName) setFileName(fName);

      // Auto-detect mappings for each header
      const mappings: ColumnMapping[] = headers.map(header => {
        const normKey = normalizeKey(header);
        const alias = ALIAS_MAP[normKey];
        const isStandard = STANDARD_DB_COLUMNS.has(normKey) || (alias && STANDARD_DB_COLUMNS.has(alias));

        const sample = rows[0]?.[header] || rows[1]?.[header] || '';

        // Check if existing custom field in DB
        const existingCf = existingCustomMap.get(normKey);

        if (isStandard) {
          const targetField = alias || normKey;
          return {
            rawHeader: header,
            normalizedKey: normKey,
            targetCategory: 'standard',
            targetField,
            fieldLabel: formatKeyToLabel(targetField),
            fieldType: 'Text',
            sampleValue: sample
          };
        } else if (existingCf) {
          return {
            rawHeader: header,
            normalizedKey: normKey,
            targetCategory: 'existing_custom',
            targetField: existingCf.field_name || normKey,
            fieldLabel: existingCf.field_label || formatKeyToLabel(normKey),
            fieldType: (existingCf.field_type as any) || 'Text',
            sampleValue: sample
          };
        } else {
          // It is NOT in the database table 'members' and not an existing custom field!
          // As requested: "if csv contains database table column that is not in the table, add it on the custom_fields"
          let inferredType: 'Text' | 'Number' | 'Date' | 'Currency' | 'Checkbox' | 'Phone' | 'Email' = 'Text';
          const keyLower = normKey.toLowerCase();
          if (keyLower.includes('phone') || keyLower.includes('mobile')) inferredType = 'Phone';
          else if (keyLower.includes('email') || keyLower.includes('mail')) inferredType = 'Email';
          else if (keyLower.includes('income') || keyLower.includes('amount') || keyLower.includes('salary') || keyLower.includes('fee')) inferredType = 'Currency';
          else if (keyLower.includes('date') || keyLower.includes('dob')) inferredType = 'Date';
          else if (sample && !isNaN(Number(sample.replace(/,/g, '')))) inferredType = 'Number';

          return {
            rawHeader: header,
            normalizedKey: normKey,
            targetCategory: 'new_custom',
            targetField: normKey,
            fieldLabel: formatKeyToLabel(header),
            fieldType: inferredType,
            sampleValue: sample
          };
        }
      });

      setColumnMappings(mappings);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse CSV file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      setRawCsvText(text);
      handleProcessCsvText(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      setRawCsvText(text);
      handleProcessCsvText(text, file.name);
    };
    reader.readAsText(file);
  };

  // Download Sample CSV Template
  const handleDownloadSampleCsv = () => {
    const headers = [
      'first_name',
      'last_name',
      'middle_name',
      'gender',
      'birthdate',
      'phone',
      'email',
      'address',
      'tin_number',
      'branch_name',
      'member_type',
      'occupation',
      'barangay',
      'farm_hectares',
      'blood_type',
      'emergency_contact',
      'monthly_income',
      'notes'
    ];

    const sampleRow1 = [
      'Elena',
      'Delos Santos',
      'Bautista',
      'Female',
      '1985-04-12',
      '+63 917 888 1234',
      'elena.santos@coopmail.ph',
      'Poblacion, Gerona, Tarlac',
      '123-456-789-000',
      'Tarlac Main Branch',
      'Regular Agricultural Member',
      'Farmer / Rice Grower',
      'Brgy. Singat',
      '2.5',
      'O+',
      'Manuel Delos Santos (+63 918 333 4444)',
      '35000',
      'Cluster leader for Rice production cluster A'
    ];

    const sampleRow2 = [
      'Mateo',
      'Villanueva',
      'Castro',
      'Male',
      '1992-09-28',
      '+63 920 777 5678',
      'mateo.v@agrifarm.ph',
      'Brgy. Tibag, Tarlac City',
      '987-654-321-000',
      'Tarlac Main Branch',
      'Associate Micro-Entrepreneur',
      'Poultry / Agri-Supplies',
      'Brgy. Tibag',
      '1.0',
      'A+',
      'Carmela Villanueva (+63 921 555 6666)',
      '42000',
      'Operates feeds and poultry farm supply'
    ];

    const csvContent = [
      headers.join(','),
      sampleRow1.map(v => (v.includes(',') || v.includes(' ') ? `"${v}"` : v)).join(','),
      sampleRow2.map(v => (v.includes(',') || v.includes(' ') ? `"${v}"` : v)).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cooperative_members_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Perform Final Import
  const handleExecuteImport = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // Build custom field definitions to register for newly discovered columns
      const customDefs = columnMappings
        .filter(m => m.targetCategory === 'new_custom')
        .map(m => ({
          field_name: m.normalizedKey,
          field_label: m.fieldLabel || formatKeyToLabel(m.normalizedKey),
          field_type: m.fieldType || 'Text'
        }));

      // Transform rows according to column mappings
      const preparedMembers = parsedRows.map(row => {
        const memObj: Record<string, any> = {
          custom_field_values: {}
        };

        columnMappings.forEach(mapping => {
          if (mapping.targetCategory === 'skip') return;
          const val = row[mapping.rawHeader] || '';

          if (mapping.targetCategory === 'standard') {
            memObj[mapping.targetField] = val;
          } else {
            // Both existing_custom and new_custom are placed into custom_field_values
            memObj.custom_field_values[mapping.normalizedKey] = val;
            // Also store under target field key
            memObj[mapping.normalizedKey] = val;
          }
        });

        return memObj;
      });

      const res = await api.importMembersCsv({
        members: preparedMembers,
        custom_field_definitions: customDefs,
        default_branch_id: defaultBranchId,
        default_member_type_id: defaultMemberTypeId,
        performed_by: currentUser.name || 'Admin'
      });

      if (res.success && res.data) {
        setImportResult(res.data);
        setStep(4);
        window.dispatchEvent(new CustomEvent('coop:data-changed'));
        if (onImportSuccess) {
          onImportSuccess({
            importedCount: res.data.imported_count,
            newCustomFields: res.data.new_custom_fields
          });
        }
      } else {
        throw new Error((res as any).error || res.message || 'Import failed');
      }
    } catch (err: any) {
      console.error('Import members failed:', err);
      setErrorMsg(err.message || 'Failed to complete member CSV import');
    } finally {
      setIsSubmitting(false);
    }
  };

  const newCustomFieldsCount = columnMappings.filter(m => m.targetCategory === 'new_custom').length;
  const existingCustomFieldsCount = columnMappings.filter(m => m.targetCategory === 'existing_custom').length;
  const standardColsCount = columnMappings.filter(m => m.targetCategory === 'standard').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Bulk Registration
                </span>
                <span className="text-slate-500 text-xs">•</span>
                <span className="text-slate-400 text-xs font-medium">Automatic Custom Fields Detection</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
                Import Members from CSV
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 py-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`flex items-center space-x-1.5 ${step === 1 ? 'text-emerald-400 font-bold' : step > 1 ? 'text-slate-300' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-emerald-500 text-white' : step > 1 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {step > 1 ? <Check className="w-3 h-3" /> : '1'}
              </div>
              <span>Upload CSV</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <div className={`flex items-center space-x-1.5 ${step === 2 ? 'text-emerald-400 font-bold' : step > 2 ? 'text-slate-300' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-emerald-500 text-white' : step > 2 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {step > 2 ? <Check className="w-3 h-3" /> : '2'}
              </div>
              <span>Map & Detect Custom Fields</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <div className={`flex items-center space-x-1.5 ${step === 3 ? 'text-emerald-400 font-bold' : step > 3 ? 'text-slate-300' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-emerald-500 text-white' : step > 3 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                {step > 3 ? <Check className="w-3 h-3" /> : '3'}
              </div>
              <span>Preview & Confirm</span>
            </div>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <div className={`flex items-center space-x-1.5 ${step === 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 4 ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                4
              </div>
              <span>Results</span>
            </div>
          </div>

          <button
            onClick={handleDownloadSampleCsv}
            className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer"
            title="Download CSV spreadsheet template with standard columns and custom fields sample"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* STEP 1: UPLOAD / PASTE CSV */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Instructions banner */}
              <div className="p-4 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 border border-emerald-500/20 rounded-2xl flex items-start space-x-3.5">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-white block">
                    Dynamic Custom Fields Detection Enabled
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    If your CSV contains column headers not present in the standard cooperative members table
                    (e.g., <code className="text-amber-300 bg-amber-500/10 px-1 py-0.5 rounded font-mono">farm_hectares</code>,{' '}
                    <code className="text-amber-300 bg-amber-500/10 px-1 py-0.5 rounded font-mono">emergency_contact</code>,{' '}
                    <code className="text-amber-300 bg-amber-500/10 px-1 py-0.5 rounded font-mono">blood_type</code>,{' '}
                    <code className="text-amber-300 bg-amber-500/10 px-1 py-0.5 rounded font-mono">occupation</code>),
                    they will <strong className="text-emerald-400">automatically be added into the Cooperative Custom Fields registry</strong> and populated for each imported member profile.
                  </p>
                </div>
              </div>

              {/* Input mode switcher */}
              <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 w-fit">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    inputMode === 'upload' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    inputMode === 'paste' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Paste CSV Text</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              {inputMode === 'upload' ? (
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                    dragOver
                      ? 'border-emerald-500 bg-emerald-500/5'
                      : 'border-slate-800 hover:border-emerald-500/50 hover:bg-slate-950/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400 mb-3 shadow-inner">
                    <FileSpreadsheet className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    {fileName ? `Selected: ${fileName}` : 'Drag & drop your CSV file here, or click to browse'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    Supports comma-delimited (.csv) files exported from Excel, Google Sheets, or member management systems.
                  </p>
                  <div className="mt-4 flex items-center space-x-3 text-xs text-slate-500 font-mono">
                    <span>.CSV</span>
                    <span>•</span>
                    <span>UTF-8</span>
                    <span>•</span>
                    <span>Up to 1,000 members</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Paste raw CSV content (including header row):
                  </label>
                  <textarea
                    rows={8}
                    value={rawCsvText}
                    onChange={e => setRawCsvText(e.target.value)}
                    placeholder="first_name,last_name,gender,birthdate,phone,tin_number,occupation,farm_hectares,blood_type&#10;Juan,Cruz,Male,1985-05-20,+63 917 111 2222,123-456-789-000,Farmer,3.5,O+"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Default Fallbacks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Default Branch (if unassigned in row)</span>
                  </label>
                  <select
                    value={defaultBranchId}
                    onChange={e => setDefaultBranchId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Default Membership Tier (if unassigned)</span>
                  </label>
                  <select
                    value={defaultMemberTypeId}
                    onChange={e => setDefaultMemberTypeId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {memberTypes.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING & CUSTOM FIELDS REVIEW */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Summary of discovered fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block">Standard DB Columns</span>
                    <span className="text-lg font-bold text-white">{standardColsCount} columns</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                    <FileCheck className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-semibold block">Existing Custom Fields</span>
                    <span className="text-lg font-bold text-emerald-400">{existingCustomFieldsCount} fields</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>

                <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-amber-300 font-bold block">✨ New Custom Fields</span>
                    <span className="text-lg font-bold text-amber-400">{newCustomFieldsCount} to auto-add</span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Explanatory note */}
              <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Any columns tagged as <strong className="text-amber-300">New Custom Field</strong> are not currently in the database schema. They will be automatically registered in the Cooperative Custom Fields registry with the specified type, and values will be saved into each member's record.
                </p>
              </div>

              {/* Mappings Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="max-h-[360px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 sticky top-0 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">CSV Column Header</th>
                        <th className="py-2.5 px-4">Sample Value</th>
                        <th className="py-2.5 px-4">Destination Target</th>
                        <th className="py-2.5 px-4">Field Label & Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {columnMappings.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40 transition">
                          <td className="py-2.5 px-4 font-mono font-bold text-white">
                            {m.rawHeader}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-mono truncate max-w-[150px]">
                            {m.sampleValue ? `"${m.sampleValue}"` : <span className="text-slate-600 italic">Empty</span>}
                          </td>
                          <td className="py-2.5 px-4">
                            {m.targetCategory === 'standard' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium text-[11px] border border-slate-700">
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Table: {m.targetField}</span>
                              </span>
                            )}
                            {m.targetCategory === 'existing_custom' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 font-medium text-[11px] border border-emerald-500/20">
                                <Tag className="w-3 h-3 text-emerald-400" />
                                <span>Existing Custom Field</span>
                              </span>
                            )}
                            {m.targetCategory === 'new_custom' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 font-bold text-[11px] border border-amber-500/30">
                                <Sparkles className="w-3 h-3 text-amber-400" />
                                <span>✨ Auto-Add to Custom Fields</span>
                              </span>
                            )}
                            {m.targetCategory === 'skip' && (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-800 text-slate-500 font-medium text-[11px]">
                                <span>Skip / Ignore</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {m.targetCategory === 'new_custom' ? (
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={m.fieldLabel}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setColumnMappings(prev =>
                                      prev.map((c, i) => (i === idx ? { ...c, fieldLabel: val } : c))
                                    );
                                  }}
                                  placeholder="Field label"
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-amber-500 w-36"
                                />
                                <select
                                  value={m.fieldType}
                                  onChange={e => {
                                    const val = e.target.value as any;
                                    setColumnMappings(prev =>
                                      prev.map((c, i) => (i === idx ? { ...c, fieldType: val } : c))
                                    );
                                  }}
                                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-500"
                                >
                                  <option value="Text">Text</option>
                                  <option value="Number">Number</option>
                                  <option value="Currency">Currency (₱)</option>
                                  <option value="Date">Date</option>
                                  <option value="Phone">Phone</option>
                                  <option value="Email">Email</option>
                                  <option value="Checkbox">Checkbox</option>
                                </select>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs">
                                {m.fieldLabel}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & CONFIRM */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Ready to Import Stats Banner */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-bold text-sm">
                      Ready to Import {parsedRows.length} Member Records
                    </span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400 text-xs font-medium">
                      Automated CBU & Regular Savings Accounts Enabled
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Review parsed member records below before committing to the database.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{newCustomFieldsCount} New Custom Fields</span>
                  </span>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-white">Previewing First 10 Rows</span>
                  <span>Total rows in file: {parsedRows.length}</span>
                </div>
                <div className="max-h-[360px] overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Name</th>
                        <th className="py-2.5 px-3">Gender / DOB</th>
                        <th className="py-2.5 px-3">Contact</th>
                        <th className="py-2.5 px-3">TIN Number</th>
                        <th className="py-2.5 px-3">Branch</th>
                        {columnMappings
                          .filter(m => m.targetCategory === 'new_custom' || m.targetCategory === 'existing_custom')
                          .map((m, idx) => (
                            <th key={idx} className="py-2.5 px-3 text-amber-300">
                              {m.fieldLabel}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {parsedRows.slice(0, 10).map((row, idx) => {
                        const first = row.first_name || row.firstname || row.fname || '';
                        const last = row.last_name || row.lastname || row.lname || '';
                        const name = row.full_name || row.name || (first || last ? `${first} ${last}`.trim() : `Member ${idx + 1}`);
                        const gender = row.gender || row.sex || 'Female';
                        const dob = row.birthdate || row.dob || row.date_of_birth || '1990-01-01';
                        const phone = row.phone || row.mobile || row.contact_number || '-';
                        const tin = row.tin_number || row.tin || row.tin_no || 'Not Set';
                        const branch = row.branch_name || row.branch || branches.find(b => b.id === defaultBranchId)?.name || 'Main Branch';

                        return (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-white">{name}</td>
                            <td className="py-2.5 px-3 text-slate-300">
                              {gender} • {dob}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">{phone}</td>
                            <td className="py-2.5 px-3">
                              {tin !== 'Not Set' ? (
                                <span className="font-mono text-amber-300 text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  {tin}
                                </span>
                              ) : (
                                <span className="text-slate-500 italic text-[11px]">Not Set</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">{branch}</td>
                            {columnMappings
                              .filter(m => m.targetCategory === 'new_custom' || m.targetCategory === 'existing_custom')
                              .map((m, cIdx) => (
                                <td key={cIdx} className="py-2.5 px-3 font-mono text-emerald-300 text-[11px]">
                                  {row[m.rawHeader] || '-'}
                                </td>
                              ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS RESULTS REPORT */}
          {step === 4 && importResult && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  Import Completed Successfully!
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {importResult.imported_count} cooperative member profiles and subsidiary accounts have been committed to the database.
                </p>
              </div>

              {/* Stat breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left">
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block">Members Created</span>
                  <span className="text-2xl font-bold text-white mt-1 block">
                    {importResult.imported_count}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">Registry Updated</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block">Accounts Opened</span>
                  <span className="text-2xl font-bold text-emerald-400 mt-1 block">
                    {importResult.imported_count * 2}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">SA & CBU Accounts</span>
                </div>

                <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30">
                  <span className="text-[11px] text-amber-300 font-bold block">New Custom Fields</span>
                  <span className="text-2xl font-bold text-amber-400 mt-1 block">
                    {importResult.new_custom_fields?.length || 0}
                  </span>
                  <span className="text-[10px] text-amber-300/80 font-medium">Coop Schema Registered</span>
                </div>
              </div>

              {/* Newly Created Custom Fields List */}
              {importResult.new_custom_fields && importResult.new_custom_fields.length > 0 && (
                <div className="max-w-xl mx-auto text-left p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Auto-Registered Cooperative Custom Fields:</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {importResult.new_custom_fields.map((f: any, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs font-mono font-medium"
                      >
                        <Tag className="w-3 h-3 text-amber-400" />
                        <span>{f.field_label || f.field_name}</span>
                        <span className="text-[10px] text-amber-400/70 font-sans">({f.field_type})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings if any */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="max-w-xl mx-auto text-left p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 space-y-1">
                  <span className="font-bold block flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Import Notices ({importResult.warnings.length}):</span>
                  </span>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-amber-300/90 font-mono">
                    {importResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          {step === 1 && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={inputMode === 'paste' ? !rawCsvText.trim() : !fileName}
                onClick={() => {
                  if (inputMode === 'paste') {
                    handleProcessCsvText(rawCsvText, 'pasted_members.csv');
                  }
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer ${
                  (inputMode === 'paste' ? rawCsvText.trim() : fileName)
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Continue to Column Mapping</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                <span>Proceed to Data Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Mapping</span>
              </button>
              <button
                type="button"
                disabled={isSubmitting || parsedRows.length === 0}
                onClick={handleExecuteImport}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer ${
                  isSubmitting
                    ? 'bg-emerald-700 text-emerald-200 cursor-wait'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing {parsedRows.length} Members...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Confirm & Import {parsedRows.length} Members</span>
                  </>
                )}
              </button>
            </>
          )}

          {step === 4 && (
            <div className="flex items-center justify-between w-full">
              {onNavigateToFields && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToFields();
                  }}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>View Custom Fields Registry</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer ml-auto"
              >
                Done & View Members
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
