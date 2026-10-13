#!/usr/bin/env node
/* check-system — the Tealbrick design-system guard (@opt2-tealbrick/ui bin). Every surface runs it in CI:
     check-system <dir> [<dir> ...] [--ignore <name>]... [--report]
   Derived from the design lead's tools/check-system.ts (coordination/design, DESIGN-SYSTEM.md §8); same rules, plus the
   JS style-object forms (borderRadius / fontFamily / fontWeight literals in .ts/.tsx) and repeatable --ignore.
   Fails (exit 1) when a source file uses a value outside the Tealbrick token set:
   - a raw colour (hex / rgb() / hsl()) outside tokens.css  (check-system: allow — this file names the patterns)
   - a font-family other than var(--tb-font) / var(--tb-font-mono) / inherit
   - a border-radius that is not a --tb-radius-* token, 0 or inherit
   - a font-weight outside 400 / 700 / 800 / 900
   - a box-shadow that is not none or built only from --tb-* tokens
   - a font file or font import other than the kit's own Nunito
   - a scrollbar restyle (the kit styles scrollbars once, in tokens.css)
   - SHAPE (C125/C126): a pill radius on a brick element (button, field, tab, nav, card, panel, dialog, menu, toast,
     notice, table, inspector, canvas node, avatar) or a brick radius on a pill element (tag, chip, badge, count,
     switch, segmented, pay pill, status pill)
   - Swift: raw Color literals, literal cornerRadius, .font(.system/.custom) outside TBDDesign
   A reviewed exception carries `check-system: allow` on the same line (CSS: inside the rule block).
   --report prints an inventory (kind, value, count, first file:line) and exits 0. */
import { lstatSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

export type Hit = { kind: string; value: string; where: string };

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  "build",
  ".astro",
  "DerivedData",
  "vendor",
  "coverage",
  ".next",
  "build.noindex",
  "SourcePackages",
  "Pods",
  ".build",
  "tools",
  "screens",
  "inventory",
]); // build scripts and evidence are not UI source
const EXT = new Set([".css", ".tsx", ".ts", ".astro", ".html", ".swift"]);

