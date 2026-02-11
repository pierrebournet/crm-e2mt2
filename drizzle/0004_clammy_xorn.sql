CREATE TABLE `devis_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fileName` varchar(300) NOT NULL,
	`fileUrl` text NOT NULL,
	`contractor` varchar(200),
	`devisNumber` varchar(100),
	`devisDate` varchar(50),
	`totalHT` decimal(12,2),
	`totalTTC` decimal(12,2),
	`verdict` enum('valide','a_reverifier','rejete','en_cours') NOT NULL DEFAULT 'en_cours',
	`verdictReason` text,
	`ecartGlobalPct` decimal(8,2),
	`rawExtraction` json,
	`interventionId` int,
	`uploadedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `devis_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `devis_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`devisId` int NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2),
	`unitPrice` decimal(12,2),
	`totalPrice` decimal(12,2),
	`unit` varchar(100),
	`matchedBpuId` int,
	`matchedBpuCode` varchar(20),
	`bpuUnitPrice` decimal(12,2),
	`ecartPct` decimal(8,2),
	`lineStatus` enum('conforme','ecart_faible','ecart_fort','non_trouve') NOT NULL DEFAULT 'non_trouve',
	`matchConfidence` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `devis_lines_id` PRIMARY KEY(`id`)
);
