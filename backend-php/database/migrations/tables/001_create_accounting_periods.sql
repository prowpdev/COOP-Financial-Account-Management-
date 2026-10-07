-- Creates the `accounting_periods` table. Apply files in numeric order.
CREATE TABLE `accounting_periods` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `fiscal_year` int NOT NULL,
  `period_number` int NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` enum('Open','Closed','Locked') DEFAULT 'Open',
  `closed_at` timestamp NULL DEFAULT NULL,
  `closed_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_year_period` (`fiscal_year`,`period_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
