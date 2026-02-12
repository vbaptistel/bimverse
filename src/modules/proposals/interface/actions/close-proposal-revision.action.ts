"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import {
  type CloseProposalRevisionSchema,
  closeProposalRevisionSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import {
  presentAttachment,
  presentProposal,
  presentRevision,
} from "@/modules/proposals/interface/presenters/proposal.presenter";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export interface CloseProposalRevisionActionOutput {
  proposal: ReturnType<typeof presentProposal>;
  revision: ReturnType<typeof presentRevision>;
  attachment: ReturnType<typeof presentAttachment>;
}

export async function closeProposalRevisionAction(
  rawInput: CloseProposalRevisionSchema,
): Promise<ActionResult<CloseProposalRevisionActionOutput>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = closeProposalRevisionSchema.parse(rawInput);
    const { closeProposalRevisionUseCase } = buildProposalsComposition();
    const output = await closeProposalRevisionUseCase.execute({
      ...input,
      closedBy: user.userId,
    });

    return {
      success: true,
      data: {
        proposal: presentProposal(output.proposal),
        revision: presentRevision(output.revision),
        attachment: presentAttachment(output.attachment),
      },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
