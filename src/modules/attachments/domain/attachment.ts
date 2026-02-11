import type { AttachmentCategory } from "@/shared/domain/types";

export interface Attachment {
  id: string;
  proposalId: string;
  revisionId: string | null;
  category: AttachmentCategory;
  fileName: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  createdAt: Date;
}
