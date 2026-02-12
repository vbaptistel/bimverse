"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import { presentProposal } from "@/modules/proposals/interface/presenters/proposal.presenter";
import {
  type UpdateProposalBaseSchema,
  updateProposalBaseSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export interface UpdateProposalBaseActionOutput {
  proposal: ReturnType<typeof presentProposal>;
}

export async function updateProposalBaseAction(
  rawInput: UpdateProposalBaseSchema,
): Promise<ActionResult<UpdateProposalBaseActionOutput>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = updateProposalBaseSchema.parse(rawInput);
    const { updateProposalBaseUseCase } = buildProposalsComposition();
    const output = await updateProposalBaseUseCase.execute({
      ...input,
      updatedBy: user.userId,
    });

    return {
      success: true,
      data: {
        proposal: presentProposal(output.proposal),
      },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
