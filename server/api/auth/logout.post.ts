import { defineEventHandler } from "h3";
import { deleteSession, requireUser } from "../../utils/auth";
export default defineEventHandler(async (event) => {
  requireUser(event);
  await deleteSession(event);
  return { ok: true };
});
