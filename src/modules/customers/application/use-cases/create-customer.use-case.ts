import { buildCustomerSlug } from "@/modules/customers/domain/customer-slug";
import type { Customer } from "@/modules/customers/domain/customer";
import type { UseCase } from "@/shared/application/use-case";
import { normalizeCnpj, validateCnpj } from "@/shared/domain/cnpj";
import { ValidationError } from "@/shared/domain/errors";
import type { CustomerStatus } from "@/shared/domain/types";
import type { CustomerRepositoryPort } from "@/modules/customers/application/ports/customer-repository.port";

export interface CreateCustomerInput {
  name: string;
  slug?: string | null;
  cnpj?: string | null;
  notes?: string | null;
  status?: CustomerStatus;
}

export type CreateCustomerOutput = Customer;

function normalizeOptionalText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCnpj(value?: string | null): string | null {
  const text = normalizeOptionalText(value);
  if (!text) {
    return null;
  }

  const digits = normalizeCnpj(text);
  if (digits.length !== 14) {
    throw new ValidationError("CNPJ deve conter 14 dígitos");
  }
  if (!validateCnpj(text)) {
    throw new ValidationError("CNPJ inválido");
  }

  return digits;
}

function appendSlugSuffix(baseSlug: string, suffix: number): string {
  return `${baseSlug}-${suffix}`;
}

export class CreateCustomerUseCase
  implements UseCase<CreateCustomerInput, CreateCustomerOutput>
{
  constructor(private readonly customerRepository: CustomerRepositoryPort) {}

  private async reserveUniqueSlug(baseSlug: string): Promise<string> {
    let candidate = baseSlug;
    let sequence = 2;

    while (true) {
      const existing = await this.customerRepository.findBySlug(candidate);
      if (!existing) {
        return candidate;
      }

      candidate = appendSlugSuffix(baseSlug, sequence);
      sequence += 1;
    }
  }

  async execute(input: CreateCustomerInput): Promise<CreateCustomerOutput> {
    const name = input.name.trim();
    if (name.length < 3) {
      throw new ValidationError("Nome do cliente deve ter ao menos 3 caracteres");
    }

    const baseSlug = buildCustomerSlug(normalizeOptionalText(input.slug) ?? name);
    const slug = await this.reserveUniqueSlug(baseSlug);

    return this.customerRepository.create({
      name,
      slug,
      cnpj: parseCnpj(input.cnpj),
      notes: normalizeOptionalText(input.notes),
      status: input.status ?? "ativa",
    });
  }
}
