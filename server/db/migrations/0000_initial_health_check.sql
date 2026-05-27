CREATE TABLE IF NOT EXISTS "health_check" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
