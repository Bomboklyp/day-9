import { createError } from "h3";
export function requestId(value: string | undefined): number {
  if (
    !value ||
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < 1 ||
    Number(value) > 2147483647
  )
    throw createError({ statusCode: 400, statusMessage: "Invalid request id" });
  return Number(value);
}
