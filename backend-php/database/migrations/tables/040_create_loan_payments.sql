-- Creates the `loan_payments` table. Apply files in numeric order.
CREATE TABLE `loan_payments` (
  `id` varchar(50) NOT NULL,
  `receipt_no` varchar(50) NOT NULL,
  `loan_id` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `payment_date` date NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `cash_account_id` varchar(50) NOT NULL,
  `received_by` varchar(100) NOT NULL,
  `journal_entry_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `receipt_no` (`receipt_no`),
  KEY `loan_id` (`loan_id`),
  KEY `member_id` (`member_id`),
  KEY `cash_account_id` (`cash_account_id`),
  CONSTRAINT `loan_payments_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`),
  CONSTRAINT `loan_payments_ibfk_2` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  CONSTRAINT `loan_payments_ibfk_3` FOREIGN KEY (`cash_account_id`) REFERENCES `cash_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
