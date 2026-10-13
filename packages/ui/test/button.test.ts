/** Button family: variant/size classes, legacy variant names, C128 ink wrapping, arrow, IconButton, CloseButton, Avatar, ButtonLink. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { $, $$, click, h, mount, skip, ui } from "./dom.ts";

const cls = (el: Element) => el.getAttribute("class");

test("variants map to exact class strings", { skip }, async () => {
  const { Button } = await ui();
  const cases: [string | undefined, string][] = [
    [undefined, "tb-btn"],
    ["secondary", "tb-btn"],
    ["primary", "tb-btn primary"],
    ["quiet", "tb-btn quiet"],
    ["danger", "tb-btn danger"],
  ];
  for (const [variant, expected] of cases) {
    const m = await mount(h(Button, { variant: variant as never }, "Go"));
    assert.equal(cls($(m.root, "button")), expected, `variant ${variant}`);
    await m.unmount();
  }
});

test("danger + confirm adds the filled confirm step; confirm is ignored on other variants", { skip }, async () => {
  const { Button } = await ui();
  const m = await mount(h(Button, { variant: "danger", confirm: true }, "Delete"));
  assert.equal(cls($(m.root, "button")), "tb-btn danger confirm");
  await m.rerender(h(Button, { variant: "primary", confirm: true }, "Go"));
  assert.equal(cls($(m.root, "button")), "tb-btn primary");
  await m.unmount();
});

test("legacy 0.1.x variants: accent → primary, ghost → quiet, destructive → danger", { skip }, async () => {
  const { Button } = await ui();
  const cases: [string, string][] = [
    ["accent", "tb-btn primary"],
    ["ghost", "tb-btn quiet"],
    ["destructive", "tb-btn danger"],
  ];
  for (const [variant, expected] of cases) {
    const m = await mount(h(Button, { variant: variant as never }, "Go"));
    assert.equal(cls($(m.root, "button")), expected, `legacy ${variant}`);
    await m.unmount();
  }
  const m = await mount(h(Button, { variant: "destructive", confirm: true }, "Go"));
  assert.equal(cls($(m.root, "button")), "tb-btn danger confirm");
  await m.unmount();
});

test("sizes sm/lg add a class, md adds none; block adds block; className is appended", { skip }, async () => {
  const { Button } = await ui();
  const m = await mount(h(Button, { size: "sm" }, "A"));
  assert.equal(cls($(m.root, "button")), "tb-btn sm");
  await m.rerender(h(Button, { size: "lg" }, "A"));
  assert.equal(cls($(m.root, "button")), "tb-btn lg");
  await m.rerender(h(Button, { size: "md" }, "A"));
  assert.equal(cls($(m.root, "button")), "tb-btn");
  await m.rerender(h(Button, { block: true, variant: "primary", size: "lg", className: "extra" }, "A"));
  assert.equal(cls($(m.root, "button")), "tb-btn primary lg block extra");
  await m.unmount();
});

test("type defaults to button and can be overridden; disabled attribute and click suppression", { skip }, async () => {
  const { Button } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Button, { onClick: () => seen.push("x") }, "Go"));
  const b = $(m.root, "button") as HTMLButtonElement;
  assert.equal(b.getAttribute("type"), "button");
  assert.equal(b.hasAttribute("disabled"), false);
  await click(b);
  assert.deepEqual(seen, ["x"]);
  await m.rerender(h(Button, { type: "submit", disabled: true, onClick: () => seen.push("y") }, "Go"));
  assert.equal(b.getAttribute("type"), "submit");
  assert.equal(b.hasAttribute("disabled"), true);
  await click(b);
  assert.deepEqual(seen, ["x"]);
  await m.unmount();
});

test("C128: a text label is wrapped in span.tb-ink; element children are not wrapped", { skip }, async () => {
  const { Button, Count } = await ui();
  const m = await mount(h(Button, null, "Save"));
  const b = $(m.root, "button");
  assert.equal(b.children.length, 1);
  assert.equal(b.firstElementChild?.tagName, "SPAN");
  assert.equal(cls(b.firstElementChild as Element), "tb-ink");
  assert.equal(b.firstElementChild?.textContent, "Save");
  await m.rerender(h(Button, null, "Inbox ", h(Count, null, "3")));
  const kids = [...$(m.root, "button").children];
  assert.equal(kids.length, 2);
  assert.equal(cls(kids[0] as Element), "tb-ink");
  assert.equal(kids[0]?.textContent, "Inbox"); // text trimmed
  assert.equal(cls(kids[1] as Element), "tb-count"); // the Count is a direct child, not inside .tb-ink
  assert.equal($$(m.root, ".tb-ink .tb-count").length, 0);
  await m.unmount();
});

test("arrow adds svg.tb-arrow (aria-hidden) after the label; absent otherwise", { skip }, async () => {
  const { Button } = await ui();
  const m = await mount(h(Button, { arrow: true }, "Continue"));
  const b = $(m.root, "button");
  const svg = $(b, "svg.tb-arrow");
  assert.equal(svg.getAttribute("aria-hidden"), "true");
  assert.equal(b.lastElementChild, svg);
  await m.rerender(h(Button, null, "Continue"));
  assert.equal($$(m.root, "svg").length, 0);
  await m.unmount();
});

test("IconButton: aria-label and title come from label; type button; class tb-icon-btn", { skip }, async () => {
  const { IconButton } = await ui();
  const seen: number[] = [];
  const m = await mount(h(IconButton, { label: "Search", onClick: () => seen.push(1), className: "x" }, h("i", null, "S")));
  const b = $(m.root, "button");
  assert.equal(b.getAttribute("aria-label"), "Search");
  assert.equal(b.getAttribute("title"), "Search");
  assert.equal(b.getAttribute("type"), "button");
  assert.equal(cls(b), "tb-icon-btn x");
  await click(b);
  assert.deepEqual(seen, [1]);
  await m.unmount();
});

test("CloseButton: default text Close in .tb-ink, class tb-close, custom label", { skip }, async () => {
  const { CloseButton } = await ui();
  const m = await mount(h(CloseButton));
  const b = $(m.root, "button");
  assert.equal(cls(b), "tb-close");
  assert.equal(b.getAttribute("type"), "button");
  assert.equal($(b, ".tb-ink").textContent, "Close");
  await m.rerender(h(CloseButton, { label: "Dismiss" }));
  assert.equal($(m.root, ".tb-ink").textContent, "Dismiss");
  await m.unmount();
});

test("Avatar: initials in .tb-ink, aria-label from label, class tb-avatar", { skip }, async () => {
  const { Avatar } = await ui();
  const m = await mount(h(Avatar, { initials: "MK", label: "Account: Martin" }));
  const b = $(m.root, "button");
  assert.equal(cls(b), "tb-avatar");
  assert.equal(b.getAttribute("aria-label"), "Account: Martin");
  assert.equal($(b, ".tb-ink").textContent, "MK");
  assert.equal(b.getAttribute("type"), "button");
  await m.unmount();
});

test("ButtonLink renders an <a class=tb-btn ...> with variants, href and arrow", { skip }, async () => {
  const { ButtonLink } = await ui();
  const m = await mount(h(ButtonLink, { href: "/next", variant: "primary", size: "sm", block: true, arrow: true }, "Next"));
  const a = $(m.root, "a");
  assert.equal(cls(a), "tb-btn primary sm block");
  assert.equal(a.getAttribute("href"), "/next");
  assert.equal($(a, ".tb-ink").textContent, "Next");
  assert.ok($(a, "svg.tb-arrow"));
  await m.rerender(h(ButtonLink, { href: "/x", variant: "ghost" }, "Back"));
  assert.equal(cls($(m.root, "a")), "tb-btn quiet");
  await m.unmount();
});

test("TextLink: tb-link, optional arrow", { skip }, async () => {
  const { TextLink } = await ui();
  const m = await mount(h(TextLink, { href: "/docs", arrow: true }, "Docs"));
  const a = $(m.root, "a");
  assert.equal(cls(a), "tb-link");
  assert.equal(a.getAttribute("href"), "/docs");
  assert.ok($(a, "svg.tb-arrow"));
  await m.unmount();
});

test("buttonClass() builds the class string without rendering", { skip }, async () => {
  const { buttonClass } = await ui();
  assert.equal(buttonClass({}), "tb-btn");
  assert.equal(buttonClass({ variant: "primary" }), "tb-btn primary");
  assert.equal(buttonClass({ variant: "accent", size: "lg" }), "tb-btn primary lg");
  assert.equal(buttonClass({ variant: "danger", confirm: true, block: true, className: "z" }), "tb-btn danger confirm block z");
  assert.equal(buttonClass({ variant: "quiet", confirm: true }), "tb-btn quiet");
});
