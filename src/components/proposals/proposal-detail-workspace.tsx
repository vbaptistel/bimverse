"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  FileClock,
  FileDown,
  FileText,
  History,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  UsersRound,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createAttachmentUploadAction,
  finalizeAttachmentAction,
  getAttachmentDownloadUrlAction,
  getAttachmentOpenPath,
} from "@/modules/attachments/interface";
import {
  cancelProposalRevisionAction,
  closeProposalRevisionAction,
  linkProposalSupplierAction,
  prepareProposalSendUploadAction,
  prepareRevisionDocumentUploadAction,
  type ProposalDetailPresenter,
  sendProposalWithFileAction,
  startProposalRevisionCycleAction,
  unlinkProposalSupplierAction,
  updateProposalBaseAction,
  type UpdateProposalBaseSchema,
  updateProposalBaseSchema,
  updateProposalStatusAction,
  updateProposalSupplierLinkAction,
} from "@/modules/proposals/interface";
import { formatCurrencyBrl, parseCurrencyBrlInput } from "@/shared/domain/currency";
import type { ManualAttachmentCategory, ProposalStatus } from "@/shared/domain/types";
import { MANUAL_ATTACHMENT_CATEGORIES } from "@/shared/domain/types";
import { createSupabaseBrowserClient } from "@/shared/infrastructure/supabase/browser-client";

const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  recebida: "Recebida",
  em_elaboracao: "Em elaboração",
  enviada: "Enviada",
  em_revisao: "Em revisão",
  ganha: "Ganha",
  perdida: "Perdida",
  cancelada: "Cancelada",
};

const PROPOSAL_STATUS_BADGE_VARIANTS: Record<
  ProposalStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  recebida: "outline",
  em_elaboracao: "secondary",
  enviada: "default",
  em_revisao: "secondary",
  ganha: "default",
  perdida: "destructive",
  cancelada: "destructive",
};

type ManualProposalStatus =
  | "recebida"
  | "em_elaboracao"
  | "enviada"
  | "ganha"
  | "perdida"
  | "cancelada";

const MANUAL_STATUS_TRANSITIONS: Record<ProposalStatus, ManualProposalStatus[]> = {
  recebida: ["em_elaboracao", "cancelada"],
  em_elaboracao: ["enviada", "cancelada"],
  enviada: ["ganha", "perdida", "cancelada"],
  em_revisao: [],
  ganha: [],
  perdida: [],
  cancelada: [],
};

interface ProposalDetailWorkspaceProps {
  detail: ProposalDetailPresenter;
}

const closeRevisionFormSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Motivo deve ter pelo menos 3 caracteres")
    .max(300),
  scopeChanges: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

type CloseRevisionFormValues = z.infer<typeof closeRevisionFormSchema>;

interface AttachmentUploadFormValues {
  revisionId: string | null;
  category: ManualAttachmentCategory;
}

interface SupplierLinkFormValues {
  supplierId: string;
  roleDescription: string | null;
  quotedHourlyCostBrl: number | null;
  estimatedHours: number | null;
  quotedTotalBrl: number | null;
}

interface SupplierEditFormValues {
  linkId: string;
  roleDescription: string | null;
  quotedHourlyCostBrl: number | null;
  estimatedHours: number | null;
  quotedTotalBrl: number | null;
}

interface ProposalStatusFormValues {
  proposalId: string;
  status: ProposalStatus;
  statusDate: string | null;
}

