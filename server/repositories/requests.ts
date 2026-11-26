import { requestSla } from "../../shared/utils/sla";
import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { query } from "../utils/database";
import type { SessionUser } from "../../shared/types/auth";
import type {
  ApiItem,
  ApiRequest,
  ApiRequestsResponse,
  CreateRequestBody,
  UpdateRequestBody,
  RequestsQuery,
} from "../../shared/types/api";
interface RequestRow extends Omit<
  ApiRequest,
  | "created_at"
  | "due_at"
  | "response_due_at"
  | "responded_at"
  | "resolved_at"
  | "closed_at"
> {
  created_at: Date;
  due_at: Date | null;
  response_due_at: Date | null;
  responded_at: Date | null;
  resolved_at: Date | null;
  closed_at: Date | null;
}
const requestSelect = `SELECT r.*,a.name AS author_name,ass.name AS assignee_name,c.name AS customer_name,cat.name AS category_name,
  COALESCE((SELECT json_agg(json_build_object('id',co.id,'text',co.text,'author_id',co.author_id,'author_name',cu.name,'created_at',co.created_at) ORDER BY co.created_at,co.id) FROM comments co JOIN users cu ON cu.id=co.author_id WHERE co.request_id=r.id),'[]'::json) AS comments,
  COALESCE((SELECT json_agg(json_build_object('id',e.id,'title',e.title,'description',e.description,'kind',e.kind,'created_at',e.created_at) ORDER BY e.created_at,e.id) FROM request_events e WHERE e.request_id=r.id),'[]'::json) AS timeline
  FROM requests r JOIN users a ON a.id=r.author_id JOIN customers c ON c.id=r.customer_id JOIN categories cat ON cat.id=r.category_id LEFT JOIN users ass ON ass.id=r.assignee_id`;
