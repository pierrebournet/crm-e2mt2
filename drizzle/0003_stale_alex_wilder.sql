CREATE TABLE `bpu_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(20) NOT NULL,
	`category` varchar(100) NOT NULL,
	`name` text NOT NULL,
	`detail` text,
	`priceHT` decimal(12,2) NOT NULL,
	`unit` varchar(200),
	`lotCode` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bpu_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `bpu_items_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `intervention_bpu_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`interventionId` int NOT NULL,
	`bpuItemId` int NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`unitPriceHT` decimal(12,2) NOT NULL,
	`totalHT` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `intervention_bpu_lines_id` PRIMARY KEY(`id`)
);
