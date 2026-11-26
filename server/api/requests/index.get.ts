import { defineEventHandler, getQuery } from "h3";
import { requireUser } from "../../utils/auth";
import { listRequests } from "../../services/requests";
import { readRequestsQuery } from "../../../shared/utils/request-query";
export default defineEventHandler((event) =>
  listRequests(requireUser(event), readRequestsQuery(getQuery(event))),
);
