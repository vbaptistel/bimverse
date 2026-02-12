const OFFICE_ONLINE_EXTENSIONS = new Set([
  "doc",
  "docm",
  "docx",
  "dot",
  "dotx",
  "pot",
  "potm",
  "potx",
  "pps",
  "ppsm",
  "ppsx",
  "ppt",
  "pptm",
  "pptx",
  "rtf",
  "xls",
  "xlsb",
  "xlsm",
  "xlsx",
  "xlt",
  "xltm",
  "xltx",
]);

const INLINE_VIEWER_EXTENSIONS = new Set([
  "bmp",
  "csv",
  "gif",
  "jpeg",
  "jpg",
  "json",
  "pdf",
  "png",
  "svg",
  "txt",
  "webp",
  "xml",
]);

export type AttachmentViewerMode = "office-online" | "inline" | "download";

export interface AttachmentViewerResolution {
  mode: AttachmentViewerMode;
  extension: string | null;
  viewerUrl: string | null;
}

export function getAttachmentOpenPath(proposalId: string, attachmentId: string) {
  return `/propostas/${proposalId}/anexos/${attachmentId}/abrir`;
}

export function resolveAttachmentViewer(
  fileName: string,
  signedUrl: string,
): AttachmentViewerResolution {
  const extension = extractFileExtension(fileName);

  if (extension && OFFICE_ONLINE_EXTENSIONS.has(extension)) {
    return {
      mode: "office-online",
      extension,
      viewerUrl: `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        signedUrl,
      )}`,
    };
  }

  if (extension && INLINE_VIEWER_EXTENSIONS.has(extension)) {
    return {
      mode: "inline",
      extension,
      viewerUrl: signedUrl,
    };
  }

  return {
    mode: "download",
    extension,
    viewerUrl: null,
  };
}

function extractFileExtension(fileName: string): string | null {
  const normalized = fileName.trim();
  const index = normalized.lastIndexOf(".");
  if (index < 0 || index === normalized.length - 1) {
    return null;
  }

  return normalized.slice(index + 1).toLowerCase();
}
