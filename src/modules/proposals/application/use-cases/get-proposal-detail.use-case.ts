import type { Attachment } from "@/modules/attachments/domain/attachment";
import type { AttachmentRepositoryPort } from "@/modules/attachments/application/ports/attachment-repository.port";
import type { ActivityLogEntry, ActivityLogRepositoryPort } from "@/modules/proposals/application/ports/activity-log-repository.port";
import type {
  ProposalDetailRecord,
  ProposalRepositoryPort,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { ProposalSupplierLink, ProposalSupplierRepositoryPort } from "@/modules/proposals/application/ports/proposal-supplier-repository.port";
import type { RevisionRepositoryPort } from "@/modules/proposals/application/ports/revision-repository.port";
import { findPendingRevisionCycle, type PendingRevisionCycle } from "@/modules/proposals/application/use-cases/revision-cycle.utils";
import type { ProposalRevision } from "@/modules/proposals/domain/proposal";
import type {
  Supplier,
  SupplierRepositoryPort,
} from "@/modules/suppliers/application/ports/supplier-repository.port";
import type { UseCase } from "@/shared/application/use-case";
import { NotFoundError } from "@/shared/domain/errors";

export interface ProposalHistoryEntry {
  id: string;
  type: "status" | "revision" | "attachment" | "supplier" | "edition";
  title: string;
  description: string;
  createdAt: Date;
}

export interface ProposalTimelineEntry {
  id: string;
  title: string;
  date: Date;
}

export interface GetProposalDetailInput {
  proposalId: string;
}

export interface GetProposalDetailOutput {
  proposal: ProposalDetailRecord;
  currentValueBrl: number | null;
  revisions: ProposalRevision[];
  attachments: Attachment[];
  supplierLinks: ProposalSupplierLink[];
  supplierOptions: Supplier[];
  activity: ActivityLogEntry[];
  history: ProposalHistoryEntry[];
  timeline: ProposalTimelineEntry[];
  pendingRevisionCycle: PendingRevisionCycle | null;
}

function parseStatusDate(metadata: Record<string, unknown>): Date | null {
  const rawStatusDate = metadata.statusDate;
  if (typeof rawStatusDate !== "string" || rawStatusDate.length === 0) {
    return null;
  }

  const parsed = new Date(`${rawStatusDate}T12:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function buildHistory(
  revisions: ProposalRevision[],
  attachments: Attachment[],
  activity: ActivityLogEntry[],
): ProposalHistoryEntry[] {
  const entries: ProposalHistoryEntry[] = [];

  for (const revision of revisions) {
    entries.push({
      id: `revision-${revision.id}`,
      type: "revision",
      title: `Revisão R${revision.revisionNumber}`,
      description: revision.reason ?? "Revisão registrada",
      createdAt: revision.createdAt,
    });
  }

  for (const attachment of attachments) {
    entries.push({
      id: `attachment-${attachment.id}`,
      type: "attachment",
      title: `Anexo enviado (${attachment.category})`,
      description: attachment.fileName,
      createdAt: attachment.createdAt,
    });
  }

  for (const event of activity) {
    if (event.action === "status_changed") {
      const statusDate = parseStatusDate(event.metadata);
      entries.push({
        id: `activity-${event.id}`,
        type: "status",
        title: "Status alterado",
        description: `${String(event.metadata.from ?? "—")} -> ${String(event.metadata.to ?? "—")}`,
        createdAt: statusDate ?? event.createdAt,
      });
      continue;
    }

    if (event.action === "proposal_base_updated") {
      entries.push({
        id: `activity-${event.id}`,
        type: "edition",
        title: "Dados da proposta atualizados",
        description: "Campos comerciais da proposta foram alterados.",
        createdAt: event.createdAt,
      });
      continue;
    }

    if (
      event.action === "supplier_linked" ||
      event.action === "supplier_unlinked" ||
      event.action === "supplier_link_updated"
    ) {
      const titleByAction: Record<string, string> = {
        supplier_linked: "Fornecedor vinculado",
        supplier_unlinked: "Fornecedor desvinculado",
        supplier_link_updated: "Fornecedor atualizado",
      };

      entries.push({
        id: `activity-${event.id}`,
        type: "supplier",
        title: titleByAction[event.action] ?? "Fornecedor atualizado",
        description: String(event.metadata.supplierLegalName ?? "Fornecedor"),
        createdAt: event.createdAt,
      });
    }
  }

  return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

function buildTimeline(
  proposalCreatedAt: Date,
  proposalDueDate: string | null,
  proposalUpdatedAt: Date,
  proposalStatus: string,
  revisions: ProposalRevision[],
  attachments: Attachment[],
  activity: ActivityLogEntry[],
): ProposalTimelineEntry[] {
  const entries: ProposalTimelineEntry[] = [
    {
      id: "proposal-created",
      title: "Proposta criada",
      date: proposalCreatedAt,
    },
  ];

  if (proposalDueDate) {
    entries.push({
      id: "proposal-due-date",
      title: `Prazo definido para ${proposalDueDate}`,
      date: new Date(`${proposalDueDate}T12:00:00.000Z`),
    });
  }

  for (const event of activity) {
    if (event.action === "status_changed" && event.metadata.to === "em_revisao") {
      entries.push({
        id: `status-in-review-${event.id}`,
        title: "Entrou em revisão",
        date: event.createdAt,
      });
    }

    if (
      event.action === "status_changed" &&
      (event.metadata.to === "enviada" || event.metadata.to === "ganha")
    ) {
      const statusTo = event.metadata.to;
      const statusDate = parseStatusDate(event.metadata) ?? event.createdAt;

      entries.push({
        id: `status-${String(statusTo)}-${event.id}`,
        title: statusTo === "enviada" ? "Proposta enviada" : "Proposta ganha",
        date: statusDate,
      });
    }

    if (event.action === "revision_cycle_closed") {
      const revisionNumber = event.metadata.revisionNumber;
      entries.push({
        id: `revision-close-${event.id}`,
        title:
          typeof revisionNumber === "number"
            ? `Revisão R${revisionNumber} fechada`
            : "Revisão fechada",
        date: event.createdAt,
      });
    }
  }

  for (const revision of revisions) {
    entries.push({
      id: `revision-timeline-${revision.id}`,
      title: `Revisão R${revision.revisionNumber} registrada`,
      date: revision.createdAt,
    });
  }

  for (const attachment of attachments.filter(
    (attachment) => attachment.category === "proposta_word",
  )) {
    entries.push({
      id: `attachment-proposal-word-${attachment.id}`,
      title: "Arquivo da proposta atualizado",
      date: attachment.createdAt,
    });
  }

  entries.push({
    id: "proposal-status-now",
    title: `Status atual: ${proposalStatus}`,
    date: proposalUpdatedAt,
  });

  return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export class GetProposalDetailUseCase
  implements UseCase<GetProposalDetailInput, GetProposalDetailOutput>
{
  constructor(
    private readonly proposalRepository: ProposalRepositoryPort,
    private readonly revisionRepository: RevisionRepositoryPort,
    private readonly attachmentRepository: AttachmentRepositoryPort,
    private readonly proposalSupplierRepository: ProposalSupplierRepositoryPort,
    private readonly supplierRepository: SupplierRepositoryPort,
    private readonly activityLogRepository: ActivityLogRepositoryPort,
  ) {}

  async execute(input: GetProposalDetailInput): Promise<GetProposalDetailOutput> {
    const proposal = await this.proposalRepository.getDetailById(input.proposalId);
    if (!proposal) {
      throw new NotFoundError("Proposta não encontrada");
    }

    const [
      revisions,
      attachments,
      supplierLinks,
      supplierOptions,
      activity,
    ] = await Promise.all([
      this.revisionRepository.findManyByProposalId(proposal.id),
      this.attachmentRepository.findManyByProposalId(proposal.id),
      this.proposalSupplierRepository.findManyByProposalId(proposal.id),
      this.supplierRepository.findMany(),
      this.activityLogRepository.findManyByEntity("proposal", proposal.id),
    ]);

    const latestRevision = revisions[0] ?? null;
    const currentValueBrl =
      latestRevision?.valueAfterBrl ??
      proposal.finalValueBrl ??
      proposal.estimatedValueBrl;

    const pendingRevisionCycle = findPendingRevisionCycle(activity);
    const history = buildHistory(revisions, attachments, activity);
    const timeline = buildTimeline(
      proposal.createdAt,
      proposal.dueDate,
      proposal.updatedAt,
      proposal.status,
      revisions,
      attachments,
      activity,
    );

    return {
      proposal,
      currentValueBrl,
      revisions,
      attachments,
      supplierLinks,
      supplierOptions,
      activity,
      history,
      timeline,
      pendingRevisionCycle,
    };
  }
}
