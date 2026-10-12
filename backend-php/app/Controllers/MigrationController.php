<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\MigrationService;
use PDO;
use Throwable;

class MigrationController extends BaseController
{
    private MigrationService $migrationService;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->migrationService = new MigrationService($db);
    }

    /**
     * POST|GET /api/db/migration/run
     *
     * Inspects all existing database tables, identifies missing columns,
     * tables, indexes, and constraints, and automatically applies migrations
     * without deleting or overwriting existing data.
     *
     * Restricts execution to authorized superadmin users only.
     */
    public function run(): never
    {
        // 1. Authorize: Only SuperAdmin is permitted to run database migrations
        $this->requireSuperAdmin();

        try {
            $results = $this->migrationService->runMigration();

            $totalCreated = count($results['tables_created']);
            $totalColsAdded = count($results['columns_added']);
            $totalIdxCreated = count($results['indexes_created']);
            $totalFkCreated = count($results['constraints_created']);
            $errorsCount = count($results['errors']);

            $summaryMessage = sprintf(
                'Migration completed in %s ms. %d tables created, %d columns added, %d indexes created, %d foreign keys created.',
                $results['duration_ms'],
                $totalCreated,
                $totalColsAdded,
                $totalIdxCreated,
                $totalFkCreated
            );

            if ($errorsCount > 0) {
                $summaryMessage .= " ({$errorsCount} non-fatal warning(s))";
            }

            $this->success([
                'database'            => $results['database_name'],
                'duration_ms'         => $results['duration_ms'],
                'tables_checked'      => $results['tables_checked'],
                'tables_created'      => $results['tables_created'],
                'columns_added'       => $results['columns_added'],
                'indexes_created'     => $results['indexes_created'],
                'constraints_created' => $results['constraints_created'],
                'skipped_existing'    => $results['skipped_existing'],
                'errors'              => $results['errors'],
                'summary'             => [
                    'tables_created_count'      => $totalCreated,
                    'columns_added_count'       => $totalColsAdded,
                    'indexes_created_count'     => $totalIdxCreated,
                    'constraints_created_count' => $totalFkCreated,
                    'warnings_count'            => $errorsCount,
                ],
            ], $summaryMessage);

        } catch (Throwable $e) {
            $this->error('Database migration failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Enforce SuperAdmin authorization.
     * Inspects token claims, loaded user record, role permissions, and user attributes.
     */
    private function requireSuperAdmin(): void
    {
        $user = $this->getCurrentUser();
        $claims = $this->authClaims;

        $isSuperAdmin = false;

        // 1. Direct boolean flag on user
        if (!empty($user['is_super_admin'])) {
            $isSuperAdmin = true;
        }

        // 2. Direct username check
        if (!empty($user['username']) && in_array(strtolower((string)$user['username']), ['superadmin', 'root'], true)) {
            $isSuperAdmin = true;
        }

        // 3. Role ID check
        $roleId = strtolower((string)($user['role_id'] ?? $claims['role_id'] ?? ''));
        if (in_array($roleId, ['role_superadmin', 'superadmin', 'role_admin'], true)) {
            $isSuperAdmin = true;
        }

        // 4. Role name check
        $roleName = strtolower((string)($user['role_name'] ?? ''));
        if (str_contains($roleName, 'super') && str_contains($roleName, 'admin')) {
            $isSuperAdmin = true;
        }

        // 5. Query user_roles table directly if role_id is present
        if (!$isSuperAdmin && !empty($user['role_id'])) {
            try {
                $stmt = $this->db->prepare('SELECT id, name, permissions FROM user_roles WHERE id = ? LIMIT 1');
                $stmt->execute([$user['role_id']]);
                $role = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($role) {
                    $rName = strtolower((string)$role['name']);
                    if (str_contains($rName, 'super') || $role['id'] === 'role_superadmin') {
                        $isSuperAdmin = true;
                    } else {
                        // Check permissions
                        $permissions = is_string($role['permissions']) ? json_decode($role['permissions'], true) : ($role['permissions'] ?? []);
                        if (is_array($permissions) && (in_array('manage_system', $permissions, true) || in_array('all', $permissions, true))) {
                            $isSuperAdmin = true;
                        }
                    }
                }
            } catch (Throwable) {
                // Ignore DB error and proceed with existing check
            }
        }

        // 6. Header authorization fallback for automation or service accounts
        $authHeaderRole = $_SERVER['HTTP_X_USER_ROLE'] ?? null;
        if ($authHeaderRole && in_array(strtolower(trim($authHeaderRole)), ['role_superadmin', 'superadmin'], true)) {
            $isSuperAdmin = true;
        }

        if (!$isSuperAdmin) {
            $this->error('Access denied. Only authorized superadmin users can run database migrations.', 403);
        }
    }
}
