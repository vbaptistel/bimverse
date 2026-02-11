import { describe, expect, it } from "vitest";

import {
  buildProposalCode,
  normalizeCompanySlug,
} from "@/modules/proposals/domain/proposal-code";

describe("proposal-code", () => {
  it("normaliza slug removendo acento e caracteres especiais", () => {
    expect(normalizeCompanySlug("Égís Engenharia")).toBe("EGISENGENHARIA");
  });

  it("gera código no padrão BV-CLIENTE-ANO-BIM-SEQ", () => {
    expect(
      buildProposalCode({
        companySlug: "EGIS",
        year: 2026,
        sequence: 45,
      }),
    ).toBe("BV-EGIS-2026-BIM-045");
  });
});
