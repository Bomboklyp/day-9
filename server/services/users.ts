import { randomUUID } from "node:crypto";
import { createError } from "h3";
import type { z } from "zod";
import { transaction } from "../utils/database";
import { hashPassword } from "../utils/password";
import type { userSchema, userUpdateSchema } from "../utils/schemas";
import {
  publicUser,
  listUsers,
  lockUser,
  updateUser,
  writeUser,
} from "../repositories/users";
import { customerExists } from "../repositories/customers";
import { deleteUserSessions } from "../repositories/sessions";
export { listUsers };
export async function saveUser(
  input: z.infer<typeof userSchema> | z.infer<typeof userUpdateSchema>,
  id?: string,
) {
  try {
    return await transaction(async (client) => {
      const old = id ? await lockUser(client, id) : undefined;
      if (id && !old)
        throw createError({ statusCode: 404, statusMessage: "User not found" });
      const role = input.role ?? old!.role,
        customer =
          input.customer_id !== undefined
            ? input.customer_id
            : (old?.customer_id ?? null);
      if (
        role === "Client" &&
        (!customer || !(await customerExists(customer, client)))
      )
        throw createError({
          statusCode: 422,
          statusMessage: "Customer required for Client",
        });
      const password = input.password
        ? await hashPassword(input.password)
        : old!.password_hash;
      const values = [
        input.name ?? old!.name,
        input.email ?? old!.email,
        password,
        role,
        input.is_active ?? old?.is_active ?? true,
        role === "Client" ? customer : null,
      ];
      const row = id
        ? await updateUser(client, values, id)
        : await writeUser(client, values, `user-${randomUUID()}`);
      if (!row.is_active || old?.role !== row.role || input.password)
        await deleteUserSessions(row.id, client);
      return publicUser(row);
    });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "23505"
    )
      throw createError({
        statusCode: 409,
        statusMessage: "Email already registered",
      });
    throw error;
  }
}
