export type ActivityEntityType = "proposal";

export interface ActivityLogEntry {
  id: string;
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: Date;
}

export interface CreateActivityLogEntryInput {
  entityType: ActivityEntityType;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdBy: string;
}

export interface ActivityLogRepositoryPort {
  create(input: CreateActivityLogEntryInput): Promise<ActivityLogEntry>;
  findManyByEntity(
    entityType: ActivityEntityType,
    entityId: string,
  ): Promise<ActivityLogEntry[]>;
}
