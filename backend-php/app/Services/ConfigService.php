<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\BranchScope;
use PDO;

class ConfigService
{
    public function __construct(private PDO $db) {}

    /**
     * Fetch complete configuration bundle matching frontend initialization
     */
    public function getAllConfig(): array
    {
        return [
            'cooperatives'                  => $this->fetchAll('cooperatives'),
            'branches'                      => $this->fetchAll('branches'),
            'system_settings'               => $this->fetchAll('system_settings'),
            'feature_toggles'               => $this->fetchAll('feature_toggles'),
            'chart_of_accounts'             => $this->fetchAll('chart_of_accounts'),
            'accounting_mappings'           => $this->fetchAll('accounting_mappings'),
            'accounting_periods'            => $this->fetchAll('accounting_periods'),
            'numbering_formats'             => $this->fetchAll('numbering_formats'),
            'approval_workflows'            => $this->fetchAll('approval_workflows'),
            'approval_rules'                => $this->fetchAll('approval_rules'),
            'custom_fields'                 => $this->fetchAll('custom_fields'),
            'member_types'                  => $this->fetchAll('member_types'),
            'loan_products'                 => $this->fetchAll('loan_products'),
            'loan_product_versions'         => $this->fetchAll('loan_product_versions'),
            'savings_products'              => $this->fetchAll('savings_products'),
            'share_capital_settings'        => $this->fetchAll('share_capital_settings'),
            'cash_accounts'                 => $this->fetchAll('cash_accounts'),
            'fees'                          => $this->fetchAll('fees'),
            'penalty_rules'                 => $this->fetchAll('penalty_rules'),
            'payment_allocation_rules'      => $this->fetchAll('payment_allocation_rules'),
            'payment_frequencies'           => $this->fetchAll('payment_frequencies'),
            'document_requirements'         => $this->fetchAll('document_requirements'),
            'transaction_types'             => $this->fetchAll('transaction_types'),
            'user_roles'                    => $this->fetchAll('user_roles'),
            'users'                         => $this->fetchAll('users'),
            'configuration_audit_trails'    => $this->fetchAll('configuration_audit_trails')
        ];
    }

    private function fetchAll(string $table): array
    {
        try {
            $branchId = $this->currentBranchId();
            $sql = "SELECT * FROM `{$table}`";
            $params = [];

            if ($branchId !== null && $this->tableHasBranchId($table)) {
                $sql .= ' WHERE `branch_id` = :branch_id';
                $params[':branch_id'] = $branchId;
            }

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (\PDOException $e) {
            return [];
        }
    }

    private function currentBranchId(): ?string
    {
        return BranchScope::currentBranchId();
    }

    private function tableHasBranchId(string $table): bool
    {
        try {
            $stmt = $this->db->prepare('DESCRIBE `' . $table . '`');
            $stmt->execute();
            $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            return in_array('branch_id', $columns, true);
        } catch (\PDOException $e) {
            return false;
        }
    }

    public function getBranches(): array
    {
        return $this->fetchAll('branches');
    }

    public function saveBranch(array $data): array
    {
        $id = $data['id'] ?? ('br_' . bin2hex(random_bytes(4)));
        $sql = "
            INSERT INTO branches (id, code, name, address, contact_number, manager_name, is_main_branch, active)
            VALUES (:id, :code, :name, :address, :contact_number, :manager_name, :is_main_branch, :active)
            ON DUPLICATE KEY UPDATE
                code = VALUES(code),
                name = VALUES(name),
                address = VALUES(address),
                contact_number = VALUES(contact_number),
                manager_name = VALUES(manager_name),
                active = VALUES(active)
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'id'             => $id,
            'code'           => $data['code'],
            'name'           => $data['name'],
            'address'        => $data['address'] ?? '',
            'contact_number' => $data['contact_number'] ?? null,
            'manager_name'   => $data['manager_name'] ?? null,
            'is_main_branch' => !empty($data['is_main_branch']) ? 1 : 0,
            'active'         => isset($data['active']) ? (int)$data['active'] : 1
        ]);

