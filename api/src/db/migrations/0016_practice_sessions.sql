CREATE TYPE "public"."practice_session_status" AS ENUM('in_progress', 'completed', 'abandoned');

CREATE TABLE IF NOT EXISTS "practice_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"track_id" text NOT NULL,
	"title" text NOT NULL,
	"workspace_id" uuid REFERENCES "ide_workspaces"("id") ON DELETE set null,
	"question_id" uuid REFERENCES "questions"("id") ON DELETE set null,
	"status" "practice_session_status" DEFAULT 'in_progress' NOT NULL,
	"score" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "practice_sessions_user_updated_idx"
  ON "practice_sessions" ("user_id","updated_at");
CREATE INDEX IF NOT EXISTS "practice_sessions_user_track_status_idx"
  ON "practice_sessions" ("user_id","track_id","status");

-- Optional link from voice session → question bank item
ALTER TABLE "voice_sessions" ADD COLUMN IF NOT EXISTS "question_id" uuid REFERENCES "questions"("id") ON DELETE set null;
