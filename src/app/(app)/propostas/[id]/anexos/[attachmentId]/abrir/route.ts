import { NextResponse } from "next/server";
import { z } from "zod";

import { buildAttachmentsComposition } from "@/composition/attachments.composition";
import { resolveAttachmentViewer } from "@/modules/attachments/interface";
import { SupabaseAuthContextAdapter } from "@/shared/infrastructure/auth/supabase-auth-context.adapter";
import { DomainError, NotFoundError } from "@/shared/domain/errors";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface AttachmentOpenRouteContext {
  params: Promise<{
    id: string;
    attachmentId: string;
  }>;
}

export async function GET(
  _request: Request,
  context: AttachmentOpenRouteContext,
) {
  const { id, attachmentId } = await context.params;
  const parsedProposalId = z.string().uuid().safeParse(id);
  const parsedAttachmentId = z.string().uuid().safeParse(attachmentId);

  if (!parsedProposalId.success || !parsedAttachmentId.success) {
    return NextResponse.json({ message: "Anexo nao encontrado" }, { status: 404 });
  }

  try {
    const authContext = new SupabaseAuthContextAdapter();
    await authContext.getCurrentUser();

    const { getAttachmentDownloadUrlUseCase } = buildAttachmentsComposition();
    const output = await getAttachmentDownloadUrlUseCase.execute({
      attachmentId: parsedAttachmentId.data,
    });

    if (output.attachment.proposalId !== parsedProposalId.data) {
      return NextResponse.json({ message: "Anexo nao encontrado" }, { status: 404 });
    }

    const viewer = resolveAttachmentViewer(
      output.attachment.fileName,
      output.signedUrl,
    );
    const targetUrl = viewer.viewerUrl ?? output.signedUrl;

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: "Anexo nao encontrado" }, { status: 404 });
    }

    if (error instanceof DomainError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { message: "Erro inesperado ao abrir anexo" },
      { status: 500 },
    );
  }
}
