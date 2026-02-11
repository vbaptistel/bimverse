import { z } from "zod";

export const createProposalSchema = z.object({
  companyId: z.string().uuid(),
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

export const updateProposalStatusSchema = z.object({
  proposalId: z.string().uuid(),
  status: z.enum([
    "recebida",
    "em_elaboracao",
    "enviada",
    "em_revisao",
    "ganha",
    "perdida",
    "cancelada",
  ]),
  outcomeReason: z.string().trim().max(500).optional().nullable(),
  finalValueBrl: z.number().nonnegative().optional().nullable(),
});

export type CreateProposalSchema = z.infer<typeof createProposalSchema>;
export type CreateRevisionSchema = z.infer<typeof createRevisionSchema>;
export type UpdateProposalStatusSchema = z.infer<typeof updateProposalStatusSchema>;
