import { eamClient } from "../lib/axios.js";
import { safeRequest } from "../utils/httpClient.js";
import { eamRequest } from "../lib/eamRequest.js";

function extractBase64(data) {
  return data?.Result?.ResultData?.Document?.DocumentAttachment?.FILECONTENT;
}

function detectMimeType(base64) {
  if (!base64) return "image/jpeg";

  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBORw0KGgo")) return "image/png";
  if (base64.startsWith("R0lGOD")) return "image/gif";
  if (base64.startsWith("UklGR")) return "image/webp";

  return "image/jpeg";
}

export async function getDocumentService({ documentCode }, context) {
  const raw = `${documentCode}#*`;
  const encodedId = encodeURIComponent(encodeURIComponent(raw));

  const res = await safeRequest(
    eamClient.get(
      `/documents/${encodedId}`,
      eamRequest(context)
    )
  );

  const base64 = extractBase64(res.data);

  if (!base64) return null;

  const mimeType = detectMimeType(base64);

  return {
    base64,
    mimeType,
    dataUrl: `data:${mimeType};base64,${base64}`
  };
}

