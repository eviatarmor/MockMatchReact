-- Once-per-job auto generation marker
ALTER TABLE "tracked_jobs" ADD COLUMN IF NOT EXISTS "questions_generated_at" timestamp with time zone;

-- Question bank content bucket fields (files / S3 prefix)
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "content_prefix" text;
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "content_version" text DEFAULT 'v1';
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "content_cache" jsonb DEFAULT '{}'::jsonb NOT NULL;
