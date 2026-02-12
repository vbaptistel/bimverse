import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { CreateProposalForm } from "@/components/proposals/create-proposal-form";
import { Button } from "@/components/ui/button";

export default function NewProposalPage() {
  return (
    <>
      <section className="mb-4 flex justify-end">
        <Button asChild variant="secondary">
          <Link href="/propostas">
            <ArrowLeft size={14} /> Voltar para propostas
          </Link>
        </Button>
      </section>

      <CreateProposalForm />
    </>
  );
}
