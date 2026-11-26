import { defineEventHandler, getRouterParam, readBody } from "h3";
import { requireUser } from "../../utils/auth";
import { updateRequest } from "../../services/requests";
import { requestId } from "../../utils/request-id";
import { updateRequestSchema, parseInput } from "../../utils/schemas";
export default defineEventHandler(async (event) => {
  const user = requireUser(event);
  const input = parseInput(updateRequestSchema, await readBody<unknown>(event));
  return updateRequest(requestId(getRouterParam(event, "id")), user, input);
});
