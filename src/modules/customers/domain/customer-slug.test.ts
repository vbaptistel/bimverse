import { describe, expect, it } from "vitest";

import {
  buildCustomerSlug,
  normalizeCustomerSlug,
} from "@/modules/customers/domain/customer-slug";

describe("customer-slug", () => {
  it("normaliza nome removendo acentos e caracteres especiais", () => {
    expect(normalizeCustomerSlug("Bímverse Engenharia & Projetos")).toBe(
      "bimverse-engenharia-projetos",
    );
  });

  it("gera slug válido", () => {
    expect(buildCustomerSlug("ACME BIM")).toBe("acme-bim");
  });
});
