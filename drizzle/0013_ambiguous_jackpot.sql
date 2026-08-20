CREATE TABLE `inventaire_utbat` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code_ut` varchar(20) NOT NULL,
	`ut_bat` varchar(30) NOT NULL,
	`libelle_ut` varchar(200) NOT NULL,
	`code_batiment` varchar(20) NOT NULL,
	`libelle_batiment` varchar(200),
	`portefeuille` varchar(100),
	`nom_gerant` varchar(200) NOT NULL,
	`code_gerant` varchar(100),
	`proprietaire_interne` varchar(200),
	CONSTRAINT `inventaire_utbat_id` PRIMARY KEY(`id`)
);
