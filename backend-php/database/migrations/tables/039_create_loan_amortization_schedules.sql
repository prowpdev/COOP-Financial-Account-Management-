-- Creates the `loan_amortization_schedules` table. Apply files in numeric order.
CREATE TABLE `loan_amortization_schedules` (
  `id` varchar(50) NOT NULL,
  `loan_id` varchar(50) NOT NULL,
  `installment_no` int NOT NULL,
  `due_date` date NOT NULL,
  `principal` decimal(15,2) NOT NULL,
  `interest` decimal(15,2) NOT NULL,
  `fee` decimal(15,2) DEFAULT '0.00',
  `total_installment` decimal(15,2) NOT NULL,
  `principal_balance` decimal(15,2) NOT NULL,
  `paid_principal` decimal(15,2) DEFAULT '0.00',
  `paid_interest` decimal(15,2) DEFAULT '0.00',
  `paid_penalty` decimal(15,2) DEFAULT '0.00',
  `paid_date` date DEFAULT NULL,
  `status` enum('Unpaid','Partially Paid','Paid','Overdue') DEFAULT 'Unpaid',
  PRIMARY KEY (`id`),
  KEY `idx_sched_due` (`loan_id`,`due_date`),
  CONSTRAINT `loan_amortization_schedules_ibfk_1` FOREIGN KEY (`loan_id`) REFERENCES `loans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
