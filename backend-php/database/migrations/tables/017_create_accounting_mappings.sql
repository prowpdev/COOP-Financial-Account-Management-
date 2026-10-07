-- Creates the `accounting_mappings` table. Apply files in numeric order.
CREATE TABLE `accounting_mappings` (
  `id` varchar(50) NOT NULL,
  `event_type` varchar(100) NOT NULL,
  `description` varchar(255) NOT NULL,
  `debit_account_id` varchar(50) NOT NULL,
  `credit_account_id` varchar(50) NOT NULL,
  `is_system` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_type` (`event_type`),
  KEY `debit_account_id` (`debit_account_id`),
  KEY `credit_account_id` (`credit_account_id`),
  CONSTRAINT `accounting_mappings_ibfk_1` FOREIGN KEY (`debit_account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `accounting_mappings_ibfk_2` FOREIGN KEY (`credit_account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
