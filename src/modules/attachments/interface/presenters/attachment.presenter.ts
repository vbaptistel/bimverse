import type { Attachment } from "@/modules/attachments/domain/attachment";

export interface AttachmentPresenter {
  id: string;
  proposalId: string;
  revisionId: string | null;
  category: string;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  createdAt: string;
}

export function presentAttachment(attachment: Attachment): AttachmentPresenter {
  return {
    id: attachment.id,
    proposalId: attachment.proposalId,
    revisionId: attachment.revisionId,
    category: attachment.category,
    fileName: attachment.fileName,
    storagePath: attachment.storagePath,
    mimeType: attachment.mimeType,
    fileSizeBytes: attachment.fileSizeBytes,
    createdAt: attachment.createdAt.toISOString(),
  };
}
