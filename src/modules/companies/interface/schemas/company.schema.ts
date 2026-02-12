import { z } from "zod";

import { validateCnpj } from "@/shared/domain/cnpj";
import { COMPANY_STATUSES } from "@/shared/domain/types";

const LIST_COMPANY_STATUSES = ["all", ...COMPANY_STATUSES] as const;

const cnpjSchema = z
  .string()
  .trim()
  .max(18)
  .optional()
  .nullable()
  .refine(
    (val) => !val || val === "" || validateCnpj(val),
    { message: "CNPJ inválido" }
  );

export const listCompaniesSchema = z.object({
  search: z.string().trim().max(120).optional().nullable(),
  status: z.enum(LIST_COMPANY_STATUSES).default("all"),
});

export const createCompanySchema = z.object({
  name: z.string().trim().min(3).max(220),
  slug: z.string().trim().min(1).max(120).optional().nullable(),
  cnpj: cnpjSchema,
  notes: z.string().trim().max(4000).optional().nullable(),
  status: z.enum(COMPANY_STATUSES).optional(),
});

export const updateCompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(3).max(220),
  slug: z.string().trim().min(1).max(120).optional().nullable(),
  cnpj: cnpjSchema,
  notes: z.string().trim().max(4000).optional().nullable(),
  status: z.enum(COMPANY_STATUSES),
});

export const deleteCompanySchema = z.object({
  companyId: z.string().uuid(),
});

export type ListCompaniesSchema = z.infer<typeof listCompaniesSchema>;
export type CreateCompanySchema = z.infer<typeof createCompanySchema>;
export type UpdateCompanySchema = z.infer<typeof updateCompanySchema>;
export type DeleteCompanySchema = z.infer<typeof deleteCompanySchema>;
