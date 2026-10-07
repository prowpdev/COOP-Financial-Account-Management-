-- Creates the `numbering_formats` table. Apply files in numeric order.
CREATE TABLE `numbering_formats` (
  `id` varchar(50) NOT NULL,
  `module` varchar(50) NOT NULL,
  `prefix` varchar(20) NOT NULL,
  `branch_specific` tinyint(1) DEFAULT '1',
  `include_year` tinyint(1) DEFAULT '1',
  `padding` int DEFAULT '5',
  `next_number` int DEFAULT '1',
  `pattern` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
