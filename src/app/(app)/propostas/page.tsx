"use client";

import type { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { CreateProposalForm } from "@/components/proposals/create-proposal-form";
import { ListFiltersBar } from "@/components/shared/list-filters-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  type ProposalPresenter,
  listProposalsAction,
} from "@/modules/proposals/interface";
import { formatCurrencyBrl } from "@/shared/domain/currency";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/shared/domain/types";

const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  recebida: "Recebida",
  em_elaboracao: "Em elaboração",
  enviada: "Enviada",
  em_revisao: "Em revisão",
  ganha: "Ganha",
  perdida: "Perdida",
  cancelada: "Cancelada",
};

const PROPOSAL_STATUS_BADGE_CLASSNAMES: Record<ProposalStatus, string> = {
  recebida: "border-slate-300 bg-slate-100 text-slate-900",
  em_elaboracao: "border-amber-300 bg-amber-100 text-amber-900",
  enviada: "border-blue-300 bg-blue-100 text-blue-900",
  em_revisao: "border-cyan-300 bg-cyan-100 text-cyan-900",
  ganha: "border-emerald-300 bg-emerald-100 text-emerald-900",
  perdida: "border-rose-300 bg-rose-100 text-rose-900",
  cancelada: "border-zinc-300 bg-zinc-100 text-zinc-900",
};

type StatusFilter = "all" | ProposalStatus;

function toNullableText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function SortableHeader<TData>({
  column,
  label,
  align = "left",
}: {
  column: Column<TData, unknown>;
  label: string;
  align?: "left" | "center" | "right";
}) {
  const sortDirection = column.getIsSorted();
  const isCentered = align === "center";
  const isRightAligned = align === "right";

  return (
    <div
      className={
        isCentered
          ? "flex w-full justify-center"
          : isRightAligned
            ? "flex w-full justify-end"
            : ""
      }
    >
      <Button
        type="button"
        variant="ghost"
        className={isCentered || isRightAligned ? "h-8 px-2" : "-ml-2 h-8 px-2"}
        onClick={() => column.toggleSorting(sortDirection === "asc")}
      >
        {label}
        {sortDirection === "asc" ? (
          <ArrowUp className="size-4" />
        ) : sortDirection === "desc" ? (
          <ArrowDown className="size-4" />
        ) : (
          <ArrowUpDown className="size-4" />
        )}
      </Button>
    </div>
  );
}

