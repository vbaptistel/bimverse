"use server";

import { buildCompaniesComposition } from "@/composition/companies.composition";
import { presentCompany } from "@/modules/companies/interface/presenters/company.presenter";
import {
  type CreateCompanySchema,
  createCompanySchema,
} from "@/modules/companies/interface/schemas/company.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function createCompanyAction(
  rawInput: CreateCompanySchema,
): Promise<ActionResult<ReturnType<typeof presentCompany>>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = createCompanySchema.parse(rawInput);
    const { createCompanyUseCase } = buildCompaniesComposition();
    const company = await createCompanyUseCase.execute(input);

    return {
      success: true,
      data: presentCompany(company),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
