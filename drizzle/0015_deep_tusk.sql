ALTER TABLE `stores` ADD `trialEndsAt` timestamp;--> statement-breakpoint
ALTER TABLE `stores` ADD `subscriptionStatus` enum('trial','active','expired','cancelled') DEFAULT 'trial';--> statement-breakpoint
ALTER TABLE `stores` ADD `stripeCustomerId` varchar(255);--> statement-breakpoint
ALTER TABLE `stores` ADD `stripeSubscriptionId` varchar(255);