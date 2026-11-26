import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { query } from "../utils/database";
import type { ApiAttachment } from "../../shared/types/product";
export async function countAttachments(client: PoolClient, id: number) {
  return (
    await client.query<{ count: number }>(
      "SELECT count(*)::int AS count FROM attachments WHERE request_id=$1",
      [id],
    )
  ).rows[0]!.count;
}
export async function insertAttachment(
  client: PoolClient,
  requestId: number,
  authorId: string,
  file: { name: string; mime: string; data: Uint8Array },
) {
  await client.query(
    "INSERT INTO attachments(id,request_id,author_id,filename,mime_type,size,content) VALUES($1,$2,$3,$4,$5,$6,$7)",
    [
      randomUUID(),
      requestId,
      authorId,
      file.name,
      file.mime,
      file.data.byteLength,
      Buffer.from(file.data),
    ],
  );
}
export async function listAttachments(id: number) {
  return (
    await query<Omit<ApiAttachment, "created_at"> & { created_at: Date }>(
      "SELECT id,request_id,filename,mime_type,size,created_at FROM attachments WHERE request_id=$1 ORDER BY created_at,id",
      [id],
    )
  ).rows.map((row) => ({ ...row, created_at: row.created_at.toISOString() }));
}
export async function findAttachment(id: string) {
  return (
    await query<ApiAttachment & { content: Buffer }>(
      "SELECT * FROM attachments WHERE id=$1",
      [id],
    )
  ).rows[0];
}
