import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
export async function insertComment(
  client: PoolClient,
  requestId: number,
  authorId: string,
  text: string,
  clientId: string,
) {
  const result = await client.query(
    "INSERT INTO comments(id,request_id,author_id,text,client_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT(author_id,client_id) WHERE client_id IS NOT NULL DO NOTHING RETURNING id",
    [randomUUID(), requestId, authorId, text, clientId],
  );
  return Boolean(result.rowCount);
}
export async function findCommentByKey(
  client: PoolClient,
  authorId: string,
  clientId: string,
) {
  return (
    await client.query<{ request_id: number; text: string }>(
      "SELECT request_id,text FROM comments WHERE author_id=$1 AND client_id=$2",
      [authorId, clientId],
    )
  ).rows[0];
}
