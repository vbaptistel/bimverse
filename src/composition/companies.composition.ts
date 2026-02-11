import { CreateCompanyUseCase } from "@/modules/companies/application/use-cases/create-company.use-case";
import { DeleteCompanyUseCase } from "@/modules/companies/application/use-cases/delete-company.use-case";
import { ListCompaniesUseCase } from "@/modules/companies/application/use-cases/list-companies.use-case";
import { UpdateCompanyUseCase } from "@/modules/companies/application/use-cases/update-company.use-case";
import { DrizzleCompanyRepository } from "@/modules/companies/infrastructure/repositories/drizzle-company.repository";
import { db } from "@/shared/infrastructure/db/client";

export function buildCompaniesComposition() {
  const companyRepository = new DrizzleCompanyRepository(db);

  return {
    listCompaniesUseCase: new ListCompaniesUseCase(companyRepository),
    createCompanyUseCase: new CreateCompanyUseCase(companyRepository),
    updateCompanyUseCase: new UpdateCompanyUseCase(companyRepository),
    deleteCompanyUseCase: new DeleteCompanyUseCase(companyRepository),
    companyRepository,
  };
}
