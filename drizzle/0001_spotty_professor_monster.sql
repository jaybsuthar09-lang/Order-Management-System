CREATE TABLE `company` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text,
	`phone` varchar(20),
	`email` varchar(320),
	`gstNumber` varchar(50),
	`footer` text,
	`logoUrl` text,
	`signatureUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`companyName` varchar(255),
	`address` text,
	`city` varchar(100),
	`state` varchar(100),
	`pincode` varchar(20),
	`phone` varchar(20),
	`email` varchar(320),
	`gstNumber` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` decimal(12,2) NOT NULL,
	`rate` decimal(12,2) NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`remarks` text,
	`checkedBy` varchar(255),
	`receiver` varchar(255),
	`status` enum('Pending','Packed','Dispatched','Delivered') NOT NULL DEFAULT 'Pending',
	`totalAmount` decimal(14,2) DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_deliveryNumber_unique` UNIQUE(`deliveryNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` varchar(100),
	`unit` varchar(50) NOT NULL,
	`rate` decimal(12,2) NOT NULL,
	`hsn` varchar(50),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
