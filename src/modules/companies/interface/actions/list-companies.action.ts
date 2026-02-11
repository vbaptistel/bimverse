"use server";

import { buildCompaniesComposition } from "@/composition/companies.composition";
import { presentCompany } from "@/modules/companies/interface/presenters/company.presenter";
import {
  type ListCompaniesSchema,
  listCompaniesSchema,
} from "@/modules/companies/interface/schemas/company.schema";
import type { CompanyStatus } from "@/shared/domain/types";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

function toStatusFilter(
  input: ListCompaniesSchema["status"],
): CompanyStatus | null {
  return input === "all" ? null : input;
}

export async function listCompaniesAction(
  rawInput: Partial<ListCompaniesSchema> = {},
): Promise<ActionResult<ReturnType<typeof presentCompany>[]>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = listCompaniesSchema.parse(rawInput);
    const { listCompaniesUseCase } = buildCompaniesComposition();

    const companies = await listCompaniesUseCase.execute({
      search: input.search,
      status: toStatusFilter(input.status),
    });

    return {
      success: true,
      data: companies.map(presentCompany),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
