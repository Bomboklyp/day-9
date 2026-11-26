import { test, expect, login, screenshot } from "./fixtures";

test("после рефакторинга Undo доступен вне заявок, а уведомление комментария закрывается отдельно", async ({
  page,
  database,
}) => {
  await login(page);
  await page
    .getByRole("link", { name: "Не работает доступ к CRM", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Не работает доступ к CRM",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel("Приоритет", { exact: true }).selectOption("urgent");
  await expect(
    page.getByRole("button", { name: "Отменить изменение", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Обзор", exact: true }).click();
  await expect(
    page.getByText("Изменение заявки #1042 сохранено", { exact: true }),
  ).toBeVisible();
  await screenshot(page, "7-undo-dashboard-1280");
  await page
    .getByRole("button", { name: "Отменить изменение", exact: true })
    .click();
  await expect(
    page.getByText("Изменение заявки #1042 сохранено", { exact: true }),
  ).toHaveCount(0);
  expect(
    (
      await database.query<{ priority: string }>(
        "SELECT priority FROM requests WHERE id=1042",
      )
    ).rows[0]!.priority,
  ).toBe("high");
  await page.getByRole("link", { name: "Заявки", exact: true }).click();
  await page
    .getByRole("link", { name: "Не работает доступ к CRM", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Не работает доступ к CRM",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByLabel("Ваш комментарий", { exact: true })
    .fill("Проверка разделения доменов");
  await page
    .getByRole("button", { name: "Отправить комментарий", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Закрыть уведомление", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Закрыть уведомление", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Закрыть уведомление", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Проверка разделения доменов", { exact: true }),
  ).toBeVisible();
});
