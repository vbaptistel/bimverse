import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import type {
  CompanyLookup,
  CreateProposalRecordInput,
  ListProposalsFilters,
  ProposalRepositoryPort,
  ProposalStorageContext,
  UpdateProposalStatusInput,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { Proposal } from "@/modules/proposals/domain/proposal";
import {
  companies,
  proposals,
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
    companyId: row.companyId,
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

export class DrizzleProposalRepository implements ProposalRepositoryPort {
  constructor(private readonly database: Database) {}

  async findMany(filters: ListProposalsFilters = {}): Promise<Proposal[]> {
    const conditions: SQL<unknown>[] = [];

    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(proposals.code, term),
          ilike(proposals.projectName, term),
          ilike(proposals.invitationCode, term),
        )!,
      );
    }

    if (filters.status !== undefined && filters.status !== null) {
      conditions.push(eq(proposals.status, filters.status));
    }

    const query = this.database
      .select()
      .from(proposals)
      .orderBy(desc(proposals.createdAt), proposals.code);

    const rows =
      conditions.length > 0
        ? await query.where(
            conditions.length === 1 ? conditions[0] : and(...conditions),
          )
        : await query;

    return rows.map(toDomain);
  }

  async getCompanyById(companyId: string): Promise<CompanyLookup | null> {
    const [company] = await this.database
      .select({
        id: companies.id,
        slug: companies.slug,
      })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    return company ?? null;
  }

  async allocateNextSequence(companyId: string, year: number): Promise<number> {
    void year;

    return this.database.transaction(async (tx) => {
      const result = await tx.execute<{ seq: number }>(sql`
        INSERT INTO ${proposalSequences} (company_id, next_seq, updated_at)
        VALUES (${companyId}, 2, NOW())
        ON CONFLICT (company_id)
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
        companyId: input.companyId,
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

  async getProposalById(proposalId: string): Promise<Proposal | null> {
    const [proposal] = await this.database
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);

    return proposal ? toDomain(proposal) : null;
  }

  async getProposalStorageContext(
    proposalId: string,
  ): Promise<ProposalStorageContext | null> {
    const [context] = await this.database
      .select({
        proposalId: proposals.id,
        proposalCode: proposals.code,
        year: proposals.year,
        companySlug: companies.slug,
      })
      .from(proposals)
      .innerJoin(companies, eq(companies.id, proposals.companyId))
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
          input.finalValueBrl !== undefined
            ? String(input.finalValueBrl)
            : undefined,
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
