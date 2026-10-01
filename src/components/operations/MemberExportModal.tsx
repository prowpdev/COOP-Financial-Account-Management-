import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  X,
  Check,
  CheckSquare,
  Square,
  Sliders,
  Eye,
  Filter,
  Users,
  Building2,
  Tag,
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Member, CustomField, Branch, MemberType } from '../../types';

export interface MemberExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filteredMembers: Member[];
  allMembers: Member[];
  branches?: Branch[];
  memberTypes?: MemberType[];
  customFields?: CustomField[];
  selectedBranchName?: string;
}

export interface ExportColumnOption {
  id: string;
  label: string;
  category: 'core' | 'personal' | 'compliance' | 'custom';
  description?: string;
  getValue: (m: Member) => string;
}

/**
 * Formats a member's full name as: Last name, First name MI
 * Example:
 *   first_name: "Juan", middle_name: "Dela", last_name: "Cruz" -> "Cruz, Juan D."
 *   first_name: "Maria", middle_name: "Santos", last_name: "Reyes" -> "Reyes, Maria S."
 *   first_name: "Rodrigo", middle_name: "", last_name: "Mendoza" -> "Mendoza, Rodrigo"
 */
export function formatMemberFullName(
  m: { first_name?: string; last_name?: string; middle_name?: string },
  withPeriod: boolean = true
): string {
  const last = (m.last_name || '').trim();
  const first = (m.first_name || '').trim();
  const middle = (m.middle_name || '').trim();

  let mi = '';
  if (middle) {
    const cleanMid = middle.replace(/\./g, '').trim();
    if (cleanMid.length > 0) {
      mi = withPeriod ? ` ${cleanMid[0].toUpperCase()}.` : ` ${cleanMid[0].toUpperCase()}`;
    }
    mi = ` ${cleanMid}`;
  }
 ;

  if (last && first) {
    return `${last}, ${first}${mi}`;
  }
  if (last) return last;
  if (first) return `${first}${mi}`;
  return '';
}

