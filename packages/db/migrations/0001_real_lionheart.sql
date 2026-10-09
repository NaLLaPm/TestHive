ALTER TABLE `persona_results` ADD `drop_off_step` integer;--> statement-breakpoint
ALTER TABLE `persona_results` ADD `drop_off_reason` text;--> statement-breakpoint
ALTER TABLE `persona_results` ADD `screenshot_path` text;--> statement-breakpoint
ALTER TABLE `persona_results` ADD `repeat_index` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `persona_results` ADD `is_control` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `steps` ADD `repeat_index` integer DEFAULT 0 NOT NULL;