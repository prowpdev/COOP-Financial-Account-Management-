-- Creates the `savings_accounts` table. Apply files in numeric order.
CREATE TABLE `savings_accounts` (
  `id` varchar(50) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `savings_product_id` varchar(50) NOT NULL,
  `branch_id` varchar(50) NOT NULL,
  `balance` decimal(15,2) DEFAULT '0.00',
  `opened_date` date NOT NULL,
  `status` enum('Active','Dormant','Closed') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_number` (`account_number`),
  KEY `savings_product_id` (`savings_product_id`),
  KEY `branch_id` (`branch_id`),
  KEY `idx_sa_member` (`member_id`),
  CONSTRAINT `savings_accounts_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  CONSTRAINT `savings_accounts_ibfk_2` FOREIGN KEY (`savings_product_id`) REFERENCES `savings_products` (`id`),
  CONSTRAINT `savings_accounts_ibfk_3` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
