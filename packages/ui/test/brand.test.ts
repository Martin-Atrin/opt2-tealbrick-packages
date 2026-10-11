/**
 * Brand guard (PRD v2 §7.3): teal + burgundy only, never green or orange; uniform 2 px radius (single documented
 * exception: the pay pill, kept "as is", DECISION-LOG C14); never dots (no round status markers or handles).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = ["tokens.css", "components.css"].map((f) => readFileSync(new URL(`../src/${f}`, import.meta.url), "utf8")).join("\n");

function hue(hex: string): { h: number; c: number } {
  const v = hex.length === 4 ? [...hex.slice(1)].map((c) => c + c).join("") : hex.slice(1, 7);
  const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(v.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return { h: 0, c: 0 };
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return { h, c: d };
}

test("no green or orange colours", () => {
  for (const hex of css.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) ?? []) {
    const { h, c } = hue(hex);
    if (c < 0.12) continue; // near-neutral (paper, lines, greys)
    assert.ok(!(h >= 18 && h <= 50), `${hex} reads orange (hue ${h.toFixed(0)})`);
    assert.ok(!(h >= 75 && h <= 160), `${hex} reads green (hue ${h.toFixed(0)})`);
  }
});

test("every radius is the 2px token, except the pay pill (as is)", () => {
  const rules = css.split("}").map((r) => r.trim());
  for (const rule of rules) {
    const m = rule.match(/border-radius:\s*([^;]+);?/);
    if (!m) continue;
    const value = (m[1] ?? "").trim();
    const selector = rule.slice(0, rule.indexOf("{")).trim();
    if (value === "var(--tb-radius)" || value === "0" || value === "inherit") continue;
    if (selector.includes("tb-paypill")) continue;
    if (/^0 var\(--tb-radius\) var\(--tb-radius\) 0$/.test(value)) continue;
    assert.fail(`${selector} uses border-radius ${value}`);
  }
  assert.match(css, /--tb-radius:\s*2px/);
});

test("no round markers outside the pay pill", () => {
  const rules = css.split("}");
  for (const rule of rules) {
    if (rule.includes("50%") && rule.includes("border-radius") && !rule.includes("tb-paypill")) assert.fail(`round shape in: ${rule.trim().slice(0, 80)}`);
  }
});
