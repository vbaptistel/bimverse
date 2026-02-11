import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CreateProposalForm } from "@/components/proposals/create-proposal-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export default function NewProposalPage() {
  return (
    <>
      <PageHeader
        badge="Operação"
        title="Nova Proposta"
        description="Cadastro comercial inicial da proposta com geração de código BV-CLIENTE-ANO-BIM-SEQ."
        action={
          <Link href="/propostas">
            <Button variant="secondary">
              <ArrowLeft size={14} /> Voltar para propostas
            </Button>
          </Link>
        }
      />

      <CreateProposalForm />
    </>
  );
}
