import type { SessionUser } from "../../shared/types/auth";
declare module "h3" {
  interface H3EventContext {
    user: SessionUser | null;
  }
}
export {};
