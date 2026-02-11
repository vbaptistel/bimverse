import { describe, expect, it } from "vitest";

import { formatCnpj, normalizeCnpj } from "@/shared/domain/cnpj";

describe("cnpj", () => {
  it("normaliza removendo caracteres não numéricos", () => {
    expect(normalizeCnpj("12.345.678/0001-99")).toBe("12345678000199");
  });

  it("aplica máscara progressiva para input", () => {
    expect(formatCnpj("12345678000199")).toBe("12.345.678/0001-99");
    expect(formatCnpj("123456")).toBe("12.345.6");
  });
});
