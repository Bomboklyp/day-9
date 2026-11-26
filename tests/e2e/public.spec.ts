import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { ApiClient } from "../integration/http";

const articlePath = "/articles/kak-sozdat-zayavku";
const paths = [
  "/",
  "/faq",
  "/help",
  "/articles",
  articlePath,
  "/articles/kak-otslezhivat-status",
  "/articles/kak-dobavit-kommentariy",
  "/articles/kak-podtverdit-reshenie",
];

test("первый HTML содержит содержимое, уникальные metadata и публичную карту сайта", async ({
  request,
}) => {
  const titles = new Set<string>(),
    descriptions = new Set<string>();
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toMatch(/<h1[^>]*>[^<]+/);
    const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
    expect(title).toBeTruthy();
    titles.add(title!);
    const description = /<meta name="description" content="([^"]+)"/.exec(
      html,
    )?.[1];
    expect(description).toBeTruthy();
    descriptions.add(description!);
    expect(html).toContain(
      `rel="canonical" href="http://127.0.0.1:3008${path}"`,
    );
    expect(html).toContain('property="og:title"');
    expect(html).toContain('property="og:description"');
    expect(html).toContain('property="og:image"');
    if (path === articlePath) {
      expect(html).toContain("Для создания заявки войдите в аккаунт клиента.");
      expect(html).toContain("5 октября 2026");
    }
  }
  expect(titles.size).toBe(paths.length);
  expect(descriptions.size).toBe(paths.length);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((item) => item[1]);
  expect(urls).toHaveLength(paths.length);
  for (const path of paths)
    expect(urls).toContain(`http://127.0.0.1:3008${path}`);
  expect(xml).not.toContain("/requests");
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Sitemap: http://127.0.0.1:3008/sitemap.xml");
  expect(robots).toContain("Disallow: /requests");
});

test("публичное содержимое доступно без JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    for (const path of ["/faq", "/help", articlePath]) {
      const response = await page.goto(
        `${test.info().project.use.baseURL}${path}`,
      );
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
    await expect(
      page.getByText("Нажмите «Создать заявку».", { exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("публичный поиск работает, восстанавливается по URL и отдаёт правильный первый HTML", async ({
  page,
  request,
}) => {
  const response = await request.get("/faq?q=SLA");
  const html = await response.text();
  expect(html).toContain("Что такое SLA?");
  expect(html).not.toContain("Как создать заявку?");
  await page.goto("/faq?q=SLA");
  await expect(page.getByRole("searchbox")).toHaveValue("SLA");
  await expect(
    page.getByRole("heading", { name: "Что такое SLA?", exact: true }),
  ).toBeVisible();
  await page.getByRole("searchbox").fill("Ожидание");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("q"))
    .toBe("Ожидание");
  await expect(
    page.getByRole("heading", {
      name: "Что означает «Ожидание»?",
      exact: true,
    }),
  ).toBeVisible();
  await page.goto("/articles?category=start");
  await expect(
    page.getByRole("heading", {
      name: "Как создать первую заявку",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Как добавить комментарий",
      exact: true,
    }),
  ).toHaveCount(0);
});

for (const timezoneId of ["America/Los_Angeles", "Asia/Tokyo"]) {
  test(`нет hydration mismatch с сохранённой оценкой и настройками: ${timezoneId}`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({
      timezoneId,
      viewport: { width: 360, height: 813 },
    });
    await context.addCookies([
      {
        name: "workflow-article-vote-kak-sozdat-zayavku",
        value: encodeURIComponent(JSON.stringify("yes")),
        url: baseURL!,
      },
    ]);
    await context.addInitScript(() =>
      localStorage.setItem(
        "workflow-day6-preferences",
        JSON.stringify({ density: "compact", notifications: false }),
      ),
    );
    const page = await context.newPage(),
      warnings: string[] = [];
    page.on("console", (message) => {
      if (/hydrat|mismatch/i.test(message.text()))
        warnings.push(message.text());
    });
    page.on("pageerror", (error) => warnings.push(error.message));
    try {
      await page.goto(baseURL + articlePath);
      await expect(
        page.getByText("Начало работы · Обновлено 5 октября 2026", {
          exact: true,
        }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Да", exact: true })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("button", { name: "Да", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: "Нет", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Нет", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await page.reload();
      await page
        .getByRole("button", { name: "Нет", exact: true })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole("button", { name: "Нет", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(warnings).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("публичные и приватные отсутствующие сущности возвращают HTTP 404", async ({
  request,
  baseURL,
}) => {
  for (const path of [
    "/articles/missing-article",
    "/missing-page",
    "/api/public/articles/missing-article",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
  }
  expect((await request.get("/api/requests")).status()).toBe(401);
  const operator = new ApiClient(baseURL!);
  await operator.login("operator");
  const missing = await request.get("/requests/999999", {
    headers: { cookie: operator.cookie },
  });
  expect(missing.status()).toBe(404);
  const page = await request.get("/articles/missing-article");
  expect(await page.text()).toContain("Статья не найдена");
});

test("публичные страницы и меню соответствуют трём ширинам", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (/hydrat|mismatch/i.test(message.text())) errors.push(message.text());
  });
  await mkdir(".verification/day9/screens", { recursive: true });
  for (const [width, height] of [
    [1280, 900],
    [768, 1024],
    [360, 813],
  ] as const) {
    await page.setViewportSize({ width, height });
    for (const [name, path] of [
      ["faq", "/faq"],
      ["help", "/help"],
      ["articles", "/articles"],
      ["article", articlePath],
      ["404", "/articles/missing-article"],
      ["landing", "/"],
    ]) {
      await page.goto(path!);
      await page.getByRole("heading", { level: 1 }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `.verification/day9/screens/9-${name}-${width}.png`,
        fullPage: true,
      });
    }
    if (width === 360) {
      await page.goto("/faq");
      await page
        .getByRole("button", { name: "Открыть меню", exact: true })
        .click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByRole("link", { name: "Помощь", exact: true }).click();
      await expect(page).toHaveURL(/\/help$/);
    }
  }
  expect(errors).toEqual([]);
});
