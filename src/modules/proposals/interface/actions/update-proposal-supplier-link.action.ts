"use server";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import {
  type UpdateProposalSupplierLinkSchema,
  updateProposalSupplierLinkSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";
import type { ProposalSupplierLinkPresenter } from "@/modules/proposals/interface/presenters/proposal.presenter";

function presentLink(
  link: {
    id: string;
    proposalId: string;
    revisionId: string | null;
    revisionNumber: number | null;
    supplierId: string;
    supplierLegalName: string;
    supplierSpecialty: string;
    roleDescription: string | null;
    quotedHourlyCostBrl: number | null;
    estimatedHours: number | null;
    quotedTotalBrl: number | null;
    createdAt: Date;
  },
): ProposalSupplierLinkPresenter {
  return {
    id: link.id,
    proposalId: link.proposalId,
    revisionId: link.revisionId,
    revisionNumber: link.revisionNumber,
    supplierId: link.supplierId,
    supplierLegalName: link.supplierLegalName,
    supplierSpecialty: link.supplierSpecialty,
    roleDescription: link.roleDescription,
    quotedHourlyCostBrl: link.quotedHourlyCostBrl,
    estimatedHours: link.estimatedHours,
    quotedTotalBrl: link.quotedTotalBrl,
    createdAt: link.createdAt.toISOString(),
  };
}

export async function updateProposalSupplierLinkAction(
  rawInput: UpdateProposalSupplierLinkSchema,
): Promise<ActionResult<ProposalSupplierLinkPresenter>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    const user = await authContext.getCurrentUser();

    const input = updateProposalSupplierLinkSchema.parse(rawInput);
    const { updateProposalSupplierLinkUseCase } = buildProposalsComposition();
    const link = await updateProposalSupplierLinkUseCase.execute({
      ...input,
      updatedBy: user.userId,
    });

    return {
      success: true,
      data: presentLink(link),
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
