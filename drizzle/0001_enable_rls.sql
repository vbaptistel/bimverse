-- Enable Row Level Security for all public application tables.
-- Policies are intentionally not added in this baseline migration.
-- Result: anon/authenticated clients are denied by default until explicit policies exist.

ALTER TABLE "activity_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies_to_suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proposal_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proposal_sequences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proposal_suppliers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;
