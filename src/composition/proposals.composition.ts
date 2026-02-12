import { CreateProposalUseCase } from "@/modules/proposals/application/use-cases/create-proposal.use-case";
import { CreateRevisionUseCase } from "@/modules/proposals/application/use-cases/create-revision.use-case";
import { ListProposalsUseCase } from "@/modules/proposals/application/use-cases/list-proposals.use-case";
import { UpdateProposalStatusUseCase } from "@/modules/proposals/application/use-cases/update-proposal-status.use-case";
import { DrizzleProposalRepository } from "@/modules/proposals/infrastructure/repositories/drizzle-proposal.repository";
import { DrizzleRevisionRepository } from "@/modules/proposals/infrastructure/repositories/drizzle-revision.repository";
import { db } from "@/shared/infrastructure/db/client";

export function buildProposalsComposition() {
  const proposalRepository = new DrizzleProposalRepository(db);
  const revisionRepository = new DrizzleRevisionRepository(db);

  return {
    createProposalUseCase: new CreateProposalUseCase(
      proposalRepository,
      revisionRepository,
    ),
    createRevisionUseCase: new CreateRevisionUseCase(
      proposalRepository,
      revisionRepository,
    ),
    listProposalsUseCase: new ListProposalsUseCase(proposalRepository),
    updateProposalStatusUseCase: new UpdateProposalStatusUseCase(
      proposalRepository,
    ),
    proposalRepository,
  };
}
