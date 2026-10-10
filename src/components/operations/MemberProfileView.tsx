import React, { useState, useEffect, useMemo } from 'react';
import {
  User,
  Users,
  Building2,
  Calendar,
  CreditCard,
  PiggyBank,
  Coins,
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Tag,
  Shield,
  FileCheck,
  Edit2,
  Save,
  X,
  Search,
  Camera,
  Image as ImageIcon,
  File,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ArrowRight,
  Plus
} from 'lucide-react';
import { api } from '../../services/api';
import { Member, Branch, MemberType, CustomField, User as AppUser, ShareCapitalAccount } from '../../types';
import { SearchableSelect, SearchableOption } from '../common/SearchableSelect';
import { CustomFileUploadField, CustomFileValue } from '../common/CustomFileUploadField';
import { IndividualShareDepositLedgerModal } from './IndividualShareDepositLedgerModal';

interface MemberProfileViewProps {
  initialMemberId?: string;
  branches: Branch[];
  memberTypes: MemberType[];
  customFields: CustomField[];
  currentUser: AppUser;
  onNavigateToMembers?: () => void;
  onNavigateToShareCapital?: () => void;
  onNavigateToSavings?: () => void;
  onNavigateToLoans?: () => void;
}

interface MemberDocInfo {
  field_key: string;
  label: string;
  type: string;
  required: boolean;
  value: any;
  has_file: boolean;
}

