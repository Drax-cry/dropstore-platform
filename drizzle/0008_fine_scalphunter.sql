ALTER TABLE `products` MODIFY COLUMN `sizes` varchar(500);--> statement-breakpoint
ALTER TABLE `products` ADD `discountPercent` decimal(5,2);