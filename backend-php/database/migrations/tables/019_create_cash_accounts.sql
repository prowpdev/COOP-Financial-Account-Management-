-- Creates the `cash_accounts` table. Apply files in numeric order.
CREATE TABLE `cash_accounts` (
  `id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `account_number` varchar(100) NOT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `branch_id` varchar(50) NOT NULL,
  `gl_account_id` varchar(50) NOT NULL,
  `opening_balance` decimal(15,2) DEFAULT '0.00',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'PHP',
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  KEY `gl_account_id` (`gl_account_id`),
  CONSTRAINT `cash_accounts_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`),
  CONSTRAINT `cash_accounts_ibfk_2` FOREIGN KEY (`gl_account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
