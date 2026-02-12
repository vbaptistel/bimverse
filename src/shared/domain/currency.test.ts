import { describe, expect, it } from "vitest";

import {
  formatCurrencyBrl,
  parseCurrencyBrlInput,
} from "@/shared/domain/currency";

describe("currency", () => {
  it("formata número como BRL", () => {
    expect(formatCurrencyBrl(1234.56).replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });

  it("converte input mascarado para número em BRL", () => {
    expect(parseCurrencyBrlInput("R$ 1.234,56")).toBe(1234.56);
    expect(parseCurrencyBrlInput("123456")).toBe(1234.56);
  });

  it("retorna null quando input está vazio", () => {
    expect(parseCurrencyBrlInput("")).toBeNull();
    expect(parseCurrencyBrlInput("R$ ")).toBeNull();
  });
});
