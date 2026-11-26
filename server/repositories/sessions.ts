import type { PoolClient } from "pg";
import { query } from "../utils/database";
import type { SessionUser } from "../../shared/types/auth";
export async function findSessionUser(tokenHash: string) {
  return (
    await query<SessionUser>(
      "SELECT u.id,u.name,u.email,u.role,u.is_active,u.customer_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>now() AND u.is_active=true",
      [tokenHash],
    )
  ).rows[0];
}
export async function deleteSessionByHash(hash: string) {
  await query("DELETE FROM sessions WHERE token_hash=$1", [hash]);
}
export async function insertSession(hash: string, userId: string) {
  await query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '7 days')",
    [hash, userId],
  );
}
export async function deleteUserSessions(id: string, client: PoolClient) {
  await client.query("DELETE FROM sessions WHERE user_id=$1", [id]);
}
