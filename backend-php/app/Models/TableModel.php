<?php

declare(strict_types=1);

namespace App\Models;

use InvalidArgumentException;
use PDO;

abstract class TableModel
{
    public function __construct(protected PDO $db)
    {
    }

    protected const TABLE = '';

    public function all(): array
    {
        return $this->db->query('SELECT * FROM `' . static::TABLE . '`')->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findBy(string $column, mixed $value): ?array
    {
        $column = $this->quoteIdentifier($column);
        $stmt = $this->db->prepare(
            'SELECT * FROM `' . static::TABLE . '` WHERE ' . $column . ' = ? LIMIT 1'
        );
        $stmt->execute([$value]);
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
        $stmt = $this->db->prepare(
            'UPDATE `' . static::TABLE . '` SET ' . implode(', ', $assignments)
            . ' WHERE ' . $this->quoteIdentifier($column) . ' = ?'
        );
        return $stmt->execute([...array_values($data), $value]);
    }

    public function deleteBy(string $column, mixed $value): bool
    {
        $stmt = $this->db->prepare(
            'DELETE FROM `' . static::TABLE . '` WHERE ' . $this->quoteIdentifier($column) . ' = ?'
        );
        return $stmt->execute([$value]);
    }

    private function quoteIdentifier(string $identifier): string
    {
        if (preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $identifier) !== 1) {
            throw new InvalidArgumentException('Invalid database column name.');
        }
        return '`' . $identifier . '`';
    }
}
