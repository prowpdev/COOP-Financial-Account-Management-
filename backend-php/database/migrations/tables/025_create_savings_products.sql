-- Creates the `savings_products` table. Apply files in numeric order.
CREATE TABLE `savings_products` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `min_balance_to_earn_interest` decimal(15,2) DEFAULT '1000.00',
  `annual_interest_rate` decimal(5,2) DEFAULT '2.00',
  `interest_calculation_method` varchar(50) DEFAULT 'Average Daily Balance',
  `min_opening_deposit` decimal(15,2) DEFAULT '500.00',
  `maintaining_balance` decimal(15,2) DEFAULT '500.00',
  `gl_liability_account_id` varchar(50) NOT NULL,
  `gl_interest_expense_account_id` varchar(50) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `gl_liability_account_id` (`gl_liability_account_id`),
  KEY `gl_interest_expense_account_id` (`gl_interest_expense_account_id`),
  CONSTRAINT `savings_products_ibfk_1` FOREIGN KEY (`gl_liability_account_id`) REFERENCES `chart_of_accounts` (`id`),
  CONSTRAINT `savings_products_ibfk_2` FOREIGN KEY (`gl_interest_expense_account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
