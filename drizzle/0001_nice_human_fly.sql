CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interventionId` int NOT NULL,
	`type` enum('d1_depassement','d2_depassement','c1_creation','retard_preventif') NOT NULL,
	`message` text NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`acknowledged` int NOT NULL DEFAULT 0,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buildings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`code` varchar(50),
	`lotId` int NOT NULL,
	`portfolio` enum('Industriel','Ferroviaire','Gares','Tertiaire','Social') NOT NULL,
	`address` text,
	`surface` decimal(12,2),
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buildings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interventionId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `intervention_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interventionId` int NOT NULL,
	`userId` int,
	`field` varchar(100) NOT NULL,
	`oldValue` text,
	`newValue` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intervention_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interventions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(50) NOT NULL,
	`buildingId` int NOT NULL,
	`workTypeId` int NOT NULL,
	`criticality` enum('C1','C2') NOT NULL,
	`maintenanceType` enum('MPREV','MREG','MCOR') NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`status` enum('planifie','en_cours','termine','annule') NOT NULL DEFAULT 'planifie',
	`plannedDate` bigint,
	`startDate` bigint,
	`endDate` bigint,
	`durationMinutes` int,
	`d1Deadline` bigint,
	`d2Deadline` bigint,
	`d1Met` int,
	`d2Met` int,
	`assignedTo` varchar(200),
	`createdBy` int,
	`alertSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `interventions_id` PRIMARY KEY(`id`),
	CONSTRAINT `interventions_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `lots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`region` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lots_id` PRIMARY KEY(`id`),
	CONSTRAINT `lots_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `work_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `work_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `work_types_code_unique` UNIQUE(`code`)
);
