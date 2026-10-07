-- Creates the `general_ledger` table. Apply files in numeric order.
CREATE TABLE `general_ledger` (
  `id` varchar(50) NOT NULL,
  `journal_entry_id` varchar(50) NOT NULL,
  `account_id` varchar(50) NOT NULL,
  `posting_date` date NOT NULL,
  `period_id` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL,
  `debit` decimal(15,2) DEFAULT '0.00',
  `credit` decimal(15,2) DEFAULT '0.00',
  `balance_running` decimal(15,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `journal_entry_id` (`journal_entry_id`),
  KEY `period_id` (`period_id`),
  KEY `branch_id` (`branch_id`),
  KEY `idx_gl_acc_date` (`account_id`,`posting_date`),
  CONSTRAINT `general_ledger_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `general_ledger_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `general_ledger_ibfk_3` FOREIGN KEY (`period_id`) REFERENCES `accounting_periods` (`id`),
  CONSTRAINT `general_ledger_ibfk_4` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
