<?php

namespace App\Core;

use PDO;
use App\Core\BranchScope;

class AuditLogger
{
    private static ?string $currentActor = null;

    public function __construct(
        private PDO $db
    ) {}

    public static function setCurrentActor(?string $actor): void
    {
        self::$currentActor = $actor !== null && trim($actor) !== ''
            ? trim($actor)
            : null;
    }

    /**
     * Record an audit trail entry.
     */
    public function recordAuditTrail(
        string $setting,
        mixed $oldValue = 'None',
        mixed $newValue = 'None',
        string $changedBy = 'System',
        string $reason = 'System event',
        string $action = ''
    ): string {
        $id = 'audit_' . bin2hex(random_bytes(8));
        $changedBy = self::$currentActor ?? $changedBy;
        if ($action === '') {
            $action = $oldValue === 'None' ? 'CREATE' : 'UPDATE';
            if (preg_match('/payment|transaction|transfer|replenishment/i', $setting) === 1) {
                $action = 'TRANSACTION';
            }
        }
        $action = strtoupper($action);
        $allowedActions = ['CREATE', 'UPDATE', 'DELETE', 'TRANSACTION'];
        if (!in_array($action, $allowedActions, true)) {
            throw new \InvalidArgumentException('Invalid audit action.');
        }

        $stmt = $this->db->prepare("
        INSERT INTO configuration_audit_trails (
            id,
            action,
            setting,
            old_value,
            new_value,
            changed_by,
            branch_id,
            created_at,
            reason
        ) VALUES (
            :id,
            :action,
            :setting,
            :old_value,
            :new_value,
            :changed_by,
            :branch_id,
            NOW(),
            :reason
        )
    ");

        $stmt->execute([
            ':id' =>
            $id,

            ':action' =>
            $action,

            ':setting' =>
            $setting,

            ':old_value' =>
            $this->auditValue($oldValue),

            ':new_value' =>
            $this->auditValue($newValue),

            ':changed_by' =>
            $changedBy,

            ':branch_id' =>
            BranchScope::currentBranchId(),

            ':reason' =>
            $reason
        ]);

        return $id;
    }


    /**
     * Convert audit values to a storable string.
     */
    private function auditValue(mixed $value): string
    {
        if ($value === null) {
            return 'None';
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_array($value) || is_object($value)) {
            return json_encode(
                $value,
                JSON_UNESCAPED_UNICODE |
                    JSON_UNESCAPED_SLASHES |
                    JSON_THROW_ON_ERROR
            );
        }

        return (string) $value;
    }
}
