<script setup lang="ts">
const props = withDefaults(
  defineProps<{ open: boolean; title: string; description?: string }>(),
  { description: "" },
);
const emit = defineEmits<{ close: [] }>();
const dialog = ref<HTMLDialogElement>();
const titleId = useId();
const descriptionId = useId();
let previousFocus: HTMLElement | null = null;

function close() {
  emit("close");
}
function trapKeyboard(event: KeyboardEvent) {
  if (event.key !== "Tab" || !dialog.value?.open) return;
  const elements = Array.from(
    dialog.value.querySelectorAll<HTMLElement>(
      'a[href],button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getClientRects().length > 0);
  const first = elements[0];
  const last = elements.at(-1);
  if (!first || !last) {
    event.preventDefault();
    dialog.value.focus();
    return;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
function sync(open: boolean) {
  if (!dialog.value) return;
  if (open && !dialog.value.open) {
    previousFocus = document.activeElement as HTMLElement | null;
    dialog.value.showModal();
    document.body.style.overflow = "hidden";
    nextTick(() => {
      const target =
        dialog.value?.querySelector<HTMLElement>("[autofocus]") ??
        dialog.value?.querySelector<HTMLElement>(
          "input, select, textarea, button",
        );
      target?.focus();
    });
  } else if (!open && dialog.value.open) {
    dialog.value.close();
    document.body.style.overflow = "";
    previousFocus?.focus();
  }
}
function backdrop(event: MouseEvent) {
  if (event.target !== dialog.value) return;
  const bounds = dialog.value.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    close();
}
watch(() => props.open, sync);
onMounted(() => sync(props.open));
onBeforeUnmount(() => {
  document.body.style.overflow = "";
  if (dialog.value?.open) dialog.value.close();
  previousFocus?.focus();
});
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="modal"
      :aria-labelledby="titleId"
      :aria-describedby="description ? descriptionId : undefined"
      @cancel.prevent="close"
      @click="backdrop"
      @keydown="trapKeyboard"
      @close="open && close()"
    >
      <div class="modal-header">
        <div>
          <h2 :id="titleId">{{ title }}</h2>
          <p v-if="description" :id="descriptionId" class="muted">
            {{ description }}
          </p>
        </div>
        <button
          class="icon-button"
          type="button"
          aria-label="Закрыть окно"
          @click="close"
        >
          <AppIcon name="close" />
        </button>
      </div>
      <slot />
    </dialog>
  </Teleport>
</template>
