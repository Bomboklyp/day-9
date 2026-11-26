import { defineEventHandler } from "h3";
import { requireUser } from "../../utils/auth";
import { listUsers } from "../../services/users";
export default defineEventHandler(async (event) => ({
  data: await listUsers(requireUser(event)),
}));
