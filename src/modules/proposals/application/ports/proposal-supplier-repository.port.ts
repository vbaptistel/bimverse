export interface ProposalSupplierLink {
  id: string;
  proposalId: string;
  revisionId: string | null;
  revisionNumber: number | null;
  supplierId: string;
  supplierLegalName: string;
  supplierSpecialty: string;
  roleDescription: string | null;
  quotedHourlyCostBrl: number | null;
  estimatedHours: number | null;
  quotedTotalBrl: number | null;
  createdAt: Date;
}

export interface CreateProposalSupplierLinkInput {
  proposalId: string;
  revisionId: string;
  supplierId: string;
  roleDescription?: string | null;
  quotedHourlyCostBrl?: number | null;
  estimatedHours?: number | null;
  quotedTotalBrl?: number | null;
}

export interface UpdateProposalSupplierLinkInput {
  linkId: string;
  roleDescription?: string | null;
  quotedHourlyCostBrl?: number | null;
  estimatedHours?: number | null;
  quotedTotalBrl?: number | null;
}

export interface ProposalSupplierRepositoryPort {
  findById(linkId: string): Promise<ProposalSupplierLink | null>;
  findManyByProposalId(proposalId: string): Promise<ProposalSupplierLink[]>;
  findManyByProposalAndRevision(
    proposalId: string,
    revisionId: string,
  ): Promise<ProposalSupplierLink[]>;
  existsLink(
    proposalId: string,
    supplierId: string,
    revisionId: string,
  ): Promise<boolean>;
  createLink(input: CreateProposalSupplierLinkInput): Promise<ProposalSupplierLink>;
  copyRevisionLinks(
    proposalId: string,
    sourceRevisionId: string,
    targetRevisionId: string,
  ): Promise<number>;
  updateLinkValues(input: UpdateProposalSupplierLinkInput): Promise<ProposalSupplierLink>;
  deleteById(linkId: string): Promise<void>;
  deleteManyByRevisionId(revisionId: string): Promise<void>;
}
