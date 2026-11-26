import { defineEventHandler, getQuery } from "h3";
import { z } from "zod";
import { requireRole } from "../../utils/auth";
import { parseInput } from "../../utils/schemas";
import { readAnalytics } from "../../services/analytics";
export default defineEventHandler(async (event) => {
  requireRole(event, ["Admin"]);
  const period = parseInput(
    z.enum(["all", "1", "7", "30"]),
    getQuery(event).period ?? "all",
  );
  return {
    data: await readAnalytics(period === "all" ? null : Number(period)),
  };
});
