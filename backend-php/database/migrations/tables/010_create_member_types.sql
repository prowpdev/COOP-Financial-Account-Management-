-- Creates the `member_types` table. Apply files in numeric order.
CREATE TABLE `member_types` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `description` text,
  `voting_rights` tinyint(1) DEFAULT '1',
  `min_share_capital` decimal(15,2) DEFAULT '1000.00',
  `savings_requirement` decimal(15,2) DEFAULT '500.00',
  `loan_eligibility` tinyint(1) DEFAULT '1',
  `required_documents` json DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
