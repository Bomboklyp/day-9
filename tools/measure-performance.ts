import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { parseEnv } from "node:util";
import { createHash } from "node:crypto";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "playwright";
import { existsSync } from "node:fs";

const stage = process.argv[2];
if (!["before", "after", "release"].includes(stage ?? ""))
  throw new Error("Use: npm run perf -- before|after|release");
const env = await readFile(".env", "utf8").then(parseEnv).catch(() => ({} as Record<string, string>));
const paths = stage === "release" ? ["/", "/help", "/articles/kak-sozdat-zayavku", "/requests"] : ["/", "/help", "/articles/kak-sozdat-zayavku"];
let sessionCookie = "";
const base = "http://127.0.0.1:3209";
const server = spawn(process.execPath, [".output/server/index.mjs"], {
  windowsHide: true,
  env: {
    ...process.env,
      NODE_ENV: "production",
      DEBUG: "",
    DATABASE_URL: process.env.DATABASE_URL ?? env.DATABASE_URL,
    WORKFLOW_DISABLE_SLA_TIMER: "1",
    HOST: "127.0.0.1",
    PORT: "3209",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverLog = "";
server.stdout.on("data", (part: Buffer) => {
  serverLog += part.toString();
});
server.stderr.on("data", (part: Buffer) => {
  serverLog += part.toString();
});
const runs: {
  path: string;
  run: number;
  score: number;
  lcpMs: number;
  cls: number;
  tbtMs: number;
  fcpMs: number;
  ttfbMs: number;
  transferBytes: number;
  scriptBytes: number;
  imageBytes: number;
  decodedScriptBytes: number;
  benchmarkIndex: number;
  lighthouseVersion: string;
  userAgent: string;
}[] = [];
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null)
      throw new Error(`Performance server stopped: ${serverLog}`);
    try {
      if ((await fetch(base)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  if (!ready) throw new Error("Performance server did not start");
  const chrome = await launch({
    chromePath:
      process.env.CHROME_EXECUTABLE ??
      (existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe")
        ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
        : chromium.executablePath()),
    chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox"],
    logLevel: "silent",
  });
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${chrome.port}`);
  const context = browser.contexts()[0]!;
  if (stage === "release") {
    const response = await fetch(base + "/api/auth/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "operator@workflow.local", password: "Practice123!" }),
    });
    if (!response.ok) throw new Error("Performance demo login failed");
    sessionCookie = response.headers.getSetCookie().find((value) => value.startsWith("workflow_session=") && value.includes("HttpOnly"))!.split(";")[0]!;
  }
  try {
    for (const path of paths) {
      const response = await fetch(base + path, { headers: path === "/requests" ? { cookie: sessionCookie } : {} });
      if (
        response.status !== 200 ||
        !(await response.text()).includes("WorkFlow")
      )
        throw new Error(`Invalid performance page: ${path}`);
      for (let run = 1; run <= 3; run++) {
        await context.clearCookies();
        if (path === "/requests") await context.addCookies([{ name: "workflow_session", value: sessionCookie.split("=")[1]!, url: base, httpOnly: true, sameSite: "Lax" }]);
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.clearBrowserCache");
        await cdp.send("Storage.clearDataForOrigin", { origin: base, storageTypes: "local_storage,indexeddb,cache_storage,service_workers" });
        await page.close();
        const result = await lighthouse(base + path, {
          port: chrome.port,
          output: "json",
          logLevel: "error",
          onlyCategories: ["performance"],
          formFactor: "mobile",
          screenEmulation: {
            mobile: true,
            width: 360,
            height: 800,
            deviceScaleFactor: 1,
            disabled: false,
          },
          throttlingMethod: "simulate",
          throttling: {
            rttMs: 150,
            throughputKbps: 1638.4,
            cpuSlowdownMultiplier: 4,
          },
          disableStorageReset: true,
        });
        if (!result) throw new Error("Lighthouse returned no result");
        const lhr = result.lhr;
        if (lhr.runtimeError) throw new Error(lhr.runtimeError.message);
        if (new URL(lhr.finalDisplayedUrl).pathname !== path)
          throw new Error(`Performance page redirected: ${path}`);
        const network = lhr.audits["network-requests"]!.details;
        const items =
          network?.type === "table"
            ? (network.items as Record<string, unknown>[])
            : [];
        const bytes = (type: string, field = "transferSize") =>
          items
            .filter((item) => item.resourceType === type)
            .reduce((sum, item) => sum + Number(item[field] ?? 0), 0);
        const metric = (name: string) =>
          Number(lhr.audits[name]?.numericValue ?? 0);
        runs.push({
          path,
          run,
          score: Math.round((lhr.categories.performance?.score ?? 0) * 100),
          lcpMs: metric("largest-contentful-paint"),
          cls: metric("cumulative-layout-shift"),
          tbtMs: metric("total-blocking-time"),
          fcpMs: metric("first-contentful-paint"),
          ttfbMs: metric("server-response-time"),
          transferBytes: metric("total-byte-weight"),
          scriptBytes: bytes("Script"),
          imageBytes: bytes("Image"),
          decodedScriptBytes: bytes("Script", "resourceSize"),
          benchmarkIndex: lhr.environment.benchmarkIndex,
          lighthouseVersion: lhr.lighthouseVersion,
          userAgent: lhr.userAgent,
        });
        await mkdir(`.verification/day9/lighthouse/${stage}`, {
          recursive: true,
        });
        const name =
          path === "/"
            ? "landing"
            : path.startsWith("/help")
              ? "help"
              : path === "/requests" ? "requests" : "article";
        await writeFile(
          `.verification/day9/lighthouse/${stage}/${name}-${run}.json`,
          JSON.stringify(lhr).replaceAll(sessionCookie || "__no_cookie__", "[redacted]").replaceAll(sessionCookie.split("=")[1] || "__no_token__", "[redacted]"),
        );
        console.log(
          `${stage} ${path} ${run}/3: score ${runs.at(-1)!.score}, LCP ${Math.round(runs.at(-1)!.lcpMs)}ms, JS ${Math.round(runs.at(-1)!.scriptBytes / 1024)} KiB`,
        );
      }
    }
  } finally {
    if (sessionCookie) await fetch(base + "/api/auth/logout", { method: "POST", headers: { cookie: sessionCookie } });
    await chrome.kill();
  }
  const medians = paths.map((path) => {
    const values = runs.filter((run) => run.path === path);
    const median = (key: keyof (typeof values)[number]) =>
      values.map((run) => Number(run[key])).sort((a, b) => a - b)[1]!;
    return {
      path,
      score: median("score"),
      lcpMs: median("lcpMs"),
      cls: median("cls"),
      tbtMs: median("tbtMs"),
      fcpMs: median("fcpMs"),
      ttfbMs: median("ttfbMs"),
      transferBytes: median("transferBytes"),
      scriptBytes: median("scriptBytes"),
      imageBytes: median("imageBytes"),
      decodedScriptBytes: median("decodedScriptBytes"),
    };
  });
  const hasher = createHash("sha256");
  async function hashTree(directory: string) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
      const name = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await hashTree(name);
      else hasher.update(name).update(await readFile(name));
    }
  }
  for (const directory of ["app", "server", "shared"]) await hashTree(directory);
  hasher.update(await readFile("nuxt.config.ts")).update(await readFile("package-lock.json"));
  const sourceHash = hasher.digest("hex");
  await mkdir("docs/performance", { recursive: true });
  await writeFile(
    `docs/performance/${stage}.json`,
    JSON.stringify(
      {
        stage,
        measuredAt: new Date().toISOString(),
        sourceHash,
        environment: {
          node: process.version,
          platform: process.platform,
          viewport: { width: 360, height: 800 },
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
          runs: 3,
          coldCache: true,
        },
        medians,
        runs,
      },
      null,
      2,
    ),
  );
} finally {
  if (server.exitCode === null) {
    const closed = once(server, "exit");
    server.kill();
    await closed;
  }
}
