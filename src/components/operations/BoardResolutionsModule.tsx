import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  UploadCloud,
  Search,
  Filter,
  Eye,
  Download,
  Trash2,
  Edit2,
  Plus,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  Calendar,
  RefreshCw,
  X,
  Check,
  Tag,
  Building2,
  ShieldCheck,
  Scroll,
  Layers,
  Sparkles,
  ExternalLink,
  Printer,
  ChevronRight,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { User, BoardResolution } from '../../types';
import { api, getApiBase } from '../../services/api';

const resolveAssetUrl = (path: string) => {
  if (!path) return '';
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path;

  const assetPath = path.startsWith('/api/')
    ? path
    : `/api/${path.replace(/^\/+/, '')}`;
  return new URL(assetPath, new URL(getApiBase(), window.location.origin)).toString();
};

const inferDocType = (fileName: string, mimeType?: string): 'PDF' | 'Document' | 'Image' | 'Excel' | 'File' => {
  const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
  const mime = (mimeType || '').toLowerCase();

  if (ext === 'pdf' || mime.includes('pdf')) return 'PDF';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext) || mime.includes('word') || mime.includes('text')) return 'Document';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp'].includes(ext) || mime.startsWith('image/')) return 'Image';
  if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('excel') || mime.includes('spreadsheet')) return 'Excel';
  return 'File';
};

