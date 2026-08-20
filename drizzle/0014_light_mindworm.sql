CREATE TABLE `ref_correspondance_connect_immo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sous_type_immosis` varchar(30) NOT NULL,
	`sous_type_connect_immo` varchar(200) NOT NULL,
	`origine_connect_immo` varchar(200),
	`remarques` text,
	CONSTRAINT `ref_correspondance_connect_immo_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ref_gerants_programme` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nom` varchar(200) NOT NULL,
	`code_immosis` varchar(100),
	`sa` varchar(100),
	`bd_proprietaire` varchar(200),
	`code_bupo` varchar(20),
	`portefeuille` varchar(100),
	`est_valide_ouv_at` int NOT NULL DEFAULT 1,
	`remarques` text,
	CONSTRAINT `ref_gerants_programme_id` PRIMARY KEY(`id`),
	CONSTRAINT `ref_gerants_programme_nom_unique` UNIQUE(`nom`)
);
--> statement-breakpoint
CREATE TABLE `ref_natures_travaux` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`libelle` varchar(200) NOT NULL,
	`sous_types_compatibles` text,
	`description` text,
	CONSTRAINT `ref_natures_travaux_id` PRIMARY KEY(`id`),
	CONSTRAINT `ref_natures_travaux_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `ref_sous_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(30) NOT NULL,
	`libelle` varchar(200) NOT NULL,
	`famille_zg` varchar(100),
	`budget_impacte` varchar(100),
	`description` text,
	`bonnes_pratiques` text,
	`mauvaises_pratiques` text,
	`sous_type_connect_immo` varchar(200),
	`est_actif` int NOT NULL DEFAULT 1,
	`est_e2mt` int NOT NULL DEFAULT 0,
	`seuil_montant_min` decimal(12,2),
	`seuil_montant_max` decimal(12,2),
	CONSTRAINT `ref_sous_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `ref_sous_types_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `ref_ventilation_bd` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gerant` varchar(200) NOT NULL,
	`sa` varchar(100) NOT NULL,
	`bd_proprietaire` varchar(200) NOT NULL,
	`pourcentage` int NOT NULL DEFAULT 100,
	`code_bupo` varchar(20),
	`remarques` text,
	CONSTRAINT `ref_ventilation_bd_id` PRIMARY KEY(`id`)
);
