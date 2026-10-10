<?php

declare(strict_types=1);

namespace App\Services;

use App\Core\BranchScope;
use App\Core\AuditLogger;
use PDO;

class CashService
{
    private AuditLogger $audit;

    public function __construct(private PDO $db)
    {
        $this->audit = new AuditLogger($db);
    }

    public function all(?string $branchId = null): array
    {
        $sql = "
            SELECT ca.*, b.name AS branch_name, coa.name AS gl_account_name
            FROM cash_accounts ca
            LEFT JOIN branches b ON ca.branch_id = b.id
            LEFT JOIN chart_of_accounts coa ON ca.gl_account_id = coa.id
            WHERE 1=1
        ";
        $params = [];

        BranchScope::appendCondition($sql, $params, 'ca.branch_id', $branchId);

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function find(string $id): ?array
    {
        $sql = 'SELECT * FROM cash_accounts WHERE (id = :id OR account_number = :account_number)';
        $params = ['id' => $id, 'account_number' => $id];
        BranchScope::appendCondition($sql, $params, 'branch_id');
        $stmt = $this->db->prepare($sql . ' LIMIT 1');
        $stmt->execute($params);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    private ?array $cashTxColumns = null;

    private function getCashTxColumns(): array
    {
        if ($this->cashTxColumns !== null) {
            return $this->cashTxColumns;
        }

        try {
            $stmt = $this->db->query("SHOW COLUMNS FROM cash_transactions");
            $cols = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $cols[strtolower($row['Field'])] = true;
            }
            $this->cashTxColumns = $cols;
            return $cols;
        } catch (\Throwable $e) {
            // Default to cooperative_db.sql standard schema
            return [
                'id' => true,
                'transaction_no' => true,
                'cash_account_id' => true,
                'type' => true,
                'amount' => true,
                'balance_before' => true,
                'balance_after' => true,
                'reference_type' => true,
                'reference_id' => true,
                'description' => true,
                'created_by' => true,
                'created_at' => true,
            ];
        }
    }

    public function recordCashTransaction(
        string $accountId,
        string $actionType,
        float $amount,
        float $balanceBefore,
        float $balanceAfter,
        string $reference,
        string $date,
        string $notes,
        string $createdBy = 'System'
    ): void {
        $cols = $this->getCashTxColumns();
        $data = [];

        if (isset($cols['id'])) {
            $data['id'] = 'ctx_' . bin2hex(random_bytes(6));
        }
        if (isset($cols['cash_account_id'])) {
            $data['cash_account_id'] = $accountId;
        }
        if (isset($cols['transaction_no'])) {
            $data['transaction_no'] = $reference . '-' . mt_rand(10, 99);
        }
        if (isset($cols['reference_number'])) {
            $data['reference_number'] = $reference;
        }
        if (isset($cols['type'])) {
            $upper = strtoupper($actionType);
            if (str_contains($upper, 'OUT') || str_contains($upper, 'WITHDRAW')) {
                $data['type'] = 'OUTFLOW';
            } elseif (str_contains($upper, 'IN') || str_contains($upper, 'REPLENISH') || str_contains($upper, 'DEPOSIT')) {
                $data['type'] = 'INFLOW';
            } elseif (str_contains($upper, 'TRANSFER')) {
                $data['type'] = 'TRANSFER';
            } else {
                $data['type'] = $actionType;
            }
        }
        if (isset($cols['amount'])) {
            $data['amount'] = $amount;
        }
        if (isset($cols['balance_before'])) {
            $data['balance_before'] = $balanceBefore;
        }
        if (isset($cols['balance_after'])) {
            $data['balance_after'] = $balanceAfter;
        }
        // ONLY insert running_balance if the column actually exists in the database table
        if (isset($cols['running_balance'])) {
            $data['running_balance'] = $balanceAfter;
        }
        if (isset($cols['reference_type'])) {
            $data['reference_type'] = str_contains(strtoupper($actionType), 'TRANSFER') ? 'TRANSFER' : 'REPLENISHMENT';
        }
        if (isset($cols['reference_id'])) {
            $data['reference_id'] = $reference;
        }
        if (isset($cols['description'])) {
            $data['description'] = $notes;
        }
        if (isset($cols['notes'])) {
            $data['notes'] = $notes;
        }
        if (isset($cols['transaction_date'])) {
            $data['transaction_date'] = $date;
        }
        if (isset($cols['created_by'])) {
            $data['created_by'] = $createdBy;
        }

        if (empty($data)) {
            return;
        }

        $fields = array_keys($data);
        $placeholders = array_fill(0, count($fields), '?');
        $sql = "INSERT INTO cash_transactions (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_values($data));
    }

    public function transfer(string $fromId, string $toId, float $amount, string $date, string $notes): array
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Transfer amount must be positive.');
        }

