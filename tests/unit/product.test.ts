import { expect, test } from "vitest";
import {
  attachmentLimits,
  attachmentProblem,
  attachmentMime,
} from "../../shared/utils/attachments";
import {
  defaultSlaPolicies,
  parseDuration,
  formatDuration,
  slaPhase,
  requestSla,
} from "../../shared/utils/sla";
import {
  allowedStatuses,
  requiredStatusFields,
  validateTransition,
} from "../../shared/utils/request-rules";

test("four priorities have the SLA values from the design", () => {
  expect(
    defaultSlaPolicies.map((policy) => [
      policy.priority,
      policy.response_minutes,
      policy.resolution_minutes,
    ]),
  ).toEqual([
    ["urgent", 15, 60],
    ["high", 60, 240],
    ["medium", 240, 1440],
    ["low", 480, 4320],
  ]);
});
test("duration text is converted to minutes without accepting garbage", () => {
  expect(parseDuration("1 час 30 минут")).toBe(90);
  expect(parseDuration("4 часа")).toBe(240);
  expect(parseDuration("15 минут")).toBe(15);
  expect(parseDuration("-5")).toBeNull();
  expect(parseDuration("1 час мусор")).toBeNull();
  expect(formatDuration(1440)).toBe("24 часа");
});
test("escalation requires a reason and is available to operator and admin", () => {
  expect(requiredStatusFields("escalated", { reason: " " })).toBe(
    "Укажите причину эскалации.",
  );
  expect(
    validateTransition("in_progress", "escalated", "Operator", {
      assigneeId: "agent",
      reason: "Нужен специалист",
    }),
  ).toBeNull();
  expect(allowedStatuses("in_progress", "Agent")).not.toContain("escalated");
  expect(allowedStatuses("escalated", "Admin")).toContain("in_progress");
});
test("SLA warning starts at the last 20 percent capped at thirty minutes", () => {
  expect(
    slaPhase(
      "2026-10-05T09:00:00Z",
      "2026-10-05T09:01:00Z",
      null,
      "2026-10-05T09:00:10Z",
    ).state,
  ).toBe("warning");
  const created = "2026-10-05T09:00:00Z",
    due = "2026-10-05T13:00:00Z";
  expect(slaPhase(created, due, null, "2026-10-05T12:29:00Z").state).toBe("ok");
  expect(slaPhase(created, due, null, "2026-10-05T12:30:00Z").state).toBe(
    "warning",
  );
  expect(slaPhase(created, due, null, "2026-10-05T13:00:01Z").state).toBe(
    "overdue",
  );
});
test("a completed phase does not become overdue after its deadline", () => {
  const result = requestSla(
    {
      created_at: "2026-10-05T09:00:00Z",
      response_due_at: "2026-10-05T10:00:00Z",
      responded_at: "2026-10-05T09:05:00Z",
      due_at: "2026-10-05T13:00:00Z",
      resolved_at: "2026-10-05T12:00:00Z",
    },
    "2026-10-06T12:00:00Z",
  );
  expect(result.response.state).toBe("met");
  expect(result.resolution.state).toBe("met");
});
test("attachment limits accept exactly five files and ten MiB", () => {
  expect(
    attachmentProblem(
      [{ name: "report.PDF", size: attachmentLimits.bytes }],
      4,
    ),
  ).toBeNull();
  expect(
    attachmentProblem([
      { name: "report.pdf", size: attachmentLimits.bytes + 1 },
    ]),
  ).toMatch(/10 МБ/);
  expect(attachmentProblem([{ name: "report.pdf", size: 1 }], 5)).toMatch(
    /5 файлов/,
  );
});
test("file names and declared formats cannot bypass the attachment rules", () => {
  expect(attachmentProblem([{ name: "report.exe", size: 1 }])).toMatch(
    /формат/,
  );
  expect(attachmentProblem([{ name: "../report.pdf", size: 1 }])).toMatch(
    /имя/,
  );
  expect(attachmentProblem([{ name: "empty.pdf", size: 0 }])).toMatch(/Пустой/);
});
test("file signatures must agree with their extension", () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(attachmentMime("error.png", png)).toBe("image/png");
  expect(attachmentMime("error.jpg", png)).toBeNull();
  expect(
    attachmentMime("report.pdf", new TextEncoder().encode("<html>fake</html>")),
  ).toBeNull();
});
