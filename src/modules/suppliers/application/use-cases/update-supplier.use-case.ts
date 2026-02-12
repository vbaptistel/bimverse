import type { UseCase } from "@/shared/application/use-case";
import { normalizeCnpj, validateCnpj } from "@/shared/domain/cnpj";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";
import type {
  Supplier,
  SupplierRepositoryPort,
} from "@/modules/suppliers/application/ports/supplier-repository.port";

export interface UpdateSupplierInput {
  id: string;
  legalName: string;
  cnpj: string;
  specialty: string;
  hourlyCostBrl?: number | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  active: boolean;
}

export type UpdateSupplierOutput = Supplier;

function normalizeOptionalText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseCnpj(value: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) {
    throw new ValidationError("CNPJ é obrigatório");
  }

  const digits = normalizeCnpj(normalized);
  if (digits.length !== 14) {
    throw new ValidationError("CNPJ deve conter 14 dígitos");
  }

  if (!validateCnpj(normalized)) {
    throw new ValidationError("CNPJ inválido");
  }

  return digits;
}

function parseHourlyCost(value?: number | null): number | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isFinite(value)) {
    throw new ValidationError("Custo/hora inválido");
  }

  if (value < 0) {
    throw new ValidationError("Custo/hora não pode ser negativo");
  }

  return Number(value.toFixed(2));
}

export class UpdateSupplierUseCase
  implements UseCase<UpdateSupplierInput, UpdateSupplierOutput>
{
  constructor(private readonly supplierRepository: SupplierRepositoryPort) {}

  async execute(input: UpdateSupplierInput): Promise<UpdateSupplierOutput> {
    const currentSupplier = await this.supplierRepository.findById(input.id);
    if (!currentSupplier) {
      throw new NotFoundError("Fornecedor não encontrado");
    }

    const legalName = input.legalName.trim();
    if (legalName.length < 3) {
      throw new ValidationError(
        "Razão social do fornecedor deve ter ao menos 3 caracteres",
      );
    }

    const specialty = input.specialty.trim();
    if (specialty.length < 2) {
      throw new ValidationError(
        "Especialidade do fornecedor deve ter ao menos 2 caracteres",
      );
    }

    const cnpj = parseCnpj(input.cnpj);
    const existing = await this.supplierRepository.findByCnpj(cnpj);
    if (existing && existing.id !== currentSupplier.id) {
      throw new ValidationError("Já existe fornecedor cadastrado com este CNPJ");
    }

    return this.supplierRepository.update({
      id: currentSupplier.id,
      legalName,
      cnpj,
      specialty,
      hourlyCostBrl: parseHourlyCost(input.hourlyCostBrl),
      contactName: normalizeOptionalText(input.contactName),
      contactEmail: normalizeOptionalText(input.contactEmail),
      contactPhone: normalizeOptionalText(input.contactPhone),
      active: input.active,
    });
  }
}
