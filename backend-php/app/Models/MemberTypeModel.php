<?php

declare(strict_types=1);

namespace App\Models;

use PDO;
use InvalidArgumentException;

class MemberTypeModel extends TableModel
{
    protected const TABLE = 'member_types';

    private PDO $connection;

    private const FIELDS = [
        'name',
        'code',
        'coop_id',
        'description',
        'voting_rights',
        'min_share_capital',
        'savings_requirement',
        'loan_eligibility',
        'required_documents',
        'active',
    ];

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->connection = $db;
    }

    public function all(
        ?string $active = null
    ): array {
        $sql = 'SELECT * FROM member_types WHERE 1 = 1';
        $params = [];

        if ($active !== null && $active !== '') {
            $activeValue = filter_var(
                $active,
                FILTER_VALIDATE_INT
            );

            if (
                $activeValue === false ||
                !in_array($activeValue, [0, 1], true)
            ) {
                throw new InvalidArgumentException(
                    'Active must be 0 or 1.'
                );
            }

            $sql .= ' AND active = :active';
            $params['active'] = $activeValue;
        }

        $sql .= ' ORDER BY name ASC';

        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function find(string $id): ?array
    {
        $stmt = $this->connection->prepare(
            'SELECT * FROM member_types WHERE id = :id LIMIT 1'
        );

        $stmt->execute(['id' => $id]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    public function create(array $data): array
    {
        $data = $this->onlyAllowedFields($data);
        $data = $this->normalizeData($data, true);

        $id = 'mt_' . bin2hex(random_bytes(6));

        $columns = array_keys($data);
        $columns[] = 'id';

        $placeholders = array_map(
            static fn(string $column): string => ':' . $column,
            $columns
        );
       
        $sql = sprintf(
            'INSERT INTO member_types (%s) VALUES (%s)',
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $params = $data;
        $params['id'] = $id;

        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);

        return $this->find($id) ?? [];
    }

    public function update(string $id, array $data): ?array
    {
        if (!$this->find($id)) {
            return null;
        }

        $data = $this->onlyAllowedFields($data);

        if ($data === []) {
            return $this->find($id);
        }

        $data = $this->normalizeData($data, false);

        $sets = [];

        foreach (array_keys($data) as $field) {
            $sets[] = "{$field} = :{$field}";
        }

        $sql = sprintf(
            'UPDATE member_types SET %s WHERE id = :id',
            implode(', ', $sets)
        );

        $data['id'] = $id;

        $stmt = $this->connection->prepare($sql);
        $stmt->execute($data);

        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->connection->prepare(
            'DELETE FROM member_types WHERE id = :id'
        );

        $stmt->execute(['id' => $id]);

        return $stmt->rowCount() > 0;
    }

    private function normalizeData( array $data, bool $creating): array 
    {

        if (
            $creating &&
            empty(trim((string) ($data['name'] ?? '')))
        ) {
            throw new InvalidArgumentException(
                'Member type name is required.'
            );
        }

        if (
            $creating &&
            empty(trim((string) ($data['code'] ?? '')))
        ) {
            throw new InvalidArgumentException(
                'Member type code is required.'
            );
        }

        if (isset($data['name'])) {
            $data['name'] = trim((string) $data['name']);

            if ($data['name'] === '') {
                throw new InvalidArgumentException(
                    'Member type name cannot be empty.'
                );
            }
        }

        if (isset($data['code'])) {
            $data['code'] = trim((string) $data['code']);

            if ($data['code'] === '') {
                throw new InvalidArgumentException(
                    'Member type code cannot be empty.'
                );
            }
        }

        foreach (
            [
                'voting_rights',
                'loan_eligibility',
                'active',
            ] as $field
        ) {
            if (!array_key_exists($field, $data)) {
                if ($creating) {
                    $data[$field] = 1;
                }

                continue;
            }

            $value = filter_var(
                $data[$field],
                FILTER_VALIDATE_INT
            );

            if (
                $value === false ||
                !in_array($value, [0, 1], true)
            ) {
                throw new InvalidArgumentException(
                    ucfirst(str_replace('_', ' ', $field)) .
                        ' must be 0 or 1.'
                );
            }

            $data[$field] = $value;
        }

        foreach (
            [
                'min_share_capital',
                'savings_requirement',
            ] as $field
        ) {
            if (!array_key_exists($field, $data)) {
                if ($creating) {
                    $data[$field] = $field === 'min_share_capital'
                        ? 1000.00
                        : 500.00;
                }

                continue;
            }

            if (
                !is_numeric($data[$field]) ||
                (float) $data[$field] < 0
            ) {
                throw new InvalidArgumentException(
                    ucfirst(str_replace('_', ' ', $field)) .
                        ' must be a non-negative number.'
                );
            }

            $data[$field] = number_format(
                (float) $data[$field],
                2,
                '.',
                ''
            );
        }

        if (array_key_exists('description', $data)) {
            $data['description'] = trim(
                (string) ($data['description'] ?? '')
            );

            if ($data['description'] === '') {
                $data['description'] = null;
            }
        }

        if (array_key_exists('required_documents', $data)) {
            $documents = $data['required_documents'];

            if (is_string($documents)) {
                $decoded = json_decode($documents, true);

                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new InvalidArgumentException(
                        'Required documents must contain valid JSON.'
                    );
                }

                $documents = $decoded;
            }

            if ($documents !== null && !is_array($documents)) {
                throw new InvalidArgumentException(
                    'Required documents must be an array or null.'
                );
            }

            $data['required_documents'] = $documents === null
                ? null
                : json_encode(
                    $documents,
                    JSON_THROW_ON_ERROR
                );
        }

        return $data;
    }

    private function onlyAllowedFields(array $data): array
    {
        return array_intersect_key(
            $data,
            array_flip(self::FIELDS)
        );
    }
}
