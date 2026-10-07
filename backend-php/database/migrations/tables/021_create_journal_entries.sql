-- Creates the `journal_entries` table. Apply files in numeric order.
CREATE TABLE `journal_entries` (
  `id` varchar(50) NOT NULL,
  `voucher_number` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL,
  `posting_date` date NOT NULL,
  `reference_type` varchar(50) NOT NULL,
  `reference_id` varchar(50) DEFAULT NULL,
  `description` text NOT NULL,
  `total_debit` decimal(15,2) NOT NULL,
  `total_credit` decimal(15,2) NOT NULL,
  `period_id` varchar(50) NOT NULL,
  `status` enum('Draft','Pending Approval','Posted','Reversed') DEFAULT 'Posted',
  `created_by` varchar(100) NOT NULL,
  `posted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `voucher_number` (`voucher_number`),
  KEY `branch_id` (`branch_id`),
  KEY `idx_jv_date` (`posting_date`),
  KEY `idx_jv_period` (`period_id`),
  CONSTRAINT `journal_entries_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `journal_entries_ibfk_2` FOREIGN KEY (`period_id`) REFERENCES `accounting_periods` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
