import { z } from "zod";
import { PROPOSAL_STATUSES } from "@/shared/domain/types";

const LIST_PROPOSAL_STATUSES = ["all", ...PROPOSAL_STATUSES] as const;

export const listProposalsSchema = z.object({
  search: z.string().trim().max(120).optional().nullable(),
  status: z.enum(LIST_PROPOSAL_STATUSES).default("all"),
});

export const createProposalSchema = z.object({
  customerId: z.string().uuid(),
  year: z.number().int().min(2000).max(2100),
  invitationCode: z.string().trim().max(120).optional().nullable(),
  projectName: z.string().trim().min(3).max(220),
  scopeDescription: z.string().trim().min(5).max(10000),
  dueDate: z.string().date().optional().nullable(),
  estimatedValueBrl: z.number().nonnegative().optional().nullable(),
});

export const createRevisionSchema = z.object({
  proposalId: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
  scopeChanges: z.string().trim().max(10000).optional().nullable(),
  discountBrl: z.number().nonnegative().optional().nullable(),
  discountPercent: z.number().nonnegative().max(100).optional().nullable(),
  valueBeforeBrl: z.number().nonnegative().optional().nullable(),
  valueAfterBrl: z.number().nonnegative().optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
});

export const getProposalDetailSchema = z.object({
  proposalId: z.string().uuid(),
});

export const deleteProposalSchema = z.object({
  proposalId: z.string().uuid(),
});

export const updateProposalBaseSchema = z.object({
  proposalId: z.string().uuid(),
  projectName: z.string().trim().min(3).max(220),
  invitationCode: z.string().trim().max(120).optional().nullable(),
  scopeDescription: z.string().trim().min(5).max(10000),
  dueDate: z.string().date().optional().nullable(),
  estimatedValueBrl: z.number().nonnegative().optional().nullable(),
});

export const prepareRevisionDocumentUploadSchema = z.object({
  proposalId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  fileSizeBytes: z.number().positive(),
  mimeType: z.string().trim().min(3).max(150),
});

export const prepareProposalSendUploadSchema = z.object({
  proposalId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  fileSizeBytes: z.number().positive(),
  mimeType: z.string().trim().min(3).max(150),
});

export const sendProposalWithFileSchema = z.object({
  proposalId: z.string().uuid(),
  fileName: z.string().trim().min(1).max(255),
  storagePath: z.string().trim().min(3).max(2000),
  mimeType: z.string().trim().min(3).max(150),
  fileSizeBytes: z.number().positive(),
  statusDate: z.string().date().optional().nullable(),
});

export const closeProposalRevisionSchema = z.object({
  proposalId: z.string().uuid(),
  reason: z.string().trim().min(3).max(300),
  scopeChanges: z.string().trim().max(10000).optional().nullable(),
  notes: z.string().trim().max(4000).optional().nullable(),
  fileName: z.string().trim().min(1).max(255),
  storagePath: z.string().trim().min(3).max(2000),
  mimeType: z.string().trim().min(3).max(150),
  fileSizeBytes: z.number().positive(),
});

export const cancelProposalRevisionSchema = z.object({
  proposalId: z.string().uuid(),
});

export const startProposalRevisionCycleSchema = z.object({
  proposalId: z.string().uuid(),
});

export const linkProposalSupplierSchema = z.object({
  proposalId: z.string().uuid(),
  supplierId: z.string().uuid(),
  roleDescription: z.string().trim().max(300).optional().nullable(),
  quotedHourlyCostBrl: z.number().nonnegative().optional().nullable(),
  estimatedHours: z.number().nonnegative().optional().nullable(),
  quotedTotalBrl: z.number().nonnegative().optional().nullable(),
});

export const updateProposalSupplierLinkSchema = z.object({
  linkId: z.string().uuid(),
  roleDescription: z.string().trim().max(300).optional().nullable(),
  quotedHourlyCostBrl: z.number().nonnegative().optional().nullable(),
  estimatedHours: z.number().nonnegative().optional().nullable(),
  quotedTotalBrl: z.number().nonnegative().optional().nullable(),
});

export const unlinkProposalSupplierSchema = z.object({
  linkId: z.string().uuid(),
});

export const updateProposalStatusSchema = z.object({
  proposalId: z.string().uuid(),
  status: z.enum(["recebida", "em_elaboracao", "enviada", "ganha", "perdida", "cancelada"]),
  outcomeReason: z.string().trim().max(500).optional().nullable(),
  finalValueBrl: z.number().nonnegative().optional().nullable(),
  statusDate: z.string().date().optional().nullable(),
});

export type CreateProposalSchema = z.infer<typeof createProposalSchema>;
export type CreateRevisionSchema = z.infer<typeof createRevisionSchema>;
export type GetProposalDetailSchema = z.infer<typeof getProposalDetailSchema>;
export type DeleteProposalSchema = z.infer<typeof deleteProposalSchema>;
export type UpdateProposalBaseSchema = z.infer<typeof updateProposalBaseSchema>;
export type PrepareRevisionDocumentUploadSchema = z.infer<
  typeof prepareRevisionDocumentUploadSchema
>;
export type PrepareProposalSendUploadSchema = z.infer<
  typeof prepareProposalSendUploadSchema
>;
export type SendProposalWithFileSchema = z.infer<typeof sendProposalWithFileSchema>;
export type CloseProposalRevisionSchema = z.infer<
  typeof closeProposalRevisionSchema
>;
export type CancelProposalRevisionSchema = z.infer<
  typeof cancelProposalRevisionSchema
>;
export type StartProposalRevisionCycleSchema = z.infer<
  typeof startProposalRevisionCycleSchema
>;
export type UpdateProposalStatusSchema = z.infer<typeof updateProposalStatusSchema>;
export type ListProposalsSchema = z.infer<typeof listProposalsSchema>;
export type LinkProposalSupplierSchema = z.infer<
  typeof linkProposalSupplierSchema
>;
export type UpdateProposalSupplierLinkSchema = z.infer<
  typeof updateProposalSupplierLinkSchema
>;
export type UnlinkProposalSupplierSchema = z.infer<
  typeof unlinkProposalSupplierSchema
>;
