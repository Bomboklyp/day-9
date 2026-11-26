<script setup lang="ts">
import { createRequestSchema } from "#shared/utils/request-input";
import { apiErrorStatus, apiErrorMessage } from "~/utils/api";
import { priorities } from "#shared/utils/request-options";

useHead({ title: "Новая заявка — WorkFlow" });
const { user } = useAuth();
const route = useRoute();
async function close() {
  if (busy.value) return;
  await navigateTo({ path: "/requests", query: route.query });
  await nextTick();
  document.querySelector<HTMLAnchorElement>('a[href^="/requests/new"]')?.focus();
}
const { data: catalogs, error: catalogError, refresh } = useCatalogs();
const { createRequest } = useRequestActions();
const { form, clear } = useRequestDraft();
const fields = ref<Record<string, string>>({});
const busy = ref(false),
  error = ref("");
watch(
  catalogs,
  (data) => {
    if (!form.category_id) form.category_id = data?.categories[0]?.id ?? "";
    if (!form.customer_id) form.customer_id = data?.customers[0]?.id ?? "";
  },
  { immediate: true },
);
async function submit() {
  if (busy.value) return;
  error.value = "";
  fields.value = {};
  const { customer_id, ...input } = form;
  const parsed = createRequestSchema.safeParse(
    user.value?.role === "Client" ? input : { ...input, customer_id },
  );
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      fields.value[key] ??= issue.message;
    }
    return;
  }
  busy.value = true;
  try {
    const request = await createRequest(parsed.data);
    clear();
    await navigateTo(`/requests/${request.id}`);
  } catch (cause: unknown) {
    error.value =
      apiErrorStatus(cause) === 500 || apiErrorStatus(cause) === 503
        ? "Не удалось сохранить изменения. Данные не потеряны. Повторите попытку."
        : apiErrorMessage(cause);
  } finally {
    busy.value = false;
  }
}
</script>
<template>
  <div>
    <RequestsOverview /><AppModal
      :open="true"
      title="Новая заявка"
      @close="close"
    >
      <form class="form-stack" novalidate @submit.prevent="submit">
        <p class="muted">Опишите проблему — оператор назначит исполнителя.</p>
        <label class="field"
          ><span>Название</span
          ><input
            v-model="form.title"
            :disabled="busy"
            :aria-invalid="!!fields.title"
            :aria-describedby="fields.title ? 'title-error' : undefined"
            aria-label="Название"
            required
            minlength="5"
            maxlength="120"
        ></label>
        <p
          v-if="fields.title"
          id="title-error"
          class="form-error field-error"
          role="alert"
        >
          {{ fields.title }}
        </p>
        <label v-if="user?.role !== 'Client'" class="field"
          ><span>Клиент</span
          ><select v-model="form.customer_id" aria-label="Клиент" required>
            <option
              v-for="item in catalogs?.customers"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
            </option>
          </select></label
        >
        <label class="field"
          ><span>Категория</span
          ><select
            v-model="form.category_id"
            :disabled="busy"
            aria-label="Категория"
            required
          >
            <option
              v-for="item in catalogs?.categories"
              :key="item.id"
              :value="item.id"
            >
              {{ item.name }}
            </option>
          </select></label
        >
        <label class="field"
          ><span>Описание</span
          ><textarea
            v-model="form.description"
            :disabled="busy"
            :aria-invalid="!!fields.description"
            :aria-describedby="
              fields.description ? 'description-error' : undefined
            "
            aria-label="Описание"
            required
            minlength="10"
            maxlength="3000"
            rows="5"
          />
        </label>
        <p
          v-if="fields.description"
          id="description-error"
          class="form-error field-error"
          role="alert"
        >
          {{ fields.description }}
        </p>
        <label class="field"
          ><span>Приоритет</span
          ><select
            v-model="form.priority"
            :disabled="busy"
            aria-label="Приоритет"
          >
            <option
              v-for="item in priorities"
              :key="item.value"
              :value="item.value"
            >
              {{ item.label }}
            </option>
          </select></label
        >
        <p
          v-if="error || catalogError"
          class="form-error create-api-error"
          role="alert"
        >
          {{ error || apiErrorMessage(catalogError) }}
        </p>
        <button
          v-if="catalogError"
          type="button"
          class="button button-secondary align-start"
          @click="refresh()"
        >
          Повторить загрузку
        </button>
        <div class="modal-footer">
          <button
            class="button button-secondary"
            type="button"
            :disabled="busy"
            @click="navigateTo('/requests')"
          >
            Отмена</button
          ><button
            class="button button-primary"
            type="submit"
            :disabled="busy || !catalogs"
          >
            {{ busy ? "Создаём…" : error ? "Повторить" : "Создать заявку" }}
          </button>
        </div>
      </form></AppModal
    >
  </div>
</template>
