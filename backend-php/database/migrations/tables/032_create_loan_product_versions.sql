-- Creates the `loan_product_versions` table. Apply files in numeric order.
CREATE TABLE `loan_product_versions` (
  `id` varchar(50) NOT NULL,
  `loan_product_id` varchar(50) NOT NULL,
  `version_number` int NOT NULL,
  `annual_interest_rate` decimal(5,2) NOT NULL,
  `interest_calculation_method` varchar(50) NOT NULL,
  `effective_from` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `changed_by` varchar(100) DEFAULT NULL,
  `reason` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_prod_version` (`loan_product_id`,`version_number`),
  CONSTRAINT `loan_product_versions_ibfk_1` FOREIGN KEY (`loan_product_id`) REFERENCES `loan_products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
