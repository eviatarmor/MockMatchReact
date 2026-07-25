CREATE TABLE "candidate_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"writing_style" jsonb DEFAULT '{"avgSentenceLen":14,"avgBulletLen":90,"firstPersonRate":0,"actionVerbRate":0.4,"quantifierRate":0.2,"tensePreference":"past","formality":"concise","samplePhrases":[],"toneNotes":"concise bullets"}'::jsonb NOT NULL,
	"preferred_style" jsonb,
	"preferred_template_id" text,
	"compact_text" text DEFAULT '' NOT NULL,
	"profile_hash" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"label" text NOT NULL,
	"label_norm" text NOT NULL,
	"source" text DEFAULT 'resume' NOT NULL,
	"times_seen" integer DEFAULT 1 NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"org" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"start_date" text DEFAULT '' NOT NULL,
	"end_date" text DEFAULT '' NOT NULL,
	"bullets" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"source_resume_id" uuid,
	"fingerprint" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_experience" ADD CONSTRAINT "candidate_experience_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_skills_user_norm_uidx" ON "candidate_skills" USING btree ("user_id","label_norm");--> statement-breakpoint
CREATE INDEX "candidate_skills_user_idx" ON "candidate_skills" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "candidate_experience_user_fp_uidx" ON "candidate_experience" USING btree ("user_id","fingerprint");--> statement-breakpoint
CREATE INDEX "candidate_experience_user_idx" ON "candidate_experience" USING btree ("user_id");
