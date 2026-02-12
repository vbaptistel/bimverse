#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path

try:
    import openpyxl
except ModuleNotFoundError as exc:  # pragma: no cover
    raise SystemExit(
        "Dependencia ausente: openpyxl. Instale com: python3 -m pip install --user openpyxl"
    ) from exc

SKIP_SHEETS = {"RESUMO"}
PROPOSAL_CODE_RE = re.compile(r"^BV-([A-Z0-9]+)-(\d{4})-BIM-(\d{4})$")


@dataclass
class CustomerRecord:
    name: str
    slug: str
    status: str = "ativa"
    cnpj: str = ""
    notes: str = ""


@dataclass
class ProposalRecord:
    customer_slug: str
    code: str
    seq_number: int
    year: int
    invitation_code: str
    project_name: str
    scope_description: str
    status: str
    estimated_value_brl: str
    final_value_brl: str
    outcome_reason: str
    legacy_sheet: str
    legacy_row: int


def normalize_str(value: object) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_only = ascii_only.lower()
    ascii_only = re.sub(r"[^a-z0-9]+", "-", ascii_only)
    ascii_only = ascii_only.strip("-")
    return ascii_only or "cliente"


def unique_slug(base: str, used: set[str]) -> str:
    if base not in used:
        used.add(base)
        return base

    index = 2
    while True:
        candidate = f"{base}-{index}"
        if candidate not in used:
            used.add(candidate)
            return candidate
        index += 1


def parse_decimal(value: object) -> Decimal | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, Decimal):
        return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if isinstance(value, (int, float)):
        return Decimal(str(value)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    raw = normalize_str(value)
    if not raw:
        return None

    raw = raw.replace("R$", "").replace(" ", "")

    if "," in raw and "." in raw:
        if raw.rfind(",") > raw.rfind("."):
            raw = raw.replace(".", "").replace(",", ".")
        else:
            raw = raw.replace(",", "")
    elif "," in raw:
        raw = raw.replace(".", "").replace(",", ".")

    try:
        return Decimal(raw).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except InvalidOperation:
        return None


def decimal_to_csv(value: Decimal | None) -> str:
    if value is None:
        return ""
    return f"{value:.2f}"


def pick_first(*values: Decimal | None) -> Decimal | None:
    for value in values:
        if value is not None:
            return value
    return None


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Transforma planilha legado de propostas para CSV e SQL de carga."
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Caminho do arquivo .xlsx legado",
    )
    parser.add_argument(
        "--output-dir",
        default="tmp/legacy-import",
        help="Diretorio de saida (default: tmp/legacy-import)",
    )
    return parser


def extract_records(xlsx_path: Path) -> tuple[list[CustomerRecord], list[ProposalRecord], list[str], dict[str, int]]:
    workbook = openpyxl.load_workbook(xlsx_path, data_only=True)

    customer_sheets = [sheet for sheet in workbook.sheetnames if sheet not in SKIP_SHEETS]
    slug_by_sheet: dict[str, str] = {}
    used_slugs: set[str] = set()

    customers: list[CustomerRecord] = []
    for sheet in customer_sheets:
        slug = unique_slug(slugify(sheet), used_slugs)
        slug_by_sheet[sheet] = slug
        customers.append(
            CustomerRecord(
                name=sheet,
                slug=slug,
                notes=f'Importado da planilha legado "{xlsx_path.name}" (aba "{sheet}").',
            )
        )

    proposals: list[ProposalRecord] = []
    warnings: list[str] = []
    count_by_sheet: dict[str, int] = {sheet: 0 for sheet in customer_sheets}

    for sheet in customer_sheets:
        worksheet = workbook[sheet]
        customer_slug = slug_by_sheet[sheet]

        for row in range(5, worksheet.max_row + 1):
            raw_code = normalize_str(worksheet.cell(row=row, column=2).value)
            if not raw_code:
                continue

            match = PROPOSAL_CODE_RE.match(raw_code)
            if not match:
                continue

            _, year_raw, seq_raw = match.groups()
            year = int(year_raw)
            seq_number = int(seq_raw)

            if sheet == "EGIS":
                invitation_code = normalize_str(worksheet.cell(row=row, column=3).value)
                description = normalize_str(worksheet.cell(row=row, column=4).value)
                active_value = parse_decimal(worksheet.cell(row=row, column=5).value)
                rev0 = parse_decimal(worksheet.cell(row=row, column=8).value)
                rev1 = parse_decimal(worksheet.cell(row=row, column=9).value)
                rev2 = parse_decimal(worksheet.cell(row=row, column=10).value)
                won_value = parse_decimal(worksheet.cell(row=row, column=11).value)
                lost_value = parse_decimal(worksheet.cell(row=row, column=12).value)
            else:
                invitation_code = ""
                description = normalize_str(worksheet.cell(row=row, column=3).value)
                active_value = parse_decimal(worksheet.cell(row=row, column=4).value)
                rev0 = parse_decimal(worksheet.cell(row=row, column=7).value)
                rev1 = parse_decimal(worksheet.cell(row=row, column=8).value)
                rev2 = parse_decimal(worksheet.cell(row=row, column=9).value)
                won_value = parse_decimal(worksheet.cell(row=row, column=10).value)
                lost_value = parse_decimal(worksheet.cell(row=row, column=11).value)

            if not description:
                description = f"Proposta legado {raw_code}"
                warnings.append(
                    f"Linha sem descricao ajustada automaticamente: aba={sheet}, linha={row}, code={raw_code}"
                )

            if won_value is not None:
                status = "ganha"
                final_value = won_value
                outcome_reason = ""
            elif lost_value is not None:
                status = "perdida"
                final_value = lost_value
                outcome_reason = ""
            else:
                status = "enviada"
                final_value = None
                outcome_reason = ""

            estimated_value = pick_first(active_value, rev2, rev1, rev0, won_value, lost_value)
            if estimated_value is None:
                warnings.append(
                    f"Proposta sem valor estimado: aba={sheet}, linha={row}, code={raw_code}"
                )

            proposals.append(
                ProposalRecord(
                    customer_slug=customer_slug,
                    code=raw_code,
                    seq_number=seq_number,
                    year=year,
                    invitation_code=invitation_code,
                    project_name=description,
                    scope_description=description,
                    status=status,
                    estimated_value_brl=decimal_to_csv(estimated_value),
                    final_value_brl=decimal_to_csv(final_value),
                    outcome_reason=outcome_reason,
                    legacy_sheet=sheet,
                    legacy_row=row,
                )
            )
            count_by_sheet[sheet] += 1

    code_counter = Counter([proposal.code for proposal in proposals])
    duplicate_codes = sorted([code for code, amount in code_counter.items() if amount > 1])
    if duplicate_codes:
        warnings.append(f"Codigos duplicados detectados: {', '.join(duplicate_codes)}")

    return customers, proposals, warnings, count_by_sheet


