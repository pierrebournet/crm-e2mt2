CREATE TABLE `cotech_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` text NOT NULL,
	`reference` varchar(200),
	`category` varchar(100),
	`reponse` text,
	`reponseDate` bigint,
	`resolved` int NOT NULL DEFAULT 0,
	`resolvedAt` bigint,
	`archived` int NOT NULL DEFAULT 0,
	`archivedAt` bigint,
	`priority` enum('haute','moyenne','basse') NOT NULL DEFAULT 'moyenne',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cotech_questions_id` PRIMARY KEY(`id`)
);
