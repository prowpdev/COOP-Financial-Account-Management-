import { DatabaseEngine } from './database';
import { initialSeedData } from './seed';

export function runBranchIsolationMigration(db: DatabaseEngine) {
  const data = db.load();
  let modified = false;

  // 1. Ensure role_superadmin exists in user_roles
  if (!data.user_roles) {
    data.user_roles = [];
  }
  const hasSuperadminRole = data.user_roles.some(r => r.id === 'role_superadmin');
  if (!hasSuperadminRole) {
    data.user_roles.unshift({
      id: 'role_superadmin',
      name: 'Super Administrator',
      description: 'Exclusive platform governance: user & role administration, branch & cooperative setup, and global audit oversight',
      permissions: [
        'users.view', 'users.create', 'users.edit', 'users.activate', 'users.deactivate',
        'roles.view', 'roles.edit',
        'branches.view', 'branches.create', 'branches.edit',
        'cooperative.view', 'cooperative.edit',
        'audit.view', 'audit.export'
      ]
    });
    modified = true;
  }

  // 2. Ensure initial users exist with role_superadmin and other roles
  if (!data.users || data.users.length === 0) {
    data.users = initialSeedData.users.map(u => ({ ...u }));
    modified = true;
  } else {
    // Ensure at least one superadmin account exists
    const hasSuperAdminUser = data.users.some(u => u.role_id === 'role_superadmin' || u.username === 'superadmin');
    if (!hasSuperAdminUser) {
      data.users.unshift({
        id: 'usr_superadmin',
        username: 'superadmin',
        password_hash: 'admin123',
        raw_password: 'admin123',
        full_name: 'Chief Super Administrator',
        email: 'superadmin@coopflex.ph',
        role_id: 'role_superadmin',
        branch_id: 'branch_tar',
        is_super_admin: true,
        active: true,
        last_login: new Date().toISOString(),
        created_at: '2026-01-01T08:00:00.000Z'
      });
      modified = true;
    }
  }

  // Ensure default branch exists
  if (!data.branches || data.branches.length === 0) {
    data.branches = [
      {
        id: 'branch_tar',
        cooperative_id: 'coop_01',
        name: 'Main Branch - Tarlac',
        code: 'TAR',
        address: 'San Nicolas, Tarlac City, Tarlac',
        contact_number: '+63 45 982 1000',
        active: true,
        is_main: true,
        created_at: new Date().toISOString()
      }
    ];
    modified = true;
  }

  const defaultBranchId = data.branches[0]?.id || 'branch_tar';

  // Build ID lookup maps for parent relational backfilling
  const loanBranchMap = new Map<string, string>();
  (data.loans || []).forEach(l => {
    if (l.id && l.branch_id) loanBranchMap.set(l.id, l.branch_id);
  });

  const memberBranchMap = new Map<string, string>();
  (data.members || []).forEach(m => {
    if (m.id && m.branch_id) memberBranchMap.set(m.id, m.branch_id);
  });

  const savingsBranchMap = new Map<string, string>();
  (data.savings_accounts || []).forEach(s => {
    if (s.id && s.branch_id) savingsBranchMap.set(s.id, s.branch_id);
  });

  const shareCapBranchMap = new Map<string, string>();
  (data.share_capital_accounts || []).forEach(sc => {
    if (sc.id && sc.branch_id) shareCapBranchMap.set(sc.id, sc.branch_id);
  });

  const cashBranchMap = new Map<string, string>();
  (data.cash_accounts || []).forEach(ca => {
    if (ca.id && ca.branch_id) cashBranchMap.set(ca.id, ca.branch_id);
  });

  const journalBranchMap = new Map<string, string>();
  (data.journal_entries || []).forEach(je => {
    if (je.id && je.branch_id) journalBranchMap.set(je.id, je.branch_id);
  });

  const userBranchMap = new Map<string, string>();
  (data.users || []).forEach(u => {
    if (u.id && u.branch_id) userBranchMap.set(u.id, u.branch_id);
  });

  // Table list to verify branch_id foreign key
  const tables = Object.keys(data) as (keyof typeof data)[];

  for (const tableName of tables) {
    const records = data[tableName];
    if (Array.isArray(records)) {
      for (const rec of records) {
        if (!rec || typeof rec !== 'object') continue;

        if (!rec.branch_id) {
          if (tableName === 'branches') {
            rec.branch_id = rec.id || defaultBranchId;
          } else if (tableName === 'loan_amortization_schedules' && rec.loan_id && loanBranchMap.has(rec.loan_id)) {
            rec.branch_id = loanBranchMap.get(rec.loan_id);
          } else if (tableName === 'loan_payments' && rec.loan_id && loanBranchMap.has(rec.loan_id)) {
            rec.branch_id = loanBranchMap.get(rec.loan_id);
          } else if (tableName === 'loan_payment_allocations' && rec.loan_id && loanBranchMap.has(rec.loan_id)) {
            rec.branch_id = loanBranchMap.get(rec.loan_id);
          } else if (tableName === 'savings_transactions' && rec.savings_account_id && savingsBranchMap.has(rec.savings_account_id)) {
            rec.branch_id = savingsBranchMap.get(rec.savings_account_id);
          } else if (tableName === 'share_capital_transactions' && rec.share_capital_account_id && shareCapBranchMap.has(rec.share_capital_account_id)) {
            rec.branch_id = shareCapBranchMap.get(rec.share_capital_account_id);
          } else if (tableName === 'cash_transactions' && rec.cash_account_id && cashBranchMap.has(rec.cash_account_id)) {
            rec.branch_id = cashBranchMap.get(rec.cash_account_id);
          } else if (tableName === 'journal_lines' && rec.journal_entry_id && journalBranchMap.has(rec.journal_entry_id)) {
            rec.branch_id = journalBranchMap.get(rec.journal_entry_id);
          } else if (tableName === 'user_documents' && rec.user_id && userBranchMap.has(rec.user_id)) {
            rec.branch_id = userBranchMap.get(rec.user_id);
          } else if (rec.member_id && memberBranchMap.has(rec.member_id)) {
            rec.branch_id = memberBranchMap.get(rec.member_id);
          } else {
            rec.branch_id = defaultBranchId;
          }
          modified = true;
        }
      }
    }
  }

  if (modified) {
    db.save();
    console.log('[branchMigration] Successfully verified and updated branch_id foreign keys across all database tables.');
  }
}
