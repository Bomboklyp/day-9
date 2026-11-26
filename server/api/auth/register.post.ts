import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { createSession } from "../../utils/auth";
import { registerSchema, parseInput } from "../../utils/schemas";
import { registerClient } from "../../services/auth";
export default defineEventHandler(async (event) => {
  const user = await registerClient(
    parseInput(registerSchema, await readBody<unknown>(event)),
  );
  await createSession(event, user);
  setResponseStatus(event, 201);
  return { user };
});
