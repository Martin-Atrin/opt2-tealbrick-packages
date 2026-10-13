/** AppShell + AppHeader (0.2.x markup): brand/mark, pages as real links, accessible names, badges, navigation clicks. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { $, $$, act, h, mount, skip, ui } from "./dom.ts";

const cls = (el: Element) => el.getAttribute("class");

const PAGES = [
  { id: "library", label: "Library" },
  { id: "holds", label: "Holds", badge: 3 },
  { id: "receipts", label: "Receipts", badge: 0 },
  { id: "keys", label: "" },
];

const shell = async (props: Record<string, unknown> = {}) => {
  const { AppShell } = await ui();
  return mount(h(AppShell, { title: "Knowledge", pages: PAGES, current: "holds", onNavigate: () => {}, ...props }, h("p", { id: "body" }, "page body")));
};

/** Dispatch a cancelable left click (optionally with modifiers) and report whether it was default-prevented. */
async function clickWith(el: Element, init: MouseEventInit = {}): Promise<boolean> {
  const ev = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init });
  await act(async () => {
    el.dispatchEvent(ev);
  });
  return ev.defaultPrevented;
}

test("title: h1.tb-shell-title holds the AppMark (icon + name); nav is labelled '<title> pages'", { skip }, async () => {
  const m = await shell();
  const h1 = $(m.root, "h1.tb-shell-title");
  const mark = $(h1, ".tb-app-mark");
  assert.equal(mark.lastElementChild?.textContent, "Knowledge");
  assert.equal(h1.textContent, "KKnowledge"); // blank icon initial + name (no art given)
  assert.ok($(mark, "i.tb-app-icon.s32"));
  const nav = $(m.root, "nav.tb-shell-nav");
  assert.equal(nav.getAttribute("aria-label"), "Knowledge pages");
  assert.equal($(m.root, "main.tb-shell-main #body").textContent, "page body");
  await m.unmount();
});

test("pages: every page is <a class=tb-tab> with href ?page=<id> and an accessible name", { skip }, async () => {
  const m = await shell();
  const links = $$(m.root, "nav a");
  assert.equal(links.length, PAGES.length);
  assert.deepEqual(
    links.map((a) => a.getAttribute("class")),
    ["tb-tab", "tb-tab", "tb-tab", "tb-tab"],
  );
  assert.deepEqual(
    links.map((a) => a.getAttribute("href")),
    ["?page=library", "?page=holds", "?page=receipts", "?page=keys"],
  );
  assert.deepEqual(
    links.map((a) => a.getAttribute("aria-label")),
    ["Library", "Holds, 3", "Receipts", "keys"], // zero badge omitted; empty label falls back to the id
  );
  assert.equal($(links[3] as Element, ".tb-ink").textContent, "keys");
  await m.unmount();
});

test("pageHref: custom hrefs; ids are URI-encoded by the default", { skip }, async () => {
  const m = await shell({ pageHref: (id: string) => `/app/${id}` });
  assert.deepEqual(
    $$(m.root, "nav a").map((a) => a.getAttribute("href")),
    ["/app/library", "/app/holds", "/app/receipts", "/app/keys"],
  );
  await m.unmount();
  const m2 = await shell({ pages: [{ id: "a b&c", label: "Odd" }], current: "a b&c" });
  assert.equal($(m2.root, "nav a").getAttribute("href"), "?page=a%20b%26c");
  await m2.unmount();
});

test("aria-current=page only on the current page", { skip }, async () => {
  const m = await shell({ current: "holds" });
  assert.deepEqual(
    $$(m.root, "nav a").map((a) => a.getAttribute("aria-current")),
    [null, "page", null, null],
  );
  await m.rerender(h((await ui()).AppShell, { title: "Knowledge", pages: PAGES, current: "library", onNavigate: () => {} }, "x"));
  assert.deepEqual(
    $$(m.root, "nav a").map((a) => a.getAttribute("aria-current")),
    ["page", null, null, null],
  );
  await m.unmount();
});

