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
  UserCheck,
  Shield,
  Layers,
  Sparkles,
  Calendar,
  HardDrive,
  RefreshCw,
  X,
  Check,
  Tag,
  Building2,
  User as UserIcon,
  ChevronRight,
  HelpCircle,
  FileCheck2,
  FileType,
  ArrowUpDown
} from 'lucide-react';
import { User, UserDocument, CustomField, Branch } from '../../types';
import { api, getApiBase } from '../../services/api';

const resolveDocumentUrl = (path: string) =>
  new URL(path, new URL(getApiBase(), window.location.origin)).toString();

const inferDocumentType = (mimeType: string, fileName: string): UserDocument['field_type'] => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (mimeType === 'application/pdf' || extension === 'pdf') return 'PDF';
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    ['xlsx', 'xls', 'csv'].includes(extension || '')
  ) return 'Excel';
  if (
    mimeType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(extension || '')
  ) return 'Image';
  if (
    mimeType.includes('word') ||
    mimeType.startsWith('text/') ||
    ['doc', 'docx', 'txt', 'rtf'].includes(extension || '')
  ) return 'Document';
  return 'File';
};

const normalizeUserDocuments = (response: { data?: unknown; documents?: unknown }, userId: string): UserDocument[] => {
  const data = response.data;
  let entries: Array<[string, unknown]> = [];

  if (Array.isArray(data)) {
    entries = data.map((doc, index) => [String(index), doc]);
  } else if (data && typeof data === 'object') {
    const dataObject = data as Record<string, unknown>;
    if (Array.isArray(dataObject.documents)) {
      entries = dataObject.documents.map((doc, index) => [String(index), doc]);
    } else {
      entries = Object.entries(dataObject).filter(([, doc]) => doc !== null && typeof doc === 'object');
    }
  }
  if (entries.length === 0 && Array.isArray(response.documents)) {
    entries = response.documents.map((doc, index) => [String(index), doc]);
  }

  return entries.map(([key, value]) => {
    const doc = value as Record<string, unknown>;
    const fileName = String(doc.file_name || doc.name || 'document');
    const mimeType = String(doc.file_type || doc.type || '');
    const path = typeof doc.path === 'string' ? doc.path : '';
    const url = typeof doc.url === 'string' ? doc.url : path;
    const documentId = String(doc.id || key);

    return {
      ...doc,
      id: documentId,
      entity: 'User',
      user_id: String(doc.user_id || userId),
      field_name: String(doc.field_name || key),
      field_key: String(doc.field_key || key),
      field_label: String(doc.field_label || doc.title || doc.name || fileName),
      label: String(doc.label || doc.name || fileName),
      field_type: String(doc.field_type || inferDocumentType(mimeType, fileName)),
      category: String(doc.category || 'General Attachments'),
      file_name: fileName,
      name: String(doc.name || fileName),
      file_type: mimeType,
      file_size: Number(doc.file_size || doc.size || 0),
      size: Number(doc.size || doc.file_size || 0),
      path,
      url: url ? resolveDocumentUrl(url) : undefined,
      uploaded_at: String(doc.uploaded_at || '')
    } as UserDocument;
  });
};

interface UserDocumentManagementModuleProps {
  currentUser: User;
  users?: User[];
  branches?: Branch[];
  onRefresh?: () => void;
}

