import { CreateAttachmentUploadUseCase } from "@/modules/attachments/application/use-cases/create-attachment-upload.use-case";
import { FinalizeAttachmentUseCase } from "@/modules/attachments/application/use-cases/finalize-attachment.use-case";
import { GetAttachmentDownloadUrlUseCase } from "@/modules/attachments/application/use-cases/get-attachment-download-url.use-case";
import { DrizzleAttachmentRepository } from "@/modules/attachments/infrastructure/repositories/drizzle-attachment.repository";
import { SupabaseStorageAdapter } from "@/modules/attachments/infrastructure/storage/supabase-storage.adapter";
import { DrizzleProposalRepository } from "@/modules/proposals/infrastructure/repositories/drizzle-proposal.repository";
import { db } from "@/shared/infrastructure/db/client";

export function buildAttachmentsComposition() {
  const proposalRepository = new DrizzleProposalRepository(db);
  const attachmentRepository = new DrizzleAttachmentRepository(db);
  const storagePort = new SupabaseStorageAdapter();

  return {
    createAttachmentUploadUseCase: new CreateAttachmentUploadUseCase(
      proposalRepository,
      storagePort,
    ),
    finalizeAttachmentUseCase: new FinalizeAttachmentUseCase(
      proposalRepository,
      attachmentRepository,
      storagePort,
    ),
    getAttachmentDownloadUrlUseCase: new GetAttachmentDownloadUrlUseCase(
      attachmentRepository,
      storagePort,
    ),
  };
}
