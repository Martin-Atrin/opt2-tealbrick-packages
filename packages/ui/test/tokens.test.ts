/** Tokens: tokens.ts is generated from tokens.css and in sync; synced design files are unchanged (DESIGN-SOURCE.json);
    cssVar names real custom properties; legacy aliases point at real tokens; the AA token pairs pass (check-contrast). */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { brandSource } from "../scripts/gen-brand.ts";
import { generate } from "../scripts/gen-tokens.ts";
import { cssName, cssVar, dark, resolved, resolvedDark, type TokenName, tokens } from "../src/tokens.ts";

const root = join(import.meta.dirname, "..");
const read = (p: string) => readFileSync(join(root, p), "utf8");
const css = read("src/tokens.css");
const defined = new Set([...css.matchAll(/(--tb-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

test("src/tokens.ts equals what scripts/gen-tokens.ts generates from src/tokens.css (sync)", () => {
  assert.equal(read("src/tokens.ts"), generate(css));
});

test("synced design files are byte-identical to what DESIGN-SOURCE.json recorded", () => {
  const src = JSON.parse(read("DESIGN-SOURCE.json")) as { files: Record<string, { sha256: string; pkgSha256?: string; to: string; how: string }> };
  const copies = Object.entries(src.files).filter(([, f]) => f.how !== "derived");
  assert.ok(copies.length >= 20);
  for (const [from, f] of copies) {
    const sha = createHash("sha256")
      .update(readFileSync(join(root, f.to)))
      .digest("hex");
    assert.equal(sha, f.pkgSha256 ?? f.sha256, `${f.to} differs from the synced design file ${from}: re-sync (scripts/sync-design.ts), never hand-edit`);
  }
});

test("src/brand-mark.ts is generated from assets/brand/logo-mark@3x.png", () => {
  assert.equal(read("src/brand-mark.ts"), brandSource());
});

test("cssVar() names a custom property that tokens.css defines, for every token (incl. digits: s8, textH2)", () => {
  for (const k of Object.keys(tokens) as TokenName[]) assert.ok(defined.has(`--tb-${cssName[k]}`), `${k} → --tb-${cssName[k]}`);
  assert.equal(cssVar("s8"), "var(--tb-s8)");
  assert.equal(cssVar("textH2"), "var(--tb-text-h2)");
  assert.equal(cssVar("radiusBrick"), "var(--tb-radius-brick)");
});

test("resolved values are literals; the C125/C126 shapes and the C148 brick red hold", () => {
  for (const [k, v] of Object.entries(resolved)) assert.doesNotMatch(v, /var\(/, k);
  for (const [k, v] of Object.entries(resolvedDark)) assert.doesNotMatch(v, /var\(/, k);
  assert.equal(resolved.radiusBrick, "6px");
  assert.equal(resolved.radiusPill, "999px");
  assert.equal(resolved.radiusSwatch, "2px");
  assert.equal(resolved.brick, "#a94b43");
  assert.equal("radius" in resolved, false); // C133: no 0.1.x aliases
  assert.equal("surface" in resolved, false);
  assert.match(resolved.font, /^"Nunito"/);
  assert.ok(Object.keys(dark).length > 10);
  for (const id of ["knowledge", "kanban", "inbox", "evolution", "rules", "fleet", "connect"]) assert.ok(defined.has(`--tb-app-${id}`), id);
});

test("C133: no 0.1.x token names ship, and every var() the CSS reads is defined", () => {
  for (const n of [
    "--tb-surface",
    "--tb-white",
    "--tb-accent",
    "--tb-radius",
    "--tb-primary",
    "--tb-teal-700",
    "--tb-burgundy-700",
    "--tb-text-sm",
    "--tb-font-serif",
  ])
    assert.equal(defined.has(n), false, n);
  const comps = read("src/components.css") + read("src/kit.css");
  for (const m of comps.matchAll(/var\((--tb-[a-z0-9-]+)/g)) assert.ok(defined.has(m[1] ?? ""), `${m[1]} is not defined in tokens.css`);
});

test("check-contrast: every token pair meets AA in light and dark (0 failures)", () => {
  const out = execFileSync(process.execPath, [join(root, "scripts/check-contrast.ts"), "--json"], { encoding: "utf8" });
  const r = JSON.parse(out) as { checked: number; failures: unknown[] };
  assert.ok(r.checked >= 245, `checked ${r.checked}`);
  assert.deepEqual(r.failures, []);
});

test("gen-tokens --check fails on a stale tokens.ts (the alarm fires; L34)", () => {
  const r = spawnSync(process.execPath, [join(root, "scripts/gen-tokens.ts"), "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.notEqual(generate(css.replace("--tb-brick: #a94b43;", "--tb-brick: #a94b44;")), read("src/tokens.ts"));
});
