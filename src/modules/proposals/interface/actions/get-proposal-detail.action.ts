"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import { presentProposalDetail } from "@/modules/proposals/interface/presenters/proposal.presenter";
import {
  getProposalDetailSchema,
  type GetProposalDetailSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function getProposalDetailAction(
  rawInput: GetProposalDetailSchema,
): Promise<ActionResult<ReturnType<typeof presentProposalDetail>>> {
  try {
    const input = getProposalDetailSchema.parse(rawInput);
    const { getProposalDetailUseCase } = buildProposalsComposition();
    const detail = await getProposalDetailUseCase.execute({
      proposalId: input.proposalId,
    });

    return {
      success: true,
      data: presentProposalDetail(detail),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
