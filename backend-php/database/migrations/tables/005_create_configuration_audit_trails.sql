-- Creates the `configuration_audit_trails` table. Apply files in numeric order.
CREATE TABLE `configuration_audit_trails` (
  `id` varchar(50) NOT NULL,
  `action` varchar(20) NOT NULL DEFAULT 'UPDATE',
  `setting` varchar(150) NOT NULL,
  `old_value` text,
  `new_value` text,
  `changed_by` varchar(100) NOT NULL,
  `reason` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
