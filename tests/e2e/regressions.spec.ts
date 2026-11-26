import { test, expect, login, screenshot, gate } from "./fixtures";
import { ApiClient } from "../integration/http";

test("REG-01: повтор после потерянного ответа сохраняет один комментарий", async ({
  page,
  database,
}) => {
  await login(page);
  await page.goto("/requests/1042");
  await page.route("**/api/comments", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    const saved = await route.fetch();
    expect(saved.status()).toBe(201);
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ statusCode: 500 }),
    });
  });
  const text = "Ответ потерялся, запись сохранилась";
  await page.getByLabel("Ваш комментарий", { exact: true }).fill(text);
  await page
    .getByRole("button", { name: "Отправить комментарий", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Повторить отправку", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Ваш комментарий", { exact: true })).toHaveValue(
    text,
  );
  await page.reload();
  await expect(page.getByLabel("Ваш комментарий", { exact: true })).toHaveValue(
    text,
  );
  await page.unroute("**/api/comments");
  await page
    .getByRole("button", { name: "Отправить комментарий", exact: true })
    .click();
  await expect(page.getByLabel("Ваш комментарий", { exact: true })).toHaveValue(
    "",
  );
  expect(
    (
      await database.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM comments WHERE request_id=1042 AND text=$1",
        [text],
      )
    ).rows[0]!.count,
  ).toBe(1);
});

test("REG-02: более медленный ответ CRM не заменяет результат VPN", async ({
  page,
}) => {
  await login(page);
  const started = gate(),
    release = gate(),
    completed = gate();
  await page.route("**/api/requests?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("q") !== "CRM")
      return route.continue();
    const response = await route.fetch();
    started.release();
    await release.promise;
    try {
      await route.fulfill({ response });
    } catch {
    } finally {
      completed.release();
    }
  });
  const search = page.getByRole("searchbox");
  await search.fill("CRM");
  await started.promise;
  await search.fill("VPN");
  await expect(
    page.getByRole("link", { name: "Настроить VPN", exact: true }),
  ).toBeVisible();
  release.release();
  await completed.promise;
  await expect(
    page.getByRole("link", { name: "Настроить VPN", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Не работает доступ к CRM", exact: true }),
  ).toHaveCount(0);
  await screenshot(page, "5-search-latest-1280");
});

test("REG-03: поздняя проверка сессии не открывает приватный маршрут после logout", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Мой профиль", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Выйти из аккаунта", exact: true }),
  ).toBeVisible();
  const started = gate(),
    release = gate(),
    completed = gate();
  await page.route("**/api/auth/session", async (route) => {
    const response = await route.fetch();
    started.release();
    await release.promise;
    try {
      await route.fulfill({ response });
    } catch {
    } finally {
      completed.release();
    }
  });
  await page
    .getByRole("link", { name: "Заявки", exact: true })
    .click({ noWaitAfter: true });
  await started.promise;
  await page
    .getByRole("button", { name: "Выйти из аккаунта", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login/);
  release.release();
  await completed.promise;
  await page.unroute("**/api/auth/session");
  await page.goto("/requests");
  await expect(page).toHaveURL(/\/login/);
  expect((await page.request.get("/api/requests")).status()).toBe(401);
});

test("REG-04: refresh восстанавливает URL, настройки, заявку и черновики", async ({
  page,
  database,
}) => {
  await login(page);
  await page.goto("/profile");
  await page
    .getByLabel("Плотность списка", { exact: true })
    .selectOption("compact");
  await page.goto("/requests?per_page=1&page=2&sort=oldest");
  await page.reload();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole("button", { name: "Страница 2", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    page.getByText("Плотность списка: компактная", { exact: true }),
  ).toBeVisible();
  await page.goto("/requests?q=CRM&status=new&priority=high&sort=oldest");
  await page.reload();
  await expect(page.getByRole("searchbox")).toHaveValue("CRM");
  await expect(page.getByLabel("Статус", { exact: true })).toHaveValue("new");
  await expect(page.getByLabel("Приоритет", { exact: true })).toHaveValue(
    "high",
  );
  await page.goto("/requests/1042");
  await page
    .getByLabel("Ваш комментарий", { exact: true })
    .fill("Черновик после refresh");
  await page.reload();
  await expect(page.getByLabel("Ваш комментарий", { exact: true })).toHaveValue(
    "Черновик после refresh",
  );
  expect(
    (
      await database.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM comments WHERE text='Черновик после refresh'",
      )
    ).rows[0]!.count,
  ).toBe(0);
  await page.goto("/requests/new");
  await page
    .getByRole("dialog")
    .getByLabel("Название", { exact: true })
    .fill("Черновик новой заявки");
  await page.reload();
  await expect(
    page.getByRole("dialog").getByLabel("Название", { exact: true }),
  ).toHaveValue("Черновик новой заявки");
});

test("HTTP 401: истёкшая сессия очищает приватный экран и переводит на вход", async ({
  page,
  database,
}) => {
  await login(page);
  const sessionReady = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/auth/session" &&
      response.status() === 200,
  );
  await page
    .getByRole("link", { name: "Не работает доступ к CRM", exact: true })
    .click();
  await sessionReady;
  await page.waitForURL(/\/requests\/1042$/);
  await expect(
    page.getByRole("heading", {
      name: "Не работает доступ к CRM",
      exact: true,
    }),
  ).toBeVisible();
  await database.query(
    "UPDATE sessions SET expires_at=now()-interval '1 second' WHERE user_id='user-1'",
  );
  await page.getByLabel("Приоритет", { exact: true }).selectOption("low");
  await expect(page).toHaveURL(/\/login\?expired=1/);
  await expect(
    page.getByText("Сессия истекла. Войдите снова, чтобы продолжить работу.", {
      exact: true,
    }),
  ).toBeVisible();
  expect((await page.request.get("/api/requests/1042")).status()).toBe(401);
  await screenshot(page, "5-session-expired-1280");
});

test("HTTP 409: конфликт возвращает прежний приоритет и позволяет загрузить актуальные данные", async ({
  page,
  baseURL,
}) => {
  await login(page);
  await page.goto("/requests/1042");
  await expect(page.getByLabel("Приоритет", { exact: true })).toHaveValue(
    "high",
  );
  const other = new ApiClient(baseURL!);
  await other.login("operator");
  await other.patch(1042, { priority: "urgent" });
  await page.getByLabel("Приоритет", { exact: true }).selectOption("low");
  await expect(
    page.getByText(/Предыдущее значение восстановлено/),
  ).toBeVisible();
  await expect(page.getByLabel("Приоритет", { exact: true })).toHaveValue(
    "high",
  );
  await screenshot(page, "5-conflict-409-1280");
  await page
    .getByRole("button", { name: "Обновить заявку", exact: true })
    .click();
  await expect(page.getByLabel("Приоритет", { exact: true })).toHaveValue(
    "urgent",
  );
});

test("REG-05: список после изменения соответствует фильтру и остаётся таким после refresh", async ({
  page,
}) => {
  await login(page);
  await page.goto("/requests?priority=high");
  await page
    .getByRole("link", { name: "Не работает доступ к CRM", exact: true })
    .click();
  await page.waitForURL(/\/requests\/1042$/);
  await expect(
    page.getByRole("heading", {
      name: "Не работает доступ к CRM",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Приоритет", { exact: true }).selectOption("low");
  await expect(
    page.getByRole("button", { name: "Отменить изменение", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("link", { name: "Настроить VPN", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Не работает доступ к CRM", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Не работает доступ к CRM", exact: true }),
  ).toHaveCount(0);
});
