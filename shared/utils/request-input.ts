import { z } from "zod";

export const createRequestSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Укажите название заявки.")
      .min(5, "Название должно содержать не менее 5 символов.")
      .max(120, "Название слишком длинное."),
    description: z
      .string()
      .trim()
      .min(1, "Опишите проблему.")
      .min(10, "Добавьте описание не короче 10 символов.")
      .max(3000, "Описание слишком длинное."),
    category_id: z.string().trim().min(1, "Выберите категорию.").max(100),
    customer_id: z
      .string()
      .trim()
      .min(1, "Выберите клиента.")
      .max(100)
      .optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]),
  })
  .strict();
