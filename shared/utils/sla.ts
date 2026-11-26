import type { SlaPolicy, RequestSla, SlaPhase } from "../types/product";
export const defaultSlaPolicies: SlaPolicy[] = [
  { priority: "urgent", response_minutes: 15, resolution_minutes: 60 },
  { priority: "high", response_minutes: 60, resolution_minutes: 240 },
  { priority: "medium", response_minutes: 240, resolution_minutes: 1440 },
  { priority: "low", response_minutes: 480, resolution_minutes: 4320 },
];
export function slaPhase(
  created: string,
  due: string | null | undefined,
  finished: string | null | undefined,
  now: string,
): SlaPhase {
  if (!due) return { state: "ok", due_at: null, finished_at: finished ?? null };
  const deadline = Date.parse(due),
    end = finished ? Date.parse(finished) : Date.parse(now);
  const duration = Math.max(0, deadline - Date.parse(created));
  const warningWindow = Math.min(
    duration,
    Math.max(60000, Math.min(30 * 60000, duration * 0.2)),
  );
  return {
    state:
      end > deadline
        ? "overdue"
        : finished
          ? "met"
          : deadline - end <= warningWindow
            ? "warning"
            : "ok",
    due_at: due,
    finished_at: finished ?? null,
  };
}
export function requestSla(
  record: {
    created_at: string;
    response_due_at?: string | null;
    due_at?: string | null;
    responded_at?: string | null;
    resolved_at?: string | null;
    closed_at?: string | null;
  },
  now: string,
): RequestSla {
  return {
    response: slaPhase(
      record.created_at,
      record.response_due_at,
      record.responded_at ?? record.closed_at,
      now,
    ),
    resolution: slaPhase(
      record.created_at,
      record.due_at,
      record.resolved_at ?? record.closed_at,
      now,
    ),
    calculated_at: now,
  };
}
export function parseDuration(text: string): number | null {
  const clean = text.trim().toLowerCase();
  if (/^\d+$/.test(clean)) return Number(clean);
  const match = clean.match(
    /^(?:(\d+)\s*(?:ч|час|часа|часов))?\s*(?:(\d+)\s*(?:м|мин|минут|минута|минуты))?$/,
  );
  return match && (match[1] || match[2])
    ? Number(match[1] ?? 0) * 60 + Number(match[2] ?? 0)
    : null;
}
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60),
    rest = Math.round(minutes % 60);
  const plural = (n: number, forms: string[]) =>
    forms[
      n % 100 >= 11 && n % 100 <= 14
        ? 2
        : n % 10 === 1
          ? 0
          : n % 10 >= 2 && n % 10 <= 4
            ? 1
            : 2
    ];
  return (
    [
      hours ? `${hours} ${plural(hours, ["час", "часа", "часов"])}` : "",
      rest ? `${rest} ${plural(rest, ["минута", "минуты", "минут"])}` : "",
    ]
      .filter(Boolean)
      .join(" ") || "0 минут"
  );
}

export function formatShortDuration(minutes: number): string {
  const value = Math.max(0, Math.round(minutes));
  return value >= 60
    ? `${Math.floor(value / 60)} ч ${value % 60} м`
    : `${value} м`;
}
