import { z } from "zod";

import { validateCnpj } from "@/shared/domain/cnpj";

const LIST_SUPPLIER_STATUSES = ["all", "active", "inactive"] as const;

const cnpjSchema = z
  .string()
  .trim()
  .min(1, "CNPJ é obrigatório")
  .max(18)
  .refine((val) => validateCnpj(val), { message: "CNPJ inválido" });

const emailValidationSchema = z.string().email();

const optionalEmailSchema = z
  .string()
  .trim()
  .max(180)
  .optional()
  .nullable()
  .refine(
    (val) => !val || val.length === 0 || emailValidationSchema.safeParse(val).success,
    { message: "E-mail inválido" },
  );

export const listSuppliersSchema = z.object({
  search: z.string().trim().max(120).optional().nullable(),
  status: z.enum(LIST_SUPPLIER_STATUSES).default("all"),
});

export const createSupplierSchema = z.object({
  legalName: z.string().trim().min(3).max(220),
  cnpj: cnpjSchema,
  specialty: z.string().trim().min(2).max(180),
  hourlyCostBrl: z.number().nonnegative().optional().nullable(),
  contactName: z.string().trim().max(220).optional().nullable(),
  contactEmail: optionalEmailSchema,
  contactPhone: z.string().trim().max(40).optional().nullable(),
  active: z.boolean().optional(),
});

export const updateSupplierSchema = z.object({
  id: z.string().uuid(),
  legalName: z.string().trim().min(3).max(220),
  cnpj: cnpjSchema,
  specialty: z.string().trim().min(2).max(180),
  hourlyCostBrl: z.number().nonnegative().optional().nullable(),
  contactName: z.string().trim().max(220).optional().nullable(),
  contactEmail: optionalEmailSchema,
  contactPhone: z.string().trim().max(40).optional().nullable(),
  active: z.boolean(),
});

export const deleteSupplierSchema = z.object({
  supplierId: z.string().uuid(),
});

export type ListSuppliersSchema = z.infer<typeof listSuppliersSchema>;
export type CreateSupplierSchema = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierSchema = z.infer<typeof updateSupplierSchema>;
export type DeleteSupplierSchema = z.infer<typeof deleteSupplierSchema>;
