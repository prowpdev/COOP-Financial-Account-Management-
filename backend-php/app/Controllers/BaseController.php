<?php

declare(strict_types=1);

namespace App\Controllers;

use PDO;

abstract class BaseController
{
    protected ?array $authClaims = null;
    protected ?array $currentUser = null;

    public function __construct(
        protected PDO $db
    ) {
    }

    public function setAuthClaims(array $claims): void
    {
        $this->authClaims = $claims;
    }

    protected function getAuthenticatedUserId(): ?string
    {
        $subject = $this->authClaims['sub'] ?? null;
        return is_string($subject) && $subject !== '' ? $subject : null;
    }

    /**
     * Get the authenticated user record from the database.
     */
    public function getCurrentUser(): ?array
    {
        if ($this->currentUser !== null) {
            return $this->currentUser;
        }

        // 1. Resolve user ID from auth claims
        $userId = $this->authClaims['sub'] ?? null;

        // 2. Fallback: check Authorization bearer header directly if claims not yet loaded
        if (!$userId) {
            $token = $this->getBearerToken();
            if ($token) {
                try {
                    $jwt = \App\Core\JwtAuth::fromEnvironment();
                    $claims = $jwt->verify($token);
                    $this->authClaims = $claims;
                    $userId = $claims['sub'] ?? null;
                } catch (\Throwable) {
                    // Ignore invalid token here
                }
            }
        }

        // 3. Fallback: check custom headers or query/body parameters
        if (!$userId) {
            $userId = $_SERVER['HTTP_X_USER_ID'] 
                ?? $this->getQuery('current_user') 
                ?? $this->getQuery('user_id');
        }

        if ($userId && is_string($userId)) {
            // Check if user is in users table
            $stmt = $this->db->prepare("
                SELECT u.id, u.username, u.full_name, u.email, u.role_id, u.branch_id,
                       u.active, r.name AS role_name, b.name AS branch_name
                FROM users u
                LEFT JOIN user_roles r ON u.role_id = r.id
                LEFT JOIN branches b ON u.branch_id = b.id
                WHERE u.id = ?
                LIMIT 1
            ");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($user) {
                $this->currentUser = $user;
                return $this->currentUser;
            }

            // Check if user is a member
            $stmt = $this->db->prepare("
                SELECT m.id, m.member_no, m.first_name, m.last_name, m.email, m.branch_id,
                       b.name AS branch_name
                FROM members m
                LEFT JOIN branches b ON m.branch_id = b.id
                WHERE m.id = ?
                LIMIT 1
            ");
            $stmt->execute([$userId]);
            $member = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($member) {
                $this->currentUser = $member;
                return $this->currentUser;
            }
        }

        return null;
    }

    /**
     * Get current user ID.
     */
    public function getCurrentUserId(): ?string
    {
        $user = $this->getCurrentUser();
        if ($user && !empty($user['id'])) {
            return (string)$user['id'];
        }
        return $this->authClaims['sub'] ?? null;
    }

    /**
     * Get the current user's branch ID to enforce branch-level data isolation.
     */
    public function getCurrentUserBranchId(): ?string
    {
        // 1. Direct claim in JWT
        if (!empty($this->authClaims['branch_id']) && is_string($this->authClaims['branch_id'])) {
            return $this->authClaims['branch_id'];
        }

        // 2. Loaded current user model
        $user = $this->getCurrentUser();
        if ($user && !empty($user['branch_id'])) {
            return (string)$user['branch_id'];
        }

        // 3. Fallback to header or query parameter if user has no assigned branch
        $branchHeader = $_SERVER['HTTP_X_BRANCH_ID'] ?? null;
        if (!empty($branchHeader) && is_string($branchHeader)) {
            return trim($branchHeader);
        }

        $queryBranch = $this->getQuery('branch_id') ?? $this->getQuery('branchId');
        if (!empty($queryBranch) && is_string($queryBranch) && $queryBranch !== 'all') {
            return trim($queryBranch);
        }

        return null;
    }

    private function getBearerToken(): ?string
    {
        $headers = function_exists('getallheaders') ? getallheaders() : [];
        foreach ($headers as $name => $value) {
            if (is_string($name) && strtolower($name) === 'authorization' && is_string($value)) {
                if (preg_match('/^Bearer\s+(\S+)$/i', trim($value), $matches)) {
                    return $matches[1];
                }
            }
        }

        foreach (['HTTP_AUTHORIZATION', 'REDIRECT_HTTP_AUTHORIZATION'] as $serverKey) {
            if (isset($_SERVER[$serverKey]) && is_string($_SERVER[$serverKey])) {
                if (preg_match('/^Bearer\s+(\S+)$/i', trim($_SERVER[$serverKey]), $matches)) {
                    return $matches[1];
                }
            }
        }

        return null;
    }

    /**
     * Send JSON response and terminate execution
     */
    public function json(mixed $data, int $status = 200): never
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /**
     * Send formatted success response
     */
    protected function success(mixed $data = null, string $message = 'Success', int $status = 200): never
    {
        $this->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], $status);
    }

    /**
     * Send formatted error response
     */
    protected function error(string $message = 'Error', int $status = 400, mixed $details = null): never
    {
        $this->json([
            'success' => false,
            'error'   => $message,
            'details' => $details,
        ], $status);
    }

    /**
     * Read and decode JSON request payload
     */
    protected function getRequestBody(): array
    {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return [];
        }

        $decoded = json_decode($raw, true);
        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Get GET query parameter safely
     */
    protected function getQuery(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }
}
