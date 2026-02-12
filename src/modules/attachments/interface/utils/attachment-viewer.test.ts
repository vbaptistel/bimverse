import { describe, expect, it } from "vitest";

import {
  getAttachmentOpenPath,
  resolveAttachmentViewer,
} from "@/modules/attachments/interface/utils/attachment-viewer";

describe("attachment viewer resolver", () => {
  it("monta rota de abertura externa por proposta e anexo", () => {
    expect(getAttachmentOpenPath("proposal-1", "att-1")).toBe(
      "/propostas/proposal-1/anexos/att-1/abrir",
    );
  });

  it("resolve extensao do office online", () => {
    const output = resolveAttachmentViewer(
      "proposta-final.docx",
      "https://storage.example.com/signed?token=123",
    );

    expect(output.mode).toBe("office-online");
    expect(output.extension).toBe("docx");
    expect(output.viewerUrl).toBe(
      "https://view.officeapps.live.com/op/embed.aspx?src=https%3A%2F%2Fstorage.example.com%2Fsigned%3Ftoken%3D123",
    );
  });

  it("resolve extensao inline suportada", () => {
    const output = resolveAttachmentViewer("escopo.pdf", "https://signed.example/pdf");

    expect(output.mode).toBe("inline");
    expect(output.extension).toBe("pdf");
    expect(output.viewerUrl).toBe("https://signed.example/pdf");
  });

  it("faz fallback para download quando nao suporta preview", () => {
    const output = resolveAttachmentViewer("dados.zip", "https://signed.example/zip");

    expect(output.mode).toBe("download");
    expect(output.extension).toBe("zip");
    expect(output.viewerUrl).toBeNull();
  });
});
