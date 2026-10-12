<?php

declare(strict_types=1);

namespace App\Models;

use PDO;
use InvalidArgumentException;

class CooperativeModel extends TableModel
{
    protected const TABLE = 'cooperatives';

    private PDO $connection;

    private const FIELDS = [
        'name',
        'cda_registration_no',
        'tax_identification_no',
        'coop_type',
        'address',
        'contact_phone',
        'contact_email',
        'fiscal_year_start',
        'base_currency',
    ];

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->connection = $db;
    }

    public function all(): array
    {
        $stmt = $this->connection->query(
            'SELECT * FROM cooperatives ORDER BY name ASC'
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function find(string $id): ?array
    {
        $stmt = $this->connection->prepare(
            'SELECT * FROM cooperatives WHERE id = :id LIMIT 1'
        );
        $stmt->execute(['id' => $id]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    public function create(array $data): array
    {
        $data = $this->onlyAllowedFields($data);

        if (empty(trim((string) ($data['name'] ?? '')))) {
            throw new InvalidArgumentException('Cooperative name is required.');
        }

        $id = 'coop_' . bin2hex(random_bytes(6));
        $now = date('Y-m-d H:i:s');

        $columns = array_keys($data);
        $columns[] = 'id';
        $columns[] = 'created_at';
        $columns[] = 'updated_at';

        $placeholders = array_map(
            static fn (string $column): string => ':' . $column,
            $columns
        );

        $sql = sprintf(
            'INSERT INTO cooperatives (%s) VALUES (%s)',
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $params = $data;
        $params['id'] = $id;
        $params['created_at'] = $now;
        $params['updated_at'] = $now;
        // $params['status'] = 0;

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

        if (array_key_exists('name', $data) &&
            trim((string) $data['name']) === '') {
            throw new InvalidArgumentException('Cooperative name is required.');
        }

        if ($data === []) {
            return $this->find($id);
        }

        $sets = [];

        foreach (array_keys($data) as $field) {
            $sets[] = "{$field} = :{$field}";
        }

        $sets[] = 'updated_at = :updated_at';

        $sql = sprintf(
            'UPDATE cooperatives SET %s WHERE id = :id',
            implode(', ', $sets)
        );

        $data['updated_at'] = date('Y-m-d H:i:s');
        $data['id'] = $id;

        $stmt = $this->connection->prepare($sql);
        $stmt->execute($data);

        return $this->find($id);
    }

    public function delete(string $id): bool
    {
        $stmt = $this->connection->prepare(
            'DELETE FROM cooperatives WHERE id = :id'
        );
        $stmt->execute(['id' => $id]);

        return $stmt->rowCount() > 0;
    }

    private function onlyAllowedFields(array $data): array
    {
        return array_intersect_key(
            $data,
            array_flip(self::FIELDS)
        );
    }
}
