import type { ArticleSummary, PublicArticle } from "#shared/types/content";
import type { MaybeRefOrGetter } from "vue";
export function useArticles() {
  return useFetch<{ data: ArticleSummary[] }>("/api/public/articles", {
    key: "public-articles",
    retry: 0,
  });
}
export function useArticle(slug: MaybeRefOrGetter<string>) {
  return useFetch<{ data: PublicArticle }>(
    () => `/api/public/articles/${encodeURIComponent(toValue(slug))}`,
    { retry: 0 },
  );
}
