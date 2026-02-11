CREATE TYPE "public"."company_status" AS ENUM(
  'potencial',
  'em_negociacao',
  'ativa',
  'inativa',
  'bloqueada'
);

ALTER TABLE "companies" ADD COLUMN "status" "company_status";

UPDATE "companies"
SET "status" = CASE
  WHEN "active" = true THEN 'ativa'::"company_status"
  ELSE 'inativa'::"company_status"
END
WHERE "status" IS NULL;

ALTER TABLE "companies" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "companies" ALTER COLUMN "status" SET DEFAULT 'ativa';
ALTER TABLE "companies" DROP COLUMN "active";
