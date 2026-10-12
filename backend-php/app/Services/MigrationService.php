<?php

declare(strict_types=1);

namespace App\Services;

use PDO;
use PDOException;
use RuntimeException;
use Throwable;

/**
 * MigrationService
 *
 * Inspects existing database tables, columns, indexes, and foreign key constraints,
 * and automatically applies database migrations safely and idempotently without deleting
 * or overwriting existing data.
 */
class MigrationService
{
    private string $migrationsPath;

    public function __construct(
        private PDO $db,
        ?string $migrationsPath = null
    ) {
        $this->migrationsPath = $migrationsPath ?? dirname(__DIR__, 2) . '/database/migrations';
    }

    /**
     * Run all schema inspections and apply missing tables, columns, indexes, and constraints.
     */
    public function runMigration(): array
    {
        $startTime = microtime(true);

        $results = [
            'tables_checked'      => 0,
            'tables_created'      => [],
            'columns_added'       => [],
            'indexes_created'     => [],
            'constraints_created' => [],
            'skipped_existing'    => [
                'tables'      => [],
                'columns'     => 0,
                'indexes'     => 0,
                'constraints' => 0,
            ],
            'errors'              => [],
            'database_name'       => $this->getCurrentDatabaseName(),
            'duration_ms'         => 0,
        ];

        try {
            // 1. Gather all schema definitions from migration files and canonical models
            $schemas = $this->loadSchemaDefinitions();
            $results['tables_checked'] = count($schemas);

            // 2. Process Table Creations and Column Additions
            foreach ($schemas as $tableName => $tableDef) {
                try {
                    $this->migrateTable($tableName, $tableDef, $results);
                } catch (Throwable $e) {
                    $results['errors'][] = [
                        'phase'   => 'table_columns',
                        'table'   => $tableName,
                        'message' => $e->getMessage(),
                    ];
                }
            }

            // 3. Process Secondary Indexes (after all tables/columns exist)
            foreach ($schemas as $tableName => $tableDef) {
                try {
                    $this->migrateIndexes($tableName, $tableDef, $results);
                } catch (Throwable $e) {
                    $results['errors'][] = [
                        'phase'   => 'indexes',
                        'table'   => $tableName,
                        'message' => $e->getMessage(),
                    ];
                }
            }

            // 4. Process Foreign Key Constraints (after all referenced tables & indexes exist)
            foreach ($schemas as $tableName => $tableDef) {
                try {
                    $this->migrateForeignKeys($tableName, $tableDef, $results);
                } catch (Throwable $e) {
                    $results['errors'][] = [
                        'phase'   => 'foreign_keys',
                        'table'   => $tableName,
                        'message' => $e->getMessage(),
                    ];
                }
            }

            // 5. Apply any incremental SQL migrations (e.g. 2026-10-*.sql) safely
            $this->applyIncrementalMigrations($results);

        } catch (Throwable $e) {
            $results['errors'][] = [
                'phase'   => 'general',
                'table'   => null,
                'message' => $e->getMessage(),
            ];
        }

        $results['duration_ms'] = round((microtime(true) - $startTime) * 1000, 2);
        return $results;
    }

    /**
     * Get the currently connected database name.
     */
    public function getCurrentDatabaseName(): string
    {
        try {
            $stmt = $this->db->query('SELECT DATABASE()');
            return (string)($stmt->fetchColumn() ?: 'cooperative_db');
        } catch (Throwable) {
            return 'cooperative_db';
        }
    }

