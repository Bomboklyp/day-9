import { defineEventHandler, getRouterParam, readBody } from "h3";
import { z } from "zod";
import { requireRole } from "../../../utils/auth";
import { parseInput } from "../../../utils/schemas";
import { updateSlaPolicy } from "../../../services/sla";
const schema = z
  .object({
    response_minutes: z.number().int().min(1).max(43200),
    resolution_minutes: z.number().int().min(1).max(43200),
  })
  .strict()
  .refine(
    (value) => value.resolution_minutes >= value.response_minutes,
    "Срок решения не может быть меньше срока реакции",
  );
export default defineEventHandler(async (event) => {
  requireRole(event, ["Admin"]);
  const priority = parseInput(
    z.enum(["urgent", "high", "medium", "low"]),
    getRouterParam(event, "priority"),
  );
  const body = parseInput(schema, await readBody<unknown>(event));
  return { data: await updateSlaPolicy({ priority, ...body }) };
});
