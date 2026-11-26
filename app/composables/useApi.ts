import { useAuth } from "~/features/auth/composables/useAuth";
export function useApi() {
  if (import.meta.server) return useRequestFetch();
  const auth = useAuth();
  const versions = new WeakMap<object, number>();
  return $fetch.create({
    onRequest({ options }) {
      versions.set(options, auth.version.value);
    },
    async onResponseError({ response, options }) {
      if (
        response.status === 401 &&
        auth.version.value === versions.get(options)
      )
        await auth.expire();
    },
  });
}
