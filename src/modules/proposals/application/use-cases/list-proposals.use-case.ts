import type {
  ListProposalsFilters,
  ProposalListRecord,
  ProposalRepositoryPort,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { UseCase } from "@/shared/application/use-case";

export type ListProposalsInput = ListProposalsFilters;

export class ListProposalsUseCase
  implements UseCase<ListProposalsInput | void, ProposalListRecord[]>
{
  constructor(private readonly proposalRepository: ProposalRepositoryPort) {}

  async execute(input?: ListProposalsInput): Promise<ProposalListRecord[]> {
    return this.proposalRepository.findMany(input ?? {});
  }
}
