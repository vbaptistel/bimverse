import { FileClock, FileText, History, UsersRound } from "lucide-react";

import { UploadAttachmentForm } from "@/components/attachments/upload-attachment-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProposalDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const { id } = await params;

  return (
    <>
      <PageHeader
        badge="Detalhe"
        title={`Proposta ${id}`}
        description="Tela consolidada com visão geral, revisões, anexos, fornecedores e histórico."
      />

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription className="text-[#0f766e]">Código</CardDescription>
            <CardTitle className="font-mono text-sm">—</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="text-[#0f766e]">Status</CardDescription>
            <CardTitle className="text-base capitalize">—</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="text-[#0f766e]">Valor atual</CardDescription>
            <CardTitle className="text-base">—</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText size={16} /> Revisões</CardTitle>
            <CardDescription>Estrutura para registrar motivo, desconto e valor antes/depois.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg border border-dashed border-[#c9d5e2] bg-[#f8fbff] p-4 text-sm text-[#5b6d84]">
              Nenhuma revisão registrada para esta proposta.
            </p>
          </CardContent>
        </Card>

        <UploadAttachmentForm />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <EmptyState
          title="Fornecedores vinculados"
          description="Bloco reservado para vincular especialidade, custo/hora e participação por revisão."
          icon={<UsersRound size={16} />}
        />

        <EmptyState
          title="Histórico de atividades"
          description="Linha do tempo com ações da proposta (status, revisões, uploads e mudanças de dados)."
          icon={<History size={16} />}
        />
      </section>

      <section className="mt-6">
        <EmptyState
          title="Cronologia e prazos"
          description="Área para acompanhar data de convite, envio, revisões e decisão final do cliente."
          icon={<FileClock size={16} />}
        />
      </section>
    </>
  );
}
