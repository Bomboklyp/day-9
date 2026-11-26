import { transaction } from "../utils/database";
import {
  notifyRequest,
  pendingSlaRequests,
  visibleNotifications,
  markNotificationsRead,
} from "../repositories/notifications";
import { requestSla } from "../../shared/utils/sla";
export { notifyRequest, markNotificationsRead };
export async function collectSlaNotifications(now = new Date().toISOString()) {
  return transaction(async (client) => {
    for (const record of await pendingSlaRequests(client, now)) {
      const sla = requestSla(record, now);
      for (const phase of ["response", "resolution"] as const) {
        const value = sla[phase];
        if (value.state !== "warning") continue;
        const title =
          phase === "response"
            ? "Срок реакции скоро истечёт"
            : "Срок решения скоро истечёт";
        const remaining = Math.max(
          0,
          Math.ceil((Date.parse(value.due_at!) - Date.parse(now)) / 60000),
        );
        await notifyRequest(
          client,
          record,
          "sla",
          title,
          `#${record.id} · ${record.title} · осталось ${remaining} мин`,
          `sla:${record.id}:${phase}:${value.due_at}`,
        );
      }
    }
  });
}
export async function listNotifications(userId: string) {
  await collectSlaNotifications();
  return visibleNotifications(userId);
}
