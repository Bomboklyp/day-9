import { createError, defineEventHandler } from "h3";
import { checkDatabaseHealth } from "../services/health";

export default defineEventHandler(async () => {
  try {
    await checkDatabaseHealth();
    return { status: "ok" };
  } catch {
    throw createError({ statusCode: 503, statusMessage: "Service unavailable" });
  }
});
