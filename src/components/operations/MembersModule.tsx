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
  RefreshCw
} from 'lucide-react';
import { ExcelGridTable, ExcelColumn } from '../common/ExcelGridTable';
import { MemberTransactionReport } from '../reports/MemberTransactionReport';
import { api } from '../../services/api';
import { Branch, CustomField, Member, MemberType, User } from '../../types';

interface MembersModuleProps {
  branches: Branch[];
  memberTypes: MemberType[];
  customFields: CustomField[];
  currentUser: User;
  selectedBranchId?: string;
  onSelectBranch?: (id: string) => void;
}

export const MembersModule: React.FC<MembersModuleProps> = ({
  branches,
  memberTypes,
  customFields,
  currentUser,
  selectedBranchId,
  onSelectBranch
}) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState(selectedBranchId || 'all');
  const [isRegistering, setIsRegistering] = useState(false);
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
      render: (_, row) => (
        <span className="font-semibold text-white">
          {row.first_name} {row.middle_name ? row.middle_name + ' ' : ''}{row.last_name}
        </span>
      )
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
    { key: 'joined_date', header: 'Date Enrolled', width: '120px', type: 'date', align: 'center', sortable: true },
    { key: 'active', header: 'Status', width: '90px', type: 'boolean', align: 'center', sortable: true }
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
    custom_field_values: {} as Record<string, any>
  });

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
          </div>

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
              </div>

              {/* Dynamic Custom Form Fields (Req 13, Test 8) */}
              {customFields.length > 0 && (
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                    Dynamic Cooperative Custom Fields
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {customFields.map(cf => (
                      <div key={cf.id}>
                        <label className="text-xs text-slate-300 font-medium">
                          {cf.field_label} {cf.required && <span className="text-rose-400">*</span>}
                        </label>
                        {cf.field_type === 'Dropdown' ? (
                          <select
                            required={cf.required}
                            value={form.custom_field_values[cf.field_name] || ''}
                            onChange={e => setForm({
                              ...form,
                              custom_field_values: { ...form.custom_field_values, [cf.field_name]: e.target.value }
                            })}
                            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white cursor-pointer"
                          >
                            <option value="">Select option...</option>
                            {cf.options.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={cf.field_type === 'Number' || cf.field_type === 'Currency' ? 'number' : 'text'}
                            required={cf.required}
                            placeholder={cf.field_label}
                            value={form.custom_field_values[cf.field_name] || ''}
                            onChange={e => setForm({
                              ...form,
                              custom_field_values: { ...form.custom_field_values, [cf.field_name]: e.target.value }
                            })}
                            className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        )}
                      </div>
                    ))}
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

                    {/* Custom field attributes */}
                    {m.custom_field_values && Object.keys(m.custom_field_values).length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] space-y-1">
                        {Object.entries(m.custom_field_values).map(([k, v]) => (
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
                    <span className="text-emerald-400 font-medium">Active Member</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
