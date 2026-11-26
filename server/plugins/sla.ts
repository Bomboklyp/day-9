import { collectSlaNotifications } from "../services/notifications";
export default defineNitroPlugin((app) => {
  if (
    process.env.WORKFLOW_DISABLE_SLA_TIMER === "1" ||
    (!process.env.DATABASE_URL && !process.env.PGHOST)
  ) return;
  let running = false;
  const timer = setInterval(async () => {
    if (running) return;
    running = true;
    try {
      await collectSlaNotifications();
    } catch (error: unknown) {
      console.error(
        "SLA notification check failed",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      running = false;
    }
  }, 30000);
  timer.unref();
  app.hooks.hook("close", () => {
    clearInterval(timer);
  });
});
