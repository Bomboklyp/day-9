import AxeBuilder from "@axe-core/playwright";
import { test, expect, login, screenshot } from "./fixtures";
import type { Page } from "@playwright/test";

async function accessible(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
}

test("release: публичные страницы и форма входа доступны с клавиатуры", async ({ page }) => {
  for (const path of ["/", "/faq", "/help", "/articles/kak-sozdat-zayavku", "/login"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await accessible(page);
  }
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Перейти к содержимому" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.getByLabel("Электронная почта", { exact: true }).focus();
  await page.keyboard.type("operator@workflow.local");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Пароль", { exact: true })).toBeFocused();
  await page.keyboard.type("Practice123!");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Войти", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/requests$/);
});

test("release: фильтры, меню и модальное окно удерживают и возвращают focus", async ({ page }) => {
  await login(page);
  await accessible(page);
  const nav = page.getByRole("navigation", { name: "Основная навигация", exact: true });
  await nav.getByRole("link", { name: "Обзор", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(nav.getByRole("link", { name: "Заявки", exact: true })).toBeFocused();
  await page.getByRole("combobox", { name: "Статус", exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page).toHaveURL(/status=new/);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("combobox", { name: "Приоритет", exact: true })).toBeFocused();
  const create = page.getByRole("link", { name: "Создать заявку", exact: true });
  await create.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await accessible(page);
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(create).toBeFocused();
  await page.setViewportSize({ width: 360, height: 800 });
  const menu = page.getByRole("button", { name: "Открыть меню", exact: true });
  await menu.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await accessible(page);
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await screenshot(page, "9-keyboard-mobile", true);
});

test("release: карточка, профиль и административные формы без нарушений axe", async ({ page }) => {
  await login(page, "admin");
  for (const path of ["/requests/1042", "/profile", "/admin/sla", "/admin/analytics"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
    await accessible(page);
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.getByRole("button", { name: "Открыть меню", exact: true }).click();
  await page.getByRole("dialog").getByRole("link", { name: "SLA", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/sla$/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await accessible(page);
});

test("release: четыре роли видят свой dashboard после refresh", async ({ page }) => {
  for (const [account, subtitle, staff] of [
    ["operator", "Обзор работы поддержки", true],
    ["agent", "Обзор назначенной работы", false],
    ["client", "Обзор ваших обращений", false],
    ["admin", "Обзор сервиса", true],
  ] as const) {
    await login(page, account);
    await page.goto("/dashboard");
    await page.reload();
    await expect(page.getByText(subtitle, { exact: true })).toBeVisible();
    await expect(page.getByText("Новые заявки", { exact: true })).toHaveCount(staff ? 1 : 0);
    await accessible(page);
    await screenshot(page, `9-dashboard-${account}-1280`, true);
    await page.goto("/profile");
    await page.getByRole("button", { name: "Выйти из аккаунта", exact: true }).click();
    await expect(page).toHaveURL(/\/login/);
  }
});

test("release: комментарий с HTML показывается текстом и не исполняется", async ({ page }) => {
  await login(page);
  await page.goto("/requests/1042");
  const text = '<img src=x onerror="document.body.dataset.injected=1">';
  await page.getByLabel("Ваш комментарий", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Отправить комментарий", exact: true }).click();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  expect(await page.locator("body").getAttribute("data-injected")).toBeNull();
});
