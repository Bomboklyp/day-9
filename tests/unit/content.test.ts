import { expect, test } from "vitest";
import { formatContentDate } from "../../shared/utils/content-date";
import { articles } from "../../server/data/articles";

test("дата публикации не зависит от часового пояса и не трактуется как время браузера", () => {
  expect(formatContentDate("2026-10-05")).toBe("5 октября 2026");
  expect(formatContentDate("2026-01-01")).toBe("1 января 2026");
  expect(formatContentDate("wrong")).toBe("Дата не указана");
});
test("публичные статьи имеют уникальные адреса и metadata", () => {
  expect(new Set(articles.map((article) => article.slug)).size).toBe(
    articles.length,
  );
  expect(new Set(articles.map((article) => article.description)).size).toBe(
    articles.length,
  );
  for (const article of articles) {
    expect(article.sections.length).toBeGreaterThan(0);
    expect(article.title).toBeTruthy();
    expect(article.description.length).toBeGreaterThan(50);
  }
});
