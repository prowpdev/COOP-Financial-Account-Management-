<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\BranchScope;
use InvalidArgumentException;
use PDO;

abstract class TableModel
{
    private ?bool $branchIdColumnExists = null;

    public function __construct(protected PDO $db)
    {
    }

    protected const TABLE = '';

    public function all(): array
    {
        [$query, $params] = $this->applyBranchScope('SELECT * FROM `' . static::TABLE . '`');

        $stmt = $this->db->prepare($query);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findBy(string $column, mixed $value): ?array
    {
        $column = $this->quoteIdentifier($column);
        [$query, $params] = $this->applyBranchScope(
            'SELECT * FROM `' . static::TABLE . '` WHERE ' . $column . ' = ?',
            [$value]
        );

        $stmt = $this->db->prepare($query . ' LIMIT 1');
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function insert(array $data): bool
    {
        if ($data === []) {
            throw new InvalidArgumentException('At least one column is required to insert a row.');
        }

        $columns = array_map($this->quoteIdentifier(...), array_keys($data));
        $placeholders = array_fill(0, count($columns), '?');
        $stmt = $this->db->prepare(
            'INSERT INTO `' . static::TABLE . '` (' . implode(', ', $columns) . ')'
            . ' VALUES (' . implode(', ', $placeholders) . ')'
        );
        return $stmt->execute(array_values($data));
    }

    public function updateBy(string $column, mixed $value, array $data): bool
    {
        if ($data === []) {
            throw new InvalidArgumentException('At least one column is required to update a row.');
        }

        $assignments = [];
        foreach ($data as $field => $_) {
            $assignments[] = $this->quoteIdentifier((string)$field) . ' = ?';
        }

        $query = 'UPDATE `' . static::TABLE . '` SET ' . implode(', ', $assignments)
            . ' WHERE ' . $this->quoteIdentifier($column) . ' = ?';
        $params = [...array_values($data), $value];

        [$query, $params] = $this->applyBranchScope($query, $params);

        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

    public function deleteBy(string $column, mixed $value): bool
    {
        $query = 'DELETE FROM `' . static::TABLE . '` WHERE ' . $this->quoteIdentifier($column) . ' = ?';
        $params = [$value];

        [$query, $params] = $this->applyBranchScope($query, $params);

        $stmt = $this->db->prepare($query);
        return $stmt->execute($params);
    }

    private function applyBranchScope(string $query, array $params = []): array
    {
        $branchId = BranchScope::currentBranchId();
        if ($branchId === null || !$this->hasBranchIdColumn()) {
            return [$query, $params];
        }

        $query .= str_contains(strtolower($query), ' where ')
            ? ' AND `branch_id` = ?'
            : ' WHERE `branch_id` = ?';
        $params[] = $branchId;

        return [$query, $params];
    }

    private function hasBranchIdColumn(): bool
    {
        if ($this->branchIdColumnExists !== null) {
            return $this->branchIdColumnExists;
        }

        $stmt = $this->db->prepare('DESCRIBE `' . static::TABLE . '`');
        $stmt->execute();
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $this->branchIdColumnExists = in_array('branch_id', $columns, true);
        return $this->branchIdColumnExists;
    }

    private function quoteIdentifier(string $identifier): string
    {
        if (preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $identifier) !== 1) {
            throw new InvalidArgumentException('Invalid database column name.');
        }
        return '`' . $identifier . '`';
    }
}