export const MemberProfileView: React.FC<MemberProfileViewProps> = ({
  initialMemberId,
  branches = [],
  memberTypes = [],
  customFields = [],
  currentUser,
  onNavigateToMembers,
  onNavigateToShareCapital,
  onNavigateToSavings,
  onNavigateToLoans
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMemberId || '');
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'documents' | 'personal' | 'accounts' | 'custom_fields'>('documents');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal / preview states
  const [previewDoc, setPreviewDoc] = useState<{ title: string; dataUrl: string; type: string } | null>(null);
  const [selectedCbuAccount, setSelectedCbuAccount] = useState<ShareCapitalAccount | null>(null);
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isSavingPersonal, setIsSavingPersonal] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // New Document Upload modal / state
  const [uploadDocForm, setUploadDocForm] = useState({
    doc_key: 'supporting_docs',
    custom_label: '',
    file_type: 'File',
    fileData: null as CustomFileValue | null
  });

  // Personal edit form
  const [personalForm, setPersonalForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'Female',
    birthdate: '1990-01-01',
    branch_id: '',
    member_type_id: '',
    email: '',
    phone: '',
    address: '',
    tin_number: '',
    notes: '',
    status: 'Active'
  });

  // Custom fields inputs for this member
  const [customInputs, setCustomInputs] = useState<Record<string, any>>({});
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 5000);
  };

  // 1. Load Members list for dropdown selector
  const loadMembers = async () => {
    setIsLoadingList(true);
    try {
      const res = await api.getMembers();
      const list = res.data || [];
      setMembers(list);
      if (!selectedMemberId && list.length > 0) {
        setSelectedMemberId(list[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load members:', err);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  useEffect(() => {
    if (initialMemberId) {
      setSelectedMemberId(initialMemberId);
    }
  }, [initialMemberId]);

  // 2. Load rich profile when selectedMemberId changes
  const loadProfile = async (id: string) => {
    if (!id) return;
    setIsLoadingProfile(true);
    try {
      const res = await api.getMemberProfile(id);
      if (res.data) {
        const p = res.data;
        setProfileData(p);
        const m = p.member || {};
        setPersonalForm({
          first_name: m.first_name || '',
          middle_name: m.middle_name || '',
          last_name: m.last_name || '',
          gender: m.gender || 'Female',
          birthdate: m.birthdate || '1990-01-01',
          branch_id: m.branch_id || branches[0]?.id || '',
          member_type_id: m.member_type_id || memberTypes[0]?.id || '',
          email: m.email || '',
          phone: m.phone || '',
          address: m.address || '',
          tin_number: m.tin_number || m.tin || m.custom_field_values?.tin_number || '',
          notes: m.notes || m.custom_field_values?.notes || '',
          status: m.status || 'Active'
        });
        setCustomInputs(m.custom_field_values || {});
      }
    } catch (err: any) {
      console.error('Failed to load member profile:', err);
      showNotice('error', err.message || 'Failed to load member profile');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (selectedMemberId) {
      loadProfile(selectedMemberId);
    }
  }, [selectedMemberId]);

  // Options for Member SearchableSelect
  const memberSelectOptions: SearchableOption[] = useMemo(() => {
    return members.map(m => {
      const br = branches.find(b => b.id === m.branch_id);
      const name = `${m.first_name} ${m.middle_name ? m.middle_name + ' ' : ''}${m.last_name}`;
      return {
        value: m.id,
        label: `${m.member_no} - ${name}`,
        code: m.member_no,
        type: br ? br.name : 'Branch',
        searchTerms: `${m.member_no} ${name} ${m.email || ''} ${m.phone || ''} ${m.tin_number || ''} ${br?.name || ''}`
      };
    });
  }, [members, branches]);

  // Handle uploading/updating a document
  const handleSaveDocument = async (docKey: string, fileData: CustomFileValue | null) => {
    if (!selectedMemberId) return;
    try {
      if (!fileData) {
        // Delete document
        await api.deleteMemberDocument(selectedMemberId, docKey);
        showNotice('success', 'Document removed successfully');
      } else {
        // Upload document
        await api.uploadMemberDocument(selectedMemberId, {
          doc_key: docKey,
          name: fileData.name,
          file_type: fileData.type,
          type: fileData.type,
          dataUrl: fileData.dataUrl,
          data_url: fileData.dataUrl,
          size: fileData.size,
          uploaded_at: fileData.uploadedAt || new Date().toISOString()
        });
        showNotice('success', `Document "${fileData.name}" uploaded and attached to member profile`);
      }
      // Refresh profile data
      await loadProfile(selectedMemberId);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update document');
    }
  };

  // Handle saving personal info
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    setIsSavingPersonal(true);
    try {
      const mergedCustom = {
        ...customInputs,
        tin_number: personalForm.tin_number.trim(),
        notes: personalForm.notes.trim()
      };

      await api.updateMember(selectedMemberId, {
        first_name: personalForm.first_name.trim(),
        middle_name: personalForm.middle_name.trim(),
        last_name: personalForm.last_name.trim(),
        gender: personalForm.gender,
        birthdate: personalForm.birthdate,
        branch_id: personalForm.branch_id,
        member_type_id: personalForm.member_type_id,
        email: personalForm.email.trim(),
        phone: personalForm.phone.trim(),
        address: personalForm.address.trim(),
        tin_number: personalForm.tin_number.trim(),
        tin: personalForm.tin_number.trim(),
        notes: personalForm.notes.trim(),
        status: personalForm.status,
        custom_field_values: mergedCustom,
        performed_by: currentUser.name,
        reason: 'Updated member profile via Admin Member Profile page'
      });

      showNotice('success', 'Member personal information updated successfully');
      setIsEditingPersonal(false);
      await loadProfile(selectedMemberId);
      await loadMembers();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update personal information');
    } finally {
      setIsSavingPersonal(false);
    }
  };

  // Handle saving custom fields
  const handleSaveCustomFields = async () => {
    if (!selectedMemberId) return;
    setIsSavingCustom(true);
    try {
      await api.updateMember(selectedMemberId, {
        custom_field_values: customInputs,
        performed_by: currentUser.name,
        reason: 'Updated member custom attributes via Member Profile page'
      });
      showNotice('success', 'Custom field values saved successfully');
      await loadProfile(selectedMemberId);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to save custom fields');
    } finally {
      setIsSavingCustom(false);
    }
  };

  const member = profileData?.member;
  const docs = profileData?.documents || {};
  const stats = profileData?.stats || { total_savings: 0, total_share_capital: 0, total_loan_balance: 0, active_loans_count: 0 };
  const cbuAccount = profileData?.share_capital;
  const savingsAccounts = profileData?.savings_accounts || [];
  const loans = profileData?.loans || [];

  // Key KYC documents list
  const standardDocsList = [
    {
      key: 'id_photo',
      title: 'Government Valid ID Photo',
      subtitle: 'PhilSys / Passport / Driver License / UMID / SSS',
      type: 'Image',
      badge: 'Required for KYC',
      required: true
    },
    {
      key: 'member_photo',
      title: 'Member Photo (2x2 / Portrait)',
      subtitle: 'Official membership passbook & registry portrait',
      type: 'Image',
      badge: 'Profile Avatar',
      required: false
    },
    {
      key: 'birth_certificate',
      title: 'Birth Certificate (PSA / NSO)',
      subtitle: 'Proof of age and civil registry identity',
      type: 'PDF',
      badge: 'Civil Document',
      required: false
    },
    {
      key: 'marriage_certificate',
      title: 'Marriage Certificate / Contract',
      subtitle: 'Spousal authorization and loan co-maker verification',
      type: 'PDF',
      badge: 'Civil Document',
      required: false
    },
    {
      key: 'supporting_docs',
      title: 'Supporting Documents / Attachments',
      subtitle: 'Barangay clearance, proof of billing, land title, etc.',
      type: 'File',
      badge: 'Attachments',
      required: false
    }
  ];

  // Additional custom document fields from system
  const dynamicDocFields = customFields.filter(cf => {
    const key = cf.field_name || cf.field_key || '';
    const fType = String(cf.field_type || '').toLowerCase();
    const isFile = ['file', 'image', 'document', 'pdf'].includes(fType);
    const isStd = ['id_photo', 'member_photo', 'birth_certificate', 'marriage_certificate', 'supporting_docs', 'proof_of_billing'].includes(key);
    return isFile && !isStd;
  });

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      {notice && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium animate-in fade-in-50 ${
            notice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Bar: Module Title & Member Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Member Profile & KYC Dossier</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  Admin Dashboard
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Complete member dossier with ID photos, civil registry documents (Birth, Marriage), CBU accounts, savings, and credit facilities.
              </p>
            </div>
          </div>
        </div>

        {/* Searchable Member Dropdown */}
        <div className="w-full md:w-80 shrink-0">
          <label className="text-[11px] font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <Search className="w-3 h-3 text-emerald-400" />
              <span>Select Member:</span>
            </span>
            <span className="text-[10px] text-slate-400">{members.length} Registered</span>
          </label>
          <SearchableSelect
            options={memberSelectOptions}
            value={selectedMemberId}
            onChange={id => setSelectedMemberId(id)}
            placeholder="Type member name, ID, or TIN..."
            searchPlaceholder="Search by ID, name, branch, phone..."
            alwaysShowSearch={true}
            hideCode={true}
            className="w-full"
            buttonClassName="bg-slate-950 border-slate-700 hover:border-emerald-500/50 py-2"
          />
        </div>
      </div>

      {isLoadingProfile ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Loading complete member profile and documents...</p>
        </div>
      ) : !member ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm">No member selected. Please choose a member from the dropdown above.</p>
        </div>
      ) : (
        <>
          {/* Member Identity Card Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              {/* Photo & Identity Info */}
              <div className="flex items-start sm:items-center space-x-4">
                {/* 2x2 Member Photo Avatar */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500/40 shadow-lg flex items-center justify-center">
                    {member.photo_url || docs.member_photo?.value?.dataUrl || (typeof docs.member_photo?.value === 'string' && docs.member_photo?.value) ? (
                      <img
                        src={member.photo_url || docs.member_photo?.value?.dataUrl || docs.member_photo?.value}
                        alt={`${member.first_name} ${member.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 text-slate-500" />
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const img = member.photo_url || docs.member_photo?.value?.dataUrl || docs.member_photo?.value;
                      if (img) {
                        setPreviewDoc({ title: `Member Photo - ${member.first_name} ${member.last_name}`, dataUrl: img, type: 'image/jpeg' });
                      } else {
                        setActiveTab('documents');
                      }
                    }}
                    title="View enlarged photo"
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition cursor-pointer text-white"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>

                {/* Member Names & Key Badges */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {member.member_no}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium">
                      {member.member_type_name || 'Regular Member'}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-md font-medium border ${
                        member.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {member.status || 'Active'}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {member.first_name} {member.middle_name ? `${member.middle_name} ` : ''}{member.last_name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{member.branch_name || 'Main Branch'}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Enrolled: {member.joined_date || 'N/A'}</span>
                    </span>
                    {member.tin_number && (
                      <span className="flex items-center space-x-1 text-amber-300 font-mono font-medium">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        <span>TIN: {member.tin_number}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsEditingPersonal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Edit Personal Info</span>
                </button>
                {cbuAccount && (
                  <button
                    onClick={() => setSelectedCbuAccount(cbuAccount)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow-lg shadow-emerald-950/50"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>View CBU Ledger</span>
                  </button>
                )}
                {onNavigateToMembers && (
                  <button
                    onClick={onNavigateToMembers}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center space-x-1 transition cursor-pointer"
                  >
                    <span>Registry</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="flex items-center space-x-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Share Capital (CBU)</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {cbuAccount?.paid_up_shares || 0} sh
                  </span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white font-mono">
                  ₱{Number(stats.total_share_capital || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Subscribed: ₱{Number(cbuAccount?.subscribed_amount || 0).toLocaleString()}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="flex items-center space-x-1">
                    <PiggyBank className="w-3.5 h-3.5 text-blue-400" />
                    <span>Savings Balance</span>
                  </span>
                  <span className="text-[10px] text-blue-400">{savingsAccounts.length} Accts</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white font-mono">
                  ₱{Number(stats.total_savings || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Regular & Term Deposits
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="flex items-center space-x-1">
                    <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                    <span>Active Loan Balance</span>
                  </span>
                  <span className="text-[10px] text-amber-400">{stats.active_loans_count || 0} Active</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-white font-mono">
                  ₱{Number(stats.total_loan_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {loans.length} total loans on record
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span className="flex items-center space-x-1">
                    <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>KYC & File Status</span>
                  </span>
                  <span className="text-[10px] text-purple-300">
                    {docs.id_photo?.has_file ? 'ID Verified' : 'ID Pending'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 mt-1">
                  {docs.id_photo?.has_file ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ID Verified</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Needs Gov ID</span>
                    </span>
                  )}
                  {docs.birth_certificate?.has_file && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                      Birth Cert ✓
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5">
                  {Object.values(docs).filter((d: any) => d.has_file).length} documents attached
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 border-b border-slate-800 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'documents'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>KYC & Attached Files (Photos, Birth, Marriage)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                {Object.values(docs).filter((d: any) => d.has_file).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('personal')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'personal'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal & Contact Info</span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'accounts'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span>Financial Accounts (CBU, Savings & Loans)</span>
            </button>

            <button
              onClick={() => setActiveTab('custom_fields')}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition cursor-pointer whitespace-nowrap ${
                activeTab === 'custom_fields'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-white hover:border-slate-700'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Custom Field Attributes</span>
            </button>
          </div>

          {/* TAB 1: KYC DOCUMENTS & ATTACHED FILES */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Member Identification & Regulatory File Records</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Upload ID photos, member portrait (2x2), birth certificates, marriage contracts, and supporting documents.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Accepted formats: JPG, PNG, PDF, DOC, XLS</span>
                </div>
              </div>

              {/* Standard Documents Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {standardDocsList.map(item => {
                  const docData = docs[item.key];
                  const rawVal = docData?.value ?? (docData?.path || docData?.url ? docData : null);
                  const hasFile = Boolean(docData?.has_file || rawVal || docData?.path || docData?.url);
                  const isImage = item.type === 'Image' || (typeof rawVal === 'string' && rawVal.startsWith('data:image')) || rawVal?.type?.startsWith('image/');
                  const isPdf = item.type === 'PDF' || (typeof rawVal === 'string' && rawVal.includes('application/pdf')) || rawVal?.type?.includes('pdf') || (typeof rawVal?.name === 'string' && rawVal.name.toLowerCase().endsWith('.pdf'));
                  

                  return (
                    <div
                      key={item.key}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-lg"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-bold text-white">{item.title}</span>
                              {item.required && <span className="text-rose-400 text-xs font-bold">*</span>}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.subtitle}</p>
                          </div>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 border ${
                              item.type === 'Image'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : item.type === 'PDF'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {item.type}
                          </span>
                        </div>

                        {/* File Preview Area */}
                        <div className="mt-3">
                          {hasFile ? (
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
                              {isImage ? (
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-700 hidden">
                                  <img
                                    src={rawVal?.dataUrl || rawVal}
                                    alt={item.title}
                                    className="hidden w-full h-full object-cover cursor-pointer"
                                    onClick={() =>
                                      setPreviewDoc({
                                        title: item.title,
                                        dataUrl: rawVal?.dataUrl || rawVal,
                                        type: rawVal?.type || 'image/jpeg'
                                      })
                                    }
                                  />
                                </div>
                              ) : isPdf ? (
                                <div className="w-12 h-12 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                                  <FileText className="w-6 h-6 text-rose-400" />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                                  <File className="w-6 h-6 text-blue-400" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white truncate">
                                  {rawVal?.name || `${item.key}.${item.type.toLowerCase()}`}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                                  <span className="text-emerald-400 flex items-center space-x-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Uploaded</span>
                                  </span>
                                  {rawVal?.size && (
                                    <span>{(rawVal.size / 1024).toFixed(0)} KB</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-4 text-center">
                              <p className="text-xs text-slate-400">No {item.title.toLowerCase()} attached yet.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upload / Replace / Download / Remove actions */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 w-full">
                        {hasFile && (
                          <div className="flex items-center space-x-1.5 order-2 hidden">
                            <button
                              onClick={() => {
                                const url = rawVal?.dataUrl || rawVal;
                                setPreviewDoc({ title: item.title, dataUrl: url, type: rawVal?.type || 'application/octet-stream' });
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1 cursor-pointer transition"
                              title="Preview document"
                            >
                              <Eye className="w-3.5 h-3.5 text-cyan-400" />
                              <span>View</span>
                            </button>

                            <button
                              onClick={() => {
                                const url = rawVal?.dataUrl || rawVal;
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = rawVal?.name || `${item.key}_${member.member_no}.${item.type.toLowerCase()}`;
                                link.click();
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition"
                              title="Download file"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to remove ${item.title}?`)) {
                                  handleSaveDocument(item.key, null);
                                }
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 cursor-pointer transition"
                              title="Delete file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Inline Upload component */}
                        <div className={hasFile ? '' : 'w-full'}>
                          <CustomFileUploadField
                            label={item.title}
                            fieldType={item.type}
                            required={item.required}
                            value={hasFile ? rawVal : null}
                            onChange={(val) => handleSaveDocument(item.key, val)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Dynamic Custom Document Fields */}
                {dynamicDocFields.map(cf => {
                  const key = cf.field_name || cf.field_key || '';
                  const label = cf.field_label || cf.label || key;
                  const fType = cf.field_type || 'File';
                  const docData = docs[key];
                  const rawVal = docData?.value ?? (docData?.path || docData?.url ? docData : null);
                  const hasFile = Boolean(docData?.has_file || rawVal || docData?.path || docData?.url);

                  return (
                    <div
                      key={key}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition shadow-lg"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-bold text-white">{label}</span>
                            <p className="text-[11px] text-slate-400 mt-0.5">Dynamic Custom Field</p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
                            {fType}
                          </span>
                        </div>

                        <div className="mt-3">
                          {hasFile ? (
                            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center space-x-3">
                              <File className="w-6 h-6 text-purple-400 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-white truncate">
                                  {rawVal?.name || `${key}.${String(fType).toLowerCase()}`}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">Custom Attachment</div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-slate-950/60 border border-dashed border-slate-800 rounded-xl p-4 text-center">
                              <p className="text-xs text-slate-400">No {label.toLowerCase()} attached.</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80">
                        <CustomFileUploadField
                          label={label}
                          fieldType={fType}
                          required={Boolean(cf.required || cf.is_required)}
                          value={hasFile ? rawVal : null}
                          onChange={(val) => handleSaveDocument(key, val)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: PERSONAL & CONTACT INFORMATION */}
          {activeTab === 'personal' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Personal Details, Contact, & Tax Identification (TIN)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Official cooperative registry data, BIR tax exemption compliance, and residential address.
                  </p>
                </div>
                {!isEditingPersonal && (
                  <button
                    onClick={() => setIsEditingPersonal(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile Data</span>
                  </button>
                )}
              </div>

              {isEditingPersonal ? (
                <form onSubmit={handleSavePersonal} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300">First Name *</label>
                      <input
                        type="text"
                        required
                        value={personalForm.first_name}
                        onChange={e => setPersonalForm({ ...personalForm, first_name: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300">Middle Name</label>
                      <input
                        type="text"
                        value={personalForm.middle_name}
                        onChange={e => setPersonalForm({ ...personalForm, middle_name: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={personalForm.last_name}
                        onChange={e => setPersonalForm({ ...personalForm, last_name: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300">Gender</label>
                      <select
                        value={personalForm.gender}
                        onChange={e => setPersonalForm({ ...personalForm, gender: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300">Birthdate</label>
                      <input
                        type="date"
                        value={personalForm.birthdate}
                        onChange={e => setPersonalForm({ ...personalForm, birthdate: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-amber-300 flex items-center space-x-1">
                        <Tag className="w-3.5 h-3.5 text-amber-400" />
                        <span>Tax Identification Number (TIN)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="000-000-000-000"
                        value={personalForm.tin_number}
                        onChange={e => setPersonalForm({ ...personalForm, tin_number: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-amber-500/50 rounded-lg px-3 py-2 text-xs font-mono text-amber-200 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300">Email Address</label>
                      <input
                        type="email"
                        value={personalForm.email}
                        onChange={e => setPersonalForm({ ...personalForm, email: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300">Telephone / Mobile</label>
                      <input
                        type="tel"
                        value={personalForm.phone}
                        onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300">Residence Address</label>
                    <input
                      type="text"
                      value={personalForm.address}
                      onChange={e => setPersonalForm({ ...personalForm, address: e.target.value })}
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-medium text-slate-300">Assigned Branch</label>
                      <input type="hidden" name="branch_id" value={personalForm.branch_id} />
                      <div className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300">
                        {branches.find(branch => branch.id === personalForm.branch_id)?.name || personalForm.branch_id}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300">Membership Tier</label>
                      <select
                        value={personalForm.member_type_id}
                        onChange={e => setPersonalForm({ ...personalForm, member_type_id: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                      >
                        {memberTypes.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-slate-300">Member Status</label>
                      <select
                        value={personalForm.status}
                        onChange={e => setPersonalForm({ ...personalForm, status: e.target.value })}
                        className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Deceased">Deceased</option>
                        <option value="Withdrawn">Withdrawn</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300">Notes / Remarks</label>
                    <textarea
                      rows={2}
                      value={personalForm.notes}
                      onChange={e => setPersonalForm({ ...personalForm, notes: e.target.value })}
                      placeholder="Remarks, farming profile annotations, special notes..."
                      className="w-full mt-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsEditingPersonal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingPersonal}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-lg"
                    >
                      {isSavingPersonal ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs">
                  <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Personal Identity
                    </span>
                    <div>
                      <span className="text-slate-500 block">Full Name:</span>
                      <span className="font-semibold text-white text-sm">
                        {member.first_name} {member.middle_name} {member.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Gender & Birthdate:</span>
                      <span className="text-slate-200">
                        {member.gender || 'Not set'} • {member.birthdate || 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Civil Status:</span>
                      <span className="text-slate-200">{member.civil_status || 'Single'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Contact & Address
                    </span>
                    <div>
                      <span className="text-slate-500 block">Email Address:</span>
                      <span className="text-slate-200 font-mono">{member.email || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Telephone / Mobile:</span>
                      <span className="text-slate-200 font-mono">{member.phone || 'None'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Residence:</span>
                      <span className="text-slate-200">{member.address || 'None provided'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Tax & Membership Registry
                    </span>
                    <div>
                      <span className="text-slate-500 block">TIN Number (BIR):</span>
                      <span className="font-mono text-amber-300 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 inline-block mt-0.5">
                        {member.custom_field_values.tin_number || member.tin || 'Not Set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Branch & Tier:</span>
                      <span className="text-slate-200">
                        {member.branch_name || 'Main Branch'} • {member.member_type_name || 'Regular'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Notes & Annotations:</span>
                      <span className="text-slate-300 italic">{member.notes || 'No annotations recorded.'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINANCIAL ACCOUNTS (CBU, SAVINGS & LOANS) */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              {/* Share Capital (CBU) Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <Coins className="w-4 h-4 text-emerald-400" />
                      <span>Share Capital Subscription & Capital Build-Up (CBU)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Cooperative voting equity, subscribed shares, and paid-up capital records.
                    </p>
                  </div>
                  {cbuAccount && (
                    <button
                      onClick={() => setSelectedCbuAccount(cbuAccount)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow"
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>Open Share Deposit Ledger</span>
                    </button>
                  )}
                </div>

                {cbuAccount ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Account No.</span>
                      <span className="text-sm font-mono font-bold text-emerald-300">{cbuAccount.account_number}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">Par Value: ₱{cbuAccount.par_value || 100}</span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Subscribed Shares</span>
                      <span className="text-sm font-mono font-bold text-white">
                        {cbuAccount.subscribed_shares?.toLocaleString()} sh
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        ₱{Number(cbuAccount.subscribed_amount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Paid-Up Shares</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        {cbuAccount.paid_up_shares?.toLocaleString()} sh
                      </span>
                      <span className="text-[10px] text-emerald-400 block mt-1 font-semibold">
                        ₱{Number(cbuAccount.paid_up_amount || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Fulfillment %</span>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  ((cbuAccount.paid_up_amount || 0) / (cbuAccount.subscribed_amount || 1)) * 100
                                )
                              )}%`
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-white">
                          {Math.round(
                            ((cbuAccount.paid_up_amount || 0) / (cbuAccount.subscribed_amount || 1)) * 100
                          )}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        Unpaid: ₱{Math.max(0, (cbuAccount.subscribed_amount || 0) - (cbuAccount.paid_up_amount || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-slate-950/60 rounded-xl text-center text-slate-400 border border-slate-800">
                    <p className="text-xs">No Share Capital account opened yet for this member.</p>
                  </div>
                )}
              </div>

              {/* Savings Accounts Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <PiggyBank className="w-4 h-4 text-blue-400" />
                      <span>Savings & Deposit Passbook Accounts</span>
                    </h3>
                    <p className="text-xs text-slate-400">Regular savings, time deposits, and youth savings accounts.</p>
                  </div>
                  {onNavigateToSavings && (
                    <button
                      onClick={onNavigateToSavings}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 cursor-pointer transition"
                    >
                      <span>Savings Module</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {savingsAccounts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Account Number</th>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3 text-right">Available Balance</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {savingsAccounts.map((sa: any) => (
                          <tr key={sa.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-semibold text-white">{sa.account_number}</td>
                            <td className="py-2.5 px-3 text-slate-300">{sa.product_name || 'Regular Savings'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                              ₱{Number(sa.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {sa.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/60 rounded-xl text-center text-slate-400">
                    <p className="text-xs">No active savings accounts registered.</p>
                  </div>
                )}
              </div>

              {/* Loans Facility Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>Credit Facilities & Loan Obligations</span>
                    </h3>
                    <p className="text-xs text-slate-400">Active and past cooperative loan facilities.</p>
                  </div>
                  {onNavigateToLoans && (
                    <button
                      onClick={onNavigateToLoans}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center space-x-1 cursor-pointer transition"
                    >
                      <span>Loans Module</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {loans.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3">Loan No.</th>
                          <th className="py-2.5 px-3">Loan Product</th>
                          <th className="py-2.5 px-3 text-right">Principal</th>
                          <th className="py-2.5 px-3 text-right">Outstanding Balance</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {loans.map((l: any) => (
                          <tr key={l.id} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-3 font-mono font-semibold text-white">{l.loan_no || l.id}</td>
                            <td className="py-2.5 px-3 text-slate-300">{l.product_name || 'Coop Loan'}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                              ₱{Number(l.principal_amount || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                              ₱{Number(l.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                  ['Active', 'Current', 'Disbursed'].includes(l.status)
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                }`}
                              >
                                {l.status || 'Active'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/60 rounded-xl text-center text-slate-400">
                    <p className="text-xs">No loan records on file for this member.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DYNAMIC CUSTOM FIELD ATTRIBUTES */}
          {activeTab === 'custom_fields' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span>Dynamic Member Custom Attributes</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Custom fields configured dynamically via Member Custom Fields or Config Center.
                  </p>
                </div>
                <button
                  onClick={handleSaveCustomFields}
                  disabled={isSavingCustom}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer shadow"
                >
                  {isSavingCustom ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Custom Fields</span>
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields
                  .filter(f => (f.entity || 'Member') === 'Member')
                  .map(f => {
                    const key = f.field_name || f.field_key || '';
                    const label = f.field_label || f.label || key;
                    const fType = f.field_type;
                    const value = customInputs[key] ?? '';
                    const isFile = ['file', 'image', 'document', 'pdf'].includes(String(fType).toLowerCase());

                    return (
                      <div key={f.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-slate-200">
                            {label}
                            {Boolean(f.required || f.is_required) && <span className="text-rose-400 ml-1">*</span>}
                          </label>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400">
                            {fType}
                          </span>
                        </div>

                        {isFile ? (
                          <CustomFileUploadField
                            label={label}
                            fieldType={fType}
                            required={Boolean(f.required || f.is_required)}
                            value={value}
                            onChange={val => setCustomInputs({ ...customInputs, [key]: val })}
                          />
                        ) : fType === 'Dropdown' ? (
                          <select
                            value={value}
                            onChange={e => setCustomInputs({ ...customInputs, [key]: e.target.value })}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                          >
                            <option value="">Select option...</option>
                            {(f.options || []).map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={fType === 'Number' || fType === 'Currency' ? 'number' : 'text'}
                            value={value}
                            onChange={e => setCustomInputs({ ...customInputs, [key]: e.target.value })}
                            placeholder={`Enter ${label}...`}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL: Full View Document Previewer */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{previewDoc.title}</h3>
                <span className="text-[10px] text-slate-400 font-mono">{previewDoc.type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = previewDoc.dataUrl;
                    link.download = `${previewDoc.title.toLowerCase().replace(/\s+/g, '_')}`;
                    link.click();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-1 cursor-pointer transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="text-slate-400 hover:text-white p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              {previewDoc.dataUrl.startsWith('data:image/') || previewDoc.type.startsWith('image/') ? (
                <img
                  src={previewDoc.dataUrl}
                  alt={previewDoc.title}
                  className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : previewDoc.dataUrl.includes('application/pdf') || previewDoc.type.includes('pdf') ? (
                <iframe
                  src={previewDoc.dataUrl}
                  title={previewDoc.title}
                  className="w-full h-[70vh] rounded-lg border border-slate-800"
                />
              ) : (
                <div className="text-center py-12 space-y-3">
                  <File className="w-16 h-16 text-slate-500 mx-auto" />
                  <p className="text-sm text-slate-300">Binary attachment preview not supported in iframe.</p>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = previewDoc.dataUrl;
                      link.download = previewDoc.title;
                      link.click();
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    Download File to View
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Individual Share Deposit Ledger */}
      {selectedCbuAccount && (
        <IndividualShareDepositLedgerModal
          account={selectedCbuAccount}
          onClose={() => setSelectedCbuAccount(null)}
          onNewDeposit={() => {
            setSelectedCbuAccount(null);
            if (onNavigateToShareCapital) onNavigateToShareCapital();
          }}
        />
      )}
    </div>
  );
};
