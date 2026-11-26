import { test, expect, login, screenshot } from "./fixtures";

test("login → create request → assign → change status → comment → logout", async ({
  page,
  database,
}) => {
  await login(page);
  await page.getByRole("link", { name: "Создать заявку", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Название", { exact: true })
    .fill("Проверка полного сценария");
  await dialog
    .getByLabel("Описание", { exact: true })
    .fill("Проверяем создание и дальнейшую обработку заявки.");
  await dialog
    .getByRole("button", { name: "Создать заявку", exact: true })
    .click();
  await page.waitForURL(/\/requests\/\d+$/);
  const id = Number(page.url().split("/").at(-1));
  await page
    .getByRole("button", { name: "Назначить исполнителя", exact: true })
    .click();
  await dialog
    .getByLabel("Исполнитель", { exact: true })
    .selectOption("user-3");
  await dialog.getByRole("button", { name: "Назначить", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "Изменить статус", exact: true })
    .click();
  await dialog
    .getByLabel("Новый статус", { exact: true })
    .selectOption("in_progress");
  await dialog.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByLabel("Ваш комментарий", { exact: true })
    .fill("Полный сценарий выполнен");
  await page
    .getByRole("button", { name: "Отправить комментарий", exact: true })
    .click();
  await expect(
    page.getByText("Полный сценарий выполнен", { exact: true }),
  ).toBeVisible();
  const row = (
    await database.query<{
      status: string;
      assignee_id: string;
      count: number;
    }>(
      "SELECT r.status,r.assignee_id,(SELECT count(*)::int FROM comments c WHERE c.request_id=r.id) AS count FROM requests r WHERE id=$1",
      [id],
    )
  ).rows[0]!;
  expect(row).toEqual({
    status: "in_progress",
    assignee_id: "user-3",
    count: 1,
  });
  await screenshot(page, "5-e2e-request-1280");
  await page.goto("/profile");
  await page
    .getByRole("button", { name: "Выйти из аккаунта", exact: true })
    .click();
  await page.waitForURL("**/login");
  expect((await page.request.get("/api/requests")).status()).toBe(401);
  await page.goBack();
  await expect(page).toHaveURL(/\/login/);
  await page.goto(`/requests/${id}`);
  await expect(page).toHaveURL(/\/login/);
  await expect(
    page.getByText("Полный сценарий выполнен", { exact: true }),
  ).toHaveCount(0);
});
