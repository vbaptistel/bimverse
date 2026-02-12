import type {
  ListProposalsFilters,
  ProposalRepositoryPort,
} from "@/modules/proposals/application/ports/proposal-repository.port";
import type { Proposal } from "@/modules/proposals/domain/proposal";
import type { UseCase } from "@/shared/application/use-case";

export type ListProposalsInput = ListProposalsFilters;

export class ListProposalsUseCase
  implements UseCase<ListProposalsInput | void, Proposal[]>
{
  constructor(private readonly proposalRepository: ProposalRepositoryPort) {}

  async execute(input?: ListProposalsInput): Promise<Proposal[]> {
    return this.proposalRepository.findMany(input ?? {});
  }
}
