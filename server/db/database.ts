import fs from 'fs';
import path from 'path';

export interface DatabaseSchema {
  cooperatives: any[];
  branches: any[];
  system_settings: any[];
  feature_toggles: any[];
  chart_of_accounts: any[];
  financial_statement_mappings: any[];
  accounting_periods: any[];
  accounting_mappings: any[];
  numbering_formats: any[];
  approval_workflows: any[];
  approval_rules: any[];
  custom_fields: any[];
  member_types: any[];
  members: any[];
  loan_products: any[];
  loan_product_versions: any[];
  loan_applications: any[];
  loans: any[];
  loan_amortization_schedules: any[];
  loan_payments: any[];
  loan_payment_allocations: any[];
  savings_products: any[];
  savings_accounts: any[];
  savings_transactions: any[];
  share_capital_settings: any[];
  share_capital_accounts: any[];
  share_capital_transactions: any[];
  cash_accounts: any[];
  cash_transactions: any[];
  fees: any[];
  penalty_rules: any[];
  payment_allocation_rules: any[];
  payment_frequencies: any[];
  document_requirements: any[];
  notification_rules: any[];
  transaction_types: any[];
  journal_entries: any[];
  journal_lines: any[];
  general_ledger: any[];
  configuration_audit_trails: any[];
  user_roles: any[];
  users: any[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'coop_database.json');

class DatabaseEngine {
  private data: DatabaseSchema = {
    cooperatives: [],
    branches: [],
    system_settings: [],
    feature_toggles: [],
    chart_of_accounts: [],
    financial_statement_mappings: [],
    accounting_periods: [],
    accounting_mappings: [],
    numbering_formats: [],
    approval_workflows: [],
    approval_rules: [],
    custom_fields: [],
    member_types: [],
    members: [],
    loan_products: [],
    loan_product_versions: [],
    loan_applications: [],
    loans: [],
    loan_amortization_schedules: [],
    loan_payments: [],
    loan_payment_allocations: [],
    savings_products: [],
    savings_accounts: [],
    savings_transactions: [],
    share_capital_settings: [],
    share_capital_accounts: [],
    share_capital_transactions: [],
    cash_accounts: [],
    cash_transactions: [],
    fees: [],
    penalty_rules: [],
    payment_allocation_rules: [],
    payment_frequencies: [],
    document_requirements: [],
    notification_rules: [],
    transaction_types: [],
    journal_entries: [],
    journal_lines: [],
    general_ledger: [],
    configuration_audit_trails: [],
    user_roles: [],
    users: []
  };

  private initialized = false;

  constructor() {
    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public load(): DatabaseSchema {
    this.ensureDataDir();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
        this.initialized = true;
        return this.data;
      } catch (err: any) {
        console.error('Error reading database file:', err);
        throw new Error(`Failed to load database file (${DB_FILE}): ${err.message}`);
      }
    }
    return this.data;
  }

  public save(): void {
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  public getTable<K extends keyof DatabaseSchema>(tableName: K): DatabaseSchema[K] {
    if (!this.initialized) {
      this.load();
    }
    if (!this.data[tableName]) {
      this.data[tableName] = [] as any;
    }
    return this.data[tableName];
  }

  public insert<K extends keyof DatabaseSchema>(tableName: K, record: any): any {
    const table = this.getTable(tableName);
    table.push(record);
    this.save();
    return record;
  }

  public update<K extends keyof DatabaseSchema>(tableName: K, predicate: (item: any) => boolean, updater: (item: any) => any): any {
    const table = this.getTable(tableName);
    let updatedCount = 0;
    for (let i = 0; i < table.length; i++) {
      if (predicate(table[i])) {
        table[i] = updater(table[i]);
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      this.save();
    }
    return updatedCount;
  }

  public delete<K extends keyof DatabaseSchema>(tableName: K, predicate: (item: any) => boolean): number {
    const table = this.getTable(tableName);
    const initialLen = table.length;
    this.data[tableName] = table.filter(item => !predicate(item)) as any;
    const deleted = initialLen - this.data[tableName].length;
    if (deleted > 0) {
      this.save();
    }
    return deleted;
  }

  public recordAudit(setting: string, oldValue: any, newValue: any, changedBy: string, reason: string) {
    const auditRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      setting,
      old_value: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue ?? ''),
      new_value: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue ?? ''),
      changed_by: changedBy || 'System Administrator',
      created_at: new Date().toISOString(),
      reason: reason || 'Configuration updated via Administration panel'
    };
    this.insert('configuration_audit_trails', auditRecord);
    return auditRecord;
  }

  public resetToSeed(seedData: DatabaseSchema) {
    this.data = JSON.parse(JSON.stringify(seedData));
    this.save();
    this.initialized = true;
  }

  public getRawData(): DatabaseSchema {
    if (!this.initialized) {
      this.load();
    }
    return this.data;
  }
}

export const db = new DatabaseEngine();
