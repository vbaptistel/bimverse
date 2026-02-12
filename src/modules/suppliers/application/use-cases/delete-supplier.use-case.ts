import type { SupplierRepositoryPort } from "@/modules/suppliers/application/ports/supplier-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

export interface DeleteSupplierInput {
  supplierId: string;
}

export interface DeleteSupplierOutput {
  supplierId: string;
}

export class DeleteSupplierUseCase
  implements UseCase<DeleteSupplierInput, DeleteSupplierOutput>
{
  constructor(private readonly supplierRepository: SupplierRepositoryPort) {}

  async execute(input: DeleteSupplierInput): Promise<DeleteSupplierOutput> {
    const supplier = await this.supplierRepository.findById(input.supplierId);
    if (!supplier) {
      throw new NotFoundError("Fornecedor não encontrado");
    }

    const hasLinkedProposals = await this.supplierRepository.hasLinkedProposals(
      input.supplierId,
    );
    if (hasLinkedProposals) {
      throw new ValidationError(
        "Não é possível excluir fornecedor com propostas vinculadas",
      );
    }

    await this.supplierRepository.deleteById(input.supplierId);

    return {
      supplierId: input.supplierId,
    };
  }
}
