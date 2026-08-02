-- Tracked applications (server-side)
CREATE TYPE "public"."tracking_status" AS ENUM('saved', 'applied', 'interviewing', 'offer', 'declined');

CREATE TABLE IF NOT EXISTS "tracked_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"source_key" text NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"external_id" text,
	"title" text NOT NULL,
	"company" text NOT NULL,
	"location" text DEFAULT '—' NOT NULL,
	"description" text,
	"apply_url" text,
	"status" "tracking_status" DEFAULT 'saved' NOT NULL,
	"salary_range" text DEFAULT '—' NOT NULL,
	"seniority" text DEFAULT 'unknown' NOT NULL,
	"match_score" real DEFAULT 0 NOT NULL,
	"match_tier" text DEFAULT 'weak' NOT NULL,
	"avatar_text" text DEFAULT '?' NOT NULL,
	"avatar_color_class" text DEFAULT '' NOT NULL,
	"posted_at" text DEFAULT '' NOT NULL,
	"next_step_date" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "tracked_jobs_user_source_uidx" ON "tracked_jobs" ("user_id","source_key");
CREATE INDEX IF NOT EXISTS "tracked_jobs_user_status_idx" ON "tracked_jobs" ("user_id","status");
CREATE INDEX IF NOT EXISTS "tracked_jobs_user_updated_idx" ON "tracked_jobs" ("user_id","updated_at");

-- Expand global question bank
CREATE TYPE "public"."question_format" AS ENUM('conversation', 'code_run', 'workspace', 'terminal', 'whiteboard', 'mcq');
CREATE TYPE "public"."question_source" AS ENUM('seed', 'generated', 'manual');
CREATE TYPE "public"."question_publish_status" AS ENUM('draft', 'published', 'archived');

ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "format" "question_format" DEFAULT 'conversation' NOT NULL;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "payload" jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "language" text;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "role_families" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "source" "question_source" DEFAULT 'manual' NOT NULL;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "source_fingerprint" text;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "search_document" text DEFAULT '' NOT NULL;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "content_hash" text;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "embedding_model" text;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "embedding_at" timestamp with time zone;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "status" "question_publish_status" DEFAULT 'published' NOT NULL;

-- Backfill content_hash for any legacy rows (empty bank expected)
UPDATE "questions"
SET "content_hash" = md5(coalesce("title",'') || '|' || coalesce("body",'') || '|' || "format"::text || '|' || coalesce("language",''))
WHERE "content_hash" IS NULL;

ALTER TABLE "questions" ALTER COLUMN "content_hash" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "questions_content_hash_uidx" ON "questions" ("content_hash");
CREATE INDEX IF NOT EXISTS "questions_format_idx" ON "questions" ("format");
CREATE INDEX IF NOT EXISTS "questions_status_idx" ON "questions" ("status");

-- HNSW for cosine ANN (pgvector). Safe on empty table.
CREATE INDEX IF NOT EXISTS "questions_embedding_hnsw_idx"
  ON "questions" USING hnsw ("embedding" vector_cosine_ops);

-- Per-user progress on global bank
CREATE TYPE "public"."user_question_status" AS ENUM('new', 'attempted', 'mastered');

CREATE TABLE IF NOT EXISTS "user_question_progress" (
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"question_id" uuid NOT NULL REFERENCES "questions"("id") ON DELETE cascade,
	"status" "user_question_status" DEFAULT 'new' NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_question_progress_pk" PRIMARY KEY ("user_id","question_id")
);

CREATE INDEX IF NOT EXISTS "voice_sessions_user_updated_idx" ON "voice_sessions" ("user_id","updated_at");
