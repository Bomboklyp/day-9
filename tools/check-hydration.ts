import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, writeFile } from "node:fs/promises";

const expectMismatch = process.argv.includes("--expect-mismatch");
const base = "http://127.0.0.1:3309";
const server = spawn(process.execPath, [".output/server/index.mjs"], {
  windowsHide: true,
  env: { ...process.env, HOST: "127.0.0.1", PORT: "3309" },
  stdio: "ignore",
});
const warnings: string[] = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + "/faq")).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error("Hydration server did not start");
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.CHROME_EXECUTABLE ??
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  try {
    const context = await browser.newContext({
      timezoneId: "America/Los_Angeles",
      viewport: { width: 1280, height: 900 },
    });
    await context.addCookies([
      {
        name: "workflow-article-vote-kak-sozdat-zayavku",
        value: encodeURIComponent(JSON.stringify("yes")),
        url: base,
      },
    ]);
    const page = await context.newPage();
    page.on("console", (message) => {
      if (/hydrat|mismatch/i.test(message.text()))
        warnings.push(message.text());
    });
    page.on("pageerror", (error) => warnings.push(error.message));
    await page.goto(base + "/articles/kak-sozdat-zayavku");
    await page
      .getByRole("button", { name: "Да", exact: true })
      .scrollIntoViewIfNeeded();
    await page.getByText("Спасибо за ответ.", { exact: true }).waitFor();
    await page.waitForLoadState("networkidle");
    await context.close();
  } finally {
    await browser.close();
  }
  await mkdir("docs/performance", { recursive: true });
  await writeFile(
    `docs/performance/hydration-${expectMismatch ? "before" : "after"}.json`,
    JSON.stringify({ expectMismatch, warnings }, null, 2),
  );
  if (
    expectMismatch &&
    !warnings.some((warning) => /hydrat|mismatch/i.test(warning))
  )
    throw new Error("Mismatch was not reproduced");
  if (!expectMismatch && warnings.length)
    throw new Error("Hydration warnings remain");
  console.log(
    expectMismatch
      ? "Reproduced hydration mismatch with a saved article vote"
      : "No hydration mismatch with a saved article vote",
  );
} finally {
  if (server.exitCode === null) {
    const closed = once(server, "exit");
    server.kill();
    await closed;
  }
}
