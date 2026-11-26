import {
  createError,
  defineEventHandler,
  getHeader,
  getRequestURL,
  setHeader,
} from "h3";
import { getSessionUser } from "../utils/auth";
const publicApi = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/session",
]);
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  if (!url.pathname.startsWith("/api/")) return;
  setHeader(event, "Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(event.method)) {
    const origin = getHeader(event, "origin");
    if (origin && origin !== url.origin)
      throw createError({ statusCode: 403, statusMessage: "Invalid origin" });
  }
  if (
    event.method === "GET" &&
    (url.pathname === "/api/health" ||
      /^\/api\/public\/articles(?:\/[^/]+)?$/.test(url.pathname))
  )
    return;
  event.context.user = await getSessionUser(event);
  if (!publicApi.has(url.pathname) && !event.context.user)
    throw createError({
      statusCode: 401,
      statusMessage: "Authentication required",
      data: { message: "Войдите в аккаунт" },
    });
});
