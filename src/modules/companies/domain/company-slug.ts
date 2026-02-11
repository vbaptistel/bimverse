import { ValidationError } from "@/shared/domain/errors";

export function normalizeCompanySlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildCompanySlug(value: string): string {
  const slug = normalizeCompanySlug(value);

  if (!slug) {
    throw new ValidationError("Slug da empresa inválido");
  }

  return slug;
}
