import { query } from "../utils/database";
import type { Analytics } from "../../shared/types/product";
import { statuses } from "../../shared/utils/request-options";
export async function readAnalytics(days: number | null): Promise<Analytics> {
  const records = (
    await query<{
      status: string;
      total: number;
      closed: number;
      sla_eligible: number;
      sla_met: number;
      average_resolution_minutes: number | null;
    }>(
      `SELECT status,count(*)::int AS total,count(*) FILTER(WHERE status='closed')::int AS closed,count(*) FILTER(WHERE status IN ('closed','resolved') AND due_at IS NOT NULL)::int AS sla_eligible,count(*) FILTER(WHERE status IN ('closed','resolved') AND coalesce(resolved_at,closed_at)<=due_at AND coalesce(responded_at,closed_at)<=response_due_at)::int AS sla_met,avg(extract(epoch FROM(coalesce(resolved_at,closed_at)-created_at))/60) FILTER(WHERE status IN ('closed','resolved'))::float AS average_resolution_minutes FROM requests WHERE ($1::int IS NULL OR created_at>=now()-$1*interval '1 day') GROUP BY status`,
      [days],
    )
  ).rows;
  const total = records.reduce((sum, row) => sum + row.total, 0),
    closed = records.reduce((sum, row) => sum + row.closed, 0),
    eligible = records.reduce((sum, row) => sum + row.sla_eligible, 0),
    met = records.reduce((sum, row) => sum + row.sla_met, 0);
  const duration = (
    await query<{ value: number | null }>(
      "SELECT avg(extract(epoch FROM(coalesce(resolved_at,closed_at)-created_at))/60)::float AS value FROM requests WHERE status IN ('resolved','closed') AND ($1::int IS NULL OR created_at>=now()-$1*interval '1 day')",
      [days],
    )
  ).rows[0]!.value;
  const by_status = Object.fromEntries(
    statuses.map((item) => [
      item.value,
      records.find((row) => row.status === item.value)?.total ?? 0,
    ]),
  ) as Analytics["by_status"];
  const workload = (
    await query<Analytics["workload"][number]>(
      "SELECT u.id,u.name,count(r.id)::int AS active FROM users u LEFT JOIN requests r ON r.assignee_id=u.id AND r.status NOT IN ('resolved','closed') AND ($1::int IS NULL OR r.created_at>=now()-$1*interval '1 day') WHERE u.role='Agent' GROUP BY u.id,u.name ORDER BY u.name",
      [days],
    )
  ).rows;
  return {
    total,
    closed,
    sla_percent: eligible ? Math.round((met / eligible) * 100) : null,
    average_resolution_minutes:
      duration === null ? null : Math.round(Math.max(0, duration)),
    by_status,
    workload,
  };
}
