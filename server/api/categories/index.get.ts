import { defineEventHandler } from "h3";
import { requireUser } from "../../utils/auth";
import { listCategories } from "../../services/categories";
export default defineEventHandler(async (event) => ({
  data: await (requireUser(event), listCategories()),
}));
