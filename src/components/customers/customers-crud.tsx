"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

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
  type CustomerPresenter,
  createCustomerAction,
  createCustomerSchema,
  type CreateCustomerSchema,
  deleteCustomerAction,
  listCustomersAction,
  type ListCustomersSchema,
  updateCustomerAction,
} from "@/modules/customers/interface";
import { formatCnpj } from "@/shared/domain/cnpj";
import { CUSTOMER_STATUSES, type CustomerStatus } from "@/shared/domain/types";

interface CustomersCrudProps {
  initialCustomers: CustomerPresenter[];
  initialError?: string | null;
  openCreateOnLoad?: boolean;
}

const defaultCustomerFormValues: CreateCustomerSchema = {
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

type StatusFilter = ListCustomersSchema["status"];

const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  potencial: "Potencial",
  em_negociacao: "Em negociação",
  ativa: "Ativa",
  inativa: "Inativa",
  bloqueada: "Bloqueada",
};

const CUSTOMER_STATUS_BADGE_VARIANTS: Record<
  CustomerStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  potencial: "outline",
  em_negociacao: "default",
  ativa: "secondary",
  inativa: "outline",
  bloqueada: "destructive",
};

export function CustomersCrud({
  initialCustomers,
  initialError = null,
  openCreateOnLoad = false,
}: CustomersCrudProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [customers, setCustomers] = useState<CustomerPresenter[]>(initialCustomers);
  const [editingCustomer, setEditingCustomer] = useState<CustomerPresenter | null>(null);
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

  const form = useForm<CreateCustomerSchema>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: defaultCustomerFormValues,
  });

  useEffect(() => {
    if (!initialError) {
      return;
    }

    toast.error(initialError);
  }, [initialError]);

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

  const refreshCustomers = async (
    nextSearch: string,
    nextStatusFilter: StatusFilter,
  ) => {
    const result = await listCustomersAction({
      search: toNullableText(nextSearch),
      status: nextStatusFilter,
    });

    if (!result.success) {
      toast.error(`Erro: ${result.error}`);
      return;
    }

    setCustomers(result.data);
  };

  const resetFormToCreate = () => {
    setEditingCustomer(null);
    form.reset(defaultCustomerFormValues);
  };

  const openCreateModal = () => {
    resetFormToCreate();
    setIsFormModalOpen(true);
  };

  const closeFormModalAndReset = () => {
    setIsFormModalOpen(false);
    clearCreateFlagFromUrl();
    resetFormToCreate();
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const normalizedInput = {
        name: values.name,
        slug: toNullableText(values.slug),
        cnpj: toNullableText(values.cnpj),
        notes: toNullableText(values.notes),
        status: values.status ?? "ativa",
      };

      const result = editingCustomer
        ? await updateCustomerAction({
          id: editingCustomer.id,
          ...normalizedInput,
        })
        : await createCustomerAction(normalizedInput);

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
        return;
      }

      toast.success(
        editingCustomer
          ? `Cliente atualizado: ${result.data.name}`
          : `Cliente criado: ${result.data.name}`,
      );
      setIsFormModalOpen(false);
      clearCreateFlagFromUrl();
      resetFormToCreate();
      await refreshCustomers(search, statusFilter);
    });
  });

  const applyFilters = () => {
    startTransition(async () => {
      await refreshCustomers(search, statusFilter);
    });
  };

  const handleStatusTabChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
    startTransition(async () => {
      await refreshCustomers(search, value as StatusFilter);
    });
  };

  const handleEdit = (customer: CustomerPresenter) => {
    setEditingCustomer(customer);
    form.reset({
      name: customer.name,
      slug: customer.slug,
      cnpj: formatCnpj(customer.cnpj),
      notes: customer.notes,
      status: customer.status,
    });
    setIsFormModalOpen(true);
  };

  const handleDelete = (customer: CustomerPresenter) => {
    const confirmed = window.confirm(
      `Excluir o cliente "${customer.name}"? Essa ação não pode ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCustomerAction({
        customerId: customer.id,
      });

      if (!result.success) {
        toast.error(`Erro: ${result.error}`);
        return;
      }

      if (editingCustomer?.id === customer.id) {
        setIsFormModalOpen(false);
        resetFormToCreate();
      }

      toast.success(`Cliente excluído: ${customer.name}`);
      await refreshCustomers(search, statusFilter);
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
              {editingCustomer ? "Editar cliente" : "Novo cliente"}
            </DialogTitle>
            <DialogDescription>
              Cadastro base de clientes para geração sequencial de propostas.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do cliente</Label>
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
                        {CUSTOMER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {CUSTOMER_STATUS_LABELS[status]}
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
                  ? editingCustomer
                    ? "Salvando..."
                    : "Criando..."
                  : editingCustomer
                    ? "Salvar alterações"
                    : "Criar cliente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ListFiltersBar
        tabs={[
          { value: "all", label: "Todos os clientes" },
          ...CUSTOMER_STATUSES.map((status) => ({
            value: status,
            label: CUSTOMER_STATUS_LABELS[status],
          })),
        ]}
        activeTab={statusFilter}
        onTabChange={handleStatusTabChange}
        searchPlaceholder="Filtrar clientes..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchApply={applyFilters}
        primaryAction={{
          label: "Novo cliente",
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
                <th className="px-2 py-2">Cliente</th>
                <th className="px-2 py-2">Slug</th>
                <th className="px-2 py-2">CNPJ</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Criado em</th>
                <th className="px-2 py-2 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr className="border-b border-border">
                  <td className="px-2 py-5 text-muted-foreground" colSpan={6}>
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border">
                    <td className="px-2 py-3">
                      <p className="font-medium text-foreground">{customer.name}</p>
                      {customer.notes ? (
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {customer.notes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3 font-mono text-xs text-muted-foreground">
                      {customer.slug}
                    </td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {customer.cnpj ? formatCnpj(customer.cnpj) : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <Badge variant={CUSTOMER_STATUS_BADGE_VARIANTS[customer.status]}>
                        {CUSTOMER_STATUS_LABELS[customer.status]}
                      </Badge>
                    </td>
                    <td className="px-2 py-3 text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(customer.createdAt))}
                    </td>
                    <td className="px-2 py-3 w-[5%]">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => handleEdit(customer)}
                          disabled={isPending}
                        >
                          <Pencil size={13} />
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(customer)}
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
    </div>
  );
}
