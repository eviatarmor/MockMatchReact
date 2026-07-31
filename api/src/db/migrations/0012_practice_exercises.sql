CREATE TYPE "public"."exercise_format" AS ENUM('code_run', 'workspace', 'terminal');--> statement-breakpoint
CREATE TYPE "public"."exercise_layout" AS ENUM('ide', 'editor', 'shell');--> statement-breakpoint
CREATE TYPE "public"."exercise_difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."exercise_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."exercise_domain" AS ENUM('coding', 'frontend', 'backend', 'devops', 'system_design', 'data', 'product', 'behavioral', 'finance', 'clinical', 'general');--> statement-breakpoint
CREATE TABLE "practice_exercises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"prompt" text DEFAULT '' NOT NULL,
	"ai_context" text DEFAULT '' NOT NULL,
	"format" "exercise_format" NOT NULL,
	"layout" "exercise_layout" NOT NULL,
	"domain" "exercise_domain" DEFAULT 'coding' NOT NULL,
	"difficulty" "exercise_difficulty" DEFAULT 'medium' NOT NULL,
	"status" "exercise_status" DEFAULT 'published' NOT NULL,
	"languages" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"role_families" jsonb DEFAULT '["engineering"]'::jsonb NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"duration_min" integer DEFAULT 30 NOT NULL,
	"ui_flags" jsonb NOT NULL,
	"content_prefix" text NOT NULL,
	"content_version" text DEFAULT 'v1' NOT NULL,
	"content_manifest" jsonb NOT NULL,
	"content_cache" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"search_document" text DEFAULT '' NOT NULL,
	"embedding" vector(1536),
	"embedding_model" text,
	"embedding_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "practice_exercises_slug_uidx" ON "practice_exercises" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "practice_exercises_format_idx" ON "practice_exercises" USING btree ("format");--> statement-breakpoint
CREATE INDEX "practice_exercises_domain_idx" ON "practice_exercises" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "practice_exercises_difficulty_idx" ON "practice_exercises" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "practice_exercises_status_idx" ON "practice_exercises" USING btree ("status");
