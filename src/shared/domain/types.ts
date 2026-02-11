export type Role = "admin" | "comercial";

export type ProposalStatus =
  | "recebida"
  | "em_elaboracao"
  | "enviada"
  | "em_revisao"
  | "ganha"
  | "perdida"
  | "cancelada";

export type AttachmentCategory =
  | "convite"
  | "tr"
  | "referencia"
  | "proposta_word"
  | "planilha_custos"
  | "outro";

export const COMPANY_STATUSES = [
  "potencial",
  "em_negociacao",
  "ativa",
  "inativa",
  "bloqueada",
] as const;

export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

export const PROPOSAL_STATUSES: ProposalStatus[] = [
  "recebida",
  "em_elaboracao",
  "enviada",
  "em_revisao",
  "ganha",
  "perdida",
  "cancelada",
];

export const ATTACHMENT_CATEGORIES: AttachmentCategory[] = [
  "convite",
  "tr",
  "referencia",
  "proposta_word",
  "planilha_custos",
  "outro",
];
