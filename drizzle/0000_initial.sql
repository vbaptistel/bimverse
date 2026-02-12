CREATE TYPE "public"."attachment_category" AS ENUM('convite', 'tr', 'referencia', 'proposta_word', 'planilha_custos', 'outro');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('potencial', 'em_negociacao', 'ativa', 'inativa', 'bloqueada');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('recebida', 'em_elaboracao', 'enviada', 'em_revisao', 'ganha', 'perdida', 'cancelada');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'comercial');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"revision_id" uuid,
	"category" "attachment_category" NOT NULL,
	"file_name" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime_type" text NOT NULL,
	"file_size_bytes" bigint NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"cnpj" text,
	"notes" text,
	"status" "customer_status" DEFAULT 'ativa' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers_to_suppliers" (
	"customer_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	CONSTRAINT "customers_to_suppliers_customer_id_supplier_id_pk" PRIMARY KEY("customer_id","supplier_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" "role" DEFAULT 'comercial' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_revisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"reason" text,
	"scope_changes" text,
	"discount_brl" numeric(14, 2),
	"discount_percent" numeric(5, 2),
	"value_before_brl" numeric(14, 2),
	"value_after_brl" numeric(14, 2),
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_sequences" (
	"customer_id" uuid PRIMARY KEY NOT NULL,
	"next_seq" integer DEFAULT 1 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"revision_id" uuid,
	"supplier_id" uuid NOT NULL,
	"role_description" text,
	"quoted_hourly_cost_brl" numeric(10, 2),
	"estimated_hours" numeric(10, 2),
	"quoted_total_brl" numeric(14, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" uuid NOT NULL,
	"code" text NOT NULL,
	"seq_number" integer NOT NULL,
	"year" integer NOT NULL,
	"invitation_code" text,
	"project_name" text NOT NULL,
	"scope_description" text NOT NULL,
	"status" "proposal_status" DEFAULT 'recebida' NOT NULL,
	"due_date" date,
	"estimated_value_brl" numeric(14, 2),
	"final_value_brl" numeric(14, 2),
	"outcome_reason" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_name" text NOT NULL,
	"cnpj" text NOT NULL,
	"specialty" text NOT NULL,
	"hourly_cost_brl" numeric(10, 2),
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_revision_id_proposal_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."proposal_revisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers_to_suppliers" ADD CONSTRAINT "customers_to_suppliers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers_to_suppliers" ADD CONSTRAINT "customers_to_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_revisions" ADD CONSTRAINT "proposal_revisions_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_sequences" ADD CONSTRAINT "proposal_sequences_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_suppliers" ADD CONSTRAINT "proposal_suppliers_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_suppliers" ADD CONSTRAINT "proposal_suppliers_revision_id_proposal_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."proposal_revisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_suppliers" ADD CONSTRAINT "proposal_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_entity_created_at_idx" ON "activity_log" USING btree ("entity_type","entity_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "attachments_storage_path_ux" ON "attachments" USING btree ("storage_path");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_slug_ux" ON "customers" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_revisions_proposal_revision_ux" ON "proposal_revisions" USING btree ("proposal_id","revision_number");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_suppliers_unique_link_ux" ON "proposal_suppliers" USING btree ("proposal_id","supplier_id","revision_id");--> statement-breakpoint
CREATE UNIQUE INDEX "proposal_suppliers_no_revision_ux" ON "proposal_suppliers" USING btree ("proposal_id","supplier_id") WHERE "proposal_suppliers"."revision_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_code_ux" ON "proposals" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "proposals_customer_year_seq_ux" ON "proposals" USING btree ("customer_id","year","seq_number");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_cnpj_ux" ON "suppliers" USING btree ("cnpj");
--> statement-breakpoint
ALTER TABLE "activity_log" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "customers_to_suppliers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "proposal_revisions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "proposal_sequences" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "proposal_suppliers" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "proposals" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
