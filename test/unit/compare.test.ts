import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PNG } from "pngjs";
import { expect, it } from "vitest";
import { compareDirs, needsReview, report } from "../../visual/compare";

type Shot = [w: number, h: number, rgb: [number, number, number], dot?: [number, number, number]];
function dirs(base: Record<string, Shot>, head: Record<string, Shot>) {
  const root = mkdtempSync(join(tmpdir(), "cmp-"));
  for (const [side, shots] of Object.entries({ base, head })) {
    mkdirSync(join(root, side));
    for (const [file, [width, height, rgb, dot]] of Object.entries(shots)) {
      const png = new PNG({ width, height });
      for (let i = 0; i < png.data.length; i += 4) png.data.set([...rgb, 255], i);
      if (dot) png.data.set(dot, 0);
      writeFileSync(join(root, side, file), PNG.sync.write(png));
    }
  }
  return compareDirs(join(root, "base"), join(root, "head"), join(root, "diff"));
}
const white: [number, number, number] = [255, 255, 255];

it("classifies same, added and removed", () => {
  const r = dirs({ "a.png": [4, 4, white], "gone.png": [4, 4, white] }, { "a.png": [4, 4, white], "new.png": [4, 4, white] });
  expect(r.map((x) => [x.file, x.status, needsReview(x)])).toEqual([["a.png", "same", false], ["gone.png", "removed", true], ["new.png", "added", false]]);
});
it("sees one changed pixel", () =>
  expect(dirs({ "a.png": [4, 4, white] }, { "a.png": [4, 4, white, [0, 0, 0]] })[0]).toMatchObject({ status: "changed", pixels: 1 }));
it("sees a change of one shade", () =>
  expect(dirs({ "a.png": [4, 4, [11, 107, 75]] }, { "a.png": [4, 4, [16, 115, 82]] })[0]!.status).toBe("changed"));
it("sees a size change, whatever the colours", () =>
  expect(dirs({ "a.png": [4, 4, white] }, { "a.png": [4, 5, white] })[0]).toMatchObject({ status: "changed", pixels: 4 }));
it("the report lists only what differs", () => {
  const html = report([{ file: "a.png", status: "same", pixels: 0 }, { file: "b.png", status: "changed", pixels: 3 }]);
  expect(html).toContain("b.png");
  expect(html).not.toContain("a.png");
});
