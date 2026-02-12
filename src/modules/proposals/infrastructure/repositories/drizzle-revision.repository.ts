import { desc, eq } from "drizzle-orm";

import type {
  CreateRevisionRecordInput,
  RevisionRepositoryPort,
} from "@/modules/proposals/application/ports/revision-repository.port";
import type { ProposalRevision } from "@/modules/proposals/domain/proposal";
import { proposalRevisions } from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function parseOptionalNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  return Number(value);
}

function toDomain(row: typeof proposalRevisions.$inferSelect): ProposalRevision {
  return {
    id: row.id,
    proposalId: row.proposalId,
    revisionNumber: row.revisionNumber,
    reason: row.reason,
    scopeChanges: row.scopeChanges,
    discountBrl: parseOptionalNumber(row.discountBrl),
    discountPercent: parseOptionalNumber(row.discountPercent),
    valueBeforeBrl: parseOptionalNumber(row.valueBeforeBrl),
    valueAfterBrl: parseOptionalNumber(row.valueAfterBrl),
    notes: row.notes,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

export class DrizzleRevisionRepository implements RevisionRepositoryPort {
  constructor(private readonly database: Database) {}

  async findById(revisionId: string): Promise<ProposalRevision | null> {
    const [revision] = await this.database
      .select()
      .from(proposalRevisions)
      .where(eq(proposalRevisions.id, revisionId))
      .limit(1);

    return revision ? toDomain(revision) : null;
  }

  async findManyByProposalId(proposalId: string): Promise<ProposalRevision[]> {
    const rows = await this.database
      .select()
      .from(proposalRevisions)
      .where(eq(proposalRevisions.proposalId, proposalId))
      .orderBy(desc(proposalRevisions.revisionNumber), desc(proposalRevisions.createdAt));

    return rows.map(toDomain);
  }

  async getNextRevisionNumber(proposalId: string): Promise<number> {
    const [latestRevision] = await this.database
      .select({ revisionNumber: proposalRevisions.revisionNumber })
      .from(proposalRevisions)
      .where(eq(proposalRevisions.proposalId, proposalId))
      .orderBy(desc(proposalRevisions.revisionNumber))
      .limit(1);

    if (!latestRevision) {
      return 0;
    }

    return latestRevision.revisionNumber + 1;
  }

  async createRevision(input: CreateRevisionRecordInput): Promise<ProposalRevision> {
    const [revision] = await this.database
      .insert(proposalRevisions)
      .values({
        proposalId: input.proposalId,
        revisionNumber: input.revisionNumber,
        reason: input.reason,
        scopeChanges: input.scopeChanges,
        discountBrl:
          input.discountBrl != null ? String(input.discountBrl) : null,
        discountPercent:
          input.discountPercent != null ? String(input.discountPercent) : null,
        valueBeforeBrl:
          input.valueBeforeBrl != null ? String(input.valueBeforeBrl) : null,
        valueAfterBrl:
          input.valueAfterBrl != null ? String(input.valueAfterBrl) : null,
        notes: input.notes,
        createdBy: input.createdBy,
      })
      .returning();

    if (!revision) {
      throw new Error("Falha ao criar revisão");
    }

    return toDomain(revision);
  }
}
