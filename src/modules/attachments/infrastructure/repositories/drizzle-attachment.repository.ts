import { desc, eq } from "drizzle-orm";

import type {
  AttachmentRepositoryPort,
  CreateAttachmentRecordInput,
} from "@/modules/attachments/application/ports/attachment-repository.port";
import type { Attachment } from "@/modules/attachments/domain/attachment";
import { attachments } from "@/shared/infrastructure/db/schema";
import type { db } from "@/shared/infrastructure/db/client";

type Database = typeof db;

function toDomain(row: typeof attachments.$inferSelect): Attachment {
  return {
    id: row.id,
    proposalId: row.proposalId,
    revisionId: row.revisionId,
    category: row.category,
    fileName: row.fileName,
    storagePath: row.storagePath,
    mimeType: row.mimeType,
    fileSizeBytes: row.fileSizeBytes,
    uploadedBy: row.uploadedBy,
    createdAt: row.createdAt,
  };
}

export class DrizzleAttachmentRepository implements AttachmentRepositoryPort {
  constructor(private readonly database: Database) {}

  async createAttachment(input: CreateAttachmentRecordInput): Promise<Attachment> {
    const [attachment] = await this.database
      .insert(attachments)
      .values({
        proposalId: input.proposalId,
        revisionId: input.revisionId,
        category: input.category,
        fileName: input.fileName,
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        fileSizeBytes: input.fileSizeBytes,
        uploadedBy: input.uploadedBy,
      })
      .returning();

    if (!attachment) {
      throw new Error("Falha ao persistir metadados do anexo");
    }

    return toDomain(attachment);
  }

  async findById(id: string): Promise<Attachment | null> {
    const [attachment] = await this.database
      .select()
      .from(attachments)
      .where(eq(attachments.id, id))
      .limit(1);

    return attachment ? toDomain(attachment) : null;
  }

  async findManyByProposalId(proposalId: string): Promise<Attachment[]> {
    const rows = await this.database
      .select()
      .from(attachments)
      .where(eq(attachments.proposalId, proposalId))
      .orderBy(desc(attachments.createdAt));

    return rows.map(toDomain);
  }
}
