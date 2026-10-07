-- Creates the `transaction_types` table. Apply files in numeric order.
CREATE TABLE `transaction_types` (
  `id` varchar(50) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `module` varchar(50) NOT NULL,
  `requires_approval` tinyint(1) DEFAULT '0',
  `numbering_format_id` varchar(50) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