const formatSize = (bytes?: number) => {
  if (!bytes || bytes === 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

interface BoardResolutionsModuleProps {
  currentUser: User;
  onRefresh?: () => void;
}

export const BoardResolutionsModule: React.FC<BoardResolutionsModuleProps> = ({
  currentUser,
  onRefresh
}) => {
  const [resolutions, setResolutions] = useState<BoardResolution[]>([]);
  const [categories, setCategories] = useState<string[]>([
    'All',
    'Credit & Lending Policy',
    'Capital Build-Up & Dividends',
    'Governance & Appointments',
    'CDA Statutory Compliance',
    'Operations & Branch Rules',
    'Audit & Risk Management',
    'General Governance'
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & View state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Approved' | 'Adopted' | 'Pending Signature' | 'Superseded'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'PDF' | 'Document' | 'Image'>('All');
  const [yearFilter, setYearFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<BoardResolution | null>(null);
  const [editingDoc, setEditingDoc] = useState<BoardResolution | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<BoardResolution | null>(null);

  // Upload Form state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDataUrl, setUploadDataUrl] = useState<string>('');
  const [uploadForm, setUploadForm] = useState({
    resolution_no: `BR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
    title: '',
    category: 'Credit & Lending Policy',
    meeting_type: 'Regular Board Meeting',
    resolution_date: new Date().toISOString().split('T')[0],
    signatories: 'Atty. Renato P. Manalo (BOD Chairman), Maria Corazon Santos (Corporate Secretary)',
    status: 'Approved' as 'Approved' | 'Adopted' | 'Pending Signature' | 'Superseded',
    notes: '',
    tags: 'Governance, Board Policy'
  });

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 6000);
  };

  const loadResolutions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBoardResolutions();
      if (res.data) {
        setResolutions(res.data);
        if (res.categories && res.categories.length > 0) {
          const uniqueCats = Array.from(new Set(['All', ...res.categories]));
          setCategories(uniqueCats);
        }
      }
    } catch (err: any) {
      console.error('Failed to load board resolutions:', err);
      showNotice('error', err.message || 'Could not load board resolutions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResolutions();
  }, []);

  // Filtered dataset
  const filteredResolutions = useMemo(() => {
    return resolutions.filter(res => {
      // Category filter
      if (categoryFilter !== 'All') {
        const catLow = categoryFilter.toLowerCase();
        const matchesCategory = (res.category?.toLowerCase() === catLow) ||
          ((res as any).sub_category?.toLowerCase() === catLow);
        if (!matchesCategory) return false;
      }

      // Status filter
      if (statusFilter !== 'All' && res.status !== statusFilter) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'All' && String(res.field_type).toUpperCase() !== typeFilter.toUpperCase()) {
        return false;
      }

      // Year filter
      if (yearFilter !== 'All') {
        if (!res.resolution_date?.startsWith(yearFilter)) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchResNo = res.resolution_no?.toLowerCase().includes(q);
        const matchTitle = res.title?.toLowerCase().includes(q);
        const matchNotes = res.notes?.toLowerCase().includes(q);
        const matchSignatories = res.signatories?.toLowerCase().includes(q);
        const matchFileName = res.file_name?.toLowerCase().includes(q);
        const matchMeeting = res.meeting_type?.toLowerCase().includes(q);
        return matchResNo || matchTitle || matchNotes || matchSignatories || matchFileName || matchMeeting;
      }

      return true;
    });
  }, [resolutions, categoryFilter, statusFilter, typeFilter, yearFilter, searchTerm]);

  // Unique Years available
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    resolutions.forEach(r => {
      if (r.resolution_date) {
        const y = r.resolution_date.slice(0, 4);
        if (y.length === 4) years.add(y);
      }
    });
    return ['All', ...Array.from(years).sort().reverse()];
  }, [resolutions]);

  // Metrics summary
  const metrics = useMemo(() => {
    const total = resolutions.length;
    const adopted = resolutions.filter(r => r.status === 'Adopted' || r.status === 'Approved').length;
    const pending = resolutions.filter(r => r.status === 'Pending Signature').length;
    const pdfCount = resolutions.filter(r => String(r.field_type).toUpperCase() === 'PDF').length;
    const docCount = resolutions.filter(r => String(r.field_type).toUpperCase() === 'DOCUMENT').length;
    const imgCount = resolutions.filter(r => String(r.field_type).toUpperCase() === 'IMAGE').length;
    return { total, adopted, pending, pdfCount, docCount, imgCount };
  }, [resolutions]);

  // Handle File Pick
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    if (!uploadForm.title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
      setUploadForm(prev => ({ ...prev, title: cleanName }));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setUploadDataUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Submit Upload Resolution (stores to user_documents)
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title.trim()) {
      showNotice('error', 'Please provide a descriptive resolution title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const fileName = uploadFile ? uploadFile.name : `${uploadForm.resolution_no.replace(/\s+/g, '_')}_resolution.pdf`;
      const detectedFieldType = uploadFile ? inferDocType(uploadFile.name, uploadFile.type) : 'PDF';
      const fileSize = uploadFile ? uploadFile.size : 102400;

      // Safe base64 placeholder if no file chosen
      const finalDataUrl = uploadDataUrl || 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjEgMCBvYmoKPDwgL1R5cGUgL0NhdGFsb2cgL1BhZ2VzIDIgMCBSID4+CmVuZG9iagoyIDAgb2JqCjw8IC9UeXBlIC9QYWdlcyAvS2lkcyBbMyAwIFJdIC9Db3VudCAxID4+CmVuZG9iagozIDAgb2JqCjw8IC9UeXBlIC9QYWdlIC9QYXJlbnQgMiAwIFIgL01lZGlhQm94IFswIDAgNjEyIDc5Ml0gL0NvbnRlbnRzIDQgMCBSID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggNzEgPj4Kc3RyZWFtCkJUCi9GMSAxMiBUZgpGMSAxMiBUZgoxMDAgNzAwIFREIAooQm9hcmQgUmVzb2x1dGlvbiBGaWxlKSBUagpFVAppbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxMTcgMDAwMDAgbiAKMDAwMDAwMDIwOSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDUgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjI4MAolJUVPRgo=';

      const tagsArray = uploadForm.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        resolution_no: uploadForm.resolution_no.trim(),
        title: uploadForm.title.trim(),
        category: 'Board Resolutions',
        sub_category: uploadForm.category,
        meeting_type: uploadForm.meeting_type,
        resolution_date: uploadForm.resolution_date,
        signatories: uploadForm.signatories,
        status: uploadForm.status,
        notes: uploadForm.notes,
        file_name: fileName,
        file_type: uploadFile?.type || (detectedFieldType === 'PDF' ? 'application/pdf' : 'application/octet-stream'),
        field_type: detectedFieldType,
        size: fileSize,
        file_size: fileSize,
        data_url: finalDataUrl,
        dataUrl: finalDataUrl,
        tags: tagsArray,
        user_id: currentUser.id,
        performed_by: currentUser.name || 'Corporate Secretary'
      };

      const res = await api.uploadBoardResolution(payload);
      showNotice('success', `Resolution ${uploadForm.resolution_no} successfully saved into user_documents table!`);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadDataUrl('');
      setUploadForm({
        resolution_no: `BR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        title: '',
        category: 'Credit & Lending Policy',
        meeting_type: 'Regular Board Meeting',
        resolution_date: new Date().toISOString().split('T')[0],
        signatories: 'Atty. Renato P. Manalo (BOD Chairman), Maria Corazon Santos (Corporate Secretary)',
        status: 'Approved',
        notes: '',
        tags: 'Governance, Board Policy'
      });
      await loadResolutions();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      showNotice('error', err.message || 'Failed to upload resolution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Resolution Metadata
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;

    setIsSubmitting(true);
    try {
      await api.updateBoardResolution(editingDoc.doc_key || editingDoc.id, {
        title: editingDoc.title,
        resolution_no: editingDoc.resolution_no,
        sub_category: editingDoc.category,
        meeting_type: editingDoc.meeting_type,
        resolution_date: editingDoc.resolution_date,
        signatories: editingDoc.signatories,
        status: editingDoc.status,
        notes: editingDoc.notes,
        tags: editingDoc.tags,
        performed_by: currentUser.name || 'Corporate Secretary'
      });
      showNotice('success', `Resolution ${editingDoc.resolution_no} metadata updated in user_documents table!`);
      setEditingDoc(null);
      await loadResolutions();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      showNotice('error', err.message || 'Failed to update resolution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Resolution
  const handleDeleteConfirm = async () => {
    if (!deletingDoc) return;

    setIsSubmitting(true);
    try {
      await api.deleteBoardResolution(deletingDoc.doc_key || deletingDoc.id);
      showNotice('success', `Resolution ${deletingDoc.resolution_no} deleted from user_documents table.`);
      setDeletingDoc(null);
      await loadResolutions();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(err);
      showNotice('error', err.message || 'Failed to delete resolution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger file download
  const handleDownload = (doc: BoardResolution) => {
    const downloadUrl = doc.data_url || doc.url;
    if (!downloadUrl) {
      showNotice('error', 'Document file is not accessible for download.');
      return;
    }
    const a = document.createElement('a');
    a.href = resolveAssetUrl(downloadUrl);
    a.download = doc.file_name || `${doc.resolution_no}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Helper badge color for status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Adopted':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Approved':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Pending Signature':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Superseded':
        return 'bg-slate-700/50 text-slate-400 border-slate-600/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
    }
  };

  // Helper icon for file type
  const getTypeIcon = (type?: string, fileName?: string) => {
    const t = inferDocType(fileName || '', type);
    if (t === 'PDF') return <FileText className="w-4 h-4 text-rose-400 shrink-0" />;
    if (t === 'Document') return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
    if (t === 'Image') return <ImageIcon className="w-4 h-4 text-amber-400 shrink-0" />;
    if (t === 'Excel') return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Module Header */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-600/10 via-emerald-600/5 to-transparent rounded-full pointer-events-none blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Scroll className="w-4 h-4 text-blue-400" />
            <span>Cooperative Governance</span>
            <span>•</span>
            <span className="text-slate-400">Office of the Board Secretary</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">user_documents table</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center gap-2.5">
            Board Resolution Management
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold font-mono">
              {filteredResolutions.length} Recorded
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl leading-relaxed">
            Central repository for Board of Directors (BOD) resolutions, CDA regulatory policies, dividend approvals, credit limit policies, and minutes. Upload Word Docs, PDFs, or scanned signature images directly into the <strong className="text-slate-200">user_documents</strong> table with multi-category filtering.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={loadResolutions}
            disabled={isLoading}
            className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Reload</span>
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            id="btn-upload-board-resolution"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-blue-900/40 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Board Resolution</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-lg transition animate-fadeIn ${
            notice.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white cursor-pointer ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Resolutions</span>
          <div className="text-2xl font-black text-white mt-1 font-mono">{metrics.total}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Stored in user_documents</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">Approved / Adopted</span>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-mono">{metrics.adopted}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Legally binding</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">Pending Signature</span>
          <div className="text-2xl font-black text-amber-400 mt-1 font-mono">{metrics.pending}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">In review / routing</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block">PDF Resolutions</span>
          <div className="text-2xl font-black text-rose-400 mt-1 font-mono">{metrics.pdfCount}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Official scanned documents</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">Office / Word Docs</span>
          <div className="text-2xl font-black text-blue-400 mt-1 font-mono">{metrics.docCount}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">.doc, .docx templates</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">Scanned Images</span>
          <div className="text-2xl font-black text-amber-300 mt-1 font-mono">{metrics.imgCount}</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Signed copies & seals</span>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resolution # (e.g. BR-2026-001), title, signatories, meeting, keywords..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Selectors: Status, Year, View Toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Adopted">Adopted</option>
              <option value="Pending Signature">Pending Signature</option>
              <option value="Superseded">Superseded</option>
            </select>

            {/* Year Dropdown */}
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y === 'All' ? 'All Years' : `Year ${y}`}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills & File Type Filter (Fulfills Category Filter requirement) */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1 mr-1">
              <Tag className="w-3 h-3 text-blue-400" />
              <span>Category:</span>
            </span>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap border transition cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* File Format Pills */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Format:</span>
            {(['All', 'PDF', 'Document', 'Image'] as const).map(fmt => (
              <button
                key={fmt}
                onClick={() => setTypeFilter(fmt)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                  typeFilter === fmt
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {fmt === 'All' ? 'All Files' : fmt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resolutions Content (Grid or Table) */}
      {isLoading ? (
        <div className="p-16 text-center space-y-3 bg-slate-900/60 border border-slate-800 rounded-3xl">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
          <p className="text-sm text-slate-300 font-medium">Loading board resolution files from user_documents table...</p>
        </div>
      ) : filteredResolutions.length === 0 ? (
        <div className="p-16 text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-3xl">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Scroll className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Board Resolutions Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              {searchTerm || categoryFilter !== 'All' || statusFilter !== 'All'
                ? 'No board resolution files match your current category, search, or status filters.'
                : 'No board resolutions have been uploaded yet. Click the button below to upload your first resolution into the user_documents table.'}
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            {(searchTerm || categoryFilter !== 'All' || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('All');
                  setStatusFilter('All');
                  setTypeFilter('All');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium cursor-pointer"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-xl font-bold cursor-pointer shadow"
            >
              Upload Board Resolution
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResolutions.map(res => (
            <div
              key={res.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 transition shadow-md hover:shadow-xl flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Top Row: Resolution #, Status, Format Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                    {res.resolution_no}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(res.status)}`}>
                      {res.status}
                    </span>
                    <span className="flex items-center space-x-1 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
                      {getTypeIcon(res.field_type, res.file_name)}
                      <span className="font-mono">{res.field_type}</span>
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3
                    onClick={() => setPreviewDoc(res)}
                    className="text-sm font-bold text-white group-hover:text-blue-300 transition line-clamp-2 cursor-pointer"
                    title={res.title}
                  >
                    {res.title}
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                    <span className="font-medium text-emerald-400">{res.category}</span>
                    <span>•</span>
                    <span>{res.meeting_type}</span>
                  </div>
                </div>

                {/* Abstract / Notes */}
                {res.notes && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                    "{res.notes}"
                  </p>
                )}

                {/* File Attachment & Metadata */}
                <div className="pt-2 border-t border-slate-800/70 text-[11px] space-y-1 text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">File Attachment:</span>
                    <span className="truncate max-w-[170px] text-slate-300 font-mono text-[10px]" title={res.file_name}>
                      {res.file_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Date Approved:</span>
                    <span className="text-slate-300">{res.resolution_date || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Signatories:</span>
                    <span className="truncate max-w-[170px] text-slate-300 text-[10px]" title={res.signatories}>
                      {res.signatories || 'Board of Directors'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">File Size:</span>
                    <span className="text-slate-400 font-mono text-[10px]">{formatSize(res.size || res.file_size)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewDoc(res)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                  title="View and preview file"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => handleDownload(res)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                </button>

                <button
                  onClick={() => setEditingDoc(res)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition cursor-pointer"
                  title="Edit Resolution Details"
                >
                  <Edit2 className="w-4 h-4 text-amber-400" />
                </button>

                <button
                  onClick={() => setDeletingDoc(res)}
                  className="p-1.5 bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
                  title="Delete Resolution"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Resolution #</th>
                  <th className="p-3.5">Title & Subject</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Meeting Type</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">File Format</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredResolutions.map(res => (
                  <tr key={res.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-400 whitespace-nowrap">
                      {res.resolution_no}
                    </td>
                    <td className="p-3.5 max-w-sm">
                      <div
                        onClick={() => setPreviewDoc(res)}
                        className="font-semibold text-white hover:text-blue-300 cursor-pointer line-clamp-1"
                        title={res.title}
                      >
                        {res.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate" title={res.signatories}>
                        Signatories: {res.signatories || 'Board of Directors'}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 text-[11px] font-medium border border-slate-700">
                        {res.category}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap text-slate-400">
                      {res.meeting_type}
                    </td>
                    <td className="p-3.5 whitespace-nowrap font-mono text-slate-300">
                      {res.resolution_date}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadge(res.status)}`}>
                        {res.status}
                      </span>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {getTypeIcon(res.field_type, res.file_name)}
                        <span className="font-mono text-[11px] text-slate-300">{res.field_type}</span>
                        <span className="text-[10px] text-slate-500">({formatSize(res.size || res.file_size)})</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => setPreviewDoc(res)}
                          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-blue-400 rounded-lg transition cursor-pointer"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(res)}
                          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg transition cursor-pointer"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingDoc(res)}
                          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-lg transition cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingDoc(res)}
                          className="p-1.5 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 1: UPLOAD NEW BOARD RESOLUTION */}
      {/* ======================================================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <UploadCloud className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Upload Board Resolution</h3>
                  <p className="text-xs text-slate-400">Stores document into <span className="font-mono text-emerald-400">user_documents</span> table with category filtering</p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              {/* File Dropzone Area */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Resolution File Attachment <span className="text-rose-400">*</span>
                  <span className="text-slate-500 font-normal ml-2">(Docs, PDF, Images: .pdf, .docx, .doc, .png, .jpg, .webp)</span>
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/60 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.odt,.rtf,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 text-blue-400 flex items-center justify-center transition">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  {uploadFile ? (
                    <div className="text-center">
                      <p className="text-white font-bold text-xs">{uploadFile.name}</p>
                      <p className="text-[11px] text-emerald-400 mt-0.5">
                        {formatSize(uploadFile.size)} • {inferDocType(uploadFile.name, uploadFile.type)} format detected
                      </p>
                      <span className="text-[10px] text-slate-500 underline mt-1 block">Click to choose another file</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-semibold">Click or drag file here to attach resolution document</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF documents, Word .docx/.doc, scanned images .jpg/.png</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Resolution Number & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Resolution Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BR-2026-015"
                    value={uploadForm.resolution_no}
                    onChange={e => setUploadForm({ ...uploadForm, resolution_no: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Category Filter <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={e => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Credit & Lending Policy">Credit & Lending Policy</option>
                    <option value="Capital Build-Up & Dividends">Capital Build-Up & Dividends</option>
                    <option value="Governance & Appointments">Governance & Appointments</option>
                    <option value="CDA Statutory Compliance">CDA Statutory Compliance</option>
                    <option value="Operations & Branch Rules">Operations & Branch Rules</option>
                    <option value="Audit & Risk Management">Audit & Risk Management</option>
                    <option value="General Governance">General Governance</option>
                  </select>
                </div>
              </div>

              {/* Resolution Title */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Resolution Title / Official Subject <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Board Resolution Approving Updated Loan Services Fee and Lending Parameters"
                  value={uploadForm.title}
                  onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Meeting Type & Approval Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Meeting Type
                  </label>
                  <select
                    value={uploadForm.meeting_type}
                    onChange={e => setUploadForm({ ...uploadForm, meeting_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Regular Board Meeting">Regular Board Meeting</option>
                    <option value="Special Board Meeting">Special Board Meeting</option>
                    <option value="Annual General Assembly">Annual General Assembly</option>
                    <option value="Executive Committee Meeting">Executive Committee Meeting</option>
                    <option value="Audit Committee Session">Audit Committee Session</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Approval / Enactment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={uploadForm.resolution_date}
                    onChange={e => setUploadForm({ ...uploadForm, resolution_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Status & Signatories */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Enactment Status
                  </label>
                  <select
                    value={uploadForm.status}
                    onChange={e => setUploadForm({ ...uploadForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Adopted">Adopted</option>
                    <option value="Pending Signature">Pending Signature</option>
                    <option value="Superseded">Superseded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Signatories & Attesting Officers
                  </label>
                  <input
                    type="text"
                    placeholder="BOD Chairman, Corporate Secretary, etc."
                    value={uploadForm.signatories}
                    onChange={e => setUploadForm({ ...uploadForm, signatories: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Description / Summary Clauses */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Resolution Abstract & Key Clauses (Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Summary of WHEREAS and RESOLVED clauses, specific interest rates or loan services fee approved, authorized officers..."
                  value={uploadForm.notes}
                  onChange={e => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Loan Policy, Services Fee, CDA Compliance, Dividends"
                  value={uploadForm.tags}
                  onChange={e => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition cursor-pointer flex items-center space-x-2"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Save to user_documents Table</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 2: INTERACTIVE PREVIEW MODAL */}
      {/* ======================================================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
              <div className="flex items-center space-x-3 overflow-hidden">
                <span className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
                  <Scroll className="w-5 h-5" />
                </span>
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-400">{previewDoc.resolution_no}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${getStatusBadge(previewDoc.status)}`}>
                      {previewDoc.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white truncate mt-0.5" title={previewDoc.title}>
                    {previewDoc.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: File Viewer + Metadata */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* File Viewer Box */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 min-h-[300px] flex items-center justify-center">
                {String(previewDoc.field_type).toUpperCase() === 'IMAGE' && previewDoc.data_url ? (
                  <img
                    src={resolveAssetUrl(previewDoc.data_url)}
                    alt={previewDoc.title}
                    className="max-h-[460px] w-auto max-w-full rounded-xl object-contain shadow-lg mx-auto"
                  />
                ) : String(previewDoc.field_type).toUpperCase() === 'PDF' && previewDoc.data_url?.startsWith('data:application/pdf') ? (
                  <iframe
                    src={previewDoc.data_url}
                    title={previewDoc.title}
                    className="w-full h-[460px] rounded-xl border border-slate-800"
                  />
                ) : (
                  <div className="text-center p-8 space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="max-w-md mx-auto">
                      <p className="text-white font-bold text-sm">{previewDoc.file_name}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Format: <span className="font-mono text-emerald-400">{previewDoc.field_type}</span> ({formatSize(previewDoc.size || previewDoc.file_size)})
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        This document is securely stored in the <span className="font-mono text-slate-300">user_documents</span> database table. Click download to view or edit with Microsoft Word / Office.
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(previewDoc)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow inline-flex items-center space-x-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download {previewDoc.file_name}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata Details Grid */}
              <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Resolution Registry Record (user_documents)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Category</span>
                    <strong className="text-emerald-400">{previewDoc.category}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Meeting Type</span>
                    <strong className="text-white">{previewDoc.meeting_type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Date Approved</span>
                    <strong className="text-white">{previewDoc.resolution_date}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Uploaded By</span>
                    <strong className="text-slate-300">{previewDoc.uploaded_by || 'Corporate Secretary'}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 block text-[10px] mb-0.5">Signatories & Presiding Officers:</span>
                  <p className="text-xs text-slate-200 font-medium">{previewDoc.signatories || 'Board of Directors'}</p>
                </div>

                {previewDoc.notes && (
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-slate-500 block text-[10px] mb-0.5">Resolution Abstract & Clauses:</span>
                    <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                      "{previewDoc.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 3: EDIT RESOLUTION METADATA */}
      {/* ======================================================= */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold text-white">Edit Resolution Metadata</h3>
                  <p className="text-xs text-slate-400 font-mono">{editingDoc.resolution_no}</p>
                </div>
              </div>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resolution Number</label>
                <input
                  type="text"
                  required
                  value={editingDoc.resolution_no}
                  onChange={e => setEditingDoc({ ...editingDoc, resolution_no: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resolution Title</label>
                <input
                  type="text"
                  required
                  value={editingDoc.title}
                  onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={editingDoc.category}
                    onChange={e => setEditingDoc({ ...editingDoc, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Credit & Lending Policy">Credit & Lending Policy</option>
                    <option value="Capital Build-Up & Dividends">Capital Build-Up & Dividends</option>
                    <option value="Governance & Appointments">Governance & Appointments</option>
                    <option value="CDA Statutory Compliance">CDA Statutory Compliance</option>
                    <option value="Operations & Branch Rules">Operations & Branch Rules</option>
                    <option value="Audit & Risk Management">Audit & Risk Management</option>
                    <option value="General Governance">General Governance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status</label>
                  <select
                    value={editingDoc.status}
                    onChange={e => setEditingDoc({ ...editingDoc, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Adopted">Adopted</option>
                    <option value="Pending Signature">Pending Signature</option>
                    <option value="Superseded">Superseded</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Signatories</label>
                <input
                  type="text"
                  value={editingDoc.signatories || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, signatories: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Abstract / Clauses (Notes)</label>
                <textarea
                  rows={2}
                  value={editingDoc.notes || ''}
                  onChange={e => setEditingDoc({ ...editingDoc, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center space-x-1.5"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL 4: DELETE CONFIRMATION */}
      {/* ======================================================= */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <span className="p-2.5 bg-rose-500/20 rounded-xl">
                <AlertCircle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white">Delete Board Resolution?</h3>
                <p className="text-xs text-rose-300 font-mono">{deletingDoc.resolution_no}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-white">{deletingDoc.title}</strong>? This will remove the resolution record and attached file from the <span className="font-mono text-emerald-400">user_documents</span> table.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs rounded-xl font-bold flex items-center space-x-1.5"
              >
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
