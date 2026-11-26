import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const chrome =
  process.env.CHROME_EXECUTABLE ??
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 30000,
  expect: { timeout: 10000 },
  outputDir: ".verification/day9/playwright",
  reporter: [
    ["list"],
    ["json", { outputFile: ".verification/day9/e2e-result.json" }],
  ],
  use: {
    baseURL: process.env.WORKFLOW_BASE_URL ?? "http://127.0.0.1:3109",
    headless: true,
    viewport: { width: 1280, height: 900 },
    launchOptions: existsSync(chrome) ? { executablePath: chrome } : {},
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});
