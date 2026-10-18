<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use RuntimeException;
use Throwable;

class MigrationRunner
{
    public function __construct(private PDO $db, private string $migrationPath) {}

    public function run(): array
    {
        $this->db->exec("CREATE TABLE IF NOT EXISTS `migrations` (`id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `migration` VARCHAR(255) NOT NULL, `executed_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), UNIQUE KEY `uq_migrations_migration` (`migration`)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci");
        if (!is_dir($this->migrationPath)) throw new RuntimeException('Migration directory not found: '.$this->migrationPath);
        $files = glob(rtrim($this->migrationPath, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.'*.php') ?: [];
        sort($files, SORT_STRING); $applied = [];
        foreach ($files as $file) {
            $name = basename($file); $check = $this->db->prepare('SELECT COUNT(*) FROM migrations WHERE migration = :name'); $check->execute(['name'=>$name]);
            if ((int)$check->fetchColumn() > 0) continue;
            try { $migration = require $file; if (!$migration instanceof Migration) throw new RuntimeException($name.' must return a Migration instance'); $migration->up($this->db); $stmt=$this->db->prepare('INSERT INTO migrations (migration) VALUES (:name)'); $stmt->execute(['name'=>$name]); $applied[]=$name; }
            catch (Throwable $e) { throw new RuntimeException('Migration failed: '.$name.'. '.$e->getMessage(),0,$e); }
        }
        return $applied;
    }
}
