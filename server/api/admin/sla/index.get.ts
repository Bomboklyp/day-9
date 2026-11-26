import { defineEventHandler } from "h3";
import { requireRole } from "../../../utils/auth";
import { listSlaPolicies } from "../../../services/sla";
export default defineEventHandler(async (event) => {
  requireRole(event, ["Admin"]);
  return { data: await listSlaPolicies() };
});