        $this->db->beginTransaction();

        try {
            // Deduct from source
            $sql = 'SELECT * FROM cash_accounts WHERE id = :id';
            $params = ['id' => $fromId];
            BranchScope::appendCondition($sql, $params, 'branch_id');
            $fromStmt = $this->db->prepare($sql . ' FOR UPDATE');
            $fromStmt->execute($params);
            $from = $fromStmt->fetch(PDO::FETCH_ASSOC);

            if (!$from) {
                throw new \RuntimeException('Source cash account not found.');
            }

            $fromBalBefore = (float)$from['current_balance'];
            if ($fromBalBefore < $amount) {
                throw new \RuntimeException('Insufficient cash drawer balance.');
            }

            $newFromBal = $fromBalBefore - $amount;
            $sql = 'UPDATE cash_accounts SET current_balance = :balance WHERE id = :id';
            $params = ['balance' => $newFromBal, 'id' => $fromId];
            BranchScope::appendCondition($sql, $params, 'branch_id');
            $this->db->prepare($sql)->execute($params);

            // Add to target
            $sql = 'SELECT * FROM cash_accounts WHERE id = :id';
            $params = ['id' => $toId];
            BranchScope::appendCondition($sql, $params, 'branch_id');
            $toStmt = $this->db->prepare($sql . ' FOR UPDATE');
            $toStmt->execute($params);
            $to = $toStmt->fetch(PDO::FETCH_ASSOC);

            if (!$to) {
                throw new \RuntimeException('Destination cash account not found.');
            }

            $toBalBefore = (float)$to['current_balance'];
            $newToBal = $toBalBefore + $amount;
            $sql = 'UPDATE cash_accounts SET current_balance = :balance WHERE id = :id';
            $params = ['balance' => $newToBal, 'id' => $toId];
            BranchScope::appendCondition($sql, $params, 'branch_id');
            $this->db->prepare($sql)->execute($params);

            // Log transactions safely without assuming non-existent columns
            $ref = 'TXFR-' . date('Ymd') . '-' . mt_rand(100, 999);

            $this->recordCashTransaction($fromId, 'Transfer Out', $amount, $fromBalBefore, $newFromBal, $ref, $date, $notes);
            $this->recordCashTransaction($toId, 'Transfer In', $amount, $toBalBefore, $newToBal, $ref, $date, $notes);
            $this->audit->recordAuditTrail(
                'cash_transfer',
                ['from_account_id' => $fromId, 'from_balance' => $fromBalBefore, 'to_account_id' => $toId, 'to_balance' => $toBalBefore],
                ['reference' => $ref, 'amount' => $amount, 'from_balance' => $newFromBal, 'to_balance' => $newToBal],
                'System',
                'Cash account transfer',
                'TRANSACTION'
            );

            $this->db->commit();

            return [
                'reference'       => $ref,
                'amount'          => $amount,
                'from_balance'    => $newFromBal,
                'to_balance'      => $newToBal,
            ];
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function save(array $data): array
    {
        $id = $data['id'] ?? ('cash_' . bin2hex(random_bytes(6)));
        $existing = $this->find($id);
        $name = $data['name'] ?? 'Cash Vault Account';
        $accountNo = $data['account_number'] ?? $data['account_code'] ?? ('CASH-' . mt_rand(1000, 9999));
        $bankName = $data['bank_name'] ?? 'Cash Depository';
        $branchId = $data['branch_id'] ?? 'branch_tar';
        $glId = $data['gl_account_id'] ?? 'acc_1110';
        $opening = (float)($data['opening_balance'] ?? 0);
        $current = isset($data['current_balance']) ? (float)$data['current_balance'] : $opening;
        $currency = $data['currency'] ?? 'PHP';
        $active = isset($data['active']) ? (int)$data['active'] : 1;

        $branchStmt = $this->db->prepare('SELECT id FROM branches WHERE id = ?');
        $branchStmt->execute([$branchId]);
        if (!$branchStmt->fetchColumn()) {
            throw new \InvalidArgumentException('Selected branch does not exist.');
        }

        $glStmt = $this->db->prepare('SELECT id FROM chart_of_accounts WHERE id = ?');
        $glStmt->execute([$glId]);
        if (!$glStmt->fetchColumn()) {
            throw new \InvalidArgumentException('Selected GL account does not exist.');
        }

        $sql = "
            INSERT INTO cash_accounts (id, name, account_number, bank_name, branch_id, gl_account_id, opening_balance, current_balance, currency, active)
            VALUES (:id, :name, :account_number, :bank_name, :branch_id, :gl_account_id, :opening_balance, :current_balance, :currency, :active)
            ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                account_number = VALUES(account_number),
                bank_name = VALUES(bank_name),
                branch_id = VALUES(branch_id),
                gl_account_id = VALUES(gl_account_id),
                current_balance = VALUES(current_balance),
                active = VALUES(active)
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            'id'              => $id,
            'name'            => $name,
            'account_number'  => $accountNo,
            'bank_name'       => $bankName,
            'branch_id'       => $branchId,
            'gl_account_id'   => $glId,
            'opening_balance' => $opening,
            'current_balance' => $current,
            'currency'        => $currency,
            'active'          => $active
        ]);

