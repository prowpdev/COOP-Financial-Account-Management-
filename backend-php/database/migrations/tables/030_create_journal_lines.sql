-- Creates the `journal_lines` table. Apply files in numeric order.
CREATE TABLE `journal_lines` (
  `id` varchar(50) NOT NULL,
  `journal_entry_id` varchar(50) NOT NULL,
  `account_id` varchar(50) NOT NULL,
  `debit` decimal(15,2) DEFAULT '0.00',
  `credit` decimal(15,2) DEFAULT '0.00',
  `subsidiary_type` varchar(50) DEFAULT NULL,
  `subsidiary_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `journal_entry_id` (`journal_entry_id`),
  KEY `idx_jl_account` (`account_id`),
  CONSTRAINT `journal_lines_ibfk_1` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE,
  CONSTRAINT `journal_lines_ibfk_2` FOREIGN KEY (`account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
