import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import type {
  CreateSupplierRecordInput,
  ListSuppliersFilters,
  Supplier,
  SupplierRepositoryPort,
  UpdateSupplierRecordInput,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import { proposalSuppliers, suppliers } from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function toDomain(row: typeof suppliers.$inferSelect): Supplier {
  return {
    id: row.id,
    legalName: row.legalName,
    cnpj: row.cnpj,
    specialty: row.specialty,
    hourlyCostBrl: row.hourlyCostBrl ? Number(row.hourlyCostBrl) : null,
    contactName: row.contactName,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleSupplierRepository implements SupplierRepositoryPort {
  constructor(private readonly database: Database) {}

  async create(input: CreateSupplierRecordInput): Promise<Supplier> {
    const [supplier] = await this.database
      .insert(suppliers)
      .values({
        legalName: input.legalName,
        cnpj: input.cnpj,
        specialty: input.specialty,
        hourlyCostBrl: input.hourlyCostBrl !== null ? String(input.hourlyCostBrl) : null,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        active: input.active ?? true,
      })
      .returning();

    if (!supplier) {
      throw new Error("Falha ao criar fornecedor");
    }

    return toDomain(supplier);
  }

  async update(input: UpdateSupplierRecordInput): Promise<Supplier> {
    const [supplier] = await this.database
      .update(suppliers)
      .set({
        legalName: input.legalName,
        cnpj: input.cnpj,
        specialty: input.specialty,
        hourlyCostBrl: input.hourlyCostBrl !== null ? String(input.hourlyCostBrl) : null,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        active: input.active,
        updatedAt: new Date(),
      })
      .where(eq(suppliers.id, input.id))
      .returning();

    if (!supplier) {
      throw new Error("Falha ao atualizar fornecedor");
    }

    return toDomain(supplier);
  }

  async deleteById(supplierId: string): Promise<void> {
    await this.database.delete(suppliers).where(eq(suppliers.id, supplierId));
  }

  async findById(id: string): Promise<Supplier | null> {
    const [supplier] = await this.database
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    return supplier ? toDomain(supplier) : null;
  }

  async findByCnpj(cnpj: string): Promise<Supplier | null> {
    const [supplier] = await this.database
      .select()
      .from(suppliers)
      .where(eq(suppliers.cnpj, cnpj))
      .limit(1);

    return supplier ? toDomain(supplier) : null;
  }

  async findMany(filters: ListSuppliersFilters = {}): Promise<Supplier[]> {
    const conditions: SQL<unknown>[] = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(suppliers.legalName, term),
          ilike(suppliers.specialty, term),
          ilike(suppliers.cnpj, term),
          ilike(suppliers.contactName, term),
          ilike(suppliers.contactEmail, term),
          ilike(suppliers.contactPhone, term),
        )!,
      );
    }

    if (filters.active !== undefined && filters.active !== null) {
      conditions.push(eq(suppliers.active, filters.active));
    }

    const query = this.database
      .select()
      .from(suppliers)
      .orderBy(desc(suppliers.createdAt), suppliers.legalName);

    const rows =
      conditions.length > 0
        ? await query.where(
            conditions.length === 1 ? conditions[0] : and(...conditions),
          )
        : await query;

    return rows.map(toDomain);
  }

  async hasLinkedProposals(supplierId: string): Promise<boolean> {
    const [proposalLink] = await this.database
      .select({ id: proposalSuppliers.id })
      .from(proposalSuppliers)
      .where(eq(proposalSuppliers.supplierId, supplierId))
      .limit(1);

    return Boolean(proposalLink);
  }
}
