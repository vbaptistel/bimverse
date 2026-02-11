import { describe, expect, it } from "vitest";

import {
  buildCompanySlug,
  normalizeCompanySlug,
} from "@/modules/companies/domain/company-slug";

describe("company-slug", () => {
  it("normaliza nome removendo acentos e caracteres especiais", () => {
    expect(normalizeCompanySlug("Bímverse Engenharia & Projetos")).toBe(
      "bimverse-engenharia-projetos",
    );
  });

  it("gera slug válido", () => {
    expect(buildCompanySlug("ACME BIM")).toBe("acme-bim");
  });
});
