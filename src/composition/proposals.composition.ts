import { DrizzleAttachmentRepository } from "@/modules/attachments/infrastructure/repositories/drizzle-attachment.repository";
import { SupabaseStorageAdapter } from "@/modules/attachments/infrastructure/storage/supabase-storage.adapter";
import { DrizzleSupplierRepository } from "@/modules/suppliers/infrastructure/repositories/drizzle-supplier.repository";
import { CancelProposalRevisionUseCase } from "@/modules/proposals/application/use-cases/cancel-proposal-revision.use-case";
import { CloseProposalRevisionUseCase } from "@/modules/proposals/application/use-cases/close-proposal-revision.use-case";
import { CreateProposalUseCase } from "@/modules/proposals/application/use-cases/create-proposal.use-case";
import { CreateRevisionUseCase } from "@/modules/proposals/application/use-cases/create-revision.use-case";
import { GetProposalDetailUseCase } from "@/modules/proposals/application/use-cases/get-proposal-detail.use-case";
import { ListProposalsUseCase } from "@/modules/proposals/application/use-cases/list-proposals.use-case";
import { LinkProposalSupplierUseCase } from "@/modules/proposals/application/use-cases/link-proposal-supplier.use-case";
import { PrepareProposalSendUploadUseCase } from "@/modules/proposals/application/use-cases/prepare-proposal-send-upload.use-case";
import { PrepareRevisionDocumentUploadUseCase } from "@/modules/proposals/application/use-cases/prepare-revision-document-upload.use-case";
import { SendProposalWithFileUseCase } from "@/modules/proposals/application/use-cases/send-proposal-with-file.use-case";
import { StartProposalRevisionCycleUseCase } from "@/modules/proposals/application/use-cases/start-proposal-revision-cycle.use-case";
import { UnlinkProposalSupplierUseCase } from "@/modules/proposals/application/use-cases/unlink-proposal-supplier.use-case";
import { UpdateProposalBaseUseCase } from "@/modules/proposals/application/use-cases/update-proposal-base.use-case";
import { UpdateProposalSupplierLinkUseCase } from "@/modules/proposals/application/use-cases/update-proposal-supplier-link.use-case";
import { UpdateProposalStatusUseCase } from "@/modules/proposals/application/use-cases/update-proposal-status.use-case";
import { DrizzleActivityLogRepository } from "@/modules/proposals/infrastructure/repositories/drizzle-activity-log.repository";
import { DrizzleProposalRepository } from "@/modules/proposals/infrastructure/repositories/drizzle-proposal.repository";
import { DrizzleProposalSupplierRepository } from "@/modules/proposals/infrastructure/repositories/drizzle-proposal-supplier.repository";
import { DrizzleRevisionRepository } from "@/modules/proposals/infrastructure/repositories/drizzle-revision.repository";
import { db } from "@/shared/infrastructure/db/client";

export function buildProposalsComposition() {
  const proposalRepository = new DrizzleProposalRepository(db);
  const revisionRepository = new DrizzleRevisionRepository(db);
  const attachmentRepository = new DrizzleAttachmentRepository(db);
  const supplierRepository = new DrizzleSupplierRepository(db);
  const proposalSupplierRepository = new DrizzleProposalSupplierRepository(db);
  const activityLogRepository = new DrizzleActivityLogRepository(db);
  const storagePort = new SupabaseStorageAdapter();

  return {
    createProposalUseCase: new CreateProposalUseCase(
      proposalRepository,
      revisionRepository,
    ),
    createRevisionUseCase: new CreateRevisionUseCase(
      proposalRepository,
      revisionRepository,
    ),
    getProposalDetailUseCase: new GetProposalDetailUseCase(
      proposalRepository,
      revisionRepository,
      attachmentRepository,
      proposalSupplierRepository,
      supplierRepository,
      activityLogRepository,
    ),
    listProposalsUseCase: new ListProposalsUseCase(proposalRepository),
    updateProposalBaseUseCase: new UpdateProposalBaseUseCase(
      proposalRepository,
      activityLogRepository,
    ),
    startProposalRevisionCycleUseCase: new StartProposalRevisionCycleUseCase(
      proposalRepository,
      revisionRepository,
      proposalSupplierRepository,
      activityLogRepository,
    ),
    prepareRevisionDocumentUploadUseCase: new PrepareRevisionDocumentUploadUseCase(
      proposalRepository,
      revisionRepository,
      storagePort,
    ),
    prepareProposalSendUploadUseCase: new PrepareProposalSendUploadUseCase(
      proposalRepository,
      revisionRepository,
      storagePort,
    ),
    closeProposalRevisionUseCase: new CloseProposalRevisionUseCase(
      proposalRepository,
      revisionRepository,
      attachmentRepository,
      storagePort,
      activityLogRepository,
    ),
    sendProposalWithFileUseCase: new SendProposalWithFileUseCase(
      proposalRepository,
      revisionRepository,
      attachmentRepository,
      storagePort,
      activityLogRepository,
    ),
    cancelProposalRevisionUseCase: new CancelProposalRevisionUseCase(
      proposalRepository,
      revisionRepository,
      proposalSupplierRepository,
      attachmentRepository,
      activityLogRepository,
    ),
    linkProposalSupplierUseCase: new LinkProposalSupplierUseCase(
      proposalRepository,
      revisionRepository,
      supplierRepository,
      proposalSupplierRepository,
      activityLogRepository,
    ),
    unlinkProposalSupplierUseCase: new UnlinkProposalSupplierUseCase(
      proposalRepository,
      revisionRepository,
      proposalSupplierRepository,
      activityLogRepository,
    ),
    updateProposalSupplierLinkUseCase: new UpdateProposalSupplierLinkUseCase(
      proposalRepository,
      revisionRepository,
      proposalSupplierRepository,
      activityLogRepository,
    ),
    updateProposalStatusUseCase: new UpdateProposalStatusUseCase(
      proposalRepository,
      activityLogRepository,
    ),
    proposalRepository,
    revisionRepository,
    attachmentRepository,
    supplierRepository,
    proposalSupplierRepository,
    activityLogRepository,
    storagePort,
  };
}
