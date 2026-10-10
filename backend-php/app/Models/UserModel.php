<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\AuditLogger;
use PDO;

class UserModel
{
    protected const TABLE = 'users';

    private AuditLogger $audit;

    public function __construct(private PDO $db)
    {
        $this->audit = new AuditLogger($db);
    }

    /**
     * Get all users with their roles and branch names
     */
    public function all(): array
    {
        $sql = "
            SELECT u.id, u.username, u.full_name, u.email, u.role_id, u.branch_id,
                   u.active, u.last_login, u.created_at,
                   r.name AS role_name,
                   b.name AS branch_name
            FROM users u
            LEFT JOIN user_roles r ON u.role_id = r.id
            LEFT JOIN branches b ON u.branch_id = b.id
        ";
        $params = [];

        if ($this->hasCurrentBranchScope()) {
            $sql .= ' WHERE u.branch_id = :current_user_branch_id';
            $params[':current_user_branch_id'] = $this->currentBranchId();
        }

        $sql .= ' ORDER BY u.created_at DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find single user by ID
     */
    public function findById(string $id): ?array
    {
        $sql = "
            SELECT u.id, u.username, u.full_name, u.email, u.role_id, u.branch_id,
                   u.active, u.last_login, u.created_at,
                   r.name AS role_name, r.permissions AS role_permissions,
                   b.name AS branch_name
            FROM users u
            LEFT JOIN user_roles r ON u.role_id = r.id
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE u.id = :id
        ";
        $params = ['id' => $id];

        if ($this->hasCurrentBranchScope()) {
            $sql .= ' AND u.branch_id = :current_user_branch_id';
            $params[':current_user_branch_id'] = $this->currentBranchId();
        }

        $sql .= ' LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Find user by username or email (includes password_hash for authentication)
     */
    public function findByUsernameOrEmail(string $identifier): ?array
    {
        $sql = "
            SELECT 
                u.*,
                r.name AS role_name,
                r.permissions AS role_permissions,
                b.name AS branch_name
            FROM users u
            LEFT JOIN user_roles r ON u.role_id = r.id
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE (u.username = :username OR u.email = :email)
        ";
        $params = [
            'username' => $identifier,
            'email'    => $identifier,
        ];

        if ($this->hasCurrentBranchScope()) {
            $sql .= ' AND u.branch_id = :current_user_branch_id';
            $params[':current_user_branch_id'] = $this->currentBranchId();
        }

        $sql .= ' LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Create a new user account
     */
    public function create(array $data): array
    {
        $id = $data['id'] ?? 'usr_' . bin2hex(random_bytes(8));

        $passwordHash = $data['password_hash']
            ?? password_hash($data['password'] ?? '', PASSWORD_DEFAULT);

        $active = isset($data['active'])
            ? (int) $data['active']
            : 1;

        $lastLogin = $data['last_login'] ?? null;

        $createdAt = $data['created_at']
            ?? date('Y-m-d H:i:s');

        $sql = "
            INSERT INTO users (
                id,
                username,
                password_hash,
                full_name,
                email,
                role_id,
                branch_id,
                active,
                last_login,
                created_at
            )
            VALUES (
                :id,
                :username,
                :password_hash,
                :full_name,
                :email,
                :role_id,
                :branch_id,
                :active,
                :last_login,
                :created_at
            )
        ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            'id'            => $id,
            'username'      => $data['username'],
            'password_hash' => $passwordHash,
            'full_name'     => $data['full_name'],
            'email'         => $data['email'],
            'role_id'       => $data['role_id'],
            'branch_id'     => $data['branch_id'],
            'active'        => $active,
            'last_login'    => $lastLogin,
            'created_at'    => $createdAt,
        ]);

        $this->audit->recordAuditTrail(
            'users',
            'None',
            ['id' => $id, 'username' => $data['username'], 'branch_id' => $data['branch_id'] ?? null],
            (string)($data['created_by'] ?? 'System'),
            'User account created',
            'CREATE'
        );

        $user = $this->findById($id);
        if ($user === null) {
            throw new \RuntimeException('User was created but could not be loaded.');
        }

        return $user;
    }

    /**
     * Update last login timestamp
     */
    public function updateLastLogin(string $id): bool
    {
        $sql = 'UPDATE users SET last_login = NOW() WHERE id = :id';
        $params = ['id' => $id];

        if ($this->hasCurrentBranchScope()) {
            $sql .= ' AND branch_id = :current_user_branch_id';
            $params[':current_user_branch_id'] = $this->currentBranchId();
        }

        $stmt = $this->db->prepare($sql);
        return $stmt->execute($params);
    }

    /**
     * Delete user
     */
    public function delete(string $id): bool
    {
        $sql = 'DELETE FROM users WHERE id = :id';
        $params = ['id' => $id];

        if ($this->hasCurrentBranchScope()) {
            $sql .= ' AND branch_id = :current_user_branch_id';
            $params[':current_user_branch_id'] = $this->currentBranchId();
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $deleted = $stmt->rowCount() > 0;
        if ($deleted) {
            $this->audit->recordAuditTrail('users', ['id' => $id], 'None', 'System', 'User account deleted', 'DELETE');
        }
        return $deleted;
    }

    /**
     * Find a user by ID, including the fields needed to update user metadata.
     */
    public function find(string $id): ?array
    {
        $sql = '
            SELECT id, username, full_name, email, role_id, branch_id,
                   active, last_login, created_at
            FROM users
            WHERE id = :id
        ';
        $params = ['id' => $id];

        if ($this->hasCurrentBranchScope()) {
            $sql .= ' AND branch_id = :current_user_branch_id';
            $params[':current_user_branch_id'] = $this->currentBranchId();
        }

        $sql .= ' LIMIT 1';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            return null;
        }
        return $user;
    }

    /**
     * Update supported user columns and return the updated user.
     */
    public function update(string $id, array $data): ?array
    {
        $fields = [];
        $changedFields = [];
        $params = ['id' => $id];
        $allowed = [
            'username',
            'full_name',
            'email',
            'role_id',
            'branch_id',
            'active',
            'last_login',
        ];

        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "{$field} = :{$field}";
                $changedFields[] = $field;
                $params[$field] = $data[$field];
            }
        }

