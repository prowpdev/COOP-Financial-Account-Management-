-- Creates the `share_capital_settings` table. Apply files in numeric order.
CREATE TABLE `share_capital_settings` (
  `id` varchar(50) NOT NULL,
  `cooperative_id` varchar(50) NOT NULL,
  `par_value_per_share` decimal(15,2) DEFAULT '100.00',
  `min_subscription_shares` int DEFAULT '100',
  `min_paid_up_shares` int DEFAULT '25',
  `max_share_holding_percentage` decimal(5,2) DEFAULT '10.00',
  `transfer_fee` decimal(15,2) DEFAULT '100.00',
  `withdrawal_rule` text,
  `accounting_account_id` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `accounting_account_id` (`accounting_account_id`),
  CONSTRAINT `share_capital_settings_ibfk_1` FOREIGN KEY (`accounting_account_id`) REFERENCES `chart_of_accounts` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
