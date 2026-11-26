import { articles } from "./server/data/articles";
export default defineNuxtConfig({
  debug: false,
  compatibilityDate: "2026-11-15",
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3008",
    },
  },
  components: [
    { path: "~/features/attachments/components", pathPrefix: false },
    { path: "~/features/sla/components", pathPrefix: false },
    { path: "~/components", pathPrefix: false },
    { path: "~/features/requests/components", pathPrefix: false },
    { path: "~/features/comments/components", pathPrefix: false },
    { path: "~/features/notifications/components", pathPrefix: false },
  ],
  devtools: { enabled: false },
  modules: ["@pinia/nuxt", "@nuxt/eslint"],
  css: [
    "@fontsource-variable/montserrat",
    "~/assets/css/main.css",
    "~/assets/css/responsive.css",
    "~/assets/css/public.css",
    "~/assets/css/product.css",
  ],
  app: {
    head: {
      htmlAttrs: { lang: "ru" },
      title: "WorkFlow — управление заявками",
      meta: [
        {
          name: "description",
          content:
            "Единое рабочее пространство для заявок, команды и понятных процессов.",
        },
      ],
    },
  },
  routeRules: {
    "/admin/**": {
      prerender: false,
      headers: {
        "X-Robots-Tag": "noindex,nofollow",
        "Cache-Control": "private,no-store",
      },
    },
    "/notifications": {
      prerender: false,
      headers: {
        "X-Robots-Tag": "noindex,nofollow",
        "Cache-Control": "private,no-store",
      },
    },
    "/": { prerender: true },
    "/faq": { ssr: true },
    "/help": { ssr: true },
    "/articles": { ssr: true },
    "/articles/**": { prerender: true },
    "/login": {
      headers: {
        "X-Robots-Tag": "noindex,nofollow",
        "Cache-Control": "private,no-store",
      },
    },
    "/register": {
      headers: {
        "X-Robots-Tag": "noindex,nofollow",
        "Cache-Control": "private,no-store",
      },
    },
    "/dashboard": {
      prerender: false,
      headers: {
        "X-Robots-Tag": "noindex,nofollow",
        "Cache-Control": "private,no-store",
      },
    },
    "/profile": {
      prerender: false,
      headers: {
        "X-Robots-Tag": "noindex,nofollow",
        "Cache-Control": "private,no-store",
      },
    },
    "/requests/**": {
      prerender: false,
      headers: {
        "X-Robots-Tag": "noindex,nofollow",
        "Cache-Control": "private,no-store",
      },
    },
    "/requests": {
      prerender: false,
      headers: {
        "X-Robots-Tag": "noindex,nofollow",
        "Cache-Control": "private,no-store",
      },
    },
  },
  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: false,
      failOnError: true,
      routes: ["/", ...articles.map((article) => `/articles/${article.slug}`)],
    },
  },
  experimental: {
    defaults: {
      nuxtLink: { prefetchOn: { interaction: true, visibility: false } },
    },
  },
  hooks: {
    "build:manifest": (manifest) => {
      for (const chunk of Object.values(manifest))
        if (
          /(?:layouts\/default\.vue|composables\/(?:useAuth|useWorkflow)|stores\/|pages\/(?:requests|dashboard|profile|login|register)|(?:AppModal|AppToast|ArticleFeedback)\.vue)/.test(
            chunk.src ?? "",
          )
        )
          chunk.prefetch = false;
    },
  },
  typescript: { strict: true },
});