def write_customers_csv(path: Path, records: list[CustomerRecord]) -> None:
    fieldnames = ["name", "slug", "status", "cnpj", "notes"]
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow(
                {
                    "name": record.name,
                    "slug": record.slug,
                    "status": record.status,
                    "cnpj": record.cnpj,
                    "notes": record.notes,
                }
            )


def write_proposals_csv(path: Path, records: list[ProposalRecord]) -> None:
    fieldnames = [
        "customer_slug",
        "code",
        "seq_number",
        "year",
        "invitation_code",
        "project_name",
        "scope_description",
        "status",
        "estimated_value_brl",
        "final_value_brl",
        "outcome_reason",
        "legacy_sheet",
        "legacy_row",
    ]
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        for record in records:
            writer.writerow(
                {
                    "customer_slug": record.customer_slug,
                    "code": record.code,
                    "seq_number": record.seq_number,
                    "year": record.year,
                    "invitation_code": record.invitation_code,
                    "project_name": record.project_name,
                    "scope_description": record.scope_description,
                    "status": record.status,
                    "estimated_value_brl": record.estimated_value_brl,
                    "final_value_brl": record.final_value_brl,
                    "outcome_reason": record.outcome_reason,
                    "legacy_sheet": record.legacy_sheet,
                    "legacy_row": record.legacy_row,
                }
            )


def write_sql(path: Path, customers_csv: Path, proposals_csv: Path) -> None:
    sql = f"""\\set ON_ERROR_STOP on
\\if :{{?created_by}}
\\else
\\echo 'Parametro obrigatorio: -v created_by=<UUID>'
\\quit 1
\\endif

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

\\copy stg_customers FROM '{customers_csv.as_posix()}' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');
\\copy stg_proposals FROM '{proposals_csv.as_posix()}' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

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
"""
    path.write_text(sql, encoding="utf-8")


def write_summary(
    path: Path,
    input_path: Path,
    customers: list[CustomerRecord],
    proposals: list[ProposalRecord],
    warnings: list[str],
    count_by_sheet: dict[str, int],
) -> None:
    status_counter = Counter([proposal.status for proposal in proposals])
    summary = {
        "input_file": input_path.as_posix(),
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "customers_total": len(customers),
        "customers_with_proposals": sum(1 for _, count in count_by_sheet.items() if count > 0),
        "proposals_total": len(proposals),
        "proposals_by_status": dict(status_counter),
        "proposals_by_customer": count_by_sheet,
        "warnings": warnings,
    }
    path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    input_path = Path(args.input).expanduser().resolve()
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not input_path.exists():
        raise SystemExit(f"Arquivo nao encontrado: {input_path}")

    customers_csv = output_dir / "customers_legacy.csv"
    proposals_csv = output_dir / "proposals_legacy.csv"
    sql_file = output_dir / "import_legacy.sql"
    summary_file = output_dir / "summary.json"

    customers, proposals, warnings, count_by_sheet = extract_records(input_path)

    write_customers_csv(customers_csv, customers)
    write_proposals_csv(proposals_csv, proposals)
    write_sql(sql_file, customers_csv, proposals_csv)
    write_summary(summary_file, input_path, customers, proposals, warnings, count_by_sheet)

    print(f"OK: {input_path}")
    print(f"- customers: {customers_csv}")
    print(f"- proposals: {proposals_csv}")
    print(f"- sql: {sql_file}")
    print(f"- summary: {summary_file}")
    print(f"- total clientes: {len(customers)}")
    print(f"- total propostas: {len(proposals)}")


if __name__ == "__main__":
    main()
