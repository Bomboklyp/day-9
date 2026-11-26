import { createError, getRequestIP, setHeader, type H3Event } from "h3";
import type { z } from "zod";
import type { loginSchema } from "../utils/schemas";
import { tokenHash } from "../utils/password";
import { reserveLoginAttempt, clearLoginAttempts } from "../repositories/login-attempts";
import { authenticate } from "./auth";

export async function login(event: H3Event, input: z.infer<typeof loginSchema>) {
  const key = tokenHash(`${getRequestIP(event) ?? "unknown"}\0${input.email}`);
  const attempt = await reserveLoginAttempt(key);
  if (attempt.attempts > 10) {
    setHeader(event, "Retry-After", attempt.retry_seconds);
    throw createError({
      statusCode: 429,
      statusMessage: "Too many login attempts",
      data: { message: "Слишком много попыток входа. Повторите через 15 минут." },
    });
  }
  const user = await authenticate(input);
  await clearLoginAttempts(key);
  return user;
}
