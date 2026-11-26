import { defineEventHandler, readBody } from "h3";
import { requireUser } from "../../utils/auth";
import { profileSchema, parseInput } from "../../utils/schemas";
import { changeProfile } from "../../services/auth";
export default defineEventHandler(async (event) => ({
  user: await changeProfile(
    requireUser(event),
    parseInput(profileSchema, await readBody<unknown>(event)),
  ),
}));
