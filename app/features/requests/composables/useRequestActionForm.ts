import type { UpdateRequestBody } from "#shared/types/api";
import type { WorkflowRequest, RequestStatus } from "~/types/workflow";
import type { UserOption } from "~/features/users/types";
import {
  requestCapabilities,
  requiredStatusFields,
} from "#shared/utils/request-rules";
import { apiErrorMessage } from "~/lib/api-errors";
import { useAuth } from "~/features/auth/composables/useAuth";
import { useRequestActions } from "./useRequestActions";
export interface RequestActionProps {
  open: boolean;
  mode: "assign" | "status" | "resolve" | "close" | "escalate";
  request: WorkflowRequest;
  users: UserOption[];
  initialAssignee?: string;
}

export function useRequestActionForm(
  props: RequestActionProps,
  close: () => void,
) {
  const { user } = useAuth(),
    { updateRequest } = useRequestActions();
  const busy = ref(false),
    error = ref("");
  const draft = reactive({
    assignee: "",
    status: "in_progress" as RequestStatus,
    reason: "",
    resolution: "",
    comment: "",
  });
  const agents = computed(() =>
    props.users.filter((person) => person.role === "Agent"),
  );
  const choices = computed(
    () =>
      requestCapabilities(props.request.status, user.value?.role ?? "Client")
        .formStatuses,
  );
  const titles = {
    assign: "Назначить исполнителя",
    status: "Изменить статус",
    resolve: "Зафиксировать решение",
    close: "Закрыть заявку",
    escalate: "Эскалировать заявку",
  };
  const hints = {
    assign: "Выберите активного сотрудника.",
    status: "Доступные действия зависят от текущего статуса.",
    resolve: "Результат обязателен для статуса «Решена».",
    close: "Укажите причину ручного закрытия.",
    escalate: "Заявка будет передана на дополнительное рассмотрение.",
  };
  watch(
    () => props.open,
    (open) => {
      if (open) {
        error.value = "";
        draft.assignee =
          props.initialAssignee ||
          agents.value.find((person) => person.isActive)?.id ||
          "";
        draft.status = choices.value[0] ?? props.request.status;
        draft.reason = "";
        draft.resolution = "";
        draft.comment = "";
      }
    },
  );
  watch(
    () => draft.reason,
    () => {
      if (props.mode === "escalate" && draft.reason.trim()) error.value = "";
    },
  );
  async function submit() {
    if (busy.value) return;
    error.value = "";
    const input: UpdateRequestBody = {};
    if (props.mode === "assign") {
      if (!draft.assignee) {
        error.value = "Выберите исполнителя.";
        return;
      }
      input.assignee_id = draft.assignee;
      input.comment = draft.comment;
    } else if (props.mode === "resolve") {
      input.status = "resolved";
      input.resolution = draft.resolution;
    } else if (props.mode === "escalate") {
      input.status = "escalated";
      input.reason = draft.reason;
    } else if (props.mode === "close") {
      input.status = "closed";
      input.reason = draft.reason;
    } else {
      input.status = draft.status;
      input.reason = draft.reason;
    }
    if (input.status) {
      const message = requiredStatusFields(input.status, input);
      if (message) {
        error.value = message;
        return;
      }
    }
    busy.value = true;
    try {
      await updateRequest(props.request.id, input);
      close();
    } catch (cause: unknown) {
      error.value = apiErrorMessage(cause);
    } finally {
      busy.value = false;
    }
  }
  return { busy, error, draft, agents, choices, titles, hints, submit };
}
