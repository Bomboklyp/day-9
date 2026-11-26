import { expect, test } from "vitest";
import {
  validateTransition,
  requiredStatusFields,
  statusAfterAssignment,
  requestCapabilities,
} from "../../shared/utils/request-rules";

test("a valid transition still requires an assignee", () => {
  expect(validateTransition("assigned", "in_progress", "Agent", {})).toEqual({
    statusCode: 422,
    message: "Сначала назначьте исполнителя",
  });
  expect(
    validateTransition("assigned", "in_progress", "Agent", {
      assigneeId: "agent",
    }),
  ).toBeNull();
});
test("waiting, resolution and closing have the same field rules for UI and server", () => {
  expect(requiredStatusFields("waiting", { reason: " " })).toBe(
    "Укажите причину ожидания.",
  );
  expect(requiredStatusFields("resolved", {})).toBe(
    "Опишите результат решения.",
  );
  expect(requiredStatusFields("closed", {})).toBe(
    "Укажите причину ручного закрытия.",
  );
  expect(
    validateTransition("in_progress", "waiting", "Operator", {
      assigneeId: "agent",
      reason: "Нужен ответ",
    }),
  ).toBeNull();
});
test("assignment can advance a new request but cannot remove an agent from active work", () => {
  expect(statusAfterAssignment("new", true)).toBe("assigned");
  expect(statusAfterAssignment("assigned", false)).toBe("new");
  expect(statusAfterAssignment("in_progress", false)).toBeNull();
});
test("UI choices and server transitions respect role and final status", () => {
  expect(requestCapabilities("in_progress", "Agent").next).not.toContain(
    "closed",
  );
  expect(
    validateTransition("in_progress", "closed", "Agent", { reason: "test" })
      ?.statusCode,
  ).toBe(409);
  expect(requestCapabilities("closed", "Admin").editable).toBe(false);
  expect(
    validateTransition("closed", "in_progress", "Admin", {
      assigneeId: "agent",
    })?.statusCode,
  ).toBe(409);
});
