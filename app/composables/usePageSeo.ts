export function usePageSeo(
  title: string,
  description: string,
  path: string,
  type: "website" | "article" = "website",
) {
  const origin = useRuntimeConfig().public.siteUrl;
  const canonical = new URL(path, origin).href;
  useSeoMeta({
    title,
    description,
    ogTitle: title,
    ogDescription: description,
    ogType: type,
    ogUrl: canonical,
    ogImage: new URL("/images/og-workflow.png", origin).href,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: "WorkFlow — управление сервисными заявками",
    ogLocale: "ru_RU",
    ogSiteName: "WorkFlow",
    twitterCard: "summary_large_image",
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: new URL("/images/og-workflow.png", origin).href,
  });
  useHead({ link: [{ rel: "canonical", href: canonical }] });
}
