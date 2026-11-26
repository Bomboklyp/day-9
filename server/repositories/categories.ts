import type { PoolClient } from "pg";
import { query } from "../utils/database";
import type { ApiCategory } from "../../shared/types/api";
export async function listCategories(): Promise<ApiCategory[]> {
  return (
    await query<ApiCategory>("SELECT id,name FROM categories ORDER BY name")
  ).rows;
}
export async function categoryExists(id: string, client: PoolClient) {
  return Boolean(
    (await client.query("SELECT id FROM categories WHERE id=$1", [id]))
      .rowCount,
  );
}
