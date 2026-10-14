/** What the tarball ships: every export target, self-hosted Nunito + OFL.txt (no Google Fonts), the real brand mark,
    the app stills, the composed CSS; plus Field wiring and the clerk-appearance export. */
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { $, h, mount, skip, ui } from "./dom.ts";

const root = join(import.meta.dirname, "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
  version: string;
  exports: Record<string, unknown>;
  bin: Record<string, string>;
  files: string[];
};
const distSkip = !existsSync(join(root, "dist/index.js")) && "build first";

const targets = (e: unknown): string[] => (typeof e === "string" ? [e] : e && typeof e === "object" ? Object.values(e).flatMap(targets) : []);

test("every exports/bin target exists after the build (the release pack guard checks the same)", { skip: distSkip }, () => {
  for (const t of [...targets(pkg.exports), ...Object.values(pkg.bin)]) {
    if (t.includes("*")) {
      const dir = join(root, t.slice(0, t.indexOf("*")));
      assert.ok(existsSync(dir) && readdirSync(dir).length > 0, t);
    } else assert.ok(existsSync(join(root, t)), t);
  }
  assert.ok(statSync(join(root, "dist/bin/check-system.js")).mode & 0o111, "bin is executable");
  assert.match(readFileSync(join(root, "dist/bin/check-system.js"), "utf8"), /^#!\/usr\/bin\/env node/);
});

test("Nunito is self-hosted: two woff2 files + OFL.txt with the upstream copyright; no Google Fonts anywhere in dist", { skip: distSkip }, () => {
  const fonts = readdirSync(join(root, "dist/fonts")).sort();
  assert.deepEqual(fonts, ["OFL.txt", "nunito-latin-ext-wght-normal.woff2", "nunito-latin-wght-normal.woff2"]);
  const ofl = readFileSync(join(root, "dist/fonts/OFL.txt"), "utf8");
  assert.match(ofl, /Copyright 2014 The Nunito Project Authors/);
  assert.match(ofl, /SIL OPEN FONT LICENSE Version 1\.1/);
  for (const f of fonts.filter((x) => x.endsWith(".woff2")))
    assert.equal(
      readFileSync(join(root, "dist/fonts", f))
        .subarray(0, 4)
        .toString("latin1"),
      "wOF2",
    );
  const tokensCss = readFileSync(join(root, "dist/tokens.css"), "utf8");
  assert.equal((tokensCss.match(/@font-face/g) ?? []).length, 2);
  assert.match(tokensCss, /font-family: "Nunito"/);
  assert.match(tokensCss, /url\("\.\/fonts\/nunito-latin-wght-normal\.woff2"\)/);
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));
  for (const f of walk(join(root, "dist")).filter((f) => /\.(css|js)$/.test(f)))
    assert.doesNotMatch(readFileSync(f, "utf8"), /fonts\.googleapis|fonts\.gstatic/, f);
});

test("dist CSS = design source + package additions, in order", { skip: distSkip }, () => {
  const tokensCss = readFileSync(join(root, "dist/tokens.css"), "utf8");
  const comps = readFileSync(join(root, "dist/components.css"), "utf8");
  assert.ok(tokensCss.indexOf("@font-face") < tokensCss.indexOf("--tb-paper:"));
  assert.doesNotMatch(tokensCss, /--tb-burgundy|--tb-surface:/); // C133: no 0.1.x aliases
  assert.ok(comps.includes(readFileSync(join(root, "src/components.css"), "utf8")));
  assert.ok(comps.indexOf(".tb-btn {") < comps.indexOf("dialog.tb-dialog {"));
  assert.match(tokensCss, new RegExp(`@opt2-tealbrick/ui ${pkg.version.replace(/\./g, "\\.")}`));
});

