"use server";

import { buildAttachmentsComposition } from "@/composition/attachments.composition";
import {
  deleteAttachmentSchema,
  type DeleteAttachmentSchema,
} from "@/modules/attachments/interface/schemas/attachment.schema";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import type { ActionResult } from "@/shared/interface/action-result";
import { toActionFailure } from "@/shared/interface/action-result";

export async function deleteAttachmentAction(
  rawInput: DeleteAttachmentSchema,
): Promise<ActionResult<{ attachmentId: string; proposalId: string }>> {
  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const input = deleteAttachmentSchema.parse(rawInput);
    const { deleteAttachmentUseCase } = buildAttachmentsComposition();
    const output = await deleteAttachmentUseCase.execute(input);

    return {
      success: true,
      data: output,
    };
  } catch (error) {
    return toActionFailure(error);
  }
}
