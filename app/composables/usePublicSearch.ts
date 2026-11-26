export function usePublicSearch() {
  const route = useRoute(),
    router = useRouter();
  const read = () => (typeof route.query.q === "string" ? route.query.q : "");
  const search = ref(read());
  const delayed = useDebounce(search, 350);
  watch(
    () => route.query.q,
    () => {
      search.value = read();
    },
  );
  watch(delayed, (value) => {
    if (value !== search.value || value === read()) return;
    void router.replace({ query: { ...route.query, q: value || undefined } });
  });
  return {
    search,
    category: computed(() =>
      typeof route.query.category === "string" ? route.query.category : "",
    ),
  };
}
