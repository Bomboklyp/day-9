import type { MaybeRefOrGetter } from "vue";
export function useDebounce<T>(source: MaybeRefOrGetter<T>, delay = 350) {
  const value = ref(toValue(source)) as Ref<T>;
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    () => toValue(source),
    (next) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        value.value = next;
      }, delay);
    },
  );
  onScopeDispose(() => clearTimeout(timer));
  return readonly(value);
}
