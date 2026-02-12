"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

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
  type CustomerPresenter,
  listCustomersAction,
} from "@/modules/customers/interface";
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
    customerId: "",
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
  const [isLoadingCustomers, startLoadingCustomers] = useTransition();
  const [customers, setCustomers] = useState<CustomerPresenter[]>([]);

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

    startLoadingCustomers(async () => {
      const result = await listCustomersAction();

      if (!isActive) {
        return;
      }

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
        return;
      }

      setCustomers(result.data);
    });

    return () => {
      isActive = false;
    };
  }, [open, startLoadingCustomers]);

  const closeAndReset = () => {
    form.reset(buildDefaultValues(defaultYear));
    onOpenChange(false);
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await createProposalAction({
        ...values,
        invitationCode: values.invitationCode || null,
        dueDate: values.dueDate || null,
        estimatedValueBrl: values.estimatedValueBrl ?? null,
      });

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
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
            Cadastre uma nova proposta para um cliente.
          </DialogDescription>
        </DialogHeader>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-2 w-full">
            <Label htmlFor="customerId">Cliente</Label>
            <Controller
              name="customerId"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value || undefined}
                  onValueChange={field.onChange}
                  disabled={isLoadingCustomers || customers.length === 0}
                >
                  <SelectTrigger id="customerId" className="h-9 w-full">
                    <SelectValue
                      placeholder={
                        isLoadingCustomers
                          ? "Carregando clientes..."
                          : customers.length === 0
                            ? "Nenhum cliente cadastrado"
                            : "Selecione um cliente"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.customerId ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.customerId.message}
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
              disabled={isPending || isLoadingCustomers || customers.length === 0}
            >
              {isPending ? "Criando..." : "Criar proposta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
