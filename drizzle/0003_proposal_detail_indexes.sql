CREATE INDEX IF NOT EXISTS "activity_log_entity_created_at_idx"
ON "activity_log" ("entity_type", "entity_id", "created_at" DESC);

CREATE UNIQUE INDEX IF NOT EXISTS "proposal_suppliers_no_revision_ux"
ON "proposal_suppliers" ("proposal_id", "supplier_id")
WHERE "revision_id" IS NULL;
