import { defineEventHandler } from "h3";
import { requireUser } from "../../utils/auth";
import { listNotifications } from "../../services/notifications";
export default defineEventHandler(async (event) => ({
  data: await listNotifications(requireUser(event).id),
}));
