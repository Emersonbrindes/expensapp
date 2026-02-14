CREATE TABLE `routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workWeekId` int NOT NULL,
	`origin` varchar(100) NOT NULL,
	`destination` varchar(100) NOT NULL,
	`distance` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workWeeks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekStartDate` timestamp NOT NULL,
	`weekEndDate` timestamp NOT NULL,
	`workDays` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workWeeks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `routes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `routes` ADD CONSTRAINT `routes_workWeekId_workWeeks_id_fk` FOREIGN KEY (`workWeekId`) REFERENCES `workWeeks`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workWeeks` ADD CONSTRAINT `workWeeks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;