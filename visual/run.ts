// Visual regression without committed baselines: build the base commit and the
// working tree on the same machine, screenshot both, compare.
// Usage: npm run visual -- [base-ref]   (default: main)
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { capture } from "./capture.ts";
import { compareDirs, needsReview, report } from "./compare.ts";

const ref = process.argv[2] ?? "main";
const out = "visual/out";
const run = (cmd: string, args: string[], cwd = ".") => execFileSync(cmd, args, { cwd, stdio: "inherit" });
const build = (cwd: string) => run("npm", ["run", "build:storybook"], cwd);

rmSync(out, { recursive: true, force: true });
run("git", ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]); // a typo must not look like "no baseline"

build(".");
console.log(`head: ${await capture("storybook-static", `${out}/head`)} screenshots`);

const tree = mkdtempSync(join(tmpdir(), "aui-base-"));
run("git", ["worktree", "add", "--detach", "--force", tree, ref]);
try {
  if (existsSync(join(tree, ".storybook"))) {
    // Any failure from here on fails the run: a base that does not build is not "no baseline".
    run("npm", ["ci", "--no-audit", "--no-fund"], tree);
    build(tree);
    console.log(`base: ${await capture(join(tree, "storybook-static"), `${out}/base`)} screenshots`);
  } else {
    console.log(`NO BASELINE: ${ref} has no Storybook. Nothing was compared.`);
  }
} finally {
  run("git", ["worktree", "remove", "--force", tree]);
}

const results = compareDirs(`${out}/base`, `${out}/head`, `${out}/diff`);
writeFileSync(`${out}/index.html`, report(results));
const count = (s: string) => results.filter((r) => r.status === s).length;
for (const r of results.filter(needsReview)) console.log(`${r.status.padEnd(8)} ${r.file} ${r.pixels || ""}`);
console.log(`same ${count("same")}, changed ${count("changed")}, removed ${count("removed")}, added ${count("added")}. Report: ${out}/index.html`);
process.exitCode = results.some(needsReview) ? 1 : 0;
