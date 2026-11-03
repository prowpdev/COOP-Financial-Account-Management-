import type { TabKey } from './components/Sidebar';
import type { AccountingTabKey } from './components/operations/AccountingModule';

export interface AppRoute {
  tab: TabKey;
  memberId?: string;
  accountingView?: AccountingTabKey;
  accountId?: string;
}

const TAB_PATHS: Record<TabKey, string> = {
  superadmin_console: '/admin',
  dashboard: '/dashboard',
  configuration: '/configuration',
  excel_workbench: '/excel-workbench',
  members: '/members',
  member_profile: '/members/profile',
  member_fields: '/members/fields',
  user_documents: '/user-documents',
  board_resolutions: '/board-resolutions',
  user_profile: '/user-profile',
  loans: '/loans',
  savings: '/savings',
  share_capital: '/share-capital',
  accounting: '/accounting',
  reports: '/financial-reports',
  reports_module: '/reports',
  audit_logs: '/audit-logs',
  verification: '/verification'
};

const ACCOUNTING_PATHS: Record<AccountingTabKey, string> = {
  overview: '',
  reconciliation: 'reconciliation',
  general_ledger: 'general-ledger',
  general_journal: 'general-journal',
  cash_receipt_journal: 'cash-receipt-journal',
  cash_disbursement_journal: 'cash-disbursement-journal',
  voucher_cards: 'voucher-cards',
  account_report: 'account-ledger',
  mappings: 'mappings',
  cash_banks: 'cash-banks'
};

const LEGACY_TAB_PATHS: Partial<Record<string, TabKey>> = {
  superadmin: 'superadmin_console',
  superadmin_console: 'superadmin_console',
  dashboard: 'dashboard',
  configuration: 'configuration',
  excel_workbench: 'excel_workbench',
  members: 'members',
  member_profile: 'member_profile',
  member_fields: 'member_fields',
  user_documents: 'user_documents',
  board_resolutions: 'board_resolutions',
  user_profile: 'user_profile',
  loans: 'loans',
  savings: 'savings',
  share_capital: 'share_capital',
  accounting: 'accounting',
  reports: 'reports',
  reports_module: 'reports_module',
  audit_logs: 'audit_logs',
  verification: 'verification'
};

const readLegacyTab = (value: string | null): TabKey | undefined => {
  if (!value) return undefined;
  const key = value.toLowerCase().trim().replace(/-/g, '_');
  return LEGACY_TAB_PATHS[key];
};

export const resolveAppRoute = (
  location: Pick<Location, 'pathname' | 'search' | 'hash'>
): AppRoute => {
  const parts = location.pathname.split('/').filter(Boolean);

  if (parts[0] === 'members') {
    if (parts[1] === 'profile') return { tab: 'member_profile' };
    if (parts[1] === 'fields') return { tab: 'member_fields' };
    if (parts[1]) return { tab: 'member_profile', memberId: decodeRoutePart(parts[1]) };
    return { tab: 'members' };
  }

  if (parts[0] === 'accounting') {
    if (parts[1] === 'gl' && parts[2]) {
      return {
        tab: 'accounting',
        accountingView: 'account_report',
        accountId: decodeRoutePart(parts[2])
      };
    }

    const section = parts[1];
    const accountingView = (Object.keys(ACCOUNTING_PATHS) as AccountingTabKey[])
      .find(key => ACCOUNTING_PATHS[key] === section);
    if (accountingView) return { tab: 'accounting', accountingView };
    if (!section) return { tab: 'accounting', accountingView: 'overview' };
  }

  const tab = Object.entries(TAB_PATHS).find(([, path]) => path === location.pathname)?.[0] as TabKey | undefined;
  if (tab) return { tab };

  if (location.pathname === '/') {
    const params = new URLSearchParams(location.search);
    const legacyTab = readLegacyTab(params.get('tab') || params.get('module'))
      || readLegacyTab(location.hash.replace(/^#\/?/, '').split('/')[0]);
    if (legacyTab) return { tab: legacyTab };
  }

  return { tab: 'dashboard' };
};

export const appRoutePath = (route: AppRoute): string => {
  if (route.tab === 'member_profile' && route.memberId) {
    return `/members/${encodeURIComponent(route.memberId)}`;
  }
  if (route.tab === 'accounting') {
    if (route.accountingView === 'account_report' && route.accountId) {
      return `/accounting/gl/${encodeURIComponent(route.accountId)}`;
    }
    const section = ACCOUNTING_PATHS[route.accountingView || 'overview'];
    return section ? `/accounting/${section}` : '/accounting';
  }
  return TAB_PATHS[route.tab];
};

const decodeRoutePart = (part: string): string => {
  try {
    return decodeURIComponent(part);
  } catch {
    return part;
  }
};
