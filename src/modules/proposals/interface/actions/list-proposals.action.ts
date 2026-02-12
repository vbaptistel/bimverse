"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import { presentProposal } from "@/modules/proposals/interface/presenters/proposal.presenter";
import {
  type ListProposalsSchema,
  listProposalsSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import type { ProposalStatus } from "@/shared/domain/types";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

function toStatusFilter(
  input: ListProposalsSchema["status"],
): ProposalStatus | null {
  return input === "all" ? null : input;
}

export async function listProposalsAction(
  rawInput: Partial<ListProposalsSchema> = {},
): Promise<ActionResult<ReturnType<typeof presentProposal>[]>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = listProposalsSchema.parse(rawInput);
    const { listProposalsUseCase } = buildProposalsComposition();

    const proposals = await listProposalsUseCase.execute({
      search: input.search,
      status: toStatusFilter(input.status),
    });

    return {
      success: true,
      data: proposals.map(presentProposal),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
