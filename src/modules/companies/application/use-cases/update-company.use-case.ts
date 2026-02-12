import { buildCompanySlug } from "@/modules/companies/domain/company-slug";
import type { Company } from "@/modules/companies/domain/company";
import type { UseCase } from "@/shared/application/use-case";
import { normalizeCnpj, validateCnpj } from "@/shared/domain/cnpj";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";
import type { CompanyStatus } from "@/shared/domain/types";
import type { CompanyRepositoryPort } from "@/modules/companies/application/ports/company-repository.port";

export interface UpdateCompanyInput {
  id: string;
  name: string;
  slug?: string | null;
  cnpj?: string | null;
  notes?: string | null;
  status: CompanyStatus;
}

export type UpdateCompanyOutput = Company;

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

export class UpdateCompanyUseCase
  implements UseCase<UpdateCompanyInput, UpdateCompanyOutput>
{
  constructor(private readonly companyRepository: CompanyRepositoryPort) {}

  private async reserveUniqueSlug(baseSlug: string, companyId: string) {
    let candidate = baseSlug;
    let sequence = 2;

    while (true) {
      const existing = await this.companyRepository.findBySlug(candidate);
      if (!existing || existing.id === companyId) {
        return candidate;
      }

      candidate = appendSlugSuffix(baseSlug, sequence);
      sequence += 1;
    }
  }

  async execute(input: UpdateCompanyInput): Promise<UpdateCompanyOutput> {
    const currentCompany = await this.companyRepository.findById(input.id);
    if (!currentCompany) {
      throw new NotFoundError("Empresa não encontrada");
    }

    const name = input.name.trim();
    if (name.length < 3) {
      throw new ValidationError("Nome da empresa deve ter ao menos 3 caracteres");
    }

    const baseSlug = buildCompanySlug(normalizeOptionalText(input.slug) ?? name);
    const slug = await this.reserveUniqueSlug(baseSlug, currentCompany.id);

    return this.companyRepository.update({
      id: currentCompany.id,
      name,
      slug,
      cnpj: parseCnpj(input.cnpj),
      notes: normalizeOptionalText(input.notes),
      status: input.status,
    });
  }
}
