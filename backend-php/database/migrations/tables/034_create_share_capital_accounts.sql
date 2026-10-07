-- Creates the `share_capital_accounts` table. Apply files in numeric order.
CREATE TABLE `share_capital_accounts` (
  `id` varchar(50) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `member_id` varchar(50) NOT NULL,
  `branch_id` varchar(50) DEFAULT NULL,
  `subscribed_shares` int NOT NULL,
  `subscribed_amount` decimal(15,2) NOT NULL,
  `paid_up_shares` int NOT NULL,
  `paid_up_amount` decimal(15,2) NOT NULL,
  `status` enum('Active','Withdrawn','Transferred') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_number` (`account_number`),
  KEY `idx_sca_member` (`member_id`),
  KEY `idx_share_capital_branch_id` (`branch_id`),
  CONSTRAINT `fk_share_capital_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `share_capital_accounts_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
