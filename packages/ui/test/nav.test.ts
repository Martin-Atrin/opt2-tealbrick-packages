/** Nav: Tabs (ARIA tabs, roving tabindex), Menu (popover), Toast, PayPill. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { $, $$, act, click, h, key, mount, skip, ui, wait } from "./dom.ts";

const cls = (el: Element) => el.getAttribute("class");

const TABS = [
  { value: "all", label: "All" },
  { value: "mine", label: "Mine", badge: 3 },
  { value: "done", label: "Done", badge: 0 },
];

test("Tabs: tablist + aria-label, tab roles, aria-selected, roving tabindex, label in .tb-ink", { skip }, async () => {
  const { Tabs } = await ui();
  const m = await mount(h(Tabs, { label: "Views", tabs: TABS, value: "mine", onChange: () => {} }));
  const list = $(m.root, '[role="tablist"]');
  assert.equal(list.getAttribute("aria-label"), "Views");
  assert.equal(cls(list), "tb-tabs");
  const tabs = $$(list, '[role="tab"]');
  assert.equal(tabs.length, 3);
  assert.deepEqual(
    tabs.map((t) => t.getAttribute("aria-selected")),
    ["false", "true", "false"],
  );
  assert.deepEqual(
    tabs.map((t) => t.getAttribute("tabindex")),
    ["-1", "0", "-1"],
  );
  assert.deepEqual(
    tabs.map((t) => t.getAttribute("type")),
    ["button", "button", "button"],
  );
  assert.deepEqual(
    tabs.map((t) => t.getAttribute("class")),
    ["tb-tab", "tb-tab", "tb-tab"],
  );
  assert.deepEqual(
    tabs.map((t) => $(t, ".tb-ink").textContent),
    ["All", "Mine", "Done"],
  );
  assert.equal(tabs[0]?.hasAttribute("aria-controls"), false);
  await m.unmount();
});

test("Tabs: badge renders a .tb-count (not for 0 or undefined)", { skip }, async () => {
  const { Tabs } = await ui();
  const m = await mount(h(Tabs, { label: "Views", tabs: TABS, value: "all", onChange: () => {} }));
  const tabs = $$(m.root, '[role="tab"]');
  assert.equal($$(tabs[0] as Element, ".tb-count").length, 0);
  assert.equal($(tabs[1] as Element, ".tb-count").textContent, "3");
  assert.equal($$(tabs[2] as Element, ".tb-count").length, 0);
  // the count is a sibling of the label, not inside it
  assert.equal($$(tabs[1] as Element, ".tb-ink .tb-count").length, 0);
  await m.rerender(h(Tabs, { label: "Views", tabs: [{ value: "a", label: "A", badge: "new" }, { value: "b", label: "B", badge: "" }], value: "a", onChange: () => {} }));
  const t2 = $$(m.root, '[role="tab"]');
  assert.equal($(t2[0] as Element, ".tb-count").textContent, "new");
  assert.equal($$(t2[1] as Element, ".tb-count").length, 0);
  await m.unmount();
});

test("Tabs: aria-controls points at ${panelId}-${value} only when panelId is given", { skip }, async () => {
  const { Tabs } = await ui();
  const m = await mount(h(Tabs, { label: "Views", tabs: TABS, value: "all", onChange: () => {}, panelId: "panel" }));
  assert.deepEqual(
    $$(m.root, '[role="tab"]').map((t) => t.getAttribute("aria-controls")),
    ["panel-all", "panel-mine", "panel-done"],
  );
  await m.unmount();
});

test("Tabs keyboard: ArrowRight/ArrowLeft wrap, Home/End jump; each calls onChange and moves focus", { skip }, async () => {
  const { Tabs } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Tabs, { label: "Views", tabs: TABS, value: "all", onChange: (v: string) => seen.push(v) }));
  const tabs = () => $$(m.root, '[role="tab"]');
  const first = tabs()[0] as HTMLElement;
  first.focus();
  await key(first, "ArrowRight");
  assert.deepEqual(seen, ["mine"]);
  assert.equal(document.activeElement, tabs()[1]);
  await key(tabs()[1] as Element, "ArrowRight");
  await key(tabs()[2] as Element, "ArrowRight"); // wraps to first
  assert.deepEqual(seen, ["mine", "done", "all"]);
  assert.equal(document.activeElement, tabs()[0]);
  await key(tabs()[0] as Element, "ArrowLeft"); // wraps to last
  assert.deepEqual(seen.slice(3), ["done"]);
  assert.equal(document.activeElement, tabs()[2]);
  await key(tabs()[2] as Element, "ArrowLeft");
  assert.equal(seen.at(-1), "mine");
  await key(tabs()[1] as Element, "Home");
  assert.equal(seen.at(-1), "all");
  await key(tabs()[0] as Element, "End");
  assert.equal(seen.at(-1), "done");
  assert.equal(document.activeElement, tabs()[2]);
  await key(tabs()[2] as Element, "ArrowDown"); // Down behaves like Right (wraps)
  assert.equal(seen.at(-1), "all");
  await key(tabs()[0] as Element, "ArrowUp"); // Up behaves like Left (wraps)
  assert.equal(seen.at(-1), "done");
  const count = seen.length;
  await key(tabs()[2] as Element, "Enter"); // unrelated keys do nothing
  await key(tabs()[2] as Element, "a");
  assert.equal(seen.length, count);
  await m.unmount();
});

test("Tabs: handled keys are default-prevented; click selects", { skip }, async () => {
  const { Tabs } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Tabs, { label: "Views", tabs: TABS, value: "all", onChange: (v: string) => seen.push(v) }));
  const tabs = $$(m.root, '[role="tab"]');
  const ev = new KeyboardEvent("keydown", { key: "End", bubbles: true, cancelable: true });
  await act(async () => {
    (tabs[0] as Element).dispatchEvent(ev);
  });
  assert.equal(ev.defaultPrevented, true);
  const other = new KeyboardEvent("keydown", { key: "x", bubbles: true, cancelable: true });
  await act(async () => {
    (tabs[0] as Element).dispatchEvent(other);
  });
  assert.equal(other.defaultPrevented, false);
  seen.length = 0;
  await click(tabs[1] as Element);
  assert.deepEqual(seen, ["mine"]);
  await m.unmount();
});

test("Menu: trigger has aria-haspopup, aria-expanded false→true on click, popover .tb-menu appears", { skip }, async () => {
  const { Menu } = await ui();
  const m = await mount(h(Menu, { label: "More actions", trigger: "More" }, h("button", { type: "button" }, "Rename"), h("a", { href: "/x" }, "Open")));
  const t = $(m.root, "button.tb-btn");
  assert.equal(t.getAttribute("aria-haspopup"), "true");
  assert.equal(t.getAttribute("aria-expanded"), "false");
  assert.equal(t.getAttribute("aria-label"), "More actions");
  assert.equal(t.hasAttribute("aria-controls"), false);
  assert.equal(cls(t), "tb-btn quiet");
  assert.equal($(t, ".tb-ink").textContent, "More");
  assert.equal($$(m.root, ".tb-menu").length, 0);
  await click(t);
  assert.equal(t.getAttribute("aria-expanded"), "true");
  const pop = $(m.root, ".tb-menu");
  assert.equal(pop.tagName, "NAV");
  assert.equal(pop.getAttribute("aria-label"), "More actions");
  assert.equal(t.getAttribute("aria-controls"), pop.id);
  assert.equal($$(pop, "button, a").length, 2);
  assert.equal(cls(pop), "tb-menu");
  assert.equal(document.activeElement, $$(pop, "button, a")[0]); // first item gets focus
  await click(t); // trigger toggles it closed
  assert.equal(t.getAttribute("aria-expanded"), "false");
  assert.equal($$(m.root, ".tb-menu").length, 0);
  await m.unmount();
});

test("Menu: Escape closes and returns focus to the trigger; Arrow keys move between items", { skip }, async () => {
  const { Menu } = await ui();
  const m = await mount(h(Menu, { label: "Actions", trigger: "Actions" }, h("button", { type: "button" }, "One"), h("button", { type: "button" }, "Two"), h("button", { type: "button" }, "Three")));
  const t = $(m.root, "button.tb-btn");
  await click(t);
  const items = () => $$(m.root, ".tb-menu button");
  assert.equal(document.activeElement, items()[0]);
  await key(items()[0] as Element, "ArrowDown");
  assert.equal(document.activeElement, items()[1]);
  await key(items()[1] as Element, "ArrowDown");
  assert.equal(document.activeElement, items()[2]);
  await key(items()[2] as Element, "ArrowDown"); // wraps
  assert.equal(document.activeElement, items()[0]);
  await key(items()[0] as Element, "ArrowUp"); // wraps back
  assert.equal(document.activeElement, items()[2]);
  const esc = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
  await act(async () => {
    (items()[2] as Element).dispatchEvent(esc);
  });
  assert.equal(esc.defaultPrevented, true);
  assert.equal(t.getAttribute("aria-expanded"), "false");
  assert.equal($$(m.root, ".tb-menu").length, 0);
  assert.equal(document.activeElement, t);
  // Escape while closed does nothing special
  const esc2 = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
  await act(async () => {
    t.dispatchEvent(esc2);
  });
  assert.equal(esc2.defaultPrevented, false);
  await m.unmount();
});

test("Menu: clicking an item runs it and closes the menu; an outside pointer closes", { skip }, async () => {
  const { Menu } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Menu, { label: "Actions", trigger: "Actions", variant: "primary", align: "start" }, h("button", { type: "button", onClick: () => seen.push("rename") }, "Rename")));
  const t = $(m.root, "button.tb-btn");
  assert.equal(cls(t), "tb-btn primary");
  await click(t);
  assert.equal(cls($(m.root, ".tb-menu")), "tb-menu start");
  await click($(m.root, ".tb-menu button"));
  assert.deepEqual(seen, ["rename"]);
  assert.equal(t.getAttribute("aria-expanded"), "false");
  assert.equal($$(m.root, ".tb-menu").length, 0);
  await click(t);
  assert.equal(t.getAttribute("aria-expanded"), "true");
  await act(async () => {
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  assert.equal(t.getAttribute("aria-expanded"), "false");
  await m.unmount();
});

test("Menu: legacy <li> children render inside <ul class=tb-menu>", { skip }, async () => {
  const { Menu } = await ui();
  const m = await mount(h(Menu, { label: "Old", trigger: "Old" }, h("li", { key: "a" }, h("button", { type: "button" }, "A")), h("li", { key: "b" }, h("a", { href: "/b" }, "B"))));
  await click($(m.root, "button.tb-btn"));
  const pop = $(m.root, ".tb-menu");
  assert.equal(pop.tagName, "UL");
  assert.equal($$(pop, "li").length, 2);
  assert.equal(document.activeElement, $(pop, "li button")); // first item focusable through li > button
  await m.unmount();
});

test("Toast: open=false renders nothing; open renders role=status aria-live=polite with the message", { skip }, async () => {
  const { Toast } = await ui();
  const m = await mount(h(Toast, { open: false }, "Saved"));
  assert.equal($$(m.root, ".tb-toast").length, 0);
  assert.equal(m.root.innerHTML, "");
  await m.rerender(h(Toast, { open: true }, "Saved"));
  const t = $(m.root, ".tb-toast");
  assert.equal(t.getAttribute("role"), "status");
  assert.equal(t.getAttribute("aria-live"), "polite");
  assert.equal($(t, "span").textContent, "Saved");
  assert.equal($$(t, "button").length, 0); // no actions without onClose / actionLabel
  await m.unmount();
});

test("Toast: action button (.tb-link) calls onAction; Close calls onClose", { skip }, async () => {
  const { Toast } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Toast, { open: true, actionLabel: "Undo", onAction: () => seen.push("undo"), onClose: () => seen.push("close") }, "Deleted"));
  const action = $(m.root, "button.tb-link");
  assert.equal(action.textContent, "Undo");
  assert.equal(action.getAttribute("type"), "button");
  await click(action);
  assert.deepEqual(seen, ["undo"]);
  const close = $(m.root, ".tb-toast-actions button.tb-btn");
  assert.equal(cls(close), "tb-btn quiet sm");
  assert.equal($(close, ".tb-ink").textContent, "Close");
  await click(close);
  assert.deepEqual(seen, ["undo", "close"]);
  await m.unmount();
});

test("Toast: auto-closes after duration when there is no action; not with an action; duration 0 stays", { skip }, async () => {
  const { Toast } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Toast, { open: true, duration: 30, onClose: () => seen.push("auto") }, "Saved"));
  assert.deepEqual(seen, []);
  await wait(60);
  assert.deepEqual(seen, ["auto"]);
  await m.unmount();

  const withAction = await mount(h(Toast, { open: true, duration: 30, actionLabel: "Undo", onClose: () => seen.push("with-action") }, "Deleted"));
  await wait(60);
  assert.deepEqual(seen, ["auto"]);
  await withAction.unmount();

  const zero = await mount(h(Toast, { open: true, duration: 0, onClose: () => seen.push("zero") }, "Stays"));
  await wait(60);
  assert.deepEqual(seen, ["auto"]);
  await zero.unmount();

  const closed = await mount(h(Toast, { open: false, duration: 30, onClose: () => seen.push("closed") }, "x"));
  await wait(60);
  assert.deepEqual(seen, ["auto"]);
  await closed.unmount();
});

test("PayPill: count 0 (or less) renders nothing", { skip }, async () => {
  const { PayPill } = await ui();
  const m = await mount(h(PayPill, { count: 0, unpaid: true, onOpen: () => {} }));
  assert.equal(m.root.innerHTML, "");
  await m.rerender(h(PayPill, { count: -1, unpaid: false, onOpen: () => {} }));
  assert.equal(m.root.innerHTML, "");
  await m.unmount();
});

test("PayPill: unpaid class, singular/plural aria-label, onOpen, contains .tb-count", { skip }, async () => {
  const { PayPill } = await ui();
  const seen: number[] = [];
  const m = await mount(h(PayPill, { count: 1, unpaid: false, onOpen: () => seen.push(1) }));
  const b = () => $(m.root, "button");
  assert.equal(cls(b()), "tb-paypill");
  assert.equal(b().getAttribute("type"), "button");
  assert.equal(b().getAttribute("aria-haspopup"), "dialog");
  assert.equal(b().getAttribute("aria-label"), "Review licences, 1 app in cart");
  assert.equal($(b(), ".tb-count").textContent, "1");
  assert.equal($(b(), "small").textContent, "1 app in your workspace");
  assert.ok($(b(), "svg[aria-hidden]"));
  await click(b());
  assert.deepEqual(seen, [1]);
  await m.rerender(h(PayPill, { count: 3, unpaid: true, onOpen: () => seen.push(3), label: "Pay now" }));
  assert.equal(cls(b()), "tb-paypill unpaid");
  assert.equal(b().getAttribute("aria-label"), "Pay now, 3 apps in cart, unpaid");
  assert.equal($(b(), ".tb-count").textContent, "3");
  assert.equal($(b(), "small").textContent, "3 apps in your workspace");
  await click(b());
  assert.deepEqual(seen, [1, 3]);
  await m.unmount();
});
