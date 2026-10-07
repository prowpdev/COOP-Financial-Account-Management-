-- Creates the `fees` table. Apply files in numeric order.
CREATE TABLE `fees` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `calculation_type` enum('Fixed','Percentage','Percentage of Principal') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `applies_to` varchar(50) NOT NULL,
  `percentage` int NOT NULL,
  `gl_account_id` varchar(50) NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `gl_account_id` (`gl_account_id`),
  CONSTRAINT `fees_ibfk_1` FOREIGN KEY (`gl_account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
