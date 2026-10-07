-- Creates the `document_requirements` table. Apply files in numeric order.
CREATE TABLE `document_requirements` (
  `id` varchar(50) NOT NULL,
  `module` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_mandatory` tinyint(1) DEFAULT '1',
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
