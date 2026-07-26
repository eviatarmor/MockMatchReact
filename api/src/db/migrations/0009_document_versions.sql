CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_kind" "document_kind" NOT NULL,
	"document_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"actor_name" text NOT NULL,
	"title" text NOT NULL,
	"template_id" text NOT NULL,
	"style" jsonb NOT NULL,
	"document" jsonb NOT NULL,
	"content_hash" text NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_versions_doc_created_idx" ON "document_versions" USING btree ("document_kind","document_id","created_at");
