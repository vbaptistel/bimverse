"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileClock,
  FileDown,
  FileText,
  History,
  Link2,
  Loader2,
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

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
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
} from "@/modules/attachments/interface";
import {
  cancelProposalRevisionAction,
  closeProposalRevisionAction,
  linkProposalSupplierAction,
  prepareRevisionDocumentUploadAction,
  type ProposalDetailPresenter,
  startProposalRevisionCycleAction,
  unlinkProposalSupplierAction,
  updateProposalBaseAction,
  type UpdateProposalBaseSchema,
  updateProposalBaseSchema,
  updateProposalStatusAction,
} from "@/modules/proposals/interface";
import { formatCurrencyBrl, parseCurrencyBrlInput } from "@/shared/domain/currency";
import type { AttachmentCategory, ProposalStatus } from "@/shared/domain/types";
import { ATTACHMENT_CATEGORIES } from "@/shared/domain/types";
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

const MANUAL_STATUS_OPTIONS = [
  "recebida",
  "em_elaboracao",
  "enviada",
  "ganha",
  "perdida",
  "cancelada",
] as const;

type ManualProposalStatus = (typeof MANUAL_STATUS_OPTIONS)[number];

interface ProposalDetailWorkspaceProps {
  detail: ProposalDetailPresenter;
}

interface CloseRevisionFormValues {
  reason: string;
  scopeChanges: string | null;
  discountBrl: number | null;
  discountPercent: number | null;
  notes: string | null;
}

interface AttachmentUploadFormValues {
  revisionId: string | null;
  category: AttachmentCategory;
}

interface SupplierLinkFormValues {
  supplierId: string;
  revisionId: string | null;
  roleDescription: string | null;
  quotedHourlyCostBrl: number | null;
  estimatedHours: number | null;
  quotedTotalBrl: number | null;
}

