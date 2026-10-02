import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  X,
  Check,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  LayoutGrid,
  FileText,
  UserPlus,
  Sparkles,
  Wand2,
  RefreshCw,
  Sliders,
  Edit2,
  Tag,
  Download,
  UserCheck
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { MemberTransactionReport } from '../reports/MemberTransactionReport';
import { MemberExportModal, formatMemberFullName } from './MemberExportModal';
import { api } from '../../services/api';
import { Branch, CustomField, Member, MemberType, User } from '../../types';

interface MembersModuleProps {
  branches: Branch[];
  memberTypes: MemberType[];
  customFields: CustomField[];
  currentUser: User;
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
  onNavigateToFields?: () => void;
  onNavigateToProfile?: (memberId: string) => void;
}

export const MembersModule: React.FC<MembersModuleProps> = ({
  branches,
  memberTypes,
  customFields,
  currentUser,
  selectedBranchId,
  onSelectBranch,
  onNavigateToFields,
  onNavigateToProfile
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'excel' | 'cards' | 'report'>('excel');

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

  const memberCols: ExcelColumn<Member>[] = [
    {
      key: 'member_no',
      header: 'Member ID',
      width: '130px',
      type: 'badge',
      align: 'center',
      sortable: true,
      badgeColor: () => 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    },
    {
      key: 'first_name',
      header: 'Full Name',
      width: '240px',
      type: 'text',
      sortable: true,
      accessor: (row: Member) => formatMemberFullName(row),
      render: (_, row) => (
        <span className="font-semibold text-white">
          {formatMemberFullName(row)}
        </span>
      )
    },
    {
      key: 'tin_number',
      header: 'TIN Number',
      width: '160px',
      type: 'text',
      align: 'center',
      sortable: true,
      render: (_, row) => {
        const tin = row.tin_number || row.tin || row.custom_field_values?.tin_number;
        return tin ? (
          <span className="font-mono text-amber-300 font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px]">
            {tin}
          </span>
        ) : (
          <span className="text-slate-500 text-[11px] italic">Not Set</span>
        );
      }
    },
    { key: 'branch_name', header: 'Branch Assigned', width: '180px', type: 'text', sortable: true },
    {
      key: 'member_type_name',
      header: 'Membership Tier',
      width: '140px',
      type: 'badge',
      sortable: true,
      badgeColor: () => 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    },
    { key: 'phone', header: 'Contact Telephone', width: '150px', type: 'text' },
    { key: 'email', header: 'Email Address', width: '200px', type: 'text' },
    { key: 'address', header: 'Residence Address', width: '260px', type: 'text' },
    {
      key: 'notes',
      header: 'Notes / Remarks',
      width: '240px',
      type: 'text',
      sortable: true,
      render: (_, row) => {
        const notes = row.notes || row.custom_field_values?.notes;
        return notes ? (
          <div className="flex items-center space-x-1.5 max-w-[230px]" title={notes}>
            <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate text-slate-200 text-xs">
              {notes}
            </span>
          </div>
        ) : (
          <span className="text-slate-500 text-[11px] italic">No notes</span>
        );
      }
    },
    { key: 'joined_date', header: 'Date Enrolled', width: '120px', type: 'date', align: 'center', sortable: true },
    { key: 'active', header: 'Status', width: '90px', type: 'boolean', align: 'center', sortable: true },
    {
      key: 'id',
      header: 'Actions',
      width: '160px',
      align: 'center',
      render: (_, row) => (
        <div className="flex items-center justify-center space-x-1.5">
          <button
            onClick={() => onNavigateToProfile ? onNavigateToProfile(row.id) : handleOpenEdit(row)}
            className="px-2 py-1 bg-emerald-950/40 hover:bg-emerald-800/60 text-emerald-300 hover:text-white rounded text-[11px] font-medium flex items-center space-x-1 border border-emerald-500/30 cursor-pointer transition shadow-xs"
            title="View Member Profile & Attached Files"
          >
            <UserCheck className="w-3 h-3 text-emerald-400" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => handleOpenEdit(row)}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded text-[11px] font-medium flex items-center space-x-1 cursor-pointer transition"
            title="Edit Member & TIN"
          >
            <Edit2 className="w-3 h-3 text-cyan-400" />
            <span>Edit</span>
          </button>
        </div>
      )
    }
  ];

  const [form, setForm] = useState({
    branch_id: branches[0]?.id || 'branch_tar',
    member_type_id: memberTypes[0]?.id || 'mt_regular',
    first_name: '',
    last_name: '',
    middle_name: '',
    gender: 'Female',
    birthdate: '1992-05-15',
    email: '',
    phone: '',
    address: '',
    tin_number: '',
    notes: '',
    custom_field_values: {} as Record<string, any>
  });

  const [editForm, setEditForm] = useState({
    id: '',
    branch_id: '',
    member_type_id: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    gender: 'Female',
    birthdate: '1990-01-01',
    email: '',
    phone: '',
    address: '',
    tin_number: '',
    notes: '',
    custom_field_values: {} as Record<string, any>
  });

  const handleOpenEdit = (m: Member) => {
    setEditingMember(m);
    const tin = m.tin_number || m.tin || m.custom_field_values?.tin_number || '';
    const notes = m.notes || m.custom_field_values?.notes || '';
    setEditForm({
      id: m.id,
      branch_id: m.branch_id || branches[0]?.id || 'branch_tar',
      member_type_id: m.member_type_id || memberTypes[0]?.id || 'mt_regular',
      first_name: m.first_name || '',
      last_name: m.last_name || '',
      middle_name: m.middle_name || '',
      gender: m.gender || 'Female',
      birthdate: m.birthdate || '1990-01-01',
      email: m.email || '',
      phone: m.phone || '',
      address: m.address || '',
      tin_number: tin,
      notes: notes,
      custom_field_values: { ...(m.custom_field_values || {}), tin_number: tin, notes: notes }
    });
    setIsEditing(true);
  };

  const loadMembers = async () => {
    setIsLoading(true);
    try {
      const res = await api.getMembers();
      const raw = (res as any)?.data !== undefined ? (res as any).data : res;
      let list: Member[] = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object') {
        if (Array.isArray((raw as any).members)) {
          list = (raw as any).members;
        } else if (Array.isArray((raw as any).data)) {
          list = (raw as any).data;
        } else {
          const values = Object.values(raw);
          if (values.length > 0 && values.every(v => v && typeof v === 'object')) {
            list = values as Member[];
          }
        }
      }
      setMembers(list);
    } catch (err) {
      console.error('Failed to load members:', err);
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    const handleDataChanged = () => loadMembers();
    window.addEventListener('coop:data-changed', handleDataChanged);
    return () => window.removeEventListener('coop:data-changed', handleDataChanged);
  }, []);

  const handleSeedSample = async () => {
    setIsSeeding(true);
    try {
      await api.seedSampleMembers();
      setNotice('Sample agricultural cooperative members added successfully.');
      setTimeout(() => setNotice(null), 4000);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to insert sample members');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMember({
        ...form,
        tin_number: form.tin_number,
        tin: form.tin_number,
        notes: form.notes,
        custom_field_values: {
          ...form.custom_field_values,
          tin_number: form.tin_number,
          notes: form.notes
        },
        performed_by: currentUser.name
      });
      setIsRegistering(false);
      setNotice(`Member "${form.first_name} ${form.last_name}" registered successfully with automated SA and CBU accounts.`);
      setTimeout(() => setNotice(null), 4000);
      loadMembers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.id) return;
    try {
      await api.updateMember(editForm.id, {
        ...editForm,
        tin_number: editForm.tin_number,
        tin: editForm.tin_number,
        notes: editForm.notes,
        custom_field_values: {
          ...editForm.custom_field_values,
          tin_number: editForm.tin_number,
          notes: editForm.notes
        },
        performed_by: currentUser.name
      });
      setIsEditing(false);
      setNotice(`Member "${editForm.first_name} ${editForm.last_name}" profile, notes, and TIN record updated successfully.`);
      setTimeout(() => setNotice(null), 4000);
      loadMembers();
    } catch (err: any) {
      alert(err.message || 'Failed to update member');
    }
  };

  const safeMembers = Array.isArray(members) ? members : [];

  const filtered = safeMembers.filter(m => {
    if (!m || typeof m !== 'object') return false;
    const name = `${m.first_name || ''} ${m.last_name || ''} ${m.member_no || ''}`.toLowerCase();
    const matchesSearch = name.includes((searchTerm || '').toLowerCase());
    const matchesBranch = selectedBranch === 'all' || m.branch_id === selectedBranch;
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Cooperative Membership Registry</span>
            <span>•</span>
            <span className="text-slate-400">Dynamic Custom Form Attributes</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Members Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic member onboarding adhering to configured custom fields, required document checklists, and membership tiers.
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

          {/* View Switcher: Excel vs Cards */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 shadow-inner">
            <button
              onClick={() => setViewMode('excel')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                viewMode === 'excel'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Grid</span>
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
              <span>Cards View</span>
            </button>
            <button onClick={() => setViewMode('report')} className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === 'report' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>
              <FileText className="w-3.5 h-3.5" /><span>Member Report</span>
            </button>
            {onNavigateToFields && (
              <button
                onClick={onNavigateToFields}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition cursor-pointer"
                title="Open Member Custom Fields Module"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>Custom Fields</span>
              </button>
            )}
          </div>

          {/* Export Members to CSV (Custom Columns) */}
          <button
            id="btn-open-member-export-modal"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-900 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
            title="Export Members to CSV with custom column selection and 'Last name, First name MI' formatting"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-register-member"
            onClick={() => {
              setForm({
                branch_id: selectedBranch !== 'all' ? selectedBranch : (branches[0]?.id || 'branch_tar'),
                member_type_id: memberTypes[0]?.id || 'mt_regular',
                first_name: '',
                last_name: '',
                middle_name: '',
                gender: 'Female',
                birthdate: '1992-05-15',
                email: '',
                phone: '',
                address: '',
                tin_number: '',
                notes: '',
                custom_field_values: {}
              });
              setIsRegistering(true);
            }}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register New Member</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-xl text-xs font-semibold">
          {notice}
        </div>
      )}

      {/* Registration Modal Form */}
      {isRegistering && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Register Cooperative Member</h3>
                <p className="text-xs text-slate-400">Member ID sequence is automatically formatted per branch rule.</p>
              </div>
              <button onClick={() => setIsRegistering(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Registering Branch</label>
                  <select
                    value={form.branch_id}
                    onChange={e => setForm({ ...form, branch_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Membership Classification</label>
                  <select
                    value={form.member_type_id}
                    onChange={e => setForm({ ...form, member_type_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                  >
                    {memberTypes.map(mt => (
                      <option key={mt.id} value={mt.id}>
                        {mt.name} (Fee: ₱{mt.membership_fee})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">First Name *</label>
                  <input
                    type="text"
                    required
                    value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Middle Name</label>
                  <input
                    type="text"
                    value={form.middle_name}
                    onChange={e => setForm({ ...form, middle_name: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Gender</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Mobile Phone</label>
                  <input
                    type="text"
                    placeholder="+63 917 123 4567"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Email Address</label>
                  <input
                    type="email"
                    placeholder="member@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 font-medium">Residential Address</label>
                  <input
                    type="text"
                    placeholder="Barangay, City/Municipality, Province"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tax Identification Number (TIN)</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">Format: 000-000-000-000</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 005-891-234-000"
                    value={form.tin_number}
                    onChange={e => setForm({
                      ...form,
                      tin_number: e.target.value,
                      custom_field_values: {
                        ...form.custom_field_values,
                        tin_number: e.target.value
                      }
                    })}
                    className="w-full mt-1 bg-slate-800 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Official Bureau of Internal Revenue (BIR) member registration identifier for tax exemption certificates.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Member Notes & Remarks</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Optional internal notes</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Enter internal remarks, farm notes, special considerations, or membership annotations..."
                    value={form.notes}
                    onChange={e => setForm({
                      ...form,
                      notes: e.target.value,
                      custom_field_values: {
                        ...form.custom_field_values,
                        notes: e.target.value
                      }
                    })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Included as a column in the member spreadsheet grid and transaction reports.
                  </p>
                </div>
              </div>

              {/* Dynamic Custom Form Fields (Req 13, Test 8) */}
              {customFields.filter(cf => cf.field_key !== 'tin_number' && cf.field_name !== 'tin_number' && !(cf.label || cf.field_label || '').toLowerCase().includes('tin') && cf.field_key !== 'notes' && cf.field_name !== 'notes' && !(cf.label || cf.field_label || '').toLowerCase().includes('notes')).length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    Dynamic Cooperative Custom Fields
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {customFields
                  .filter(cf => cf.field_key !== 'tin_number' && cf.field_name !== 'tin_number' && !(cf.label || cf.field_label || '').toLowerCase().includes('tin') && cf.field_key !== 'notes' && cf.field_name !== 'notes' && !(cf.label || cf.field_label || '').toLowerCase().includes('notes'))
                  .map(cf => {
                  const options =
                    cf.field_type === 'Dropdown'
                      ? (() => {
                          try {
                            return Array.isArray(cf.options)
                              ? cf.options
                              : JSON.parse(cf.options || '[]');
                          } catch {
                            return [];
                          }
                        })()
                      : [];

                  const fieldKey = cf.field_key;
                  const isRequired = Number(cf.is_required) === 1;
                  const fieldType = cf.field_type;

                  return (
                    <div key={cf.id}>
                      <label className="text-xs text-slate-300 font-medium">
                        {cf.label}
                        {isRequired && (
                          <span className="text-rose-400 ml-1">*</span>
                        )}
                      </label>

                      {fieldType === 'Dropdown' ? (
                        <select
                          required={isRequired}
                          value={form.custom_field_values[fieldKey] || ''}
                          onChange={e =>
                            setForm({
                              ...form,
                              custom_field_values: {
                                ...form.custom_field_values,
                                [fieldKey]: e.target.value
                              }
                            })
                          }
                          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                        >
                          <option value="">Select option...</option>

                          {options.map((opt: string) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            fieldType === 'Number' || fieldType === 'Currency'
                              ? 'number'
                              : 'text'
                          }
                          required={isRequired}
                          placeholder={cf.label}
                          value={form.custom_field_values[fieldKey] || ''}
                          onChange={e =>
                            setForm({
                              ...form,
                              custom_field_values: {
                                ...form.custom_field_values,
                                [fieldKey]: e.target.value
                              }
                            })
                          }
                          className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                        />
                      )}
                    </div>
                  );
                })}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  Register Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal Form */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Edit2 className="w-4 h-4 text-emerald-400" />
                  <span>Edit Member Profile & TIN Record</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Updating member: <strong className="text-emerald-400 font-mono">{editingMember?.member_no}</strong> ({editForm.first_name} {editForm.last_name})
                </p>
              </div>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">Branch</label>
                  <select
                    value={editForm.branch_id}
                    onChange={e => setEditForm({ ...editForm, branch_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Membership Classification</label>
                  <select
                    value={editForm.member_type_id}
                    onChange={e => setEditForm({ ...editForm, member_type_id: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                  >
                    {memberTypes.map(mt => (
                      <option key={mt.id} value={mt.id}>{mt.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.first_name}
                    onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editForm.last_name}
                    onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Middle Name</label>
                  <input
                    type="text"
                    value={editForm.middle_name}
                    onChange={e => setEditForm({ ...editForm, middle_name: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Gender</label>
                  <select
                    value={editForm.gender}
                    onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Mobile Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 font-medium">Residential Address</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-amber-400" />
                      <span>Tax Identification Number (TIN)</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono">Format: 000-000-000-000</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 005-891-234-000"
                    value={editForm.tin_number}
                    onChange={e => setEditForm({
                      ...editForm,
                      tin_number: e.target.value,
                      custom_field_values: {
                        ...editForm.custom_field_values,
                        tin_number: e.target.value
                      }
                    })}
                    className="w-full mt-1 bg-slate-800 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Official Bureau of Internal Revenue (BIR) member registration identifier for tax exemption certificates.
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Member Notes & Remarks</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Optional internal notes</span>
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Enter internal remarks, farm notes, special considerations, or membership annotations..."
                    value={editForm.notes}
                    onChange={e => setEditForm({
                      ...editForm,
                      notes: e.target.value,
                      custom_field_values: {
                        ...editForm.custom_field_values,
                        notes: e.target.value
                      }
                    })}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Included as a column in the member spreadsheet grid and transaction reports.
                  </p>
                </div>
              </div>

              {/* Dynamic Custom Form Fields */}
              {customFields.filter(cf => cf.field_key !== 'tin_number' && cf.field_name !== 'tin_number' && !(cf.label || cf.field_label || '').toLowerCase().includes('tin') && cf.field_key !== 'notes' && cf.field_name !== 'notes' && !(cf.label || cf.field_label || '').toLowerCase().includes('notes')).length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    Dynamic Cooperative Custom Fields
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customFields
                      .filter(cf => cf.field_key !== 'tin_number' && cf.field_name !== 'tin_number' && !(cf.label || cf.field_label || '').toLowerCase().includes('tin') && cf.field_key !== 'notes' && cf.field_name !== 'notes' && !(cf.label || cf.field_label || '').toLowerCase().includes('notes'))
                      .map(cf => {
                        const fieldKey = cf.field_key || cf.field_name || '';
                        const isRequired = Number(cf.is_required) === 1 || Boolean(cf.required);
                        const fieldType = cf.field_type;
                        const options = cf.field_type === 'Dropdown' ? (Array.isArray(cf.options) ? cf.options : []) : [];

                        return (
                          <div key={cf.id}>
                            <label className="text-xs text-slate-300 font-medium">
                              {cf.label || cf.field_label}
                              {isRequired && <span className="text-rose-400 ml-1">*</span>}
                            </label>
                            {fieldType === 'Dropdown' ? (
                              <select
                                value={editForm.custom_field_values[fieldKey] || ''}
                                onChange={e => setEditForm({
                                  ...editForm,
                                  custom_field_values: {
                                    ...editForm.custom_field_values,
                                    [fieldKey]: e.target.value
                                  }
                                })}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                              >
                                <option value="">Select option...</option>
                                {options.map((opt: string) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={fieldType === 'Number' || fieldType === 'Currency' ? 'number' : 'text'}
                                value={editForm.custom_field_values[fieldKey] || ''}
                                onChange={e => setEditForm({
                                  ...editForm,
                                  custom_field_values: {
                                    ...editForm.custom_field_values,
                                    [fieldKey]: e.target.value
                                  }
                                })}
                                placeholder={cf.label || cf.field_label}
                                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                              />
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main View Area */}
      {viewMode === 'report' ? (
        <MemberTransactionReport members={safeMembers.filter(m => selectedBranch === 'all' || m.branch_id === selectedBranch)} />
      ) : !isLoading && safeMembers.length === 0 ? (
        <div className="bg-slate-900/90 rounded-2xl p-10 sm:p-14 border border-slate-800 text-center shadow-xl space-y-6 max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">Cooperative Member Registry is Empty</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              No cooperative members are enrolled yet. Once you register members, the system automatically assigns unique Member IDs, establishes Capital Build-Up (CBU) ledgers, and activates Savings Accounts.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsRegistering(true)}
              className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-lg transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register First Member</span>
            </button>
            <button
              onClick={handleSeedSample}
              disabled={isSeeding}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 text-amber-400 ${isSeeding ? 'animate-spin' : ''}`} />
              <span>{isSeeding ? 'Inserting Samples...' : 'Load Sample Members'}</span>
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('coop:open-setup-wizard'))}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-emerald-400" />
              <span>Setup Wizard</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'excel' ? (
        <ExcelGridTable
          title="Member Registry Spreadsheet Grid"
          subtitle="Comprehensive directory of registered cooperative members. Includes real-time search, multi-column sorting, formula summary bar, and 1-click Excel export."
          exportFileName="cooperative_members"
          data={filtered}
          columns={memberCols}
          defaultSortKey="member_no"
          onCustomExport={() => setIsExportModalOpen(true)}
          toolbarExtra={
            <button
              onClick={() => setIsExportModalOpen(true)}
              title="Custom column selection & 'Last name, First name MI' name formatting"
              className="px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Choose Columns</span>
            </button>
          }
        />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by member name or ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedBranch}
                onChange={e => setSelectedBranch(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 cursor-pointer"
              >
                <option value="all">All Branches</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Member Cards Grid */}
          {filtered.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl p-10 border border-slate-800 text-center space-y-3">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No members match your search criteria</p>
              <p className="text-xs text-slate-500">Try clearing your search query or changing the branch filter.</p>
              <button
                onClick={() => { setSearchTerm(''); setSelectedBranch('all'); }}
                className="px-3.5 py-1.5 bg-slate-800 text-emerald-400 border border-slate-700 rounded-lg text-xs hover:bg-slate-700 cursor-pointer mt-1"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(m => (
                <div key={m.id} className="bg-slate-900/80 rounded-2xl p-5 border border-slate-800 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-bold">
                        {m.member_no}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                        {m.member_type_name}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white mt-2">
                      {m.first_name} {m.middle_name} {m.last_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      {m.branch_name}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                      {m.phone && (
                        <div className="flex items-center text-slate-400">
                          <Phone className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                          <span>{m.phone}</span>
                        </div>
                      )}
                      {m.email && (
                        <div className="flex items-center text-slate-400">
                          <Mail className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                          <span className="truncate">{m.email}</span>
                        </div>
                      )}
                      {m.address && (
                        <div className="flex items-center text-slate-400">
                          <MapPin className="w-3.5 h-3.5 mr-2 text-slate-500 shrink-0" />
                          <span className="truncate">{m.address}</span>
                        </div>
                      )}
                    </div>

                    {/* TIN Identification Badge */}
                    <div className="mt-2.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-amber-400 font-semibold flex items-center space-x-1">
                        <Tag className="w-3 h-3 text-amber-400" />
                        <span>TIN:</span>
                      </span>
                      <span className="font-mono text-amber-300 font-bold text-[11px]">
                        {m.tin_number || m.tin || m.custom_field_values?.tin_number || 'Not Set'}
                      </span>
                    </div>

                    {/* Member Notes / Remarks */}
                    {(m.notes || m.custom_field_values?.notes) && (
                      <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-cyan-950/30 border border-cyan-500/25 flex items-start space-x-1.5 text-xs">
                        <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                        <span className="text-[11px] text-slate-300 line-clamp-2" title={m.notes || m.custom_field_values?.notes}>
                          {m.notes || m.custom_field_values?.notes}
                        </span>
                      </div>
                    )}

                    {/* Custom field attributes */}
                    {m.custom_field_values && Object.keys(m.custom_field_values).filter(k => k !== 'tin_number' && k !== 'notes').length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 text-[11px] space-y-1">
                        {Object.entries(m.custom_field_values).filter(([k]) => k !== 'tin_number' && k !== 'notes').map(([k, v]) => (
                          <div key={k} className="flex justify-between text-slate-400">
                            <span className="capitalize">{k.replace(/_/g, ' ')}:</span>
                            <span className="text-slate-200 font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                    <span>Joined: {m.joined_date}</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => onNavigateToProfile ? onNavigateToProfile(m.id) : handleOpenEdit(m)}
                        className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-800/60 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition"
                        title="View Full Profile & KYC Files"
                      >
                        <UserCheck className="w-3 h-3 text-emerald-400" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition"
                        title="Edit Member & TIN"
                      >
                        <Edit2 className="w-3 h-3 text-cyan-400" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Member Custom CSV Export Modal */}
      <MemberExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        filteredMembers={filtered}
        allMembers={safeMembers}
        branches={branches}
        memberTypes={memberTypes}
        customFields={customFields}
        selectedBranchName={selectedBranch === 'all' ? 'All Branches' : branches.find(b => b.id === selectedBranch)?.name || 'Filtered Branch'}
      />
    </div>
  );
};
