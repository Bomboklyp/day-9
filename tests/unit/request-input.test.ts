import { expect, test } from "vitest";
import { createRequestSchema } from "../../shared/utils/request-input";
import { commentSchema } from "../../server/utils/schemas";
test("форма и сервер требуют название и описание с понятными сообщениями", () => {
  const result = createRequestSchema.safeParse({
    title: "",
    description: "",
    category_id: "category-1",
    priority: "high",
  });
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues.map((issue) => issue.message)).toContain(
      "Укажите название заявки.",
    );
    expect(result.error.issues.map((issue) => issue.message)).toContain(
      "Опишите проблему.",
    );
  }
});
test("комментарий требует уникальный идентификатор отправки", () => {
  expect(
    commentSchema.safeParse({ request_id: 1042, text: "Текст" }).success,
  ).toBe(false);
  expect(
    commentSchema.safeParse({
      request_id: 1042,
      text: "Текст",
      client_id: "not-uuid",
    }).success,
  ).toBe(false);
  expect(
    commentSchema.safeParse({
      request_id: 1042,
      text: "Текст",
      client_id: "550e8400-e29b-41d4-a716-446655440000",
    }).success,
  ).toBe(true);
});
