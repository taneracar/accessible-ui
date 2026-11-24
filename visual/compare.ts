import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export type Result = { file: string; status: "same" | "changed" | "added" | "removed"; pixels: number };

const CLEAR = 0.1;
const NOISE_PIXELS = 32;

const pngs = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".png")) : []);

/** Copies onto a canvas of the given size; pixels outside the original are magenta, so a size change always differs. */
function pad(src: PNG, width: number, height: number) {
  const out = new PNG({ width, height });
  for (let i = 0; i < out.data.length; i += 4) out.data.set([255, 0, 255, 255], i);
  PNG.bitblt(src, out, 0, 0, src.width, src.height, 0, 0);
  return out;
}

export function compareDirs(baseDir: string, headDir: string, diffDir: string): Result[] {
  mkdirSync(diffDir, { recursive: true });
  const base = new Set(pngs(baseDir));
  const head = new Set(pngs(headDir));
  return [...new Set([...base, ...head])].sort().map((file): Result => {
    if (!base.has(file)) return { file, status: "added", pixels: 0 };
    if (!head.has(file)) return { file, status: "removed", pixels: 0 };
    const a = PNG.sync.read(readFileSync(join(baseDir, file)));
    const b = PNG.sync.read(readFileSync(join(headDir, file)));
    const width = Math.max(a.width, b.width);
    const height = Math.max(a.height, b.height);
    const diff = new PNG({ width, height });
    const [pa, pb] = [pad(a, width, height).data, pad(b, width, height).data];
    const count = (threshold: number, out?: PNG) => pixelmatch(pa, pb, out?.data, width, height, { threshold, includeAA: true });
    const any = count(0, diff);
    // Two rules, both measured on this repo (see README): a clear difference counts from one
    // pixel; a faint one only when it covers more than rasteriser noise (4-8 px seen) can.
    const pixels = count(CLEAR) > 0 || any > NOISE_PIXELS ? any : 0;
    if (pixels > 0) writeFileSync(join(diffDir, file), PNG.sync.write(diff));
    return { file, status: pixels > 0 ? "changed" : "same", pixels };
  });
}

export const needsReview = (r: Result) => r.status === "changed" || r.status === "removed";

export function report(results: Result[]) {
  const order = { changed: 0, removed: 1, added: 2, same: 3 };
  const img = (dir: string, r: Result, has: boolean) => `<td>${has ? `<img src="${dir}/${r.file}" alt="${dir} of ${r.file}">` : "none"}</td>`;
  const rows = [...results].sort((a, b) => order[a.status] - order[b.status]).filter((r) => r.status !== "same").map((r) =>
    `<tr><th scope="row">${r.file}<br>${r.status}${r.pixels ? `, ${r.pixels} px` : ""}</th>${img("base", r, r.status !== "added")}${img("head", r, r.status !== "removed")}${img("diff", r, r.status === "changed")}</tr>`);
  return `<!doctype html><html lang="en"><meta charset="utf-8"><title>Visual report</title><style>body{font-family:system-ui}img{max-width:420px;border:1px solid #888}td,th{vertical-align:top;padding:8px}</style>
<h1>Visual report</h1><p>${results.length} screenshots, ${results.filter(needsReview).length} need review.</p>
<table><thead><tr><th>Story</th><th>Base</th><th>Head</th><th>Diff</th></tr></thead><tbody>${rows.join("\n")}</tbody></table></html>`;
}
