<?php

declare(strict_types=1);

namespace App\Services;

use PDO;
use App\Core\AuditLogger;
use App\Core\BranchScope;

class AccountingService
{
    private AuditLogger $audit;
    public function __construct(private PDO $db)
    {
        $this->audit = new AuditLogger($this->db);
    }

    /**
     * Get all Chart of Accounts items
     */
    public function getChartOfAccounts(): array
    {
        $stmt = $this->db->query("
            SELECT * FROM chart_of_accounts
            ORDER BY account_code ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Find single account by ID or Code
     */
    public function findAccount(string $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM chart_of_accounts
            WHERE id = ? OR account_code = ?
            LIMIT 1
        ");
        $stmt->execute([$id, $id]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res ?: null;
    }

      /**
     * Create or update account in Chart of Accounts
     */
    public function saveAccount(array $data): array
    {
        

        try {
            $this->db->beginTransaction();
            $id = $data['id'] ?? ('coa_' . bin2hex(random_bytes(6)));
            $isUpdate = isset($data['id']);
            $branchId = $data['branch_id'] ?? null;

            if ($isUpdate) {
                $stmt = $this->db->prepare('SELECT * FROM chart_of_accounts WHERE id = ? FOR UPDATE');
                $stmt->execute([$id]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    throw new \Exception('Chart of accounts record not found.');
                }

                $accountData = array_merge($existing, $data);
                $stmt = $this->db->prepare("
                    UPDATE chart_of_accounts
                    SET account_code = :account_code,
                        branch_id = :branch_id,
                        name = :name,
                        category = :category,
                        normal_balance = :normal_balance,
                        is_active = :is_active,
                        parent_account_id = :parent_account_id,
                        report_group = :report_group,
                        description = :description
                    WHERE id = :id
                ");
            } else {
               
                $accountData = $data;
                $stmt = $this->db->prepare("
                    INSERT INTO chart_of_accounts
                    (
                        id,
                        branch_id,
                        account_code,
                        name,
                        category,
                        normal_balance,
                        is_active,
                        parent_account_id,
                        report_group,
                        description,
                        created_at
                    )
                    VALUES
                    (
                        :id,
                        :branch_id,
                        :account_code,
                        :name,
                        :category,
                        :normal_balance,
                        :is_active,
                        :parent_account_id,
                        :report_group,
                        :description,
                        NOW()
                    )
                ");
            }

            $stmt->execute([
                ':id'                => $id,
                ':branch_id'         => $branchId,
                ':account_code'      => trim((string) $accountData['account_code']),
                ':name'              => $accountData['name'],
                ':category'          => $accountData['category'],
                ':normal_balance'    => $accountData['normal_balance'],
                ':is_active'         => isset($accountData['is_active'])
                    ? (int) $accountData['is_active']
                    : 1,
                ':parent_account_id' => $accountData['parent_account_id'] ?? null,
                ':report_group'      => $accountData['report_group'] ?? 'General',
                ':description'       => $accountData['description'] ?? null
            ]);

            $stmt = $this->db->prepare('SELECT * FROM chart_of_accounts WHERE id = ? LIMIT 1');
            $stmt->execute([$id]);

            $account = $stmt->fetch(\PDO::FETCH_ASSOC);

            if (!$account) {
                throw new \Exception(
                    'Account was not found after INSERT/UPDATE.'
                );
            }

            // Commit only after successful INSERT and SELECT
            $this->db->commit();

            return $account;
        } catch (\Throwable $e) {

            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            throw $e;
        }
    }

    /**
     * Fetch journal entries with lines
     */
    public function getJournalEntries(?string $branchId = null, ?string $startDate = null, ?string $endDate = null): array
    {
        $sql = "
            SELECT je.*, b.name AS branch_name
            FROM journal_entries je
            LEFT JOIN branches b ON je.branch_id = b.id
            WHERE 1=1
        ";
        $params = [];

        BranchScope::appendCondition($sql, $params, 'je.branch_id', $branchId);

        if ($startDate) {
            $sql .= " AND je.posting_date >= :start_date";
            $params['start_date'] = $startDate;
        }

        if ($endDate) {
            $sql .= " AND je.posting_date <= :end_date";
            $params['end_date'] = $endDate;
        }

        $sql .= " ORDER BY je.posting_date DESC, je.id DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $entries = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch lines for each entry
        $lineStmt = $this->db->prepare("
            SELECT jl.*, coa.account_code, coa.name AS account_name
            FROM journal_lines jl
            JOIN chart_of_accounts coa ON jl.account_id = coa.id
            WHERE jl.journal_entry_id = ?
        ");

        foreach ($entries as &$entry) {
            $lineStmt->execute([$entry['id']]);
            $entry['lines'] = $lineStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return $entries;
    }

    /**
     * Find single journal entry
     */
    public function findJournalEntry(string $id): ?array
    {
        $sql = "
            SELECT je.*, b.name AS branch_name
            FROM journal_entries je
            LEFT JOIN branches b ON je.branch_id = b.id
            WHERE (je.id = :id OR je.voucher_number = :voucher_number)
        ";
        $params = ['id' => $id, 'voucher_number' => $id];
        BranchScope::appendCondition($sql, $params, 'je.branch_id');
        $stmt = $this->db->prepare($sql . ' LIMIT 1');
        $stmt->execute($params);
        $entry = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$entry) {
            return null;
        }

        $lineStmt = $this->db->prepare("
            SELECT jl.*, coa.account_code, coa.name AS account_name
            FROM journal_lines jl
            JOIN chart_of_accounts coa ON jl.account_id = coa.id
            WHERE jl.journal_entry_id = ?
        ");
        $lineStmt->execute([$entry['id']]);
        $entry['lines'] = $lineStmt->fetchAll(PDO::FETCH_ASSOC);

        return $entry;
    }

    /**
     * Create balanced double-entry Journal Voucher
     */
    public function createJournalEntry(array $data): array
    {
          
        $lines = $data['lines'] ?? [];
        if (count($lines) < 2) {
            throw new \InvalidArgumentException('Journal entry must contain at least two lines.');
        }

        $totalDebit  = 0.0;
        $totalCredit = 0.0;

        foreach ($lines as $line) {
            $totalDebit  += (float)($line['debit'] ?? 0);
            $totalCredit += (float)($line['credit'] ?? 0);
        }

        if (abs($totalDebit - $totalCredit) > 0.01) {
            throw new \InvalidArgumentException(sprintf(
                'Out of balance: Total debits (%.2f) must equal total credits (%.2f).',
                $totalDebit,
                $totalCredit
            ));
        }

        $this->db->beginTransaction();

        try {
            $id = $data['id'] ?? ('je_' . bin2hex(random_bytes(6)));
            $vType = strtoupper($data['voucher_type'] ?? 'JV');
            if ($vType === 'OR' || $vType === 'CRJ') {
                $prefix = 'OR';
                $defaultRef = 'CASH_RECEIPT';
            } elseif ($vType === 'CD' || $vType === 'CDJ') {
                $prefix = 'CD';
                $defaultRef = 'CASH_DISBURSEMENT';
            } else {
                $prefix = 'JV';
                $defaultRef = 'Manual JV';
            }
            $voucherNo = $data['voucher_number'] ?? ($prefix . '-' . date('Ymd') . '-' . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT));

            $postingDate = $data['posting_date'] ?? date('Y-m-d');
            $period_id = $this->getAccountingPeriodId($data['posting_date']);
           
          

            $branchId = $data['branch_id'] ?? 'br_main';
            $created_by = $data['created_by'] ?? ($data['performed_by'] ?? 'System User');

            $sql = "
                INSERT INTO journal_entries (
                    id, voucher_number, branch_id, posting_date, reference_type,
                    description, total_debit, total_credit, period_id, status, created_by
                ) VALUES (
                    :id, :voucher_number, :branch_id, :posting_date, :reference_type,
                    :description, :total_debit, :total_credit, :period_id, 'Posted', :created_by
                )
            ";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                'id'             => $id,
                'voucher_number' => $voucherNo,
                'branch_id'      => $branchId,
                'posting_date'   => $postingDate,
                'reference_type' => $data['reference_type'] ?? $defaultRef,
                'description'    => $data['description'] ?? ($prefix . ' Entry'),
                'total_debit'    => $totalDebit,
                'total_credit'   => $totalCredit,
                'period_id'      => $period_id,
                'created_by'     => $created_by
            ]);

            $lineSql = "
                INSERT INTO journal_lines (
                    id, journal_entry_id, account_id, debit, credit, subsidiary_type, subsidiary_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            ";
            $lineStmt = $this->db->prepare($lineSql);

            foreach ($lines as $line) {
                $lineStmt->execute([
                    'jl_' . bin2hex(random_bytes(6)),
                    $id,
                    $line['account_id'],
                    (float)($line['debit'] ?? 0),
                    (float)($line['credit'] ?? 0),
                    $line['subsidiary_type'] ?? null,
                    $line['subsidiary_id'] ?? null
                ]);
            }
            // Check if line credits Paid-up Share Capital (CBU)
            $credit = (float)($line['credit'] ?? 0);
            $accId = (string)($line['account_id'] ?? '');
            $targetMemberId = $line['subsidiary_id'] ?? ($data['member_id'] ?? null);

            if ($credit > 0 && $targetMemberId) {
                $isShareCapital = in_array($accId, ['acc_3110', '3110', 'acc_3120', '3120', 'acc_3010', '3010', 'acc_3100', '3100'], true);
                if (!$isShareCapital) {
                    $coaStmt = $this->db->prepare("SELECT account_code, name, report_group FROM chart_of_accounts WHERE id = ? OR account_code = ? LIMIT 1");
                    $coaStmt->execute([$accId, $accId]);
                    $accRow = $coaStmt->fetch(PDO::FETCH_ASSOC);
                    if ($accRow) {
                        $code = (string)($accRow['account_code'] ?? '');
                        $name = strtolower((string)($accRow['name'] ?? ''));
                        $group = strtolower((string)($accRow['report_group'] ?? ''));
                        if (str_starts_with($code, '311') || str_starts_with($code, '312') || str_contains($name, 'paid-up') || str_contains($name, 'paid up') || str_contains($name, 'cbu') || str_contains($group, 'paid-up')) {
                            $isShareCapital = true;
                        }
                    }
                }

                if ($isShareCapital) {
                    // Find or create CBU account
                    $cbuStmt = $this->db->prepare("SELECT * FROM share_capital_accounts WHERE member_id = ? LIMIT 1");
                    $cbuStmt->execute([$targetMemberId]);
                    $cbuAcc = $cbuStmt->fetch(PDO::FETCH_ASSOC);

                    $parVal = (float)($cbuAcc['par_value'] ?? 100);
                    if ($parVal <= 0) $parVal = 100;
                    $addedShares = (int)floor($credit / $parVal);
                    if ($addedShares <= 0) $addedShares = 1;

                    if (!$cbuAcc) {
                        $newAccId = 'cbu_' . bin2hex(random_bytes(6));
                        $newAccNo = 'CBU-' . date('Y') . '-' . str_pad((string)mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
                        $initSub = max(100, $addedShares);
                        $insCbu = $this->db->prepare("
                                INSERT INTO share_capital_accounts (
                                    id, account_number, member_id, branch_id, par_value,
                                    subscribed_shares, subscribed_amount, paid_up_shares, paid_up_amount, status, created_at
                                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active', NOW())
                            ");
                        $insCbu->execute([
                            $newAccId,
                            $newAccNo,
                            $targetMemberId,
                            $branchId,
                            $parVal,
                            $initSub,
                            $initSub * $parVal,
                            $addedShares,
                            $credit
                        ]);
                        $cbuAccId = $newAccId;
                        $cbuBalance = $credit;
                    } else {
                        $cbuAccId = $cbuAcc['id'];
                        $newPaidShares = (int)($cbuAcc['paid_up_shares'] ?? 0) + $addedShares;
                        $newPaidAmount = (float)($cbuAcc['paid_up_amount'] ?? 0) + $credit;
                        $newSubShares = max((int)($cbuAcc['subscribed_shares'] ?? 0), $newPaidShares);
                        $newSubAmount = $newSubShares * $parVal;

                        $updCbu = $this->db->prepare("
                                UPDATE share_capital_accounts
                                SET paid_up_shares = ?, paid_up_amount = ?, subscribed_shares = ?, subscribed_amount = ?
                                WHERE id = ?
                            ");
                        $updCbu->execute([$newPaidShares, $newPaidAmount, $newSubShares, $newSubAmount, $cbuAccId]);
                        $cbuBalance = $newPaidAmount;
                    }

                    // Insert transaction
                    $txId = 'sct_' . bin2hex(random_bytes(6));
                    $insTx = $this->db->prepare("
                            INSERT INTO share_capital_transactions (
                                id, share_capital_account_id, share_account_id, member_id,
                                type, transaction_type, shares, amount, balance_after,
                                reference_no, receipt_no, transaction_date, notes, created_at
                            ) VALUES (?, ?, ?, ?, 'PAYMENT', 'PAYMENT', ?, ?, ?, ?, ?, ?, ?, NOW())
                        ");
                    $insTx->execute([
                        $txId,
                        $cbuAccId,
                        $cbuAccId,
                        $targetMemberId,
                        $addedShares,
                        $credit,
                        $cbuBalance,
                        $voucherNo,
                        $voucherNo,
                        $postingDate,
                        "Journal Voucher ({$voucherNo}): Paid-Up Share Capital Contribution"
                    ]);
                }
            }


            $this->audit->recordAuditTrail(
                'journal_entries',
                'None',
                ['id' => $id, 'voucher_number' => $voucherNo, 'branch_id' => $branchId, 'total_debit' => $totalDebit, 'total_credit' => $totalCredit],
                (string)$created_by,
                'Journal entry posted',
                'TRANSACTION'
            );
            $this->db->commit();
            return $this->findJournalEntry($id) ?? [];
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
 * Get the accounting period ID for a given transaction date.
    *
    * @param string $postingDate Date in YYYY-MM-DD format.
    * @return string Existing accounting period ID.
    * @throws \RuntimeException If no accounting period matches the date.
    */
    public function getAccountingPeriodId(string $postingDate): string
    {
        $date = \DateTimeImmutable::createFromFormat('!Y-m-d', $postingDate);

        if (!$date || $date->format('Y-m-d') !== $postingDate) {
            throw new \InvalidArgumentException(
                "Invalid posting date: {$postingDate}. Expected YYYY-MM-DD."
            );
        }

        $stmt = $this->db->prepare("
            SELECT id
            FROM accounting_periods
            WHERE start_date <= :start_check
            AND end_date >= :end_check
            LIMIT 1
        ");

        $stmt->execute([
            'start_check' => $postingDate,
            'end_check'   => $postingDate,
        ]);

        $periodId = $stmt->fetchColumn();

        if ($periodId === false) {
            throw new \RuntimeException(
                "No accounting period found for posting date {$postingDate}."
            );
        }

        return (string) $periodId;
    }

    /**
     * Reverse a Journal Entry
     */
    public function reverseJournalEntry(string $id, string $reason = 'Reversal'): array
    {
        $original = $this->findJournalEntry($id);
        if (!$original) {
            throw new \RuntimeException('Original journal entry not found.');
        }

        if ($original['status'] === 'Reversed') {
            throw new \RuntimeException('Journal entry is already reversed.');
        }

        // Build inverted lines
        $reversedLines = [];
        foreach ($original['lines'] as $line) {
            $reversedLines[] = [
                'account_id'      => $line['account_id'],
                'debit'           => (float)$line['credit'],
                'credit'          => (float)$line['debit'],
                'subsidiary_type' => $line['subsidiary_type'],
                'subsidiary_id'   => $line['subsidiary_id']
            ];
        }

        $revData = [
            'voucher_number' => 'REV-' . $original['voucher_number'],
            'branch_id'      => $original['branch_id'],
            'posting_date'   => date('Y-m-d'),
            'reference_type' => 'Reversal',
            'description'    => "Reversal of {$original['voucher_number']}: $reason",
            'lines'          => $reversedLines
        ];

        $reversalEntry = $this->createJournalEntry($revData);

        // Mark original as Reversed
        $upd = $this->db->prepare("UPDATE journal_entries SET status = 'Reversed' WHERE id = ?");
        $upd->execute([$id]);
        $this->audit->recordAuditTrail(
            'journal_entries',
            ['id' => $id, 'status' => $original['status']],
            ['id' => $id, 'status' => 'Reversed', 'reversal_id' => $reversalEntry['id'] ?? null],
            'System',
            $reason,
            'TRANSACTION'
        );

        return $reversalEntry;
    }

    public function deleteAccount(string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM chart_of_accounts WHERE id = ? OR account_code = ?");
        $stmt->execute([$id, $id]);
        $deleted = $stmt->rowCount() > 0;
        if ($deleted) {
            $this->audit->recordAuditTrail('chart_of_accounts', ['id_or_code' => $id], 'None', 'System', 'Chart of accounts entry deleted', 'DELETE');
        }
        return $deleted;
    }

    public function getAccountingMappings(): array
    {
        try {
            $stmt = $this->db->query("SELECT * FROM accounting_mappings");
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            return array_map(function ($row) {
                return [
                    'id'                => $row['id'] ?? '',
                    'name'              => $row['name'] ?? $row['event_type'] ?? $row['transaction_type'] ?? $row['id'],
                    'transaction_type'  => $row['transaction_type'] ?? $row['event_type'] ?? '',
                    'event_type'        => $row['event_type'] ?? $row['transaction_type'] ?? '',
                    'description'       => $row['description'] ?? '',
                    'debit_account_id'  => $row['debit_account_id'] ?? '',
                    'credit_account_id' => $row['credit_account_id'] ?? '',
                    'is_system'         => (bool)($row['is_system'] ?? true)
                ];
            }, $rows);
        } catch (\Exception $e) {
            return [];
        }
    }

    public function saveAccountingMapping(array $data): array
    {
        $id = $data['id'] ?? ('map_' . bin2hex(random_bytes(6)));
        $name = $data['name'] ?? 'New Mapping';
        $type = strtoupper(str_replace(' ', '_', $data['transaction_type'] ?? $data['event_type'] ?? 'CUSTOM_TX'));
        $desc = $data['description'] ?? "Journal mapping for {$name}";
        $debit = $data['debit_account_id'] ?? $data['debit_account'] ?? 'acc_1110';
        $credit = $data['credit_account_id'] ?? $data['credit_account'] ?? 'acc_2110';

        try {
            $stmt = $this->db->prepare("
                INSERT INTO accounting_mappings (id, name, transaction_type, event_type, description, debit_account_id, credit_account_id, is_system)
                VALUES (:id, :name, :type, :type2, :desc, :debit, :credit, 0)
            ");
            $stmt->execute([
                'id'    => $id,
                'name'  => $name,
                'type'  => $type,
                'type2' => $type,
                'desc'  => $desc,
                'debit' => $debit,
                'credit' => $credit
            ]);
        } catch (\Exception $e) {
            // Fallback for schemas with only event_type
            try {
                $stmt2 = $this->db->prepare("
                    INSERT INTO accounting_mappings (id, event_type, description, debit_account_id, credit_account_id, is_system)
                    VALUES (:id, :type, :desc, :debit, :credit, 0)
                ");
                $stmt2->execute([
                    'id'    => $id,
                    'type'  => $type,
                    'desc'  => $desc,
                    'debit' => $debit,
                    'credit' => $credit
                ]);
            } catch (\Exception $e2) {
                // Return payload in memory
            }
        }

        return [
            'id'                => $id,
            'name'              => $name,
            'transaction_type'  => $type,
            'event_type'        => $type,
            'description'       => $desc,
            'debit_account_id'  => $debit,
            'credit_account_id' => $credit,
            'is_system'         => false
        ];
    }

    public function updateAccountingMapping(string $id, array $data): array
    {
        try {
            $debit = $data['debit_account_id'] ?? $data['debit_account'] ?? null;
            $credit = $data['credit_account_id'] ?? $data['credit_account'] ?? null;
            $name = $data['name'] ?? null;
            $desc = $data['description'] ?? null;

            $stmt = $this->db->prepare("
                UPDATE accounting_mappings
                SET debit_account_id = COALESCE(:debit, debit_account_id),
                    credit_account_id = COALESCE(:credit, credit_account_id)
                WHERE id = :id OR transaction_type = :id2 OR event_type = :id3
            ");
            $stmt->execute([
                'id'     => $id,
                'id2'    => $id,
                'id3'    => $id,
                'debit'  => $debit,
                'credit' => $credit
            ]);

            if ($name || $desc) {
                try {
                    $upd = $this->db->prepare("UPDATE accounting_mappings SET name = COALESCE(:name, name), description = COALESCE(:desc, description) WHERE id = :id");
                    $upd->execute(['name' => $name, 'desc' => $desc, 'id' => $id]);
                } catch (\Exception $e) {
                }
            }

            return array_merge(['id' => $id], $data);
        } catch (\Exception $e) {
            return array_merge(['id' => $id], $data);
        }
    }

    public function deleteAccountingMapping(string $id): bool
    {
        try {
            $stmt = $this->db->prepare("DELETE FROM accounting_mappings WHERE id = :id");
            return $stmt->execute(['id' => $id]);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function resetAccountingMappings(): array
    {
        $defaults = [
            ['id' => 'map_loan_rel', 'name' => 'Loan Disbursement / Release', 'transaction_type' => 'LOAN_RELEASE', 'event_type' => 'LOAN_RELEASE', 'description' => 'Disbursement of approved loan principal to borrower', 'debit_account_id' => 'acc_1210', 'credit_account_id' => 'acc_1110', 'is_system' => true],
            ['id' => 'map_loan_pmt', 'name' => 'Loan Repayment (Principal)', 'transaction_type' => 'LOAN_PAYMENT', 'event_type' => 'LOAN_PAYMENT', 'description' => 'Collection of loan installment principal', 'debit_account_id' => 'acc_1110', 'credit_account_id' => 'acc_1210', 'is_system' => true],
            ['id' => 'map_int_inc', 'name' => 'Loan Interest Collection', 'transaction_type' => 'INTEREST_INCOME', 'event_type' => 'INTEREST_INCOME', 'description' => 'Interest portion of loan repayment', 'debit_account_id' => 'acc_1110', 'credit_account_id' => 'acc_4110', 'is_system' => true],
            ['id' => 'map_pen_inc', 'name' => 'Loan Penalty Collection', 'transaction_type' => 'PENALTY_INCOME', 'event_type' => 'PENALTY_INCOME', 'description' => 'Late payment fee collected', 'debit_account_id' => 'acc_1110', 'credit_account_id' => 'acc_4130', 'is_system' => true],
            ['id' => 'map_fee_inc', 'name' => 'Service & Processing Fee Collection', 'transaction_type' => 'FEE_INCOME', 'event_type' => 'FEE_INCOME', 'description' => 'Deducted or collected processing fees', 'debit_account_id' => 'acc_1110', 'credit_account_id' => 'acc_4120', 'is_system' => true],
            ['id' => 'map_sav_dep', 'name' => 'Member Savings Deposit', 'transaction_type' => 'SAVINGS_DEPOSIT', 'event_type' => 'SAVINGS_DEPOSIT', 'description' => 'Member deposits cash into savings account', 'debit_account_id' => 'acc_1110', 'credit_account_id' => 'acc_2110', 'is_system' => true],
            ['id' => 'map_sav_with', 'name' => 'Member Savings Withdrawal', 'transaction_type' => 'SAVINGS_WITHDRAWAL', 'event_type' => 'SAVINGS_WITHDRAWAL', 'description' => 'Member withdraws cash from savings account', 'debit_account_id' => 'acc_2110', 'credit_account_id' => 'acc_1110', 'is_system' => true],
            ['id' => 'map_sc_sub', 'name' => 'Share Capital Contribution (CBU)', 'transaction_type' => 'SHARE_CAPITAL_PAYMENT', 'event_type' => 'SHARE_CAPITAL_PAYMENT', 'description' => 'Member adds capital build-up', 'debit_account_id' => 'acc_1110', 'credit_account_id' => 'acc_3110', 'is_system' => true],
            ['id' => 'map_expense', 'name' => 'Operating Expense Payment', 'transaction_type' => 'EXPENSE_PAYMENT', 'event_type' => 'EXPENSE_PAYMENT', 'description' => 'Disbursement for operational expenditure', 'debit_account_id' => 'acc_5220', 'credit_account_id' => 'acc_1110', 'is_system' => true]
        ];

        try {
            $this->db->exec("DELETE FROM accounting_mappings");
            foreach ($defaults as $m) {
                $this->saveAccountingMapping($m);
            }
        } catch (\Exception $e) {
        }

        return $defaults;
    }
    
/**
 * Create an accounting period.
 */
public function createAccountingPeriod(array $data): array
{
    $name = trim($data['name'] ?? '');
    $startDate = $data['start_date'] ?? '';
    $endDate = $data['end_date'] ?? '';
    $branchId = $data['branch_id'];

    if ($name === '' || $startDate === '' || $endDate === '') {
        throw new \InvalidArgumentException(
            'Name, start date, and end date are required.'
        );
    }

    // Validate actual YYYY-MM-DD dates.
    $start = \DateTimeImmutable::createFromFormat('!Y-m-d', $startDate);
    $end = \DateTimeImmutable::createFromFormat('!Y-m-d', $endDate);

    if (
        !$start ||
        $start->format('Y-m-d') !== $startDate ||
        !$end ||
        $end->format('Y-m-d') !== $endDate
    ) {
        throw new \InvalidArgumentException(
            'Invalid date format. Use YYYY-MM-DD.'
        );
    }

    if ($startDate > $endDate) {
        throw new \InvalidArgumentException(
            'Start date cannot be after end date.'
        );
    }

    $fiscalYear = (int) ($data['fiscal_year'] ?? $start->format('Y'));

    $this->db->beginTransaction();

    try {
        // Prevent overlapping periods within the same fiscal year.
        $stmt = $this->db->prepare("
            SELECT id
            FROM accounting_periods
            WHERE fiscal_year = ?
              AND start_date <= ?
              AND end_date >= ?
            FOR UPDATE
        ");

        $stmt->execute([
            $fiscalYear,
            $endDate,
            $startDate
        ]);

        if ($stmt->fetch(\PDO::FETCH_ASSOC)) {
            throw new \InvalidArgumentException(
                'The selected dates overlap an existing accounting period.'
            );
        }

        // Determine the next available period number.
        if (isset($data['period_number'])) {
            $periodNumber = (int) $data['period_number'];

            if ($periodNumber < 1) {
                throw new \InvalidArgumentException(
                    'Period number must be greater than zero.'
                );
            }
        } else {
            $stmt = $this->db->prepare("
                SELECT COALESCE(MAX(period_number), 0) + 1
                FROM accounting_periods
                WHERE fiscal_year = ?
            ");

            $stmt->execute([$fiscalYear]);
            $periodNumber = (int) $stmt->fetchColumn();
        }

        $id = $data['id'] ?? (
            'period_' . bin2hex(random_bytes(6))
        );

        $stmt = $this->db->prepare("
            INSERT INTO accounting_periods (
                id,
                name,
                fiscal_year,
                period_number,
                start_date,
                end_date,
                branch_id,
                status
            ) VALUES (
                :id,
                :name,
                :fiscal_year,
                :period_number,
                :start_date,
                :end_date,
                :branch_id,
                'Open'
            )
        ");

        $stmt->execute([
            ':id' => $id,
            ':name' => $name,
            ':fiscal_year' => $fiscalYear,
            ':period_number' => $periodNumber,
            ':start_date' => $startDate,
            ':end_date' => $endDate,
            ':branch_id' => $branchId
        ]);

        $stmt = $this->db->prepare("
            SELECT *
            FROM accounting_periods
            WHERE id = ?
        ");

        $stmt->execute([$id]);
        $period = $stmt->fetch(\PDO::FETCH_ASSOC);

        $this->db->commit();

        return $period;
    } catch (\Throwable $e) {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }

        throw $e;
    }
}

/**
 * Delete an accounting period.
 *
 * Closed/locked periods are protected.
 */
public function deleteAccountingPeriod(string $id): bool
{
    $this->db->beginTransaction();

    try {
        $stmt = $this->db->prepare("
            SELECT id, status
            FROM accounting_periods
            WHERE id = ?
            FOR UPDATE
        ");

        $stmt->execute([$id]);
        $period = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$period) {
            throw new \RuntimeException(
                'Accounting period not found.'
            );
        }

        if ($period['status'] !== 'Open') {
            throw new \RuntimeException(
                'Only open accounting periods can be deleted.'
            );
        }

        // Do not delete a period containing posted journal entries.
        // Adjust table/column names to match your database schema.
        $stmt = $this->db->prepare("
            SELECT COUNT(*)
            FROM journal_entries
            WHERE accounting_period_id = ?
              AND status = 'Posted'
        ");

        $stmt->execute([$id]);

        if ((int) $stmt->fetchColumn() > 0) {
            throw new \RuntimeException(
                'Cannot delete a period containing posted journal entries.'
            );
        }

        $stmt = $this->db->prepare("
            DELETE FROM accounting_periods
            WHERE id = ?
        ");

        $stmt->execute([$id]);

        $this->db->commit();

        return true;
    } catch (\Throwable $e) {
        if ($this->db->inTransaction()) {
            $this->db->rollBack();
        }

        throw $e;
    }
}

    public function closePeriod(string $periodId, string $closedBy): bool
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE accounting_periods
                SET status = 'Closed', closed_by = :closed_by, closed_at = NOW()
                WHERE id = :id
            ");
            return $stmt->execute(['id' => $periodId, 'closed_by' => $closedBy]);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function reopenPeriod(string $periodId): bool
    {
        try {
            $stmt = $this->db->prepare("
                UPDATE accounting_periods
                SET status = 'Open', closed_by = NULL, closed_at = NULL
                WHERE id = :id
            ");
            return $stmt->execute(['id' => $periodId]);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Import Chart of Accounts from CSV or structured array
     */
    public function importChartOfAccounts(array $data): array
    {
        $accounts = $data['accounts'] ?? [];
        $mode = $data['mode'] ?? 'upsert';

        if (empty($accounts) && !empty($data['csv_text'])) {
            $lines = array_map('str_getcsv', explode("\n", trim($data['csv_text'])));
            if (count($lines) >= 2) {
                $rawHeaders = array_shift($lines);
                $headers = array_map(function($h) {
                    return strtolower(preg_replace('/[\s_-]+/', '_', trim((string)$h)));
                }, $rawHeaders);

                foreach ($lines as $row) {
                    if (empty(array_filter($row))) continue;
                    $item = [];
                    foreach ($headers as $idx => $header) {
                        $item[$header] = $row[$idx] ?? '';
                    }
                    $accounts[] = $item;
                }
            }
        }

        if (empty($accounts)) {
            throw new \InvalidArgumentException('No valid chart of accounts records provided to import.');
        }

        $existingList = $this->getChartOfAccounts();
        $codeMap = [];
        $idMap = [];
        foreach ($existingList as $ex) {
            $codeMap[trim((string)$ex['account_code'])] = $ex;
            $idMap[$ex['id']] = $ex;
        }

        $inserted = 0;
        $updated = 0;
        $skipped = 0;
        $errors = [];
        $parentFixups = [];

        $this->db->beginTransaction();

        try {
            $normalizeCat = function($val) {
                $s = strtolower(trim((string)$val));
                if (str_starts_with($s, 'asset')) return 'Asset';
                if (str_starts_with($s, 'liab')) return 'Liability';
                if (str_starts_with($s, 'equit')) return 'Equity';
                if (str_starts_with($s, 'rev') || str_starts_with($s, 'incom')) return 'Revenue';
                if (str_starts_with($s, 'exp')) return 'Expense';
                return 'Asset';
            };

            $normalizeBal = function($val, $cat) {
                $s = strtolower(trim((string)$val));
                if (str_starts_with($s, 'd') || $s === 'dr') return 'Debit';
                if (str_starts_with($s, 'c') || $s === 'cr') return 'Credit';
                return ($cat === 'Asset' || $cat === 'Expense') ? 'Debit' : 'Credit';
            };

            $defaultGroup = function($cat) {
                return match($cat) {
                    'Asset' => 'Current Assets',
                    'Liability' => 'Deposit Liabilities',
                    'Equity' => 'Share Capital',
                    'Revenue' => 'Operating Revenue',
                    'Expense' => 'Administrative Expenses',
                    default => 'Operating'
                };
            };

            foreach ($accounts as $idx => $row) {
                $rowNum = $idx + 2;
                $code = trim((string)($row['account_code'] ?? $row['code'] ?? $row['account_no'] ?? $row['gl_code'] ?? ''));
                $name = trim((string)($row['name'] ?? $row['account_name'] ?? $row['title'] ?? ''));

                if ($code === '' || $name === '') {
                    $errors[] = "Row {$rowNum}: Account code and name are required.";
                    continue;
                }

                $category = $normalizeCat($row['category'] ?? $row['type'] ?? $row['account_category'] ?? '');
                $normalBalance = $normalizeBal($row['normal_balance'] ?? $row['balance_type'] ?? '', $category);
                $reportGroup = trim((string)($row['report_group'] ?? $row['group'] ?? ''));
                if ($reportGroup === '') {
                    $reportGroup = $defaultGroup($category);
                }

                $description = isset($row['description']) ? trim((string)$row['description']) : null;
                $isActive = 1;
                if (isset($row['is_active'])) {
                    $val = strtolower(trim((string)$row['is_active']));
                    if (in_array($val, ['0', 'false', 'inactive', 'no', 'disabled'], true)) {
                        $isActive = 0;
                    }
                }

                $parentRef = trim((string)($row['parent_account_code'] ?? $row['parent_code'] ?? $row['parent_account_id'] ?? ''));

                if (isset($codeMap[$code])) {
                    if ($mode === 'insert') {
                        $skipped++;
                        continue;
                    }

                    $existingAcc = $codeMap[$code];
                    $upStmt = $this->db->prepare("
                        UPDATE chart_of_accounts
                        SET name = :name,
                            category = :category,
                            normal_balance = :normal_balance,
                            report_group = :report_group,
                            description = :description,
                            is_active = :is_active
                        WHERE id = :id
                    ");
                    $upStmt->execute([
                        ':id'             => $existingAcc['id'],
                        ':name'           => $name,
                        ':category'       => $category,
                        ':normal_balance' => $normalBalance,
                        ':report_group'   => $reportGroup,
                        ':description'    => $description,
                        ':is_active'      => $isActive
                    ]);
                    $updated++;

                    if ($parentRef !== '') {
                        $parentFixups[] = ['id' => $existingAcc['id'], 'parentRef' => $parentRef];
                    }
                } else {
                    $newId = 'acc_' . preg_replace('/[^a-zA-Z0-9]/', '_', $code) . '_' . bin2hex(random_bytes(3));
                    $inStmt = $this->db->prepare("
                        INSERT INTO chart_of_accounts (
                            id, account_code, name, category, normal_balance,
                            is_active, parent_account_id, report_group, description, created_at
                        ) VALUES (
                            :id, :account_code, :name, :category, :normal_balance,
                            :is_active, NULL, :report_group, :description, NOW()
                        )
                    ");
                    $inStmt->execute([
                        ':id'             => $newId,
                        ':account_code'   => $code,
                        ':name'           => $name,
                        ':category'       => $category,
                        ':normal_balance' => $normalBalance,
                        ':is_active'      => $isActive,
                        ':report_group'   => $reportGroup,
                        ':description'    => $description
                    ]);
                    $inserted++;

                    $newRecord = [
                        'id' => $newId,
                        'account_code' => $code,
                        'name' => $name
                    ];
                    $codeMap[$code] = $newRecord;
                    $idMap[$newId] = $newRecord;

                    if ($parentRef !== '') {
                        $parentFixups[] = ['id' => $newId, 'parentRef' => $parentRef];
                    }
                }
            }

            // Second pass: resolve parent_account_id
            foreach ($parentFixups as $fix) {
                $pId = null;
                if (isset($codeMap[$fix['parentRef']])) {
                    $pId = $codeMap[$fix['parentRef']]['id'];
                } elseif (isset($idMap[$fix['parentRef']])) {
                    $pId = $idMap[$fix['parentRef']]['id'];
                }

                if ($pId !== null && $pId !== $fix['id']) {
                    $pStmt = $this->db->prepare("UPDATE chart_of_accounts SET parent_account_id = ? WHERE id = ?");
                    $pStmt->execute([$pId, $fix['id']]);
                }
            }

            $this->db->commit();

            return [
                'success'  => true,
                'count'    => $inserted + $updated,
                'inserted' => $inserted,
                'updated'  => $updated,
                'skipped'  => $skipped,
                'errors'   => $errors,
                'message'  => "Successfully imported " . ($inserted + $updated) . " accounts ({$inserted} created, {$updated} updated)."
            ];
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw new \RuntimeException('Failed to import chart of accounts: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Export Chart of Accounts to CSV string
     */
    public function exportChartOfAccounts(): string
    {
        $accounts = $this->getChartOfAccounts();
        $idMap = [];
        foreach ($accounts as $a) {
            $idMap[$a['id']] = $a;
        }

        $output = fopen('php://temp', 'r+');
        fputcsv($output, [
            'account_code',
            'name',
            'category',
            'report_group',
            'normal_balance',
            'parent_account_code',
            'description',
            'is_active'
        ]);

        foreach ($accounts as $a) {
            $parentCode = '';
            if (!empty($a['parent_account_id']) && isset($idMap[$a['parent_account_id']])) {
                $parentCode = $idMap[$a['parent_account_id']]['account_code'] ?? '';
            }

            fputcsv($output, [
                $a['account_code'] ?? '',
                $a['name'] ?? '',
                $a['category'] ?? '',
                $a['report_group'] ?? '',
                $a['normal_balance'] ?? '',
                $parentCode,
                $a['description'] ?? '',
                !empty($a['is_active']) ? '1' : '0'
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv !== false ? $csv : '';
    }
}
