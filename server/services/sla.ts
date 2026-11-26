import { createError } from "h3";
import { listSlaPolicies, saveSlaPolicy } from "../repositories/sla";
import type { SlaPolicy } from "../../shared/types/product";
export { listSlaPolicies };
export async function updateSlaPolicy(policy: SlaPolicy) {
  const saved = await saveSlaPolicy(policy);
  if (!saved)
    throw createError({
      statusCode: 404,
      statusMessage: "SLA policy not found",
    });
  return saved;
}
