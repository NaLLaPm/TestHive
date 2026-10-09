CREATE TABLE `persona_clusters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pool_id` text NOT NULL,
	`cluster_id` integer NOT NULL,
	`label` text NOT NULL,
	`description` text NOT NULL,
	`size` integer NOT NULL,
	`top_traits` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`pool_id`) REFERENCES `persona_pools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `persona_edges` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pool_id` text NOT NULL,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`kind` text NOT NULL,
	`weight` real NOT NULL,
	FOREIGN KEY (`pool_id`) REFERENCES `persona_pools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `persona_pools` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`size` integer NOT NULL,
	`seed` integer NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`generator_config` text DEFAULT '{}' NOT NULL,
	`diversity_report` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `persona_pools_slug_unique` ON `persona_pools` (`slug`);--> statement-breakpoint
CREATE TABLE `personas` (
	`id` text PRIMARY KEY NOT NULL,
	`pool_id` text NOT NULL,
	`traits` text NOT NULL,
	`trait_vector` text NOT NULL,
	`traits_hash` text NOT NULL,
	`backstory` text DEFAULT '' NOT NULL,
	`voice` text DEFAULT '' NOT NULL,
	`quirks` text DEFAULT '[]' NOT NULL,
	`device_profile_key` text NOT NULL,
	`cluster_id` integer,
	`schema_version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`pool_id`) REFERENCES `persona_pools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `personas_pool_id_traits_hash_unique` ON `personas` (`pool_id`,`traits_hash`);--> statement-breakpoint
CREATE TABLE `run_personas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` text NOT NULL,
	`persona_id` text NOT NULL,
	`mode` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`outcome` text,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` text PRIMARY KEY NOT NULL,
	`kind` text NOT NULL,
	`pool_id` text NOT NULL,
	`stimulus` text NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	`state` text DEFAULT 'created' NOT NULL,
	`total_personas` integer DEFAULT 0 NOT NULL,
	`done_personas` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	`updated_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`pool_id`) REFERENCES `persona_pools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `persona_results` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`persona_id` text NOT NULL,
	`kind` text NOT NULL,
	`outcome` text NOT NULL,
	`verdict` text DEFAULT '{}' NOT NULL,
	`sentiment` real DEFAULT 0 NOT NULL,
	`would_recommend` integer DEFAULT false NOT NULL,
	`friction_notes` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `steps` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`persona_id` text NOT NULL,
	`step` integer NOT NULL,
	`action` text DEFAULT '{}' NOT NULL,
	`note` text,
	`screenshot_path` text,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `issues` (
	`id` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`title` text NOT NULL,
	`severity` text NOT NULL,
	`affected_personas` integer DEFAULT 0 NOT NULL,
	`affected_clusters` text DEFAULT '[]' NOT NULL,
	`evidence` text DEFAULT '[]' NOT NULL,
	`suggested_fix` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`run_id` text PRIMARY KEY NOT NULL,
	`json` text DEFAULT '{}' NOT NULL,
	`markdown` text DEFAULT '' NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `spread_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` text NOT NULL,
	`params` text DEFAULT '{}' NOT NULL,
	`rounds` text DEFAULT '[]' NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `llm_cache` (
	`prompt_hash` text PRIMARY KEY NOT NULL,
	`model` text NOT NULL,
	`response` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL
);
