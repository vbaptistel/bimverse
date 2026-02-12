"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import {
  presentAttachment,
  presentProposal,
} from "@/modules/proposals/interface/presenters/proposal.presenter";
import {
  sendProposalWithFileSchema,
  type SendProposalWithFileSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export interface SendProposalWithFileActionOutput {
  proposal: ReturnType<typeof presentProposal>;
  attachment: ReturnType<typeof presentAttachment>;
}

export async function sendProposalWithFileAction(
  rawInput: SendProposalWithFileSchema,
): Promise<ActionResult<SendProposalWithFileActionOutput>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = sendProposalWithFileSchema.parse(rawInput);
    const { sendProposalWithFileUseCase } = buildProposalsComposition();
    const output = await sendProposalWithFileUseCase.execute({
      ...input,
      sentBy: user.userId,
    });

    return {
      success: true,
      data: {
        proposal: presentProposal(output.proposal),
        attachment: presentAttachment(output.attachment),
      },
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
