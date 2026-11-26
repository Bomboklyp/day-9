import { defineEventHandler } from "h3";
import { requireUser } from "../../utils/auth";
import { listCustomers } from "../../services/customers";
export default defineEventHandler(async (event) => ({
  data: await listCustomers(requireUser(event)),
}));
