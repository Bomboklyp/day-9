import { defineEventHandler, getRouterParam } from "h3";
import { requireUser } from "../../../utils/auth";
import { requestId } from "../../../utils/request-id";
import { requestAttachments } from "../../../services/attachments";
export default defineEventHandler(async (event) => ({
  data: await requestAttachments(
    requestId(getRouterParam(event, "id")),
    requireUser(event),
  ),
}));
