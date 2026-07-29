ALTER TYPE "public"."document_kind" ADD VALUE 'workspace';--> statement-breakpoint
CREATE TYPE "public"."ide_workspace_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TABLE "ide_workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "ide_workspace_status" DEFAULT 'draft' NOT NULL,
	"template_id" text DEFAULT 'workspace' NOT NULL,
	"style" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"document" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ide_workspaces" ADD CONSTRAINT "ide_workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ide_workspaces_user_id_idx" ON "ide_workspaces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ide_workspaces_user_updated_idx" ON "ide_workspaces" USING btree ("user_id","updated_at");
