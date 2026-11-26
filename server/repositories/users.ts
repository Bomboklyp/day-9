import type { PoolClient } from "pg";
import { query } from "../utils/database";
import type { ApiUser } from "../../shared/types/api";
import type { SessionUser } from "../../shared/types/auth";
export interface DbUser extends SessionUser {
  password_hash: string;
}
export function publicUser(user: SessionUser): SessionUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    customer_id: user.customer_id,
  };
}
export async function listUsers(user: SessionUser): Promise<ApiUser[]> {
  const where =
    user.role === "Admin"
      ? "true"
      : user.role === "Operator"
        ? "role='Agent' OR id=$1"
        : "id=$1";
  const rows = (
    await query<SessionUser>(
      `SELECT id,name,email,role,is_active,customer_id FROM users WHERE ${where} ORDER BY name`,
      user.role === "Admin" ? [] : [user.id],
    )
  ).rows;
  return rows.map((person) => ({
    id: person.id,
    name: person.name,
    role: person.role,
    is_active: person.is_active,
    customer_id: person.customer_id,
    ...(user.role === "Admin" || person.id === user.id
      ? { email: person.email }
      : {}),
  }));
}

export async function findAssignee(id: string, client: PoolClient) {
  return (
    await client.query<Pick<SessionUser, "name" | "role" | "is_active">>(
      "SELECT name,role,is_active FROM users WHERE id=$1 FOR SHARE",
      [id],
    )
  ).rows[0];
}
export async function findUserByEmail(email: string) {
  return (await query<DbUser>("SELECT * FROM users WHERE email=$1", [email]))
    .rows[0];
}
export async function lockUser(client: PoolClient, id: string) {
  return (
    await client.query<DbUser>("SELECT * FROM users WHERE id=$1 FOR UPDATE", [
      id,
    ])
  ).rows[0];
}
export async function writeUser(
  client: PoolClient,
  values: unknown[],
  id: string,
) {
  return (
    await client.query<DbUser>(
      "INSERT INTO users(name,email,password_hash,role,is_active,customer_id,id) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *",
      [...values, id],
    )
  ).rows[0]!;
}
export async function updateUser(
  client: PoolClient,
  values: unknown[],
  id: string,
) {
  return (
    await client.query<DbUser>(
      "UPDATE users SET name=$1,email=$2,password_hash=$3,role=$4,is_active=$5,customer_id=$6 WHERE id=$7 RETURNING *",
      [...values, id],
    )
  ).rows[0]!;
}
export async function updateProfile(id: string, name: string, email: string) {
  return (
    await query<DbUser>(
      "UPDATE users SET name=$1,email=$2 WHERE id=$3 RETURNING *",
      [name, email, id],
    )
  ).rows[0]!;
}
