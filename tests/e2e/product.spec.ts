import { readFile } from "node:fs/promises";
import { test, expect, login, screenshot, gate } from "./fixtures";

test("SLA: ожидание, ошибка, повтор и сохранение после refresh", async ({
  page,
}) => {
  await login(page, "admin");
  await page.getByRole("link", { name: "SLA", exact: true }).click();
  const card = page.getByRole("form", {
    name: "SLA: Критический",
    exact: true,
  });
  await card
    .getByLabel("Время реакции: Критический", { exact: true })
    .fill("20 минут");
  await page.route("**/api/admin/sla/urgent", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: '{"statusCode":500}',
    }),
  );
  await card.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(card.getByRole("alert")).toContainText(
    "Введённые значения сохранены",
  );
  await expect(
    card.getByLabel("Время реакции: Критический", { exact: true }),
  ).toHaveValue("20 минут");
  await screenshot(page, "8.04-sla-error-1280", true);
  await page.unroute("**/api/admin/sla/urgent");
  const started = gate(),
    release = gate();
  await page.route("**/api/admin/sla/urgent", async (route) => {
    started.release();
    await release.promise;
    await route.continue();
  });
  await card
    .getByRole("button", { name: "Повторить сохранение", exact: true })
    .click();
  await started.promise;
  await expect(
    card.getByRole("button", { name: "Сохраняем…", exact: true }),
  ).toBeDisabled();
  await screenshot(page, "8.02-sla-saving-1280", true);
  release.release();
  await expect(
    card.getByText("Настройки SLA сохранены.", { exact: true }),
  ).toBeVisible();
  await screenshot(page, "8.03-sla-saved-1280", true);
  await page.unroute("**/api/admin/sla/urgent");
  await page.reload();
  await expect(
    card.getByLabel("Время реакции: Критический", { exact: true }),
  ).toHaveValue("20 минут");
});

test("эскалация требует причину и создаёт уведомление с переходом к заявке", async ({
  page,
  database,
}) => {
  await login(page);
  await page
    .getByRole("link", { name: "Не работает доступ к CRM", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Назначить исполнителя", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Исполнитель", { exact: true })
    .selectOption("user-3");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Назначить", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Эскалировать", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Эскалировать", exact: true })
    .click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Укажите причину эскалации.",
  );
  await screenshot(page, "8.07-escalation-required-1280");
  await dialog
    .getByLabel("Причина эскалации", { exact: true })
    .fill("Требуется помощь старшего специалиста");
  await screenshot(page, "8.06-escalation-1280");
  await dialog
    .getByRole("button", { name: "Эскалировать", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Эскалирована", { exact: true })).toBeVisible();
  expect(
    (
      await database.query<{ escalation_reason: string }>(
        "SELECT escalation_reason FROM requests WHERE id=1042",
      )
    ).rows[0]!.escalation_reason,
  ).toBe("Требуется помощь старшего специалиста");
  await page.getByRole("link", { name: "Уведомления", exact: true }).click();
  await expect(
    page
      .locator(".notification-card")
      .filter({ hasText: "#1042" })
      .filter({ hasText: "Заявка эскалирована" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Отметить всё прочитанным", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Отметить всё прочитанным", exact: true }),
  ).toBeDisabled();
});

test("вложения: размер, тип, количество, повтор после 500 и настоящее скачивание", async ({
  page,
}) => {
  await login(page);
  await page
    .getByRole("link", { name: "Не работает доступ к CRM", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Добавить файл", exact: true })
    .click();
  const dialog = page.getByRole("dialog"),
    picker = dialog.getByLabel("Файл", { exact: true });
  await picker.setInputFiles({
    name: "report.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.alloc(12 * 1024 * 1024),
  });
  await expect(dialog.getByRole("alert")).toContainText("превышает 10 МБ");
  await screenshot(page, "8.10-file-size-1280");
  await picker.setInputFiles({
    name: "archive.exe",
    mimeType: "application/octet-stream",
    buffer: Buffer.from("test"),
  });
  await expect(dialog.getByRole("alert")).toContainText(
    "формат не поддерживается",
  );
  await screenshot(page, "8.11-file-type-1280");
  const png = await readFile("public/images/octagon.png");
  await picker.setInputFiles(
    Array.from({ length: 6 }, (_, i) => ({
      name: `file-${i}.png`,
      mimeType: "image/png",
      buffer: png,
    })),
  );
  await expect(dialog.getByRole("alert")).toContainText("до 5 файлов");
  await screenshot(page, "8.12-file-count-1280");
  await picker.setInputFiles({
    name: "error-login.png",
    mimeType: "image/png",
    buffer: png,
  });
  await screenshot(page, "8.09-file-ready-1280");
  await page.route("**/api/requests/1042/attachments", async (route) => {
    if (route.request().method() === "POST")
      return route.fulfill({
        status: 500,
        contentType: "application/json",
        body: '{"statusCode":500}',
      });
    await route.continue();
  });
  await dialog.getByRole("button", { name: "Загрузить", exact: true }).click();
  await expect(
    dialog.getByRole("button", { name: "Повторить загрузку", exact: true }),
  ).toBeVisible();
  await page.unroute("**/api/requests/1042/attachments");
  await dialog
    .getByRole("button", { name: "Повторить загрузку", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Вложения · 1", exact: true }),
  ).toBeVisible();
  await screenshot(page, "8.08-attachment-1280", true);
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: /error-login\.png/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("error-login.png");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Вложения · 1", exact: true }),
  ).toBeVisible();
});

test("новые страницы работают на 360, 768 и 1280 px и доступны по роли", async ({
  page,
}) => {
  await login(page, "admin");
  for (const width of [1280, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [path, name] of [
      ["/admin/sla", "sla"],
      ["/admin/analytics", "analytics"],
    ]) {
      await page.goto(path!);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (name === "sla") await expect(page.getByRole("form")).toHaveCount(4);
      else
        await expect(
          page.getByRole("heading", {
            name: "Загрузка исполнителей",
            exact: true,
          }),
        ).toBeVisible();
      await screenshot(page, `8-${name}-${width}`, true);
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("link", { name: "Мой профиль", exact: true }).click();
  await page
    .getByRole("button", { name: "Выйти из аккаунта", exact: true })
    .click();
  await expect(page).toHaveURL(/\/login/);
  await login(page);
  for (const width of [1280, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/notifications");
    await expect(page.locator(".notification-card").first()).toBeVisible();
    await screenshot(page, `8-notifications-${width}`, true);
  }
  await page.goto("/admin/sla");
  await expect(page).toHaveURL(/\/403/);
});
