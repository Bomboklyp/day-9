import { randomBytes } from "node:crypto";
import {
  createError,
  deleteCookie,
  getCookie,
  getRequestURL,
  setCookie,
  type H3Event,
} from "h3";
import type { Role, SessionUser } from "../../shared/types/auth";
import {
  findSessionUser,
  deleteSessionByHash,
  insertSession,
} from "../repositories/sessions";
import { publicUser } from "../repositories/users";
import { tokenHash } from "./password";
export { publicUser } from "../repositories/users";
export type { DbUser } from "../repositories/users";

export const sessionCookie = "workflow_session";
export async function getSessionUser(
  event: H3Event,
): Promise<SessionUser | null> {
  const token = getCookie(event, sessionCookie);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const user = await findSessionUser(tokenHash(token));
  return user ? publicUser(user) : null;
}
export function requireUser(event: H3Event): SessionUser {
  if (!event.context.user)
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
      data: { message: "Войдите в аккаунт" },
    });
  return event.context.user;
}
export function requireRole(event: H3Event, roles: Role[]): SessionUser {
  const user = requireUser(event);
  if (!roles.includes(user.role))
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      data: { message: "Недостаточно прав" },
    });
  return user;
}
export async function deleteSession(event: H3Event) {
  const token = getCookie(event, sessionCookie);
  if (token) await deleteSessionByHash(tokenHash(token));
  deleteCookie(event, sessionCookie, { path: "/" });
}
export async function createSession(event: H3Event, user: SessionUser) {
  await deleteSession(event);
  const token = randomBytes(32).toString("base64url");
  await insertSession(tokenHash(token), user.id);
  setCookie(event, sessionCookie, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: getRequestURL(event).protocol === "https:",
    path: "/",
    maxAge: 7 * 86400,
  });
}
