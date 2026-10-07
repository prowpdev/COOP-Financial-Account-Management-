-- Creates the `cash_transactions` table. Apply files in numeric order.
CREATE TABLE `cash_transactions` (
  `id` varchar(50) NOT NULL,
  `transaction_no` varchar(100) NOT NULL,
  `cash_account_id` varchar(50) NOT NULL,
  `type` enum('INFLOW','OUTFLOW','TRANSFER') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_before` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `running_balance` decimal(15,2) DEFAULT '0.00',
  `reference_number` varchar(100) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL,
  `reference_id` varchar(50) DEFAULT NULL,
  `description` text,
  `notes` text,
  `transaction_date` date DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_no` (`transaction_no`),
  KEY `cash_account_id` (`cash_account_id`),
  CONSTRAINT `cash_transactions_ibfk_1` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
