import { test as base, expect, type Page } from "@playwright/test";
import pg from "pg";
import { initializeDatabase, demoPassword } from "../../tools/init-db";
import { mkdir } from "node:fs/promises";

export const test = base.extend<{ database: pg.Pool }>({
  database: [
    async ({ baseURL }, use) => {
      if (!baseURL) throw new Error("E2E baseURL is required");
      const schema = process.env.WORKFLOW_DB_SCHEMA;
      if (!schema || !/^workflow_test_day9_[0-9]+$/.test(schema))
        throw new Error(
          "Run E2E through npm run test:e2e to isolate the database",
        );
      const database = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        options: `-c search_path=${schema}`,
      });
      try {
        await database.query(
          "TRUNCATE login_attempts,sla_policies,sessions,request_events,comments,requests,users,customers,categories CASCADE",
        );
        await initializeDatabase(database);
        await use(database);
      } finally {
        await database.end();
      }
    },
    { auto: true },
  ],
});
export { expect };
export async function login(page: Page, account = "operator") {
  await page.goto("/login");
  await page
    .getByLabel("Электронная почта", { exact: true })
    .fill(`${account}@workflow.local`);
  await page.getByLabel("Пароль", { exact: true }).fill(demoPassword);
  await page.getByRole("button", { name: "Войти", exact: true }).click();
  await page.waitForURL("**/requests");
  await expect(page.getByRole("searchbox")).toBeVisible();
}
export async function screenshot(page: Page, name: string, fullPage = false) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo(0, 0));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  await mkdir(".verification/day9/screens", { recursive: true });
  await page.screenshot({
    path: `.verification/day9/screens/${name}.png`,
    fullPage,
  });
}
export function gate() {
  let release: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}