export default function ProposalsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [proposals, setProposals] = useState<ProposalPresenter[]>([]);
  const isCreateModalVisible = isCreateModalOpen || searchParams.has("new");

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        dateStyle: "short",
      }),
    [],
  );

  const columns = useMemo<ColumnDef<ProposalPresenter>[]>(
    () => [
      {
        accessorKey: "code",
        header: ({ column }) => <SortableHeader column={column} label="Código" />,
      },
      {
        id: "customerName",
        accessorFn: (row) => row.customer?.name ?? "",
        header: ({ column }) => <SortableHeader column={column} label="Cliente" />,
        cell: ({ row }) => row.original.customer?.name ?? "—",
      },
      {
        accessorKey: "projectName",
        header: ({ column }) => <SortableHeader column={column} label="Projeto" />,
        cell: ({ row }) => (
          <span
            className="block max-w-[34rem] truncate"
            title={row.original.projectName}
          >
            {row.original.projectName}
          </span>
        ),
      },
      {
        accessorKey: "status",
        accessorFn: (row) => PROPOSAL_STATUS_LABELS[row.status],
        header: ({ column }) => <SortableHeader column={column} label="Status" />,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={PROPOSAL_STATUS_BADGE_CLASSNAMES[row.original.status]}
          >
            {PROPOSAL_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        id: "currentRevision",
        accessorFn: (row) => row.currentRevisionNumber,
        header: ({ column }) => (
          <SortableHeader column={column} label="Revisão atual" align="center" />
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue<number | null>(columnId);
          const b = rowB.getValue<number | null>(columnId);

          if (a === null && b === null) {
            return 0;
          }
          if (a === null) {
            return 1;
          }
          if (b === null) {
            return -1;
          }

          return a - b;
        },
        cell: ({ row }) => (
          <span className="block text-center">
            {row.original.currentRevisionNumber !== null
              ? `R${row.original.currentRevisionNumber}`
              : "—"}
          </span>
        ),
      },
      {
        id: "dueDate",
        accessorFn: (row) => row.dueDate,
        header: ({ column }) => <SortableHeader column={column} label="Prazo" />,
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue<string | null>(columnId);
          const b = rowB.getValue<string | null>(columnId);

          if (!a && !b) {
            return 0;
          }
          if (!a) {
            return 1;
          }
          if (!b) {
            return -1;
          }

          return new Date(a).getTime() - new Date(b).getTime();
        },
        cell: ({ row }) =>
          row.original.dueDate
            ? dateFormatter.format(new Date(row.original.dueDate))
            : "—",
      },
      {
        id: "value",
        accessorFn: (row) => row.finalValueBrl ?? row.estimatedValueBrl,
        header: ({ column }) => (
          <SortableHeader column={column} label="Valor" align="right" />
        ),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue<number | null>(columnId);
          const b = rowB.getValue<number | null>(columnId);

          if (a === null && b === null) {
            return 0;
          }
          if (a === null) {
            return 1;
          }
          if (b === null) {
            return -1;
          }

          return a - b;
        },
        cell: ({ row }) => {
          const value = row.original.finalValueBrl ?? row.original.estimatedValueBrl;
          return (
            <span className="block text-right text-muted-foreground">
              {value !== null ? formatCurrencyBrl(value) : "—"}
            </span>
          );
        },
      },
      {
        id: "actions",
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => router.push(`/propostas/${row.original.id}`)}
          >
            <Eye className="size-3.5" />
          </Button>
        ),
      },
    ],
    [dateFormatter, router],
  );

  const refreshProposals = async (
    nextSearch: string,
    nextStatusFilter: StatusFilter,
  ) => {
    const result = await listProposalsAction({
      search: toNullableText(nextSearch),
      status: nextStatusFilter,
    });

    if (!result.success) {
      toast.error(`Erro: ${result.error}`);
      return;
    }

    setProposals(result.data);
  };

  useEffect(() => {
    startTransition(async () => {
      await refreshProposals("", "all");
    });
  }, [startTransition]);

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

  const handleCreateModalChange = (open: boolean) => {
    setIsCreateModalOpen(open);
    if (!open) {
      clearCreateFlagFromUrl();
    }
  };

  const applyFilters = () => {
    startTransition(async () => {
      await refreshProposals(search, statusFilter);
    });
  };

  const handleStatusTabChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
    startTransition(async () => {
      await refreshProposals(search, value as StatusFilter);
    });
  };

  return (
    <div className="space-y-4">
      <ListFiltersBar
        tabs={[
          { value: "all", label: "Todas" },
          ...PROPOSAL_STATUSES.map((status) => ({
            value: status,
            label: PROPOSAL_STATUS_LABELS[status],
          })),
        ]}
        activeTab={statusFilter}
        onTabChange={handleStatusTabChange}
        searchPlaceholder="Filtrar propostas..."
        searchValue={search}
        onSearchChange={setSearch}
        onSearchApply={applyFilters}
        primaryAction={{
          label: "Nova proposta",
          onClick: () => {
            setIsCreateModalOpen(true);
          },
          icon: <Plus className="size-3.5" />,
        }}
      />

      <CreateProposalForm
        open={isCreateModalVisible}
        onOpenChange={handleCreateModalChange}
        onCreated={(message) => {
          toast.success(message);
          startTransition(async () => {
            await refreshProposals(search, statusFilter);
          });
        }}
      />

      <Card>
        <CardContent>
          <DataTable
            columns={columns}
            data={proposals}
            tableClassName="min-w-[760px] text-left text-sm"
            isLoading={isPending}
            loadingMessage="Carregando propostas..."
            emptyMessage="Nenhuma proposta cadastrada."
          />
        </CardContent>
      </Card>
    </div>
  );
}
