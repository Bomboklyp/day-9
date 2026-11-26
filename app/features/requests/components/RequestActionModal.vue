<script setup lang="ts">
import { statuses } from "#shared/utils/request-options";
import {
  useRequestActionForm,
  type RequestActionProps,
} from "../composables/useRequestActionForm";
const props = defineProps<RequestActionProps>();
const emit = defineEmits<{ close: [] }>();
const { busy, error, draft, agents, choices, titles, hints, submit } =
  useRequestActionForm(props, () => emit("close"));
</script>
<template>
  <AppModal :open="open" :title="titles[mode]" @close="!busy && emit('close')">
    <form class="form-stack" novalidate @submit.prevent="submit">
      <p class="muted">{{ hints[mode] }}</p>
      <template v-if="mode === 'assign'">
        <label class="field"
          ><span>Исполнитель</span
          ><select
            v-model="draft.assignee"
            aria-label="Исполнитель"
            :disabled="busy"
          >
            <option value="">Не назначен</option>
            <option
              v-for="person in agents"
              :key="person.id"
              :value="person.id"
              :disabled="!person.isActive"
            >
              {{ person.name }}{{ person.isActive ? "" : " · деактивирован" }}
            </option>
          </select></label
        >
        <label class="field"
          ><span>Комментарий</span
          ><input
            v-model="draft.comment"
            maxlength="2000"
            :disabled="busy"
            aria-label="Комментарий"
        ></label>
      </template>
      <template v-else-if="mode === 'status'">
        <label class="field"
          ><span>Текущий статус</span
          ><input
            :value="
              statuses.find((item) => item.value === request.status)?.label
            "
            readonly
        ></label>
        <label class="field"
          ><span>Новый статус</span
          ><select
            v-model="draft.status"
            aria-label="Новый статус"
            :disabled="busy"
          >
            <option v-for="status in choices" :key="status" :value="status">
              {{ statuses.find((item) => item.value === status)?.label }}
            </option>
          </select></label
        >
        <label v-if="draft.status === 'waiting'" class="field"
          ><span>Причина ожидания</span
          ><textarea
            v-model="draft.reason"
            maxlength="3000"
            :disabled="busy"
            aria-label="Причина ожидания"
          />
        </label>
      </template>
      <label v-else-if="mode === 'resolve'" class="field"
        ><span>Результат решения</span
        ><textarea
          v-model="draft.resolution"
          maxlength="3000"
          :disabled="busy"
          aria-label="Результат решения"
        />
      </label>
      <label v-else-if="mode === 'escalate'" class="field"
        ><span>Причина эскалации</span
        ><textarea
          v-model="draft.reason"
          maxlength="3000"
          :disabled="busy"
          aria-label="Причина эскалации"
        />
      </label>
      <label v-else class="field"
        ><span>Причина закрытия</span
        ><textarea
          v-model="draft.reason"
          maxlength="3000"
          :disabled="busy"
          aria-label="Причина закрытия"
        />
      </label>
      <p
        v-if="error"
        class="form-error"
        :class="{ 'field-error': mode === 'escalate' }"
        role="alert"
      >
        {{ error }}
      </p>
      <div class="modal-footer">
        <button
          class="button button-secondary"
          type="button"
          :disabled="busy"
          @click="emit('close')"
        >
          Отмена</button
        ><button class="button button-primary" type="submit" :disabled="busy">
          {{
            busy
              ? "Сохраняем…"
              : mode === "assign"
                ? "Назначить"
                : mode === "resolve"
                  ? "Отправить решение"
                  : mode === "escalate"
                    ? "Эскалировать"
                    : mode === "close"
                      ? "Закрыть заявку"
                      : "Сохранить"
          }}
        </button>
      </div>
    </form>
  </AppModal>
</template>
