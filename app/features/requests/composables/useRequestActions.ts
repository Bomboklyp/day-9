import { createRequestsApi } from "../api";
import { useRequestCache } from "~/features/requests/composables/useRequestCache";
import { useAuth } from "~/features/auth/composables/useAuth";
import { useApi } from "~/composables/useApi";
import type {
  CreateRequestBody,
  UpdateRequestBody,
} from "../../../../shared/types/api";
import { useRequestUiStore } from "~/features/requests/state/requestUi";
import { apiErrorMessage } from "~/lib/api-errors";
import { allowedStatuses } from "#shared/utils/request-rules";
import { priorities, statuses } from "#shared/utils/request-options";

export function useRequestActions() {
  const app = useNuxtApp();
  const ui = useRequestUiStore();
  const cache = useRequestCache();
  const auth = useAuth();
  const { user } = auth;
  const api = createRequestsApi(useApi());
  async function createRequest(input: CreateRequestBody) {
    const version = auth.version.value;
    const response = await api.create(input);
    if (version !== auth.version.value) throw new Error("Session changed");
    return response.data;
  }
  async function updateRequest(id: number, input: UpdateRequestBody) {
    const version = auth.version.value;
    const sequence = ui.begin(id);
    if (!sequence) throw new Error("Request mutation already in progress");
    try {
      const before = cache.find(id) ?? (await api.get(id)).data;
      const oldPriority = before.priority,
        oldStatus = before.status;
      if (input.priority && input.priority !== oldPriority)
        ui.priorityChanges[id] = { before: oldPriority, after: input.priority };
      ui.notice = {
        requestId: id,
        kind: "saving",
        message: input.priority
          ? "Сохраняем приоритет…"
          : "Сохраняем изменения…",
      };
      const response = await api.update(id, {
        ...input,
        expected_revision: before.revision ?? 1,
      });
      if (version !== auth.version.value) return response.data;
      await cache.commit(response.data);
      await app.runWithContext(() => refreshNuxtData("workflow-notifications"));
      if (version !== auth.version.value) return response.data;
      ui.notice = {
        requestId: id,
        kind: "success",
        message: input.priority
          ? `Приоритет изменён на «${priorities.find((item) => item.value === response.data.priority)?.label}»`
          : input.status
            ? `Статус изменён на «${statuses.find((item) => item.value === response.data.status)?.label}»`
            : "Исполнитель изменён",
      };
      if (input.priority && oldPriority !== response.data.priority)
        ui.remember({
          id,
          sequence,
          field: "priority",
          before: oldPriority,
          after: response.data.priority,
        });
      else if (
        input.status &&
        oldStatus !== response.data.status &&
        user.value &&
        allowedStatuses(response.data.status, user.value.role).includes(
          oldStatus,
        )
      )
        ui.remember({
          id,
          sequence,
          field: "status",
          before: oldStatus,
          after: response.data.status,
        });
      else if (ui.undo?.id === id) ui.forget(ui.undo.sequence);
      if (response.data.status === "closed" && ui.undo?.id === id)
        ui.undo = null;
      return response.data;
    } catch (error: unknown) {
      if (version === auth.version.value)
        ui.notice = {
          requestId: id,
          kind: "error",
          message: `Предыдущее значение восстановлено. ${apiErrorMessage(error)}`,
        };
      throw error;
    } finally {
      if (version === auth.version.value) ui.finish(id, sequence);
    }
  }
  async function undoLastChange() {
    const change = ui.undo;
    if (!change) return;
    const version = auth.version.value;
    const sequence = ui.begin(change.id);
    if (!sequence) return;
    try {
      const current = cache.find(change.id) ?? (await api.get(change.id)).data;
      if (current[change.field] !== change.after) {
        ui.forget(change.sequence);
        throw { statusCode: 409 };
      }
      if (change.field === "priority")
        ui.priorityChanges[change.id] = {
          before: current.priority,
          after: change.before,
        };
      const body: UpdateRequestBody =
        change.field === "priority"
          ? { priority: change.before }
          : {
              status: change.before,
              reason: current.waiting_reason ?? undefined,
              resolution: current.resolution ?? undefined,
            };
      const result = await api.update(change.id, {
        ...body,
        expected_revision: current.revision ?? 1,
      });
      if (version !== auth.version.value) return result.data;
      await cache.commit(result.data);
      if (version !== auth.version.value) return result.data;
      ui.forget(change.sequence);
      ui.notice = {
        requestId: change.id,
        kind: "success",
        message: "Изменение отменено",
      };
    } catch (error: unknown) {
      if (version === auth.version.value)
        ui.notice = {
          requestId: change.id,
          kind: "error",
          message: `Не удалось отменить изменение. ${apiErrorMessage(error)}`,
        };
    } finally {
      if (version === auth.version.value) ui.finish(change.id, sequence);
    }
  }
  return { createRequest, updateRequest, undoLastChange };
}
