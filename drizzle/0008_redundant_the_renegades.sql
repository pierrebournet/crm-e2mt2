CREATE TABLE `intervention_checklist` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interventionId` int NOT NULL,
	`stepId` varchar(30) NOT NULL,
	`completed` int NOT NULL DEFAULT 0,
	`completedAt` bigint,
	`completedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `intervention_checklist_id` PRIMARY KEY(`id`)
);
