import { z } from "zod";

import { validateCnpj } from "@/shared/domain/cnpj";
import { CUSTOMER_STATUSES } from "@/shared/domain/types";

const LIST_CUSTOMER_STATUSES = ["all", ...CUSTOMER_STATUSES] as const;

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

export const listCustomersSchema = z.object({
  search: z.string().trim().max(120).optional().nullable(),
  status: z.enum(LIST_CUSTOMER_STATUSES).default("all"),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(3).max(220),
  slug: z.string().trim().min(1).max(120).optional().nullable(),
  cnpj: cnpjSchema,
  notes: z.string().trim().max(4000).optional().nullable(),
  status: z.enum(CUSTOMER_STATUSES).optional(),
});

export const updateCustomerSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(3).max(220),
  slug: z.string().trim().min(1).max(120).optional().nullable(),
  cnpj: cnpjSchema,
  notes: z.string().trim().max(4000).optional().nullable(),
  status: z.enum(CUSTOMER_STATUSES),
});

export const deleteCustomerSchema = z.object({
  customerId: z.string().uuid(),
});

export type ListCustomersSchema = z.infer<typeof listCustomersSchema>;
export type CreateCustomerSchema = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerSchema = z.infer<typeof updateCustomerSchema>;
export type DeleteCustomerSchema = z.infer<typeof deleteCustomerSchema>;
