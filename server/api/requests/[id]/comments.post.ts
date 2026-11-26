import {
  defineEventHandler,
  getRouterParam,
  readBody,
  setResponseStatus,
} from "h3";
import { requireUser } from "../../../utils/auth";
import { addComment } from "../../../services/comments";
import { requestId } from "../../../utils/request-id";
import { commentSchema, parseInput } from "../../../utils/schemas";
export default defineEventHandler(async (event) => {
  const user = requireUser(event),
    id = requestId(getRouterParam(event, "id"));
  const body = await readBody<unknown>(event);
  const input = parseInput(
    commentSchema,
    body && typeof body === "object" ? { ...body, request_id: id } : body,
  );
  const result = await addComment(id, user, input.text, input.client_id);
  setResponseStatus(event, 201);
  return result;
});
