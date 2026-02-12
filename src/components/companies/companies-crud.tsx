"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { ListFiltersBar } from "@/components/shared/list-filters-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  createCompanyAction,
  createCompanySchema,
  type CreateCompanySchema,
  deleteCompanyAction,
  listCompaniesAction,
  type ListCompaniesSchema,
  updateCompanyAction,
} from "@/modules/companies/interface";
import { formatCnpj } from "@/shared/domain/cnpj";
import { COMPANY_STATUSES, type CompanyStatus } from "@/shared/domain/types";

interface CompaniesCrudProps {
  initialCompanies: CompanyPresenter[];
  initialError?: string | null;
  openCreateOnLoad?: boolean;
}

const defaultCompanyFormValues: CreateCompanySchema = {
  name: "",
  slug: null,
  cnpj: null,
  notes: null,
  status: "ativa",
};

function toNullableText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

type StatusFilter = ListCompaniesSchema["status"];

const COMPANY_STATUS_LABELS: Record<CompanyStatus, string> = {
  potencial: "Potencial",
  em_negociacao: "Em negociação",
  ativa: "Ativa",
  inativa: "Inativa",
  bloqueada: "Bloqueada",
};

const COMPANY_STATUS_BADGE_VARIANTS: Record<
  CompanyStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  potencial: "outline",
  em_negociacao: "default",
  ativa: "secondary",
  inativa: "outline",
  bloqueada: "destructive",
};