        $saved = $this->find($id) ?? $data;
        $this->audit->recordAuditTrail(
            'cash_accounts',
            $existing ? ['id' => $id, 'branch_id' => $existing['branch_id'] ?? null] : 'None',
            ['id' => $id, 'branch_id' => $branchId, 'account_number' => $accountNo],
            (string)($data['updated_by'] ?? $data['created_by'] ?? 'System'),
            'Cash account saved',
            $existing ? 'UPDATE' : 'CREATE'
        );
        return $saved;
    }

    public function delete(string $id): bool
    {
        $sql = 'DELETE FROM cash_accounts WHERE id = :id';
        $params = ['id' => $id];
        BranchScope::appendCondition($sql, $params, 'branch_id');
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $deleted = $stmt->rowCount() > 0;
        if ($deleted) {
            $this->audit->recordAuditTrail('cash_accounts', ['id' => $id], 'None', 'System', 'Cash account deleted', 'DELETE');
        }
        return $deleted;
    }

    public function replenish(string $accountId, float $amount, ?string $sourceId, string $notes, string $date): array
    {
        if ($amount <= 0) {
            throw new \InvalidArgumentException('Replenishment amount must be greater than zero.');
        }

        $this->db->beginTransaction();

        try {
            $sql = 'SELECT * FROM cash_accounts WHERE id = :id';
            $params = ['id' => $accountId];
            BranchScope::appendCondition($sql, $params, 'branch_id');
            $toStmt = $this->db->prepare($sql . ' FOR UPDATE');
            $toStmt->execute($params);
            $target = $toStmt->fetch(PDO::FETCH_ASSOC);

            if (!$target) {
                throw new \RuntimeException('Cash account not found.');
            }

            if ($sourceId) {
                $sql = 'SELECT * FROM cash_accounts WHERE id = :id';
                $params = ['id' => $sourceId];
                BranchScope::appendCondition($sql, $params, 'branch_id');
                $fromStmt = $this->db->prepare($sql . ' FOR UPDATE');
                $fromStmt->execute($params);
                $source = $fromStmt->fetch(PDO::FETCH_ASSOC);

                if ($source && (float)$source['current_balance'] < $amount) {
                    throw new \RuntimeException('Insufficient funds in source account.');
                }

                if ($source) {
                    $sourceBalBefore = (float)$source['current_balance'];
                    $newSourceBal = $sourceBalBefore - $amount;
                    $sql = 'UPDATE cash_accounts SET current_balance = :balance WHERE id = :id';
                    $params = ['balance' => $newSourceBal, 'id' => $sourceId];
                    BranchScope::appendCondition($sql, $params, 'branch_id');
                    $this->db->prepare($sql)->execute($params);
                    $this->recordCashTransaction(
                        $sourceId,
                        'Transfer Out',
                        $amount,
                        $sourceBalBefore,
                        $newSourceBal,
                        'REP-OUT-' . date('Ymd') . '-' . mt_rand(100, 999),
                        $date,
                        "Replenishment outflow to " . ($target['name'] ?? 'cash account')
                    );
                }
            }

            $targetBalBefore = (float)$target['current_balance'];
            $newTargetBal = $targetBalBefore + $amount;
            $sql = 'UPDATE cash_accounts SET current_balance = :balance WHERE id = :id';
            $params = ['balance' => $newTargetBal, 'id' => $accountId];
            BranchScope::appendCondition($sql, $params, 'branch_id');
            $this->db->prepare($sql)->execute($params);

            $ref = 'REP-' . date('Ymd') . '-' . mt_rand(100, 999);
            $this->recordCashTransaction(
                $accountId,
                'Replenishment',
                $amount,
                $targetBalBefore,
                $newTargetBal,
                $ref,
                $date,
                $notes
            );

            $this->audit->recordAuditTrail(
                'cash_replenishment',
                ['account_id' => $accountId, 'balance' => $targetBalBefore, 'source_account_id' => $sourceId],
                ['reference' => $ref, 'amount' => $amount, 'balance' => $newTargetBal],
                'System',
                'Cash account replenished',
                'TRANSACTION'
            );

            $this->db->commit();

            return [
                'reference'       => $ref,
                'amount'          => $amount,
                'current_balance' => $newTargetBal,
                'account'         => $this->find($accountId)
            ];
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function autoAlignGl(): int
    {
        $accounts = $this->all();
        $updated = 0;
        foreach ($accounts as $a) {
            $num = strtoupper($a['account_number'] ?? '');
            $name = strtolower($a['name'] ?? '');
            $bank = strtolower($a['bank_name'] ?? '');
            $targetGl = $a['gl_account_id'];

            if (str_contains($bank, 'land bank') || str_contains($name, 'land bank')) {
                $targetGl = 'acc_1120';
            } elseif (str_contains($bank, 'development bank') || str_contains($bank, 'dbp') || str_contains($name, 'dbp')) {
                $targetGl = 'acc_1121';
            } elseif (str_contains($bank, 'maya') || str_contains($name, 'maya') || str_contains($name, 'gcash') || str_contains($name, 'wallet')) {
                $targetGl = 'acc_1130';
            } elseif (str_contains($name, 'petty') || str_contains($bank, 'petty')) {
                $targetGl = 'acc_1111';
            } elseif (str_starts_with($num, 'COH-') || str_contains($name, 'teller') || str_contains($name, 'drawer')) {
                $targetGl = 'acc_1110';
            } elseif (str_starts_with($num, 'VLT-') || str_contains($name, 'vault') || str_contains($bank, 'vault')) {
                $targetGl = 'acc_1112';
            }

            if ($targetGl !== $a['gl_account_id']) {
                $this->db->prepare("UPDATE cash_accounts SET gl_account_id = ? WHERE id = ?")->execute([$targetGl, $a['id']]);
                $updated++;
            }
        }
        return $updated;
    }
}
