/** Identity: BrandMark, Lockup, AppIcon, AppMark and the apps.ts helpers. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { $, $$, h, mount, skip, ui } from "./dom.ts";

const cls = (el: Element) => el.getAttribute("class");

test("BrandMark: img.tb-mark with a PNG data URI, empty alt, width 36 / height 29 by default", { skip }, async () => {
  const { BrandMark, BRAND_MARK_SRC, BRAND_MARK_WIDTH, BRAND_MARK_HEIGHT } = await ui();
  const m = await mount(h(BrandMark));
  const img = $(m.root, "img");
  assert.equal(cls(img), "tb-mark");
  assert.match(img.getAttribute("src") ?? "", /^data:image\/png;base64,/);
  assert.equal(img.getAttribute("src"), BRAND_MARK_SRC);
  assert.equal(img.getAttribute("alt"), "");
  assert.equal(img.getAttribute("width"), "36");
  assert.equal(img.getAttribute("height"), String(Math.round((36 * BRAND_MARK_HEIGHT) / BRAND_MARK_WIDTH)));
  assert.equal(img.getAttribute("height"), "29");
  assert.equal(BRAND_MARK_WIDTH, 108);
  assert.equal(BRAND_MARK_HEIGHT, 88);
  await m.unmount();
});

test("BrandMark: width prop scales the height; legacy size prop sets the width; className appended", { skip }, async () => {
  const { BrandMark } = await ui();
  const m = await mount(h(BrandMark, { width: 30 }));
  let img = $(m.root, "img");
  assert.equal(img.getAttribute("width"), "30");
  assert.equal(img.getAttribute("height"), "24"); // round(30*88/108) = 24.44
  await m.rerender(h(BrandMark, { size: 54, className: "big" }));
  img = $(m.root, "img");
  assert.equal(img.getAttribute("width"), "54");
  assert.equal(img.getAttribute("height"), "44");
  assert.equal(cls(img), "tb-mark big");
  await m.rerender(h(BrandMark, { width: 10, size: 108 })); // size wins
  assert.equal($(m.root, "img").getAttribute("width"), "108");
  assert.equal($(m.root, "img").getAttribute("height"), "88");
  await m.unmount();
});

test("Lockup: a.tb-brand with mark, wordmark and accessible name", { skip }, async () => {
  const { Lockup } = await ui();
  const m = await mount(h(Lockup));
  const a = $(m.root, "a");
  assert.equal(cls(a), "tb-brand");
  assert.equal(a.getAttribute("href"), "/");
  assert.equal(a.getAttribute("aria-label"), "Tealbrick home");
  assert.equal($(a, "img.tb-mark").getAttribute("alt"), "");
  assert.equal($(a, ".tb-wordmark").textContent, "Tealbrick");
  assert.equal($$(a, ".tb-brand-sub").length, 0);
  await m.rerender(h(Lockup, { sub: "Portal", href: "/p" }));
  assert.equal($(m.root, "a").getAttribute("aria-label"), "Tealbrick Portal home");
  assert.equal($(m.root, "a").getAttribute("href"), "/p");
  assert.equal($(m.root, ".tb-brand-sub").textContent, "Portal");
  await m.rerender(h(Lockup, { sub: "Portal", label: "Go home", className: "x" }));
  assert.equal($(m.root, "a").getAttribute("aria-label"), "Go home");
  assert.equal(cls($(m.root, "a")), "tb-brand x");
  await m.rerender(h(Lockup, { sub: h("b", null, "node") }));
  assert.equal($(m.root, "a").getAttribute("aria-label"), "Tealbrick home"); // non-string sub: generic name
  await m.unmount();
});

const ART = { still: "/kit/apps/knowledge@1x.webp", still2x: "/kit/apps/knowledge@2x.webp", colour: "var(--tb-app-knowledge)" };

test("AppIcon with art: background-image uses image-set with both URLs; decorative → aria-hidden", { skip }, async () => {
  const { AppIcon } = await ui();
  // happy-dom's CSS parser drops image-set(), so assert the server markup (the exact style string React emits)
  const { renderToStaticMarkup } = await import("react-dom/server");
  const html = renderToStaticMarkup(h(AppIcon, { art: ART, name: "Knowledge" }));
  const style = /style="([^"]*)"/.exec(html)?.[1] ?? "";
  assert.match(style, /background-image:image-set\(/);
  assert.ok(style.includes("/kit/apps/knowledge@1x.webp"));
  assert.ok(style.includes("/kit/apps/knowledge@2x.webp"));
  assert.match(style, /1x/);
  assert.match(style, /2x/);
  const m = await mount(h(AppIcon, { art: ART, name: "Knowledge" }));
  const i = $(m.root, "i");
  assert.equal(cls(i), "tb-app-icon");
  assert.equal(i.getAttribute("aria-hidden"), "true");
  assert.equal(i.hasAttribute("role"), false);
  assert.equal(i.textContent, ""); // no initial when art is present
  await m.unmount();
});

test("AppIcon with art but no 2x: plain url()", { skip }, async () => {
  const { AppIcon } = await ui();
  const m = await mount(h(AppIcon, { art: { still: "/only.webp" } }));
  const style = $(m.root, "i").getAttribute("style") ?? "";
  assert.ok(style.includes("/only.webp"));
  assert.doesNotMatch(style, /image-set/);
  await m.unmount();
});

test("AppIcon sizes: 48 adds no class; 16 → s16, 24 → s24, 32 → s32, 64 → s64", { skip }, async () => {
  const { AppIcon } = await ui();
  const m = await mount(h(AppIcon, { art: ART }));
  assert.equal(cls($(m.root, "i")), "tb-app-icon");
  for (const [size, expected] of [
    [16, "tb-app-icon s16"],
    [24, "tb-app-icon s24"],
    [32, "tb-app-icon s32"],
    [48, "tb-app-icon"],
    [64, "tb-app-icon s64"],
  ] as const) {
    await m.rerender(h(AppIcon, { art: ART, size }));
    assert.equal(cls($(m.root, "i")), expected, `size ${size}`);
  }
  await m.unmount();
});

test("AppIcon with label: role=img + aria-label, not aria-hidden", { skip }, async () => {
  const { AppIcon } = await ui();
  const m = await mount(h(AppIcon, { art: ART, label: "Knowledge app" }));
  const i = $(m.root, "i");
  assert.equal(i.getAttribute("role"), "img");
  assert.equal(i.getAttribute("aria-label"), "Knowledge app");
  assert.equal(i.hasAttribute("aria-hidden"), false);
  await m.unmount();
});

test("AppIcon without art: is-blank with the uppercase initial in .tb-ink", { skip }, async () => {
  const { AppIcon } = await ui();
  const m = await mount(h(AppIcon, { name: "  knowledge" }));
  const i = $(m.root, "i");
  assert.equal(cls(i), "tb-app-icon is-blank");
  assert.equal($(i, ".tb-ink").textContent, "K");
  assert.equal(i.getAttribute("aria-hidden"), "true");
  assert.equal(i.hasAttribute("style"), false);
  await m.rerender(h(AppIcon, { name: "mesh", size: 16, art: null, label: "Mesh" }));
  const j = $(m.root, "i");
  assert.equal(cls(j), "tb-app-icon s16 is-blank");
  assert.equal(j.getAttribute("role"), "img");
  assert.equal(j.getAttribute("aria-label"), "Mesh");
  assert.equal($(j, ".tb-ink").textContent, "M");
  await m.rerender(h(AppIcon, {}));
  assert.equal($(m.root, ".tb-ink").textContent, ""); // no name → empty initial
  await m.unmount();
});

test("AppIcon animated: a muted looping <video> (aria-hidden) inside the icon", { skip }, async () => {
  const { AppIcon } = await ui();
  const m = await mount(h(AppIcon, { art: ART, animated: { src: "/loop.webm" } }));
  const v = $(m.root, "i video");
  assert.equal(v.getAttribute("src"), "/loop.webm");
  assert.equal(v.hasAttribute("muted") || (v as HTMLVideoElement).muted === true, true);
  assert.equal(v.hasAttribute("loop"), true);
  assert.equal(v.hasAttribute("autoplay"), true);
  assert.equal(v.hasAttribute("playsinline"), true);
  assert.equal(v.getAttribute("aria-hidden"), "true");
  await m.rerender(h(AppIcon, { art: ART }));
  assert.equal($$(m.root, "video").length, 0);
  await m.unmount();
});

test("AppMark: .tb-app-mark with the icon and the name", { skip }, async () => {
  const { AppMark } = await ui();
  const m = await mount(h(AppMark, { name: "Knowledge", art: ART }));
  const mark = $(m.root, ".tb-app-mark");
  assert.equal(mark.tagName, "SPAN");
  assert.equal(cls($(mark, "i")), "tb-app-icon s32"); // default size 32
  assert.equal($(mark, "i").getAttribute("aria-hidden"), "true");
  assert.equal(mark.lastElementChild?.tagName, "SPAN");
  assert.equal(mark.lastElementChild?.textContent, "Knowledge");
  await m.rerender(h(AppMark, { name: "Mesh", size: 48, className: "big" }));
  const mark2 = $(m.root, ".tb-app-mark");
  assert.equal(cls(mark2), "tb-app-mark big");
  assert.equal(cls($(mark2, "i")), "tb-app-icon is-blank");
  assert.equal($(mark2, ".tb-ink").textContent, "M");
  await m.unmount();
});

test("appArt: still, still2x and colour for a known id; trailing slash tolerated", { skip }, async () => {
  const { appArt } = await ui();
  assert.deepEqual(appArt("knowledge", "/kit/apps"), {
    still: "/kit/apps/knowledge@1x.webp",
    still2x: "/kit/apps/knowledge@2x.webp",
    colour: "var(--tb-app-knowledge)",
  });
  assert.equal(appArt("knowledge", "/kit/apps/")?.still, "/kit/apps/knowledge@1x.webp");
  assert.equal(appArt("kanban", "/b")?.still, "/b/work-ethic-kanban@1x.webp");
  assert.equal(appArt("connect", "/kit/apps")?.still, "/kit/apps/marketplace@1x.webp");
  assert.equal(appArt("connect", "/kit/apps")?.still2x, "/kit/apps/marketplace@2x.webp");
  assert.equal(appArt("connect", "/kit/apps")?.colour, "var(--tb-app-connect)");
  assert.equal(appArt("nope", "/kit/apps"), null);
});

test("appColour: var(--tb-app-<id>) for kit ids, undefined otherwise", { skip }, async () => {
  const { appColour, APP_COLOUR_IDS } = await ui();
  assert.equal(appColour("mesh"), "var(--tb-app-mesh)");
  assert.equal(appColour("knowledge"), "var(--tb-app-knowledge)");
  assert.equal(appColour("nope"), undefined);
  assert.equal(appColour(""), undefined);
  assert.equal(APP_COLOUR_IDS.length, 13);
  for (const id of APP_COLOUR_IDS) assert.equal(appColour(id), `var(--tb-app-${id})`);
});

test("appName: public name for known ids, the id otherwise", { skip }, async () => {
  const { appName } = await ui();
  assert.equal(appName("kanban"), "Task Board");
  assert.equal(appName("knowledge"), "Knowledge");
  assert.equal(appName("inbox"), "Operator Inbox");
  assert.equal(appName("unknown-app"), "unknown-app");
});

test("iconCrop: 150 at 16, 125 at 24-32, 100 from 48", { skip }, async () => {
  const { iconCrop } = await ui();
  assert.equal(iconCrop(16), 150);
  assert.equal(iconCrop(24), 125);
  assert.equal(iconCrop(32), 125);
  assert.equal(iconCrop(48), 100);
  assert.equal(iconCrop(64), 100);
});
