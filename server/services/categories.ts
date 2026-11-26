import { createError } from "h3";
import { listCategories } from "../repositories/categories";
import { saveCatalog } from "../repositories/catalogs";
export { listCategories };
export async function saveCategory(name: string, id?: string) {
  const record = await saveCatalog("categories", name, id);
  if (!record)
    throw createError({ statusCode: 404, statusMessage: "Record not found" });
  return record;
}
