ALTER TABLE `interventions` ADD `contractor` varchar(200);--> statement-breakpoint
ALTER TABLE `interventions` ADD `quoteNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `interventions` ADD `amount` decimal(12,2);--> statement-breakpoint
ALTER TABLE `interventions` ADD `validationKnitiv` varchar(200);--> statement-breakpoint
ALTER TABLE `interventions` ADD `connectImmoRef` varchar(100);--> statement-breakpoint
ALTER TABLE `interventions` ADD `daNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `interventions` ADD `cdaNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `interventions` ADD `pvNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `interventions` ADD `receptionNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `interventions` ADD `atNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `interventions` ADD `axeLocal` varchar(100);--> statement-breakpoint
ALTER TABLE `interventions` ADD `axeCentral` varchar(100);--> statement-breakpoint
ALTER TABLE `interventions` ADD `dateDacia` bigint;--> statement-breakpoint
ALTER TABLE `interventions` ADD `clotureAt` bigint;