import { randomUUID } from "node:crypto";
import { query } from "../utils/database";
import type { ApiCustomer } from "../../shared/types/api";
export async function saveCatalog(
  table: "customers" | "categories",
  name: string,
  id?: string,
) {
  const result = id
    ? await query<ApiCustomer>(
        `UPDATE ${table} SET name=$1 WHERE id=$2 RETURNING id,name`,
        [name, id],
      )
    : await query<ApiCustomer>(
        `INSERT INTO ${table}(id,name) VALUES($1,$2) RETURNING id,name`,
        [
          `${table === "customers" ? "customer" : "category"}-${randomUUID()}`,
          name,
        ],
      );
  return result.rows[0];
}
