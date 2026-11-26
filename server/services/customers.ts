import { createError } from "h3";
import { listCustomers } from "../repositories/customers";
import { saveCatalog } from "../repositories/catalogs";
export { listCustomers };
export async function saveCustomer(name: string, id?: string) {
  const record = await saveCatalog("customers", name, id);
  if (!record)
    throw createError({ statusCode: 404, statusMessage: "Record not found" });
  return record;
}
