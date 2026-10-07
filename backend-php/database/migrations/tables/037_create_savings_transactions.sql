-- Creates the `savings_transactions` table. Apply files in numeric order.
CREATE TABLE `savings_transactions` (
  `id` varchar(50) NOT NULL,
  `transaction_no` varchar(50) NOT NULL,
  `savings_account_id` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `type` enum('DEPOSIT','WITHDRAWAL','INTEREST_POSTING','FEE_DEDUCTION') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `balance_after` decimal(15,2) NOT NULL,
  `cash_account_id` varchar(50) DEFAULT NULL,
  `transaction_date` date NOT NULL,
  `notes` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `transaction_no` (`transaction_no`),
  KEY `savings_account_id` (`savings_account_id`),
  KEY `member_id` (`member_id`),
  KEY `cash_account_id` (`cash_account_id`),
  CONSTRAINT `savings_transactions_ibfk_1` FOREIGN KEY (`savings_account_id`) REFERENCES `savings_accounts` (`id`),
  CONSTRAINT `savings_transactions_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  CONSTRAINT `savings_transactions_ibfk_3` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
