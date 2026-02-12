import { desc, eq, and } from "drizzle-orm";

import type {
  ActivityEntityType,
  ActivityLogEntry,
  ActivityLogRepositoryPort,
  CreateActivityLogEntryInput,
} from "@/modules/proposals/application/ports/activity-log-repository.port";
import { activityLog } from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function toDomain(row: typeof activityLog.$inferSelect): ActivityLogEntry {
  return {
    id: row.id,
    entityType: row.entityType as ActivityEntityType,
    entityId: row.entityId,
    action: row.action,
    metadata: row.metadata,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

export class DrizzleActivityLogRepository implements ActivityLogRepositoryPort {
  constructor(private readonly database: Database) {}

  async create(input: CreateActivityLogEntryInput): Promise<ActivityLogEntry> {
    const [entry] = await this.database
      .insert(activityLog)
      .values({
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        metadata: input.metadata ?? {},
        createdBy: input.createdBy,
      })
      .returning();

    if (!entry) {
      throw new Error("Falha ao registrar atividade");
    }

    return toDomain(entry);
  }

  async findManyByEntity(
    entityType: ActivityEntityType,
    entityId: string,
  ): Promise<ActivityLogEntry[]> {
    const rows = await this.database
      .select()
      .from(activityLog)
      .where(and(eq(activityLog.entityType, entityType), eq(activityLog.entityId, entityId)))
      .orderBy(desc(activityLog.createdAt));

    return rows.map(toDomain);
  }
}
