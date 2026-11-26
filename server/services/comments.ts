import { createError } from "h3";
import type { SessionUser } from "../../shared/types/auth";
import { canReadRequest } from "../../shared/utils/permissions";
import { transaction } from "../utils/database";
import {
  lockRequest,
  incrementRevision,
  markResponded,
  recordRequestEvent,
} from "../repositories/requests";
import { insertComment, findCommentByKey } from "../repositories/comments";
import { readRequest } from "./requests";
export async function addComment(
  id: number,
  user: SessionUser,
  text: string,
  clientId: string,
) {
  return transaction(async (client) => {
    const record = await lockRequest(client, id);
    if (!record || !canReadRequest(user, record))
      throw createError({
        statusCode: 404,
        statusMessage: "Request not found",
      });
    const inserted = await insertComment(client, id, user.id, text, clientId);
    if (!inserted) {
      const previous = await findCommentByKey(client, user.id, clientId);
      if (!previous || previous.request_id !== id || previous.text !== text)
        throw createError({
          statusCode: 409,
          statusMessage: "Comment key already used",
          data: {
            message:
              "Этот ключ уже использован для другого комментария. Обновите форму и повторите отправку.",
          },
        });
      return readRequest(id, user, client);
    }
    await incrementRevision(client, id);
    if (user.role !== "Client") await markResponded(client, id);
    await recordRequestEvent(
      client,
      id,
      user,
      `${user.name} добавил(а) комментарий`,
      "",
      "comment",
    );
    return readRequest(id, user, client);
  });
}
