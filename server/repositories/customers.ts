import type { PoolClient } from "pg";
import { query } from "../utils/database";
import type { ApiCustomer } from "../../shared/types/api";
import type { SessionUser } from "../../shared/types/auth";
export async function listCustomers(user: SessionUser): Promise<ApiCustomer[]> {
  if (user.role === "Client")
    return (
      await query<ApiCustomer>("SELECT id,name FROM customers WHERE id=$1", [
        user.customer_id,
      ])
    ).rows;
  if (user.role === "Agent")
    return (
      await query<ApiCustomer>(
        "SELECT DISTINCT c.id,c.name FROM customers c JOIN requests r ON r.customer_id=c.id WHERE r.assignee_id=$1 ORDER BY c.name",
        [user.id],
      )
    ).rows;
  return (
    await query<ApiCustomer>("SELECT id,name FROM customers ORDER BY name")
  ).rows;
}
export async function customerExists(id: string, client: PoolClient) {
  return Boolean(
    (await client.query("SELECT id FROM customers WHERE id=$1", [id])).rowCount,
  );
}
export async function insertCustomer(
  client: PoolClient,
  id: string,
  name: string,
) {
  await client.query("INSERT INTO customers(id,name) VALUES($1,$2)", [
    id,
    name,
  ]);
}
