CREATE TABLE IF NOT EXISTS "bgg_games_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"bgg_id" integer NOT NULL,
	"name" text NOT NULL,
	"year_published" integer,
	"thumbnail" text,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bgg_games_cache_bgg_id_unique" UNIQUE("bgg_id")
);
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "bgg_id" integer;