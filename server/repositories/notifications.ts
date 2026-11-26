import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { query } from "../utils/database";
import type { ApiNotification } from "../../shared/types/product";
import type { ApiRequest } from "../../shared/types/api";
export async function notifyRequest(
  client: PoolClient,
  request: {
    id: number;
    author_id?: string | null;
    assignee_id?: string | null;
  },
  kind: ApiNotification["kind"],
  title: string,
  message: string,
  key: string,
) {
  const recipients = (
    await client.query<{ id: string }>(
      "SELECT id FROM users WHERE is_active=true AND (role IN ('Operator','Admin') OR id=$1 OR id=$2)",
      [request.author_id, request.assignee_id],
    )
  ).rows;
  for (const user of recipients)
    await client.query(
      "INSERT INTO notifications(id,user_id,request_id,kind,title,message,dedupe_key) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(user_id,dedupe_key) DO NOTHING",
      [randomUUID(), user.id, request.id, kind, title, message, key],
    );
}
export async function visibleNotifications(userId: string) {
  const rows = (
    await query<
      Omit<ApiNotification, "created_at" | "read_at"> & {
        created_at: Date;
        read_at: Date | null;
      }
    >(
      "SELECT n.id,n.request_id,n.kind,n.title,n.message,n.created_at,n.read_at FROM notifications n JOIN requests r ON r.id=n.request_id JOIN users u ON u.id=n.user_id WHERE n.user_id=$1 AND (u.role IN ('Operator','Admin') OR (u.role='Client' AND r.author_id=u.id) OR (u.role='Agent' AND r.assignee_id=u.id)) ORDER BY n.created_at DESC,n.id DESC LIMIT 100",
      [userId],
    )
  ).rows;
  return rows.map((row) => ({
    ...row,
    created_at: row.created_at.toISOString(),
    read_at: row.read_at?.toISOString() ?? null,
  }));
}
export async function markNotificationsRead(userId: string, id?: string) {
  await query(
    "UPDATE notifications SET read_at=COALESCE(read_at,now()) WHERE user_id=$1 AND ($2::uuid IS NULL OR id=$2::uuid)",
    [userId, id ?? null],
  );
}
export async function pendingSlaRequests(client: PoolClient, now: string) {
  const rows = (
    await client.query<
      Omit<
        ApiRequest,
        | "created_at"
        | "due_at"
        | "response_due_at"
        | "responded_at"
        | "resolved_at"
        | "closed_at"
      > & {
        created_at: Date;
        due_at: Date | null;
        response_due_at: Date | null;
        responded_at: Date | null;
        resolved_at: Date | null;
        closed_at: Date | null;
      }
    >(
      "SELECT * FROM requests WHERE status NOT IN ('resolved','closed') AND ((responded_at IS NULL AND response_due_at>=$1::timestamptz-interval '1 minute') OR due_at>=$1::timestamptz-interval '1 minute')",
      [now],
    )
  ).rows;
  return rows.map((row) => ({
    ...row,
    created_at: row.created_at.toISOString(),
    due_at: row.due_at?.toISOString() ?? null,
    response_due_at: row.response_due_at?.toISOString() ?? null,
    responded_at: row.responded_at?.toISOString() ?? null,
    resolved_at: row.resolved_at?.toISOString() ?? null,
    closed_at: row.closed_at?.toISOString() ?? null,
  }));
}
