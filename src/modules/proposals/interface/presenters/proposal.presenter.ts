import type { Attachment } from "@/modules/attachments/domain/attachment";
import type { Proposal, ProposalRevision } from "@/modules/proposals/domain/proposal";
import type {
  ProposalHistoryEntry,
  ProposalTimelineEntry,
} from "@/modules/proposals/application/use-cases/get-proposal-detail.use-case";
import type { PendingRevisionCycle } from "@/modules/proposals/application/use-cases/revision-cycle.utils";
import type { ProposalSupplierLink } from "@/modules/proposals/application/ports/proposal-supplier-repository.port";
import type {
  ProposalDetailRecord,
  ProposalListRecord,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { Supplier } from "@/modules/suppliers/application/ports/supplier-repository.port";
import type { ProposalStatus } from "@/shared/domain/types";

export interface ProposalPresenter {
  id: string;
  customerId: string;
  code: string;
  seqNumber: number;
  year: number;
  projectName: string;
  invitationCode: string | null;
  scopeDescription: string;
  status: ProposalStatus;
  dueDate: string | null;
  estimatedValueBrl: number | null;
  finalValueBrl: number | null;
  outcomeReason: string | null;
  createdAt: string;
  updatedAt: string;
  currentRevisionNumber: number | null;
  customer: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ProposalRevisionPresenter {
  id: string;
  proposalId: string;
  revisionNumber: number;
  reason: string | null;
  scopeChanges: string | null;
  discountBrl: number | null;
  discountPercent: number | null;
  valueBeforeBrl: number | null;
  valueAfterBrl: number | null;
  notes: string | null;
  createdAt: string;
}

export function presentProposal(
  proposal: Proposal | ProposalListRecord,
): ProposalPresenter {
  return {
    id: proposal.id,
    customerId: proposal.customerId,
    code: proposal.code,
    seqNumber: proposal.seqNumber,
    year: proposal.year,
    projectName: proposal.projectName,
    invitationCode: proposal.invitationCode,
    scopeDescription: proposal.scopeDescription,
    status: proposal.status,
    dueDate: proposal.dueDate,
    estimatedValueBrl: proposal.estimatedValueBrl,
    finalValueBrl: proposal.finalValueBrl,
    outcomeReason: proposal.outcomeReason,
    createdAt: proposal.createdAt.toISOString(),
    updatedAt: proposal.updatedAt.toISOString(),
    currentRevisionNumber:
      "currentRevisionNumber" in proposal
        ? (proposal.currentRevisionNumber ?? null)
        : null,
    customer: "customer" in proposal && proposal.customer ? proposal.customer : null,
  };
}

export function presentRevision(
  revision: ProposalRevision,
): ProposalRevisionPresenter {
  return {
    id: revision.id,
    proposalId: revision.proposalId,
    revisionNumber: revision.revisionNumber,
    reason: revision.reason,
    scopeChanges: revision.scopeChanges,
    discountBrl: revision.discountBrl,
    discountPercent: revision.discountPercent,
    valueBeforeBrl: revision.valueBeforeBrl,
    valueAfterBrl: revision.valueAfterBrl,
    notes: revision.notes,
    createdAt: revision.createdAt.toISOString(),
  };
}

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

export interface ProposalSupplierLinkPresenter {
  id: string;
  proposalId: string;
  revisionId: string | null;
  revisionNumber: number | null;
  supplierId: string;
  supplierLegalName: string;
  supplierSpecialty: string;
  roleDescription: string | null;
  quotedHourlyCostBrl: number | null;
  estimatedHours: number | null;
  quotedTotalBrl: number | null;
  createdAt: string;
}

function presentSupplierLink(link: ProposalSupplierLink): ProposalSupplierLinkPresenter {
  return {
    id: link.id,
    proposalId: link.proposalId,
    revisionId: link.revisionId,
    revisionNumber: link.revisionNumber,
    supplierId: link.supplierId,
    supplierLegalName: link.supplierLegalName,
    supplierSpecialty: link.supplierSpecialty,
    roleDescription: link.roleDescription,
    quotedHourlyCostBrl: link.quotedHourlyCostBrl,
    estimatedHours: link.estimatedHours,
    quotedTotalBrl: link.quotedTotalBrl,
    createdAt: link.createdAt.toISOString(),
  };
}

export interface SupplierOptionPresenter {
  id: string;
  legalName: string;
  specialty: string;
  hourlyCostBrl: number | null;
  active: boolean;
}

function presentSupplierOption(supplier: Supplier): SupplierOptionPresenter {
  return {
    id: supplier.id,
    legalName: supplier.legalName,
    specialty: supplier.specialty,
    hourlyCostBrl: supplier.hourlyCostBrl,
    active: supplier.active,
  };
}

export interface ProposalHistoryEntryPresenter {
  id: string;
  type: "status" | "revision" | "attachment" | "supplier" | "edition";
  title: string;
  description: string;
  createdAt: string;
}

function presentHistoryEntry(
  entry: ProposalHistoryEntry,
): ProposalHistoryEntryPresenter {
  return {
    id: entry.id,
    type: entry.type,
    title: entry.title,
    description: entry.description,
    createdAt: entry.createdAt.toISOString(),
  };
}

export interface ProposalTimelineEntryPresenter {
  id: string;
  title: string;
  date: string;
}

function presentTimelineEntry(
  entry: ProposalTimelineEntry,
): ProposalTimelineEntryPresenter {
  return {
    id: entry.id,
    title: entry.title,
    date: entry.date.toISOString(),
  };
}

export interface PendingRevisionCyclePresenter {
  cycleId: string;
  revisionId: string;
  revisionNumber: number;
  openedAt: string;
  snapshot: {
    scopeDescription: string;
    dueDate: string | null;
    estimatedValueBrl: number | null;
  };
}

function presentPendingRevisionCycle(
  cycle: PendingRevisionCycle,
): PendingRevisionCyclePresenter {
  return {
    cycleId: cycle.cycleId,
    revisionId: cycle.revisionId,
    revisionNumber: cycle.revisionNumber,
    openedAt: cycle.openedAt.toISOString(),
    snapshot: cycle.snapshot,
  };
}

export interface ProposalDetailPresenter {
  proposal: ProposalPresenter & {
    customerName: string;
    customerSlug: string;
  };
  currentValueBrl: number | null;
  revisions: ProposalRevisionPresenter[];
  attachments: AttachmentPresenter[];
  supplierLinks: ProposalSupplierLinkPresenter[];
  supplierOptions: SupplierOptionPresenter[];
  history: ProposalHistoryEntryPresenter[];
  timeline: ProposalTimelineEntryPresenter[];
  pendingRevisionCycle: PendingRevisionCyclePresenter | null;
}

function presentProposalDetailHeader(
  proposal: ProposalDetailRecord,
): ProposalDetailPresenter["proposal"] {
  return {
    ...presentProposal(proposal),
    customerName: proposal.customerName,
    customerSlug: proposal.customerSlug,
  };
}

export function presentProposalDetail(input: {
  proposal: ProposalDetailRecord;
  currentValueBrl: number | null;
  revisions: ProposalRevision[];
  attachments: Attachment[];
  supplierLinks: ProposalSupplierLink[];
  supplierOptions: Supplier[];
  history: ProposalHistoryEntry[];
  timeline: ProposalTimelineEntry[];
  pendingRevisionCycle: PendingRevisionCycle | null;
}): ProposalDetailPresenter {
  return {
    proposal: presentProposalDetailHeader(input.proposal),
    currentValueBrl: input.currentValueBrl,
    revisions: input.revisions.map(presentRevision),
    attachments: input.attachments.map(presentAttachment),
    supplierLinks: input.supplierLinks.map(presentSupplierLink),
    supplierOptions: input.supplierOptions.map(presentSupplierOption),
    history: input.history.map(presentHistoryEntry),
    timeline: input.timeline.map(presentTimelineEntry),
    pendingRevisionCycle: input.pendingRevisionCycle
      ? presentPendingRevisionCycle(input.pendingRevisionCycle)
      : null,
  };
}
