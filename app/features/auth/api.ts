import type { AuthSession, SessionUser } from "#shared/types/auth";
export interface RegisterInput {
  name: string;
  company: string;
  email: string;
  password: string;
}
export function createAuthApi(http: typeof $fetch) {
  return {
    session: () => http<AuthSession>("/api/auth/session", { retry: 0 }),
    login: (email: string, password: string) =>
      http<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: { email, password },
        retry: 0,
      }),
    register: (body: RegisterInput) =>
      http<{ user: SessionUser }>("/api/auth/register", {
        method: "POST",
        body,
        retry: 0,
      }),
    logout: () =>
      http<{ ok: boolean }>("/api/auth/logout", { method: "POST", retry: 0 }),
    profile: (body: { name: string; email: string }) =>
      http<{ user: SessionUser }>("/api/auth/profile", {
        method: "PATCH",
        body,
        retry: 0,
      }),
  };
}
