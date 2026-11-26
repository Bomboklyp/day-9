import { notifyRequest } from "./notifications";
import { createError } from "h3";
import type { PoolClient } from "pg";
import { transaction } from "../utils/database";
import type { SessionUser } from "../../shared/types/auth";
import type {
  CreateRequestBody,
  UpdateRequestBody,
} from "../../shared/types/api";
import { canReadRequest } from "../../shared/utils/permissions";
import {
  validateTransition,
  requiredStatusFields,
  statusAfterAssignment,
} from "../../shared/utils/request-rules";
import { priorities, statuses } from "../../shared/utils/request-options";
import {
  findRequest,
  listRequests,
  lockRequest,
  insertRequest,
  saveRequest,
  recordRequestEvent,
} from "../repositories/requests";
import { customerExists } from "../repositories/customers";
import { categoryExists } from "../repositories/categories";
import { findAssignee } from "../repositories/users";
export { listRequests };
export async function readRequest(
  id: number,
  user: SessionUser,
  client?: PoolClient,
) {
  const result = await findRequest(id, user, client);
  if (!result)
    throw createError({ statusCode: 404, statusMessage: "Request not found" });
  return result;
}
export async function createRequest(
  user: SessionUser,
  input: CreateRequestBody,
) {
  if (user.role === "Agent")
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  if (
    user.role === "Client" &&
    input.customer_id &&
    input.customer_id !== user.customer_id
  )
    throw createError({ statusCode: 403, statusMessage: "Forbidden customer" });
  const customerId =
    user.role === "Client" ? user.customer_id : input.customer_id;
  if (!customerId)
    throw createError({
      statusCode: 422,
      statusMessage: "Customer required",
      data: { message: "Выберите клиента" },
    });
  return transaction(async (client) => {
    if (
      !(await customerExists(customerId, client)) ||
      !(await categoryExists(input.category_id, client))
    )
      throw createError({
        statusCode: 422,
        statusMessage: "Unknown customer or category",
      });
    const id = await insertRequest(client, user.id, customerId, input);
    await recordRequestEvent(
      client,
      id,
      user,
      `${user.name} создал(а) заявку`,
      "",
      "created",
    );
    return readRequest(id, user, client);
  });
}
export async function updateRequest(
  id: number,
  user: SessionUser,
  input: UpdateRequestBody,
) {
  if (user.role === "Client")
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  if (
    user.role === "Agent" &&
    (input.priority !== undefined || input.assignee_id !== undefined)
  )
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  return transaction(async (client) => {
    const record = await lockRequest(client, id);
    if (!record || !canReadRequest(user, record))
      throw createError({
        statusCode: 404,
        statusMessage: "Request not found",
      });
    if (record.status === "closed")
      throw createError({
        statusCode: 409,
        statusMessage: "Request is closed",
        data: { message: "Закрытую заявку нельзя изменять" },
      });
    if (
      input.expected_revision !== undefined &&
      input.expected_revision !== record.revision
    )
      throw createError({
        statusCode: 409,
        statusMessage: "Request changed",
        data: { message: "Заявка уже изменена. Обновите данные" },
      });
    let assignee = record.assignee_id ?? null,
      nextStatus = input.status ?? record.status;
    if (input.assignee_id !== undefined) {
      if (input.assignee_id) {
        const agent = await findAssignee(input.assignee_id, client);
        if (!agent || agent.role !== "Agent" || !agent.is_active)
          throw createError({
            statusCode: 422,
            statusMessage: "Inactive or invalid assignee",
            data: {
              message:
                "Деактивированный сотрудник не может получить новое назначение. Выберите активного исполнителя.",
            },
          });
        await recordRequestEvent(
          client,
          id,
          user,
          `Назначен исполнитель: ${agent.name}`,
          input.comment ?? "",
        );
      }
      const assignedStatus = statusAfterAssignment(
        record.status,
        Boolean(input.assignee_id),
        nextStatus,
      );
      if (!assignedStatus)
        throw createError({
          statusCode: 409,
          statusMessage: "Assignee required for current status",
        });
      nextStatus = assignedStatus;
      assignee = input.assignee_id;
    }
    if (input.status === "escalated") {
      const message = requiredStatusFields("escalated", input);
      if (message) throw createError({ statusCode: 422, data: { message } });
    }
    if (input.status && input.status !== record.status) {
      const problem = validateTransition(
        record.status,
        input.status,
        user.role,
        {
          assigneeId: assignee,
          reason: input.reason,
          resolution: input.resolution,
        },
      );
      if (problem)
        throw createError({
          statusCode: problem.statusCode,
          statusMessage: "Invalid status transition",
          data: { message: problem.message },
        });
    }

    if (
      nextStatus === "resolved" &&
      input.resolution !== undefined &&
      !input.resolution.trim()
    )
      throw createError({
        statusCode: 422,
        statusMessage: "Resolution required",
      });
    const priority = input.priority ?? record.priority;
    if (priority !== record.priority)
      await recordRequestEvent(
        client,
        id,
        user,
        `Приоритет изменён на «${priorities.find((item) => item.value === priority)?.label}»`,
      );
    if (nextStatus !== record.status)
      await recordRequestEvent(
        client,
        id,
        user,
        `Статус: ${statuses.find((item) => item.value === nextStatus)?.label}`,
        input.resolution ?? input.reason ?? "",
      );
    await saveRequest(client, record, assignee, nextStatus, input);
    const recipient = {
      id,
      author_id: record.author_id,
      assignee_id: assignee,
    };
    const key = `request:${id}:${record.revision! + 1}`;
    if (input.assignee_id && input.assignee_id !== record.assignee_id)
      await notifyRequest(
        client,
        recipient,
        "assignment",
        "Вам назначена заявка",
        `#${id} · ${record.title}`,
        `assignment:${key}`,
      );
    if (nextStatus !== record.status) {
      const title =
        nextStatus === "escalated"
          ? "Заявка эскалирована"
          : nextStatus === "resolved"
            ? "Исполнитель зафиксировал решение"
            : nextStatus === "in_progress"
              ? "Исполнитель начал работу"
              : nextStatus === "closed"
                ? "Заявка закрыта"
                : "Статус заявки изменён";
      await notifyRequest(
        client,
        recipient,
        nextStatus === "escalated" ? "escalation" : "status",
        title,
        `#${id} · ${input.reason ?? record.title}`,
        `status:${key}`,
      );
    }
    return readRequest(id, user, client);
  });
}
