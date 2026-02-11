"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createAttachmentUploadAction,
  finalizeAttachmentAction,
} from "@/modules/attachments";
import {
  createAttachmentUploadSchema,
  type CreateAttachmentUploadSchema,
} from "@/modules/attachments/interface/schemas/attachment.schema";
import { ATTACHMENT_CATEGORIES } from "@/shared/domain/types";
import { createSupabaseBrowserClient } from "@/shared/infrastructure/supabase/browser-client";

export function UploadAttachmentForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const form = useForm<CreateAttachmentUploadSchema>({
    resolver: zodResolver(createAttachmentUploadSchema),
    defaultValues: {
      proposalId: "",
      revisionId: null,
      category: "tr",
      fileName: "placeholder.txt",
      fileSizeBytes: 1,
      mimeType: "text/plain",
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFeedback(null);

    startTransition(async () => {
      const fileInput = document.getElementById(
        "attachmentFile",
      ) as HTMLInputElement | null;
      const file = fileInput?.files?.[0];

      if (!file) {
        setFeedback("Selecione um arquivo antes de enviar.");
        return;
      }

      const uploadRequest = await createAttachmentUploadAction({
        proposalId: values.proposalId,
        revisionId: values.revisionId || null,
        category: values.category,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
      });

      if (!uploadRequest.success) {
        setFeedback(`Erro de assinatura: ${uploadRequest.error}`);
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
        setFeedback(`Erro no upload direto: ${uploadResult.error.message}`);
        return;
      }

      const finalized = await finalizeAttachmentAction({
        proposalId: values.proposalId,
        revisionId: values.revisionId || null,
        category: values.category,
        fileName: file.name,
        storagePath: uploadRequest.data.path,
        mimeType: file.type,
        fileSizeBytes: file.size,
      });

      if (!finalized.success) {
        setFeedback(`Erro ao finalizar metadados: ${finalized.error}`);
        return;
      }

      setFeedback(`Anexo salvo com sucesso: ${finalized.data.fileName}`);
      fileInput!.value = "";
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Anexos</CardTitle>
        <CardDescription>
          Fluxo obrigatório: frontend solicita link assinado, envia direto ao
          Supabase e finaliza metadados via Server Action.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="attachmentProposalId">Proposal ID (UUID)</Label>
            <Input
              id="attachmentProposalId"
              {...form.register("proposalId")}
              placeholder="UUID da proposta"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="revisionId">Revision ID (opcional)</Label>
              <Input
                id="revisionId"
                {...form.register("revisionId", {
                  setValueAs: (value) => (value ? value : null),
                })}
                placeholder="UUID da revisão"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categoria</Label>
              <Controller
                name="category"
                control={form.control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger id="category" className="h-10 w-full">
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
          </div>

          <div className="grid gap-2">
            <Label htmlFor="attachmentFile">Arquivo (max 50MB)</Label>
            <Input id="attachmentFile" type="file" />
          </div>

          {feedback ? (
            <p className="rounded-md bg-[#f5f8fb] px-3 py-2 text-sm text-[#12304a]">
              {feedback}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enviando..." : "Enviar anexo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