export function CompaniesCrud({
  initialCompanies,
  initialError = null,
  openCreateOnLoad = false,
}: CompaniesCrudProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [companies, setCompanies] = useState<CompanyPresenter[]>(initialCompanies);
  const [feedback, setFeedback] = useState<string | null>(initialError);
  const [editingCompany, setEditingCompany] = useState<CompanyPresenter | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(openCreateOnLoad);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isPending, startTransition] = useTransition();

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
        timeStyle: "short",
      }),
    [],
  );

  const form = useForm<CreateCompanySchema>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: defaultCompanyFormValues,
  });

  const clearCreateFlagFromUrl = () => {
    if (!searchParams.has("new")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("new");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  };

  const refreshCompanies = async (
    nextSearch: string,
    nextStatusFilter: StatusFilter,
  ) => {
    const result = await listCompaniesAction({
      search: toNullableText(nextSearch),
      status: nextStatusFilter,
    });

    if (!result.success) {
      setFeedback(`Erro: ${result.error}`);
      return;
    }

    setCompanies(result.data);
  };

  const resetFormToCreate = () => {
    setEditingCompany(null);
    form.reset(defaultCompanyFormValues);
  };

  const openCreateModal = () => {
    setFeedback(null);
    resetFormToCreate();
    setIsFormModalOpen(true);
  };

  const closeFormModalAndReset = () => {
    setIsFormModalOpen(false);
    clearCreateFlagFromUrl();
    resetFormToCreate();
  };

  const onSubmit = form.handleSubmit((values) => {
    setFeedback(null);

    startTransition(async () => {
      const normalizedInput = {
        name: values.name,
        slug: toNullableText(values.slug),
        cnpj: toNullableText(values.cnpj),
        notes: toNullableText(values.notes),
        status: values.status ?? "ativa",
      };

      const result = editingCompany
        ? await updateCompanyAction({
          id: editingCompany.id,
          ...normalizedInput,
        })
        : await createCompanyAction(normalizedInput);

      if (!result.success) {
        setFeedback(`Erro: ${result.error}`);
        return;
      }

      setFeedback(
        editingCompany
          ? `Empresa atualizada: ${result.data.name}`
          : `Empresa criada: ${result.data.name}`,
      );
      setIsFormModalOpen(false);
      clearCreateFlagFromUrl();
      resetFormToCreate();
      await refreshCompanies(search, statusFilter);
    });
  });

  const applyFilters = () => {
    setFeedback(null);
    startTransition(async () => {
      await refreshCompanies(search, statusFilter);
    });
  };

  const handleStatusTabChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
    setFeedback(null);
    startTransition(async () => {
      await refreshCompanies(search, value as StatusFilter);
    });
  };

  const handleEdit = (company: CompanyPresenter) => {
    setEditingCompany(company);
    setFeedback(null);
    form.reset({
      name: company.name,
      slug: company.slug,
      cnpj: formatCnpj(company.cnpj),
      notes: company.notes,
      status: company.status,
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = (company: CompanyPresenter) => {
    const confirmed = window.confirm(
      `Excluir a empresa "${company.name}"? Essa ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result = await deleteCompanyAction({
        companyId: company.id,
      });

      if (!result.success) {
        setFeedback(`Erro: ${result.error}`);
        return;
      }

      if (editingCompany?.id === company.id) {
        setIsFormModalOpen(false);
        resetFormToCreate();
      }

      setFeedback(`Empresa excluída: ${company.name}`);
      await refreshCompanies(search, statusFilter);
    });
  };

  return (
    <div className="space-y-4">
      <Dialog
        open={isFormModalOpen}
        onOpenChange={(open) => {
          setIsFormModalOpen(open);
          if (!open) {
            clearCreateFlagFromUrl();
            resetFormToCreate();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Editar empresa" : "Nova empresa"}
            </DialogTitle>
            <DialogDescription>
              Cadastro base de clientes para geração sequencial de propostas.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da empresa</Label>
                <Input id="name" {...form.register("name")} />
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="slug">Slug (opcional)</Label>
                <Input
                  id="slug"
                  placeholder="gerado automaticamente"
                  {...form.register("slug", {
                    setValueAs: (value) => toNullableText(value),
                  })}
                />
                {form.formState.errors.slug ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.slug.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Controller
                  name="cnpj"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const maskedValue = formatCnpj(event.target.value);
                        field.onChange(maskedValue.length > 0 ? maskedValue : null);
                      }}
                    />
                  )}
                />
                {form.formState.errors.cnpj ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.cnpj.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2 w-full">
                <Label htmlFor="status">Status</Label>
                <Controller
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="status" className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {COMPANY_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                rows={3}
                {...form.register("notes", {
                  setValueAs: (value) => toNullableText(value),
                })}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={closeFormModalAndReset}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? editingCompany
                    ? "Salvando..."
                    : "Criando..."
                  : editingCompany
                    ? "Salvar alterações"
                    : "Criar empresa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ListFiltersBar
        tabs={[
          { value: "all", label: "Todas as empresas" },
          ...COMPANY_STATUSES.map((status) => ({
            value: status,
            label: COMPANY_STATUS_LABELS[status],
          })),
        ]}
        activeTab={statusFilter}
        onTabChange={handleStatusTabChange}
        searchPlaceholder="Filtrar empresas..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchApply={applyFilters}
        primaryAction={{
          label: "Nova empresa",
          onClick: openCreateModal,
          icon: <Plus className="size-3.5" />,
          disabled: isPending,
        }}
      />

      <Card>
        <CardContent className="overflow-x-auto gap-4 space-y-4">


          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-2 py-2">Empresa</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">CNPJ</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Criada em</th>
                <th className="px-2 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr className="border-b border-border">
                  <td className="px-2 py-5 text-muted-foreground" colSpan={6}>
                    Nenhuma empresa cadastrada.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="border-b border-border">
                    <td className="px-2 py-3">
                      <p className="font-medium text-foreground">{company.name}</p>
                      {company.notes ? (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {company.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 font-mono text-xs text-muted-foreground">
                      {company.slug}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {company.cnpj ? formatCnpj(company.cnpj) : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={COMPANY_STATUS_BADGE_VARIANTS[company.status]}>
                        {COMPANY_STATUS_LABELS[company.status]}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(company.createdAt))}
                    </td>
                    <td className="px-2 py-3 w-[5%]">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(company)}
                          disabled={isPending}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(company)}
                          disabled={isPending}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {feedback ? (
        <p className="mt-4 rounded-md bg-muted px-3 py-2 text-sm text-foreground">
          {feedback}
        </p>
      ) : null}
    </div>
  );
}
