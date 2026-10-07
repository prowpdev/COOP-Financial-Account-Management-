-- Creates the `payment_frequencies` table. Apply files in numeric order.
CREATE TABLE `payment_frequencies` (
  `id` varchar(50) NOT NULL,
  `name` varchar(50) NOT NULL,
  `days_interval` int NOT NULL,
  `periods_per_year` int NOT NULL,
  `active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
