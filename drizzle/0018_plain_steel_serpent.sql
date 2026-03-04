ALTER TABLE `products` ADD `externalLink` text;--> statement-breakpoint
ALTER TABLE `stores` ADD `checkoutType` enum('whatsapp_cart','whatsapp_direct','external_link') DEFAULT 'whatsapp_cart';