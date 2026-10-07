-- Creates the `cooperatives` table. Apply files in numeric order.
CREATE TABLE `cooperatives` (
  `id` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `cda_registration_no` varchar(100) NOT NULL,
  `tax_identification_no` varchar(100) NOT NULL,
  `coop_type` varchar(100) DEFAULT 'Agricultural',
  `address` text,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `fiscal_year_start` varchar(10) DEFAULT '01-01',
  `base_currency` varchar(10) DEFAULT 'PHP',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
