/** Pills: Tag, Count, Chip, ChipGroup, Switch, Segmented, StatusPill. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { $, $$, click, h, mount, skip, ui } from "./dom.ts";

const cls = (el: Element) => el.getAttribute("class");

test("Tag: status classes; default adds none; label in .tb-ink", { skip }, async () => {
  const { Tag } = await ui();
  const cases: [string | undefined, string][] = [
    [undefined, "tb-tag"],
    ["default", "tb-tag"],
    ["live", "tb-tag live"],
    ["busy", "tb-tag busy"],
    ["needs-you", "tb-tag needs-you"],
    ["idle", "tb-tag idle"],
    ["open", "tb-tag open"],
  ];
  for (const [status, expected] of cases) {
    const m = await mount(h(Tag, { status: status as never }, "Label"));
    const t = $(m.root, ".tb-tag");
    assert.equal(cls(t), expected, `status ${status}`);
    assert.equal(t.children.length, 1);
    assert.equal(cls(t.firstElementChild as Element), "tb-ink");
    assert.equal(t.textContent, "Label");
    await m.unmount();
  }
});

test("Tag: legacy tone mapping; status wins over tone; title and className pass through", { skip }, async () => {
  const { Tag, statusOf } = await ui();
  const cases: [string, string][] = [
    ["ok", "tb-tag live"],
    ["progress", "tb-tag busy"],
    ["action", "tb-tag needs-you"],
    ["blocked", "tb-tag needs-you"],
    ["neutral", "tb-tag"],
    ["live", "tb-tag live"],
  ];
  for (const [tone, expected] of cases) {
    const m = await mount(h(Tag, { tone: tone as never }, "L"));
    assert.equal(cls($(m.root, ".tb-tag")), expected, `tone ${tone}`);
    await m.unmount();
  }
  const m = await mount(h(Tag, { tone: "ok", status: "busy", title: "why", className: "k" }, "L"));
  const t = $(m.root, ".tb-tag");
  assert.equal(cls(t), "tb-tag busy k");
  assert.equal(t.getAttribute("title"), "why");
  await m.unmount();
  assert.equal(statusOf("ok"), "live");
  assert.equal(statusOf("progress"), "busy");
  assert.equal(statusOf("action"), "needs-you");
  assert.equal(statusOf("blocked"), "needs-you");
  assert.equal(statusOf("neutral"), "default");
  assert.equal(statusOf(undefined), "default");
  assert.equal(statusOf("open"), "open");
  assert.equal(statusOf("idle"), "idle");
});

test("Count: tb-count, brick default, ink tone → class ink, aria-label, text in .tb-ink", { skip }, async () => {
  const { Count } = await ui();
  const m = await mount(h(Count, null, "4"));
  let c = $(m.root, ".tb-count");
  assert.equal(cls(c), "tb-count");
  assert.equal(c.hasAttribute("aria-label"), false);
  assert.equal($(c, ".tb-ink").textContent, "4");
  await m.rerender(h(Count, { tone: "ink", label: "4 waiting" }, 4));
  c = $(m.root, ".tb-count");
  assert.equal(cls(c), "tb-count ink");
  assert.equal(c.getAttribute("aria-label"), "4 waiting");
  assert.equal(c.textContent, "4");
  await m.unmount();
});

test("Chip: aria-pressed reflects pressed, type=button, click handler, label in .tb-ink", { skip }, async () => {
  const { Chip } = await ui();
  const seen: number[] = [];
  const m = await mount(h(Chip, { onClick: () => seen.push(1) }, "Open"));
  const c = $(m.root, "button");
  assert.equal(cls(c), "tb-chip");
  assert.equal(c.getAttribute("type"), "button");
  assert.equal(c.getAttribute("aria-pressed"), "false");
  assert.equal($(c, ".tb-ink").textContent, "Open");
  await click(c);
  assert.deepEqual(seen, [1]);
  await m.rerender(h(Chip, { pressed: true }, "Open"));
  assert.equal(c.getAttribute("aria-pressed"), "true");
  await m.unmount();
});

test("ChipGroup: role=group with aria-label wrapping the chips", { skip }, async () => {
  const { Chip, ChipGroup } = await ui();
  const m = await mount(h(ChipGroup, { label: "Filter by state" }, h(Chip, { pressed: true }, "All"), h(Chip, null, "Mine")));
  const g = $(m.root, "div.tb-chips");
  assert.equal(g.getAttribute("role"), "group");
  assert.equal(g.getAttribute("aria-label"), "Filter by state");
  assert.deepEqual(
    $$(g, "button").map((b) => b.getAttribute("aria-pressed")),
    ["true", "false"],
  );
  await m.unmount();
});

test("Switch: checkbox with role=switch inside label.tb-switch-row; callbacks get true/false", { skip }, async () => {
  const { Switch } = await ui();
  const checked: boolean[] = [];
  const events: boolean[] = [];
  const m = await mount(
    h(Switch, { label: "Notifications", onCheckedChange: (on: boolean) => checked.push(on), onChange: (e: { target: { checked: boolean } }) => events.push(e.target.checked) }),
  );
  const row = $(m.root, "label");
  assert.equal(cls(row), "tb-switch-row");
  const input = $(row, "input") as HTMLInputElement;
  assert.equal(input.getAttribute("type"), "checkbox");
  assert.equal(input.getAttribute("role"), "switch");
  assert.equal(cls(input), "tb-switch");
  assert.equal($(row, "span").textContent, "Notifications");
  assert.equal(input.checked, false);
  await click(input);
  assert.equal(input.checked, true);
  await click(input);
  assert.equal(input.checked, false);
  assert.deepEqual(checked, [true, false]);
  assert.deepEqual(events, [true, false]);
  await m.unmount();
});

test("Switch: controlled checked, defaultChecked and disabled", { skip }, async () => {
  const { Switch } = await ui();
  const d = await mount(h(Switch, { label: "A", defaultChecked: true }));
  assert.equal(($(d.root, "input") as HTMLInputElement).checked, true);
  await d.unmount();
  const m = await mount(h(Switch, { label: "A", checked: false, onChange: () => {} }));
  assert.equal(($(m.root, "input") as HTMLInputElement).checked, false);
  await m.rerender(h(Switch, { label: "A", checked: true, onChange: () => {} }));
  assert.equal(($(m.root, "input") as HTMLInputElement).checked, true);
  await m.rerender(h(Switch, { label: "A", checked: true, disabled: true, onChange: () => {}, className: "z" }));
  assert.equal($(m.root, "input").hasAttribute("disabled"), true);
  assert.equal(cls($(m.root, "label")), "tb-switch-row z");
  await m.unmount();
});

test("Segmented: role=group + aria-label, exactly one pressed, click calls onChange with the value", { skip }, async () => {
  const { Segmented } = await ui();
  const seen: string[] = [];
  const options = [
    { value: "canvas", label: "Canvas" },
    { value: "list", label: "List" },
  ];
  const m = await mount(h(Segmented, { label: "View", options, value: "canvas", onChange: (v: string) => seen.push(v) }));
  const g = $(m.root, "div.tb-segmented");
  assert.equal(g.getAttribute("role"), "group");
  assert.equal(g.getAttribute("aria-label"), "View");
  const bs = $$(g, "button");
  assert.deepEqual(
    bs.map((b) => b.getAttribute("aria-pressed")),
    ["true", "false"],
  );
  assert.deepEqual(
    bs.map((b) => b.getAttribute("class")),
    ["tb-seg", "tb-seg"],
  );
  assert.deepEqual(
    bs.map((b) => b.getAttribute("type")),
    ["button", "button"],
  );
  assert.equal($(bs[1] as Element, ".tb-ink").textContent, "List");
  await click(bs[1] as Element);
  assert.deepEqual(seen, ["list"]);
  await m.rerender(h(Segmented, { label: "View", options, value: "list", onChange: () => {} }));
  assert.deepEqual(
    $$(g, "button").map((b) => b.getAttribute("aria-pressed")),
    ["false", "true"],
  );
  await m.unmount();
});

test("StatusPill: role=status, swatch aria-hidden with --tone, label in .tb-ink", { skip }, async () => {
  const { StatusPill } = await ui();
  const m = await mount(h(StatusPill, null, "Recording · 12:04"));
  const p = $(m.root, ".tb-status-pill");
  assert.equal(p.getAttribute("role"), "status");
  const sw = $(p, ".tb-swatch");
  assert.equal(sw.getAttribute("aria-hidden"), "true");
  assert.match(sw.getAttribute("style") ?? "", /--tone:\s*var\(--tb-brick\)/);
  assert.equal($(p, ".tb-ink").textContent, "Recording · 12:04");
  await m.rerender(h(StatusPill, { tone: "teal" }, "Synced"));
  assert.match($(m.root, ".tb-swatch").getAttribute("style") ?? "", /--tone:\s*var\(--tb-teal\)/);
  await m.unmount();
});
