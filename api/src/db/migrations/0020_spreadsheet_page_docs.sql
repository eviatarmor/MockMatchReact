-- Document kinds for spreadsheet + freeform page practice collab
ALTER TYPE "public"."document_kind" ADD VALUE IF NOT EXISTS 'spreadsheet';--> statement-breakpoint
ALTER TYPE "public"."document_kind" ADD VALUE IF NOT EXISTS 'page';--> statement-breakpoint

-- Question bank practice formats
ALTER TYPE "public"."question_format" ADD VALUE IF NOT EXISTS 'spreadsheet';--> statement-breakpoint
ALTER TYPE "public"."question_format" ADD VALUE IF NOT EXISTS 'page';--> statement-breakpoint

CREATE TYPE "public"."spreadsheet_workbook_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."page_document_status" AS ENUM('draft', 'active', 'archived');--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "spreadsheet_workbooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "spreadsheet_workbook_status" DEFAULT 'draft' NOT NULL,
	"question_id" uuid,
	"document" jsonb DEFAULT '{"version":1,"sheets":[],"activeSheetId":""}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "page_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "page_document_status" DEFAULT 'draft' NOT NULL,
	"question_id" uuid,
	"document" jsonb DEFAULT '{"version":1,"html":""}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

ALTER TABLE "spreadsheet_workbooks" ADD CONSTRAINT "spreadsheet_workbooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "page_documents" ADD CONSTRAINT "page_documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "spreadsheet_workbooks_user_id_idx" ON "spreadsheet_workbooks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "spreadsheet_workbooks_user_updated_idx" ON "spreadsheet_workbooks" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_documents_user_id_idx" ON "page_documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_documents_user_updated_idx" ON "page_documents" USING btree ("user_id","updated_at");
