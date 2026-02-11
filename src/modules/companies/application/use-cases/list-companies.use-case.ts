import type {
  CompanyRepositoryPort,
  ListCompaniesFilters,
} from "@/modules/companies/application/ports/company-repository.port";
import type { Company } from "@/modules/companies/domain/company";
import type { UseCase } from "@/shared/application/use-case";

export type ListCompaniesInput = ListCompaniesFilters;

export class ListCompaniesUseCase
  implements UseCase<ListCompaniesInput | void, Company[]>
{
  constructor(private readonly companyRepository: CompanyRepositoryPort) {}

  async execute(input?: ListCompaniesInput): Promise<Company[]> {
    return this.companyRepository.findMany(input ?? {});
  }
}