function dto(row: RequestRow): ApiRequest {
  const value = {
    ...row,
    created_at: row.created_at.toISOString(),
    due_at: row.due_at?.toISOString() ?? null,
    response_due_at: row.response_due_at?.toISOString() ?? null,
    responded_at: row.responded_at?.toISOString() ?? null,
    resolved_at: row.resolved_at?.toISOString() ?? null,
    closed_at: row.closed_at?.toISOString() ?? null,
  };
  return { ...value, sla: requestSla(value, new Date().toISOString()) };
}
function scope(user: SessionUser) {
  if (user.role === "Client")
    return { sql: "r.author_id=$1", values: [user.id] as unknown[] };
  if (user.role === "Agent")
    return { sql: "r.assignee_id=$1", values: [user.id] as unknown[] };
  return { sql: "true", values: [] as unknown[] };
}
export async function findRequest(
  id: number,
  user: SessionUser,
  client?: PoolClient,
): Promise<ApiItem<ApiRequest> | undefined> {
  const access = scope(user),
    sql = `${requestSelect} WHERE ${access.sql} AND r.id=$${access.values.length + 1}`,
    values = [...access.values, id];
  const result = client
    ? await client.query<RequestRow>(sql, values)
    : await query<RequestRow>(sql, values);
  return result.rows[0] ? { data: dto(result.rows[0]) } : undefined;
}
export async function listRequests(
  user: SessionUser,
  filters: RequestsQuery,
): Promise<ApiRequestsResponse> {
  const access = scope(user),
    clauses = [access.sql],
    values: unknown[] = [...access.values];
  function add(sql: string, value: unknown) {
    values.push(value);
    clauses.push(sql.replaceAll("?", `$${values.length}`));
  }
  if (filters.q)
    add(
      "(r.title ILIKE ? OR r.description ILIKE ? OR ('#'||r.id::text) ILIKE ? OR EXISTS(SELECT 1 FROM customers search_customer WHERE search_customer.id=r.customer_id AND search_customer.name ILIKE ?))",
      `%${filters.q}%`,
    );
  if (filters.status) add("r.status=?", filters.status);
  if (filters.priority) add("r.priority=?", filters.priority);
  if (filters.assignment === "mine") add("r.assignee_id=?", user.id);
  if (filters.assignment === "unassigned")
    clauses.push("r.assignee_id IS NULL");
  const where = clauses.join(" AND ");
  const total = (
    await query<{ count: number }>(
      `SELECT count(*)::int AS count FROM requests r WHERE ${where}`,
      values,
    )
  ).rows[0]!.count;
  const pages = Math.max(1, Math.ceil(total / filters.per_page)),
    page = Math.min(filters.page, pages);
  const order =
    filters.sort === "oldest"
      ? "r.created_at ASC,r.id ASC"
      : filters.sort === "priority"
        ? "CASE r.priority WHEN 'urgent' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END DESC,r.id DESC"
        : "r.created_at DESC,r.id DESC";
  const result = await query<RequestRow>(
    `${requestSelect} WHERE ${where} ORDER BY ${order} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, filters.per_page, (page - 1) * filters.per_page],
  );
  const stats = (
    await query<ApiRequestsResponse["stats"]>(
      `SELECT count(*) FILTER(WHERE r.status='new')::int AS new,count(*) FILTER(WHERE r.status='in_progress')::int AS in_progress,count(*) FILTER(WHERE r.status='waiting')::int AS waiting,count(*) FILTER(WHERE r.status='resolved')::int AS resolved FROM requests r WHERE ${access.sql}`,
      access.values,
    )
  ).rows[0]!;
  return {
    data: result.rows.map(dto),
    meta: { page, per_page: filters.per_page, total, total_pages: pages },
    stats,
  };
}
export async function recordRequestEvent(
  client: PoolClient,
  id: number,
  actor: SessionUser,
  title: string,
  description = "",
  kind: "created" | "status" | "comment" | "attachment" = "status",
) {
  await client.query(
    "INSERT INTO request_events(id,request_id,actor_id,title,description,kind) VALUES($1,$2,$3,$4,$5,$6)",
    [randomUUID(), id, actor.id, title, description, kind],
  );
}

export async function lockRequest(client: PoolClient, id: number) {
  return (
    await client.query<RequestRow>(
      "SELECT * FROM requests WHERE id=$1 FOR UPDATE",
      [id],
    )
  ).rows[0];
}
export async function insertRequest(
  client: PoolClient,
  actorId: string,
  customerId: string,
  input: CreateRequestBody,
) {
  return (
    await client.query<{ id: number }>(
      "INSERT INTO requests(title,description,priority,customer_id,category_id,author_id,due_at,response_due_at) SELECT $1,$2,$3,$4,$5,$6,now()+p.resolution_minutes*interval '1 minute',now()+p.response_minutes*interval '1 minute' FROM sla_policies p WHERE priority=$3 RETURNING id",
      [
        input.title,
        input.description,
        input.priority,
        customerId,
        input.category_id,
        actorId,
      ],
    )
  ).rows[0]!.id;
}
export async function saveRequest(
  client: PoolClient,
  record: RequestRow,
  assignee: string | null,
  status: ApiRequest["status"],
  input: UpdateRequestBody,
) {
  await client.query(
    `UPDATE requests r SET assignee_id=$1,status=$2,priority=$3,resolution=$4,waiting_reason=$5,closing_reason=$6,escalation_reason=CASE WHEN $2='escalated' THEN $8 ELSE escalation_reason END,response_due_at=CASE WHEN r.priority<>$3 THEN r.created_at+p.response_minutes*interval '1 minute' ELSE response_due_at END,due_at=CASE WHEN r.priority<>$3 THEN r.created_at+p.resolution_minutes*interval '1 minute' ELSE due_at END,responded_at=coalesce(responded_at,CASE WHEN $1::text IS NOT NULL OR $2 NOT IN ('new') THEN now() END),resolved_at=CASE WHEN $2='resolved' THEN coalesce(resolved_at,now()) WHEN r.status='resolved' AND $2<>'closed' THEN NULL ELSE resolved_at END,closed_at=CASE WHEN $2='closed' THEN now() ELSE closed_at END,revision=revision+1 FROM sla_policies p WHERE r.id=$7 AND p.priority=$3`,
    [
      assignee,
      status,
      input.priority ?? record.priority,
      input.status === "resolved"
        ? (input.resolution ?? record.resolution)
        : record.resolution,
      input.status === "waiting"
        ? (input.reason ?? record.waiting_reason)
        : record.waiting_reason,
      input.status === "closed"
        ? (input.reason ?? record.closing_reason)
        : record.closing_reason,
      record.id,
      input.reason ?? record.escalation_reason ?? null,
    ],
  );
}
export async function incrementRevision(client: PoolClient, id: number) {
  await client.query("UPDATE requests SET revision=revision+1 WHERE id=$1", [
    id,
  ]);
}

export async function markResponded(client: PoolClient, id: number) {
  await client.query(
    "UPDATE requests SET responded_at=coalesce(responded_at,now()) WHERE id=$1",
    [id],
  );
}
