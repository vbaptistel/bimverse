\set ON_ERROR_STOP on
\if :{?created_by}
\else
\echo 'Parametro obrigatorio: -v created_by=<UUID>'
\quit 1
\endif

BEGIN;

CREATE TEMP TABLE stg_customers (
  name text,
  slug text,
  status text,
  cnpj text,
  notes text
);

CREATE TEMP TABLE stg_proposals (
  customer_slug text,
  code text,
  seq_number integer,
  year integer,
  invitation_code text,
  project_name text,
  scope_description text,
  status text,
  estimated_value_brl text,
  final_value_brl text,
  outcome_reason text,
  legacy_sheet text,
  legacy_row integer
);

\copy stg_customers FROM '/Users/viniciusbaptistel/workspace/bimverse/tmp/legacy-import/customers_legacy.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
\copy stg_proposals FROM '/Users/viniciusbaptistel/workspace/bimverse/tmp/legacy-import/proposals_legacy.csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

INSERT INTO customers (name, slug, cnpj, notes, status)
SELECT
  sc.name,
  sc.slug,
  NULLIF(sc.cnpj, ''),
  NULLIF(sc.notes, ''),
  sc.status::customer_status
FROM stg_customers sc
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  cnpj = COALESCE(NULLIF(EXCLUDED.cnpj, ''), customers.cnpj),
  notes = COALESCE(NULLIF(EXCLUDED.notes, ''), customers.notes),
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO proposals (
  customer_id,
  code,
  seq_number,
  year,
  invitation_code,
  project_name,
  scope_description,
  status,
  due_date,
  estimated_value_brl,
  final_value_brl,
  outcome_reason,
  created_by
)
SELECT
  c.id,
  sp.code,
  sp.seq_number,
  sp.year,
  NULLIF(sp.invitation_code, ''),
  sp.project_name,
  sp.scope_description,
  sp.status::proposal_status,
  NULL,
  NULLIF(sp.estimated_value_brl, '')::numeric(14, 2),
  NULLIF(sp.final_value_brl, '')::numeric(14, 2),
  NULLIF(sp.outcome_reason, ''),
  :'created_by'::uuid
FROM stg_proposals sp
JOIN customers c ON c.slug = sp.customer_slug
ON CONFLICT (code) DO UPDATE
SET
  customer_id = EXCLUDED.customer_id,
  seq_number = EXCLUDED.seq_number,
  year = EXCLUDED.year,
  invitation_code = EXCLUDED.invitation_code,
  project_name = EXCLUDED.project_name,
  scope_description = EXCLUDED.scope_description,
  status = EXCLUDED.status,
  due_date = EXCLUDED.due_date,
  estimated_value_brl = EXCLUDED.estimated_value_brl,
  final_value_brl = EXCLUDED.final_value_brl,
  outcome_reason = EXCLUDED.outcome_reason,
  updated_at = NOW();

WITH imported_customers AS (
  SELECT c.id
  FROM customers c
  JOIN stg_customers sc ON sc.slug = c.slug
),
next_seq AS (
  SELECT
    ic.id AS customer_id,
    COALESCE(MAX(p.seq_number) + 1, 1) AS next_seq
  FROM imported_customers ic
  LEFT JOIN proposals p ON p.customer_id = ic.id
  GROUP BY ic.id
)
INSERT INTO proposal_sequences (customer_id, next_seq)
SELECT ns.customer_id, ns.next_seq
FROM next_seq ns
ON CONFLICT (customer_id) DO UPDATE
SET
  next_seq = GREATEST(proposal_sequences.next_seq, EXCLUDED.next_seq),
  updated_at = NOW();

COMMIT;
