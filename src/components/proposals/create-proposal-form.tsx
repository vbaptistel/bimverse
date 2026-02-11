"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";

import { createProposalAction } from "@/modules/proposals/interface/actions/create-proposal.action";
import {
  createProposalSchema,
  type CreateProposalSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CreateProposalForm() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const defaultYear = useMemo(() => new Date().getFullYear(), []);

  const form = useForm<CreateProposalSchema>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: {
      companyId: "",
      year: defaultYear,
      invitationCode: "",
      projectName: "",
      scopeDescription: "",
      dueDate: null,
      estimatedValueBrl: null,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setFeedback(null);

    startTransition(async () => {
      const result = await createProposalAction({
        ...values,
        invitationCode: values.invitationCode || null,
        dueDate: values.dueDate || null,
        estimatedValueBrl: values.estimatedValueBrl ?? null,
      });

      if (!result.success) {
        setFeedback(`Erro: ${result.error}`);
        return;
      }

      setFeedback(
        `Proposta criada: ${result.data.proposal.code} (R${result.data.initialRevision.revisionNumber})`,
      );
      form.reset({
        ...values,
        projectName: "",
        scopeDescription: "",
        invitationCode: "",
        dueDate: null,
        estimatedValueBrl: null,
      });
    });
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Proposta</CardTitle>
        <CardDescription>
          Server Action → UseCase → Repositório. O texto da proposta continua no
          Word; aqui fica o controle comercial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="companyId">Company ID (UUID)</Label>
            <Input id="companyId" {...form.register("companyId")} />
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="year">Ano</Label>
              <Input
                id="year"
                type="number"
                {...form.register("year", { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estimatedValueBrl">Valor estimado (BRL)</Label>
              <Input
                id="estimatedValueBrl"
                type="number"
                step="0.01"
                {...form.register("estimatedValueBrl", {
                  setValueAs: (value) => {
                    if (value === "" || value === undefined) {
                      return null;
                    }

                    return Number(value);
                  },
                })}
              />
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="invitationCode">Código carta-convite</Label>
              <Input id="invitationCode" {...form.register("invitationCode")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Prazo</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate", {
                  setValueAs: (value) => (value ? value : null),
                })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="projectName">Nome do projeto</Label>
            <Input id="projectName" {...form.register("projectName")} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="scopeDescription">Descrição do escopo</Label>
            <Textarea id="scopeDescription" {...form.register("scopeDescription")} />
          </div>

          {feedback ? (
            <p className="rounded-md bg-[#f5f8fb] px-3 py-2 text-sm text-[#12304a]">
              {feedback}
            </p>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Criando..." : "Criar proposta"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
