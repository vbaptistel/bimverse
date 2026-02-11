import { describe, expect, it } from "vitest";

import type {
  CompanyRepositoryPort,
  CreateCompanyRecordInput,
  ListCompaniesFilters,
  UpdateCompanyRecordInput,
} from "@/modules/companies/application/ports/company-repository.port";
import { DeleteCompanyUseCase } from "@/modules/companies/application/use-cases/delete-company.use-case";
import type { Company } from "@/modules/companies/domain/company";

class FakeCompanyRepository implements CompanyRepositoryPort {
  constructor(
    private readonly company: Company | null,
    private readonly linkedProposals: boolean,
  ) {}

  async create(input: CreateCompanyRecordInput): Promise<Company> {
    return {
      id: "company-1",
      name: input.name,
      slug: input.slug,
      cnpj: input.cnpj ?? null,
      notes: input.notes ?? null,
      status: input.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async update(input: UpdateCompanyRecordInput): Promise<Company> {
    return {
      id: input.id,
      name: input.name,
      slug: input.slug,
      cnpj: input.cnpj ?? null,
      notes: input.notes ?? null,
      status: input.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async deleteById(): Promise<void> {}

  async findById(): Promise<Company | null> {
    return this.company;
  }

  async findBySlug(): Promise<Company | null> {
    return null;
  }

  async findMany(filters?: ListCompaniesFilters): Promise<Company[]> {
    void filters;
    return this.company ? [this.company] : [];
  }

  async hasLinkedProposals(): Promise<boolean> {
    return this.linkedProposals;
  }
}

describe("DeleteCompanyUseCase", () => {
  it("remove empresa sem propostas vinculadas", async () => {
    const company: Company = {
      id: "company-1",
      name: "Empresa",
      slug: "empresa",
      cnpj: null,
      notes: null,
      status: "ativa",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const useCase = new DeleteCompanyUseCase(
      new FakeCompanyRepository(company, false),
    );

    const output = await useCase.execute({ companyId: "company-1" });
    expect(output.companyId).toBe("company-1");
  });

  it("bloqueia exclusão com propostas vinculadas", async () => {
    const company: Company = {
      id: "company-1",
      name: "Empresa",
      slug: "empresa",
      cnpj: null,
      notes: null,
      status: "ativa",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const useCase = new DeleteCompanyUseCase(
      new FakeCompanyRepository(company, true),
    );

    await expect(
      useCase.execute({ companyId: "company-1" }),
    ).rejects.toThrow("propostas vinculadas");
  });
});
