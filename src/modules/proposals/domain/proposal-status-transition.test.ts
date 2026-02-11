import { describe, expect, it } from "vitest";

import { isValidProposalStatusTransition } from "@/modules/proposals/domain/proposal-status-transition";

describe("proposal-status-transition", () => {
  it("permite transição enviada -> em_revisao", () => {
    expect(isValidProposalStatusTransition("enviada", "em_revisao")).toBe(true);
  });

  it("bloqueia transição ganha -> enviada", () => {
    expect(isValidProposalStatusTransition("ganha", "enviada")).toBe(false);
  });
});
