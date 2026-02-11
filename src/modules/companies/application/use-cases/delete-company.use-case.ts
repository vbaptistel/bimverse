import type { CompanyRepositoryPort } from "@/modules/companies/application/ports/company-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError, ValidationError } from "@/shared/domain/errors";

export interface DeleteCompanyInput {
  companyId: string;
}

export interface DeleteCompanyOutput {
  companyId: string;
}

export class DeleteCompanyUseCase
  implements UseCase<DeleteCompanyInput, DeleteCompanyOutput>
{
  constructor(private readonly companyRepository: CompanyRepositoryPort) {}

  async execute(input: DeleteCompanyInput): Promise<DeleteCompanyOutput> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new NotFoundError("Empresa não encontrada");
    }

    const hasLinkedProposals = await this.companyRepository.hasLinkedProposals(
      input.companyId,
    );
    if (hasLinkedProposals) {
      throw new ValidationError(
        "Não é possível excluir empresa com propostas vinculadas",
      );
    }

    await this.companyRepository.deleteById(input.companyId);

    return {
      companyId: input.companyId,
    };
  }
}
