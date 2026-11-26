import { defineEventHandler, getRouterParam, readBody } from "h3";
import { requireRole } from "../../utils/auth";
import { saveUser } from "../../services/users";
import { userUpdateSchema, parseInput } from "../../utils/schemas";
export default defineEventHandler(async (event) => {
  requireRole(event, ["Admin"]);
  const input = parseInput(userUpdateSchema, await readBody<unknown>(event));
  return { data: await saveUser(input, getRouterParam(event, "id")) };
});
