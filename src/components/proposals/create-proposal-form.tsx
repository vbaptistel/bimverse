"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type CompanyPresenter,
  listCompaniesAction,
} from "@/modules/companies/interface";
import { createProposalAction } from "@/modules/proposals/interface/actions/create-proposal.action";
import {
  createProposalSchema,
  type CreateProposalSchema,
} from "@/modules/proposals/interface/schemas/proposal.schema";
import {
  formatCurrencyBrl,
  parseCurrencyBrlInput,
} from "@/shared/domain/currency";

interface CreateProposalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (message: string) => void;
}

function buildDefaultValues(year: number): CreateProposalSchema {
  return {
    companyId: "",
    year,
    invitationCode: "",
    projectName: "",
    scopeDescription: "",
    dueDate: null,
    estimatedValueBrl: null,
  };
}

export function CreateProposalForm({
  open,
  onOpenChange,
  onCreated,
}: CreateProposalFormProps) {
  const [isPending, startTransition] = useTransition();
  const [isLoadingCompanies, startLoadingCompanies] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [companies, setCompanies] = useState<CompanyPresenter[]>([]);

  const defaultYear = useMemo(() => new Date().getFullYear(), []);

  const form = useForm<CreateProposalSchema>({
    resolver: zodResolver(createProposalSchema),
    defaultValues: buildDefaultValues(defaultYear),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    let isActive = true;

    startLoadingCompanies(async () => {
      const result = await listCompaniesAction();

      if (!isActive) {
        return;
      }

      if (!result.success) {
        setFeedback(`Erro: ${result.error}`);
        return;
      }

      setCompanies(result.data);
    });

    return () => {
      isActive = false;
    };
  }, [open, startLoadingCompanies]);

  const closeAndReset = () => {
    setFeedback(null);
    form.reset(buildDefaultValues(defaultYear));
    onOpenChange(false);
  };

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

      const successMessage = `Proposta criada: ${result.data.proposal.code} (R${result.data.initialRevision.revisionNumber})`;
      onCreated?.(successMessage);
      closeAndReset();
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          closeAndReset();
          return;
        }

        onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Proposta</DialogTitle>
          <DialogDescription>
            Cadastre uma nova proposta para uma empresa.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2 w-full">
            <Label htmlFor="companyId">Empresa</Label>
            <Controller
              name="companyId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={isLoadingCompanies || companies.length === 0}
                >
                  <SelectTrigger id="companyId" className="h-9 w-full">
                    <SelectValue
                      placeholder={
                        isLoadingCompanies
                          ? "Carregando empresas..."
                          : companies.length === 0
                            ? "Nenhuma empresa cadastrada"
                            : "Selecione uma empresa"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.companyId ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.companyId.message}
              </p>
            ) : null}
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
              <Controller
                name="estimatedValueBrl"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="estimatedValueBrl"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="R$ 0,00"
                    value={
                      field.value === null || field.value === undefined
                        ? ""
                        : formatCurrencyBrl(field.value)
                    }
                    onBlur={field.onBlur}
                    onChange={(event) =>
                      field.onChange(parseCurrencyBrlInput(event.target.value))
                    }
                  />
                )}
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

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={closeAndReset}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending || isLoadingCompanies || companies.length === 0}
            >
              {isPending ? "Criando..." : "Criar proposta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