function toNullableText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toInputDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ProposalDetailWorkspace({ detail }: ProposalDetailWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAttachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [isSupplierEditModalOpen, setSupplierEditModalOpen] = useState(false);
  const [editingSupplierLinkId, setEditingSupplierLinkId] = useState<string | null>(
    null,
  );
  const [selectedSupplierRevisionId, setSelectedSupplierRevisionId] = useState<
    string | null
  >(null);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
  const [isTimelineModalOpen, setTimelineModalOpen] = useState(false);

  const isFinalStatus =
    detail.proposal.status === "ganha" ||
    detail.proposal.status === "perdida" ||
    detail.proposal.status === "cancelada";

  const isInReview = detail.proposal.status === "em_revisao";
  const canStartRevision = detail.proposal.status === "enviada";
  const canEditCriticalFields = isInReview && !isFinalStatus;

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    [],
  );

  const baseForm = useForm<UpdateProposalBaseSchema>({
    resolver: zodResolver(updateProposalBaseSchema),
    defaultValues: {
      proposalId: detail.proposal.id,
      projectName: detail.proposal.projectName,
      invitationCode: detail.proposal.invitationCode,
      scopeDescription: detail.proposal.scopeDescription,
      dueDate: detail.proposal.dueDate,
      estimatedValueBrl: detail.proposal.estimatedValueBrl,
    },
  });

  const statusForm = useForm<ProposalStatusFormValues>({
    defaultValues: {
      proposalId: detail.proposal.id,
      status: detail.proposal.status,
      statusDate: null,
    },
  });

  const closeRevisionForm = useForm<CloseRevisionFormValues>({
    resolver: zodResolver(closeRevisionFormSchema),
    defaultValues: {
      reason: "",
      scopeChanges: null,
      notes: null,
    },
  });

  const attachmentForm = useForm<AttachmentUploadFormValues>({
    defaultValues: {
      revisionId: null,
      category: "referencia",
    },
  });

  const supplierLinkForm = useForm<SupplierLinkFormValues>({
    defaultValues: {
      supplierId: "",
      roleDescription: null,
      quotedHourlyCostBrl: null,
      estimatedHours: null,
      quotedTotalBrl: null,
    },
  });

  const supplierEditForm = useForm<SupplierEditFormValues>({
    defaultValues: {
      linkId: "",
      roleDescription: null,
      quotedHourlyCostBrl: null,
      estimatedHours: null,
      quotedTotalBrl: null,
    },
  });

  useEffect(() => {
    baseForm.reset({
      proposalId: detail.proposal.id,
      projectName: detail.proposal.projectName,
      invitationCode: detail.proposal.invitationCode,
      scopeDescription: detail.proposal.scopeDescription,
      dueDate: detail.proposal.dueDate,
      estimatedValueBrl: detail.proposal.estimatedValueBrl,
    });

    statusForm.reset({
      proposalId: detail.proposal.id,
      status: detail.proposal.status,
      statusDate: null,
    });
  }, [detail, baseForm, statusForm]);

  const revisionById = useMemo(
    () => new Map(detail.revisions.map((revision) => [revision.id, revision])),
    [detail.revisions],
  );
  const proposalFileByRevisionId = useMemo(() => {
    const byRevisionId = new Map<string, (typeof detail.proposalFiles)[number]>();

    for (const proposalFile of detail.proposalFiles) {
      if (!proposalFile.revisionId) {
        continue;
      }

      const current = byRevisionId.get(proposalFile.revisionId);
      if (!current) {
        byRevisionId.set(proposalFile.revisionId, proposalFile);
        continue;
      }

      if (
        new Date(proposalFile.createdAt).getTime() >
        new Date(current.createdAt).getTime()
      ) {
        byRevisionId.set(proposalFile.revisionId, proposalFile);
      }
    }

    return byRevisionId;
  }, [detail.proposalFiles]);

  const currentEstimatedValueBrl = baseForm.watch("estimatedValueBrl");
  const latestRevisionValueBrl = useMemo(() => {
    const latestRevision = detail.revisions.reduce<
      (typeof detail.revisions)[number] | null
    >((latest, revision) => {
      if (!latest || revision.revisionNumber > latest.revisionNumber) {
        return revision;
      }
      return latest;
    }, null);

    if (!latestRevision) {
      return null;
    }

    return latestRevision.valueAfterBrl ?? latestRevision.valueBeforeBrl ?? null;
  }, [detail]);

  const revisionDiscountPreview = useMemo(() => {
    if (
      latestRevisionValueBrl === null ||
      currentEstimatedValueBrl == null ||
      latestRevisionValueBrl <= 0 ||
      currentEstimatedValueBrl >= latestRevisionValueBrl
    ) {
      return null;
    }

    const discountBrl = Number((latestRevisionValueBrl - currentEstimatedValueBrl).toFixed(2));
    const discountPercent = Number(
      ((discountBrl / latestRevisionValueBrl) * 100).toFixed(2),
    );

    return { discountBrl, discountPercent };
  }, [latestRevisionValueBrl, currentEstimatedValueBrl]);

  const latestRevisionNumber = useMemo(
    () =>
      detail.revisions.reduce(
        (maxRevisionNumber, revision) =>
          Math.max(maxRevisionNumber, revision.revisionNumber),
        0,
      ),
    [detail.revisions],
  );
  const availableStatusOptions = useMemo<ProposalStatus[]>(() => {
    if (isInReview) {
      return ["em_revisao"];
    }

    return [
      detail.proposal.status,
      ...MANUAL_STATUS_TRANSITIONS[detail.proposal.status].filter(
        (status) => status !== detail.proposal.status,
      ),
    ];
  }, [detail.proposal.status, isInReview]);
  const selectedStatusInModal = statusForm.watch("status");
  const statusRequiresReasonInModal =
    selectedStatusInModal === "perdida" || selectedStatusInModal === "cancelada";
  const statusRequiresDateInModal =
    selectedStatusInModal === "enviada" || selectedStatusInModal === "ganha";
  const isSendingToEnviadaInModal =
    selectedStatusInModal === "enviada" && detail.proposal.status !== "enviada";
  const statusDateLabelInModal =
    selectedStatusInModal === "enviada" ? "Data de envio" : "Data de ganho";
  const baseRevision = useMemo(
    () => detail.revisions.find((revision) => revision.revisionNumber === 0) ?? null,
    [detail.revisions],
  );
  const currentSupplierRevisionId = useMemo(() => {
    if (detail.proposal.status === "em_revisao") {
      return detail.pendingRevisionCycle?.revisionId ?? null;
    }

    if (detail.proposal.status === "em_elaboracao") {
      return baseRevision?.id ?? null;
    }

    return null;
  }, [baseRevision, detail.pendingRevisionCycle, detail.proposal.status]);
  const canManageSuppliersByStatus =
    detail.proposal.status === "em_elaboracao" || detail.proposal.status === "em_revisao";
  const selectedSupplierRevisionNumber = selectedSupplierRevisionId
    ? revisionById.get(selectedSupplierRevisionId)?.revisionNumber ?? null
    : null;
  const isViewingCurrentSupplierRevision =
    selectedSupplierRevisionId !== null &&
    currentSupplierRevisionId !== null &&
    selectedSupplierRevisionId === currentSupplierRevisionId;
  const canManageSupplierLinks =
    canManageSuppliersByStatus &&
    currentSupplierRevisionId !== null &&
    isViewingCurrentSupplierRevision;
  const selectedSupplierId = supplierLinkForm.watch("supplierId");
  const selectedSupplierHourlyCost = supplierLinkForm.watch("quotedHourlyCostBrl");
  const selectedSupplierEstimatedHours = supplierLinkForm.watch("estimatedHours");
  const selectedSupplierQuotedTotal = supplierLinkForm.watch("quotedTotalBrl");
  const selectedEditSupplierHourlyCost = supplierEditForm.watch("quotedHourlyCostBrl");
  const selectedEditSupplierEstimatedHours = supplierEditForm.watch("estimatedHours");
  const selectedEditSupplierQuotedTotal = supplierEditForm.watch("quotedTotalBrl");

  const supplierOptionsById = useMemo(
    () => new Map(detail.supplierOptions.map((supplier) => [supplier.id, supplier])),
    [detail.supplierOptions],
  );
  const selectedSupplierLinks = useMemo(
    () =>
      selectedSupplierRevisionId
        ? detail.supplierLinks.filter(
          (link) => link.revisionId === selectedSupplierRevisionId,
        )
        : [],
    [detail.supplierLinks, selectedSupplierRevisionId],
  );
  const currentRevisionLinkedSupplierIds = useMemo(
    () =>
      new Set(
        detail.supplierLinks
          .filter((link) => link.revisionId === currentSupplierRevisionId)
          .map((link) => link.supplierId),
      ),
    [currentSupplierRevisionId, detail.supplierLinks],
  );
  const editingSupplierLink = useMemo(
    () =>
      editingSupplierLinkId
        ? detail.supplierLinks.find((link) => link.id === editingSupplierLinkId) ?? null
        : null,
    [detail.supplierLinks, editingSupplierLinkId],
  );
  const suppliersQuotedTotalBrl = useMemo(
    () =>
      Number(
        selectedSupplierLinks
          .reduce((sum, link) => sum + (link.quotedTotalBrl ?? 0), 0)
          .toFixed(2),
      ),
    [selectedSupplierLinks],
  );

  useEffect(() => {
    const currentStatusDate = statusForm.getValues("statusDate");

    if (!statusRequiresDateInModal) {
      if (currentStatusDate !== null) {
        statusForm.setValue("statusDate", null, { shouldDirty: false });
      }
      return;
    }

    if (currentStatusDate) {
      return;
    }

    statusForm.setValue("statusDate", toInputDateValue(new Date()), {
      shouldDirty: false,
    });
  }, [statusRequiresDateInModal, statusForm]);

  useEffect(() => {
    if (detail.revisions.length === 0) {
      if (selectedSupplierRevisionId !== null) {
        setSelectedSupplierRevisionId(null);
      }
      return;
    }

    if (
      selectedSupplierRevisionId !== null &&
      revisionById.has(selectedSupplierRevisionId)
    ) {
      return;
    }

    setSelectedSupplierRevisionId(currentSupplierRevisionId ?? detail.revisions[0]!.id);
  }, [
    currentSupplierRevisionId,
    detail.revisions,
    revisionById,
    selectedSupplierRevisionId,
  ]);

  useEffect(() => {
    if (!selectedSupplierId) {
      supplierLinkForm.setValue("roleDescription", null, { shouldDirty: false });
      supplierLinkForm.setValue("quotedHourlyCostBrl", null, { shouldDirty: false });
      return;
    }

    const supplier = supplierOptionsById.get(selectedSupplierId);
    if (!supplier) {
      return;
    }

    supplierLinkForm.setValue("roleDescription", toNullableText(supplier.specialty), {
      shouldDirty: false,
    });
    supplierLinkForm.setValue("quotedHourlyCostBrl", supplier.hourlyCostBrl ?? null, {
      shouldDirty: false,
    });
  }, [selectedSupplierId, supplierLinkForm, supplierOptionsById]);

  useEffect(() => {
    if (
      selectedSupplierHourlyCost === null ||
      selectedSupplierHourlyCost === undefined ||
      selectedSupplierEstimatedHours === null ||
      selectedSupplierEstimatedHours === undefined
    ) {
      supplierLinkForm.setValue("quotedTotalBrl", null, {
        shouldDirty: false,
      });
      return;
    }

    const quotedTotal = Number(
      (selectedSupplierHourlyCost * selectedSupplierEstimatedHours).toFixed(2),
    );

    supplierLinkForm.setValue("quotedTotalBrl", quotedTotal, {
      shouldDirty: false,
    });
  }, [selectedSupplierHourlyCost, selectedSupplierEstimatedHours, supplierLinkForm]);

  useEffect(() => {
    if (
      selectedEditSupplierHourlyCost === null ||
      selectedEditSupplierHourlyCost === undefined ||
      selectedEditSupplierEstimatedHours === null ||
      selectedEditSupplierEstimatedHours === undefined
    ) {
      supplierEditForm.setValue("quotedTotalBrl", null, {
        shouldDirty: false,
      });
      return;
    }

    const quotedTotal = Number(
      (selectedEditSupplierHourlyCost * selectedEditSupplierEstimatedHours).toFixed(2),
    );

    supplierEditForm.setValue("quotedTotalBrl", quotedTotal, {
      shouldDirty: false,
    });
  }, [
    selectedEditSupplierHourlyCost,
    selectedEditSupplierEstimatedHours,
    supplierEditForm,
  ]);

  const handleBaseSave = baseForm.handleSubmit((values) => {
    const criticalFieldsChanged =
      detail.proposal.scopeDescription !== values.scopeDescription.trim() ||
      detail.proposal.dueDate !== (values.dueDate || null) ||
      detail.proposal.estimatedValueBrl !== (values.estimatedValueBrl ?? null);

    if (criticalFieldsChanged && !isInReview) {
      toast.info(
        "Para alterar escopo, prazo ou valor estimado, clique em Criar nova revisão.",
      );
      return;
    }

    startTransition(async () => {
      const result = await updateProposalBaseAction({
        ...values,
        invitationCode: toNullableText(values.invitationCode),
        dueDate: values.dueDate || null,
        estimatedValueBrl: values.estimatedValueBrl ?? null,
      });

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
        return;
      }

      toast.success("Proposta atualizada com sucesso.");
      router.refresh();
    });
  });

  const closeStatusModal = () => {
    setStatusModalOpen(false);
    setStatusReason("");
    statusForm.reset({
      proposalId: detail.proposal.id,
      status: detail.proposal.status,
      statusDate: null,
    });

    const statusFileInput = document.getElementById(
      "statusProposalFile",
    ) as HTMLInputElement | null;
    if (statusFileInput) {
      statusFileInput.value = "";
    }
  };

  const handleStartRevision = () => {
    startTransition(async () => {
      const result = await startProposalRevisionCycleAction({
        proposalId: detail.proposal.id,
      });

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
        return;
      }

      toast.success("Nova revisão iniciada. Campos críticos liberados para edição.");
      router.refresh();
    });
  };

  const handleStatusSave = statusForm.handleSubmit((values) => {
    if (values.status === "em_revisao") {
      toast.info(
        "Use o botão Criar nova revisão para colocar a proposta em revisão.",
      );
      return;
    }

    const nextStatus = values.status as ManualProposalStatus;
    if (nextStatus === detail.proposal.status) {
      closeStatusModal();
      toast.info("Nenhuma mudança de status para salvar.");
      return;
    }

    const requiresReason = nextStatus === "perdida" || nextStatus === "cancelada";
    const requiresStatusDate = nextStatus === "enviada" || nextStatus === "ganha";
    const reason = toNullableText(statusReason);
    const statusDate = requiresStatusDate ? values.statusDate || null : null;
    if (requiresReason && !reason) {
      toast.error("Motivo é obrigatório para status perdida ou cancelada.");
      return;
    }

    startTransition(async () => {
      if (nextStatus === "enviada") {
        const fileInput = document.getElementById(
          "statusProposalFile",
        ) as HTMLInputElement | null;
        const file = fileInput?.files?.[0];

        if (!file) {
          toast.error("Selecione o arquivo principal da proposta.");
          return;
        }

        const prepared = await prepareProposalSendUploadAction({
          proposalId: values.proposalId,
          fileName: file.name,
          fileSizeBytes: file.size,
          mimeType: file.type,
        });

        if (!prepared.success) {
          toast.error(`Erro ao preparar upload: ${prepared.error}`);
          return;
        }

        const supabase = createSupabaseBrowserClient();
        const uploadResult = await supabase.storage
          .from("proposal-attachments")
          .uploadToSignedUrl(
            prepared.data.path,
            prepared.data.token,
            file,
          );

        if (uploadResult.error) {
          toast.error(`Erro no upload: ${uploadResult.error.message}`);
          return;
        }

        const sendResult = await sendProposalWithFileAction({
          proposalId: values.proposalId,
          fileName: file.name,
          storagePath: prepared.data.path,
          mimeType: file.type,
          fileSizeBytes: file.size,
          statusDate,
        });

        if (!sendResult.success) {
          toast.error(`Erro: ${sendResult.error}`);
          return;
        }

        closeStatusModal();
        toast.success(
          `Status atualizado para ${PROPOSAL_STATUS_LABELS[sendResult.data.proposal.status]}.`,
        );
        router.refresh();
        return;
      }

      const result = await updateProposalStatusAction({
        proposalId: values.proposalId,
        status: nextStatus,
        outcomeReason: requiresReason ? reason : null,
        statusDate,
      });

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
        return;
      }

      closeStatusModal();
      toast.success(
        `Status atualizado para ${PROPOSAL_STATUS_LABELS[result.data.status]}.`,
      );
      router.refresh();
    });
  });

  const handleCloseRevision = closeRevisionForm.handleSubmit((values) => {
    startTransition(async () => {
      const baseValues = baseForm.getValues();
      const criticalFieldsChanged =
        detail.proposal.scopeDescription !== baseValues.scopeDescription.trim() ||
        detail.proposal.dueDate !== (baseValues.dueDate || null) ||
        detail.proposal.estimatedValueBrl !== (baseValues.estimatedValueBrl ?? null);

      if (criticalFieldsChanged) {
        const updatedBase = await updateProposalBaseAction({
          ...baseValues,
          invitationCode: toNullableText(baseValues.invitationCode),
          dueDate: baseValues.dueDate || null,
          estimatedValueBrl: baseValues.estimatedValueBrl ?? null,
        });

        if (!updatedBase.success) {
          toast.error(
            `Erro ao salvar valor/escopo/prazo antes do fechamento: ${updatedBase.error}`,
          );
          return;
        }
      }

      const fileInput = document.getElementById(
        "revisionDocumentFile",
      ) as HTMLInputElement | null;
      const file = fileInput?.files?.[0];

      if (!file) {
        toast.error("Selecione o arquivo da proposta atualizada.");
        return;
      }

      const prepared = await prepareRevisionDocumentUploadAction({
        proposalId: detail.proposal.id,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
      });

      if (!prepared.success) {
        toast.error(`Erro ao preparar upload: ${prepared.error}`);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const uploadResult = await supabase.storage
        .from("proposal-attachments")
        .uploadToSignedUrl(
          prepared.data.path,
          prepared.data.token,
          file,
        );

      if (uploadResult.error) {
        toast.error(`Erro no upload: ${uploadResult.error.message}`);
        return;
      }

      const result = await closeProposalRevisionAction({
        proposalId: detail.proposal.id,
        reason: values.reason,
        scopeChanges: toNullableText(values.scopeChanges),
        notes: toNullableText(values.notes),
        fileName: file.name,
        storagePath: prepared.data.path,
        mimeType: file.type,
        fileSizeBytes: file.size,
      });

      if (!result.success) {
        toast.error(`Erro ao fechar revisão: ${result.error}`);
        return;
      }

      toast.success(
        `Revisão R${result.data.revision.revisionNumber} fechada com sucesso.`,
      );
      closeRevisionForm.reset();
      fileInput!.value = "";
      router.refresh();
    });
  });

  const handleCancelRevision = () => {
    const confirmed = window.confirm(
      "Cancelar revisão atual? As alterações críticas serão revertidas.",
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await cancelProposalRevisionAction({
        proposalId: detail.proposal.id,
      });

      if (!result.success) {
        toast.error(`Erro ao cancelar revisão: ${result.error}`);
        return;
      }

      toast.success("Revisão cancelada e alterações críticas revertidas.");
      router.refresh();
    });
  };

  const closeAttachmentModal = () => {
    setAttachmentModalOpen(false);
    attachmentForm.reset({
      revisionId: null,
      category: "referencia",
    });

    const fileInput = document.getElementById(
      "attachmentModalFile",
    ) as HTMLInputElement | null;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  const closeSupplierModal = () => {
    setSupplierModalOpen(false);
    supplierLinkForm.reset({
      supplierId: "",
      roleDescription: null,
      quotedHourlyCostBrl: null,
      estimatedHours: null,
      quotedTotalBrl: null,
    });
  };

  const closeSupplierEditModal = () => {
    setSupplierEditModalOpen(false);
    setEditingSupplierLinkId(null);
    supplierEditForm.reset({
      linkId: "",
      roleDescription: null,
      quotedHourlyCostBrl: null,
      estimatedHours: null,
      quotedTotalBrl: null,
    });
  };

  const handleAttachmentUpload = attachmentForm.handleSubmit((values) => {
    startTransition(async () => {
      const fileInput = document.getElementById(
        "attachmentModalFile",
      ) as HTMLInputElement | null;
      const file = fileInput?.files?.[0];

      if (!file) {
        toast.error("Selecione um arquivo para upload.");
        return;
      }

      const uploadRequest = await createAttachmentUploadAction({
        proposalId: detail.proposal.id,
        revisionId: values.revisionId,
        category: values.category,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
      });

      if (!uploadRequest.success) {
        toast.error(`Erro ao gerar upload: ${uploadRequest.error}`);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const uploadResult = await supabase.storage
        .from("proposal-attachments")
        .uploadToSignedUrl(
          uploadRequest.data.path,
          uploadRequest.data.token,
          file,
        );

      if (uploadResult.error) {
        toast.error(`Erro no upload: ${uploadResult.error.message}`);
        return;
      }

      const finalized = await finalizeAttachmentAction({
        proposalId: detail.proposal.id,
        revisionId: values.revisionId,
        category: values.category,
        fileName: file.name,
        storagePath: uploadRequest.data.path,
        mimeType: file.type,
        fileSizeBytes: file.size,
      });

      if (!finalized.success) {
        toast.error(`Erro ao finalizar: ${finalized.error}`);
        return;
      }

      toast.success(`Anexo salvo: ${finalized.data.fileName}`);
      closeAttachmentModal();
      router.refresh();
    });
  });

  const handleDownloadAttachment = (attachmentId: string) => {
    startTransition(async () => {
      const result = await getAttachmentDownloadUrlAction({ attachmentId });
      if (!result.success) {
        toast.error(`Erro ao gerar download: ${result.error}`);
        return;
      }

      window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    });
  };

  const handleLinkSupplier = supplierLinkForm.handleSubmit((values) => {
    if (!canManageSupplierLinks) {
      toast.error("Selecione a revisão atual para gerenciar fornecedores.");
      return;
    }

    startTransition(async () => {
      const calculatedQuotedTotal =
        values.quotedHourlyCostBrl !== null &&
          values.quotedHourlyCostBrl !== undefined &&
          values.estimatedHours !== null &&
          values.estimatedHours !== undefined
          ? Number((values.quotedHourlyCostBrl * values.estimatedHours).toFixed(2))
          : null;

      const result = await linkProposalSupplierAction({
        proposalId: detail.proposal.id,
        supplierId: values.supplierId,
        roleDescription: toNullableText(values.roleDescription),
        quotedHourlyCostBrl: values.quotedHourlyCostBrl ?? null,
        estimatedHours: values.estimatedHours ?? null,
        quotedTotalBrl: values.quotedTotalBrl ?? calculatedQuotedTotal,
      });

      if (!result.success) {
        toast.error(`Erro ao vincular fornecedor: ${result.error}`);
        return;
      }

      toast.success("Fornecedor vinculado com sucesso.");
      closeSupplierModal();
      router.refresh();
    });
  });

  const handleOpenSupplierEdit = (linkId: string) => {
    if (!canManageSupplierLinks) {
      toast.error("Selecione a revisão atual para gerenciar fornecedores.");
      return;
    }

    const link = detail.supplierLinks.find((item) => item.id === linkId);
    if (!link) {
      return;
    }

    setEditingSupplierLinkId(link.id);
    supplierEditForm.reset({
      linkId: link.id,
      roleDescription: link.roleDescription,
      quotedHourlyCostBrl: link.quotedHourlyCostBrl,
      estimatedHours: link.estimatedHours,
      quotedTotalBrl: link.quotedTotalBrl,
    });
    setSupplierEditModalOpen(true);
  };

  const handleUpdateSupplierLink = supplierEditForm.handleSubmit((values) => {
    if (!canManageSupplierLinks) {
      toast.error("Selecione a revisão atual para gerenciar fornecedores.");
      return;
    }

    startTransition(async () => {
      const calculatedQuotedTotal =
        values.quotedHourlyCostBrl !== null &&
          values.quotedHourlyCostBrl !== undefined &&
          values.estimatedHours !== null &&
          values.estimatedHours !== undefined
          ? Number((values.quotedHourlyCostBrl * values.estimatedHours).toFixed(2))
          : null;

      const result = await updateProposalSupplierLinkAction({
        linkId: values.linkId,
        roleDescription: toNullableText(values.roleDescription),
        quotedHourlyCostBrl: values.quotedHourlyCostBrl ?? null,
        estimatedHours: values.estimatedHours ?? null,
        quotedTotalBrl: values.quotedTotalBrl ?? calculatedQuotedTotal,
      });

      if (!result.success) {
        toast.error(`Erro ao atualizar fornecedor: ${result.error}`);
        return;
      }

      toast.success("Fornecedor atualizado com sucesso.");
      closeSupplierEditModal();
      router.refresh();
    });
  });

  const handleUnlinkSupplier = (linkId: string, supplierName: string) => {
    if (!canManageSupplierLinks) {
      toast.error("Selecione a revisão atual para gerenciar fornecedores.");
      return;
    }

    const confirmed = window.confirm(
      `Desvincular fornecedor "${supplierName}" desta proposta?`,
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await unlinkProposalSupplierAction({ linkId });
      if (!result.success) {
        toast.error(`Erro ao desvincular fornecedor: ${result.error}`);
        return;
      }

      toast.success("Fornecedor desvinculado.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-border px-4 py-4 bg-gray-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-mono text-2xl font-semibold tracking-tight">
                {detail.proposal.code}
              </h1>
              <Badge variant={PROPOSAL_STATUS_BADGE_VARIANTS[detail.proposal.status]}>
                {PROPOSAL_STATUS_LABELS[detail.proposal.status]}
              </Badge>
              <Badge variant="outline">R{latestRevisionNumber}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {detail.proposal.customerName} | {detail.proposal.projectName}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex flex-col items-start sm:items-end">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Valor atual
              </span>
              <span className="text-2xl font-semibold">
                {detail.currentValueBrl !== null
                  ? formatCurrencyBrl(detail.currentValueBrl)
                  : "—"}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              {canStartRevision ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStartRevision}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                  Criar nova revisão
                </Button>
              ) : null}
              <Button type="button" onClick={() => setStatusModalOpen(true)} disabled={isPending}>
                Alterar status
              </Button>
            </div>
          </div>
        </div>
      </section>

      {isInReview ? (
        <section>
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Ciclo de revisão</CardTitle>
                <CardDescription>
                  Fechamento da revisão pendente com documento atualizado.
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="border border-red-300 bg-red-100 text-red-900"
              >
                Revisão pendente
              </Badge>
            </CardHeader>
            <CardContent className="border-red-300">
              <form className="grid gap-4" onSubmit={handleCloseRevision}>
                <div className="grid gap-2 rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    1. Documento da proposta revisada
                  </p>
                  <Label htmlFor="revisionDocumentFile">Arquivo da proposta revisada</Label>
                  <Input
                    id="revisionDocumentFile"
                    className="bg-white disabled:bg-white cursor-pointer"
                    type="file"
                    disabled={isPending}
                    accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                  />
                </div>

                <div className="grid gap-2 rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    2. Valor da proposta
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="revisionEstimatedValueBrl">Valor estimado atualizado</Label>
                      <Controller
                        name="estimatedValueBrl"
                        control={baseForm.control}
                        render={({ field }) => (
                          <Input
                            id="revisionEstimatedValueBrl"
                            className="bg-white disabled:bg-white"
                            type="text"
                            inputMode="numeric"
                            disabled={isPending || isFinalStatus || !canEditCriticalFields}
                            value={
                              field.value === null || field.value === undefined
                                ? ""
                                : formatCurrencyBrl(field.value)
                            }
                            onBlur={field.onBlur}
                            onChange={(event) =>
                              field.onChange(parseCurrencyBrlInput(event.target.value))
                            }
                          />
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Valor da última revisão</Label>
                      <p className="rounded-md border bg-gray-100 px-3 py-2 text-sm">
                        {latestRevisionValueBrl !== null
                          ? formatCurrencyBrl(latestRevisionValueBrl)
                          : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-md border bg-white px-3 py-2 text-sm">
                    {revisionDiscountPreview ? (
                      <>
                        Desconto:{" "}
                        <span className="font-semibold">
                          {formatCurrencyBrl(revisionDiscountPreview.discountBrl)}
                        </span>{" "}
                        ({revisionDiscountPreview.discountPercent.toFixed(2)}%)
                      </>
                    ) : (
                      "Sem desconto calculado no momento (valor atual igual ou maior que o valor da última revisão)."
                    )}
                  </div>
                </div>

                <div className="grid gap-2 rounded-lg border p-4">
                  <p className="text-sm font-semibold">
                    3. Motivo da revisão
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="closeRevisionReason">Motivo</Label>
                    <Input
                      id="closeRevisionReason"
                      className="bg-white disabled:bg-white"
                      disabled={isPending}
                      {...closeRevisionForm.register("reason")}
                    />
                    {closeRevisionForm.formState.errors.reason && (
                      <p className="text-sm text-destructive">
                        {closeRevisionForm.formState.errors.reason.message}
                      </p>
                    )}
                  </div>
                </div>

                <details className="rounded-lg border p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    4. Detalhes opcionais da revisão
                  </summary>
                  <div className="mt-3 grid gap-2 text-xs">
                    <p>Preencha somente se quiser registrar contexto adicional.</p>
                  </div>
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="closeRevisionScopeChanges">Mudanças de escopo</Label>
                      <Textarea
                        id="closeRevisionScopeChanges"
                        className="bg-white disabled:bg-white"
                        rows={5}
                        disabled={isPending}
                        {...closeRevisionForm.register("scopeChanges", {
                          setValueAs: (value) => toNullableText(value),
                        })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="closeRevisionNotes">Observações</Label>
                      <Textarea
                        id="closeRevisionNotes"
                        className="bg-white disabled:bg-white"
                        rows={5}
                        disabled={isPending}
                        {...closeRevisionForm.register("notes", {
                          setValueAs: (value) => toNullableText(value),
                        })}
                      />
                    </div>
                  </div>
                </details>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelRevision}
                    disabled={isPending}
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
                    Cancelar revisão
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                    Fechar revisão
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section>
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Dados da proposta</CardTitle>
              <CardDescription>
                Cliente: {detail.proposal.customerName} | Ano: {detail.proposal.year} |
                Criada em {dateTimeFormatter.format(new Date(detail.proposal.createdAt))}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form className="grid gap-4" onSubmit={handleBaseSave}>
              <div className="grid gap-2">
                <Label htmlFor="projectName">Projeto</Label>
                <Input
                  id="projectName"
                  disabled={isPending || isFinalStatus}
                  {...baseForm.register("projectName")}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="invitationCode">Código convite</Label>
                  <Input
                    id="invitationCode"
                    disabled={isPending || isFinalStatus}
                    {...baseForm.register("invitationCode", {
                      setValueAs: (value) => toNullableText(value),
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Prazo</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    disabled={isPending || isFinalStatus || !canEditCriticalFields}
                    {...baseForm.register("dueDate", {
                      setValueAs: (value) => (value ? value : null),
                    })}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="scopeDescription">Escopo</Label>
                <Textarea
                  id="scopeDescription"
                  rows={6}
                  disabled={isPending || isFinalStatus || !canEditCriticalFields}
                  {...baseForm.register("scopeDescription")}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending || isFinalStatus}>
                  {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  Salvar dados
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={16} /> Revisões
            </CardTitle>
            <CardDescription>
              Histórico completo de revisões da proposta.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-2 py-2">Revisão</th>
                  <th className="px-2 py-2">Motivo</th>
                  <th className="px-2 py-2">Antes</th>
                  <th className="px-2 py-2">Depois</th>
                  <th className="px-2 py-2">% desconto</th>
                  <th className="px-2 py-2">Data</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {detail.revisions.length === 0 ? (
                  <tr className="border-b border-border">
                    <td className="px-2 py-4 text-muted-foreground" colSpan={7}>
                      Nenhuma revisão registrada.
                    </td>
                  </tr>
                ) : (
                  detail.revisions.map((revision) => {
                    const proposalFile = proposalFileByRevisionId.get(revision.id);

                    return (
                      <tr key={revision.id} className="border-b border-border">
                        <td className="px-2 py-3 font-mono">R{revision.revisionNumber}</td>
                        <td className="px-2 py-3">{revision.reason ?? "—"}</td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {revision.valueBeforeBrl !== null
                            ? formatCurrencyBrl(revision.valueBeforeBrl)
                            : "—"}
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {revision.valueAfterBrl !== null
                            ? formatCurrencyBrl(revision.valueAfterBrl)
                            : "—"}
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {revision.discountPercent !== null
                            ? `${revision.discountPercent.toFixed(2)}%`
                            : "—"}
                        </td>
                        <td className="px-2 py-3 text-xs text-muted-foreground">
                          {dateTimeFormatter.format(new Date(revision.createdAt))}
                        </td>
                        <td className="px-2 py-3 text-right w-20">
                          {proposalFile ? (
                            <div className="flex justify-end gap-2">
                              <Button asChild type="button" size="sm" variant="outline">
                                <a
                                  href={getAttachmentOpenPath(
                                    detail.proposal.id,
                                    proposalFile.id,
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Eye />
                                  Visualizar
                                </a>
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => handleDownloadAttachment(proposalFile.id)}
                                disabled={isPending}
                              >
                                {isPending ? (
                                  <Loader2 className="animate-spin" />
                                ) : (
                                  <FileDown />
                                )}
                                Download
                              </Button>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Anexos</CardTitle>
              <CardDescription>Anexos complementares da proposta.</CardDescription>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setAttachmentModalOpen(true)}
              disabled={isPending}
            >
              <Plus />
              Novo anexo
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2">Arquivo</th>
                    <th className="px-2 py-2">Revisão</th>
                    <th className="px-2 py-2">Tamanho</th>
                    <th className="px-2 py-2">Enviado em</th>
                    <th className="px-2 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.attachments.length === 0 ? (
                    <tr className="border-b border-border">
                      <td className="px-2 py-4 text-muted-foreground" colSpan={5}>
                        Nenhum anexo cadastrado.
                      </td>
                    </tr>
                  ) : (
                    detail.attachments.map((attachment) => (
                      <tr key={attachment.id} className="border-b border-border">
                        <td className="px-2 py-3">{attachment.fileName}</td>
                        <td className="px-2 py-3">
                          {attachment.revisionId
                            ? `R${revisionById.get(attachment.revisionId)?.revisionNumber ?? "?"}`
                            : "R0"}
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {formatBytes(attachment.fileSizeBytes)}
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {dateTimeFormatter.format(new Date(attachment.createdAt))}
                        </td>
                        <td className="px-2 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <Button asChild type="button" size="sm" variant="outline">
                              <a
                                href={getAttachmentOpenPath(
                                  detail.proposal.id,
                                  attachment.id,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Eye />
                                Visualizar
                              </a>
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => handleDownloadAttachment(attachment.id)}
                              disabled={isPending}
                            >
                              {isPending ? <Loader2 className="animate-spin" /> : <FileDown />}
                              Download
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <UsersRound size={16} /> Fornecedores vinculados
              </CardTitle>
              <CardDescription>
                {selectedSupplierRevisionNumber !== null
                  ? `Lista de fornecedores da revisão R${selectedSupplierRevisionNumber}.`
                  : "Selecione uma revisão para visualizar fornecedores."}
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
              <div className="grid w-full gap-1 sm:w-48">
                <Label htmlFor="supplierRevisionFilter" className="text-xs text-muted-foreground">
                  Revisão exibida
                </Label>
                <Select
                  value={selectedSupplierRevisionId ?? undefined}
                  onValueChange={(value) => setSelectedSupplierRevisionId(value)}
                  disabled={detail.revisions.length === 0}
                >
                  <SelectTrigger id="supplierRevisionFilter" className="h-9 w-full">
                    <SelectValue placeholder="Selecione uma revisão" />
                  </SelectTrigger>
                  <SelectContent>
                    {detail.revisions.map((revision) => (
                      <SelectItem key={revision.id} value={revision.id}>
                        R{revision.revisionNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setSupplierModalOpen(true)}
                disabled={isPending || !canManageSupplierLinks}
              >
                <Plus />
                Novo fornecedor
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!isViewingCurrentSupplierRevision ? (
              <div className="mb-4 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Revisões anteriores são somente leitura.
              </div>
            ) : null}
            <div className="mb-4 rounded-md border border-border bg-muted/30 px-4 py-3">
              <p className="text-xs text-muted-foreground">Custo total cotado</p>
              <p className="text-xl font-semibold text-foreground">
                {formatCurrencyBrl(suppliersQuotedTotalBrl)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2">Fornecedor</th>
                    <th className="px-2 py-2">Especialidade</th>
                    <th className="px-2 py-2">Papel</th>
                    <th className="px-2 py-2">Total cotado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSupplierLinks.length === 0 ? (
                    <tr className="border-b border-border">
                      <td className="px-2 py-4 text-muted-foreground" colSpan={5}>
                        Nenhum fornecedor vinculado.
                      </td>
                    </tr>
                  ) : (
                    selectedSupplierLinks.map((link) => (
                      <tr key={link.id} className="border-b border-border">
                        <td className="px-2 py-3">{link.supplierLegalName}</td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {link.supplierSpecialty}
                        </td>
                        <td className="px-2 py-3">{link.roleDescription ?? "—"}</td>
                        <td className="px-2 py-3">
                          {link.quotedTotalBrl !== null
                            ? formatCurrencyBrl(link.quotedTotalBrl)
                            : "—"}
                        </td>
                        <td className="px-2 py-3 text-right">
                          {canManageSupplierLinks ? (
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => handleOpenSupplierEdit(link.id)}
                                disabled={isPending}
                              >
                                {isPending ? <Loader2 className="animate-spin" /> : <Pencil />}
                                Editar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleUnlinkSupplier(link.id, link.supplierLegalName)
                                }
                                disabled={isPending}
                              >
                                {isPending ? <Loader2 className="animate-spin" /> : <X />}
                                Remover
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Somente leitura</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setHistoryModalOpen(true)}
          >
            <History size={16} /> Histórico de atividades
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTimelineModalOpen(true)}
          >
            <FileClock size={16} /> Cronologia e prazos
          </Button>
        </div>
      </section>

      <Dialog open={isHistoryModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History size={16} /> Histórico de atividades
            </DialogTitle>
            <DialogDescription>Eventos detalhados da proposta.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {detail.history.length === 0 ? (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Nenhum evento disponível.
              </p>
            ) : (
              detail.history.map((event) => (
                <div
                  key={event.id}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  <p className="font-medium">{event.title}</p>
                  <p className="text-muted-foreground">{event.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {dateTimeFormatter.format(new Date(event.createdAt))}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isTimelineModalOpen} onOpenChange={setTimelineModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileClock size={16} /> Cronologia e prazos
            </DialogTitle>
            <DialogDescription>Marcos principais em ordem cronológica.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto">
            {detail.timeline.length === 0 ? (
              <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                Nenhum marco disponível.
              </p>
            ) : (
              detail.timeline.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-border px-3 py-2 text-sm"
                >
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {dateTimeFormatter.format(new Date(item.date))}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isStatusModalOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeStatusModal();
            return;
          }

          statusForm.reset({
            proposalId: detail.proposal.id,
            status: detail.proposal.status,
            statusDate: null,
          });
          setStatusReason("");
          const statusFileInput = document.getElementById(
            "statusProposalFile",
          ) as HTMLInputElement | null;
          if (statusFileInput) {
            statusFileInput.value = "";
          }
          setStatusModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Alterar status da proposta</DialogTitle>
            <DialogDescription>
              Selecione o novo status da proposta.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleStatusSave}>
            <Controller
              name="status"
              control={statusForm.control}
              render={({ field }) => (
                <div className="grid gap-2">
                  <Label htmlFor="proposalStatusModal">Status</Label>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as ProposalStatus)}
                    disabled={isPending || isInReview}
                  >
                    <SelectTrigger id="proposalStatusModal" className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {PROPOSAL_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            {statusRequiresDateInModal ? (
              <Controller
                name="statusDate"
                control={statusForm.control}
                render={({ field }) => (
                  <div className="grid gap-2">
                    <Label htmlFor="statusDateInline">{statusDateLabelInModal}</Label>
                    <Input
                      id="statusDateInline"
                      type="date"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(event.target.value || null)
                      }
                      disabled={isPending}
                    />
                  </div>
                )}
              />
            ) : null}

            {isSendingToEnviadaInModal ? (
              <div className="grid gap-2">
                <Label htmlFor="statusProposalFile">Arquivo principal da proposta</Label>
                <Input
                  id="statusProposalFile"
                  type="file"
                  className="cursor-pointer bg-white disabled:bg-white"
                  disabled={isPending}
                  accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                />
              </div>
            ) : null}

            {statusRequiresReasonInModal ? (
              <div className="grid gap-2">
                <Label htmlFor="statusReasonInline">Motivo</Label>
                <Textarea
                  id="statusReasonInline"
                  rows={4}
                  value={statusReason}
                  onChange={(event) => setStatusReason(event.target.value)}
                  disabled={isPending}
                />
              </div>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={closeStatusModal}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || isInReview}>
                {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Confirmar status
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAttachmentModalOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeAttachmentModal();
            return;
          }

          setAttachmentModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Novo anexo</DialogTitle>
            <DialogDescription>
              Adicione um novo anexo para a proposta atual.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleAttachmentUpload}>
            <div className="grid gap-2">
              <Label htmlFor="attachmentRevisionId">Revisão</Label>
              <Controller
                name="revisionId"
                control={attachmentForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  >
                    <SelectTrigger id="attachmentRevisionId" className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem revisão (R0)</SelectItem>
                      {detail.revisions.map((revision) => (
                        <SelectItem key={revision.id} value={revision.id}>
                          R{revision.revisionNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="attachmentCategory">Categoria</Label>
              <Controller
                name="category"
                control={attachmentForm.control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="attachmentCategory" className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MANUAL_ATTACHMENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="attachmentModalFile">Arquivo</Label>
              <Input id="attachmentModalFile" type="file" disabled={isPending} />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={closeAttachmentModal}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Enviar anexo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSupplierModalOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeSupplierModal();
            return;
          }

          setSupplierModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo fornecedor vinculado</DialogTitle>
            <DialogDescription>
              Vincule um fornecedor à revisão atual.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleLinkSupplier}>
            <div className="grid gap-2">
              <Label htmlFor="supplierId">Fornecedor</Label>
              <Controller
                name="supplierId"
                control={supplierLinkForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={isPending || !canManageSupplierLinks}
                  >
                    <SelectTrigger id="supplierId" className="h-9 w-full">
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {detail.supplierOptions.map((supplier) => (
                        <SelectItem
                          key={supplier.id}
                          value={supplier.id}
                          disabled={currentRevisionLinkedSupplierIds.has(supplier.id)}
                        >
                          {supplier.legalName} ({supplier.specialty})
                          {currentRevisionLinkedSupplierIds.has(supplier.id)
                            ? " - já vinculado"
                            : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label>Revisão alvo</Label>
              <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                {currentSupplierRevisionId
                  ? `R${revisionById.get(currentSupplierRevisionId)?.revisionNumber ?? "?"}`
                  : "Sem revisão ativa para edição"}
              </p>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="supplierRoleDescription">Papel (opcional)</Label>
              <Input
                id="supplierRoleDescription"
                disabled={isPending || !selectedSupplierId || !canManageSupplierLinks}
                {...supplierLinkForm.register("roleDescription", {
                  setValueAs: (value) => toNullableText(value),
                })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supplierQuotedHourlyCost">Custo por hora</Label>
              <Controller
                name="quotedHourlyCostBrl"
                control={supplierLinkForm.control}
                render={({ field }) => (
                  <Input
                    id="supplierQuotedHourlyCost"
                    type="text"
                    inputMode="numeric"
                    disabled={isPending || !selectedSupplierId || !canManageSupplierLinks}
                    value={
                      field.value === null || field.value === undefined
                        ? ""
                        : formatCurrencyBrl(field.value)
                    }
                    onBlur={field.onBlur}
                    onChange={(event) =>
                      field.onChange(parseCurrencyBrlInput(event.target.value))
                    }
                  />
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supplierEstimatedHours">Horas estimadas</Label>
              <Input
                id="supplierEstimatedHours"
                type="number"
                step="0.01"
                disabled={isPending || !selectedSupplierId || !canManageSupplierLinks}
                {...supplierLinkForm.register("estimatedHours", {
                  setValueAs: (value) => toNullableNumber(value),
                })}
              />
            </div>


            <DialogFooter className="sm:col-span-2">
              <div className="flex gap-2 flex-row justify-between items-end w-full">
                <div className="sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Custo Total: </p>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedSupplierId && selectedSupplierQuotedTotal !== null
                      ? formatCurrencyBrl(selectedSupplierQuotedTotal)
                      : "R$ 0,00"}
                  </p>
                </div>
                <div className="flex gap-2">

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeSupplierModal}
                    disabled={isPending}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending || !canManageSupplierLinks}>
                    {isPending ? <Loader2 className="animate-spin" /> : <Link2 />}
                    Vincular fornecedor
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isSupplierEditModalOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeSupplierEditModal();
            return;
          }

          setSupplierEditModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Editar fornecedor vinculado</DialogTitle>
            <DialogDescription>
              Atualize os valores do fornecedor na revisão atual.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={handleUpdateSupplierLink}>
            <div className="grid gap-2">
              <Label>Fornecedor</Label>
              <p className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                {editingSupplierLink
                  ? `${editingSupplierLink.supplierLegalName} (${editingSupplierLink.supplierSpecialty})`
                  : "Fornecedor não encontrado"}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="editSupplierRoleDescription">Papel (opcional)</Label>
              <Input
                id="editSupplierRoleDescription"
                disabled={isPending || !editingSupplierLink}
                {...supplierEditForm.register("roleDescription", {
                  setValueAs: (value) => toNullableText(value),
                })}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="editSupplierQuotedHourlyCost">Custo por hora</Label>
                <Controller
                  name="quotedHourlyCostBrl"
                  control={supplierEditForm.control}
                  render={({ field }) => (
                    <Input
                      id="editSupplierQuotedHourlyCost"
                      type="text"
                      inputMode="numeric"
                      disabled={isPending || !editingSupplierLink}
                      value={
                        field.value === null || field.value === undefined
                          ? ""
                          : formatCurrencyBrl(field.value)
                      }
                      onBlur={field.onBlur}
                      onChange={(event) =>
                        field.onChange(parseCurrencyBrlInput(event.target.value))
                      }
                    />
                  )}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="editSupplierEstimatedHours">Horas estimadas</Label>
                <Input
                  id="editSupplierEstimatedHours"
                  type="number"
                  step="0.01"
                  disabled={isPending || !editingSupplierLink}
                  {...supplierEditForm.register("estimatedHours", {
                    setValueAs: (value) => toNullableNumber(value),
                  })}
                />
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Custo Total</p>
              <p className="text-lg font-semibold text-foreground">
                {selectedEditSupplierQuotedTotal !== null
                  ? formatCurrencyBrl(selectedEditSupplierQuotedTotal)
                  : "R$ 0,00"}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={closeSupplierEditModal}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || !editingSupplierLink}>
                {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                Salvar alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
