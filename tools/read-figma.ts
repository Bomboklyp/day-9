import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

interface DesignNode extends Record<string, unknown> {
  childrenNodes?: DesignNode[];
}
interface ExportNode extends Record<string, unknown> {
  children?: ExportNode[];
}
declare global {
  interface Window {
    _fullscreen_: {
      _state: { mirror: { sceneGraph: { get(id: string): DesignNode } } };
    };
  }
}
const source =
  "https://www.figma.com/design/ibspqarJdPX1RngLbXpK0u/?node-id=0-1";
const directory = path.resolve("design/figma");
await mkdir(directory, { recursive: true });

if (!process.argv.includes("--images-only")) {
  const chrome = [
    process.env.CHROME_EXECUTABLE,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  ].find((p) => p && existsSync(p));
  const browser = await chromium.launch({
    headless: true,
    ...(chrome ? { executablePath: chrome } : { channel: "chrome" }),
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1920, height: 1080 },
    });
    await page.goto(source, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(
      () => {
        try {
          return Boolean(
            window._fullscreen_?._state?.mirror?.sceneGraph?.get("1:35114"),
          );
        } catch {
          return false;
        }
      },
      null,
      { timeout: 60000 },
    );
    const document = await page.evaluate(() => {
      const graph = window._fullscreen_._state.mirror.sceneGraph;
      const properties = [
        "id",
        "name",
        "type",
        "visible",
        "opacity",
        "size",
        "x",
        "y",
        "relativeTransform",
        "absoluteTransform",
        "fills",
        "strokePaints",
        "strokeWeight",
        "strokeAlign",
        "effects",
        "cornerRadius",
        "cornerRadiusValues",
        "fontName",
        "fontSize",
        "fontWeightOrMixed",
        "lineHeightOrMixed",
        "letterSpacing",
        "textData",
        "textAlignHorizontal",
        "textAlignVertical",
        "textAutoResize",
        "stackMode",
        "stackWrap",
        "stackSpacing",
        "stackCounterSpacing",
        "stackLeftPadding",
        "stackRightPadding",
        "stackTopPadding",
        "stackBottomPadding",
        "stackLeftPadding",
        "stackPrimaryAlignItems",
        "stackCounterAlignItems",
        "stackPrimarySizing",
        "stackCounterSizing",
        "stackChildPrimaryGrow",
        "stackHorizontalLayoutSize",
        "stackVerticalLayoutSize",
        "stackChildAlignSelf",
        "clipsContent",
      ];
      const components: ExportNode = {};
      const level9: ExportNode = {};
      const pending = [
        { node: graph.get("1:30776"), result: components },
        { node: graph.get("1:35114"), result: level9 },
      ];
      while (pending.length) {
        const { node, result } = pending.pop()!;
        for (const property of properties) {
          try {
            if (node[property] !== undefined) result[property] = node[property];
          } catch {}
        }
        if (node.childrenNodes?.length) {
          result.children = [];
          for (const child of node.childrenNodes) {
            const data: ExportNode = {};
            result.children.push(data);
            pending.push({ node: child, result: data });
          }
        }
      }
      return {
        source: location.href,
        exportedAt: new Date().toISOString(),
        components,
        level9,
      };
    });
    await writeFile(
      path.join(directory, "level-9.json"),
      JSON.stringify(document, null, 2),
    );
    console.log(
      `Read ${document.level9.children?.length ?? 0} level-nine frames`,
    );
  } finally {
    await browser.close();
  }
}

const document = JSON.parse(
  await readFile(path.join(directory, "level-9.json"), "utf8"),
);
await mkdir(path.join(directory, "screens"), { recursive: true });
const pending = [...(document.level9.children ?? [])];
async function download() {
  while (pending.length) {
    const frame = pending.shift();
    const target = path.join(
      directory,
      "screens",
      frame.id.replace(":", "-") + ".png",
    );
    if (existsSync(target) && !process.argv.includes("--refresh")) continue;
    const url = `https://www.figma.com/design/ibspqarJdPX1RngLbXpK0u/?node-id=${frame.id.replace(":", "-")}`;
    const metadata = await fetch(
      "https://www.figma.com/api/oembed?url=" + encodeURIComponent(url),
    );
    if (!metadata.ok)
      throw new Error(`Figma preview ${metadata.status}: ${frame.name}`);
    const preview = (await metadata.json()) as { thumbnail_url: string };
    const imageUrl = new URL(preview.thumbnail_url);
    imageUrl.searchParams.set("width", String(Math.min(1280, frame.size.x)));
    const response = await fetch(imageUrl);
    if (!response.ok)
      throw new Error(`Figma image ${response.status}: ${frame.name}`);
    await writeFile(target, Buffer.from(await response.arrayBuffer()));
    console.log(`Saved ${frame.name}`);
  }
}
await Promise.all([download(), download(), download()]);
console.log("Export complete: design/figma/level-9.json and screens/");
