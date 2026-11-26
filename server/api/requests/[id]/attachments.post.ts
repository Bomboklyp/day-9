import { defineEventHandler, getRouterParam, setResponseStatus } from "h3";
import { requireUser } from "../../../utils/auth";
import { requestId } from "../../../utils/request-id";
import { readUpload } from "../../../utils/read-upload";
import { addAttachments } from "../../../services/attachments";
import { attachmentLimits } from "../../../../shared/utils/attachments";
export default defineEventHandler(async (event) => {
  const user = requireUser(event),
    id = requestId(getRouterParam(event, "id"));
  const form = await readUpload(
    event,
    attachmentLimits.bytes * attachmentLimits.count + 1024 * 1024,
  );
  const files = [];
  for (const value of form.values()) {
    if (typeof value !== "string")
      files.push({
        name: value.name,
        type: value.type,
        data: new Uint8Array(await value.arrayBuffer()),
      });
  }
  const data = await addAttachments(id, user, files);
  setResponseStatus(event, 201);
  return { data };
});
