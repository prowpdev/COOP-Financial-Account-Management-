import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Users,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  AlertCircle,
  FileSpreadsheet,
  Building2,
  Phone,
  Mail,
  CreditCard,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  HelpCircle,
  Tag,
  Save,
  RefreshCw,
  FileText
} from 'lucide-react';
import { CustomField, Member, Branch, User } from '../../types';
import { api } from '../../services/api';

interface MemberCustomFieldsModuleProps {
  customFields: CustomField[];
  members?: Member[];
  branches?: Branch[];
  currentUser: User;
  onRefresh: () => void;
  onNavigateToMembers?: () => void;
}

export const MemberCustomFieldsModule: React.FC<MemberCustomFieldsModuleProps> = ({
  customFields = [],
  members: propMembers,
  branches = [],
  currentUser,
  onRefresh,
  onNavigateToMembers
}) => {
  const [members, setMembers] = useState<Member[]>(propMembers || []);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<'All' | 'Member' | 'Loan'>('Member');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Field Add/Edit Modal
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [fieldForm, setFieldForm] = useState({
    field_label: '',
    field_name: '',
    field_type: 'Text' as any,
    required: false,
    options_text: '',
    default_value: ''
  });

  // Member Inspector / Quick TIN & Attribute Editor
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [memberTinInput, setMemberTinInput] = useState<string>('');
  const [memberNotesInput, setMemberNotesInput] = useState<string>('');
  const [memberCustomInputs, setMemberCustomInputs] = useState<Record<string, any>>({});
  const [isSavingMember, setIsSavingMember] = useState(false);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 5000);
  };

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const res = await api.getMembers();
      const list = res.data || [];
      setMembers(list);
      if (list.length > 0 && !selectedMemberId) {
        setSelectedMemberId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load members in MemberCustomFieldsModule:', e);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  // Update selected member inputs when member changes
  useEffect(() => {
    if (selectedMemberId && members.length > 0) {
      const m = members.find(item => item.id === selectedMemberId);
      if (m) {
        const tin = m.tin_number || m.tin || m.custom_field_values?.tin_number || '';
        const notes = m.notes || m.custom_field_values?.notes || '';
        setMemberTinInput(tin);
        setMemberNotesInput(notes);
        setMemberCustomInputs({ ...(m.custom_field_values || {}) });
      }
    }
  }, [selectedMemberId, members]);

  // Open modal for new field
  const handleOpenNewField = (preset?: { label: string; name: string; type: string; req?: boolean }) => {
    setEditingField(null);
    setFieldForm({
      field_label: preset?.label || '',
      field_name: preset?.name || '',
      field_type: (preset?.type as any) || 'Text',
      required: Boolean(preset?.req),
      options_text: '',
      default_value: ''
    });
    setIsFieldModalOpen(true);
  };

  // Open modal for edit field
  const handleOpenEditField = (field: CustomField) => {
    setEditingField(field);
    const opts = Array.isArray(field.options) ? field.options.join(', ') : '';
    setFieldForm({
      field_label: field.label || field.field_label || '',
      field_name: field.field_key || field.field_name || '',
      field_type: field.field_type || 'Text',
      required: Boolean(field.required || field.is_required),
      options_text: opts,
      default_value: field.default_value || ''
    });
    setIsFieldModalOpen(true);
  };

  // Save Field (Create or Update)
  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const options = fieldForm.options_text
        ? fieldForm.options_text.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      if (editingField) {
        await api.updateCustomField(editingField.id, {
          entity: 'Member',
          field_label: fieldForm.field_label,
          field_name: fieldForm.field_name || fieldForm.field_label.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          field_type: fieldForm.field_type,
          options,
          required: fieldForm.required,
          default_value: fieldForm.default_value,
          changed_by: currentUser.name,
          reason: 'Updated member custom field configuration'
        });
        showNotice('success', `Custom field "${fieldForm.field_label}" updated successfully.`);
      } else {
        await api.createCustomField({
          entity: 'Member',
          field_label: fieldForm.field_label,
          field_name: fieldForm.field_name || fieldForm.field_label.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
          field_type: fieldForm.field_type,
          options,
          required: fieldForm.required,
          default_value: fieldForm.default_value,
          changed_by: currentUser.name,
          reason: 'Added new member custom attribute'
        });
        showNotice('success', `New custom field "${fieldForm.field_label}" created and linked to members.`);
      }

      setIsFieldModalOpen(false);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to save custom field');
    }
  };

  // Delete field
  const handleDeleteField = async (field: CustomField) => {
    const label = field.label || field.field_label || 'Field';
    if (!window.confirm(`Are you sure you want to delete custom field "${label}"? Existing member values for this attribute may become unindexed.`)) {
      return;
    }
    try {
      await api.deleteCustomField(field.id, currentUser.name);
      showNotice('success', `Custom field "${label}" deleted successfully.`);
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to delete custom field');
    }
  };

  // Save selected member TIN and custom fields
  const handleSaveMemberRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    setIsSavingMember(true);
    try {
      const mergedCustom = {
        ...memberCustomInputs,
        tin_number: memberTinInput.trim(),
        notes: memberNotesInput.trim()
      };

      await api.updateMember(selectedMemberId, {
        tin_number: memberTinInput.trim(),
        tin: memberTinInput.trim(),
        notes: memberNotesInput.trim(),
        custom_field_values: mergedCustom,
        performed_by: currentUser.name,
        reason: 'Updated member TIN, notes, and custom fields via Member Custom Fields Module'
      });

      showNotice('success', `Member record, TIN (${memberTinInput || 'N/A'}), and notes saved to database!`);
      await loadMembers();
      onRefresh();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update member records');
    } finally {
      setIsSavingMember(false);
    }
  };

  // Filter custom fields
  const memberFields = customFields.filter(f => {
    if (selectedEntity !== 'All' && (f.entity || 'Member') !== selectedEntity) return false;
    const label = (f.label || f.field_label || '').toLowerCase();
    const key = (f.field_key || f.field_name || '').toLowerCase();
    const q = searchTerm.toLowerCase();
    return label.includes(q) || key.includes(q);
  });

  // Calculate statistics
  const totalFields = customFields.filter(f => (f.entity || 'Member') === 'Member').length;
  const tinFieldConfigured = customFields.some(
    f => (f.field_key === 'tin_number' || f.field_name === 'tin_number' || (f.label || f.field_label || '').toLowerCase().includes('tin'))
  );
  const membersWithTin = members.filter(
    m => Boolean(m.tin_number || m.tin || m.custom_field_values?.tin_number)
  ).length;
  const tinComplianceRate = members.length > 0 ? Math.round((membersWithTin / members.length) * 100) : 0;

  const currentMember = members.find(m => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Cooperative Membership Architecture</span>
            <span>•</span>
            <span className="text-slate-400">Dynamic Member Records Schema</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1 flex items-center space-x-3">
            <span>Member Custom Fields & Records</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              Connected to Registry
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure dynamic member record fields, data classifications, and tax / compliance identifiers (such as Tax Identification Number - TIN) with seamless integration across member onboarding, spreadsheet ledgers, and official reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToMembers && (
            <button
              onClick={onNavigateToMembers}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer transition shadow"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>← Member Registry</span>
            </button>
          )}

          <button
            id="btn-add-member-custom-field"
            onClick={() => handleOpenNewField()}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Custom Field</span>
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
            notice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Configured Fields</span>
            <Sliders className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono">{totalFields}</p>
          <p className="text-[11px] text-slate-400">Dynamic member attributes</p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Enrolled Members</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 font-mono">{members.length}</p>
          <p className="text-[11px] text-slate-400">Total active records</p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Members With TIN</span>
            <Tag className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400 font-mono">
            {membersWithTin} <span className="text-xs text-slate-400 font-normal">/ {members.length}</span>
          </p>
          <p className="text-[11px] text-slate-400">Tax ID compliance count</p>
        </div>

        <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>TIN Compliance</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">{tinComplianceRate}%</p>
          <p className="text-[11px] text-emerald-400/80 font-medium">BIR registry ready</p>
        </div>
      </div>

      {/* Preset Recommendations Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl p-5 border border-emerald-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Cooperative Compliance & Attribute Quick Presets
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">Click to instantly prefill attribute schema</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenNewField({ label: 'Tax Identification No. (TIN)', name: 'tin_number', type: 'Text', req: false })}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition border cursor-pointer ${
              tinFieldConfigured
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>TIN Number (Tax ID) {tinFieldConfigured ? '✓ Configured' : '+ Add'}</span>
          </button>

          <button
            onClick={() => handleOpenNewField({ label: 'SSS / UMID Number', name: 'sss_number', type: 'Text', req: false })}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer"
          >
            <span>+ SSS / UMID No.</span>
          </button>

          <button
            onClick={() => handleOpenNewField({ label: 'PhilHealth Identification No.', name: 'philhealth_no', type: 'Text', req: false })}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer"
          >
            <span>+ PhilHealth No.</span>
          </button>

          <button
            onClick={() => handleOpenNewField({ label: 'Farm Land Area (Hectares)', name: 'farm_hectares', type: 'Number', req: false })}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer"
          >
            <span>+ Farm Land Area (Hectares)</span>
          </button>

          <button
            onClick={() => handleOpenNewField({ label: 'Emergency Contact Person', name: 'emergency_contact', type: 'Text', req: false })}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 cursor-pointer"
          >
            <span>+ Emergency Contact</span>
          </button>

          <button
            onClick={() => handleOpenNewField({ label: 'Member Notes / Remarks', name: 'notes', type: 'Text', req: false })}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Member Notes / Remarks</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Custom Fields Table on Left, Member Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configured Fields Directory (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Configured Member Attributes</h2>
                <p className="text-xs text-slate-400">Active custom attributes applied to member profiles and onboarding forms.</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter fields by name or key..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Fields List */}
            {memberFields.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl space-y-2">
                <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No custom fields found matching your filter.</p>
                <button
                  onClick={() => handleOpenNewField()}
                  className="text-xs text-emerald-400 hover:underline font-semibold"
                >
                  Create your first custom field
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {memberFields.map(f => {
                  const key = f.field_key || f.field_name || '';
                  const label = f.label || f.field_label || 'Field';
                  const isRequired = Boolean(f.required || f.is_required);
                  const isTin = key === 'tin_number' || label.toLowerCase().includes('tin');
                  const populatedCount = members.filter(
                    m => Boolean(m.custom_field_values?.[key] || (key === 'tin_number' && (m.tin_number || m.tin)))
                  ).length;
                  const popPercent = members.length > 0 ? Math.round((populatedCount / members.length) * 100) : 0;

                  return (
                    <div
                      key={f.id}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isTin
                          ? 'bg-amber-950/20 border-amber-500/30'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{label}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {f.field_type}
                          </span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              isRequired
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isRequired ? 'Mandatory' : 'Optional'}
                          </span>
                          {isTin && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              BIR Tax ID
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                          <span className="font-mono text-emerald-400">field_key: {key}</span>
                          <span>•</span>
                          <span>
                            Filled in <strong className="text-slate-200">{populatedCount}/{members.length}</strong> members ({popPercent}%)
                          </span>
                          {f.options && f.options.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{f.options.length} dropdown choices</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => handleOpenEditField(f)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs cursor-pointer transition"
                          title="Edit Custom Field"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(f)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 rounded-lg text-xs cursor-pointer transition"
                          title="Delete Custom Field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Member Records & TIN Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                <Users className="w-3.5 h-3.5" />
                <span>Member Record Inspector & TIN Editor</span>
              </div>
              <h2 className="text-base font-bold text-white mt-1">Assign & Edit Member Custom Data</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect any member's current record and directly update their Tax Identification Number (TIN) and custom fields in real-time.
              </p>
            </div>

            {/* Member Selector Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Select Member Record</label>
              <div className="relative">
                <select
                  value={selectedMemberId}
                  onChange={e => setSelectedMemberId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.member_no} — {m.first_name} {m.last_name} ({m.branch_name || 'Member'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Member Profile Summary Badge */}
            {currentMember && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">
                    {currentMember.first_name} {currentMember.middle_name ? currentMember.middle_name + ' ' : ''}{currentMember.last_name}
                  </span>
                  <span className="font-mono text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                    {currentMember.member_no}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                  <span>Branch: {currentMember.branch_name || 'Main'}</span>
                  <span>•</span>
                  <span>Type: {currentMember.member_type_name || 'Regular'}</span>
                  <span>•</span>
                  <span>Joined: {currentMember.joined_date || '2026-01-01'}</span>
                </div>
              </div>
            )}

            {/* Interactive Update Form */}
            <form onSubmit={handleSaveMemberRecord} className="space-y-4 pt-2 border-t border-slate-800">
              {/* TIN Field Prominently Displayed */}
              <div className="p-3.5 bg-amber-950/20 border border-amber-500/40 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span>Tax Identification Number (TIN)</span>
                  </label>
                  <span className="text-[10px] text-amber-400/80 font-mono">Format: 000-000-000-000</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 005-891-234-000"
                  value={memberTinInput}
                  onChange={e => setMemberTinInput(e.target.value)}
                  className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-400">
                  Required by BIR for tax exemptions, PMES filing, and official cooperative member records.
                </p>
              </div>

              {/* Member Notes / Remarks Inspector Field */}
              <div className="p-3.5 bg-slate-950 border border-slate-700/80 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Member Notes & Remarks</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Synced to Excel Column</span>
                </div>
                <textarea
                  rows={2}
                  placeholder="Enter remarks, membership annotations, farm observations..."
                  value={memberNotesInput}
                  onChange={e => setMemberNotesInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  Directly saved to member database and visible across member spreadsheets and statements.
                </p>
              </div>

              {/* Other Dynamic Custom Fields for this Member */}
              {memberFields
                .filter(f => {
                  const key = f.field_key || f.field_name || '';
                  return key !== 'tin_number' && !key.includes('tin') && key !== 'notes';
                })
                .map(f => {
                  const key = f.field_key || f.field_name || '';
                  const label = f.label || f.field_label || key;
                  const fieldType = f.field_type;
                  const value = memberCustomInputs[key] ?? '';

                  return (
                    <div key={f.id} className="space-y-1">
                      <label className="text-xs font-medium text-slate-300">
                        {label}
                        {Boolean(f.required || f.is_required) && <span className="text-rose-400 ml-1">*</span>}
                      </label>

                      {fieldType === 'Dropdown' ? (
                        <select
                          value={value}
                          onChange={e =>
                            setMemberCustomInputs({
                              ...memberCustomInputs,
                              [key]: e.target.value
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                        >
                          <option value="">Select option...</option>
                          {(f.options || []).map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={fieldType === 'Number' || fieldType === 'Currency' ? 'number' : 'text'}
                          value={value}
                          onChange={e =>
                            setMemberCustomInputs({
                              ...memberCustomInputs,
                              [key]: e.target.value
                            })
                          }
                          placeholder={`Enter ${label}...`}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                        />
                      )}
                    </div>
                  );
                })}

              <button
                type="submit"
                disabled={isSavingMember || !selectedMemberId}
                className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2.5 rounded-xl text-xs font-semibold cursor-pointer shadow transition"
              >
                {isSavingMember ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Record...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Member TIN & Custom Records</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal: Add or Edit Custom Field */}
      {isFieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingField ? 'Edit Member Custom Field' : 'Create Member Custom Field'}
                </h3>
                <p className="text-xs text-slate-400">
                  Custom fields are automatically reflected on member registration and profile views.
                </p>
              </div>
              <button
                onClick={() => setIsFieldModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveField} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium">Field Label *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tax Identification No. (TIN)"
                  value={fieldForm.field_label}
                  onChange={e => {
                    const label = e.target.value;
                    const autoKey = label.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_');
                    setFieldForm({
                      ...fieldForm,
                      field_label: label,
                      field_name: editingField ? fieldForm.field_name : autoKey
                    });
                  }}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium">System Field Key</label>
                  <input
                    type="text"
                    required
                    placeholder="tin_number"
                    value={fieldForm.field_name}
                    onChange={e => setFieldForm({ ...fieldForm, field_name: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-emerald-400"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium">Data Type</label>
                  <select
                    value={fieldForm.field_type}
                    onChange={e => setFieldForm({ ...fieldForm, field_type: e.target.value as any })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                  >
                    <option value="Text">Text</option>
                    <option value="Number">Number</option>
                    <option value="Date">Date</option>
                    <option value="Dropdown">Dropdown</option>
                    <option value="Currency">Currency</option>
                    <option value="Phone">Phone</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
              </div>

              {fieldForm.field_type === 'Dropdown' && (
                <div>
                  <label className="text-xs text-slate-300 font-medium">Dropdown Options (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Regular, Associate, Honorary"
                    value={fieldForm.options_text}
                    onChange={e => setFieldForm({ ...fieldForm, options_text: e.target.value })}
                    className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-slate-300 font-medium">Default Placeholder Value</label>
                <input
                  type="text"
                  placeholder="Optional default value..."
                  value={fieldForm.default_value}
                  onChange={e => setFieldForm({ ...fieldForm, default_value: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-field-required-modal"
                  checked={fieldForm.required}
                  onChange={e => setFieldForm({ ...fieldForm, required: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="chk-field-required-modal" className="text-xs text-slate-300 font-medium cursor-pointer">
                  Mandatory Field (Required upon member registration)
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl cursor-pointer shadow"
                >
                  {editingField ? 'Save Changes' : 'Create Custom Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
