import { test, expect, login, screenshot, gate } from "./fixtures";

test("REG-06 и HTTP 500: валидация, отправка, сохранение формы и повтор по макету", async ({
  page,
  database,
}) => {
  await login(page, "client");
  await page.goto("/requests/new");
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Создать заявку", exact: true })
    .click();
  await expect(
    dialog.getByText("Укажите название заявки.", { exact: true }),
  ).toBeVisible();
  await expect(
    dialog.getByText("Опишите проблему.", { exact: true }),
  ).toBeVisible();
  await screenshot(page, "5.03-validation-1280");
  await dialog
    .getByLabel("Название", { exact: true })
    .fill("Не работает доступ к CRM");
  await dialog
    .getByLabel("Описание", { exact: true })
    .fill(
      "После обновления не удаётся войти в CRM. При попытке входа появляется сообщение «Доступ запрещён». Проблема затрагивает отдел продаж.",
    );
  await dialog.getByLabel("Приоритет", { exact: true }).selectOption("high");
  const started = gate(),
    release = gate();
  await page.route("**/api/requests", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    started.release();
    await release.promise;
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ statusCode: 500 }),
    });
  });
  await dialog
    .getByRole("button", { name: "Создать заявку", exact: true })
    .click();
  await started.promise;
  await expect(
    dialog.getByRole("button", { name: "Создаём…", exact: true }),
  ).toBeDisabled();
  await screenshot(page, "5.01-submitting-1280");
  release.release();
  await expect(
    dialog.getByText(
      "Не удалось сохранить изменения. Данные не потеряны. Повторите попытку.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(dialog.getByLabel("Название", { exact: true })).toHaveValue(
    "Не работает доступ к CRM",
  );
  await screenshot(page, "5.02-error-retry-1280");
  for (const [width, height] of [
    [360, 813],
    [768, 1024],
  ] as const) {
    await page.setViewportSize({ width, height });
    await screenshot(page, `5.02-error-retry-${width}`);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.unroute("**/api/requests");
  await dialog.getByRole("button", { name: "Повторить", exact: true }).click();
  await page.waitForURL(/\/requests\/\d+$/);
  expect(
    (
      await database.query<{ count: number }>(
        "SELECT count(*)::int AS count FROM requests WHERE id>1043",
      )
    ).rows[0]!.count,
  ).toBe(1);
});
