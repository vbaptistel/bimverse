import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import type {
  CompanyRepositoryPort,
  CreateCompanyRecordInput,
  ListCompaniesFilters,
  UpdateCompanyRecordInput,
} from "@/modules/companies/application/ports/company-repository.port";
import type { Company } from "@/modules/companies/domain/company";
import { companies, proposals } from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function toDomain(row: typeof companies.$inferSelect): Company {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    cnpj: row.cnpj,
    notes: row.notes,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCompanyRepository implements CompanyRepositoryPort {
  constructor(private readonly database: Database) {}

  async create(input: CreateCompanyRecordInput): Promise<Company> {
    const [company] = await this.database
      .insert(companies)
      .values({
        name: input.name,
        slug: input.slug,
        cnpj: input.cnpj,
        notes: input.notes,
        status: input.status,
      })
      .returning();

    if (!company) {
      throw new Error("Falha ao criar empresa");
    }

    return toDomain(company);
  }

  async update(input: UpdateCompanyRecordInput): Promise<Company> {
    const [company] = await this.database
      .update(companies)
      .set({
        name: input.name,
        slug: input.slug,
        cnpj: input.cnpj,
        notes: input.notes,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, input.id))
      .returning();

    if (!company) {
      throw new Error("Falha ao atualizar empresa");
    }

    return toDomain(company);
  }

  async deleteById(companyId: string): Promise<void> {
    await this.database.delete(companies).where(eq(companies.id, companyId));
  }

  async findById(companyId: string): Promise<Company | null> {
    const [company] = await this.database
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    return company ? toDomain(company) : null;
  }

  async findBySlug(slug: string): Promise<Company | null> {
    const [company] = await this.database
      .select()
      .from(companies)
      .where(eq(companies.slug, slug))
      .limit(1);

    return company ? toDomain(company) : null;
  }

  async findMany(filters: ListCompaniesFilters = {}): Promise<Company[]> {
    const conditions: SQL<unknown>[] = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(companies.name, term),
          ilike(companies.slug, term),
          ilike(companies.cnpj, term),
        )!,
      );
    }

    if (filters.status !== undefined && filters.status !== null) {
      conditions.push(eq(companies.status, filters.status));
    }

    const query = this.database
      .select()
      .from(companies)
      .orderBy(desc(companies.createdAt), companies.name);

    const rows =
      conditions.length > 0
        ? await query.where(
            conditions.length === 1 ? conditions[0] : and(...conditions),
          )
        : await query;

    return rows.map(toDomain);
  }

  async hasLinkedProposals(companyId: string): Promise<boolean> {
    const [proposal] = await this.database
      .select({ id: proposals.id })
      .from(proposals)
      .where(eq(proposals.companyId, companyId))
      .limit(1);

    return Boolean(proposal);
  }
}
