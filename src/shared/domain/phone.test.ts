import { describe, expect, it } from "vitest";

import { formatPhone, normalizePhone } from "@/shared/domain/phone";

describe("phone", () => {
  it("normaliza telefone removendo caracteres não numéricos", () => {
    expect(normalizePhone("(11) 98765-4321")).toBe("11987654321");
  });

  it("formata telefone fixo e celular", () => {
    expect(formatPhone("1134567890")).toBe("(11) 3456-7890");
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("limita o telefone a 11 dígitos", () => {
    expect(formatPhone("1198765432100")).toBe("(11) 98765-4321");
  });
});
