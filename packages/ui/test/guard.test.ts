/** check-system (the guard every surface runs in CI): fires on every off-system value and on the wrong shape, stays
    quiet on the token forms (L34: tested both ways), and the kit's own source and dist are clean. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { checkText } from "../src/bin/check-system.ts";

const root = join(import.meta.dirname, "..");
const kinds = (text: string, file = "x.css") => checkText(text, file).map((h) => h.kind);

test("fires on raw colours, foreign fonts, off radii, weights, shadows, font imports and scrollbar restyles", () => {
  assert.deepEqual(kinds(".a { color: #ff0000; }"), ["colour"]);
  assert.deepEqual(kinds(".a { background: rgb(1 2 3); }"), ["colour"]);
  assert.deepEqual(kinds(".a { font-family: Georgia, serif; }"), ["font"]);
  assert.deepEqual(kinds(".a { border-radius: 2px; }"), ["radius"]);
  assert.deepEqual(kinds(".a { font-weight: 600; }"), ["weight"]);
  assert.deepEqual(kinds(".a { box-shadow: 0 1px 2px black; }"), ["shadow"]);
  assert.deepEqual(kinds('@import url("https://fonts.googleapis.com/css2?family=Nunito");'), ["font-import"]);
  assert.deepEqual(kinds('import "@fontsource-variable/geist";', "main.ts"), ["font-import"]);
  assert.deepEqual(kinds(".a { scrollbar-width: none; }"), ["scrollbar"]);
});

test("fires on JS style objects with literal values (borderRadius / fontFamily / fontWeight)", () => {
  assert.deepEqual(kinds("const s = { borderRadius: 999 };", "x.tsx"), ["radius"]);
  assert.deepEqual(kinds('const s = { borderRadius: "4px" };', "x.tsx"), ["radius"]);
  assert.deepEqual(kinds('const s = { fontFamily: "Geist" };', "x.tsx"), ["font"]);
  assert.deepEqual(kinds("const s = { fontWeight: 550 };", "x.tsx"), ["weight"]);
});

test("stays quiet on the token forms", () => {
  assert.deepEqual(
    kinds(".a { color: var(--tb-ink); border-radius: var(--tb-radius-brick); font-family: var(--tb-font); font-weight: 800; box-shadow: var(--tb-ring); }"),
    [],
  );
  assert.deepEqual(kinds('const s = { borderRadius: "var(--tb-radius-pill)", fontWeight: 900, fontFamily: "var(--tb-font-mono)" };', "x.tsx"), []);
  assert.deepEqual(kinds('import "@fontsource-variable/nunito";', "main.ts"), []);
  assert.deepEqual(kinds(".a { color: #ff0000; } /* check-system: allow (specimen) */"), []);
});

test("shape (C125/C126): a pill radius on a brick element fails; a brick radius on a pill element fails; the right pairs pass", () => {
  assert.deepEqual(kinds(".pg-btn { border-radius: var(--tb-radius-pill); }"), ["shape"]);
  assert.deepEqual(kinds(".save-button { border-radius: 999px; }"), ["radius", "shape"]);
  assert.deepEqual(kinds(".my-card { border-radius: 50%; }"), ["radius", "shape"]);
  assert.deepEqual(kinds(".tb-chip.filter { border-radius: var(--tb-radius-brick); }"), ["shape"]);
  assert.deepEqual(kinds(".row .tag { border-radius: var(--tb-radius-brick); }"), ["shape"]);
  assert.deepEqual(kinds(".pg-btn { border-radius: var(--tb-radius-brick); } .tb-chip { border-radius: var(--tb-radius-pill); }"), []);
  // pill words inside another class name are not pills (the brand mark's tile in the app-colour header is a brick)
  assert.deepEqual(kinds(".tb-shell.is-app > .tb-head .tb-mark-tile { border-radius: var(--tb-radius-brick); }"), []);
});

test("Swift rules: raw Color, literal cornerRadius, system fonts", () => {
  assert.deepEqual(kinds("let c = Color(red: 1, green: 0, blue: 0)\n.cornerRadius(4)\n.font(.system(size: 13))", "View.swift"), [
    "swift-colour",
    "swift-radius",
    "swift-font",
  ]);
});

test("CLI: the kit's own src and built dist are clean; a bad tree exits 1 and names file:line; --report exits 0", () => {
  const bin = join(root, "dist/bin/check-system.js");
  for (const dir of ["src", "dist"]) {
    const r = spawnSync(process.execPath, [bin, join(root, dir)], { encoding: "utf8" });
    assert.equal(r.status, 0, `${dir}: ${r.stderr}`);
    assert.match(r.stdout, /files clean/);
  }
  const tmp = mkdtempSync(join(tmpdir(), "tb-guard-"));
  try {
    writeFileSync(join(tmp, "app.css"), ".ok { color: var(--tb-ink); }\n.bad-button { border-radius: 999px; color: #123456; }\n");
    const bad = spawnSync(process.execPath, [bin, tmp], { encoding: "utf8" });
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /app\.css:2: off-system colour: #123456/);
    assert.match(bad.stderr, /off-system shape: pill radius on brick element \.bad-button/);
    const rep = spawnSync(process.execPath, [bin, tmp, "--report"], { encoding: "utf8" });
    assert.equal(rep.status, 0);
    const ign = spawnSync(process.execPath, [bin, tmp, "--ignore", "app.css"], { encoding: "utf8" });
    assert.equal(ign.status, 1); // nothing left to check is an error, not a silent pass (L3)
    assert.match(ign.stderr, /no source files/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
