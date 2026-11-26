import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { parseEnv } from "node:util";
import sharp from "sharp";
import { articles } from "../server/data/articles";

const env = existsSync(".env") ? parseEnv(await readFile(".env", "utf8")) : {};
const configured =
  process.env.NUXT_PUBLIC_SITE_URL ??
  env.NUXT_PUBLIC_SITE_URL ??
  "http://127.0.0.1:3008";
const origin = new URL(configured).origin;
if (!/^https?:/.test(origin))
  throw new Error("Site URL must use HTTP or HTTPS");
const paths = [
  "/",
  "/faq",
  "/help",
  "/articles",
  ...articles.map((article) => `/articles/${article.slug}`),
];
await writeFile(
  "public/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${new URL(path, origin).href.replaceAll("&", "&amp;")}</loc></url>`).join("\n")}\n</urlset>\n`,
);
await writeFile(
  "public/robots.txt",
  `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /login\nDisallow: /register\nDisallow: /dashboard\nDisallow: /requests\nDisallow: /profile\nSitemap: ${origin}/sitemap.xml\n`,
);
await mkdir("public/images", { recursive: true });
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g"><stop stop-color="#635bff"/><stop offset="1" stop-color="#bd42aa"/></linearGradient></defs><rect width="1200" height="630" fill="#17153a"/><rect x="64" y="80" width="160" height="12" rx="6" fill="url(#g)"/><text x="64" y="270" fill="#ffffff" font-size="100" font-family="Arial,sans-serif" font-weight="700">WorkFlow</text><text x="64" y="360" fill="#b9b3d4" font-size="42" font-family="Arial,sans-serif">Заявки. Команда. Результат.</text></svg>`;
await sharp(Buffer.from(svg)).png().toFile("public/images/og-workflow.png");
console.log("Sitemap, robots and Open Graph image generated");
