import { beforeEach, expect, test, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import { clearNuxtState, useNuxtApp } from "#app";
import RequestComments from "../../app/features/comments/components/RequestComments.vue";
import { useAuth } from "../../app/composables/useAuth";
import { useRequestUiStore } from "../../app/stores/requestUi";
import { mapApiRequest } from "../../app/utils/api";

const { addComment } = vi.hoisted(() => ({ addComment: vi.fn() }));
vi.mock("../../app/features/comments/composables/useCommentActions", () => ({
  useCommentActions: () => ({ addComment }),
}));
const request = mapApiRequest(
  {
    id: 1042,
    title: "CRM",
    status: "new",
    priority: "high",
    created_at: "2026-10-05T09:00:00Z",
  },
  { users: [], customers: [], categories: [] },
);
beforeEach(() => {
  clearNuxtState();
  sessionStorage.clear();
  addComment.mockReset();
  useNuxtApp().runWithContext(() => {
    useAuth().user.value = {
      id: "user-1",
      name: "Оператор",
      email: "operator@workflow.local",
      role: "Operator",
      is_active: true,
      customer_id: null,
    };
    useRequestUiStore().$reset();
  });
});
test("REG-01: повторное событие submit во время отправки делает один запрос", async () => {
  let finish: () => void = () => {};
  addComment.mockReturnValue(
    new Promise<void>((resolve) => {
      finish = resolve;
    }),
  );
  const wrapper = await mountSuspended(RequestComments, { props: { request } });
  await wrapper.get("textarea").setValue("Один комментарий");
  await wrapper.get("form").trigger("submit");
  await wrapper.get("form").trigger("submit");
  expect(addComment).toHaveBeenCalledTimes(1);
  expect(wrapper.get("button").attributes("disabled")).toBeDefined();
  finish();
  await flushPromises();
  expect(wrapper.get("textarea").element.value).toBe("");
  wrapper.unmount();
});
test("REG-01: после ошибки повтор сохраняет текст и идентификатор отправки", async () => {
  addComment
    .mockRejectedValueOnce({ statusCode: 500 })
    .mockResolvedValueOnce(undefined);
  const wrapper = await mountSuspended(RequestComments, { props: { request } });
  await wrapper.get("textarea").setValue("Повтор после обрыва ответа");
  await wrapper.get("form").trigger("submit");
  await flushPromises();
  expect(wrapper.get("textarea").element.value).toBe(
    "Повтор после обрыва ответа",
  );
  expect(wrapper.text()).toContain("Сервис временно недоступен");
  await wrapper.get("form").trigger("submit");
  await flushPromises();
  expect(addComment).toHaveBeenCalledTimes(2);
  expect(addComment.mock.calls[0]?.[2]).toBe(addComment.mock.calls[1]?.[2]);
  wrapper.unmount();
});
test("REG-04: черновик восстанавливается после повторного открытия, без автоматической отправки", async () => {
  const first = await mountSuspended(RequestComments, { props: { request } });
  await first.get("textarea").setValue("Неотправленный текст");
  first.unmount();
  const second = await mountSuspended(RequestComments, { props: { request } });
  expect(second.get("textarea").element.value).toBe("Неотправленный текст");
  expect(addComment).not.toHaveBeenCalled();
  second.unmount();
});
