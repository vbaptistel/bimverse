import { AlertCircle } from "lucide-react";
import { notFound } from "next/navigation";
import { z } from "zod";

import { buildProposalsComposition } from "@/composition/proposals.composition";
import { ProposalDetailWorkspace } from "@/components/proposals/proposal-detail-workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { presentProposalDetail } from "@/modules/proposals/interface/presenters/proposal.presenter";
import { DomainError, NotFoundError } from "@/shared/domain/errors";

interface ProposalDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProposalDetailPage({
  params,
}: ProposalDetailPageProps) {
  const { id } = await params;
  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success) {
    notFound();
  }

  let detailPresenter: ReturnType<typeof presentProposalDetail> | null = null;
  let errorMessage: string | null = null;

  try {
    const { getProposalDetailUseCase } = buildProposalsComposition();
    const detail = await getProposalDetailUseCase.execute({
      proposalId: parsedId.data,
    });
    detailPresenter = presentProposalDetail(detail);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    errorMessage =
      error instanceof DomainError
        ? error.message
        : "Erro inesperado ao carregar proposta";

    if (!(error instanceof DomainError)) {
      console.error(error);
    }
  }

  if (detailPresenter) {
    return <ProposalDetailWorkspace detail={detailPresenter} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle size={16} />
          Falha ao carregar proposta
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {errorMessage ?? "Erro ao carregar proposta"}
        </p>
      </CardContent>
    </Card>
  );
}
