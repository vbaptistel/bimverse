"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import {
  type DeleteProposalSchema,
  deleteProposalSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function deleteProposalAction(
  rawInput: DeleteProposalSchema,
): Promise<ActionResult<{ proposalId: string }>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = deleteProposalSchema.parse(rawInput);
    const { deleteProposalUseCase } = buildProposalsComposition();
    const output = await deleteProposalUseCase.execute(input);

    return {
      success: true,
      data: output,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