export const MemberExportModal: React.FC<MemberExportModalProps> = ({
  isOpen,
  onClose,
  filteredMembers = [],
  allMembers = [],
  customFields = [],
  selectedBranchName = 'All Branches'
}) => {
  // Export Scope: 'filtered' or 'all'
  const [exportScope, setExportScope] = useState<'filtered' | 'all'>('filtered');
  const [miWithPeriod, setMiWithPeriod] = useState<boolean>(true);
  const [fileName, setFileName] = useState(() => {
    const d = new Date().toISOString().split('T')[0];
    return `coop_members_export_${d}`;
  });
  const [showPreview, setShowPreview] = useState(true);

  // Available column options
  const columnOptions: ExportColumnOption[] = useMemo(() => {
    const coreCols: ExportColumnOption[] = [
      {
        id: 'full_name',
        label: 'Full Name (Last name, First name MI)',
        category: 'core',
        description: `Formatted as "Last name, First name MI" (e.g. ${miWithPeriod ? 'Cruz, Juan D.' : 'Cruz, Juan D'})`,
        getValue: m => formatMemberFullName(m, miWithPeriod)
      },
      {
        id: 'member_no',
        label: 'Member ID / Number',
        category: 'core',
        description: 'Unique cooperative identifier (e.g. MB-2026-0001)',
        getValue: m => m.member_no || ''
      },
      {
        id: 'last_name',
        label: 'Last Name (Separate)',
        category: 'personal',
        getValue: m => m.last_name || ''
      },
      {
        id: 'first_name',
        label: 'First Name (Separate)',
        category: 'personal',
        getValue: m => m.first_name || ''
      },
      {
        id: 'middle_name',
        label: 'Middle Name (Separate)',
        category: 'personal',
        getValue: m => m.middle_name || ''
      },
      {
        id: 'tin_number',
        label: 'Tax Identification No. (TIN)',
        category: 'compliance',
        description: 'BIR Cooperative registration identifier',
        getValue: m => m.tin_number || m.tin || m.custom_field_values?.tin_number || ''
      },
      {
        id: 'branch_name',
        label: 'Branch Assigned',
        category: 'core',
        getValue: m => m.branch_name || 'Main Branch'
      },
      {
        id: 'member_type_name',
        label: 'Membership Tier / Classification',
        category: 'core',
        getValue: m => m.member_type_name || 'Regular Member'
      },
      {
        id: 'gender',
        label: 'Gender',
        category: 'personal',
        getValue: m => m.gender || ''
      },
      {
        id: 'birthdate',
        label: 'Date of Birth',
        category: 'personal',
        getValue: m => m.birthdate || ''
      },
      {
        id: 'phone',
        label: 'Contact Telephone / Mobile',
        category: 'personal',
        getValue: m => m.phone || ''
      },
      {
        id: 'email',
        label: 'Email Address',
        category: 'personal',
        getValue: m => m.email || ''
      },
      {
        id: 'address',
        label: 'Residential Address',
        category: 'personal',
        getValue: m => m.address || ''
      },
      {
        id: 'notes',
        label: 'Notes / Remarks',
        category: 'core',
        description: 'Internal observations and membership annotations',
        getValue: m => m.notes || m.custom_field_values?.notes || ''
      },
      {
        id: 'joined_date',
        label: 'Date Enrolled / Admitted',
        category: 'compliance',
        getValue: m => m.joined_date || ''
      },
      {
        id: 'status',
        label: 'Membership Status',
        category: 'compliance',
        getValue: m => m.status || (m.active ? 'Active' : 'Inactive')
      }
    ];

    // Dynamic custom fields (e.g. farm_hectares, primary_crop, barangay, monthly_income)
    const dynamicCols: ExportColumnOption[] = [];
    const seenKeys = new Set(coreCols.map(c => c.id));
    // Also include 'tin_number' and 'notes' as already handled
    seenKeys.add('tin_number');
    seenKeys.add('notes');

    customFields.forEach(cf => {
      const key = cf.field_key || cf.field_name || '';
      if (!key || seenKeys.has(key) || key.toLowerCase().includes('tin') || key.toLowerCase() === 'notes') {
        return;
      }
      seenKeys.add(key);

      const label = cf.label || cf.field_label || key;
      dynamicCols.push({
        id: `custom_${key}`,
        label: `${label} (Custom)`,
        category: 'custom',
        description: `Dynamic custom field: ${key}`,
        getValue: m => {
          const val = m.custom_field_values?.[key];
          if (val === undefined || val === null) return '';
          return String(val);
        }
      });
    });

    // Also inspect existing members custom_field_values for any extra keys not in schema
    allMembers.forEach(m => {
      if (m.custom_field_values && typeof m.custom_field_values === 'object') {
        Object.keys(m.custom_field_values).forEach(k => {
          if (!seenKeys.has(k) && !seenKeys.has(`custom_${k}`) && k !== 'tin_number' && k !== 'notes') {
            seenKeys.add(k);
            const formattedLabel = k
              .split('_')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            dynamicCols.push({
              id: `custom_${k}`,
              label: `${formattedLabel} (Custom)`,
              category: 'custom',
              description: `Attribute: ${k}`,
              getValue: mem => {
                const val = mem.custom_field_values?.[k];
                if (val === undefined || val === null) return '';
                return String(val);
              }
            });
          }
        });
      }
    });

    return [...coreCols, ...dynamicCols];
  }, [customFields, allMembers, miWithPeriod]);

  // Selected columns state (defaults to standard useful set with full_name at the front!)
  const [selectedColumnIds, setSelectedColumnIds] = useState<string[]>([
    'member_no',
    'full_name',
    'branch_name',
    'member_type_name',
    'tin_number',
    'phone',
    'address',
    'notes',
    'joined_date',
    'status'
  ]);

  if (!isOpen) return null;

  const targetMembers = exportScope === 'filtered' ? filteredMembers : allMembers;

  const toggleColumn = (id: string) => {
    setSelectedColumnIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedColumnIds(columnOptions.map(c => c.id));
  };

  const handleDeselectAll = () => {
    setSelectedColumnIds([]);
  };

  // Presets
  const applyPreset = (preset: 'standard' | 'compliance' | 'full' | 'contact') => {
    switch (preset) {
      case 'standard':
        setSelectedColumnIds([
          'member_no',
          'full_name',
          'branch_name',
          'member_type_name',
          'phone',
          'address',
          'status'
        ]);
        break;
      case 'compliance':
        setSelectedColumnIds([
          'member_no',
          'full_name',
          'tin_number',
          'branch_name',
          'member_type_name',
          'notes',
          'joined_date',
          'status'
        ]);
        break;
      case 'contact':
        setSelectedColumnIds([
          'member_no',
          'full_name',
          'phone',
          'email',
          'address',
          'branch_name'
        ]);
        break;
      case 'full':
        setSelectedColumnIds(columnOptions.map(c => c.id));
        break;
    }
  };

  // Generate CSV string
  const generateCSV = (): string => {
    const activeCols = columnOptions.filter(c => selectedColumnIds.includes(c.id));
    if (activeCols.length === 0 || targetMembers.length === 0) return '';

    // CSV Header row
    const headerRow = activeCols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');

    // CSV Data rows
    const dataRows = targetMembers.map(m => {
      return activeCols
        .map(c => {
          const rawVal = c.getValue(m) || '';
          const val = typeof rawVal === 'string' ? rawVal.replace(/[\r\n]+/g, ' ').trim() : String(rawVal);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    return '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  };

  // Download Trigger
  const handleExport = () => {
    if (selectedColumnIds.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }
    if (targetMembers.length === 0) {
      alert('No member records to export.');
      return;
    }

    const csvData = generateCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${fileName.trim() || 'members_export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  const activeCols = columnOptions.filter(c => selectedColumnIds.includes(c.id));
  const previewSampleMembers = targetMembers.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Export Members to CSV
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Custom Column Selection
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose specific data columns to include. Full name format is formatted as{' '}
                <strong className="text-emerald-400 font-mono">Last name, First name MI</strong>.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Settings: Scope & Presets */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left: Scope Selection */}
            <div className="md:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Member Records Scope</span>
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setExportScope('filtered')}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                    exportScope === 'filtered'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-300">Filtered Members</span>
                    {exportScope === 'filtered' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-white">{filteredMembers.length}</div>
                  <div className="text-[10px] text-slate-400">Currently active filters ({selectedBranchName})</div>
                </button>

                <button
                  type="button"
                  onClick={() => setExportScope('all')}
                  className={`p-3 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                    exportScope === 'all'
                      ? 'bg-emerald-950/40 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-300">All Cooperative Members</span>
                    {exportScope === 'all' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-white">{allMembers.length}</div>
                  <div className="text-[10px] text-slate-400">Total database registry (All Branches)</div>
                </button>
              </div>
            </div>

            {/* Right: File Name & Quick Presets */}
            <div className="md:col-span-6 bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  CSV Export File Name
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="coop_members_export"
                  />
                  <span className="text-xs text-slate-500 font-mono">.csv</span>
                </div>
              </div>

              {/* Full Name Format Selector */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">Full Name Format:</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Last name, First name MI</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMiWithPeriod(true)}
                    className={`py-1 px-2 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      miWithPeriod
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Cruz, Juan D.</span>
                    {miWithPeriod && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMiWithPeriod(false)}
                    className={`py-1 px-2 rounded-lg border text-left transition cursor-pointer flex items-center justify-between ${
                      !miWithPeriod
                        ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Cruz, Juan D</span>
                    {!miWithPeriod && <Check className="w-3 h-3 text-emerald-400" />}
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quick Column Presets:</span>
                  </span>
                  <div className="space-x-2 text-[11px]">
                    <button
                      onClick={handleSelectAll}
                      className="text-emerald-400 hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span>•</span>
                    <button
                      onClick={handleDeselectAll}
                      className="text-rose-400 hover:underline cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => applyPreset('standard')}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] border border-slate-800 transition cursor-pointer"
                  >
                    Standard Directory
                  </button>
                  <button
                    onClick={() => applyPreset('compliance')}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 rounded-lg text-[11px] border border-slate-800 transition cursor-pointer"
                  >
                    BIR & Compliance (TIN)
                  </button>
                  <button
                    onClick={() => applyPreset('contact')}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] border border-slate-800 transition cursor-pointer"
                  >
                    Contact List
                  </button>
                  <button
                    onClick={() => applyPreset('full')}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white rounded-lg text-[11px] border border-slate-800 transition cursor-pointer"
                  >
                    All Attributes & Custom Fields
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Column Checkboxes Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Select Columns to Export</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono font-semibold">
                  {selectedColumnIds.length} of {columnOptions.length} Selected
                </span>
              </h3>

              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showPreview ? 'Hide Sample Preview' : 'Show Sample Preview'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {columnOptions.map(col => {
                const isSelected = selectedColumnIds.includes(col.id);
                const isFullName = col.id === 'full_name';
                const isTin = col.id === 'tin_number';
                const isNotes = col.id === 'notes';

                return (
                  <div
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`p-3 rounded-xl border transition cursor-pointer select-none flex items-start space-x-2.5 ${
                      isSelected
                        ? isFullName
                          ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                          : isTin
                          ? 'bg-amber-950/30 border-amber-500/50'
                          : isNotes
                          ? 'bg-cyan-950/30 border-cyan-500/50'
                          : 'bg-slate-950 border-emerald-500/40'
                        : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 opacity-60'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {col.label}
                        </span>
                        {isFullName && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono shrink-0">
                            Required Format
                          </span>
                        )}
                      </div>
                      {col.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                          {col.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Data Preview */}
          {showPreview && (
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real-time CSV Data Preview (First {previewSampleMembers.length} Rows)</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  Full Name dynamically formatted as <strong className="text-emerald-400 font-mono">Last name, First name MI</strong>
                </span>
              </div>

              {activeCols.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 italic">
                  No columns selected. Please check one or more columns above.
                </div>
              ) : previewSampleMembers.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500 italic">
                  No member records available for preview.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-300">
                        {activeCols.map(col => (
                          <th key={col.id} className="py-2 px-3 whitespace-nowrap border-r border-slate-800/80">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {previewSampleMembers.map((m, idx) => (
                        <tr key={m.id || idx} className="hover:bg-slate-900/50">
                          {activeCols.map(col => {
                            const val = col.getValue(m);
                            const isNameCol = col.id === 'full_name';
                            return (
                              <td
                                key={col.id}
                                className={`py-1.5 px-3 whitespace-nowrap border-r border-slate-800/80 ${
                                  isNameCol ? 'text-emerald-300 font-bold font-sans' : 'text-slate-300'
                                }`}
                              >
                                {val || <span className="text-slate-600 italic">N/A</span>}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Exporting <strong className="text-white">{targetMembers.length}</strong> member records with{' '}
            <strong className="text-emerald-400">{selectedColumnIds.length}</strong> chosen columns.
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-medium transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              id="btn-confirm-export-members-csv"
              type="button"
              onClick={handleExport}
              disabled={selectedColumnIds.length === 0 || targetMembers.length === 0}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl font-bold shadow-lg transition cursor-pointer ${
                selectedColumnIds.length === 0 || targetMembers.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download CSV File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
