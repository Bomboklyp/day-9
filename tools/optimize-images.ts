import { mkdir, stat, writeFile, rm } from "node:fs/promises";
import sharp from "sharp";

await mkdir("public/images", { recursive: true });
const sizes = [256, 384, 480];
const images: {
  path: string;
  width: number;
  bytes: number;
  selected: boolean;
}[] = [];
for (const width of sizes) {
  const path = `public/images/octagon-${width}.webp`;
  await sharp("public/images/octagon.png")
    .resize(width, width)
    .webp({ lossless: true, effort: 6 })
    .toFile(path);
  images.push({
    path,
    width,
    bytes: (await stat(path)).size,
    selected: width === 480,
  });
  if (width !== 480) await rm(path, { force: true });
}
await mkdir("docs/performance", { recursive: true });
await writeFile(
  "docs/performance/images.json",
  JSON.stringify(
    {
      source: {
        path: "public/images/octagon.png",
        width: 480,
        height: 480,
        bytes: (await stat("public/images/octagon.png")).size,
      },
      variants: images,
    },
    null,
    2,
  ),
);
console.log("Responsive image variants generated");