export const UserDocumentManagementModule: React.FC<UserDocumentManagementModuleProps> = ({
  currentUser,
  users = [],
  branches = [],
  onRefresh
}) => {
  // Active User scope (default to currentUser)
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [userList, setUserList] = useState<User[]>(users.length > 0 ? users : [currentUser]);
  
  // Documents & Custom Fields state
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Tab: 'all_documents' | 'user_checklist' | 'custom_definitions'
  const [viewTab, setViewTab] = useState<'all_documents' | 'user_checklist' | 'custom_definitions'>('all_documents');

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'PDF' | 'Excel' | 'Document' | 'Image' | 'File'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<UserDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<UserDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<UserDocument | null>(null);
  const [isAddCustomFieldModalOpen, setIsAddCustomFieldModalOpen] = useState(false);

  // Upload Form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileDataUrl, setUploadFileDataUrl] = useState<string>('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Identification & KYC');
  const [uploadFieldKey, setUploadFieldKey] = useState('');
  const [uploadNotes, setUploadNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Field Form state (for Entity: 'User')
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'PDF' | 'Excel' | 'Document' | 'Image' | 'File' | 'Text'>('PDF');
  const [newFieldCategory, setNewFieldCategory] = useState('Identification & KYC');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 5000);
  };

  // Find the currently targeted user object
  const targetUser = useMemo(() => {
    return userList.find(u => u.id === selectedUserId) || currentUser;
  }, [userList, selectedUserId, currentUser]);

  // Load user list
  const loadUsers = async () => {
    try {
      const res = await api.getUsersList();
      if (res && res.data && res.data.length > 0) {
        setUserList(res.data);
      }
    } catch (e) {
      console.warn('Failed to fetch user list:', e);
    }
  };

  // Load documents and user custom fields definitions
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch user documents from API (stores to user_documents table)
      const userId = selectedUserId || currentUser.id;
      const docRes = await api.getUserDocuments(userId);
      if (docRes.success === false) {
        throw new Error('Failed to load documents');
      }
      setDocuments(normalizeUserDocuments(docRes, userId));

      // 2. Fetch User entity custom fields definitions
      const cfRes = await api.getUserCustomFields();
      if (cfRes && cfRes.data) {
        // filter out uploaded doc instances (which have user_id), only keep schema definitions
        const defs = cfRes.data.filter((f: any) => !f.user_id && f.entity === 'User');
        setCustomFieldDefs(defs);
      }
    } catch (err: any) {
      console.error('Error loading user document data:', err);
      showNotice('error', err.message || 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedUserId]);

  // Filtered documents list for the active user (or all users if desired)
  const userFilteredDocs = useMemo(() => {
    return documents.filter(d => !d.user_id || d.user_id === selectedUserId || (targetUser && d.user_id === targetUser.username));
  }, [documents, selectedUserId, targetUser]);

  const displayedDocs = useMemo(() => {
    return userFilteredDocs.filter(doc => {
      // Category filter
      if (categoryFilter !== 'All' && doc.category !== categoryFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'All') {
        const docType = String(doc.field_type || '').toUpperCase();
        if (typeFilter === 'PDF' && docType !== 'PDF') return false;
        if (typeFilter === 'EXCEL' && docType !== 'EXCEL') return false;
        if (typeFilter === 'DOCUMENT' && docType !== 'DOCUMENT') return false;
        if (typeFilter === 'IMAGE' && docType !== 'IMAGE') return false;
        if (typeFilter === 'FILE' && docType !== 'FILE') return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const title = (doc.field_label || doc.label || '').toLowerCase();
        const fileName = (doc.file_name || doc.name || '').toLowerCase();
        const category = (doc.category || '').toLowerCase();
        const notes = (doc.notes || '').toLowerCase();
        if (!title.includes(query) && !fileName.includes(query) && !category.includes(query) && !notes.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [userFilteredDocs, categoryFilter, typeFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = userFilteredDocs.length;
    let totalBytes = 0;
    let pdfCount = 0;
    let excelCount = 0;
    let docCount = 0;
    let imageCount = 0;
    let otherCount = 0;

    userFilteredDocs.forEach(d => {
      const size = Number(d.file_size || d.size || 0);
      totalBytes += size;
      const type = String(d.field_type || '').toUpperCase();
      if (type === 'PDF') pdfCount++;
      else if (type === 'EXCEL') excelCount++;
      else if (type === 'DOCUMENT') docCount++;
      else if (type === 'IMAGE') imageCount++;
      else otherCount++;
    });

    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 KB';
      const k = 1024;
      const dm = 1;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };

    return {
      totalCount,
      totalSizeStr: formatBytes(totalBytes),
      pdfCount,
      excelCount,
      docCount,
      imageCount,
      otherCount
    };
  }, [userFilteredDocs]);

  // Available categories
  const categories = [
    'All',
    'Identification & KYC',
    'Employment & Contracts',
    'Spreadsheets & Worksheets',
    'Financials & Tax Records',
    'Certifications & Trainings',
    'Legal & Governance',
    'General Attachments'
  ];

  // Helper to format file size
  const formatSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Helper to render type icons & colors
  const getTypeBadge = (type?: string, fileName?: string) => {
    const normalized = (type || '').toUpperCase();
    if (normalized === 'PDF' || fileName?.toLowerCase().endsWith('.pdf')) {
      return {
        label: 'PDF',
        icon: FileText,
        bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
      };
    }
    if (normalized === 'EXCEL' || ['xlsx', 'xls', 'csv'].some(ext => fileName?.toLowerCase().endsWith(ext))) {
      return {
        label: 'EXCEL',
        icon: FileSpreadsheet,
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
      };
    }
    if (normalized === 'DOCUMENT' || ['docx', 'doc', 'txt', 'rtf'].some(ext => fileName?.toLowerCase().endsWith(ext))) {
      return {
        label: 'DOC',
        icon: FileText,
        bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
      };
    }
    if (normalized === 'IMAGE' || ['png', 'jpg', 'jpeg', 'webp', 'svg'].some(ext => fileName?.toLowerCase().endsWith(ext))) {
      return {
        label: 'IMAGE',
        icon: ImageIcon,
        bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
      };
    }
    return {
      label: 'FILE',
      icon: File,
      bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30'
    };
  };

  // Handle File selection and FileReader
  const handleFileChange = (file: File) => {
    if (file.size > 50 * 1024 * 1024) {
      showNotice('error', 'File size exceeds maximum 50MB limit.');
      return;
    }

    setUploadFile(file);
    if (!uploadTitle) {
      // Suggest title from file name
      const clean = file.name.replace(/\.[^/.]+$/, '').replace(/[_\\-]/g, ' ');
      setUploadTitle(clean.charAt(0).toUpperCase() + clean.slice(1));
    }

    // Auto-select category and type based on extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      setUploadCategory('Spreadsheets & Worksheets');
    } else if (ext === 'pdf') {
      if (!uploadCategory || uploadCategory === 'All') setUploadCategory('Identification & KYC');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadFileDataUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Reset upload form
  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadFileDataUrl('');
    setUploadTitle('');
    setUploadCategory('Identification & KYC');
    setUploadFieldKey('');
    setUploadNotes('');
  };

  // Submit Upload to API
  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile && !uploadFileDataUrl) {
      showNotice('error', 'Please select or drop a file to upload.');
      return;
    }
    if (!uploadTitle.trim()) {
      showNotice('error', 'Please provide a document title.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        user_id: selectedUserId,
        title: uploadTitle.trim(),
        doc_key: uploadFieldKey || `udoc_${Date.now()}`,
        name: uploadFile?.name || `${uploadTitle}.bin`,
        category: uploadCategory,
        file_type: uploadFile?.type || 'application/octet-stream',
        type: uploadFile?.type || 'application/octet-stream',
        size: uploadFile?.size || 0,
        dataUrl: uploadFileDataUrl,
        notes: uploadNotes.trim(),
        performed_by: currentUser.name || currentUser.username
      };

      const res = await api.uploadUserDocument(selectedUserId, payload);
      if (res.success) {
        showNotice('success', `Document "${uploadTitle}" successfully stored in database under user_documents table.`);
        setIsUploadModalOpen(false);
        resetUploadForm();
        await loadData();
        if (onRefresh) onRefresh();
      } else {
        throw new Error(res.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      showNotice('error', err.message || 'Failed to upload document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Edit Metadata
  const handleSaveEdit = async () => {
    if (!editingDoc) return;
    setIsSubmitting(true);
    try {
      const res = await api.updateUserDocument(editingDoc.id, {
        title: editingDoc.field_label || editingDoc.label,
        category: editingDoc.category,
        notes: editingDoc.notes,
        performed_by: currentUser.name
      });
      if (res.success) {
        showNotice('success', 'Document updated successfully.');
        setEditingDoc(null);
        await loadData();
      } else {
        throw new Error(res.message || 'Update failed');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingDoc) return;
    setIsSubmitting(true);
    try {
      const res = await api.deleteUserDocument(deletingDoc.id);
      if (res.success) {
        showNotice('success', `Document "${deletingDoc.field_label}" deleted from custom_fields table.`);
        setDeletingDoc(null);
        if (previewDoc?.id === deletingDoc.id) setPreviewDoc(null);
        await loadData();
      } else {
        throw new Error(res.message || 'Deletion failed');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to delete document.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Download document
  const handleDownload = (doc: UserDocument) => {
    try {
      const link = document.createElement('a');
      link.href = doc.data_url || doc.dataUrl || doc.url || doc.path || '';
      link.download = doc.file_name || doc.name || `${doc.field_label || 'document'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download error:', err);
      showNotice('error', 'Could not initiate download.');
    }
  };

  // Create new Custom Field Definition for entity = 'User'
  const handleCreateCustomFieldDef = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldLabel.trim()) {
      showNotice('error', 'Field label is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const key = (newFieldName || newFieldLabel).toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
      const res = await api.createUserCustomField({
        entity: 'User', // explicitly set User as entity
        field_name: key,
        field_label: newFieldLabel.trim(),
        field_type: newFieldType,
        required: newFieldRequired,
        category: newFieldCategory,
        options: [newFieldCategory],
        changed_by: currentUser.name || currentUser.username,
        reason: 'Added new user document requirement'
      });

      if (res.success) {
        showNotice('success', `New document field "${newFieldLabel}" added to custom_fields table (entity: User).`);
        setIsAddCustomFieldModalOpen(false);
        setNewFieldLabel('');
        setNewFieldName('');
        setNewFieldType('PDF');
        setNewFieldRequired(false);
        await loadData();
      } else {
        throw new Error(res.message || 'Failed to create field');
      }
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to create custom field definition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md transition animate-in fade-in slide-in-from-bottom-2 ${
            notice.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{notice.message}</span>
          <button
            onClick={() => setNotice(null)}
            className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <FolderOpen className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  User Document Management
                  <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    custom_fields [entity: User]
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Secure upload, management, and CDA audit preservation of PDF documents, Excel workbooks, Word docs, images, and user account records.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons & Account Selector */}
          <div className="flex flex-wrap items-center gap-3">
            {/* User Account Scope Selector */}
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
              <UserIcon className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="text-xs">
                <span className="text-slate-400 text-[10px] block leading-tight">Account:</span>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  {userList.map(u => (
                    <option key={u.id} value={u.id} className="bg-slate-900 text-white">
                      {u.name || u.username} ({u.role_name || u.role_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                resetUploadForm();
                setIsUploadModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Document</span>
            </button>

            <button
              onClick={() => setIsAddCustomFieldModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition cursor-pointer"
              title="Add new document slot requirement for User entity"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Add Custom Doc Slot</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Total Files</span>
            <div className="text-lg font-bold text-white mt-0.5">{stats.totalCount}</div>
            <span className="text-[10px] text-slate-500">In user account</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Storage Used</span>
            <div className="text-lg font-bold text-blue-400 mt-0.5">{stats.totalSizeStr}</div>
            <span className="text-[10px] text-slate-500">Database payload</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">PDF Documents</span>
            <div className="text-lg font-bold text-rose-400 mt-0.5">{stats.pdfCount}</div>
            <span className="text-[10px] text-slate-500">Official documents</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Excel Worksheets</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{stats.excelCount}</div>
            <span className="text-[10px] text-slate-500">Data sheets & xlsx</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Word & Text</span>
            <div className="text-lg font-bold text-blue-400 mt-0.5">{stats.docCount}</div>
            <span className="text-[10px] text-slate-500">Docs, notes, cv</span>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[11px] text-slate-400 block">Images & Photos</span>
            <div className="text-lg font-bold text-purple-400 mt-0.5">{stats.imageCount}</div>
            <span className="text-[10px] text-slate-500">Photos, scans, badges</span>
          </div>
        </div>
      </div>

      {/* Main Module Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewTab('all_documents')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
              viewTab === 'all_documents'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Uploaded Files ({displayedDocs.length})</span>
          </button>

          <button
            onClick={() => setViewTab('user_checklist')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
              viewTab === 'user_checklist'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Document Checklist & Slots ({customFieldDefs.length})</span>
          </button>

          <button
            onClick={() => setViewTab('custom_definitions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-2 ${
              viewTab === 'custom_definitions'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Custom Fields Schema (User)</span>
          </button>
        </div>

        {/* View mode toggle (only for documents list) */}
        {viewTab === 'all_documents' && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                viewMode === 'grid'
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg border text-xs cursor-pointer transition ${
                viewMode === 'table'
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={() => loadData()}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* ================= TAB 1: ALL DOCUMENTS REPOSITORY ================= */}
      {viewTab === 'all_documents' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search file name, label, category, notes..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
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

            {/* Category Filter Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 shrink-0">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* File Type Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(['All', 'PDF', 'Excel', 'Document', 'Image', 'File'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition cursor-pointer ${
                    typeFilter === t
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="p-16 text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-300 font-medium">Loading documents from custom_fields table...</p>
            </div>
          ) : displayedDocs.length === 0 ? (
            /* Empty State */
            <div className="p-12 text-center space-y-4 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center mx-auto text-slate-400">
                <FolderOpen className="w-7 h-7 text-blue-400" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-white">No documents uploaded yet</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {userFilteredDocs.length === 0
                    ? `No files attached to account "${targetUser.name || targetUser.username}". Click the button below to upload your first document.`
                    : 'No documents match the current search or category filters.'}
                </p>
              </div>
              <button
                onClick={() => {
                  resetUploadForm();
                  setIsUploadModalOpen(true);
                }}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload First Document</span>
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedDocs.map(doc => {
                const badge = getTypeBadge(doc.field_type, doc.file_name || doc.name);
                const IconComponent = badge.icon;
                const isImage = (doc.field_type || '').toUpperCase() === 'IMAGE' || (doc.file_type || '').startsWith('image/');
                const hasDataUrl = Boolean(doc.data_url || doc.dataUrl || doc.url);

                return (
                  <div
                    key={doc.id}
                    className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 transition duration-200 flex flex-col justify-between shadow-lg hover:shadow-blue-500/5"
                  >
                    <div>
                      {/* Top Header: Badge & Quick Actions */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                          <IconComponent className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>

                        <div className="flex items-center space-x-1 opacity-80 group-hover:opacity-100 transition">
                          <button
                            onClick={() => setPreviewDoc(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Preview file"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Download file"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingDoc(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Edit metadata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingDoc(doc)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* File Thumbnail / Preview Card */}
                      <div
                        onClick={() => setPreviewDoc(doc)}
                        className="w-full h-32 rounded-xl bg-slate-950 border border-slate-800/80 mb-3 flex items-center justify-center overflow-hidden cursor-pointer relative group-hover:border-slate-700 transition"
                      >
                        {isImage && hasDataUrl ? (
                          <img
                            src={doc.data_url || doc.dataUrl || doc.url}
                            alt={doc.field_label}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        ) : (
                          <div className="text-center space-y-1.5 p-3">
                            <IconComponent className="w-10 h-10 mx-auto text-slate-600 group-hover:text-blue-400 transition" />
                            <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                              {doc.file_name || doc.name || 'File'}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                          <span className="text-[11px] font-semibold bg-slate-900/90 text-white px-2.5 py-1 rounded-lg border border-slate-700 shadow">
                            Click to View
                          </span>
                        </div>
                      </div>

                      {/* Document Details */}
                      <div className="space-y-1">
                        <h4 className="text-xs font-semibold text-white truncate" title={doc.field_label || doc.label}>
                          {doc.field_label || doc.label || 'Document'}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate" title={doc.file_name || doc.name}>
                          {doc.file_name || doc.name}
                        </p>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="inline-flex items-center space-x-1 truncate max-w-[110px]" title={doc.category}>
                          <Tag className="w-2.5 h-2.5 text-blue-400 shrink-0" />
                          <span className="truncate">{doc.category || 'General'}</span>
                        </span>
                        <span className="text-slate-500 font-mono">
                          {formatSize(doc.file_size || doc.size)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="truncate">By {doc.uploaded_by || 'User'}</span>
                        <span>{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : ''}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                      <th className="py-3 px-4">Document Title & Name</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Uploaded By</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {displayedDocs.map(doc => {
                      const badge = getTypeBadge(doc.field_type, doc.file_name || doc.name);
                      const IconComponent = badge.icon;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-lg border shrink-0 ${badge.bg}`}>
                                <IconComponent className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-white block truncate">
                                  {doc.field_label || doc.label}
                                </span>
                                <span className="text-[11px] text-slate-400 block truncate">
                                  {doc.file_name || doc.name}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                              <span>{badge.label}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-slate-300">{doc.category || 'General'}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {formatSize(doc.file_size || doc.size)}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {doc.uploaded_by || 'User'}
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Preview"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownload(doc)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingDoc(doc)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingDoc(doc)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: USER DOCUMENT CHECKLIST & SLOTS ================= */}
      {viewTab === 'user_checklist' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Document Compliance Checklist for {targetUser.name || targetUser.username}</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                    {targetUser.role_name || targetUser.role_id}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pre-configured and dynamic document slots defined in <code className="text-blue-300">custom_fields</code> table with <code className="text-emerald-300">entity: 'User'</code>.
                </p>
              </div>

              <button
                onClick={() => setIsAddCustomFieldModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Define New Slot</span>
              </button>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customFieldDefs.map(def => {
                // Check if target user has uploaded a file for this field key/name
                const uploaded = userFilteredDocs.find(d => 
                  d.field_name === def.field_name || 
                  d.field_name === def.id || 
                  d.field_label === def.field_label
                );

                const isCompleted = Boolean(uploaded);
                const badge = getTypeBadge(def.field_type, def.field_name);
                const IconComponent = badge.icon;

                return (
                  <div
                    key={def.id}
                    className={`rounded-xl border p-4 transition ${
                      isCompleted
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : def.required
                        ? 'bg-rose-950/10 border-rose-500/30'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-lg border shrink-0 ${badge.bg}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white truncate max-w-[180px]">
                            {def.field_label || def.label}
                          </h4>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {def.field_name}
                          </span>
                        </div>
                      </div>

                      {isCompleted ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Uploaded</span>
                        </span>
                      ) : def.required ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                          <AlertCircle className="w-3 h-3" />
                          <span>Required</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                          Optional
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      {isCompleted && uploaded ? (
                        <div className="flex items-center space-x-2 text-[11px] text-slate-400 truncate">
                          <span className="truncate text-white font-medium">{uploaded.file_name}</span>
                          <button
                            onClick={() => setPreviewDoc(uploaded)}
                            className="text-blue-400 hover:underline shrink-0"
                          >
                            View
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No document attached yet</span>
                      )}

                      <button
                        onClick={() => {
                          resetUploadForm();
                          setUploadTitle(def.field_label || def.label);
                          setUploadFieldKey(def.field_name);
                          if (def.options && def.options[0]) {
                            setUploadCategory(def.options[0]);
                          }
                          setIsUploadModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white rounded-lg text-[11px] font-medium transition cursor-pointer shrink-0"
                      >
                        {isCompleted ? 'Replace' : 'Upload'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: CUSTOM FIELDS SCHEMA DEFINITIONS ================= */}
      {viewTab === 'custom_definitions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>custom_fields Table Registry [entity = 'User']</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configuration schema defining which custom fields and document types are assigned to User entities.
                </p>
              </div>

              <button
                onClick={() => setIsAddCustomFieldModalOpen(true)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New User Field</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-medium">
                    <th className="py-3 px-4">Field ID</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Field Name / Key</th>
                    <th className="py-3 px-4">Display Label</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Requirement</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {customFieldDefs.map(def => (
                    <tr key={def.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-blue-300">{def.id}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          {def.entity}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-200">{def.field_name}</td>
                      <td className="py-3 px-4 font-medium text-white">{def.field_label || def.label}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                          {def.field_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {def.required ? (
                          <span className="text-rose-400 font-semibold">Mandatory</span>
                        ) : (
                          <span className="text-slate-400">Optional</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPLOAD NEW DOCUMENT ================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <UploadCloud className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Upload User Document</h3>
                  <p className="text-xs text-slate-400">
                    Stores in database <code className="text-emerald-300">custom_fields</code> table with <code className="text-emerald-300">entity: 'User'</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitUpload} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Target User Info */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs">
                  <UserIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400">Account Target:</span>
                  <span className="text-white font-semibold">{targetUser.name || targetUser.username}</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {targetUser.id}
                </span>
              </div>

              {/* Drag and Drop Dropzone */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Select or Drop File (Docs, PDF, Excel, Image, etc.) *
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-500/10'
                      : uploadFile
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileChange(e.target.files[0]);
                      }
                    }}
                  />

                  {uploadFile ? (
                    <div className="space-y-1">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="font-semibold text-white text-xs truncate max-w-xs">{uploadFile.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{formatSize(uploadFile.size)}</div>
                      <span className="text-[10px] text-blue-400 hover:underline block pt-1">Click to choose another file</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-semibold text-white">Click or drag & drop files here</div>
                      <p className="text-[11px] text-slate-400">
                        Supports PDF, Excel (.xlsx, .csv), Word (.docx, .doc), Images (.png, .jpg), and others up to 50MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Document Title / Display Label *
                </label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. 2026 Employment Appointment, Government ID Copy"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Category & Slot selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Category Classification
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Bind to Custom Field Slot (Optional)
                  </label>
                  <select
                    value={uploadFieldKey}
                    onChange={(e) => setUploadFieldKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">Auto-generate new slot</option>
                    {customFieldDefs.map(def => (
                      <option key={def.id} value={def.field_name}>
                        {def.field_label || def.label} ({def.field_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes / Remarks */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Additional context, expiry dates, or issuance details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !uploadFile}
                  className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Upload & Store</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PREVIEW DOCUMENT ================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg border ${getTypeBadge(previewDoc.field_type, previewDoc.file_name).bg}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white truncate max-w-md">
                    {previewDoc.field_label || previewDoc.label}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {previewDoc.file_name} • {formatSize(previewDoc.file_size || previewDoc.size)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownload(previewDoc)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Body */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-950/60 min-h-[360px]">
              {String(previewDoc.field_type).toUpperCase() === 'IMAGE' || (previewDoc.file_type || '').startsWith('image/') ? (
                <div className="max-w-full max-h-[60vh] overflow-hidden rounded-xl border border-slate-800 shadow-xl bg-slate-900 flex items-center justify-center">
                  <img
                    src={previewDoc.data_url || previewDoc.dataUrl || previewDoc.url}
                    alt={previewDoc.field_label}
                    className="max-h-[58vh] object-contain"
                  />
                </div>
              ) : String(previewDoc.field_type).toUpperCase() === 'PDF' && (previewDoc.data_url || previewDoc.dataUrl || previewDoc.url || previewDoc.path) ? (
                <iframe
                  src={previewDoc.data_url || previewDoc.dataUrl || previewDoc.url || previewDoc.path}
                  title={previewDoc.field_label}
                  className="w-full h-[60vh] rounded-xl border border-slate-800"
                />
              ) : (
                <div className="p-8 text-center space-y-3 bg-slate-900/80 border border-slate-800 rounded-2xl max-w-md">
                  <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border ${getTypeBadge(previewDoc.field_type, previewDoc.file_name).bg}`}>
                    <FileSpreadsheet className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{previewDoc.field_label}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">{previewDoc.file_name}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      Document format: {previewDoc.field_type} ({previewDoc.file_type || 'octet-stream'})
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownload(previewDoc)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download to Open Locally</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer Metadata */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center space-x-4">
                <span>Category: <strong className="text-slate-200">{previewDoc.category}</strong></span>
                <span>Entity: <strong className="text-emerald-400">User</strong></span>
                <span>Uploaded by: <strong className="text-slate-200">{previewDoc.uploaded_by || 'User'}</strong></span>
              </div>
              <div>
                Uploaded on: {previewDoc.uploaded_at ? new Date(previewDoc.uploaded_at).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT METADATA ================= */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <span>Edit Document Metadata</span>
              </h3>
              <button onClick={() => setEditingDoc(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Document Title</label>
                <input
                  type="text"
                  value={editingDoc.field_label || editingDoc.label}
                  onChange={(e) => setEditingDoc({ ...editingDoc, field_label: e.target.value, label: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Category</label>
                <select
                  value={editingDoc.category}
                  onChange={(e) => setEditingDoc({ ...editingDoc, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Remarks / Notes</label>
                <textarea
                  rows={2}
                  value={editingDoc.notes || ''}
                  onChange={(e) => setEditingDoc({ ...editingDoc, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deletingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Document?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently delete <strong className="text-white">"{deletingDoc.field_label}"</strong> from database custom_fields table?
              </p>
            </div>

            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDoc(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CUSTOM FIELD (ENTITY: USER) ================= */}
      {isAddCustomFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <Plus className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Add Custom Document Field</h3>
                  <span className="text-[10px] text-emerald-400 font-mono">Stores in custom_fields (entity: User)</span>
                </div>
              </div>
              <button onClick={() => setIsAddCustomFieldModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomFieldDef} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Field Display Label *</label>
                <input
                  type="text"
                  required
                  value={newFieldLabel}
                  onChange={(e) => {
                    setNewFieldLabel(e.target.value);
                    if (!newFieldName) {
                      setNewFieldName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
                    }
                  }}
                  placeholder="e.g. Professional PRC License, Annual Clearance"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">Internal Field Key (Slug)</label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  placeholder="e.g. prc_license"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Accepted File Type</label>
                  <select
                    value={newFieldType}
                    onChange={(e: any) => setNewFieldType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="Excel">Excel / Spreadsheet</option>
                    <option value="Document">Word / Docs</option>
                    <option value="Image">Photo / Image</option>
                    <option value="File">Any File / Attachment</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Category</label>
                  <select
                    value={newFieldCategory}
                    onChange={(e) => setNewFieldCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-1 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="chk-field-required"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-0"
                />
                <label htmlFor="chk-field-required" className="text-xs text-slate-300 cursor-pointer">
                  Mark as mandatory / required document for User accounts
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddCustomFieldModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl"
                >
                  Create Field
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