interface ProposalStatusFormValues {
  proposalId: string;
  status: ProposalStatus;
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

export function ProposalDetailWorkspace({ detail }: ProposalDetailWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isAttachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [isStatusReasonModalOpen, setStatusReasonModalOpen] = useState(false);
  const [statusReason, setStatusReason] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    status: ManualProposalStatus;
  } | null>(null);
  const [discountType, setDiscountType] = useState<"brl" | "percent">("brl");

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
    },
  });

  const closeRevisionForm = useForm<CloseRevisionFormValues>({
    defaultValues: {
      reason: "",
      scopeChanges: null,
      discountBrl: null,
      discountPercent: null,
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
      revisionId: null,
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
    });
  }, [detail, baseForm, statusForm]);

  const revisionById = useMemo(
    () => new Map(detail.revisions.map((revision) => [revision.id, revision])),
    [detail.revisions],
  );

  const latestRevisionNumber = useMemo(
    () =>
      detail.revisions.reduce(
        (maxRevisionNumber, revision) =>
          Math.max(maxRevisionNumber, revision.revisionNumber),
        0,
      ),
    [detail.revisions],
  );

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

  const closeStatusReasonModal = () => {
    setStatusReasonModalOpen(false);
    setStatusReason("");
    setPendingStatusChange(null);
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
    if (nextStatus === "perdida" || nextStatus === "cancelada") {
      setPendingStatusChange({
        status: nextStatus,
      });
      setStatusReason("");
      setStatusReasonModalOpen(true);
      return;
    }

    startTransition(async () => {
      const result = await updateProposalStatusAction({
        proposalId: values.proposalId,
        status: nextStatus,
        outcomeReason: null,
      });

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
        return;
      }

      toast.success(
        `Status atualizado para ${PROPOSAL_STATUS_LABELS[result.data.status]}.`,
      );
      router.refresh();
    });
  });

  const handleConfirmStatusReason = () => {
    if (!pendingStatusChange) {
      toast.error("Selecione um status antes de confirmar.");
      return;
    }

    const reason = toNullableText(statusReason);
    if (!reason) {
      toast.error("Motivo é obrigatório.");
      return;
    }

    startTransition(async () => {
      const result = await updateProposalStatusAction({
        proposalId: detail.proposal.id,
        status: pendingStatusChange.status,
        outcomeReason: reason,
      });

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
        return;
      }

      closeStatusReasonModal();
      toast.success(
        `Status atualizado para ${PROPOSAL_STATUS_LABELS[result.data.status]}.`,
      );
      router.refresh();
    });
  };

  const handleCloseRevision = closeRevisionForm.handleSubmit((values) => {
    startTransition(async () => {
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
        discountBrl: discountType === "brl" ? values.discountBrl ?? null : null,
        discountPercent:
          discountType === "percent" ? values.discountPercent ?? null : null,
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
      revisionId: null,
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
    startTransition(async () => {
      const result = await linkProposalSupplierAction({
        proposalId: detail.proposal.id,
        supplierId: values.supplierId,
        revisionId: values.revisionId,
        roleDescription: toNullableText(values.roleDescription),
        quotedHourlyCostBrl: values.quotedHourlyCostBrl ?? null,
        estimatedHours: values.estimatedHours ?? null,
        quotedTotalBrl: values.quotedTotalBrl ?? null,
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

  const handleUnlinkSupplier = (linkId: string, supplierName: string) => {
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
      <section className="rounded-lg border border-border bg-card px-4 py-4">
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
              {detail.proposal.companyName} | {detail.proposal.projectName}
            </p>
          </div>

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
        </div>
      </section>

      {isInReview ? (
        <section>
          <Card className="border-amber-300/80 bg-amber-50">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <CardTitle>Ciclo de revisão</CardTitle>
                <CardDescription>
                  Fechamento da revisão pendente com documento atualizado.
                </CardDescription>
              </div>
              <Badge
                variant="secondary"
                className="border border-amber-300 bg-amber-100 text-amber-900"
              >
                Revisão pendente
              </Badge>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5 2xl:grid-cols-12" onSubmit={handleCloseRevision}>
                <div className="rounded-md border border-amber-300 bg-amber-100/80 px-3 py-2 text-sm text-amber-900 2xl:col-span-12">
                  Feche a revisão com o documento atualizado para voltar a proposta para
                  status enviada.
                </div>

                <div className="grid gap-4 2xl:col-span-8">
                  <div className="grid gap-2">
                    <Label htmlFor="closeRevisionReason">Motivo</Label>
                    <Input
                      id="closeRevisionReason"
                      className="bg-white disabled:bg-white"
                      disabled={isPending}
                      {...closeRevisionForm.register("reason")}
                    />
                  </div>

                  <div className="grid gap-2 lg:grid-cols-2">
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
                </div>

                <aside className="grid content-start gap-4 rounded-lg border border-amber-300 bg-amber-100/80 p-4 2xl:col-span-4">
                  <div className="grid gap-2">
                    <Label htmlFor="revisionDocumentFile">
                      Arquivo da proposta revisada
                    </Label>
                    <Input
                      id="revisionDocumentFile"
                      className="bg-white disabled:bg-white cursor-pointer"
                      type="file"
                      disabled={isPending}
                      accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label>Desconto</Label>
                    <ButtonGroup className="h-9 w-full rounded-lg border border-input bg-white">
                      <Select
                        value={discountType}
                        onValueChange={(value: "brl" | "percent") => {
                          setDiscountType(value);
                          closeRevisionForm.setValue(
                            value === "brl" ? "discountPercent" : "discountBrl",
                            null
                          );
                        }}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-9 min-w-10 rounded-r-none border-0 bg-transparent font-mono shadow-none focus:ring-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="min-w-10">
                          <SelectItem value="brl">R$</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                      {discountType === "brl" ? (
                        <Controller
                          name="discountBrl"
                          control={closeRevisionForm.control}
                          render={({ field }) => (
                            <Input
                              id="closeRevisionDiscountBrl"
                              className="h-9 rounded-l-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                              type="text"
                              inputMode="numeric"
                              placeholder="0,00"
                              disabled={isPending}
                              value={
                                field.value === null || field.value === undefined
                                  ? ""
                                  : formatCurrencyBrl(field.value)
                              }
                              onBlur={field.onBlur}
                              onChange={(event) =>
                                field.onChange(
                                  parseCurrencyBrlInput(event.target.value)
                                )
                              }
                            />
                          )}
                        />
                      ) : (
                        <Input
                          id="closeRevisionDiscountPercent"
                          className="h-9 rounded-l-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                          type="number"
                          step="0.01"
                          placeholder="0"
                          disabled={isPending}
                          {...closeRevisionForm.register("discountPercent", {
                            setValueAs: (value) => toNullableNumber(value),
                          })}
                        />
                      )}
                    </ButtonGroup>
                  </div>
                </aside>

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-amber-300/60 pt-4 2xl:col-span-12">
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
              <CardTitle>Dados e status da proposta</CardTitle>
              <CardDescription>
                Empresa: {detail.proposal.companyName} | Ano: {detail.proposal.year} |
                Criada em {dateTimeFormatter.format(new Date(detail.proposal.createdAt))}
              </CardDescription>
            </div>

            {canStartRevision ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handleStartRevision}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                Criar nova revisão
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
            <form className="grid gap-4 self-start" onSubmit={handleBaseSave}>
              <div className="grid gap-2">
                <Label htmlFor="projectName">Projeto</Label>
                <Input
                  id="projectName"
                  disabled={isPending || isFinalStatus}
                  {...baseForm.register("projectName")}
                />
              </div>

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

              <div className="grid gap-3 md:grid-cols-2">
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

                <div className="grid gap-2">
                  <Label htmlFor="estimatedValueBrl">Valor estimado</Label>
                  <Controller
                    name="estimatedValueBrl"
                    control={baseForm.control}
                    render={({ field }) => (
                      <Input
                        id="estimatedValueBrl"
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

              {!isInReview && !isFinalStatus ? (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Campos críticos (escopo, prazo e valor estimado) só ficam editáveis
                  após clicar em Criar nova revisão.
                </p>
              ) : null}

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending || isFinalStatus}>
                  {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  Salvar dados
                </Button>
              </div>
            </form>

            <form
              className="grid gap-4 self-start rounded-lg border border-border bg-muted/20 p-4"
              onSubmit={handleStatusSave}
            >
              <h3 className="text-sm font-medium">Status da proposta</h3>
              <Controller
                name="status"
                control={statusForm.control}
                render={({ field }) => (
                  <div className="grid gap-2">
                    <Label htmlFor="proposalStatus">Status</Label>
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as ProposalStatus)}
                      disabled={isPending || isInReview}
                    >
                      <SelectTrigger id="proposalStatus" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {isInReview ? (
                          <SelectItem value="em_revisao" disabled>
                            {PROPOSAL_STATUS_LABELS.em_revisao}
                          </SelectItem>
                        ) : null}
                        {MANUAL_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {PROPOSAL_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              />

              {isInReview ? (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Status manual bloqueado durante revisão pendente.
                </p>
              ) : (
                <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Motivo será solicitado em modal ao mudar para perdida ou cancelada.
                </p>
              )}

              <div className="flex justify-end pt-1">
                <Button type="submit" disabled={isPending || isInReview}>
                  {isPending ? <Loader2 className="animate-spin" /> : <Save />}
                  Atualizar status
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
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-2 py-2">Revisão</th>
                  <th className="px-2 py-2">Motivo</th>
                  <th className="px-2 py-2">Antes</th>
                  <th className="px-2 py-2">Depois</th>
                  <th className="px-2 py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {detail.revisions.length === 0 ? (
                  <tr className="border-b border-border">
                    <td className="px-2 py-4 text-muted-foreground" colSpan={5}>
                      Nenhuma revisão registrada.
                    </td>
                  </tr>
                ) : (
                  detail.revisions.map((revision) => (
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
                      <td className="px-2 py-3 text-xs text-muted-foreground">
                        {dateTimeFormatter.format(new Date(revision.createdAt))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Anexos</CardTitle>
              <CardDescription>Lista de anexos da proposta.</CardDescription>
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
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2">Arquivo</th>
                    <th className="px-2 py-2">Categoria</th>
                    <th className="px-2 py-2">Revisão</th>
                    <th className="px-2 py-2">Tamanho</th>
                    <th className="px-2 py-2">Enviado em</th>
                    <th className="px-2 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.attachments.length === 0 ? (
                    <tr className="border-b border-border">
                      <td className="px-2 py-4 text-muted-foreground" colSpan={6}>
                        Nenhum anexo cadastrado.
                      </td>
                    </tr>
                  ) : (
                    detail.attachments.map((attachment) => (
                      <tr key={attachment.id} className="border-b border-border">
                        <td className="px-2 py-3">{attachment.fileName}</td>
                        <td className="px-2 py-3">{attachment.category}</td>
                        <td className="px-2 py-3">
                          {attachment.revisionId
                            ? `R${revisionById.get(attachment.revisionId)?.revisionNumber ?? "?"}`
                            : "R0"}
                        </td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {formatBytes(attachment.fileSizeBytes)}
                        </td>
                        <td className="px-2 py-3 text-xs text-muted-foreground">
                          {dateTimeFormatter.format(new Date(attachment.createdAt))}
                        </td>
                        <td className="px-2 py-3 text-right">
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
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <UsersRound size={16} /> Fornecedores vinculados
              </CardTitle>
              <CardDescription>Lista de fornecedores vinculados.</CardDescription>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSupplierModalOpen(true)}
              disabled={isPending}
            >
              <Plus />
              Novo fornecedor
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2">Fornecedor</th>
                    <th className="px-2 py-2">Especialidade</th>
                    <th className="px-2 py-2">Revisão</th>
                    <th className="px-2 py-2">Papel</th>
                    <th className="px-2 py-2">Total cotado</th>
                    <th className="px-2 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.supplierLinks.length === 0 ? (
                    <tr className="border-b border-border">
                      <td className="px-2 py-4 text-muted-foreground" colSpan={6}>
                        Nenhum fornecedor vinculado.
                      </td>
                    </tr>
                  ) : (
                    detail.supplierLinks.map((link) => (
                      <tr key={link.id} className="border-b border-border">
                        <td className="px-2 py-3">{link.supplierLegalName}</td>
                        <td className="px-2 py-3 text-muted-foreground">
                          {link.supplierSpecialty}
                        </td>
                        <td className="px-2 py-3">
                          {link.revisionNumber !== null
                            ? `R${link.revisionNumber}`
                            : "Sem revisão"}
                        </td>
                        <td className="px-2 py-3">{link.roleDescription ?? "—"}</td>
                        <td className="px-2 py-3">
                          {link.quotedTotalBrl !== null
                            ? formatCurrencyBrl(link.quotedTotalBrl)
                            : "—"}
                        </td>
                        <td className="px-2 py-3 text-right">
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

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History size={16} /> Histórico de atividades
            </CardTitle>
            <CardDescription>Eventos detalhados da proposta.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileClock size={16} /> Cronologia e prazos
            </CardTitle>
            <CardDescription>Marcos principais em ordem cronológica.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={isStatusReasonModalOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeStatusReasonModal();
            return;
          }

          setStatusReasonModalOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar alteração de status</DialogTitle>
            <DialogDescription>
              Informe o motivo para marcar a proposta como{" "}
              {pendingStatusChange
                ? PROPOSAL_STATUS_LABELS[pendingStatusChange.status].toLowerCase()
                : "finalizada"}
              .
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="statusReason">Motivo</Label>
            <Textarea
              id="statusReason"
              rows={4}
              value={statusReason}
              onChange={(event) => setStatusReason(event.target.value)}
              disabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={closeStatusReasonModal}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmStatusReason} disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : <Save />}
              Confirmar status
            </Button>
          </DialogFooter>
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
                      {ATTACHMENT_CATEGORIES.map((category) => (
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
              Vincule um fornecedor à proposta ou a uma revisão específica.
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
                  >
                    <SelectTrigger id="supplierId" className="h-9 w-full">
                      <SelectValue placeholder="Selecione um fornecedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {detail.supplierOptions.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.legalName} ({supplier.specialty})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supplierRevisionId">Revisão (opcional)</Label>
              <Controller
                name="revisionId"
                control={supplierLinkForm.control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  >
                    <SelectTrigger id="supplierRevisionId" className="h-9 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem revisão</SelectItem>
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

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="supplierRoleDescription">Papel (opcional)</Label>
              <Input
                id="supplierRoleDescription"
                disabled={isPending}
                {...supplierLinkForm.register("roleDescription", {
                  setValueAs: (value) => toNullableText(value),
                })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supplierQuotedHourlyCost">Custo/hora cotado</Label>
              <Controller
                name="quotedHourlyCostBrl"
                control={supplierLinkForm.control}
                render={({ field }) => (
                  <Input
                    id="supplierQuotedHourlyCost"
                    type="text"
                    inputMode="numeric"
                    disabled={isPending}
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
                disabled={isPending}
                {...supplierLinkForm.register("estimatedHours", {
                  setValueAs: (value) => toNullableNumber(value),
                })}
              />
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="supplierQuotedTotal">Total cotado</Label>
              <Controller
                name="quotedTotalBrl"
                control={supplierLinkForm.control}
                render={({ field }) => (
                  <Input
                    id="supplierQuotedTotal"
                    type="text"
                    inputMode="numeric"
                    disabled={isPending}
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

            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="secondary"
                onClick={closeSupplierModal}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <Link2 />}
                Vincular fornecedor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
