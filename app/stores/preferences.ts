import { defineStore } from "pinia";
const key = "workflow-day6-preferences";
export const usePreferencesStore = defineStore("preferences", {
  state: () => ({
    density: "comfortable" as "comfortable" | "compact",
    notifications: true,
    ready: false,
    persistenceAvailable: true,
  }),
  actions: {
    hydrate() {
      if (typeof window === "undefined" || this.ready) return;
      try {
        const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
        if (value && typeof value === "object") {
          if ("density" in value && value.density === "compact")
            this.density = "compact";
          if (
            "notifications" in value &&
            typeof value.notifications === "boolean"
          )
            this.notifications = value.notifications;
        }
      } catch {
        this.persistenceAvailable = false;
      }
      this.ready = true;
    },
    save(density: "comfortable" | "compact", notifications: boolean) {
      this.density = density;
      this.notifications = notifications;
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(key, JSON.stringify({ density, notifications }));
        this.persistenceAvailable = true;
      } catch {
        this.persistenceAvailable = false;
      }
    },
  },
});
