import { defineEventHandler, readBody } from "h3";
import { createSession } from "../../utils/auth";
import { loginSchema, parseInput } from "../../utils/schemas";
import { login } from "../../services/login";
export default defineEventHandler(async (event) => {
  const user = await login(
    event,
    parseInput(loginSchema, await readBody<unknown>(event)),
  );
  await createSession(event, user);
  return { user };
});
