-- Whiteboard boards + practice session board_id + collab document_kind

ALTER TYPE "public"."document_kind" ADD VALUE IF NOT EXISTS 'whiteboard';

DO $$ BEGIN
  CREATE TYPE "public"."whiteboard_board_status" AS ENUM('draft', 'active', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "whiteboard_boards" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "status" "public"."whiteboard_board_status" DEFAULT 'draft' NOT NULL,
  "question_id" uuid,
  "document" jsonb DEFAULT '{"version":1,"elements":{}}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "whiteboard_boards"
  ADD CONSTRAINT "whiteboard_boards_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
  ON DELETE cascade ON UPDATE no action;

CREATE INDEX IF NOT EXISTS "whiteboard_boards_user_id_idx"
  ON "whiteboard_boards" USING btree ("user_id");
CREATE INDEX IF NOT EXISTS "whiteboard_boards_user_updated_idx"
  ON "whiteboard_boards" USING btree ("user_id","updated_at");

ALTER TABLE "practice_sessions"
  ADD COLUMN IF NOT EXISTS "board_id" uuid;

DO $$ BEGIN
  ALTER TABLE "practice_sessions"
    ADD CONSTRAINT "practice_sessions_board_id_whiteboard_boards_id_fk"
    FOREIGN KEY ("board_id") REFERENCES "public"."whiteboard_boards"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Seed sample whiteboard bank questions (idempotent by content_hash)
INSERT INTO "questions" (
  "title",
  "domain",
  "difficulty",
  "body",
  "format",
  "payload",
  "role_families",
  "tags",
  "source",
  "search_document",
  "content_hash",
  "status"
)
VALUES
(
  'Design a URL shortener',
  'systemDesign',
  'medium',
  'Sketch a high-level design for a URL shortener. Cover clients, API, storage, uniqueness of short codes, and scaling reads.',
  'whiteboard',
  '{"prompt":"Sketch a high-level design for a URL shortener. Cover clients, API, storage, uniqueness of short codes, and scaling reads.","defaultTemplateId":"system-design","durationMin":30}'::jsonb,
  '["engineering"]'::jsonb,
  '["system-design","whiteboard"]'::jsonb,
  'seed',
  'Design a URL shortener system design whiteboard',
  'seed|whiteboard|url-shortener|v1',
  'published'
),
(
  'Prioritize product features (2×2)',
  'product',
  'easy',
  'You have a backlog of feature ideas. Use a 2×2 (impact vs effort) and place sticky notes for at least six ideas. Call out what you ship next and why.',
  'whiteboard',
  '{"prompt":"You have a backlog of feature ideas. Use a 2×2 (impact vs effort) and place sticky notes for at least six ideas. Call out what you ship next and why.","defaultTemplateId":"2x2-matrix","durationMin":20}'::jsonb,
  '["product","general"]'::jsonb,
  '["product","whiteboard"]'::jsonb,
  'seed',
  'Prioritize product features 2x2 whiteboard',
  'seed|whiteboard|product-2x2|v1',
  'published'
)
ON CONFLICT ("content_hash") DO NOTHING;
