import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.CHROME_EXECUTABLE ??
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
});
try {
  const page = await browser.newPage();
  await page.goto(
    "https://www.figma.com/design/ibspqarJdPX1RngLbXpK0u/?node-id=0-1",
    { waitUntil: "domcontentloaded", timeout: 60000 },
  );
  await page.waitForFunction(
    () => {
      const host = window as unknown as {
        _fullscreen_?: {
          _state?: {
            mirror?: {
              sceneGraph?: { get(id: string): { childrenNodes?: unknown[] } };
            };
          };
        };
      };
      return Boolean(
        host._fullscreen_?._state?.mirror?.sceneGraph?.get("1:30907")
          ?.childrenNodes?.length,
      );
    },
    null,
    { timeout: 60000 },
  );
  const inventory = await page.evaluate(() => {
    interface DesignNode {
      id: string;
      name: string;
      type: string;
      size?: { x: number; y: number };
      childrenNodes?: DesignNode[];
    }
    const host = window as unknown as {
      _fullscreen_: {
        _state: { mirror: { sceneGraph: { getCurrentPage(): DesignNode } } };
      };
    };
    const root = host._fullscreen_._state.mirror.sceneGraph.getCurrentPage();
    const result: {
      id: string;
      name: string;
      type: string;
      size?: { x: number; y: number };
      parent?: string;
    }[] = [];
    const pending = [{ node: root, depth: 0, parent: "" }];
    while (pending.length) {
      const { node, depth, parent } = pending.pop()!;
      result.push({
        id: node.id,
        name: node.name,
        type: node.type,
        size: node.size,
        parent,
      });
      if (depth < 2)
        for (const child of node.childrenNodes ?? [])
          pending.push({ node: child, depth: depth + 1, parent: node.name });
    }
    return result;
  });
  await mkdir("design/figma", { recursive: true });
  await writeFile(
    "design/figma/file-sections.json",
    JSON.stringify(inventory, null, 2),
  );
  console.log(JSON.stringify(inventory));
} finally {
  await browser.close();
}
