import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
import pixelmatch from "pixelmatch";

const baseline = process.argv[2] ?? "../День 7/Скриншоты";
const current = ".verification/day8/screens";
const comparisons = [];
for (const name of (await readdir(current))
  .filter((name) =>
    /^8-(faq|help|articles|article|404|landing)-\d+\.png$/.test(name),
  )
  .sort()) {
  const previous = name.replace(/^8-/, "7-");
  const [left, right] = await Promise.all([
    readFile(`${baseline}/${previous}`),
    readFile(`${current}/${name}`),
  ]);
  const [before, after] = await Promise.all([
    sharp(left).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    sharp(right).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  if (
    before.info.width !== after.info.width ||
    before.info.height !== after.info.height
  )
    throw new Error(`Size changed: ${name}`);
  const differentPixels = pixelmatch(
    before.data,
    after.data,
    null,
    after.info.width,
    after.info.height,
    { threshold: 0.1 },
  );
  comparisons.push({
    name,
    width: after.info.width,
    height: after.info.height,
    differentPixels,
    referenceSha256: createHash("sha256").update(left).digest("hex"),
    currentSha256: createHash("sha256").update(right).digest("hex"),
  });
}
if (comparisons.length !== 18)
  throw new Error("Expected 18 public screenshots");
await mkdir("docs/architecture", { recursive: true });
await writeFile(
  "docs/architecture/visual-parity.json",
  JSON.stringify(
    { baseline: "Day 7 screenshots", threshold: 0.1, comparisons },
    null,
    2,
  ) + "\n",
);
console.log(
  `Compared ${comparisons.length} screens; changed pixels: ${comparisons.reduce((sum, item) => sum + item.differentPixels, 0)}`,
);
if (comparisons.some((item) => item.differentPixels)) process.exitCode = 1;
