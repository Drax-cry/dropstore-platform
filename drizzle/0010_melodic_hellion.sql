CREATE TABLE `store_banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`storeId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`linkUrl` text,
	`title` varchar(255),
	`order` int DEFAULT 0,
	`isActive` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `store_banners_id` PRIMARY KEY(`id`)
);
