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
import { Switch } from "@/components/ui/switch";
import {
  type CreateSupplierSchema,
  createSupplierAction,
  createSupplierSchema,
  deleteSupplierAction,
  listSuppliersAction,
  type ListSuppliersSchema,
  type SupplierPresenter,
  updateSupplierAction,
} from "@/modules/suppliers/interface";
import { formatCnpj } from "@/shared/domain/cnpj";
import { formatCurrencyBrl, parseCurrencyBrlInput } from "@/shared/domain/currency";
import { formatPhone } from "@/shared/domain/phone";

interface SuppliersCrudProps {
  initialSuppliers: SupplierPresenter[];
  initialError?: string | null;
  openCreateOnLoad?: boolean;
}

const defaultSupplierFormValues: CreateSupplierSchema = {
  legalName: "",
  cnpj: "",
  specialty: "",
  hourlyCostBrl: null,
  contactName: null,
  contactEmail: null,
  contactPhone: null,
  active: true,
};

type StatusFilter = ListSuppliersSchema["status"];

function toNullableText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function getContactLines(supplier: SupplierPresenter): {
  primary: string;
  secondary: string | null;
} {
  const formattedPhone = supplier.contactPhone
    ? formatPhone(supplier.contactPhone) || supplier.contactPhone
    : null;

  if (supplier.contactName) {
    return {
      primary: supplier.contactName,
      secondary: supplier.contactEmail ?? formattedPhone,
    };
  }

  if (supplier.contactEmail && formattedPhone) {
    return {
      primary: supplier.contactEmail,
      secondary: formattedPhone,
    };
  }

  if (supplier.contactEmail) {
    return {
      primary: supplier.contactEmail,
      secondary: null,
    };
  }

  if (formattedPhone) {
    return {
      primary: formattedPhone,
      secondary: null,
    };
  }

  return {
    primary: "—",
    secondary: null,
  };
}

