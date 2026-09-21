import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabKey } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ConfigCenter } from './components/config/ConfigCenter';
import { ExcelWorkbench } from './components/config/ExcelWorkbench';
import { MembersModule } from './components/operations/MembersModule';
import { LoansModule } from './components/operations/LoansModule';
import { SavingsModule } from './components/operations/SavingsModule';
import { ShareCapitalModule } from './components/operations/ShareCapitalModule';
import { AccountingModule } from './components/operations/AccountingModule';
import { FinancialReportsView } from './components/reports/FinancialReportsView';
import { FlexibilityTestSuite } from './components/verification/FlexibilityTestSuite';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPortal } from './components/auth/AuthPortal';
import { MemberPortal } from './components/member/MemberPortal';
import { SetupWizardModal } from './components/setup/SetupWizardModal';
import { api } from './services/api';
import {
  Account,
  Branch,
  CashAccount,
  CoopProfile,
  CustomField,
  FeatureToggle,
  LoanProduct,
  Member,
  MemberType,
  User,
  AuthSession
} from './types';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);

  // Authentication State: persistent session (Staff vs Member)
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => {
    try {
      const saved = localStorage.getItem('coop_auth_session');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse saved auth session:', e);
    }
    return null;
  });

  // Global Loaded State
  const [profile, setProfile] = useState<CoopProfile>({
    name: 'Mayap Care Agriculture Coop.',
    registration_no: 'CDA-REG-9502-100234',
    currency_code: 'PHP',
    currency_symbol: '₱',
    operating_mode: 'multi_branch',
    tax_exempt: true,
    fiscal_year_start_month: 1,
    contact_email: 'admin@gmail.com',
    contact_phone: '+63 (045) 982-1200',
    address: 'Barangay Care zone 5, Tarlac City, Tarlac, 2300 Philippines'
  });

  // UI Settings (Theme, Sidebar, Typography)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('mayap_theme') as 'dark' | 'light') || 'dark';
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('mayap_sidebar_collapsed') === 'true';
  });
  const [isLargeText, setIsLargeText] = useState<boolean>(() => {
    return localStorage.getItem('mayap_large_text') === 'true';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('mayap_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isLargeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }
    localStorage.setItem('mayap_large_text', String(isLargeText));
  }, [isLargeText]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('mayap_sidebar_collapsed', String(next));
      return next;
    });
  };

  const toggleTextSize = () => {
    setIsLargeText(prev => !prev);
  };

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_admin',
    name: 'Administrator',
    role_id: 'role_admin',
    role_name: 'Administrator',
    email: 'admin@coopflex.ph',
    branch_id: 'branch_hq'
  });

  const [featureToggles, setFeatureToggles] = useState<FeatureToggle[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>([]);
  const [cashAccounts, setCashAccounts] = useState<CashAccount[]>([]);
  const [memberTypes, setMemberTypes] = useState<MemberType[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Load foundational data
  const refreshGlobalState = async () => {
    try {
      const [
        profRes,
        branchRes,
        userRes,
        toggleRes,
        accRes,
        lpRes,
        cashRes,
        mtRes,
        cfRes
      ] = await Promise.all([
        api.getCoopProfile(),
        api.getBranches(),
        api.getUsers(),
        api.getFeatureToggles(),
        api.getAccounts(),
        api.getLoanProducts(),
        api.getCashAccounts(),
        api.getMemberTypes(),
        api.getCustomFields()
      ]);

      if (profRes.data) setProfile(profRes.data);
      if (branchRes.data) setBranches(branchRes.data);
      if (userRes.data) {
        setUsers(userRes.data);
        if (!currentUser.id && userRes.data.length > 0) {
          setCurrentUser(userRes.data[0]);
        }
      }
      if (toggleRes.data) setFeatureToggles(toggleRes.data);
      if (accRes.data) setAccounts(accRes.data);
      if (lpRes.data) setLoanProducts(lpRes.data);
      if (cashRes.data) setCashAccounts(cashRes.data);
      if (mtRes.data) setMemberTypes(mtRes.data);
      if (cfRes.data) setCustomFields(cfRes.data);
    } catch (err) {
      console.error('Failed loading system context:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshGlobalState();

    const handleOpenSetup = () => setIsSetupWizardOpen(true);
    const handleOpenAuth = () => setIsAuthModalOpen(true);

    window.addEventListener('coop:open-setup-wizard', handleOpenSetup);
    window.addEventListener('coop:open-auth-modal', handleOpenAuth);

    return () => {
      window.removeEventListener('coop:open-setup-wizard', handleOpenSetup);
      window.removeEventListener('coop:open-auth-modal', handleOpenAuth);
    };
  }, []);
 
  const handleReloadApp = () =>{
    location.reload();
  }
  const handleResetSeed = async () => {
    if (!window.confirm('Reset cooperative state to clean default seed configuration?')) return;
    setIsResetting(true);
    try {
      await api.resetToSeed();
      await refreshGlobalState();
      alert('System successfully reset to default configuration.');
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    setAuthSession(null);
    try {
      localStorage.removeItem('coop_auth_session');
    } catch (e) {
      console.error('Failed to clear session:', e);
    }
  };

  const handleOpenMemberPortal = async () => {
    try {
      const res = await api.getMembers();
      const members = res.data || [];
      const memberToUse: Member = members.length > 0 ? members[0] : {
        id: 'mem_sample_01',
        member_no: 'MEM-2026-0001',
        first_name: 'Juan',
        last_name: 'Dela Cruz',
        middle_name: 'Santos',
        contact_no: '09171234567',
        email: 'juan.delacruz@agricoop.ph',
        branch_id: 'branch_hq',
        member_type_id: 'mtype_regular',
        status: 'active',
        date_of_birth: '1985-05-15',
        gender: 'male',
        membership_date: '2022-01-15'
      };
      const memberSession: AuthSession = {
        type: 'member',
        member: memberToUse,
        token: `member_token_${Date.now()}`
      };
      setAuthSession(memberSession);
      localStorage.setItem('coop_auth_session', JSON.stringify(memberSession));
    } catch (e) {
      console.error('Failed to switch to member portal:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-300">
          Loading Cooperative System Engine...
        </p>
      </div>
    );
  }

  // 1. Unauthenticated: Outside Login & Registration Portal
  if (!authSession) {
    return (
      <AuthPortal
        onSuccess={(session) => {
          setAuthSession(session);
          try {
            localStorage.setItem('coop_auth_session', JSON.stringify(session));
          } catch (e) {
            console.error('Failed to save session:', e);
          }
          if (session.type === 'staff') {
            setCurrentUser(session.user);
          }
        }}
      />
    );
  }

  // 2. Member Portal: Dedicated Member Self-Service Dashboard
  if (authSession.type === 'member') {
    return (
      <MemberPortal
        member={authSession.member}
        onLogout={handleLogout}
        onSwitchToStaff={() => {
          const staffSession: AuthSession = {
            type: 'staff',
            user: currentUser,
            token: `staff_token_${Date.now()}`
          };
          setAuthSession(staffSession);
          try {
            localStorage.setItem('coop_auth_session', JSON.stringify(staffSession));
          } catch (e) {}
        }}
      />
    );
  }

  // 3. Staff / Admin Management Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Application Header */}
      <Header
        cooperativeName={profile.name}
        branches={branches}
        selectedBranchId={selectedBranchId}
        onSelectBranch={setSelectedBranchId}
        currentUser={currentUser}
        users={users}
        onSwitchUser={setCurrentUser}
        onOpenVerification={() => setActiveTab('verification')}
        onResetSeed={handleReloadApp}
        isResetting={isResetting}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={toggleSidebar}
        theme={theme}
        onToggleTheme={toggleTheme}
        isLargeText={isLargeText}
        onToggleTextSize={toggleTextSize}
        onOpenSetupWizard={() => setIsSetupWizardOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenMemberPortal={handleOpenMemberPortal}
      />

      {/* Main View Area with Persistent Collapsible Sidebar */}
      <div className="flex-1 flex max-w-[1920px] w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          featureToggles={featureToggles}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebar}
        />

        <main className="flex-1 p-6 overflow-x-hidden min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              selectedBranchId={selectedBranchId}
              branches={branches}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'configuration' && (
            <ConfigCenter
              onRefresh={refreshGlobalState}
              onConfigUpdated={refreshGlobalState}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'excel_workbench' && (
            <ExcelWorkbench
              currentUser={currentUser}
              onRefresh={refreshGlobalState}
            />
          )}

          {activeTab === 'members' && (
            <MembersModule
              branches={branches}
              memberTypes={memberTypes}
              customFields={customFields}
              currentUser={currentUser}
              selectedBranchId={selectedBranchId}
              onSelectBranch={setSelectedBranchId}
            />
          )}

          {activeTab === 'loans' && (
            <LoansModule
              branches={branches}
              loanProducts={loanProducts}
              cashAccounts={cashAccounts}
              currentUser={currentUser}
              selectedBranchId={selectedBranchId}
              onSelectBranch={setSelectedBranchId}
            />
          )}

          {activeTab === 'savings' && (
            <SavingsModule
              branches={branches}
              cashAccounts={cashAccounts}
              currentUser={currentUser}
              selectedBranchId={selectedBranchId}
              onSelectBranch={setSelectedBranchId}
            />
          )}

          {activeTab === 'share_capital' && (
            <ShareCapitalModule
              branches={branches}
              cashAccounts={cashAccounts}
              currentUser={currentUser}
              selectedBranchId={selectedBranchId}
              onSelectBranch={setSelectedBranchId}
            />
          )}

          {activeTab === 'accounting' && (
            <AccountingModule
              accounts={accounts}
              branches={branches}
              currentUser={currentUser}
              selectedBranchId={selectedBranchId}
              onSelectBranch={setSelectedBranchId}
            />
          )}

          {activeTab === 'reports' && (
            <FinancialReportsView
              selectedBranchId={selectedBranchId}
              branches={branches}
              onSelectBranch={setSelectedBranchId}
            />
          )}

          {activeTab === 'verification' && <FlexibilityTestSuite />}
        </main>
      </div>

      {/* User Login and Registration Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        users={users}
        branches={branches}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          refreshGlobalState();
        }}
        onUserRegistered={(newUser) => {
          setUsers(prev => [...prev, newUser]);
          setCurrentUser(newUser);
        }}
      />

      {/* Interactive Guided Setup & System Reset Center */}
      <SetupWizardModal
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        onNavigateTab={(tabKey) => setActiveTab(tabKey as TabKey)}
        onRefreshData={refreshGlobalState}
      />
    </div>
  );
}
