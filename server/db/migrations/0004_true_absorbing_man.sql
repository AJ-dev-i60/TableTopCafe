ALTER TABLE "games" ADD COLUMN "featured_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "featured_by_id" integer;