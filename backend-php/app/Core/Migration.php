<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use RuntimeException;

abstract class Migration
{
    protected const COLLATION = 'utf8mb4_general_ci';
    abstract public function up(PDO $db): void;

    protected function createTableSql(PDO $db, string $table, string $definition): void
    {
        if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $table)) {
            throw new RuntimeException("Invalid SQL table name: {$table}");
        }
        $check = $db->prepare('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table');
        $check->execute(['table' => $table]);
        if ((int) $check->fetchColumn() > 0) return;
        $db->exec(sprintf('CREATE TABLE `%s` (%s) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=%s', $table, $definition, self::COLLATION));
    }
     /**
     * Add a column only if it does not already exist.
     */
    protected function addColumn(
        PDO $db,
        string $table,
        string $column,
        string $definition
    ): void {
        $stmt = $db->prepare(
            'SELECT COUNT(*)
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = :table
               AND COLUMN_NAME = :column'
        );

        $stmt->execute([
            'table'  => $table,
            'column' => $column,
        ]);

        if ((int) $stmt->fetchColumn() > 0) {
            return;
        }

        $db->exec(
            'ALTER TABLE ' . $this->quoteIdentifier($table)
            . ' ADD COLUMN ' . $this->quoteIdentifier($column)
            . ' ' . $definition
        );
    }

    /**
     * Safely quote a MySQL identifier.
     */
    private function quoteIdentifier(string $identifier): string
    {
        if (!preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $identifier)) {
            throw new RuntimeException(
                "Invalid SQL identifier: {$identifier}"
            );
        }

        return '' . $identifier . '';
    }
}
