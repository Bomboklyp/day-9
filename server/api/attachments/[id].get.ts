import { defineEventHandler, getRouterParam, setHeader } from "h3";
import { z } from "zod";
import { requireUser } from "../../utils/auth";
import { parseInput } from "../../utils/schemas";
import { downloadAttachment } from "../../services/attachments";
export default defineEventHandler(async (event) => {
  const file = await downloadAttachment(
    parseInput(z.uuid(), getRouterParam(event, "id")),
    requireUser(event),
  );
  setHeader(event, "Content-Type", file.mime_type);
  setHeader(event, "X-Content-Type-Options", "nosniff");
  setHeader(
    event,
    "Content-Disposition",
    `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
  );
  return file.content;
});
