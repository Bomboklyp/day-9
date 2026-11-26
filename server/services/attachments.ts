import { createError } from "h3";
import type { SessionUser } from "../../shared/types/auth";
import {
  attachmentLimits,
  attachmentProblem,
  attachmentMime,
} from "../../shared/utils/attachments";
import { canReadRequest } from "../../shared/utils/permissions";
import { transaction } from "../utils/database";
import {
  countAttachments,
  insertAttachment,
  listAttachments,
  findAttachment,
} from "../repositories/attachments";
import {
  lockRequest,
  incrementRevision,
  recordRequestEvent,
} from "../repositories/requests";
import { readRequest } from "./requests";
export async function requestAttachments(id: number, user: SessionUser) {
  await readRequest(id, user);
  return listAttachments(id);
}
export async function addAttachments(
  id: number,
  user: SessionUser,
  files: { name: string; data: Uint8Array; type?: string }[],
) {
  if (!files.length)
    throw createError({ statusCode: 400, data: { message: "Выберите файл" } });
  const prepared = files.map((file) => ({
    ...file,
    size: file.data.byteLength,
    mime: attachmentMime(file.name, file.data),
  }));
  if (prepared.some((file) => file.size > attachmentLimits.bytes))
    throw createError({
      statusCode: 413,
      data: {
        message: "Файл превышает 10 МБ. Выберите файл меньшего размера.",
      },
    });
  const problem = attachmentProblem(prepared);
  if (problem)
    throw createError({ statusCode: 422, data: { message: problem } });
  if (
    prepared.some(
      (file) => !file.mime || (file.type && file.type !== file.mime),
    )
  )
    throw createError({
      statusCode: 415,
      data: { message: "Содержимое файла не соответствует PNG, JPG или PDF." },
    });
  await transaction(async (client) => {
    const record = await lockRequest(client, id);
    if (!record || !canReadRequest(user, record))
      throw createError({
        statusCode: 404,
        statusMessage: "Request not found",
      });
    if (record.status === "closed")
      throw createError({
        statusCode: 409,
        data: { message: "Закрытую заявку нельзя изменять" },
      });
    const limit = attachmentProblem(
      prepared,
      await countAttachments(client, id),
    );
    if (limit) throw createError({ statusCode: 422, data: { message: limit } });
    for (const file of prepared)
      await insertAttachment(client, id, user.id, {
        ...file,
        mime: file.mime!,
      });
    await incrementRevision(client, id);
    await recordRequestEvent(
      client,
      id,
      user,
      `Добавлено вложений: ${prepared.length}`,
      "",
      "attachment",
    );
  });
  return listAttachments(id);
}
export async function downloadAttachment(id: string, user: SessionUser) {
  const file = await findAttachment(id);
  if (!file)
    throw createError({
      statusCode: 404,
      statusMessage: "Attachment not found",
    });
  await readRequest(file.request_id, user);
  return file;
}
