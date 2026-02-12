import { and, desc, eq, isNull } from "drizzle-orm";

import type {
  CreateProposalSupplierLinkInput,
  ProposalSupplierLink,
  ProposalSupplierRepositoryPort,
} from "@/modules/proposals/application/ports/proposal-supplier-repository.port";
import {
  proposalRevisions,
  proposalSuppliers,
  suppliers,
} from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function parseOptionalNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  return Number(value);
}

function toDomain(
  row: {
    id: string;
    proposalId: string;
    revisionId: string | null;
    revisionNumber: number | null;
    supplierId: string;
    supplierLegalName: string;
    supplierSpecialty: string;
    roleDescription: string | null;
    quotedHourlyCostBrl: string | null;
    estimatedHours: string | null;
    quotedTotalBrl: string | null;
    createdAt: Date;
  },
): ProposalSupplierLink {
  return {
    id: row.id,
    proposalId: row.proposalId,
    revisionId: row.revisionId,
    revisionNumber: row.revisionNumber,
    supplierId: row.supplierId,
    supplierLegalName: row.supplierLegalName,
    supplierSpecialty: row.supplierSpecialty,
    roleDescription: row.roleDescription,
    quotedHourlyCostBrl: parseOptionalNumber(row.quotedHourlyCostBrl),
    estimatedHours: parseOptionalNumber(row.estimatedHours),
    quotedTotalBrl: parseOptionalNumber(row.quotedTotalBrl),
    createdAt: row.createdAt,
  };
}

export class DrizzleProposalSupplierRepository
  implements ProposalSupplierRepositoryPort
{
  constructor(private readonly database: Database) {}

  async findById(linkId: string): Promise<ProposalSupplierLink | null> {
    const [row] = await this.database
      .select({
        id: proposalSuppliers.id,
        proposalId: proposalSuppliers.proposalId,
        revisionId: proposalSuppliers.revisionId,
        revisionNumber: proposalRevisions.revisionNumber,
        supplierId: proposalSuppliers.supplierId,
        supplierLegalName: suppliers.legalName,
        supplierSpecialty: suppliers.specialty,
        roleDescription: proposalSuppliers.roleDescription,
        quotedHourlyCostBrl: proposalSuppliers.quotedHourlyCostBrl,
        estimatedHours: proposalSuppliers.estimatedHours,
        quotedTotalBrl: proposalSuppliers.quotedTotalBrl,
        createdAt: proposalSuppliers.createdAt,
      })
      .from(proposalSuppliers)
      .innerJoin(suppliers, eq(suppliers.id, proposalSuppliers.supplierId))
      .leftJoin(
        proposalRevisions,
        eq(proposalRevisions.id, proposalSuppliers.revisionId),
      )
      .where(eq(proposalSuppliers.id, linkId))
      .limit(1);

    return row ? toDomain(row) : null;
  }

  async findManyByProposalId(proposalId: string): Promise<ProposalSupplierLink[]> {
    const rows = await this.database
      .select({
        id: proposalSuppliers.id,
        proposalId: proposalSuppliers.proposalId,
        revisionId: proposalSuppliers.revisionId,
        revisionNumber: proposalRevisions.revisionNumber,
        supplierId: proposalSuppliers.supplierId,
        supplierLegalName: suppliers.legalName,
        supplierSpecialty: suppliers.specialty,
        roleDescription: proposalSuppliers.roleDescription,
        quotedHourlyCostBrl: proposalSuppliers.quotedHourlyCostBrl,
        estimatedHours: proposalSuppliers.estimatedHours,
        quotedTotalBrl: proposalSuppliers.quotedTotalBrl,
        createdAt: proposalSuppliers.createdAt,
      })
      .from(proposalSuppliers)
      .innerJoin(suppliers, eq(suppliers.id, proposalSuppliers.supplierId))
      .leftJoin(
        proposalRevisions,
        eq(proposalRevisions.id, proposalSuppliers.revisionId),
      )
      .where(eq(proposalSuppliers.proposalId, proposalId))
      .orderBy(desc(proposalSuppliers.createdAt));

    return rows.map(toDomain);
  }

  async existsLink(
    proposalId: string,
    supplierId: string,
    revisionId?: string | null,
  ): Promise<boolean> {
    const condition =
      revisionId === undefined || revisionId === null
        ? and(
            eq(proposalSuppliers.proposalId, proposalId),
            eq(proposalSuppliers.supplierId, supplierId),
            isNull(proposalSuppliers.revisionId),
          )
        : and(
            eq(proposalSuppliers.proposalId, proposalId),
            eq(proposalSuppliers.supplierId, supplierId),
            eq(proposalSuppliers.revisionId, revisionId),
          );

    const [existing] = await this.database
      .select({ id: proposalSuppliers.id })
      .from(proposalSuppliers)
      .where(condition)
      .limit(1);

    return Boolean(existing);
  }

  async createLink(
    input: CreateProposalSupplierLinkInput,
  ): Promise<ProposalSupplierLink> {
    const [row] = await this.database
      .insert(proposalSuppliers)
      .values({
        proposalId: input.proposalId,
        revisionId: input.revisionId,
        supplierId: input.supplierId,
        roleDescription: input.roleDescription,
        quotedHourlyCostBrl:
          input.quotedHourlyCostBrl !== undefined &&
          input.quotedHourlyCostBrl !== null
            ? String(input.quotedHourlyCostBrl)
            : null,
        estimatedHours:
          input.estimatedHours !== undefined && input.estimatedHours !== null
            ? String(input.estimatedHours)
            : null,
        quotedTotalBrl:
          input.quotedTotalBrl !== undefined && input.quotedTotalBrl !== null
            ? String(input.quotedTotalBrl)
            : null,
      })
      .returning({ id: proposalSuppliers.id });

    if (!row) {
      throw new Error("Falha ao vincular fornecedor");
    }

    const created = await this.findById(row.id);
    if (!created) {
      throw new Error("Falha ao carregar vínculo de fornecedor");
    }

    return created;
  }

  async deleteById(linkId: string): Promise<void> {
    await this.database
      .delete(proposalSuppliers)
      .where(eq(proposalSuppliers.id, linkId));
  }
}
