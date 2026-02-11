import { describe, expect, it } from "vitest";

import type {
  CompanyRepositoryPort,
  CreateCompanyRecordInput,
  ListCompaniesFilters,
  UpdateCompanyRecordInput,
} from "@/modules/companies/application/ports/company-repository.port";
import { CreateCompanyUseCase } from "@/modules/companies/application/use-cases/create-company.use-case";
import type { Company } from "@/modules/companies/domain/company";

class FakeCompanyRepository implements CompanyRepositoryPort {
  private readonly companies = new Map<string, Company>();

  constructor(seed: Company[] = []) {
    seed.forEach((company) => this.companies.set(company.id, company));
  }

  async create(input: CreateCompanyRecordInput): Promise<Company> {
    const created: Company = {
      id: `company-${this.companies.size + 1}`,
      name: input.name,
      slug: input.slug,
      cnpj: input.cnpj ?? null,
      notes: input.notes ?? null,
      status: input.status,
      createdAt: new Date("2026-02-01T10:00:00.000Z"),
      updatedAt: new Date("2026-02-01T10:00:00.000Z"),
    };

    this.companies.set(created.id, created);
    return created;
  }

  async update(input: UpdateCompanyRecordInput): Promise<Company> {
    const current = this.companies.get(input.id);
    if (!current) {
      throw new Error("company not found");
    }

    const updated: Company = {
      ...current,
      ...input,
      cnpj: input.cnpj ?? null,
      notes: input.notes ?? null,
      updatedAt: new Date("2026-02-02T10:00:00.000Z"),
    };

    this.companies.set(updated.id, updated);
    return updated;
  }

  async deleteById(companyId: string): Promise<void> {
    this.companies.delete(companyId);
  }

  async findById(companyId: string): Promise<Company | null> {
    return this.companies.get(companyId) ?? null;
  }

  async findBySlug(slug: string): Promise<Company | null> {
    for (const company of this.companies.values()) {
      if (company.slug === slug) {
        return company;
      }
    }

    return null;
  }

  async findMany(filters?: ListCompaniesFilters): Promise<Company[]> {
    void filters;
    return [...this.companies.values()];
  }

  async hasLinkedProposals(): Promise<boolean> {
    return false;
  }
}

describe("CreateCompanyUseCase", () => {
  it("normaliza nome/cnpj e cria slug único", async () => {
    const useCase = new CreateCompanyUseCase(
      new FakeCompanyRepository([
        {
          id: "company-0",
          name: "Bimverse",
          slug: "bimverse",
          cnpj: null,
          notes: null,
          status: "ativa",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]),
    );

    const company = await useCase.execute({
      name: "Bimverse",
      cnpj: "12.345.678/0001-99",
      notes: "Cliente estratégico",
    });

    expect(company.slug).toBe("bimverse-2");
    expect(company.cnpj).toBe("12345678000199");
    expect(company.status).toBe("ativa");
  });

  it("rejeita cnpj inválido", async () => {
    const useCase = new CreateCompanyUseCase(new FakeCompanyRepository());

    await expect(
      useCase.execute({
        name: "Empresa X",
        cnpj: "123",
      }),
    ).rejects.toThrow("CNPJ deve conter 14 dígitos");
  });
});
