ALTER TABLE "proposal_suppliers" DROP CONSTRAINT "proposal_suppliers_revision_id_proposal_revisions_id_fk";
--> statement-breakpoint
ALTER TABLE "proposal_suppliers" ADD CONSTRAINT "proposal_suppliers_revision_id_proposal_revisions_id_fk" FOREIGN KEY ("revision_id") REFERENCES "public"."proposal_revisions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
DROP INDEX IF EXISTS "proposal_suppliers_no_revision_ux";
--> statement-breakpoint
ALTER TABLE "proposal_suppliers" ALTER COLUMN "revision_id" SET NOT NULL;
