import { DatabaseEngine } from '../db/database';
import fs from 'fs';
import path from 'path';

export interface MigrationReport {
  database: string;
  duration_ms: number;
  tables_checked: number;
  tables_created: Array<{ table: string; columns: number; indexes: number; constraints: number }>;
  columns_added: Array<{ table: string; column: string; definition: string; default_value?: any }>;
  indexes_created: Array<{ table: string; index: string; type: string; columns: string[] }>;
  constraints_created: Array<{ table: string; constraint: string; column: string; ref_table: string; ref_column: string }>;
  skipped_existing: {
    tables: string[];
    columns: number;
    indexes: number;
    constraints: number;
  };
  errors: Array<{ phase: string; table?: string; message: string }>;
  summary: {
    tables_created_count: number;
    columns_added_count: number;
    indexes_created_count: number;
    constraints_created_count: number;
    warnings_count: number;
  };
}

export class NodeMigrationService {
  private migrationsPath: string;

  constructor(private db: DatabaseEngine, migrationsPath?: string) {
    this.migrationsPath = migrationsPath || path.join(process.cwd(), 'backend-php/database/migrations');
  }

  public runMigration(): MigrationReport {
    const startTime = Date.now();

    const report: MigrationReport = {
      database: 'cooperative_db',
      duration_ms: 0,
      tables_checked: 0,
      tables_created: [],
      columns_added: [],
      indexes_created: [],
      constraints_created: [],
      skipped_existing: {
        tables: [],
        columns: 0,
        indexes: 0,
        constraints: 0,
      },
      errors: [],
      summary: {
        tables_created_count: 0,
        columns_added_count: 0,
        indexes_created_count: 0,
        constraints_created_count: 0,
        warnings_count: 0,
      },
    };

    try {
      const schemas = this.loadSchemaDefinitions();
      report.tables_checked = Object.keys(schemas).length;

      const data = this.db.load() as unknown as Record<string, any[]>;
      let dataModified = false;

      // 1. Table Creations and Column Additions
      for (const [tableName, schema] of Object.entries(schemas)) {
        try {
          if (!data[tableName]) {
            data[tableName] = [];
            report.tables_created.push({
              table: tableName,
              columns: schema.columns.length,
              indexes: schema.idxs.length + schema.uks.length,
              constraints: schema.fks.length,
            });
            dataModified = true;
          } else {
            report.skipped_existing.tables.push(tableName);
          }

          // Inspect existing records in this table for missing columns
          const rows = data[tableName] || [];
          for (const col of schema.columns) {
            const colName = col.name;
            let missingInRows = 0;

            for (const row of rows) {
              if (row && typeof row === 'object' && !(colName in row)) {
                row[colName] = this.getDefaultValueForColumn(col);
                missingInRows++;
                dataModified = true;
              }
            }

            if (missingInRows > 0) {
              report.columns_added.push({
                table: tableName,
                column: colName,
                definition: col.definition,
                default_value: this.getDefaultValueForColumn(col),
              });
            } else {
              report.skipped_existing.columns++;
            }
          }

          // 2. Indexes inspection
          for (const uk of schema.uks) {
            report.indexes_created.push({
              table: tableName,
              index: uk.name,
              type: 'UNIQUE',
              columns: uk.columns,
            });
          }
          for (const idx of schema.idxs) {
            report.indexes_created.push({
              table: tableName,
              index: idx.name,
              type: 'INDEX',
              columns: idx.columns,
            });
          }

          // 3. Constraints inspection
          for (const fk of schema.fks) {
            report.constraints_created.push({
              table: tableName,
              constraint: fk.constraint,
              column: fk.column,
              ref_table: fk.refTable,
              ref_column: fk.refColumn,
            });
          }

        } catch (tableErr: any) {
          report.errors.push({
            phase: 'table_migration',
            table: tableName,
            message: tableErr.message,
          });
        }
      }

      // Check user_documents incremental schema
      if (data.user_documents) {
        for (const doc of data.user_documents) {
          if (doc && !('notes' in doc)) {
            doc.notes = null;
            dataModified = true;
          }
        }
      }

      if (dataModified) {
        this.db.save();
      }

    } catch (e: any) {
      report.errors.push({
        phase: 'general',
        message: e.message,
      });
    }

    report.duration_ms = Date.now() - startTime;
    report.summary.tables_created_count = report.tables_created.length;
    report.summary.columns_added_count = report.columns_added.length;
    report.summary.indexes_created_count = report.indexes_created.length;
    report.summary.constraints_created_count = report.constraints_created.length;
    report.summary.warnings_count = report.errors.length;

    return report;
  }

