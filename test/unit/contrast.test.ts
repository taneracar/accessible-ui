import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles.css", "utf8");
const tokens = Object.fromEntries(
  [...css.matchAll(/--aui-([\w-]+): light-dark\((#[0-9a-f]{6}), (#[0-9a-f]{6})\)/g)].map((m) => [m[1]!, { light: m[2]!, dark: m[3]! }]),
);

/** WCAG 2.2 relative luminance and contrast ratio. */
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT = 4.5; // 1.4.3
const UI = 3; // 1.4.11: borders, focus rings, the selected marker
const pairs: [fg: string, bg: string, min: number][] = [
  ["text", "canvas", TEXT], ["text", "surface", TEXT], ["text", "highlight", TEXT],
  ["text-muted", "canvas", TEXT], ["text-muted", "surface", TEXT],
  ["on-accent", "accent", TEXT], ["on-accent", "accent-hover", TEXT],
  ["on-danger", "danger", TEXT], ["on-danger", "danger-hover", TEXT],
  ["danger", "canvas", TEXT], ["danger", "surface", TEXT],
  ["border", "canvas", UI], ["border", "surface", UI],
  ["accent", "canvas", UI], ["accent", "highlight", UI],
  ["focus", "canvas", UI], ["focus", "surface", UI], ["focus", "highlight", UI],
];

it("matches the WCAG reference points", () => {
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2); // the well-known near miss
});

describe.each(["light", "dark"] as const)("%s theme", (theme) => {
  it.each(pairs)("%s on %s >= %d", (fg, bg, min) => {
    expect(contrast(tokens[fg]![theme], tokens[bg]![theme])).toBeGreaterThanOrEqual(min);
  });
});

it("every var() used exists", () => {
  const used = new Set([...css.matchAll(/var\(--aui-([\w-]+)\)/g)].map((m) => m[1]!));
  const defined = new Set([...css.matchAll(/--aui-([\w-]+):/g)].map((m) => m[1]!));
  expect([...used].filter((u) => !defined.has(u))).toEqual([]);
});

it("every colour token is in a checked pair", () => {
  const checked = new Set(pairs.flatMap(([a, b]) => [a, b]));
  expect(Object.keys(tokens).filter((t) => !checked.has(t))).toEqual([]);
});
