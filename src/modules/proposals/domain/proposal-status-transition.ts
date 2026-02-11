import type { ProposalStatus } from "@/shared/domain/types";

const FINAL_STATUSES: ProposalStatus[] = ["ganha", "perdida", "cancelada"];

const TRANSITIONS: Record<ProposalStatus, ProposalStatus[]> = {
  recebida: ["em_elaboracao", "cancelada"],
  em_elaboracao: ["enviada", "cancelada"],
  enviada: ["em_revisao", "ganha", "perdida", "cancelada"],
  em_revisao: ["enviada", "ganha", "perdida", "cancelada"],
  ganha: [],
  perdida: [],
  cancelada: [],
};

export function isFinalStatus(status: ProposalStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

export function isValidProposalStatusTransition(
  currentStatus: ProposalStatus,
  nextStatus: ProposalStatus,
): boolean {
  return TRANSITIONS[currentStatus].includes(nextStatus);
}
