export default defineNuxtRouteMiddleware(async (to) => {
  if (
    ["/", "/login", "/register", "/403", "/faq", "/help", "/articles"].includes(
      to.path,
    ) ||
    to.path.startsWith("/articles/") ||
    !to.matched.length
  )
    return;
  const { useAuth: getAuth } = await import("~/composables/useAuth");
  const auth = getAuth();
  if (auth.loggingOut.value) return navigateTo("/login", { replace: true });
  if (!auth.checked.value || import.meta.client) await auth.refreshSession();
  if (!auth.user.value)
    return navigateTo({
      path: "/login",
      query: { expired: "1", redirect: to.fullPath },
    });
  if (to.path.startsWith("/admin") && auth.user.value.role !== "Admin")
    return navigateTo("/403");
  if (to.path === "/requests/new" && auth.user.value.role === "Agent")
    return navigateTo("/403");
});
