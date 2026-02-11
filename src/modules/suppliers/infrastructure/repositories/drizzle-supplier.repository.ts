import { eq } from "drizzle-orm";

import type {
  CreateSupplierInput,
  Supplier,
  SupplierRepositoryPort,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import { suppliers } from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function toDomain(row: typeof suppliers.$inferSelect): Supplier {
  return {
    id: row.id,
    legalName: row.legalName,
    cnpj: row.cnpj,
    specialty: row.specialty,
    hourlyCostBrl: row.hourlyCostBrl ? Number(row.hourlyCostBrl) : null,
    active: row.active,
  };
}

export class DrizzleSupplierRepository implements SupplierRepositoryPort {
  constructor(private readonly database: Database) {}

  async create(input: CreateSupplierInput): Promise<Supplier> {
    const [supplier] = await this.database
      .insert(suppliers)
      .values({
        legalName: input.legalName,
        cnpj: input.cnpj,
        specialty: input.specialty,
        hourlyCostBrl:
          input.hourlyCostBrl !== undefined && input.hourlyCostBrl !== null
            ? String(input.hourlyCostBrl)
            : null,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
      })
      .returning();

    if (!supplier) {
      throw new Error("Falha ao criar fornecedor");
    }

    return toDomain(supplier);
  }

  async findById(id: string): Promise<Supplier | null> {
    const [supplier] = await this.database
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    return supplier ? toDomain(supplier) : null;
  }

  async findMany(): Promise<Supplier[]> {
    const rows = await this.database.select().from(suppliers);
    return rows.map(toDomain);
  }
}
