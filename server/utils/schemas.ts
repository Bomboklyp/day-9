import { z } from "zod";
import { createError } from "h3";
import { roles } from "../../shared/types/auth";

const id = z.string().trim().min(1).max(100);
const email = z
  .string()
  .trim()
  .email("Укажите корректную почту")
  .max(150)
  .transform((value) => value.toLowerCase());
const priority = z.enum(["low", "medium", "high", "urgent"]);
const status = z.enum([
  "new",
  "assigned",
  "in_progress",
  "waiting",
  "resolved",
  "closed",
  "escalated",
]);
export const loginSchema = z
  .object({ email, password: z.string().min(1).max(200) })
  .strict();
export const commentSchema = z
  .object({
    client_id: z.uuid(),
    request_id: z.number().int().positive(),
    text: z.string().trim().min(1).max(2000),
  })
  .strict();
export const catalogSchema = z
  .object({ name: z.string().trim().min(2).max(150) })
  .strict();
export const userSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email,
    password: z.string().min(8).max(200),
    role: z.enum(roles),
    is_active: z.boolean().optional(),
    customer_id: id.nullable().optional(),
  })
  .strict();
export const userUpdateSchema = userSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "Нет изменений");
export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const fields: Record<string, string> = {};
    for (const issue of result.error.issues)
      fields[String(issue.path[0] ?? "form")] = issue.message;
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid input",
      data: { message: "Проверьте введённые данные", fields },
    });
  }
  return result.data;
}
export const registerSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    company: z.string().trim().min(2).max(150),
    email,
    password: z
      .string()
      .min(8, "Пароль должен содержать не менее 8 символов")
      .max(200),
  })
  .strict();
export const updateRequestSchema = z
  .object({
    assignee_id: id.nullable().optional(),
    priority: priority.optional(),
    status: status.optional(),
    expected_revision: z.number().int().positive().optional(),
    reason: z.string().trim().max(3000).optional(),
    resolution: z.string().trim().max(3000).optional(),
    comment: z.string().trim().max(2000).optional(),
  })
  .strict()
  .refine(
    (value) =>
      value.assignee_id !== undefined ||
      value.priority !== undefined ||
      value.status !== undefined,
    "Нет изменений",
  );
export const profileSchema = z
  .object({ name: z.string().trim().min(2).max(80), email })
  .strict();
export const nameSchema = z
  .object({ name: z.string().trim().min(2).max(150) })
  .strict();
