import { buildCustomerSlug } from "@/modules/customers/domain/customer-slug";
import type { Customer } from "@/modules/customers/domain/customer";
import type { UseCase } from "@/shared/application/use-case";
import { normalizeCnpj, validateCnpj } from "@/shared/domain/cnpj";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";
import type { CustomerStatus } from "@/shared/domain/types";
import type { CustomerRepositoryPort } from "@/modules/customers/application/ports/customer-repository.port";

export interface UpdateCustomerInput {
  id: string;
  name: string;
  slug?: string | null;
  cnpj?: string | null;
  notes?: string | null;
  status: CustomerStatus;
}

export type UpdateCustomerOutput = Customer;

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

export class UpdateCustomerUseCase
  implements UseCase<UpdateCustomerInput, UpdateCustomerOutput>
{
  constructor(private readonly customerRepository: CustomerRepositoryPort) {}

  private async reserveUniqueSlug(baseSlug: string, customerId: string) {
    let candidate = baseSlug;
    let sequence = 2;

    while (true) {
      const existing = await this.customerRepository.findBySlug(candidate);
      if (!existing || existing.id === customerId) {
        return candidate;
      }

      candidate = appendSlugSuffix(baseSlug, sequence);
      sequence += 1;
    }
  }

  async execute(input: UpdateCustomerInput): Promise<UpdateCustomerOutput> {
    const currentCustomer = await this.customerRepository.findById(input.id);
    if (!currentCustomer) {
      throw new NotFoundError("Cliente não encontrado");
    }

    const name = input.name.trim();
    if (name.length < 3) {
      throw new ValidationError("Nome do cliente deve ter ao menos 3 caracteres");
    }

    const baseSlug = buildCustomerSlug(normalizeOptionalText(input.slug) ?? name);
    const slug = await this.reserveUniqueSlug(baseSlug, currentCustomer.id);

    return this.customerRepository.update({
      id: currentCustomer.id,
      name,
      slug,
      cnpj: parseCnpj(input.cnpj),
      notes: normalizeOptionalText(input.notes),
      status: input.status,
    });
  }
}
