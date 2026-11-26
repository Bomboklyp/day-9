import { randomUUID } from "node:crypto";
import { createError } from "h3";
import type { z } from "zod";
import type { SessionUser } from "../../shared/types/auth";
import type {
  loginSchema,
  registerSchema,
  profileSchema,
} from "../utils/schemas";
import { transaction } from "../utils/database";
import { hashPassword, verifyPassword } from "../utils/password";
import {
  findUserByEmail,
  publicUser,
  writeUser,
  updateProfile,
} from "../repositories/users";
import { insertCustomer } from "../repositories/customers";
export async function authenticate(input: z.infer<typeof loginSchema>) {
  const user = await findUserByEmail(input.email);
  const valid = await verifyPassword(
    input.password,
    user?.password_hash ?? `scrypt:workflow-demo:${"0".repeat(128)}`,
  );
  if (
    !user ||
    !user.is_active ||
    !valid
  )
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
      data: { message: "Неверная почта или пароль" },
    });
  return publicUser(user);
}
export async function registerClient(input: z.infer<typeof registerSchema>) {
  const password = await hashPassword(input.password);
  try {
    return await transaction(async (client) => {
      const customerId = `customer-${randomUUID()}`;
      await insertCustomer(client, customerId, input.company);
      return publicUser(
        await writeUser(
          client,
          [input.name, input.email, password, "Client", true, customerId],
          `user-${randomUUID()}`,
        ),
      );
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
        data: { message: "Эта почта уже зарегистрирована" },
      });
    throw error;
  }
}
export async function changeProfile(
  user: SessionUser,
  input: z.infer<typeof profileSchema>,
) {
  try {
    return publicUser(await updateProfile(user.id, input.name, input.email));
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
        data: { message: "Эта почта уже используется" },
      });
    throw error;
  }
}
