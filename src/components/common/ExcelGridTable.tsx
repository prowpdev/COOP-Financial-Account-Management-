import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  Grid,
  List,
  Columns,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  Calculator,
  RefreshCw,
  Edit2
} from 'lucide-react';

export type ColumnType = 'text' | 'number' | 'currency' | 'percent' | 'badge' | 'boolean' | 'date';

export interface ExcelColumn<T> {
  key: string;
  header: string;
  accessor?: (item: T) => any;
  type?: ColumnType;
  width?: string;
  minWidth?: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  align?: 'left' | 'center' | 'right';
  badgeColor?: (value: any, item: T) => string;
  render?: (value: any, item: T, rowIndex: number) => React.ReactNode;
}

export interface ExcelGridTableProps<T> {
  data: T[];
  columns: ExcelColumn<T>[];
  title?: string;
  subtitle?: string;
  exportFileName?: string;
  getRowId?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  onCellEdit?: (item: T, columnKey: string, newValue: any) => Promise<void> | void;
  defaultSortKey?: string;
  defaultSortDir?: 'asc' | 'desc';
  defaultDensity?: 'compact' | 'normal' | 'spacious';
  toolbarExtra?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function ExcelGridTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  subtitle,
  exportFileName = 'coopflex_export',
  getRowId = (item, idx) => item.id || `row_${idx}`,
  onRowClick,
  onCellEdit,
  defaultSortKey,
  defaultSortDir = 'asc',
  defaultDensity = 'compact',
  toolbarExtra,
  emptyMessage = 'No matching records found in this view',
  isLoading = false,
  readOnly = false
}: ExcelGridTableProps<T>) {
  // View states
  const [viewMode, setViewMode] = useState<'excel' | 'modern'>('excel');
  const [density, setDensity] = useState<'compact' | 'normal' | 'spacious'>(defaultDensity);
  const [showGridlines, setShowGridlines] = useState(true);
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string>(defaultSortKey || columns[0]?.key || '');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(defaultSortDir);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    columns.forEach(c => {
      init[c.key] = true;
    });
    return init;
  });

  // Active cell / selection state for Excel formula bar
  const [activeCell, setActiveCell] = useState<{
    rowIndex: number;
    colIndex: number;
    colKey: string;
    colHeader: string;
    value: any;
    rawItem: T | null;
  } | null>(null);

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{
    rowId: string;
    colKey: string;
    currentValue: any;
  } | null>(null);
  const [editInputVal, setEditInputVal] = useState<string>('');
  const [isSavingCell, setIsSavingCell] = useState(false);

  // Toast notification
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Helper to extract value
  const getVal = (item: T, col: ExcelColumn<T>) => {
    if (col.accessor) return col.accessor(item);
    return item[col.key];
  };

  // Filtered & Sorted columns
  const activeCols = useMemo(() => {
    return columns.filter(c => visibleColumns[c.key] !== false);
  }, [columns, visibleColumns]);

  // Filter and Sort Data
  const processedData = useMemo(() => {
    let result = [...data];

    // Global Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => {
        return columns.some(col => {
          const val = getVal(item, col);
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Per-column filters
    const filterKeys = Object.keys(columnFilters).filter(k => !!columnFilters[k]?.trim());
    if (filterKeys.length > 0) {
      result = result.filter(item => {
        return filterKeys.every(k => {
          const col = columns.find(c => c.key === k);
          if (!col) return true;
          const val = getVal(item, col);
          const filterStr = columnFilters[k].toLowerCase();
          return String(val ?? '').toLowerCase().includes(filterStr);
        });
      });
    }

    // Sorting
    if (sortKey) {
      const col = columns.find(c => c.key === sortKey);
      if (col) {
        result.sort((a, b) => {
          const valA = getVal(a, col);
          const valB = getVal(b, col);

          if (valA === valB) return 0;
          if (valA === null || valA === undefined) return 1;
          if (valB === null || valB === undefined) return -1;

          if (typeof valA === 'number' && typeof valB === 'number') {
            return sortDir === 'asc' ? valA - valB : valB - valA;
          }
          const strA = String(valA).toLowerCase();
          const strB = String(valB).toLowerCase();
          return sortDir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        });
      }
    }

    return result;
  }, [data, columns, searchQuery, columnFilters, sortKey, sortDir]);

  // Excel Calculations (SUM, AVG, COUNT, MIN, MAX) for visible numeric columns
  const columnStats = useMemo(() => {
    const stats: Record<string, { sum: number; avg: number; count: number; min: number; max: number; isNumeric: boolean }> = {};

    activeCols.forEach(col => {
      let isNumeric = col.type === 'number' || col.type === 'currency' || col.type === 'percent';
      let sum = 0;
      let count = 0;
      let min = Infinity;
      let max = -Infinity;

      processedData.forEach(item => {
        const v = getVal(item, col);
        if (typeof v === 'number' && !isNaN(v)) {
          isNumeric = true;
          sum += v;
          count++;
          if (v < min) min = v;
          if (v > max) max = v;
        } else if (typeof v === 'string' && !isNaN(Number(v)) && v.trim() !== '') {
          const num = Number(v);
          sum += num;
          count++;
          if (num < min) min = num;
          if (num > max) max = num;
        }
      });

      stats[col.key] = {
        sum,
        avg: count > 0 ? sum / count : 0,
        count,
        min: count > 0 ? min : 0,
        max: count > 0 ? max : 0,
        isNumeric: count > 0 && isNumeric
      };
    });

    return stats;
  }, [processedData, activeCols]);

  // Export to CSV
  const handleExportCSV = () => {
    if (processedData.length === 0) {
      showToast('No data to export');
      return;
    }

    const headers = activeCols.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');
    const rows = processedData.map(item => {
      return activeCols
        .map(col => {
          const val = getVal(item, col);
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',');
    });

    const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${exportFileName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${processedData.length} rows to CSV!`);
  };

  // Copy to Clipboard formatted for Excel (TSV)
  const handleCopyToClipboard = async () => {
    if (processedData.length === 0) {
      showToast('No data to copy');
      return;
    }

    const headers = activeCols.map(c => c.header).join('\t');
    const rows = processedData.map(item => {
      return activeCols
        .map(col => {
          const val = getVal(item, col);
          if (val === null || val === undefined) return '';
          return String(val).replace(/[\t\n\r]/g, ' ');
        })
        .join('\t');
    });

    const tsvContent = [headers, ...rows].join('\n');
    try {
      await navigator.clipboard.writeText(tsvContent);
      showToast(`Copied ${processedData.length} rows to clipboard! Ready to paste into Excel (Ctrl+V)`);
    } catch (err) {
      showToast('Clipboard access denied');
    }
  };

  // Handle Sort Click
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // Formatting helpers
  const formatCellDisplay = (val: any, col: ExcelColumn<T>, item: T, rowIndex: number) => {
    if (col.render) return col.render(val, item, rowIndex);

    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-600 italic">-</span>;
    }

    switch (col.type) {
      case 'currency': {
        const num = typeof val === 'number' ? val : parseFloat(val) || 0;
        return (
          <span className="font-mono font-medium text-emerald-400">
            {new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(num)}
          </span>
        );
      }
      case 'percent': {
        const num = typeof val === 'number' ? val : parseFloat(val) || 0;
        return (
          <span className="font-mono text-cyan-400">
            {num.toFixed(2)}%
          </span>
        );
      }
      case 'number': {
        const num = typeof val === 'number' ? val : parseFloat(val) || 0;
        return <span className="font-mono text-slate-200">{num.toLocaleString()}</span>;
      }
      case 'boolean': {
        const isTrue = Boolean(val);
        return isTrue ? (
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium border border-slate-700">
            Inactive
          </span>
        );
      }
      case 'badge': {
        const color = col.badgeColor ? col.badgeColor(val, item) : 'bg-blue-500/20 text-blue-300 border-blue-500/30';
        return (
          <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded-md font-semibold border ${color}`}>
            {String(val)}
          </span>
        );
      }
      default:
        return <span className="truncate">{String(val)}</span>;
    }
  };

  // Convert column index into Excel Letter (0 -> A, 1 -> B, 25 -> Z, 26 -> AA)
  const getExcelColLetter = (index: number) => {
    let letter = '';
    let temp = index;
    while (temp >= 0) {
      letter = String.fromCharCode((temp % 26) + 65) + letter;
      temp = Math.floor(temp / 26) - 1;
    }
    return letter;
  };

  // Save inline edit
  const handleCommitEdit = async (item: T, colKey: string) => {
    if (!onCellEdit) return;
    setIsSavingCell(true);
    try {
      const col = columns.find(c => c.key === colKey);
      let parsedVal: any = editInputVal;
      if (col?.type === 'number' || col?.type === 'currency' || col?.type === 'percent') {
        parsedVal = parseFloat(editInputVal);
        if (isNaN(parsedVal)) parsedVal = 0;
      }
      await onCellEdit(item, colKey, parsedVal);
      showToast(`Updated ${col?.header || colKey} successfully!`);
      setEditingCell(null);
    } catch (err: any) {
      showToast(`Failed to update: ${err.message || err}`);
    } finally {
      setIsSavingCell(false);
    }
  };

  const rowHeightClass = {
    compact: 'py-1.5 px-3 text-xs',
    normal: 'py-2.5 px-4 text-xs',
    spacious: 'py-3.5 px-4 text-sm'
  }[density];

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-lg overflow-hidden transition-all ${
        isFullScreen ? 'fixed inset-4 z-50 rounded-2xl border-slate-700 shadow-2xl' : 'w-full'
      }`}
    >
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 right-4 z-50 bg-emerald-950 border border-emerald-500/50 text-emerald-300 px-4 py-2 rounded-xl text-xs font-semibold shadow-xl flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Excel Toolbar / Ribbon */}
      <div className="bg-slate-950/80 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Dataset Counters */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-white tracking-tight">{title || 'Data Grid Table'}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-mono font-semibold border border-slate-700">
                {processedData.length} of {data.length} records
              </span>
            </div>
            {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* Right: Quick Search, Tools, Excel Export, Views */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Universal Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search table values..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-44 sm:w-56 pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-slate-400 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Filter Row Toggle */}
          <button
            onClick={() => setShowFilterRow(prev => !prev)}
            title="Toggle Column Filter Row"
            className={`p-1.5 rounded-lg border text-xs flex items-center space-x-1 transition cursor-pointer ${
              showFilterRow
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Filters</span>
          </button>

          {/* Column Chooser */}
          <div className="relative">
            <button
              onClick={() => setShowColumnChooser(prev => !prev)}
              title="Configure visible columns"
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center space-x-1 transition cursor-pointer"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Columns</span>
            </button>
            {showColumnChooser && (
              <div className="absolute right-0 mt-1 w-52 bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-2xl z-40 space-y-2 text-xs">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-800 font-semibold text-slate-200">
                  <span>Visible Columns</span>
                  <button
                    onClick={() => {
                      const allVisible: Record<string, boolean> = {};
                      columns.forEach(c => (allVisible[c.key] = true));
                      setVisibleColumns(allVisible);
                    }}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    Select All
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {columns.map(col => (
                    <label
                      key={col.key}
                      className="flex items-center space-x-2 text-slate-300 hover:text-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key] !== false}
                        onChange={e =>
                          setVisibleColumns(prev => ({
                            ...prev,
                            [col.key]: e.target.checked
                          }))
                        }
                        className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="truncate">{col.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Density Selector */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
            <button
              onClick={() => setDensity('compact')}
              title="Compact density (Excel standard)"
              className={`px-2 py-1 rounded cursor-pointer ${
                density === 'compact' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setDensity('normal')}
              title="Normal density"
              className={`px-2 py-1 rounded cursor-pointer ${
                density === 'normal' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Normal
            </button>
          </div>

          {/* View Mode: Excel Grid vs Modern */}
          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => {
                setViewMode('excel');
                setShowGridlines(true);
              }}
              title="Excel Grid View (with row & column indices)"
              className={`p-1.5 rounded cursor-pointer ${
                viewMode === 'excel' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('modern')}
              title="Modern Table View"
              className={`p-1.5 rounded cursor-pointer ${
                viewMode === 'modern' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy to Clipboard for Excel */}
          <button
            onClick={handleCopyToClipboard}
            title="Copy table data directly to Clipboard for Excel / Google Sheets (Tab-Separated)"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 text-xs flex items-center space-x-1 transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline text-[11px]">Copy Excel</span>
          </button>

          {/* Export to CSV Button */}
          <button
            onClick={handleExportCSV}
            title="Download CSV for Microsoft Excel"
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(prev => !prev)}
            title={isFullScreen ? 'Exit Full Screen' : 'Expand to Full Screen'}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {toolbarExtra}
        </div>
      </div>

      {/* Excel Formula & Active Cell Bar (fx) */}
      <div className="bg-slate-950 px-4 py-1.5 border-b border-slate-800/80 flex items-center space-x-3 text-xs font-mono">
        <div className="flex items-center space-x-1.5 text-slate-400 border-r border-slate-800 pr-3">
          <span className="text-emerald-400 font-bold italic">fx</span>
          <span className="bg-slate-900 px-2 py-0.5 rounded text-emerald-300 text-[11px] font-semibold border border-slate-800">
            {activeCell ? `${getExcelColLetter(activeCell.colIndex)}${activeCell.rowIndex + 1}` : 'A1'}
          </span>
        </div>
        <div className="flex-1 flex items-center truncate">
          {activeCell ? (
            <div className="flex items-center space-x-2 text-slate-300 truncate">
              <span className="text-slate-500 font-sans text-[11px]">[{activeCell.colHeader}]:</span>
              <span className="text-white font-mono truncate">{String(activeCell.value ?? '')}</span>
            </div>
          ) : (
            <span className="text-slate-600 italic text-[11px] font-sans">
              Click any cell or row to inspect formulas and values
            </span>
          )}
        </div>
        {activeCell && !readOnly && onCellEdit && (
          <button
            onClick={() => {
              if (!activeCell.rawItem) return;
              const rowId = getRowId(activeCell.rawItem, activeCell.rowIndex);
              setEditingCell({
                rowId,
                colKey: activeCell.colKey,
                currentValue: activeCell.value
              });
              setEditInputVal(String(activeCell.value ?? ''));
            }}
            className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
          >
            <Edit2 className="w-3 h-3" />
            <span>Edit Cell</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto min-h-[300px] max-h-[620px] relative">
        <table
          className={`w-full text-left border-collapse text-slate-200 ${
            showGridlines ? 'border border-slate-800' : ''
          }`}
        >
          {/* Table Header */}
          <thead className="sticky top-0 z-20 bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 select-none shadow-sm">
            {/* Row 1: Excel Column Letters (if in Excel mode) */}
            {viewMode === 'excel' && (
              <tr className="bg-slate-950/90 text-[10px] font-mono text-slate-500 border-b border-slate-800/80">
                <th className="w-12 py-1 px-2 text-center bg-slate-950 border-r border-slate-800 font-mono text-slate-600">
                  #
                </th>
                {activeCols.map((col, idx) => (
                  <th
                    key={`letter_${col.key}`}
                    className={`py-1 px-3 text-center border-r border-slate-800/80 font-mono ${
                      activeCell?.colKey === col.key ? 'text-emerald-400 bg-emerald-950/30' : ''
                    }`}
                  >
                    {getExcelColLetter(idx)}
                  </th>
                ))}
              </tr>
            )}

            {/* Row 2: Real Column Names with Sort */}
            <tr>
              {/* Row index header */}
              {viewMode === 'excel' && (
                <th className="w-12 py-2.5 px-2 text-center bg-slate-950 border-r border-slate-800 font-mono text-[11px] text-slate-500">
                  Row
                </th>
              )}

              {activeCols.map(col => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={{ width: col.width, minWidth: col.minWidth }}
                    className={`py-2.5 px-3 text-xs tracking-wider transition select-none ${
                      showGridlines ? 'border-r border-slate-800' : ''
                    } ${
                      col.sortable !== false ? 'cursor-pointer hover:bg-slate-900 hover:text-white' : ''
                    } ${isSorted ? 'text-emerald-400 bg-slate-900/60' : ''}`}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                  >
                    <div
                      className={`flex items-center space-x-1.5 ${
                        col.align === 'right'
                          ? 'justify-end'
                          : col.align === 'center'
                          ? 'justify-center'
                          : 'justify-between'
                      }`}
                    >
                      <span className="font-bold text-slate-200">{col.header}</span>
                      {col.sortable !== false && (
                        <span className="text-slate-500">
                          {isSorted ? (
                            sortDir === 'asc' ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-slate-600 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* Optional Row 3: Per-Column Filter Row */}
            {showFilterRow && (
              <tr className="bg-slate-900/90 border-b border-slate-800">
                {viewMode === 'excel' && (
                  <th className="w-12 py-1 px-1 text-center border-r border-slate-800 text-[10px] text-slate-500">
                    🔍
                  </th>
                )}
                {activeCols.map(col => (
                  <th key={`filter_${col.key}`} className="p-1 border-r border-slate-800">
                    <input
                      type="text"
                      placeholder={`Filter ${col.header}...`}
                      value={columnFilters[col.key] || ''}
                      onChange={e =>
                        setColumnFilters(prev => ({
                          ...prev,
                          [col.key]: e.target.value
                        }))
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-normal"
                    />
                  </th>
                ))}
              </tr>
            )}
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-800/70">
            {isLoading ? (
              <tr>
                <td
                  colSpan={activeCols.length + (viewMode === 'excel' ? 1 : 0)}
                  className="py-16 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                    <p className="text-xs">Loading records into grid...</p>
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={activeCols.length + (viewMode === 'excel' ? 1 : 0)}
                  className="py-16 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-1">
                    <p className="text-sm font-semibold text-slate-300">{emptyMessage}</p>
                    <p className="text-xs text-slate-500">Try clearing your filters or search keywords</p>
                  </div>
                </td>
              </tr>
            ) : (
              processedData.map((item, rowIndex) => {
                const rowId = getRowId(item, rowIndex);
                const isSelectedRow = activeCell?.rowIndex === rowIndex;

                return (
                  <tr
                    key={rowId}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`transition group cursor-pointer ${
                      isSelectedRow
                        ? 'bg-emerald-950/20'
                        : rowIndex % 2 === 1
                        ? 'bg-slate-900/40 hover:bg-slate-800/50'
                        : 'bg-transparent hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Excel Row Index Indicator */}
                    {viewMode === 'excel' && (
                      <td
                        className={`w-12 text-center font-mono text-[11px] select-none border-r border-slate-800/90 ${
                          isSelectedRow
                            ? 'bg-emerald-900/30 text-emerald-300 font-bold'
                            : 'bg-slate-950/60 text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        {rowIndex + 1}
                      </td>
                    )}

                    {/* Data Cells */}
                    {activeCols.map((col, colIndex) => {
                      const val = getVal(item, col);
                      const isCellActive =
                        activeCell?.rowIndex === rowIndex && activeCell?.colKey === col.key;
                      const isCellEditing =
                        editingCell?.rowId === rowId && editingCell?.colKey === col.key;

                      return (
                        <td
                          key={col.key}
                          onClick={e => {
                            e.stopPropagation();
                            setActiveCell({
                              rowIndex,
                              colIndex,
                              colKey: col.key,
                              colHeader: col.header,
                              value: val,
                              rawItem: item
                            });
                          }}
                          onDoubleClick={() => {
                            if (col.editable && onCellEdit && !readOnly) {
                              setEditingCell({
                                rowId,
                                colKey: col.key,
                                currentValue: val
                              });
                              setEditInputVal(String(val ?? ''));
                            }
                          }}
                          className={`${rowHeightClass} ${
                            showGridlines ? 'border-r border-slate-800/80' : ''
                          } ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                              ? 'text-center'
                              : 'text-left'
                          } ${
                            isCellActive
                              ? 'outline outline-2 outline-emerald-400 outline-offset-[-2px] bg-emerald-950/40'
                              : ''
                          }`}
                        >
                          {isCellEditing ? (
                            <div className="flex items-center space-x-1" onClick={e => e.stopPropagation()}>
                              <input
                                autoFocus
                                type={
                                  col.type === 'number' || col.type === 'currency' || col.type === 'percent'
                                    ? 'number'
                                    : 'text'
                                }
                                value={editInputVal}
                                onChange={e => setEditInputVal(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleCommitEdit(item, col.key);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full bg-slate-950 border border-emerald-400 rounded px-2 py-0.5 text-xs text-white font-mono focus:outline-none"
                              />
                              <button
                                onClick={() => handleCommitEdit(item, col.key)}
                                disabled={isSavingCell}
                                className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px]"
                              >
                                ✓
                              </button>
                              <button
                                onClick={() => setEditingCell(null)}
                                className="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            formatCellDisplay(val, col, item, rowIndex)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Excel Bottom Summary & Status Bar */}
      <div className="bg-slate-950 border-t border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 font-mono text-[11px]">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-500">COUNT:</span>
            <span className="text-slate-200 font-bold">{processedData.length}</span>
          </div>

          {/* If an active numeric cell or selected column exists, display its SUM and AVERAGE */}
          {activeCell && columnStats[activeCell.colKey]?.isNumeric && (
            <>
              <div className="h-3 w-px bg-slate-800" />
              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <span className="text-slate-500">SUM ({activeCell.colHeader}):</span>
                <span className="text-emerald-400 font-bold">
                  {columns.find(c => c.key === activeCell.colKey)?.type === 'currency'
                    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
                        columnStats[activeCell.colKey].sum
                      )
                    : columnStats[activeCell.colKey].sum.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <span className="text-slate-500">AVERAGE:</span>
                <span className="text-cyan-400 font-bold">
                  {columns.find(c => c.key === activeCell.colKey)?.type === 'currency'
                    ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
                        columnStats[activeCell.colKey].avg
                      )
                    : columnStats[activeCell.colKey].avg.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right Info: Grid instructions */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-500">
          <span className="hidden lg:inline">Double-click editable cell to modify • Click header to sort</span>
          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-emerald-400">
            CoopFlex Sheet Ready
          </span>
        </div>
      </div>
    </div>
  );
}
