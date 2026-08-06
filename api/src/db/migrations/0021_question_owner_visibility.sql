-- Custom / self-scoped question bank ownership
-- - owner_user_id NULL + visibility global → shared bank (seed/generated)
-- - owner_user_id set + visibility self → private to that user only
CREATE TYPE "public"."question_visibility" AS ENUM('global', 'self');--> statement-breakpoint

ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "owner_user_id" uuid;--> statement-breakpoint
ALTER TABLE "questions" ADD COLUMN IF NOT EXISTS "visibility" "question_visibility" DEFAULT 'global' NOT NULL;--> statement-breakpoint

ALTER TABLE "questions" ADD CONSTRAINT "questions_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

-- Replace global content_hash uniqueness so two users may author the same custom text
DROP INDEX IF EXISTS "questions_content_hash_uidx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "questions_global_content_hash_uidx" ON "questions" USING btree ("content_hash") WHERE "owner_user_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "questions_self_content_hash_uidx" ON "questions" USING btree ("owner_user_id","content_hash") WHERE "owner_user_id" IS NOT NULL;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "questions_owner_user_id_idx" ON "questions" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_visibility_idx" ON "questions" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "questions_owner_status_idx" ON "questions" USING btree ("owner_user_id","status");
