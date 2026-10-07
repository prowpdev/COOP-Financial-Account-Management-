-- Creates the `share_capital_transactions` table. Apply files in numeric order.
CREATE TABLE `share_capital_transactions` (
  `id` varchar(50) NOT NULL,
  `receipt_no` varchar(50) NOT NULL,
  `share_account_id` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `type` enum('SUBSCRIPTION','PAYMENT','WITHDRAWAL','TRANSFER','DIVIDEND_PATRONAGE') NOT NULL,
  `shares` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `transaction_date` date NOT NULL,
  `cash_account_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_no` (`receipt_no`),
  KEY `share_account_id` (`share_account_id`),
  KEY `member_id` (`member_id`),
  KEY `cash_account_id` (`cash_account_id`),
  CONSTRAINT `share_capital_transactions_ibfk_1` FOREIGN KEY (`share_account_id`) REFERENCES `share_capital_accounts` (`id`),
  CONSTRAINT `share_capital_transactions_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  CONSTRAINT `share_capital_transactions_ibfk_3` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