test("badge: .tb-count inside an aria-hidden span; zero, empty and null badges are not shown", { skip }, async () => {
  const m = await shell({ pages: [...PAGES, { id: "x", label: "X", badge: "" }, { id: "y", label: "Y", badge: null }, { id: "z", label: "Z", badge: "new" }] });
  const links = $$(m.root, "nav a");
  const holds = links[1] as Element;
  const wrap = $(holds, "span[aria-hidden]");
  assert.equal(wrap.getAttribute("aria-hidden"), "true");
  assert.equal($(wrap, ".tb-count").textContent, "3");
  assert.equal($$(holds, ".tb-ink .tb-count").length, 0);
  assert.equal($$(links[0] as Element, ".tb-count").length, 0);
  assert.equal($$(links[2] as Element, ".tb-count").length, 0); // badge 0
  assert.equal($$(links[4] as Element, ".tb-count").length, 0); // badge ""
  assert.equal($$(links[5] as Element, ".tb-count").length, 0); // badge null
  assert.equal($(links[6] as Element, ".tb-count").textContent, "new");
  assert.equal(links[6]?.getAttribute("aria-label"), "Z, new");
  await m.unmount();
});

test("click: a plain click calls onNavigate(id) and is default-prevented; modified clicks do not", { skip }, async () => {
  const seen: string[] = [];
  const m = await shell({ onNavigate: (id: string) => seen.push(id), pageHref: (id: string) => `#${id}` });
  const links = $$(m.root, "nav a");
  assert.equal(await clickWith(links[0] as Element), true);
  assert.deepEqual(seen, ["library"]);
  assert.equal(await clickWith(links[2] as Element), true);
  assert.deepEqual(seen, ["library", "receipts"]);
  for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    assert.equal(await clickWith(links[1] as Element, init), false, JSON.stringify(init));
  }
  assert.deepEqual(seen, ["library", "receipts"]);
  await m.unmount();
});

test("with colour: root is .tb-shell.is-app with --app; mark chip links to portalHref", { skip }, async () => {
  const m = await shell({ colour: "var(--tb-app-knowledge)", portalHref: "/portal" });
  const root = $(m.root, ".tb-shell");
  assert.equal(cls(root), "tb-shell is-app");
  assert.match(root.getAttribute("style") ?? "", /--app:\s*var\(--tb-app-knowledge\)/);
  const brand = $(m.root, "header a.tb-brand");
  assert.equal(brand.getAttribute("href"), "/portal");
  assert.equal(brand.getAttribute("aria-label"), "Tealbrick Portal");
  const chip = $(brand, ".tb-mark-chip");
  const img = $(chip, "img.tb-mark");
  assert.match(img.getAttribute("src") ?? "", /^data:image\/png;base64,/);
  assert.equal(img.getAttribute("alt"), "");
  assert.equal($$(m.root, ".tb-wordmark").length, 0);
  assert.equal($(m.root, "header .tb-divider").getAttribute("aria-hidden"), "true");
  await m.unmount();
});

test("without colour: neutral header with the lockup (a.tb-brand + wordmark Tealbrick), no chip", { skip }, async () => {
  const m = await shell();
  const root = $(m.root, ".tb-shell");
  assert.equal(cls(root), "tb-shell");
  assert.equal(root.hasAttribute("style"), false);
  const brand = $(m.root, "header a.tb-brand");
  assert.equal(brand.getAttribute("href"), "/");
  assert.equal(brand.getAttribute("aria-label"), "Tealbrick Portal");
  assert.equal($(brand, ".tb-wordmark").textContent, "Tealbrick");
  assert.equal($$(m.root, ".tb-mark-chip").length, 0);
  assert.equal($$(m.root, ".tb-divider").length, 0);
  await m.rerender(h((await ui()).AppShell, { title: "K", pages: PAGES, current: "holds", onNavigate: () => {}, portalHref: "/home" }, "x"));
  assert.equal($(m.root, "header a.tb-brand").getAttribute("href"), "/home");
  await m.unmount();
});