    /**
     * Inspect all existing tables in the database.
     */
    public function getExistingTables(): array
    {
        $stmt = $this->db->query('SHOW TABLES');
        $tables = [];
        while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
            $tables[] = $row[0];
        }
        return $tables;
    }

    /**
     * Inspect columns for a specific table.
     */
    public function getTableColumns(string $tableName): array
    {
        $stmt = $this->db->prepare('SHOW COLUMNS FROM `' . str_replace('`', '``', $tableName) . '`');
        $stmt->execute();
        $cols = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $cols[strtolower($row['Field'])] = $row;
        }
        return $cols;
    }

    /**
     * Inspect indexes for a specific table.
     */
    public function getTableIndexes(string $tableName): array
    {
        $stmt = $this->db->prepare('SHOW INDEX FROM `' . str_replace('`', '``', $tableName) . '`');
        $stmt->execute();
        $indexes = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $keyName = $row['Key_name'];
            if (!isset($indexes[$keyName])) {
                $indexes[$keyName] = [
                    'name'     => $keyName,
                    'unique'   => (int)$row['Non_unique'] === 0,
                    'columns'  => [],
                ];
            }
            $indexes[$keyName]['columns'][] = strtolower($row['Column_name']);
        }
        return $indexes;
    }

    /**
     * Inspect foreign keys for a specific table from information_schema.
     */
    public function getTableForeignKeys(string $tableName): array
    {
        $sql = "
            SELECT 
                CONSTRAINT_NAME, 
                COLUMN_NAME, 
                REFERENCED_TABLE_NAME, 
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND REFERENCED_TABLE_NAME IS NOT NULL
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$tableName]);
        $fks = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $fks[$row['CONSTRAINT_NAME']] = [
                'constraint_name' => $row['CONSTRAINT_NAME'],
                'column'          => strtolower($row['COLUMN_NAME']),
                'ref_table'       => $row['REFERENCED_TABLE_NAME'],
                'ref_column'      => strtolower($row['REFERENCED_COLUMN_NAME']),
            ];
        }
        return $fks;
    }

    /**
     * Migrate a table: create if missing, or add any missing columns.
     */
    private function migrateTable(string $tableName, array $tableDef, array &$results): void
    {
        $existingTables = $this->getExistingTables();

        if (!in_array($tableName, $existingTables, true)) {
            // Table is missing - create it
            $createSql = $tableDef['createSql'];
            $this->db->exec($createSql);
            $results['tables_created'][] = [
                'table'       => $tableName,
                'columns'     => count($tableDef['columns']),
                'indexes'     => count($tableDef['indexes']),
                'constraints' => count($tableDef['foreign_keys']),
            ];
            return;
        }

        // Table already exists - mark as checked
        $results['skipped_existing']['tables'][] = $tableName;

        // Inspect existing columns
        $existingColumns = $this->getTableColumns($tableName);

        foreach ($tableDef['columns'] as $col) {
            $colNameLower = strtolower($col['name']);
            if (!isset($existingColumns[$colNameLower])) {
                // Column missing! Add it safely.
                $colDef = $col['definition'];
                // Clean trailing commas or whitespace
                $colDef = trim(rtrim($colDef, ','));

                $alterSql = "ALTER TABLE `{$tableName}` ADD COLUMN {$colDef}";
                $this->db->exec($alterSql);

                $results['columns_added'][] = [
                    'table'      => $tableName,
                    'column'     => $col['name'],
                    'definition' => $col['definition'],
                ];
            } else {
                $results['skipped_existing']['columns']++;
            }
        }
    }

    /**
     * Migrate indexes: add any missing unique or secondary indexes safely.
     */
    private function migrateIndexes(string $tableName, array $tableDef, array &$results): void
    {
        $existingTables = $this->getExistingTables();
        if (!in_array($tableName, $existingTables, true)) {
            return;
        }

        $existingIndexes = $this->getTableIndexes($tableName);
        $existingColumns = $this->getTableColumns($tableName);

        // 1. Unique keys
        foreach ($tableDef['unique_keys'] as $uk) {
            $ukName = $uk['name'];
            if (isset($existingIndexes[$ukName])) {
                $results['skipped_existing']['indexes']++;
                continue;
            }

            // Ensure all columns in this UK actually exist
            $allColsExist = true;
            foreach ($uk['columns'] as $c) {
                if (!isset($existingColumns[strtolower($c)])) {
                    $allColsExist = false;
                    break;
                }
            }
            if (!$allColsExist) {
                continue;
            }

            $colList = implode(', ', array_map(fn($c) => "`{$c}`", $uk['columns']));
            $sql = "ALTER TABLE `{$tableName}` ADD UNIQUE KEY `{$ukName}` ({$colList})";
            try {
                $this->db->exec($sql);
                $results['indexes_created'][] = [
                    'table'   => $tableName,
                    'index'   => $ukName,
                    'type'    => 'UNIQUE',
                    'columns' => $uk['columns'],
                ];
            } catch (Throwable $e) {
                // Index might already exist under different alias or duplicate entry
                $results['errors'][] = [
                    'phase'   => 'indexes',
                    'table'   => $tableName,
                    'message' => "Failed to add unique key {$ukName}: " . $e->getMessage(),
                ];
            }
        }

        // 2. Regular secondary indexes
        foreach ($tableDef['indexes'] as $idx) {
            $idxName = $idx['name'];
            if (isset($existingIndexes[$idxName])) {
                $results['skipped_existing']['indexes']++;
                continue;
            }

            // Ensure all columns in this index actually exist
            $allColsExist = true;
            foreach ($idx['columns'] as $c) {
                if (!isset($existingColumns[strtolower($c)])) {
                    $allColsExist = false;
                    break;
                }
            }
            if (!$allColsExist) {
                continue;
            }

            $colList = implode(', ', array_map(fn($c) => "`{$c}`", $idx['columns']));
            $sql = "ALTER TABLE `{$tableName}` ADD INDEX `{$idxName}` ({$colList})";
            try {
                $this->db->exec($sql);
                $results['indexes_created'][] = [
                    'table'   => $tableName,
                    'index'   => $idxName,
                    'type'    => 'INDEX',
                    'columns' => $idx['columns'],
                ];
            } catch (Throwable $e) {
                $results['errors'][] = [
                    'phase'   => 'indexes',
                    'table'   => $tableName,
                    'message' => "Failed to add index {$idxName}: " . $e->getMessage(),
                ];
            }
        }
    }

    /**
     * Migrate foreign key constraints safely.
     */
    private function migrateForeignKeys(string $tableName, array $tableDef, array &$results): void
    {
        $existingTables = $this->getExistingTables();
        if (!in_array($tableName, $existingTables, true)) {
            return;
        }

        $existingFks = $this->getTableForeignKeys($tableName);
        $existingColumns = $this->getTableColumns($tableName);

        foreach ($tableDef['foreign_keys'] as $fk) {
            $constraintName = $fk['constraint'];

            // Check if constraint exists already
            if (isset($existingFks[$constraintName])) {
                $results['skipped_existing']['constraints']++;
                continue;
            }

            // Also check if an FK on this exact column to ref_table already exists with another name
            $alreadyHasFk = false;
            foreach ($existingFks as $curFk) {
                if (
                    $curFk['column'] === strtolower($fk['column']) &&
                    strtolower($curFk['ref_table']) === strtolower($fk['refTable']) &&
                    $curFk['ref_column'] === strtolower($fk['refColumn'])
                ) {
                    $alreadyHasFk = true;
                    break;
                }
            }
            if ($alreadyHasFk) {
                $results['skipped_existing']['constraints']++;
                continue;
            }

            // Check that the referenced table and column exist
            if (!in_array($fk['refTable'], $existingTables, true)) {
                continue;
            }
            if (!isset($existingColumns[strtolower($fk['column'])])) {
                continue;
            }
            $refColumns = $this->getTableColumns($fk['refTable']);
            if (!isset($refColumns[strtolower($fk['refColumn'])])) {
                continue;
            }

            $extra = !empty($fk['extra']) ? ' ' . trim($fk['extra']) : '';
            $sql = "ALTER TABLE `{$tableName}` ADD CONSTRAINT `{$constraintName}` FOREIGN KEY (`{$fk['column']}`) REFERENCES `{$fk['refTable']}` (`{$fk['refColumn']}`){$extra}";
            try {
                $this->db->exec($sql);
                $results['constraints_created'][] = [
                    'table'      => $tableName,
                    'constraint' => $constraintName,
                    'column'     => $fk['column'],
                    'ref_table'  => $fk['refTable'],
                    'ref_column' => $fk['refColumn'],
                ];
            } catch (Throwable $e) {
                $results['errors'][] = [
                    'phase'   => 'foreign_keys',
                    'table'   => $tableName,
                    'message' => "Failed to add foreign key {$constraintName}: " . $e->getMessage(),
                ];
            }
        }
    }

    /**
     * Apply incremental migration scripts (e.g. 2026-10-*.sql) safely.
     */
    private function applyIncrementalMigrations(array &$results): void
    {
        $files = glob($this->migrationsPath . '/*.sql');
        if (!$files) {
            return;
        }

        sort($files);
        foreach ($files as $file) {
            $baseName = basename($file);
            $content = file_get_contents($file);
            if (!$content) {
                continue;
            }

            // Split into individual statements
            $statements = array_filter(
                array_map('trim', explode(';', $content)),
                fn($s) => !empty($s) && !preg_match('/^--/', $s)
            );

            foreach ($statements as $stmtSql) {
                // Check if this is an ALTER TABLE ... ADD COLUMN
                if (preg_match('/ALTER\s+TABLE\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s+ADD\s+COLUMN\s+[`"]?([a-zA-Z0-9_]+)[`"]?/i', $stmtSql, $m)) {
                    $tbl = $m[1];
                    $col = $m[2];
                    $existingTables = $this->getExistingTables();
                    if (in_array($tbl, $existingTables, true)) {
                        $cols = $this->getTableColumns($tbl);
                        if (isset($cols[strtolower($col)])) {
                            // Column already exists
                            $results['skipped_existing']['columns']++;
                            continue;
                        }
                    }
                }

                // Check if this is a CREATE TABLE
                if (preg_match('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[`"]?([a-zA-Z0-9_]+)[`"]?/i', $stmtSql, $m)) {
                    $tbl = $m[1];
                    $existingTables = $this->getExistingTables();
                    if (in_array($tbl, $existingTables, true)) {
                        $results['skipped_existing']['tables'][] = $tbl;
                        continue;
                    }
                }

                try {
                    $this->db->exec($stmtSql);
                } catch (Throwable $e) {
                    // Log if it's not a duplicate column/table/key error
                    if (
                        !str_contains($e->getMessage(), 'already exists') &&
                        !str_contains($e->getMessage(), 'Duplicate column') &&
                        !str_contains($e->getMessage(), 'Duplicate key')
                    ) {
                        $results['errors'][] = [
                            'phase'   => 'incremental_file',
                            'file'    => $baseName,
                            'message' => $e->getMessage(),
                        ];
                    }
                }
            }
        }
    }

    /**
     * Load all schema definitions from tables/*.sql migration directory and canonical models.
     */
    public function loadSchemaDefinitions(): array
    {
        $tablesDir = $this->migrationsPath . '/tables';
        $files = glob($tablesDir . '/*.sql');
        if (!$files) {
            $files = [];
        }
        sort($files);

        $schemas = [];

        foreach ($files as $file) {
            $sql = file_get_contents($file);
            if (!$sql) {
                continue;
            }

            $parsed = $this->parseTableSql($sql, basename($file));
            if ($parsed && !empty($parsed['name'])) {
                $schemas[$parsed['name']] = $parsed;
            }
        }

        // Canonical dynamic column rules:
        // 1. coop_id in branches:
        // ConfigService explicitly writes: INSERT INTO branches (id, coop_id, code, ...)
        if (isset($schemas['branches'])) {
            $hasCoopId = false;
            foreach ($schemas['branches']['columns'] as $col) {
                if (strtolower($col['name']) === 'coop_id') {
                    $hasCoopId = true;
                    break;
                }
            }
            if (!$hasCoopId) {
                $schemas['branches']['columns'][] = [
                    'name'       => 'coop_id',
                    'type'       => 'varchar(50)',
                    'definition' => "`coop_id` varchar(50) DEFAULT 'coop_01' AFTER `id`",
                ];
            }
        }

        // 2. coop_id in member_types:
        // MemberTypeModel explicitly has 'coop_id' in FIELDS
        if (isset($schemas['member_types'])) {
            $hasCoopId = false;
            foreach ($schemas['member_types']['columns'] as $col) {
                if (strtolower($col['name']) === 'coop_id') {
                    $hasCoopId = true;
                    break;
                }
            }
            if (!$hasCoopId) {
                $schemas['member_types']['columns'][] = [
                    'name'       => 'coop_id',
                    'type'       => 'varchar(50)',
                    'definition' => "`coop_id` varchar(50) DEFAULT 'coop_01' AFTER `code`",
                ];
            }
        }

        // 3. cooperative_id in users & members for multi-tenant coop association
        if (isset($schemas['users'])) {
            $hasCoopId = false;
            foreach ($schemas['users']['columns'] as $col) {
                if (strtolower($col['name']) === 'cooperative_id') {
                    $hasCoopId = true;
                    break;
                }
            }
            if (!$hasCoopId) {
                $schemas['users']['columns'][] = [
                    'name'       => 'cooperative_id',
                    'type'       => 'varchar(50)',
                    'definition' => "`cooperative_id` varchar(50) DEFAULT 'coop_01' AFTER `branch_id`",
                ];
            }
        }

        return $schemas;
    }

    /**
     * Parse a CREATE TABLE SQL file into structured columns, keys, indexes, and constraints.
     */
    public function parseTableSql(string $sql, string $filename = ''): ?array
    {
        if (!preg_match('/CREATE\s+TABLE\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([\s\S]+?)\)\s*ENGINE/i', $sql, $match)) {
            return null;
        }

        $tableName = $match[1];
        $body = $match[2];
        $lines = array_filter(array_map('trim', explode("\n", $body)));

        $columns = [];
        $primaryKeys = [];
        $uniqueKeys = [];
        $indexes = [];
        $foreignKeys = [];

        foreach ($lines as $rawLine) {
            $line = rtrim(trim($rawLine), ',');

            // Primary Key
            if (preg_match('/^PRIMARY\s+KEY\s*\(([^)]+)\)/i', $line, $m)) {
                $cols = array_map(fn($c) => trim(str_replace('`', '', $c)), explode(',', $m[1]));
                $primaryKeys = $cols;
                continue;
            }

            // Unique Key
            if (preg_match('/^UNIQUE\s+KEY\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([^)]+)\)/i', $line, $m)) {
                $cols = array_map(fn($c) => trim(str_replace('`', '', $c)), explode(',', $m[2]));
                $uniqueKeys[] = [
                    'name'    => $m[1],
                    'columns' => $cols,
                    'line'    => $line,
                ];
                continue;
            }

            // Regular Index
            if (preg_match('/^(?:KEY|INDEX)\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([^)]+)\)/i', $line, $m)) {
                $cols = array_map(fn($c) => trim(str_replace('`', '', $c)), explode(',', $m[2]));
                $indexes[] = [
                    'name'    => $m[1],
                    'columns' => $cols,
                    'line'    => $line,
                ];
                continue;
            }

            // Foreign Key Constraint
            if (preg_match('/^CONSTRAINT\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+[`"]?([a-zA-Z0-9_]+)[`"]?\s*\(([^)]+)\)([\s\S]*)/i', $line, $m)) {
                $foreignKeys[] = [
                    'constraint' => $m[1],
                    'column'     => trim(str_replace('`', '', $m[2])),
                    'refTable'   => trim(str_replace('`', '', $m[3])),
                    'refColumn'  => trim(str_replace('`', '', $m[4])),
                    'extra'      => trim($m[5]),
                    'line'       => $line,
                ];
                continue;
            }

            // Column Definition
            if (preg_match('/^[`"]?([a-zA-Z0-9_]+)[`"]?\s+([a-zA-Z0-9_()]+)([\s\S]*)/i', $line, $m)) {
                $columns[] = [
                    'name'       => $m[1],
                    'type'       => $m[2],
                    'definition' => $line,
                ];
            }
        }

        return [
            'name'         => $tableName,
            'filename'     => $filename,
            'columns'      => $columns,
            'primary_key'  => $primaryKeys,
            'unique_keys'  => $uniqueKeys,
            'indexes'      => $indexes,
            'foreign_keys' => $foreignKeys,
            'createSql'    => $sql,
        ];
    }
}
