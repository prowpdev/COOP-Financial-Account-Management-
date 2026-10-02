import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  code?: string;
  type?: string; // e.g. "Asset", "Liability", "Equity", "Revenue", "Expense"
  description?: string;
  badge?: string;
  disabled?: boolean;
  searchTerms?: string;
}

export interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
  minOptionsForSearch?: number; // Default 6 (shows search whenever options >= minOptionsForSearch)
  alwaysShowSearch?: boolean; // When true, always shows the search field regardless of count
  showGLTypeBadge?: boolean;
  hideCode?: boolean;
  id?: string;
  name?: string;
  renderOption?: (opt: SearchableOption, isSelected: boolean) => React.ReactNode;
}

export const getGLTypeColor = (type?: string): { bg: string; text: string; border: string } => {
  const t = (type || '').toLowerCase();
  if (t.includes('asset')) {
    return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  }
  if (t.includes('liabilit')) {
    return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
  }
  if (t.includes('equity')) {
    return { bg: 'bg-sky-500/15', text: 'text-sky-400', border: 'border-sky-500/30' };
  }
  if (t.includes('revenue') || t.includes('income')) {
    return { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30' };
  }
  if (t.includes('expense') || t.includes('cost')) {
    return { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' };
  }
  return { bg: 'bg-slate-800', text: 'text-slate-300', border: 'border-slate-700' };
};

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Type to search...',
  disabled = false,
  required = false,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  icon,
  clearable = false,
  minOptionsForSearch = 6,
  alwaysShowSearch = false,
  showGLTypeBadge = false,
  hideCode = false,
  id,
  renderOption
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation: Escape closes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Current selected option
  const selectedOption = useMemo(() => {
    return options.find(opt => String(opt.value) === String(value));
  }, [options, value]);

  // Filtered options
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(opt => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchCode = opt.code ? opt.code.toLowerCase().includes(q) : false;
      const matchType = opt.type ? opt.type.toLowerCase().includes(q) : false;
      const matchDesc = opt.description ? opt.description.toLowerCase().includes(q) : false;
      const matchTerms = opt.searchTerms ? opt.searchTerms.toLowerCase().includes(q) : false;
      return matchLabel || matchCode || matchType || matchDesc || matchTerms;
    });
  }, [options, searchQuery]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const shouldShowSearch = alwaysShowSearch || options.length >= minOptionsForSearch;

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-2 text-xs text-left text-white flex items-center justify-between gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-emerald-500 ${buttonClassName}`}
      >
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          {icon && <span className="shrink-0 text-slate-400">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center space-x-2 truncate flex-1">
              {!hideCode && selectedOption.code && (
                <span className="font-mono text-emerald-400 font-bold shrink-0 text-[11px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  {selectedOption.code}
                </span>
              )}
              <span className="truncate font-medium text-slate-100">{selectedOption.label}</span>
              {!hideCode && (showGLTypeBadge || selectedOption.type) && selectedOption.type && (
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                    getGLTypeColor(selectedOption.type).bg
                  } ${getGLTypeColor(selectedOption.type).text} ${
                    getGLTypeColor(selectedOption.type).border
                  }`}
                >
                  {selectedOption.type}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500 italic truncate">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {clearable && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              title="Clear selection"
              className="p-0.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-emerald-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 mt-1 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-72 animate-in fade-in-50 duration-100 ${dropdownClassName}`}
        >
          {/* Search Field (shown when options >= minOptionsForSearch) */}
          {shouldShowSearch && (
            <div className="p-2 border-b border-slate-800 bg-slate-950/80 sticky top-0 z-10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && filteredOptions.length > 0) {
                      e.preventDefault();
                      handleSelect(filteredOptions[0].value);
                    }
                  }}
                  placeholder={searchPlaceholder}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1.5">
                <span>
                  Showing {filteredOptions.length} of {options.length}
                </span>
                {searchQuery && <span>Press Escape to close</span>}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-800/50">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                No matching results found for "{searchQuery}"
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = String(opt.value) === String(value);

                if (renderOption) {
                  return (
                    <div
                      key={opt.value}
                      onClick={() => !opt.disabled && handleSelect(opt.value)}
                      className={`cursor-pointer ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {renderOption(opt, isSelected)}
                    </div>
                  );
                }

                const glColors = getGLTypeColor(opt.type);

                return (
                  <div
                    key={opt.value}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`px-3 py-2 text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/60 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    } ${opt.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      {!hideCode && opt.code && (
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {opt.code}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-medium">{opt.label}</span>
                          {!hideCode && (showGLTypeBadge || opt.type) && opt.type && (
                            <span
                              className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${glColors.bg} ${glColors.text} ${glColors.border}`}
                            >
                              {opt.type}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {opt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center space-x-1.5">
                      {opt.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
