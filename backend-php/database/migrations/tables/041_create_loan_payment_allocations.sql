-- Creates the `loan_payment_allocations` table. Apply files in numeric order.
CREATE TABLE `loan_payment_allocations` (
  `id` varchar(50) NOT NULL,
  `payment_id` varchar(50) NOT NULL,
  `loan_id` varchar(50) NOT NULL,
  `penalty_amount` decimal(15,2) DEFAULT '0.00',
  `interest_amount` decimal(15,2) DEFAULT '0.00',
  `fee_amount` decimal(15,2) DEFAULT '0.00',
  `principal_amount` decimal(15,2) DEFAULT '0.00',
  `allocation_order_applied` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_id` (`payment_id`),
  KEY `loan_id` (`loan_id`),
  CONSTRAINT `loan_payment_allocations_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `loan_payments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `loan_payment_allocations_ibfk_2` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
