import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["admin", "comercial"]);

export const proposalStatusEnum = pgEnum("proposal_status", [
  "recebida",
  "em_elaboracao",
  "enviada",
  "em_revisao",
  "ganha",
  "perdida",
  "cancelada",
]);

export const attachmentCategoryEnum = pgEnum("attachment_category", [
  "convite",
  "tr",
  "referencia",
  "proposta_word",
  "planilha_custos",
  "outro",
]);

export const customerStatusEnum = pgEnum("customer_status", [
  "potencial",
  "em_negociacao",
  "ativa",
  "inativa",
  "bloqueada",
]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("comercial"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    cnpj: text("cnpj"),
    notes: text("notes"),
    status: customerStatusEnum("status").notNull().default("ativa"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("customers_slug_ux").on(table.slug)],
);

export const proposalSequences = pgTable("proposal_sequences", {
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" })
    .primaryKey(),
  nextSeq: integer("next_seq").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    code: text("code").notNull(),
    seqNumber: integer("seq_number").notNull(),
    year: integer("year").notNull(),
    invitationCode: text("invitation_code"),
    projectName: text("project_name").notNull(),
    scopeDescription: text("scope_description").notNull(),
    status: proposalStatusEnum("status").notNull().default("recebida"),
    dueDate: date("due_date"),
    estimatedValueBrl: numeric("estimated_value_brl", {
      precision: 14,
      scale: 2,
    }),
    finalValueBrl: numeric("final_value_brl", {
      precision: 14,
      scale: 2,
    }),
    outcomeReason: text("outcome_reason"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("proposals_code_ux").on(table.code),
    uniqueIndex("proposals_customer_year_seq_ux").on(
      table.customerId,
      table.year,
      table.seqNumber,
    ),
  ],
);

export const proposalRevisions = pgTable(
  "proposal_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    reason: text("reason"),
    scopeChanges: text("scope_changes"),
    discountBrl: numeric("discount_brl", { precision: 14, scale: 2 }),
    discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }),
    valueBeforeBrl: numeric("value_before_brl", { precision: 14, scale: 2 }),
    valueAfterBrl: numeric("value_after_brl", { precision: 14, scale: 2 }),
    notes: text("notes"),
    createdBy: uuid("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("proposal_revisions_proposal_revision_ux").on(
      table.proposalId,
      table.revisionNumber,
    ),
  ],
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legalName: text("legal_name").notNull(),
    cnpj: text("cnpj").notNull(),
    specialty: text("specialty").notNull(),
    hourlyCostBrl: numeric("hourly_cost_brl", { precision: 10, scale: 2 }),
    contactName: text("contact_name"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("suppliers_cnpj_ux").on(table.cnpj)],
);

export const proposalSuppliers = pgTable(
  "proposal_suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    revisionId: uuid("revision_id").references(() => proposalRevisions.id, {
      onDelete: "set null",
    }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "restrict" }),
    roleDescription: text("role_description"),
    quotedHourlyCostBrl: numeric("quoted_hourly_cost_brl", {
      precision: 10,
      scale: 2,
    }),
    estimatedHours: numeric("estimated_hours", { precision: 10, scale: 2 }),
    quotedTotalBrl: numeric("quoted_total_brl", { precision: 14, scale: 2 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("proposal_suppliers_unique_link_ux").on(
      table.proposalId,
      table.supplierId,
      table.revisionId,
    ),
    uniqueIndex("proposal_suppliers_no_revision_ux")
      .on(table.proposalId, table.supplierId)
      .where(sql`${table.revisionId} IS NULL`),
  ],
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => proposals.id, { onDelete: "cascade" }),
    revisionId: uuid("revision_id").references(() => proposalRevisions.id, {
      onDelete: "set null",
    }),
    category: attachmentCategoryEnum("category").notNull(),
    fileName: text("file_name").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    uploadedBy: uuid("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("attachments_storage_path_ux").on(table.storagePath)],
);

export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  action: text("action").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdBy: uuid("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("activity_log_entity_created_at_idx").on(
    table.entityType,
    table.entityId,
    table.createdAt.desc(),
  ),
]);

export const customersToSuppliers = pgTable(
  "customers_to_suppliers",
  {
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.customerId, table.supplierId] })],
);

export type ProposalRow = typeof proposals.$inferSelect;
export type ProposalInsertRow = typeof proposals.$inferInsert;
export type ProposalRevisionRow = typeof proposalRevisions.$inferSelect;
export type AttachmentRow = typeof attachments.$inferSelect;