const okRadius = (v: string) => v.split(/\s+/).every((t) => /^(0|0px|inherit|var\(--tb-radius-[a-z-]+\))$/.test(t));
const okWeight = (v: string) => /^(400|700|800|900|inherit|var\(--tb-weight-[a-z]+\))$/.test(v);
const okFont = (v: string) => /^var\(--tb-font(-mono)?\)$|^inherit$/.test(v);
const unquote = (v: string) => v.trim().replace(/^["'`]|["'`]$/g, "");

/** [kind, pattern, ok(value)] — the value is capture group 1, else the whole match */
const RULES: [string, RegExp, (v: string) => boolean][] = [
  ["colour", /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g, () => false], // check-system: allow
  ["font", /font-family\s*:\s*([^;}]+?)(?=[;}]|"\s*>|$)/g, (v) => okFont(v.trim())],
  ["radius", /border-radius\s*:\s*([^;}"']+)/g, (v) => okRadius(v.trim())],
  ["weight", /font-weight\s*:\s*([^;}"']+)/g, (v) => okWeight(v.trim())],
  ["shadow", /box-shadow\s*:\s*([^;}]+)/g, (v) => /^none$/.test(v.trim()) || (/var\(--tb-/.test(v) && !/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(v))],
  ["font-import", /@import[^;]*font[^;]*;|@fontsource[^'"\s]*|fonts\.googleapis\.com[^'"\s]*/g, (v) => /@fontsource(-variable)?\/nunito/.test(v)], // check-system: allow
  // JS style objects (React style props, CSS-in-JS): only literal values are judged; expressions are left to review
  ["radius", /\bborderRadius\s*:\s*(\d+(?:\.\d+)?|"[^"]*"|'[^']*')/g, (v) => okRadius(unquote(v))],
  ["font", /\bfontFamily\s*:\s*("[^"]*"|'[^']*')/g, (v) => okFont(unquote(v))],
  ["weight", /\bfontWeight\s*:\s*(\d+|"[^"]*"|'[^']*')/g, (v) => okWeight(unquote(v))],
  // scrollbars are styled once, in the kit's tokens.css: a surface may not restyle or hide them
  ["scrollbar", /scrollbar-(?:width|color)\s*:[^;]+|::-webkit-scrollbar[\w-]*/g, () => false], // check-system: allow
  // SwiftUI: raw Color literals, corner radii and fonts outside TBDDesign tokens
  ["swift-colour", /Color\(\s*(?:red|\.sRGB|hex)[^)]*\)|Color\(\s*"#[^"]+"\)/g, () => false],
  ["swift-radius", /cornerRadius\s*[:(]\s*([0-9.]+)/g, () => false],
  ["swift-font", /\.font\(\s*\.(?:system|custom)\([^)]*\)\)/g, () => false],
];

// shape pass: selector-aware, CSS only (innermost rule blocks; enough for flat component CSS)
// `mark-chip` is the brand mark's 40px brick tile in the app-colour header (components.css, C148), not a filter chip
const PILL_SEL = /(?:^|[.\-_#\s>["=])(tags?|(?<!mark-)chips?|badge|count|pill|paypill|status-pill|switch|segmented|radio)(?![a-z])/i;
const BRICK_SEL = /(btn|button|input|select|textarea|card|panel|dialog|inspector|toast|menu|tabs?|nav|node|notice|copy|field|avatar|table|choice|close)(?![a-z])/i;
const IS_PILL = /999px|var\(--tb-radius-pill\)|50%/;
const IS_BRICK = /var\(--tb-radius-brick\)|var\(--tb-radius\)|\b[1-9]px\b/;

export function shapeHits(text: string, file: string): Hit[] {
  const out: Hit[] = [];
  const css = text.replace(/\/\*[\s\S]*?\*\//g, (c) => (/check-system:\s*allow/.test(c) ? c : c.replace(/[^\n]/g, " ")));
  for (const m of css.matchAll(/([^{}@;]+)\{([^{}]*)\}/g)) {
    const raw = m[1] ?? "";
    const sel = raw.trim();
    const body = m[2] ?? "";
    const r = /border-radius\s*:\s*([^;]+)/.exec(body)?.[1];
    if (!r || /check-system:\s*allow/.test(body)) continue;
    const line = css.slice(0, (m.index ?? 0) + (raw.length - raw.trimStart().length)).split("\n").length;
    const parts = sel.split(",").map((x) => x.trim());
    const last = (x: string) => x.split(/[\s>+~]+/).pop() ?? "";
    const pillEl = parts.every((x) => PILL_SEL.test(x));
    const brickEl = parts.some((x) => BRICK_SEL.test(last(x)) && !PILL_SEL.test(x) && !/::(before|after)/.test(x));
    if (brickEl && IS_PILL.test(r)) out.push({ kind: "shape", value: `pill radius on brick element ${sel.slice(0, 50)}`, where: `${file}:${line}` });
    else if (pillEl && IS_BRICK.test(r) && !IS_PILL.test(r)) out.push({ kind: "shape", value: `brick radius on pill element ${sel.slice(0, 50)}`, where: `${file}:${line}` });
  }
  return out;
}

/** Findings for one file's text. `file` is only used in `where`. */
export function checkText(text: string, file: string): Hit[] {
  const hits: Hit[] = [];
  const isSwift = file.endsWith(".swift");
  text.split("\n").forEach((line, i) => {
    if (/check-system:\s*allow/.test(line)) return; // explicit, reviewed exception
    for (const [kind, re, ok] of RULES) {
      if (isSwift !== kind.startsWith("swift")) continue;
      for (const m of line.matchAll(re)) {
        const v = (m[1] ?? m[0]).trim();
        if (!ok(v)) hits.push({ kind, value: v.slice(0, 80), where: `${file}:${i + 1}` });
      }
    }
  });
  if (file.endsWith(".css")) hits.push(...shapeHits(text, file));
  return hits;
}

export function listFiles(root: string, ignore: Set<string> = new Set()): string[] {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const n of readdirSync(d)) {
      if (SKIP_DIRS.has(n) || ignore.has(n) || n.startsWith(".")) continue;
      const p = join(d, n);
      const s = lstatSync(p);
      if (s.isSymbolicLink()) continue;
      if (s.isDirectory()) walk(p);
      else if (EXT.has(extname(n)) && !n.endsWith(".d.ts") && !/\.test\.tsx?$/.test(n) && n !== "tokens.css" && n !== "tokens.ts") files.push(p);
    }
  };
  if (lstatSync(root).isDirectory()) walk(root);
  else files.push(root);
  return files;
}

export function checkDirs(dirs: string[], ignore: Set<string> = new Set()): { files: number; hits: Hit[] } {
  let files = 0;
  const hits: Hit[] = [];
  for (const dir of dirs) {
    for (const f of listFiles(dir, ignore)) {
      files++;
      hits.push(...checkText(readFileSync(f, "utf8"), relative(process.cwd(), f) || f));
    }
  }
  return { files, hits };
}

function main(argv: string[]): number {
  const dirs: string[] = [];
  const ignore = new Set<string>();
  let report = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? "";
    if (a === "--report") report = true;
    else if (a === "--ignore") ignore.add(argv[++i] ?? "");
    else if (a === "--help" || a === "-h") {
      console.log("usage: check-system <dir> [<dir> ...] [--ignore <name>]... [--report]");
      return 0;
    } else dirs.push(a);
  }
  if (!dirs.length) {
    console.error("usage: check-system <dir> [<dir> ...] [--ignore <name>]... [--report]");
    return 2;
  }
  const { files, hits } = checkDirs(dirs, ignore);
  if (report) {
    const by = new Map<string, { n: number; first: string }>();
    for (const h of hits) {
      const k = `${h.kind}\t${h.value.toLowerCase()}`;
      const e = by.get(k);
      if (e) e.n++;
      else by.set(k, { n: 1, first: h.where });
    }
    const rows = [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]) || b[1].n - a[1].n);
    for (const [k, { n, first }] of rows) console.log(`${k}\t${n}\t${first}`);
    console.error(`${files} files, ${hits.length} off-system uses, ${rows.length} distinct values`);
    return 0;
  }
  for (const h of hits) console.error(`${h.where}: off-system ${h.kind}: ${h.value}`);
  if (hits.length) {
    console.error(`\n${hits.length} off-system values. Use a --tb-* token, or mark a reviewed exception with "check-system: allow".`);
    return 1;
  }
  if (!files) {
    console.error("check-system: no source files found (wrong path?)");
    return 1;
  }
  console.log(`check-system: ${files} files clean`);
  return 0;
}

const self = process.argv[1] ?? "";
if (/check-system(\.[jt]s)?$/.test(self)) process.exit(main(process.argv.slice(2)));
