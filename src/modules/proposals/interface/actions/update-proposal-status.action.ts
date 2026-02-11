"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import {
  type UpdateProposalStatusSchema,
  updateProposalStatusSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { presentProposal } from "@/modules/proposals/interface/presenters/proposal.presenter";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function updateProposalStatusAction(
  rawInput: UpdateProposalStatusSchema,
): Promise<ActionResult<ReturnType<typeof presentProposal>>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = updateProposalStatusSchema.parse(rawInput);
    const { updateProposalStatusUseCase } = buildProposalsComposition();
    const proposal = await updateProposalStatusUseCase.execute(input);

    return {
      success: true,
      data: presentProposal(proposal),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
