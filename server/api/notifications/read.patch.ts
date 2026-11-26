import { defineEventHandler, readBody } from "h3";
import { z } from "zod";
import { requireUser } from "../../utils/auth";
import { parseInput } from "../../utils/schemas";
import { markNotificationsRead } from "../../services/notifications";
export default defineEventHandler(async (event) => {
  const user = requireUser(event);
  const input = parseInput(
    z.object({ id: z.uuid().optional() }).strict(),
    await readBody<unknown>(event),
  );
  await markNotificationsRead(user.id, input.id);
  return { ok: true };
});
