import { ValidationError } from "@/shared/domain/errors";

export function normalizeCustomerSlug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function buildCustomerSlug(value: string): string {
  const slug = normalizeCustomerSlug(value);

  if (!slug) {
    throw new ValidationError("Slug do cliente inválido");
  }

  return slug;
}
