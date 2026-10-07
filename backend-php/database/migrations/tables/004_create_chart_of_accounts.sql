-- Creates the `chart_of_accounts` table. Apply files in numeric order.
CREATE TABLE `chart_of_accounts` (
  `id` varchar(50) NOT NULL,
  `account_code` varchar(20) NOT NULL,
  `name` varchar(150) NOT NULL,
  `category` enum('Asset','Liability','Equity','Revenue','Expense') NOT NULL,
  `normal_balance` enum('Debit','Credit') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `parent_account_id` varchar(50) DEFAULT NULL,
  `report_group` varchar(100) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_code` (`account_code`),
  KEY `idx_acc_code` (`account_code`),
  KEY `idx_acc_cat` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
