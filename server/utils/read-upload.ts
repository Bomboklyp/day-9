import { createError, getHeader, getRequestWebStream, type H3Event } from "h3";
export async function readUpload(
  event: H3Event,
  limit: number,
): Promise<FormData> {
  const length = Number(getHeader(event, "content-length") ?? 0);
  if (length > limit)
    throw createError({ statusCode: 413, statusMessage: "Upload too large" });
  const stream = getRequestWebStream(event);
  if (!stream)
    throw createError({ statusCode: 400, statusMessage: "Empty upload" });
  const reader = stream.getReader(),
    chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > limit)
        throw createError({
          statusCode: 413,
          statusMessage: "Upload too large",
        });
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return await new Request("http://upload.local", {
      method: "POST",
      headers: { "content-type": getHeader(event, "content-type") ?? "" },
      body: Buffer.concat(chunks),
    }).formData();
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid multipart body",
    });
  }
}
