-- Creates the `approval_rules` table. Apply files in numeric order.
CREATE TABLE `approval_rules` (
  `id` varchar(50) NOT NULL,
  `workflow_id` varchar(50) NOT NULL,
  `level_name` varchar(50) DEFAULT NULL,
  `order` int NOT NULL,
  `required_role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `minimum_amount` decimal(15,2) DEFAULT '0.00',
  `maximum_amount` decimal(15,2) DEFAULT NULL,
  `required_approvals` tinyint(1) DEFAULT '0',
  `active` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `workflow_id` (`workflow_id`),
  CONSTRAINT `approval_rules_ibfk_1` FOREIGN KEY (`workflow_id`) REFERENCES `approval_workflows` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
