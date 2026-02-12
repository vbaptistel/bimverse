import { ValidationError } from "@/shared/domain/errors";

interface ProposalCodeParams {
  customerSlug: string;
  year: number;
  sequence: number;
}

export function normalizeCustomerSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
}

export function buildProposalCode({
  customerSlug,
  year,
  sequence,
}: ProposalCodeParams): string {
  if (year < 2000 || year > 2100) {
    throw new ValidationError("Ano da proposta inválido");
  }

  if (sequence <= 0) {
    throw new ValidationError("Sequencial da proposta inválido");
  }

  const normalizedSlug = normalizeCustomerSlug(customerSlug);
  if (!normalizedSlug) {
    throw new ValidationError("Slug do cliente inválido");
  }

  const paddedSequence = String(sequence).padStart(3, "0");
  return `BV-${normalizedSlug}-${year}-BIM-${paddedSequence}`;
}
