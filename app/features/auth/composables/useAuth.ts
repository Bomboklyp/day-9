import { createAuthApi } from "../api";
import { apiErrorStatus } from "~/lib/api-errors";
import type { SessionUser } from "../../../../shared/types/auth";

export function useAuth() {
  const app = useNuxtApp();
  const user = useState<SessionUser | null>("auth-user", () => null);
  const checked = useState("auth-checked", () => false);
  const version = useState("auth-version", () => 0);
  const loggingOut = useState("auth-logging-out", () => false);
  const readApi = createAuthApi(useRequestFetch());
  const api = createAuthApi($fetch);
  async function refreshSession() {
    const started = version.value;
    const session = await readApi.session();
    if (started === version.value && !loggingOut.value) {
      if (!session.user && user.value) accept(session);
      else {
        user.value = session.user;
        checked.value = true;
      }
    }
  }
  function accept(session: { user: SessionUser | null }) {
    version.value++;
    app.runWithContext(() => clearNuxtData());
    user.value = session.user;
    checked.value = true;
  }
  async function expire() {
    accept({ user: null });
    await app.runWithContext(() =>
      navigateTo(
        { path: "/login", query: { expired: "1" } },
        { replace: true, external: true },
      ),
    );
  }
  async function login(email: string, password: string) {
    const session = await api.login(email, password);
    accept(session);
  }
  async function register(input: {
    name: string;
    company: string;
    email: string;
    password: string;
  }) {
    const session = await api.register(input);
    accept(session);
  }
  async function logout() {
    if (loggingOut.value) return;
    loggingOut.value = true;
    version.value++;
    try {
      await api.logout();
      accept({ user: null });
      if (import.meta.client)
        try {
          for (const key of Object.keys(sessionStorage))
            if (key.startsWith("workflow-day5-draft:"))
              sessionStorage.removeItem(key);
        } catch {}
      await app.runWithContext(() =>
        navigateTo("/login", { replace: true, external: true }),
      );
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "statusCode" in error &&
        error.statusCode === 401
      )
        await expire();
      else throw error;
    } finally {
      loggingOut.value = false;
    }
  }
  async function updateUser(input: { name: string; email: string }) {
    const started = version.value;
    try {
      const session = await api.profile(input);
      if (version.value === started) user.value = session.user;
    } catch (error: unknown) {
      if (apiErrorStatus(error) === 401 && version.value === started)
        await expire();
      throw error;
    }
  }

  return {
    user,
    checked,
    version,
    loggingOut,
    expire,
    refreshSession,
    login,
    register,
    logout,
    updateUser,
  };
}
