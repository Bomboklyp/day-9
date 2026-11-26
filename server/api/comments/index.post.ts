import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { requireUser } from "../../utils/auth";
import { addComment } from "../../services/comments";
import { commentSchema, parseInput } from "../../utils/schemas";
export default defineEventHandler(async (event) => {
  const user = requireUser(event),
    input = parseInput(commentSchema, await readBody<unknown>(event));
  const result = await addComment(
    input.request_id,
    user,
    input.text,
    input.client_id,
  );
  setResponseStatus(event, 201);
  return result;
});
