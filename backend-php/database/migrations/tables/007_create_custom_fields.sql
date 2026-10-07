-- Creates the `custom_fields` table. Apply files in numeric order.
CREATE TABLE `custom_fields` (
  `id` varchar(50) NOT NULL,
  `entity_type` enum('Member','Loan','Savings','ShareCapital') NOT NULL,
  `field_key` varchar(100) NOT NULL,
  `label` varchar(150) NOT NULL,
  `field_type` enum('Text','Number','Date','Select','Boolean','Phone','Dropdown','File','Image','PDF','Document') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `options` json DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT '0',
  `active` tinyint(1) DEFAULT '1',
  `display_order` int DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_entity_key` (`entity_type`,`field_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
