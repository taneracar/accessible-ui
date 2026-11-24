import { mkdirSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { chromium } from "playwright";

const MODES = {
  light: { theme: "light", width: 800, height: 500, forcedColors: "none" },
  dark: { theme: "dark", width: 800, height: 500, forcedColors: "none" },
  phone: { theme: "light", width: 320, height: 640, forcedColors: "none" }, // 320px: WCAG 1.4.10 reflow
  contrast: { theme: "dark", width: 800, height: 500, forcedColors: "active" },
} as const;

const TYPES: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".woff2": "font/woff2" };

function serve(dir: string) {
  const server = createServer((req, res) => {
    const path = normalize(new URL(req.url!, "http://x").pathname);
    try {
      const body = readFileSync(join(dir, path));
      res.setHeader("content-type", TYPES[extname(path)] ?? "application/octet-stream").end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise<{ url: string; close: () => void }>((ok) =>
    server.listen(0, "127.0.0.1", () => {
      const a = server.address();
      ok({ url: `http://127.0.0.1:${typeof a === "object" ? a!.port : a}`, close: () => server.close() });
    }));
}

/** Screenshots every story of a built Storybook in every mode. Throws if a story fails to render. */
export async function capture(storybookDir: string, outDir: string) {
  mkdirSync(outDir, { recursive: true });
  const index = JSON.parse(readFileSync(join(storybookDir, "index.json"), "utf8")) as { entries: Record<string, { id: string; type: string }> };
  const ids = Object.values(index.entries).filter((e) => e.type === "story").map((e) => e.id);
  if (ids.length === 0) throw new Error(`No stories in ${storybookDir}`);
  const server = await serve(storybookDir);
  const browser = await chromium.launch();
  try {
    for (const [mode, m] of Object.entries(MODES)) {
      const context = await browser.newContext({ viewport: { width: m.width, height: m.height }, reducedMotion: "reduce", forcedColors: m.forcedColors });
      for (const id of ids) {
        const page = await context.newPage();
        await page.goto(`${server.url}/iframe.html?id=${id}&viewMode=story&globals=theme:${m.theme}`);
        // The play function must be over, or the shot races it.
        const phase = await page.waitForFunction(() => {
          const p = (window as unknown as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } }).__STORYBOOK_PREVIEW__?.currentRender?.phase;
          return p === "finished" || p === "errored" || p === "aborted" ? p : false;
        }, undefined, { timeout: 15_000 }).then((h) => h.jsonValue());
        if (phase !== "finished") throw new Error(`${id} (${mode}) ${phase}`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (overflow > 0) throw new Error(`${id} (${mode}) scrolls sideways by ${overflow}px`);
        await page.screenshot({ path: join(outDir, `${id}--${mode}.png`), animations: "disabled", caret: "hide" });
        await page.close();
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  return ids.length * Object.keys(MODES).length;
}