test("art: the AppMark icon shows the app's still; icon prop (deprecated) replaces it", { skip }, async () => {
  const { appArt } = await ui();
  const { still, colour } = appArt("knowledge", "/kit/apps") ?? { still: "" };
  const art = { still, colour }; // 1x only: happy-dom drops image-set()
  const m = await shell({ art });
  const icon = $(m.root, "h1 i.tb-app-icon");
  assert.equal(icon.hasAttribute("class"), true);
  assert.equal(cls(icon)?.includes("is-blank"), false);
  assert.match(icon.getAttribute("style") ?? "", /knowledge@1x\.webp/);
  await m.unmount();
  const m2 = await shell({ icon: h("b", { id: "custom" }, "*") });
  assert.equal($(m2.root, "h1 .tb-app-mark #custom").textContent, "*");
  assert.equal($$(m2.root, "h1 .tb-app-icon").length, 0);
  assert.equal($(m2.root, "h1 .tb-app-mark").lastElementChild?.textContent, "Knowledge");
  await m2.unmount();
});

test("actions, banner and footer render in their slots only when given", { skip }, async () => {
  const bare = await shell();
  assert.equal($$(bare.root, ".tb-head-actions").length, 0);
  assert.equal($$(bare.root, ".tb-shell-banner").length, 0);
  assert.equal($$(bare.root, ".tb-shell-foot").length, 0);
  await bare.unmount();
  const m = await shell({ actions: h("button", { id: "acct" }, "Me"), banner: h("p", null, "Heads up"), footer: h("span", null, "v1") });
  assert.equal($(m.root, "header .tb-head-actions #acct").textContent, "Me");
  assert.equal($(m.root, "main .tb-shell-banner").textContent, "Heads up");
  assert.equal($(m.root, "main footer.tb-shell-foot").textContent, "v1");
  await m.unmount();
});

test("STANDARD_PAGES ids; shellPageName rules", { skip }, async () => {
  const { STANDARD_PAGES, shellPageName } = await ui();
  assert.deepEqual(
    STANDARD_PAGES.map((p) => p.id),
    ["holds", "receipts", "agents", "keys", "backups"],
  );
  assert.equal(STANDARD_PAGES.find((p) => p.id === "agents")?.label, "Agents & scopes");
  assert.equal(shellPageName({ id: "holds", label: "Holds", badge: 3 }), "Holds, 3");
  assert.equal(shellPageName({ id: "holds", label: "Holds" }), "Holds");
  assert.equal(shellPageName({ id: "holds", label: "Holds", badge: 0 }), "Holds");
  assert.equal(shellPageName({ id: "holds", label: "Holds", badge: "" }), "Holds");
  assert.equal(shellPageName({ id: "holds", label: "Holds", badge: null }), "Holds");
  assert.equal(shellPageName({ id: "holds", label: "", badge: 2 }), "holds, 2");
  assert.equal(shellPageName({ id: "holds", label: "   " }), "holds");
  assert.equal(shellPageName({ id: "holds", label: "  Holds  " }), "Holds");
  assert.equal(shellPageName({ id: "k", label: "Keys", badge: "new" }), "Keys, new");
});

test("AppHeader: header.tb-head with the default Lockup (sub Portal), slot children, actions", { skip }, async () => {
  const { AppHeader } = await ui();
  const m = await mount(h(AppHeader, { actions: h("button", { id: "acct" }, "Me") }, h("input", { id: "search" })));
  const head = $(m.root, "header.tb-head");
  const brand = $(head, "a.tb-brand");
  assert.equal($(brand, ".tb-brand-sub").textContent, "Portal");
  assert.equal($(brand, ".tb-wordmark").textContent, "Tealbrick");
  assert.equal(brand.getAttribute("aria-label"), "Tealbrick Portal home");
  assert.ok($(head, ".tb-head-slot #search"));
  assert.equal($(head, ".tb-head-actions #acct").textContent, "Me");
  await m.rerender(h(AppHeader, { className: "x", brand: h("span", { id: "own" }, "Own") }));
  const head2 = $(m.root, "header.tb-head");
  assert.equal(cls(head2), "tb-head x");
  assert.equal($(head2, "#own").textContent, "Own");
  assert.equal($$(head2, ".tb-brand").length, 0);
  assert.equal($$(head2, ".tb-head-actions").length, 0); // no actions → no wrapper
  assert.equal($$(head2, ".tb-head-slot").length, 1);
  await m.unmount();
});
