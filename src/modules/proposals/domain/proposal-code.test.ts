import { describe, expect, it } from "vitest";

import {
  buildProposalCode,
  normalizeCustomerSlug,
} from "@/modules/proposals/domain/proposal-code";

describe("proposal-code", () => {
  it("normaliza slug removendo acento e caracteres especiais", () => {
    expect(normalizeCustomerSlug("Égís Engenharia")).toBe("EGISENGENHARIA");
  });

  it("gera código no padrão BV-CLIENTE-ANO-BIM-SEQ", () => {
    expect(
      buildProposalCode({
        customerSlug: "EGIS",
        year: 2026,
        sequence: 45,
      }),
    ).toBe("BV-EGIS-2026-BIM-045");
  });
});
