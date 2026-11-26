import { createError, defineEventHandler, getRouterParam } from "h3";
import { articles } from "../../../data/articles";
import type { PublicArticle } from "../../../../shared/types/content";

export default defineEventHandler((event): { data: PublicArticle } => {
  const article = articles.find(
    (item) => item.slug === getRouterParam(event, "slug"),
  );
  if (!article)
    throw createError({ statusCode: 404, statusMessage: "Article not found" });
  return { data: article };
});
