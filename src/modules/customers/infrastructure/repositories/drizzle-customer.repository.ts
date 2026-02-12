import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import type {
  CustomerRepositoryPort,
  CreateCustomerRecordInput,
  ListCustomersFilters,
  UpdateCustomerRecordInput,
} from "@/modules/customers/application/ports/customer-repository.port";
import type { Customer } from "@/modules/customers/domain/customer";
import { customers, proposals } from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function toDomain(row: typeof customers.$inferSelect): Customer {
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

export class DrizzleCustomerRepository implements CustomerRepositoryPort {
  constructor(private readonly database: Database) {}

  async create(input: CreateCustomerRecordInput): Promise<Customer> {
    const [customer] = await this.database
      .insert(customers)
      .values({
        name: input.name,
        slug: input.slug,
        cnpj: input.cnpj,
        notes: input.notes,
        status: input.status,
      })
      .returning();

    if (!customer) {
      throw new Error("Falha ao criar cliente");
    }

    return toDomain(customer);
  }

  async update(input: UpdateCustomerRecordInput): Promise<Customer> {
    const [customer] = await this.database
      .update(customers)
      .set({
        name: input.name,
        slug: input.slug,
        cnpj: input.cnpj,
        notes: input.notes,
        status: input.status,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, input.id))
      .returning();

    if (!customer) {
      throw new Error("Falha ao atualizar cliente");
    }

    return toDomain(customer);
  }

  async deleteById(customerId: string): Promise<void> {
    await this.database.delete(customers).where(eq(customers.id, customerId));
  }

  async findById(customerId: string): Promise<Customer | null> {
    const [customer] = await this.database
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    return customer ? toDomain(customer) : null;
  }

  async findBySlug(slug: string): Promise<Customer | null> {
    const [customer] = await this.database
      .select()
      .from(customers)
      .where(eq(customers.slug, slug))
      .limit(1);

    return customer ? toDomain(customer) : null;
  }

  async findMany(filters: ListCustomersFilters = {}): Promise<Customer[]> {
    const conditions: SQL<unknown>[] = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(customers.name, term),
          ilike(customers.slug, term),
          ilike(customers.cnpj, term),
        )!,
      );
    }

    if (filters.status !== undefined && filters.status !== null) {
      conditions.push(eq(customers.status, filters.status));
    }

    const query = this.database
      .select()
      .from(customers)
      .orderBy(desc(customers.createdAt), customers.name);

    const rows =
      conditions.length > 0
        ? await query.where(
            conditions.length === 1 ? conditions[0] : and(...conditions),
          )
        : await query;

    return rows.map(toDomain);
  }

  async hasLinkedProposals(customerId: string): Promise<boolean> {
    const [proposal] = await this.database
      .select({ id: proposals.id })
      .from(proposals)
      .where(eq(proposals.customerId, customerId))
      .limit(1);

    return Boolean(proposal);
  }
}
