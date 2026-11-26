import type { SlaPolicy } from "../../shared/types/product";
import { query } from "../utils/database";
export async function listSlaPolicies() {
  return (
    await query<SlaPolicy>(
      "SELECT priority,response_minutes,resolution_minutes FROM sla_policies ORDER BY CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END",
    )
  ).rows;
}
export async function saveSlaPolicy(policy: SlaPolicy) {
  return (
    await query<SlaPolicy>(
      "UPDATE sla_policies SET response_minutes=$1,resolution_minutes=$2,updated_at=now() WHERE priority=$3 RETURNING priority,response_minutes,resolution_minutes",
      [policy.response_minutes, policy.resolution_minutes, policy.priority],
    )
  ).rows[0];
}
