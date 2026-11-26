import { defineEventHandler, getRouterParam } from "h3";
import { requireUser } from "../../utils/auth";
import { readRequest } from "../../services/requests";
import { requestId } from "../../utils/request-id";
export default defineEventHandler((event) =>
  readRequest(requestId(getRouterParam(event, "id")), requireUser(event)),
);
