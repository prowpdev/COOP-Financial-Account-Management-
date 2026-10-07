-- Creates the `payment_allocation_rules` table. Apply files in numeric order.
CREATE TABLE `payment_allocation_rules` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `priority_order` json NOT NULL,
  `is_default` tinyint(1) DEFAULT '1',
  `active` tinyint(1) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
