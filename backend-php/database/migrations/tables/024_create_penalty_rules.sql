-- Creates the `penalty_rules` table. Apply files in numeric order.
CREATE TABLE `penalty_rules` (
  `id` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `grace_period_days` int DEFAULT '0',
  `penalty_rate_percentage` decimal(5,2) NOT NULL,
  `calculation_base` enum('Overdue Principal','Total Overdue Installment') DEFAULT 'Overdue Principal',
  `compounding_frequency` enum('None','Monthly','Daily') DEFAULT 'None',
  `gl_income_account_id` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `gl_income_account_id` (`gl_income_account_id`),
  CONSTRAINT `penalty_rules_ibfk_1` FOREIGN KEY (`gl_income_account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
