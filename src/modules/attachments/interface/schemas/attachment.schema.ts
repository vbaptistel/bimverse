import { z } from "zod";

export const createAttachmentUploadSchema = z.object({
  proposalId: z.string().uuid(),
  revisionId: z.string().uuid().optional().nullable(),
  category: z.enum([
    "convite",
    "tr",
    "referencia",
    "proposta_word",
    "planilha_custos",
    "outro",
  ]),
  fileName: z.string().trim().min(1).max(255),
  fileSizeBytes: z.number().positive(),
  mimeType: z.string().trim().min(3).max(150),
});

export const finalizeAttachmentSchema = z.object({
  proposalId: z.string().uuid(),
  revisionId: z.string().uuid().optional().nullable(),
  category: z.enum([
    "convite",
    "tr",
    "referencia",
    "proposta_word",
    "planilha_custos",
    "outro",
  ]),
  fileName: z.string().trim().min(1).max(255),
  storagePath: z.string().trim().min(3).max(2000),
  mimeType: z.string().trim().min(3).max(150),
  fileSizeBytes: z.number().positive(),
});

export const getAttachmentDownloadSchema = z.object({
  attachmentId: z.string().uuid(),
});

export type CreateAttachmentUploadSchema = z.infer<
  typeof createAttachmentUploadSchema
>;
export type FinalizeAttachmentSchema = z.infer<typeof finalizeAttachmentSchema>;
export type GetAttachmentDownloadSchema = z.infer<
  typeof getAttachmentDownloadSchema
>;
