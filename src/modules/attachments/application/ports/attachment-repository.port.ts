import type { Attachment } from "@/modules/attachments/domain/attachment";
import type { AttachmentCategory } from "@/shared/domain/types";

export interface CreateAttachmentRecordInput {
  proposalId: string;
  revisionId?: string | null;
  category: AttachmentCategory;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedBy: string;
}

export interface AttachmentRepositoryPort {
  createAttachment(input: CreateAttachmentRecordInput): Promise<Attachment>;
  findById(id: string): Promise<Attachment | null>;
  findManyByProposalId(proposalId: string): Promise<Attachment[]>;
}
