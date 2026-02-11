"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Search, Trash2 } from "lucide-react";
import { type FormEvent, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
}: CompaniesCrudProps) {
  const [companies, setCompanies] = useState<CompanyPresenter[]>(initialCompanies);
  const [feedback, setFeedback] = useState<string | null>(initialError);
  const [editingCompany, setEditingCompany] = useState<CompanyPresenter | null>(null);
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
      resetFormToCreate();
      await refreshCompanies(search, statusFilter);
    });
  });

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    startTransition(async () => {
      await refreshCompanies(search, statusFilter);
    });
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setFeedback(null);

    startTransition(async () => {
      await refreshCompanies("", "all");
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
        resetFormToCreate();
      }

      setFeedback(`Empresa excluída: ${company.name}`);
      await refreshCompanies(search, statusFilter);
    });
  };

  return (
    <>
      <section className="mb-4 rounded-xl border border-[#d6dde6] bg-white p-4">
        <form
          className="grid gap-3 md:grid-cols-[2fr_1fr_auto_auto]"
          onSubmit={handleApplyFilters}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#5b6d84]"
              size={14}
            />
            <Input
              className="pl-9"
              placeholder="Buscar por nome, slug ou CNPJ"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="h-9 w-full">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {COMPANY_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {COMPANY_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button type="submit" variant="secondary" disabled={isPending}>
            {isPending ? "Filtrando..." : "Aplicar filtros"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleClearFilters}
            disabled={isPending}
          >
            Limpar
          </Button>
        </form>
      </section>

      <Card id="company-form" className="mb-4">
        <CardHeader>
          <CardTitle>
            {editingCompany ? "Editar empresa" : "Nova empresa"}
          </CardTitle>
          <CardDescription>
            Cadastro base de clientes para geração sequencial de propostas.
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            <div className="flex flex-wrap justify-end gap-2">
              {editingCompany ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetFormToCreate}
                  disabled={isPending}
                >
                  Cancelar edição
                </Button>
              ) : null}
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? editingCompany
                    ? "Salvando..."
                    : "Criando..."
                  : editingCompany
                    ? "Salvar alterações"
                    : "Criar empresa"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de empresas</CardTitle>
          <CardDescription>
            Empresas disponíveis para criação de propostas e controle comercial.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#e3e9f1] text-[#5b6d84]">
                <th className="px-2 py-2">Empresa</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">CNPJ</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Criada em</th>
                <th className="px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr className="border-b border-[#f0f4f9]">
                  <td className="px-2 py-5 text-[#5b6d84]" colSpan={6}>
                    Nenhuma empresa cadastrada.
                  </td>
                </tr>
              ) : (
                companies.map((company) => (
                  <tr key={company.id} className="border-b border-[#f0f4f9]">
                    <td className="px-2 py-3">
                      <p className="font-medium text-[#0b1220]">{company.name}</p>
                      {company.notes ? (
                        <p className="mt-1 line-clamp-1 text-xs text-[#5b6d84]">
                          {company.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 font-mono text-xs text-[#42556d]">
                      {company.slug}
                    </td>
                    <td className="px-2 py-3 text-[#42556d]">
                      {company.cnpj ? formatCnpj(company.cnpj) : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={COMPANY_STATUS_BADGE_VARIANTS[company.status]}>
                        {COMPANY_STATUS_LABELS[company.status]}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-xs text-[#5b6d84]">
                      {dateFormatter.format(new Date(company.createdAt))}
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(company)}
                          disabled={isPending}
                        >
                          <Pencil size={13} />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(company)}
                          disabled={isPending}
                        >
                          <Trash2 size={13} />
                          Excluir
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
        <p className="mt-4 rounded-md bg-[#f5f8fb] px-3 py-2 text-sm text-[#12304a]">
          {feedback}
        </p>
      ) : null}
    </>
  );
}