test("assets: the real drawn mark (not favicon.svg) with provenance, and the 7 opt2 app stills at 1x and 2x", () => {
  const brand = readdirSync(join(root, "assets/brand")).sort();
  assert.deepEqual(brand, ["PROVENANCE.md", "logo-32.png", "logo-48.png", "logo-apple-180.png", "logo-mark@3x.png"]);
  assert.equal(readFileSync(join(root, "assets/brand/logo-mark@3x.png")).readUInt32BE(16), 108); // PNG IHDR width
  const apps = readdirSync(join(root, "assets/apps"));
  for (const slug of ["knowledge", "marketplace", "work-ethic-kanban", "operator-inbox", "rules-approvals", "organization-plane", "evolution-workflow-runtime"])
    for (const d of ["1x", "2x"]) assert.ok(apps.includes(`${slug}@${d}.webp`), `${slug}@${d}`);
  assert.ok(pkg.files.includes("assets") && pkg.files.includes("dist") && pkg.files.includes("CHANGELOG.md"));
});

test("Field: label, hint and error wire the kit inputs (labelledby, describedby, aria-invalid); raw children stay labelled", { skip }, async () => {
  const { Field, TextInput, Textarea, NativeSelect } = await ui();
  const m = await mount(
    h(
      "div",
      null,
      h(Field, { label: "Workspace name", hint: "You can change it later." }, h(TextInput, { defaultValue: "Novak Dental" })),
      h(Field, { label: "Railway token", error: "This token can’t see any projects." }, h(TextInput, { code: true })),
      h(Field, { label: "What does it do?" }, h(Textarea, {})),
      h(Field, { label: "Fallback" }, h(NativeSelect, { options: [{ value: "a", label: "A" }] })),
    ),
  );
  const [a, b] = [...m.root.querySelectorAll<HTMLElement>("label.tb-field")];
  const ia = $(a as HTMLElement, "input");
  assert.equal(ia.getAttribute("aria-labelledby"), $(a as HTMLElement, ".tb-label").id);
  assert.equal(ia.getAttribute("aria-describedby"), $(a as HTMLElement, ".tb-hint").id);
  assert.equal(ia.hasAttribute("aria-invalid"), false);
  assert.equal(ia.className, "tb-input");
  const ib = $(b as HTMLElement, "input");
  assert.equal(ib.getAttribute("aria-invalid"), "true");
  assert.equal(ib.className, "tb-input code");
  assert.equal($(b as HTMLElement, ".tb-error").getAttribute("role"), "alert");
  assert.equal(ib.getAttribute("aria-describedby"), $(b as HTMLElement, ".tb-error").id);
  assert.equal($(m.root, "textarea").className, "tb-textarea");
  assert.equal($(m.root, "select").className, "tb-select-native");
  await m.unmount();
});

test("clerk-appearance: Core-3 names, literal colours from the tokens, 6px, Nunito, CSS vars that exist", { skip: distSkip }, async () => {
  const { clerkAppearance } = (await import(new URL("../dist/clerk-appearance.js", import.meta.url).href)) as typeof import("../src/clerk-appearance.ts");
  const tokensCss = readFileSync(join(root, "src/tokens.css"), "utf8");
  for (const theme of ["light", "dark"] as const) {
    const a = clerkAppearance(theme);
    assert.equal(a.cssLayerName, "clerk");
    assert.equal(a.variables.borderRadius, "6px");
    assert.match(String(a.variables.colorPrimary), /^#[0-9a-f]{6}$/);
    assert.match(String(a.variables.fontFamily), /Nunito/);
    assert.equal(a.options.logoPlacement, "none");
    for (const m of JSON.stringify(a.elements).matchAll(/var\((--tb-[a-z0-9-]+)\)/g))
      assert.match(tokensCss, new RegExp(`${m[1]}\\s*:`), `${m[1]} in clerk elements`);
  }
});

test("0.2.1: the Select value keeps descenders (overflow clip + margin wins) and AppIcon initials are upright", { skip: distSkip }, () => {
  const comps = readFileSync(join(root, "dist/components.css"), "utf8");
  const last = (sel: string) => comps.lastIndexOf(sel);
  assert.ok(last(".tb-select-trigger .tb-select-value") > comps.lastIndexOf(".tb-select-value { overflow: hidden"));
  assert.match(comps.slice(last(".tb-select-trigger .tb-select-value")), /overflow: clip;\s*overflow-clip-margin: 0\.35em;/);
  assert.match(comps.slice(comps.lastIndexOf(".tb-app-icon {")), /font-style: normal/);
  assert.match(comps.slice(comps.lastIndexOf("button.tb-choice {")), /border: 0;[\s\S]*font: inherit;/);
});
