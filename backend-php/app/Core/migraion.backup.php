<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use RuntimeException;

abstract class Migration
{
    protected const COLLATION = 'utf8mb4_general_ci';

    abstract public function up(PDO $db): void;

    /**
     * Create a table if it does not exist.
     *
     * Column definitions are MySQL column definitions.
     */
    protected function createTable(
        PDO $db,
        string $table,
        array $columns,
        array $indexes = []
    ): void {
        $table = $this->quoteIdentifier($table);

        if ($columns === []) {
            throw new RuntimeException(
                'A table must have at least one column.'
            );
        }

        $definitions = [];

        foreach ($columns as $name => $definition) {
            $definitions[] = $this->quoteIdentifier($name)
                . ' ' . $definition;
        }

        foreach ($indexes as $index) {
            // Index definitions are trusted migration code.
            $definitions[] = $index;
        }

        $sql = sprintf(
            'CREATE TABLE IF NOT EXISTS %s (%s)
             ENGINE=InnoDB
             DEFAULT CHARSET=utf8mb4
             COLLATE=%s',
            $table,
            implode(",\n", $definitions),
            self::COLLATION
        );

        $db->exec($sql);
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

        return '`' . $identifier . '`';
    }
}

<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use RuntimeException;
use Throwable;

class MigrationRunner
{
    public function __construct(
        private PDO $db,
        private string $migrationPath
    ) {}

    public function run(): void
    {
        $this->db->exec("
            CREATE TABLE IF NOT EXISTS `migrations` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `migration` VARCHAR(255) NOT NULL,
                `executed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                UNIQUE KEY `uq_migrations_migration` (`migration`)
            ) ENGINE=InnoDB
              DEFAULT CHARSET=utf8mb4
              COLLATE=utf8mb4_general_ci
        ");

        if (!is_dir($this->migrationPath)) {
            throw new RuntimeException(
                "Migration directory not found: {$this->migrationPath}"
            );
        }

        $files = glob(
            rtrim($this->migrationPath, DIRECTORY_SEPARATOR)
            . DIRECTORY_SEPARATOR . '*.php'
        );

        if ($files === false) {
            throw new RuntimeException('Unable to read migration directory.');
        }

        sort($files, SORT_STRING);

        foreach ($files as $file) {
            $migrationName = basename($file);

            if ($this->hasRun($migrationName)) {
                continue;
            }

            $migration = require $file;

            if (!$migration instanceof Migration) {
                throw new RuntimeException(
                    "{$migrationName} must return an instance of "
                    . Migration::class
                );
            }

            try {
                $migration->up($this->db);

                $stmt = $this->db->prepare(
                    'INSERT INTO `migrations` (`migration`)
                     VALUES (:migration)'
                );

                $stmt->execute([
                    'migration' => $migrationName,
                ]);

                echo "Migrated: {$migrationName}" . PHP_EOL;
            } catch (Throwable $e) {
                throw new RuntimeException(
                    "Migration failed: {$migrationName}. "
                    . $e->getMessage(),
                    0,
                    $e
                );
            }
        }
    }

    private function hasRun(string $migrationName): bool
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*)
             FROM `migrations`
             WHERE `migration` = :migration'
        );

        $stmt->execute(['migration' => $migrationName]);

        return (int) $stmt->fetchColumn() > 0;
    }
}
