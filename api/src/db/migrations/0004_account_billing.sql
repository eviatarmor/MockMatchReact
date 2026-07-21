ALTER TABLE "users" ADD COLUMN "preferences" jsonb DEFAULT '{"voiceProfile":"mellow","country":"US","dateFormat":"MM/DD/YYYY","timeFormat":"12h","privacy":{"allowLocationMetadata":true,"allowImproveApp":true,"marketingEmails":false,"analyticsCookies":true,"performanceCookies":true}}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "card_brand" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "card_last4" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "card_exp_month" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "card_exp_year" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "users_stripe_customer_uidx" ON "users" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE TABLE "credit_accounts" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"used" integer DEFAULT 0 NOT NULL,
	"breakdown" jsonb DEFAULT '{"mockInterviews":0,"resumeScans":0,"coverLetters":0}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_accounts" ADD CONSTRAINT "credit_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE TABLE "credit_topups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_checkout_session_id" text NOT NULL,
	"stripe_payment_intent_id" text,
	"pack_id" text NOT NULL,
	"credits" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "credit_topups" ADD CONSTRAINT "credit_topups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "credit_topups_session_uidx" ON "credit_topups" USING btree ("stripe_checkout_session_id");