export function SuppliersCrud({
  initialSuppliers,
  initialError = null,
  openCreateOnLoad = false,
}: SuppliersCrudProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [suppliers, setSuppliers] = useState<SupplierPresenter[]>(initialSuppliers);
  const [feedback, setFeedback] = useState<string | null>(initialError);
  const [editingSupplier, setEditingSupplier] = useState<SupplierPresenter | null>(null);
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

  const form = useForm<CreateSupplierSchema>({
    resolver: zodResolver(createSupplierSchema),
    defaultValues: defaultSupplierFormValues,
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

  const refreshSuppliers = async (
    nextSearch: string,
    nextStatusFilter: StatusFilter,
  ) => {
    const result = await listSuppliersAction({
      search: toNullableText(nextSearch),
      status: nextStatusFilter,
    });

    if (!result.success) {
      setFeedback(`Erro: ${result.error}`);
      return;
    }

    setSuppliers(result.data);
  };

  const resetFormToCreate = () => {
    setEditingSupplier(null);
    form.reset(defaultSupplierFormValues);
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
        legalName: values.legalName,
        cnpj: values.cnpj,
        specialty: values.specialty,
        hourlyCostBrl: values.hourlyCostBrl ?? null,
        contactName: toNullableText(values.contactName),
        contactEmail: toNullableText(values.contactEmail),
        contactPhone: toNullableText(values.contactPhone),
        active: values.active ?? true,
      };

      const result = editingSupplier
        ? await updateSupplierAction({
            id: editingSupplier.id,
            ...normalizedInput,
          })
        : await createSupplierAction(normalizedInput);

      if (!result.success) {
        setFeedback(`Erro: ${result.error}`);
        return;
      }

      setFeedback(
        editingSupplier
          ? `Fornecedor atualizado: ${result.data.legalName}`
          : `Fornecedor criado: ${result.data.legalName}`,
      );
      setIsFormModalOpen(false);
      clearCreateFlagFromUrl();
      resetFormToCreate();
      await refreshSuppliers(search, statusFilter);
    });
  });

  const applyFilters = () => {
    setFeedback(null);
    startTransition(async () => {
      await refreshSuppliers(search, statusFilter);
    });
  };

  const handleStatusTabChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
    setFeedback(null);
    startTransition(async () => {
      await refreshSuppliers(search, value as StatusFilter);
    });
  };

  const handleEdit = (supplier: SupplierPresenter) => {
    setEditingSupplier(supplier);
    setFeedback(null);
    form.reset({
      legalName: supplier.legalName,
      cnpj: formatCnpj(supplier.cnpj),
      specialty: supplier.specialty,
      hourlyCostBrl: supplier.hourlyCostBrl,
      contactName: supplier.contactName,
      contactEmail: supplier.contactEmail,
      contactPhone: formatPhone(supplier.contactPhone),
      active: supplier.active,
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = (supplier: SupplierPresenter) => {
    const confirmed = window.confirm(
      `Excluir o fornecedor "${supplier.legalName}"? Essa ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setFeedback(null);

    startTransition(async () => {
      const result = await deleteSupplierAction({
        supplierId: supplier.id,
      });

      if (!result.success) {
        setFeedback(`Erro: ${result.error}`);
        return;
      }

      if (editingSupplier?.id === supplier.id) {
        setIsFormModalOpen(false);
        resetFormToCreate();
      }

      setFeedback(`Fornecedor excluído: ${supplier.legalName}`);
      await refreshSuppliers(search, statusFilter);
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
              {editingSupplier ? "Editar fornecedor" : "Novo fornecedor"}
            </DialogTitle>
            <DialogDescription>
              Cadastro de fornecedores para composição de propostas e revisões.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="legalName">Razão social</Label>
              <Input id="legalName" {...form.register("legalName")} />
              {form.formState.errors.legalName ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.legalName.message}
                </p>
              ) : null}
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
                        field.onChange(maskedValue);
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

              <div className="grid gap-2">
                <Label htmlFor="specialty">Especialidade</Label>
                <Input id="specialty" {...form.register("specialty")} />
                {form.formState.errors.specialty ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.specialty.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="hourlyCostBrl">Custo/hora (BRL)</Label>
                <Controller
                  name="hourlyCostBrl"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="hourlyCostBrl"
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
                {form.formState.errors.hourlyCostBrl ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.hourlyCostBrl.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contactPhone">Telefone</Label>
                <Controller
                  name="contactPhone"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="contactPhone"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={field.value ?? ""}
                      onBlur={field.onBlur}
                      onChange={(event) => {
                        const maskedValue = formatPhone(event.target.value);
                        field.onChange(maskedValue.length > 0 ? maskedValue : null);
                      }}
                    />
                  )}
                />
                {form.formState.errors.contactPhone ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.contactPhone.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="contactName">Contato</Label>
                <Input
                  id="contactName"
                  {...form.register("contactName", {
                    setValueAs: (value) => toNullableText(value),
                  })}
                />
                {form.formState.errors.contactName ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.contactName.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contactEmail">E-mail</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="contato@fornecedor.com"
                  {...form.register("contactEmail", {
                    setValueAs: (value) => toNullableText(value),
                  })}
                />
                {form.formState.errors.contactEmail ? (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.contactEmail.message}
                  </p>
                ) : null}
              </div>
            </div>

            <Controller
              name="active"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Status do fornecedor</p>
                    <p className="text-xs text-muted-foreground">
                      {field.value ? "Fornecedor ativo" : "Fornecedor inativo"}
                    </p>
                  </div>
                  <Switch
                    checked={field.value ?? true}
                    onCheckedChange={field.onChange}
                    disabled={isPending}
                  />
                </div>
              )}
            />

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
                  ? editingSupplier
                    ? "Salvando..."
                    : "Criando..."
                  : editingSupplier
                    ? "Salvar alterações"
                    : "Criar fornecedor"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ListFiltersBar
        tabs={[
          { value: "all", label: "Todos os fornecedores" },
          { value: "active", label: "Ativos" },
          { value: "inactive", label: "Inativos" },
        ]}
        activeTab={statusFilter}
        onTabChange={handleStatusTabChange}
        searchPlaceholder="Filtrar fornecedores..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchApply={applyFilters}
        primaryAction={{
          label: "Novo fornecedor",
          onClick: openCreateModal,
          icon: <Plus className="size-3.5" />,
          disabled: isPending,
        }}
      />

      <Card>
        <CardContent className="overflow-x-auto gap-4 space-y-4">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-2 py-2">Fornecedor</th>
                <th className="px-2 py-2">CNPJ</th>
                <th className="px-2 py-2">Especialidade</th>
                <th className="px-2 py-2">Custo/hora</th>
                <th className="px-2 py-2">Contato</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Criado em</th>
                <th className="px-2 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {suppliers.length === 0 ? (
                <tr className="border-b border-border">
                  <td className="px-2 py-5 text-muted-foreground" colSpan={8}>
                    Nenhum fornecedor cadastrado.
                  </td>
                </tr>
              ) : (
                suppliers.map((supplier) => {
                  const contactLines = getContactLines(supplier);

                  return (
                    <tr key={supplier.id} className="border-b border-border">
                      <td className="px-2 py-3 font-medium text-foreground">
                        {supplier.legalName}
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {formatCnpj(supplier.cnpj)}
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {supplier.specialty}
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        {supplier.hourlyCostBrl !== null
                          ? formatCurrencyBrl(supplier.hourlyCostBrl)
                          : "—"}
                      </td>
                      <td className="px-2 py-3 text-muted-foreground">
                        <p>{contactLines.primary}</p>
                        {contactLines.secondary ? (
                          <p className="text-xs">{contactLines.secondary}</p>
                        ) : null}
                      </td>
                      <td className="px-2 py-3">
                        <Badge variant={supplier.active ? "secondary" : "outline"}>
                          {supplier.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="px-2 py-3 text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(supplier.createdAt))}
                      </td>
                      <td className="px-2 py-3 w-[5%]">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleEdit(supplier)}
                            disabled={isPending}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(supplier)}
                            disabled={isPending}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
