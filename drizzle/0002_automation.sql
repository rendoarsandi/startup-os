CREATE TABLE `automation_run` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`rule_id` text NOT NULL,
	`rule_name` text NOT NULL,
	`action_type` text NOT NULL,
	`subject_id` text NOT NULL,
	`dedupe_key` text NOT NULL,
	`status` text NOT NULL,
	`input` text NOT NULL,
	`output` text,
	`error` text,
	`attempts` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `automation_run_dedupe_key_unique` ON `automation_run` (`dedupe_key`);--> statement-breakpoint
CREATE INDEX `automation_run_owner_created` ON `automation_run` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `workspace_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`company_name` text DEFAULT '' NOT NULL,
	`company_description` text DEFAULT '' NOT NULL,
	`autonomy` text DEFAULT 'review' NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
