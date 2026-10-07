CREATE TABLE `user_documents` (
  `user_id` varchar(50) NOT NULL,
  `doc_key` varchar(100) NOT NULL,
  `document_data` json NOT NULL,
  PRIMARY KEY (`user_id`, `doc_key`),
  CONSTRAINT `user_documents_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