        if (array_key_exists('password', $data)) {
            $fields[] = 'password_hash = :password_hash';
            $changedFields[] = 'password';
            $params['password_hash'] = password_hash(
                (string)$data['password'],
                PASSWORD_DEFAULT
            );
        } elseif (array_key_exists('password_hash', $data)) {
            $fields[] = 'password_hash = :password_hash';
            $changedFields[] = 'password';
            $params['password_hash'] = $data['password_hash'];
        }

        if ($fields !== []) {
            $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
            if ($this->hasCurrentBranchScope()) {
                $sql .= ' AND branch_id = :current_user_branch_id';
                $params[':current_user_branch_id'] = $this->currentBranchId();
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            if ($stmt->rowCount() > 0) {
                $this->audit->recordAuditTrail(
                    'users',
                    ['id' => $id],
                    [
                        'id' => $id,
                        'updated_fields' => $changedFields,
                        'password_changed' => in_array('password', $changedFields, true),
                    ],
                    (string)($data['updated_by'] ?? 'System'),
                    'User account updated',
                    'UPDATE'
                );
            }
        }

        return $this->findById($id);
    }

    private function hasCurrentBranchScope(): bool
    {
        $branchId = $this->currentBranchId();
        return $branchId !== null;
    }

    private function currentBranchId(): ?string
    {
        $branchId = $_GET['current_user_branch_id'] ?? $_GET['branch_id'] ?? null;
        if (!is_scalar($branchId)) {
            return null;
        }

        $value = trim((string) $branchId);
        return $value === '' || strtolower($value) === 'all' ? null : $value;
    }
}
