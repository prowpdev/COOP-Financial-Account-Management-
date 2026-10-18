<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\BranchScope;
use PDO;
use InvalidArgumentException;

class NotificationModel extends TableModel
{
    protected const TABLE = 'notifications';

    private PDO $connection;

    private const FIELDS = [
        'cooperative_id',
        'branch_id',
        'user_id',
        'reference_id',
        'type',
        'title',
        'message',
        'status',
        'read_at',
    ];

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->connection = $db;
    }

    public function all(): array
    {
        $table = self::TABLE;
        $stmt = $this->connection->query(
            "SELECT * FROM $table ORDER BY name ASC"
        );

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

public function forBranch(?string $userId, ?string $branchId): array
{
    $table = self::TABLE;

    $sql = '
        SELECT d.*
        FROM ' . $table . ' d
        INNER JOIN users u ON u.id = d.user_id
        WHERE d.user_id = :user_id
    ';

    $params = ['user_id' => $userId];

    BranchScope::appendCondition($sql, $params, 'u.branch_id');

    $stmt = $this->db->prepare($sql . ' ORDER BY d.id DESC');
    $stmt->execute($params);

    $notifications = [];

    $allowedTables = [
        'loan_payments',
        'loan_applications',
        'share_capital_transactions',
        'savings_transactions',
        'cash_transactions',
    ];

    foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $referenceTable = $row['type'] ?? null;

        $data = [];

        if (
            !empty($row['reference_id']) &&
            in_array($referenceTable, $allowedTables, true)
        ) {
            $data = $this->getReferenceData(
                $row['reference_id'],
                $referenceTable
            );
        }

        $row['data'] = $data;
        $row['read'] = ($row['status'] ?? '') === 'read';

        $notifications[] = $row;
    }

    return $notifications;
}

    public function getReferenceData(
        ?string $referenceId,
        ?string $table
    ): array {
        $allowedTables = [
            'loan_payments',
            'loan_applications',
            'share_capital_transactions',
            'savings_transactions',
            'cash_transactions',
        ];

        if (
            $referenceId === null ||
            $table === null ||
            !in_array($table, $allowedTables, true)
        ) {
            return [];
        }

        $sql = "
            SELECT *
            FROM `{$table}`
            WHERE id = :reference_id
            LIMIT 1
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'reference_id' => $referenceId,
        ]);

        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
    public function find(string $id): ?array
    {
        $stmt = $this->connection->prepare(
            'SELECT n.*, a.*
             FROM notifications n
             LEFT JOIN configuration_audit_trails a
                ON a.id = n.reference_id
             WHERE n.id = :id
             LIMIT 1'
        );

        $stmt->execute(['id' => $id]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    public function create(array $data): array
    {
        $data = $this->onlyAllowedFields($data);

        foreach (['cooperative_id', 'type', 'title', 'message'] as $field) {
            if (empty(trim((string) ($data[$field] ?? '')))) {
                throw new InvalidArgumentException(
                    ucfirst(str_replace('_', ' ', $field)) . ' is required.'
                );
            }
        }

        if (!in_array(
            $data['status'] ?? 'unread',
            ['unread', 'read', 'archived'],
            true
        )) {
            throw new InvalidArgumentException('Invalid notification status.');
        }

        $id = 'notif_' . bin2hex(random_bytes(6));

        $columns = array_keys($data);
        $columns[] = 'id';

        $placeholders = array_map(
            static fn (string $column): string => ':' . $column,
            $columns
        );

        $sql = sprintf(
            'INSERT INTO notifications (%s) VALUES (%s)',
            implode(', ', $columns),
            implode(', ', $placeholders)
        );

        $data['id'] = $id;

        $stmt = $this->connection->prepare($sql);
        $stmt->execute($data);

        return $this->find($id) ?? [];
    }

    public function markAsRead(string $id): bool
    {
        $stmt = $this->connection->prepare(
            "UPDATE notifications
             SET status = 'read',
                 read_at = CURRENT_TIMESTAMP
             WHERE id = :id
               AND status = 'unread'"
        );

        $stmt->execute(['id' => $id]);

        return $stmt->rowCount() > 0;
    }

    public function updateStatus(string $id, string $status): bool
    {
        if (!in_array($status, ['unread', 'read', 'archived'], true)) {
            throw new InvalidArgumentException('Invalid notification status.');
        }

        $stmt = $this->connection->prepare(
            'UPDATE notifications
             SET status = :status,
                 read_at = CASE
                     WHEN :read_status = \'read\'
                         THEN COALESCE(read_at, CURRENT_TIMESTAMP)
                     WHEN :unread_status = \'unread\'
                         THEN NULL
                     ELSE read_at
                 END
             WHERE id = :id'
        );

        $stmt->execute([
            'status' => $status,
            'read_status' => $status,
            'unread_status' => $status,
            'id' => $id,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function delete(string $id): bool
    {
        $stmt = $this->connection->prepare(
            'DELETE FROM notifications WHERE id = :id'
        );

        $stmt->execute(['id' => $id]);

        return $stmt->rowCount() > 0;
    }

    public function unreadCount(
        string $cooperativeId,
        ?string $branchId = null,
        ?string $userId = null
    ): int {
        $sql = "
            SELECT COUNT(*)
            FROM notifications
            WHERE cooperative_id = :cooperative_id
              AND status = 'unread'
        ";

        $params = [
            'cooperative_id' => $cooperativeId,
        ];

        if ($branchId !== null) {
            $sql .= ' AND (branch_id = :branch_id OR branch_id IS NULL)';
            $params['branch_id'] = $branchId;
        }

        if ($userId !== null) {
            $sql .= ' AND (user_id = :user_id OR user_id IS NULL)';
            $params['user_id'] = $userId;
        }

        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    private function onlyAllowedFields(array $data): array
    {
        return array_intersect_key(
            $data,
            array_flip(self::FIELDS)
        );
    }
}