"use client";

import { Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { CreateProposalForm } from "@/components/proposals/create-proposal-form";
import { ListFiltersBar } from "@/components/shared/list-filters-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type StatusFilter = "all" | ProposalStatus;

function toNullableText(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
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
  const [feedback, setFeedback] = useState<string | null>(null);
  const isCreateModalVisible = isCreateModalOpen || searchParams.has("new");

  const refreshProposals = async (
    nextSearch: string,
    nextStatusFilter: StatusFilter,
  ) => {
    const result = await listProposalsAction({
      search: toNullableText(nextSearch),
      status: nextStatusFilter,
    });

    if (!result.success) {
      setFeedback(`Erro: ${result.error}`);
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
    setFeedback(null);
    startTransition(async () => {
      await refreshProposals(search, statusFilter);
    });
  };

  const handleStatusTabChange = (value: string) => {
    setStatusFilter(value as StatusFilter);
    setFeedback(null);
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
            setFeedback(null);
            setIsCreateModalOpen(true);
          },
          icon: <Plus className="size-3.5" />,
        }}
      />

      <CreateProposalForm
        open={isCreateModalVisible}
        onOpenChange={handleCreateModalChange}
        onCreated={(message) => {
          setFeedback(message);
          startTransition(async () => {
            await refreshProposals(search, statusFilter);
          });
        }}
      />

      <Card>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-2 py-2">Código</th>
                <th className="px-2 py-2">Projeto</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Valor</th>
                <th className="px-2 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {proposals.length === 0 ? (
                <tr className="border-b border-border">
                  <td className="px-2 py-5 text-muted-foreground" colSpan={5}>
                    {isPending
                      ? "Carregando propostas..."
                      : "Nenhuma proposta cadastrada."}
                  </td>
                </tr>
              ) : (
                proposals.map((proposal) => (
                  <tr key={proposal.id} className="border-b border-border">
                    <td className="px-2 py-3 font-mono text-xs">{proposal.code}</td>
                    <td className="px-2 py-3">{proposal.projectName}</td>
                    <td className="px-2 py-3">{PROPOSAL_STATUS_LABELS[proposal.status]}</td>
                    <td className="px-2 py-3 text-muted-foreground">
                      {proposal.finalValueBrl !== null
                        ? formatCurrencyBrl(proposal.finalValueBrl)
                        : proposal.estimatedValueBrl !== null
                          ? formatCurrencyBrl(proposal.estimatedValueBrl)
                          : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => router.push(`/propostas/${proposal.id}`)}
                      >
                        Abrir
                      </Button>
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
