import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import type {
  CustomerLookup,
  CreateProposalRecordInput,
  ListProposalsFilters,
  ProposalDetailRecord,
  ProposalListRecord,
  ProposalRepositoryPort,
  ProposalStorageContext,
  UpdateProposalBaseFieldsInput,
  UpdateProposalStatusInput,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { Proposal } from "@/modules/proposals/domain/proposal";
import {
  customers,
  proposals,
  proposalRevisions,
  proposalSequences,
} from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function parseOptionalNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  return Number(value);
}

function toDomain(row: typeof proposals.$inferSelect): Proposal {
  return {
    id: row.id,
    customerId: row.customerId,
    code: row.code,
    seqNumber: row.seqNumber,
    year: row.year,
    invitationCode: row.invitationCode,
    projectName: row.projectName,
    scopeDescription: row.scopeDescription,
    status: row.status,
    dueDate: row.dueDate,
    estimatedValueBrl: parseOptionalNumber(row.estimatedValueBrl),
    finalValueBrl: parseOptionalNumber(row.finalValueBrl),
    outcomeReason: row.outcomeReason,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toDetailRecord(
  row: typeof proposals.$inferSelect & {
    customerName: string;
    customerSlug: string;
  },
): ProposalDetailRecord {
  const proposal = toDomain(row);

  return {
    ...proposal,
    customerName: row.customerName,
    customerSlug: row.customerSlug,
  };
}

function toListRecord(
  row: {
    proposal: typeof proposals.$inferSelect;
    customer: {
      id: string;
      name: string;
      slug: string;
    };
    currentRevisionNumber: number | null;
  },
): ProposalListRecord {
  const proposal = toDomain(row.proposal);

  return {
    ...proposal,
    customer: row.customer,
    currentRevisionNumber: row.currentRevisionNumber,
  };
}

export class DrizzleProposalRepository implements ProposalRepositoryPort {
  constructor(private readonly database: Database) {}

  async findMany(filters: ListProposalsFilters = {}): Promise<ProposalListRecord[]> {
    const conditions: SQL<unknown>[] = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(proposals.code, term),
          ilike(proposals.projectName, term),
          ilike(proposals.invitationCode, term),
          ilike(customers.name, term),
        )!,
      );
    }

    if (filters.status !== undefined && filters.status !== null) {
      conditions.push(eq(proposals.status, filters.status));
    }

    const query = this.database
      .select({
        proposal: proposals,
        customer: {
          id: customers.id,
          name: customers.name,
          slug: customers.slug,
        },
        currentRevisionNumber: sql<number | null>`(
          SELECT MAX(${proposalRevisions.revisionNumber})
          FROM ${proposalRevisions}
          WHERE ${proposalRevisions.proposalId} = ${proposals.id}
        )`.as("current_revision_number"),
      })
      .from(proposals)
      .innerJoin(customers, eq(customers.id, proposals.customerId))
      .orderBy(desc(proposals.createdAt), proposals.code);

    const rows =
      conditions.length > 0
        ? await query.where(
            conditions.length === 1 ? conditions[0] : and(...conditions),
          )
        : await query;

    return rows.map(toListRecord);
  }

  async getCustomerById(customerId: string): Promise<CustomerLookup | null> {
    const [customer] = await this.database
      .select({
        id: customers.id,
        slug: customers.slug,
      })
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    return customer ?? null;
  }

  async getDetailById(proposalId: string): Promise<ProposalDetailRecord | null> {
    const [proposal] = await this.database
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);

    if (!proposal) {
      return null;
    }

    const [customer] = await this.database
      .select({
        name: customers.name,
        slug: customers.slug,
      })
      .from(customers)
      .where(eq(customers.id, proposal.customerId))
      .limit(1);

    if (!customer) {
      return null;
    }

    return toDetailRecord({
      ...proposal,
      customerName: customer.name,
      customerSlug: customer.slug,
    });
  }

  async allocateNextSequence(customerId: string, year: number): Promise<number> {
    void year;

    return this.database.transaction(async (tx) => {
      const result = await tx.execute<{ seq: number }>(sql`
        INSERT INTO ${proposalSequences} (customer_id, next_seq, updated_at)
        VALUES (${customerId}, 2, NOW())
        ON CONFLICT (customer_id)
        DO UPDATE SET
          next_seq = ${proposalSequences.nextSeq} + 1,
          updated_at = NOW()
        RETURNING next_seq - 1 AS seq
      `);

      const row = result[0];
      if (!row) {
        throw new Error("Falha ao alocar sequencial da proposta");
      }

      return Number(row.seq);
    });
  }

  async createProposal(input: CreateProposalRecordInput): Promise<Proposal> {
    const [proposal] = await this.database
      .insert(proposals)
      .values({
        customerId: input.customerId,
        code: input.code,
        seqNumber: input.seqNumber,
        year: input.year,
        invitationCode: input.invitationCode,
        projectName: input.projectName,
        scopeDescription: input.scopeDescription,
        dueDate: input.dueDate,
        estimatedValueBrl:
          input.estimatedValueBrl !== undefined
            ? String(input.estimatedValueBrl)
            : undefined,
        finalValueBrl:
          input.finalValueBrl !== undefined
            ? String(input.finalValueBrl)
            : undefined,
        outcomeReason: input.outcomeReason,
        createdBy: input.createdBy,
      })
      .returning();

    if (!proposal) {
      throw new Error("Falha ao criar proposta");
    }

    return toDomain(proposal);
  }

  async updateBaseFields(input: UpdateProposalBaseFieldsInput): Promise<Proposal> {
    const [proposal] = await this.database
      .update(proposals)
      .set({
        projectName: input.projectName,
        invitationCode: input.invitationCode,
        scopeDescription: input.scopeDescription,
        dueDate: input.dueDate,
        estimatedValueBrl:
          input.estimatedValueBrl !== undefined
            ? String(input.estimatedValueBrl)
            : undefined,
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, input.proposalId))
      .returning();

    if (!proposal) {
      throw new Error("Falha ao atualizar dados da proposta");
    }

    return toDomain(proposal);
  }

  async getProposalById(proposalId: string): Promise<Proposal | null> {
    const [proposal] = await this.database
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);

    return proposal ? toDomain(proposal) : null;
  }

  async deleteById(proposalId: string): Promise<void> {
    await this.database.delete(proposals).where(eq(proposals.id, proposalId));
  }

  async getProposalStorageContext(
    proposalId: string,
  ): Promise<ProposalStorageContext | null> {
    const [context] = await this.database
      .select({
        proposalId: proposals.id,
        proposalCode: proposals.code,
        year: proposals.year,
        customerSlug: customers.slug,
      })
      .from(proposals)
      .innerJoin(customers, eq(customers.id, proposals.customerId))
      .where(eq(proposals.id, proposalId))
      .limit(1);

    return context ?? null;
  }

  async updateProposalStatus(input: UpdateProposalStatusInput): Promise<Proposal> {
    const [proposal] = await this.database
      .update(proposals)
      .set({
        status: input.status,
        outcomeReason: input.outcomeReason,
        finalValueBrl:
          input.finalValueBrl === undefined
            ? undefined
            : input.finalValueBrl === null
              ? null
              : String(input.finalValueBrl),
        updatedAt: new Date(),
      })
      .where(eq(proposals.id, input.proposalId))
      .returning();

    if (!proposal) {
      throw new Error("Falha ao atualizar status da proposta");
    }

    return toDomain(proposal);
  }
}
