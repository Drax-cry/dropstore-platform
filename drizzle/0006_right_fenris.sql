ALTER TABLE `products` ADD `isPromotion` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `products` ADD `promotionDiscount` decimal(5,2);--> statement-breakpoint
ALTER TABLE `products` ADD `promotionType` enum('percentage','fixed');--> statement-breakpoint
ALTER TABLE `stores` ADD `promotionalCode` varchar(50);