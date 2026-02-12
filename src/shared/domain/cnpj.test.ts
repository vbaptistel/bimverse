import { describe, expect, it } from "vitest";

import {
  formatCnpj,
  normalizeCnpj,
  validateCnpj,
} from "@/shared/domain/cnpj";

describe("cnpj", () => {
  it("normaliza removendo caracteres não numéricos", () => {
    expect(normalizeCnpj("12.345.678/0001-99")).toBe("12345678000199");
  });

  it("aplica máscara progressiva para input", () => {
    expect(formatCnpj("12345678000199")).toBe("12.345.678/0001-99");
    expect(formatCnpj("123456")).toBe("12.345.6");
  });

  describe("validateCnpj", () => {
    it("retorna true para CNPJ válido", () => {
      expect(validateCnpj("44.038.188/0001-32")).toBe(true);
      expect(validateCnpj("44038188000132")).toBe(true);
    });

    it("retorna false quando não tem 14 dígitos", () => {
      expect(validateCnpj("123")).toBe(false);
      expect(validateCnpj("1234567800019")).toBe(false);
      expect(validateCnpj("123456780001999")).toBe(false);
    });

    it("retorna false para sequência repetida (11111111111111)", () => {
      expect(validateCnpj("11.111.111/1111-11")).toBe(false);
      expect(validateCnpj("11111111111111")).toBe(false);
    });

    it("retorna false quando dígitos verificadores são inválidos", () => {
      expect(validateCnpj("12.345.678/0001-99")).toBe(false);
      expect(validateCnpj("44.038.188/0001-99")).toBe(false);
    });
  });
});