  private getDefaultValueForColumn(col: { name: string; type: string; definition: string }): any {
    const def = col.definition;

    // Check DEFAULT '...' or DEFAULT 0
    const defMatch = def.match(/DEFAULT\s+('([^']*)'|([0-9.-]+)|NULL)/i);
    if (defMatch) {
      if (defMatch[2] !== undefined) return defMatch[2];
      if (defMatch[3] !== undefined) {
        const num = Number(defMatch[3]);
        return isNaN(num) ? defMatch[3] : num;
      }
      if (/NULL/i.test(defMatch[1])) return null;
    }

    const typeLower = col.type.toLowerCase();
    if (typeLower.includes('int') || typeLower.includes('decimal') || typeLower.includes('float') || typeLower.includes('double')) {
      return 0;
    }
    if (typeLower.includes('json')) {
      return null;
    }
    if (typeLower.includes('tinyint(1)')) {
      return 1;
    }
    if (typeLower.includes('timestamp') || typeLower.includes('datetime') || typeLower.includes('date')) {
      return null;
    }
    return '';
  }

  private loadSchemaDefinitions(): Record<string, {
    file: string;
    columns: Array<{ name: string; type: string; definition: string }>;
    pks: string[][];
    uks: Array<{ name: string; columns: string[] }>;
    idxs: Array<{ name: string; columns: string[] }>;
    fks: Array<{ constraint: string; column: string; refTable: string; refColumn: string; extra: string }>;
  }> {
    const tablesDir = path.join(this.migrationsPath, 'tables');
    const schemas: Record<string, any> = {};

    if (!fs.existsSync(tablesDir)) {
      return schemas;
    }

    const files = fs.readdirSync(tablesDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;
      const sql = fs.readFileSync(path.join(tablesDir, file), 'utf8');
      const tableMatch = sql.match(/CREATE\s+TABLE\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([\s\S]+?)\)\s*ENGINE/i);
      if (!tableMatch) continue;

      const tableName = tableMatch[1];
      const body = tableMatch[2];
      const lines = body.split('\n').map(l => l.trim()).filter(Boolean);

      const cols: Array<{ name: string; type: string; definition: string }> = [];
      const pks: string[][] = [];
      const uks: Array<{ name: string; columns: string[] }> = [];
      const idxs: Array<{ name: string; columns: string[] }> = [];
      const fks: Array<{ constraint: string; column: string; refTable: string; refColumn: string; extra: string }> = [];

      for (const rawLine of lines) {
        const line = rawLine.replace(/,\s*$/, '');
        if (/^PRIMARY\s+KEY\s*\(([^)]+)\)/i.test(line)) {
          const m = line.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
          if (m) pks.push(m[1].replace(/[`\s]/g, '').split(','));
        } else if (/^UNIQUE\s+KEY\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([^)]+)\)/i.test(line)) {
          const m = line.match(/^UNIQUE\s+KEY\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([^)]+)\)/i);
          if (m) uks.push({ name: m[1], columns: m[2].replace(/[`\s]/g, '').split(',') });
        } else if (/^(KEY|INDEX)\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([^)]+)\)/i.test(line)) {
          const m = line.match(/^(KEY|INDEX)\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([^)]+)\)/i);
          if (m) idxs.push({ name: m[2], columns: m[3].replace(/[`\s]/g, '').split(',') });
        } else if (/^CONSTRAINT\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([^)]+)\)([\s\S]*)/i.test(line)) {
          const m = line.match(/^CONSTRAINT\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([^)]+)\)([\s\S]*)/i);
          if (m) {
            fks.push({
              constraint: m[1],
              column: m[2].replace(/[`\s]/g, ''),
              refTable: m[3].replace(/[`\s]/g, ''),
              refColumn: m[4].replace(/[`\s]/g, ''),
              extra: m[5].trim(),
            });
          }
        } else {
          const colMatch = line.match(/^[`"]?([a-zA-Z0-9_]+)[`"]?\s+([a-zA-Z0-9_()]+)([\s\S]*)/i);
          if (colMatch) {
            cols.push({
              name: colMatch[1],
              type: colMatch[2],
              definition: line,
            });
          }
        }
      }

      schemas[tableName] = { file, columns: cols, pks, uks, idxs, fks };
    }

    // Dynamic canonical columns:
    // 1. coop_id in branches
    if (schemas['branches']) {
      if (!schemas['branches'].columns.some((c: any) => c.name === 'coop_id')) {
        schemas['branches'].columns.push({
          name: 'coop_id',
          type: 'varchar(50)',
          definition: "`coop_id` varchar(50) DEFAULT 'coop_01' AFTER `id`",
        });
      }
    }

    // 2. coop_id in member_types
    if (schemas['member_types']) {
      if (!schemas['member_types'].columns.some((c: any) => c.name === 'coop_id')) {
        schemas['member_types'].columns.push({
          name: 'coop_id',
          type: 'varchar(50)',
          definition: "`coop_id` varchar(50) DEFAULT 'coop_01' AFTER `code`",
        });
      }
    }

    // 3. cooperative_id in users
    if (schemas['users']) {
      if (!schemas['users'].columns.some((c: any) => c.name === 'cooperative_id')) {
        schemas['users'].columns.push({
          name: 'cooperative_id',
          type: 'varchar(50)',
          definition: "`cooperative_id` varchar(50) DEFAULT 'coop_01' AFTER `branch_id`",
        });
      }
    }

    return schemas;
  }
}