        $res = $this->db->prepare("SELECT * FROM branches WHERE id = ?");
        $res->execute([$id]);
        return $res->fetch(PDO::FETCH_ASSOC) ?: [];
    }

    public function deleteBranch(string $id): bool
    {
        return $this->db->prepare('DELETE FROM branches WHERE id = ?')->execute([$id]);
    }

    public function getFee(string $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM fees WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;
        return array_merge($row, [
            'fixed_amount' => (float)($row['amount'] ?? 0),
            'percentage' => (float)($row['percentage'] ?? ($row['calculation_type'] === 'Percentage' ? $row['amount'] : 0)),
            'rate' => (float)($row['percentage'] ?? ($row['calculation_type'] === 'Percentage' ? $row['amount'] : 0)),
            'applicable_module' => $row['applies_to'] ?? 'Loans',
            'accounting_account_id' => $row['gl_account_id'] ?? null,
            'active' => (bool)($row['active'] ?? true)
        ]);
    }

    public function deleteFee(string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM fees WHERE id = ?");
        return $stmt->execute([$id]);
    }

    public function getLoanProducts(): array
    {
        return $this->fetchAll('loan_products');
    }

    public function getSavingsProducts(): array
    {
        return $this->fetchAll('savings_products');
    }

    public function getSystemSettings(): array
    {
        return $this->fetchAll('system_settings');
    }

    public function getFeatureToggles(): array
    {
        return $this->fetchAll('feature_toggles');
    }

    public function updateFeatureToggle(string $featureKey, bool $enabled): bool
    {
        $stmt = $this->db->prepare("UPDATE feature_toggles SET enabled = ? WHERE feature_key = ?");
        return $stmt->execute([$enabled ? 1 : 0, $featureKey]);
    }



    public function deleteLoanProduct(string $id): bool
    {
        return $this->db->prepare("DELETE FROM loan_products WHERE id = ?")->execute([$id]);
    }
    //
    public function saveSavingsProduct(array $data): array
    {
        $id = $data['id'] ?? ('sp_' . bin2hex(random_bytes(4)));
        $sql = "
            INSERT INTO savings_products (
                id, code, name, min_balance_to_earn_interest, annual_interest_rate,
                interest_calculation_method, min_opening_deposit, maintaining_balance,
                gl_liability_account_id, gl_interest_expense_account_id, active
            ) VALUES (
                :id, :code, :name, :min_balance_to_earn_interest, :annual_interest_rate,
                :interest_calculation_method, :min_opening_deposit, :maintaining_balance,
                :gl_liability_account_id, :gl_interest_expense_account_id, :active
            )
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                min_balance_to_earn_interest = VALUES(min_balance_to_earn_interest),
                annual_interest_rate = VALUES(annual_interest_rate),
                interest_calculation_method = VALUES(interest_calculation_method),
                min_opening_deposit = VALUES(min_opening_deposit),
                maintaining_balance = VALUES(maintaining_balance),
                gl_liability_account_id = VALUES(gl_liability_account_id),
                gl_interest_expense_account_id = VALUES(gl_interest_expense_account_id),
                active = VALUES(active)
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'id'                       => $id,
            'code'                     => $data['code'] ?? ('SP-' . mt_rand(100, 999)),
            'name'                     => $data['name'],
            'min_balance_to_earn_interest' => (float)($data['min_balance_to_earn_interest'] ?? 1000),
            'annual_interest_rate'         => (float)($data['annual_interest_rate'] ?? 2),
            'interest_calculation_method' => $data['interest_calculation_method'] ?? 'Average Daily Balance',
            'min_opening_deposit'          => (float)($data['min_opening_deposit'] ?? 500),
            'maintaining_balance'          => (float)($data['maintaining_balance'] ?? 500),
            'gl_liability_account_id'      => $data['gl_liability_account_id'] ?? '',
            'gl_interest_expense_account_id' => $data['gl_interest_expense_account_id'] ?? '',
            'active'                       => isset($data['active']) ? (int)(bool)$data['active'] : 1
        ]);
        $saved = $this->db->prepare('SELECT * FROM savings_products WHERE id = ?');
        $saved->execute([$id]);
        return $saved->fetch(PDO::FETCH_ASSOC) ?: array_merge(['id' => $id], $data);
    }


    public function deleteSavingsProduct(string $id): bool
    {
        return $this->db->prepare("DELETE FROM savings_products WHERE id = ?")->execute([$id]);
    }

    public function getFees(): array
    {
        return $this->fetchAll('fees');
    }

    public function saveFee(array $data): array
    {
        $id = $data['id'] ?? ('fee_' . bin2hex(random_bytes(4)));

        $code = !empty($data['code'])
            ? $data['code']
            : ('FEE-' . mt_rand(100, 999));

        $sql = "
        INSERT INTO fees (
            id,
            code,
            name,
            calculation_type,
            amount,
            applies_to,
            percentage,
            gl_account_id,
            active
        )
        VALUES (
            :id,
            :code,
            :name,
            :calculation_type,
            :amount,
            :applies_to,
            :percentage,
            :gl_account_id,
            :active
        )
        ON DUPLICATE KEY UPDATE
            code = VALUES(code),
            name = VALUES(name),
            calculation_type = VALUES(calculation_type),
            amount = VALUES(amount),
            applies_to = VALUES(applies_to),
            percentage = VALUES(percentage),
            gl_account_id = VALUES(gl_account_id),
            active = VALUES(active)
    ";

        $stmt = $this->db->prepare($sql);

        $stmt->execute([
            'id' => $id,
            'code' => $code,
            'name' => $data['name'],
            'calculation_type' => $data['calculation_type'] ?? 'Fixed',
            'amount' => (float) (
                $data['amount']
                ?? $data['fixed_amount']
                ?? 0
            ),
            'applies_to' => $data['applicable_module'] ?? 'loan',
            'gl_account_id' => $data['gl_account_id'] ?? null,
            'percentage' => (float) ($data['percentage'] ?? 0),
            'active' => isset($data['active'])
                ? (int) $data['active']
                : 1,
        ]);

        return array_merge([
            'id' => $id,
            'code' => $code,
        ], $data);
    }

    public function updateSystemSettings(array $data): bool
    {
        foreach ($data as $key => $val) {
            $stmt = $this->db->prepare("
                INSERT INTO system_settings (id, `key`, `value`)
                VALUES (:id, :key, :value)
                ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)
            ");
            $stmt->execute([
                'id'    => 'set_' . preg_replace('/[^a-zA-Z0-9_]/', '', $key),
                'key'   => $key,
                'value' => is_string($val) ? $val : json_encode($val)
            ]);
        }
        return true;
    }

    public function getApprovalRules(): array
    {
        return $this->fetchAll('approval_rules');
    }

    public function saveApprovalRule(array $data): array
    {
        $id = $data['id'] ?? ('ar_' . bin2hex(random_bytes(4)));
        $sql = "
            INSERT INTO approval_rules (id, workflow_id, level_name, `order`, required_role, minimum_amount, maximum_amount, required_approvals, active)
            VALUES (:id, :workflow_id, :level_name, :rule_order, :required_role, :minimum_amount, :maximum_amount, :required_approvals, :active)
            ON DUPLICATE KEY UPDATE
                workflow_id = VALUES(workflow_id),
                level_name = VALUES(level_name),
                `order` = VALUES(`order`),
                required_role = VALUES(required_role),
                minimum_amount = VALUES(minimum_amount),
                maximum_amount = VALUES(maximum_amount),
                required_approvals = VALUES(required_approvals),
                active = VALUES(active)
        ";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'id'            => $id,
            'workflow_id'   => $data['workflow_id'] ?? 'wf_loan_origination',
            'level_name'    => $data['level_name'] ?? 'Approval Level',
            'rule_order'    => (int)($data['order'] ?? $data['step_order'] ?? 1),
            'required_role' => $data['required_role'] ?? 'Loan Officer',
            'minimum_amount' => (float)($data['minimum_amount'] ?? $data['min_amount'] ?? 0),
            'maximum_amount' => (float)($data['maximum_amount'] ?? $data['max_amount'] ?? 1000000),
            'required_approvals' => (int)($data['required_approvals'] ?? 1),
            'active' => isset($data['active']) ? (int)(bool)$data['active'] : 1
        ]);
        $saved = $this->db->prepare('SELECT * FROM approval_rules WHERE id = ?');
        $saved->execute([$id]);
        return $saved->fetch(PDO::FETCH_ASSOC) ?: array_merge(['id' => $id], $data);
    }

    public function deleteApprovalRule(string $id): bool
    {
        return $this->db->prepare('DELETE FROM approval_rules WHERE id = ?')->execute([$id]);
    }

    public function getApprovalWorkflows(): array
    {
        return $this->fetchAll('approval_workflows');
    }

    public function getCustomFields(): array
    {
        return $this->fetchAll('custom_fields');
    }

    public function deleteCustomField(string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM custom_fields WHERE id = ?");
        return $stmt->execute([$id]);
    }
    
    public function saveCustomField(array $data): array
    {
        $id = $data['id'] ?? ('cf_' . bin2hex(random_bytes(4)));

        $sql = "
        INSERT INTO custom_fields (
            id,
            entity_type,
            field_key,
            label,
            field_type,
            options,
            is_required,
            active,
            display_order
        )
        VALUES (
            :id,
            :entity_type,
            :field_key,
            :label,
            :field_type,
            :options,
            :is_required,
            :active,
            :display_order
        )
        ON DUPLICATE KEY UPDATE
            entity_type = VALUES(entity_type),
            field_key = VALUES(field_key),
            label = VALUES(label),
            field_type = VALUES(field_type),
            options = VALUES(options),
            is_required = VALUES(is_required),
            active = VALUES(active),
            display_order = VALUES(display_order)
    ";

        $stmt = $this->db->prepare($sql);

        // Convert options array to JSON for database storage
        $options = $data['options'] ?? [];

        if (is_array($options)) {
            $options = json_encode($options, JSON_UNESCAPED_UNICODE);
        }

        $stmt->execute([
            'id'            => $id,
            'entity_type'   => $data['entity_type'] ?? 'member',
            'field_key'     => $data['field_key'] ?? ('custom_' . mt_rand(100, 999)),
            'label'         => $data['label'] ?? $data['field_label'] ?? 'Custom Field',
            'field_type'    => $data['field_type'] ?? 'Text',
            'options'       => $options,
            'is_required'   => !empty($data['is_required']) ? 1 : 0,
            'active'        => isset($data['active']) ? (int) $data['active'] : 1,
            'display_order' => isset($data['display_order'])
                ? (int) $data['display_order']
                : 0
        ]);

        return array_merge([
            'id' => $id
        ], $data, [
            'field_key'     => $data['field_key'] ?? null,
            'label'         => $data['label'] ?? $data['field_label'] ?? 'Custom Field',
            'options'       => $data['options'] ?? [],
            'active'        => isset($data['active']) ? (int) $data['active'] : 1,
            'display_order' => isset($data['display_order']) ? (int) $data['display_order'] : 0
        ]);
    }



    public function updateNumberingFormat(string $id, array $data): array
    {
        $stmt = $this->db->prepare("
            UPDATE numbering_formats
            SET module = :module,
                prefix = :prefix,
                pattern = :pattern,
                next_number = :next_number,
                padding = :padding,
                branch_specific = :branch_specific,
                include_year = :include_year
            WHERE id = :id
        ");
        $stmt->execute([
            'id'            => $id,
            'module'        => $data['module'] ?? '',
            'prefix'        => $data['prefix'] ?? '',
            'pattern'       => $data['pattern'] ?? '',
            'next_number'   => (int)($data['next_number'] ?? 1),
            'padding'       => (int)($data['padding'] ?? 5),
            'branch_specific' => isset($data['branch_specific']) ? (int)(bool)$data['branch_specific'] : 1,
            'include_year'  => isset($data['include_year']) ? (int)(bool)$data['include_year'] : 1
        ]);
        $saved = $this->db->prepare('SELECT * FROM numbering_formats WHERE id = ?');
        $saved->execute([$id]);
        $record = $saved->fetch(PDO::FETCH_ASSOC);
        if (!$record) {
            throw new \RuntimeException("Numbering format '{$id}' not found.");
        }
        return $record;
    }

    public function saveNumberingFormat(array $data): array
    {
        $id = $data['id'] ?? ('num_' . bin2hex(random_bytes(4)));
        $stmt = $this->db->prepare("
            INSERT INTO numbering_formats (id, module, prefix, branch_specific, include_year, padding, next_number, pattern)
            VALUES (:id, :module, :prefix, :branch_specific, :include_year, :padding, :next_number, :pattern)
        ");
        $stmt->execute([
            'id' => $id,
            'module' => $data['module'] ?? '',
            'prefix' => $data['prefix'] ?? '',
            'branch_specific' => isset($data['branch_specific']) ? (int)(bool)$data['branch_specific'] : 1,
            'include_year' => isset($data['include_year']) ? (int)(bool)$data['include_year'] : 1,
            'padding' => (int)($data['padding'] ?? 5),
            'next_number' => (int)($data['next_number'] ?? 1),
            'pattern' => $data['pattern'] ?? ''
        ]);
        $saved = $this->db->prepare('SELECT * FROM numbering_formats WHERE id = ?');
        $saved->execute([$id]);
        return $saved->fetch(PDO::FETCH_ASSOC) ?: array_merge(['id' => $id], $data);
    }

    public function deleteNumberingFormat(string $id): bool
    {
        return $this->db->prepare('DELETE FROM numbering_formats WHERE id = ?')->execute([$id]);
    }
    /**
     * PUT /api/config/payment-allocation-rules/:id
     */
    public function updatePaymentAllocationRule(string $id, array $data): array
    {
        // The actual priority list is inside "data"
        $priorityOrder = $data['priorities'] ?? [];

        if (!is_array($priorityOrder)) {
            throw new \InvalidArgumentException(
                'priority_order data must be an array.'
            );
        }
        // Normalize / validate the priority items
        $priorityOrder = array_values(
            array_map(
                static function (array $item, int $index): array {
                    return [
                        'label' => (string) ($item['label'] ?? ''),
                        'priority' => (int) ($item['priority'] ?? ($index + 1)),
                        'component' => (string) ($item['component'] ?? ''),
                    ];
                },
                $priorityOrder,
                array_keys($priorityOrder)
            )
        );
        usort(
            $priorityOrder,
            static function (array $a, array $b): int {
                return $a['priority'] <=> $b['priority'];
            }
        );
        $stmt = $this->db->prepare("
            UPDATE payment_allocation_rules
            SET
                priority_order = :priority_order,
                updated_at = NOW()
            WHERE id = :id
        ");

        $stmt->execute([
            ':id' => $id,
            ':priority_order' => json_encode(
                $priorityOrder
            ),
        ]);

        if ($stmt->rowCount() === 0) {
            // Check whether the ID actually exists
            $check = $this->db->prepare("
                SELECT id
                FROM payment_allocation_rules
                WHERE id = :id
                LIMIT 1
            ");

            $check->execute([':id' => $id]);

            if (!$check->fetch(PDO::FETCH_ASSOC)) {
                throw new \RuntimeException(
                    "Payment allocation rule '{$id}' not found."
                );
            }
        }

        return [
            'id' => $id,
            'priority_order' => $priorityOrder,
        ];
    }
    /**
     * Fetch payment allocation rules for a specific allocation type
     */
    public function getAllocationRules(): array
    {
        $stmt = $this->db->prepare("SELECT * FROM payment_allocation_rules ORDER BY priority_order ASC");
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    public function saveLoanProduct(array $data): array
    {
        $id = $data['id'] ?? ('lp_' . bin2hex(random_bytes(4)));
        $params = [
            'id' => $id,
            'code' => $data['code'] ?? ('LP-' . mt_rand(100, 999)),
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'version' => (int)($data['version'] ?? 1),
            'min_amount' => (float)($data['min_amount'] ?? 5000),
            'max_amount' => (float)($data['max_amount'] ?? 500000),
            'min_term_months' => (int)($data['min_term_months'] ?? 1),
            'max_term_months' => (int)($data['max_term_months'] ?? $data['default_term_months'] ?? 60),
            'default_term_months' => (int)($data['default_term_months'] ?? 12),
            'annual_interest_rate' => (float)($data['annual_interest_rate'] ?? 6),
            'interest_calculation_method' => $data['interest_calculation_method'] ?? 'Diminishing Balance',
            'payment_frequency' => $data['payment_frequency'] ?? 'Monthly',
            'grace_period_days' => (int)($data['grace_period_days'] ?? 0),
            'processing_fee_percentage' => (float)($data['processing_fee_percentage'] ?? 0),
            'service_fee_fixed' => (float)($data['service_fee_fixed'] ?? 0),
            'penalty_rule_id' => $data['penalty_rule_id'] ?? null,
            'collateral_required' => !empty($data['collateral_required']) ? 1 : 0,
            'guarantor_required' => !empty($data['guarantor_required']) ? 1 : 0,
            'debit_account_id' => $data['debit_account_id'] ?? $data['gl_receivable_account_id'] ?? '',
            'required_documents' => is_array($data['required_documents'] ?? null)
                ? json_encode($data['required_documents'], JSON_UNESCAPED_UNICODE)
                : ($data['required_documents'] ?? '[]'),
            'approval_workflow_id' => $data['approval_workflow_id'] ?? null,
            'effective_from' => $data['effective_from'] ?? null,
            'effective_until' => $data['effective_until'] ?? null,
            'penalty_rate_percentage' => (float)($data['penalty_rate_percentage'] ?? 2),
            'gl_receivable_account_id' => $data['gl_receivable_account_id'] ?? $data['debit_account_id'] ?? '',
            'gl_interest_income_account_id' => $data['gl_interest_income_account_id'] ?? '',
            'active' => isset($data['active']) ? (int)(bool)$data['active'] : 1
        ];
        $columns = array_keys($params);
        $columns = array_values(array_filter($columns, static fn(string $column): bool => $column !== 'id'));

        if (isset($data['id'])) {
            $updateColumns = array_values(array_filter($columns, static fn(string $column): bool => $column !== 'version'));
            $set = implode(', ', array_map(static fn(string $column): string => "`{$column}` = :{$column}", $updateColumns));
            $stmt = $this->db->prepare("UPDATE loan_products SET {$set}, version = version + 1 WHERE id = :id");
            unset($params['version']);
            $stmt->execute($params);
        } else {
            $insertColumns = implode(', ', array_map(static fn(string $column): string => "`{$column}`", array_merge(['id'], $columns)));
            $placeholders = implode(', ', array_map(static fn(string $column): string => ":{$column}", array_merge(['id'], $columns)));
            $stmt = $this->db->prepare("INSERT INTO loan_products ({$insertColumns}) VALUES ({$placeholders})");
            $stmt->execute($params);
        }
        return $this->getLoanProduct($id);
    }
    public function getLoanProduct(string $id): array
    {
        $stmt = $this->db->prepare('SELECT * FROM loan_products WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    }
    public function updateCustomField(string $id, array $data): array
    {
        $options = $data['options'] ?? [];
        if (is_array($options)) {
            $options = json_encode($options, JSON_UNESCAPED_UNICODE);
        }
        $stmt = $this->db->prepare("
        UPDATE custom_fields
        SET
            entity_type   = :entity_type,
            field_key     = :field_key,
            label         = :label,
            field_type    = :field_type,
            options       = :options,
            is_required   = :is_required,
            active        = :active,
            display_order = :display_order
        WHERE id = :id
        ");

        $stmt->execute([
            'id'            => $id,
            'entity_type'   => $data['entity_type'] ?? $data['entity'] ?? 'Member',
            'field_key'     => $data['field_key'] ?? $data['field_name'] ?? '',
            'label'         => $data['label'] ?? $data['field_label'] ?? '',
            'field_type'    => $data['field_type'] ?? 'Text',
            'options'       => $options,
            'is_required'   => !empty($data['is_required'] ?? $data['required']) ? 1 : 0,
            'active'        => isset($data['active']) ? (int)(bool)$data['active'] : 1,
            'display_order' => (int)($data['display_order'] ?? 0)
        ]);

        $saved = $this->db->prepare('SELECT * FROM custom_fields WHERE id = ?');
        $saved->execute([$id]);
        return $saved->fetch(PDO::FETCH_ASSOC) ?: array_merge(['id' => $id], $data);
    }
}
