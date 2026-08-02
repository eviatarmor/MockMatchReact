CREATE TABLE IF NOT EXISTS "voice_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "track_id" text NOT NULL,
  "session_kind" text DEFAULT 'practice' NOT NULL,
  "voice_id" text DEFAULT 'buttery' NOT NULL,
  "analyze_face" boolean DEFAULT false NOT NULL,
  "analyze_posture" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "system_prompt" text,
  "transcript" jsonb DEFAULT '[]'::jsonb,
  "error_message" text,
  "started_at" timestamp with time zone,
  "ended_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "voice_sessions_user_id_idx" ON "voice_sessions" ("user_id");
CREATE INDEX IF NOT EXISTS "voice_sessions_status_idx" ON "voice_sessions" ("status");
