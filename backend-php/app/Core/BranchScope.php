<?php

declare(strict_types=1);

namespace App\Core;

final class BranchScope
{
    public static function currentBranchId(?string $fallback = null): ?string
    {
        $branchId = $_GET['current_user_branch_id'] ?? null;
        if (!is_scalar($branchId) || trim((string)$branchId) === '') {
            $branchId = $_GET['branch_id'] ?? $fallback;
        }

        if (!is_scalar($branchId)) {
            return null;
        }

        $value = trim((string)$branchId);
        return $value === '' || strtolower($value) === 'all' ? null : $value;
    }

    public static function appendCondition(
        string &$sql,
        array &$params,
        string $column,
        ?string $fallback = null
    ): void {
        $branchId = self::currentBranchId($fallback);
        if ($branchId === null) {
            return;
        }

        $sql .= str_contains(strtolower($sql), ' where ')
            ? " AND {$column} = :current_user_branch_id"
            : " WHERE {$column} = :current_user_branch_id";
        $params[':current_user_branch_id'] = $branchId;
    }
}
