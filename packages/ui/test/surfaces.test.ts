/** Surfaces: Card, Panel, Section, Kicker, Swatch, Notice, EmptyState, Table, Progress, CopyBlock, Choices. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { $, $$, click, h, key, mount, skip, ui } from "./dom.ts";

const cls = (el: Element) => el.getAttribute("class");

test("Card: div by default, as=section/article/aside, className appended, props pass through", { skip }, async () => {
  const { Card } = await ui();
  const m = await mount(h(Card, { id: "c1", className: "x" }, "body"));
  let el = $(m.root, "#c1");
  assert.equal(el.tagName, "DIV");
  assert.equal(cls(el), "tb-card x");
  assert.equal(el.textContent, "body");
  for (const as of ["section", "article", "aside"]) {
    await m.rerender(h(Card, { as: as as never, id: "c1" }, "b"));
    el = $(m.root, "#c1");
    assert.equal(el.tagName, as.toUpperCase());
    assert.equal(cls(el), "tb-card");
  }
  await m.unmount();
});

test("Panel: tb-panel-tint, as=section", { skip }, async () => {
  const { Panel } = await ui();
  const m = await mount(h(Panel, null, "x"));
  assert.equal($(m.root, "div").getAttribute("class"), "tb-panel-tint");
  await m.rerender(h(Panel, { as: "section", className: "k" }, "x"));
  const el = $(m.root, "section");
  assert.equal(cls(el), "tb-panel-tint k");
  await m.unmount();
});

test("Section: section.tb-section with an h2; first and danger classes", { skip }, async () => {
  const { Section } = await ui();
  const m = await mount(h(Section, { title: "Danger zone", children: h("p", null, "body") }));
  const s = $(m.root, "section");
  assert.equal(cls(s), "tb-section");
  assert.equal($(s, "h2").textContent, "Danger zone");
  assert.equal($(s, "p").textContent, "body");
  await m.rerender(h(Section, { title: "T", first: true, children: "x" }));
  assert.equal(cls($(m.root, "section")), "tb-section first");
  await m.rerender(h(Section, { title: "T", danger: true, className: "z", children: "x" }));
  assert.equal(cls($(m.root, "section")), "tb-section danger z");
  await m.rerender(h(Section, { title: "T", first: true, danger: true, children: "x" }));
  assert.equal(cls($(m.root, "section")), "tb-section first danger");
  await m.unmount();
});

test("Kicker: p.tb-kicker; group → tone-<group>, person → is-person, open → is-open", { skip }, async () => {
  const { Kicker } = await ui();
  const m = await mount(h(Kicker, null, "Memory"));
  const k = () => $(m.root, "p");
  assert.equal(cls(k()), "tb-kicker");
  assert.equal(k().textContent, "Memory");
  for (const g of ["memory", "coordination", "control", "connections", "creation"]) {
    await m.rerender(h(Kicker, { group: g as never, children: "K" }));
    assert.equal(cls(k()), `tb-kicker tone-${g}`);
  }
  await m.rerender(h(Kicker, { person: true, children: "K" }));
  assert.equal(cls(k()), "tb-kicker is-person");
  await m.rerender(h(Kicker, { open: true, children: "K" }));
  assert.equal(cls(k()), "tb-kicker is-open");
  await m.rerender(h(Kicker, { group: "control", person: true, open: true, className: "q", children: "K" }));
  assert.equal(cls(k()), "tb-kicker tone-control is-person is-open q");
  await m.unmount();
});

test("Swatch: aria-hidden, group tone and open classes", { skip }, async () => {
  const { Swatch } = await ui();
  const m = await mount(h(Swatch, null));
  const s = () => $(m.root, "span");
  assert.equal(cls(s()), "tb-swatch");
  assert.equal(s().getAttribute("aria-hidden"), "true");
  await m.rerender(h(Swatch, { group: "memory" }));
  assert.equal(cls(s()), "tb-swatch tone-memory");
  await m.rerender(h(Swatch, { open: true, className: "k" }));
  assert.equal(cls(s()), "tb-swatch is-open k");
  assert.equal(s().getAttribute("aria-hidden"), "true");
  await m.unmount();
});

test("Notice: tones, roles, body in a span", { skip }, async () => {
  const { Notice } = await ui();
  const cases: [string | undefined, string][] = [
    [undefined, "tb-notice"],
    ["neutral", "tb-notice"],
    ["live", "tb-notice live"],
    ["needs-you", "tb-notice needs-you"],
  ];
  for (const [tone, expected] of cases) {
    const m = await mount(h(Notice, { tone: tone as never, children: "Saved" }));
    const n = $(m.root, ".tb-notice");
    assert.equal(cls(n), expected, `tone ${tone}`);
    assert.equal(n.getAttribute("role"), "status");
    assert.equal(n.firstElementChild?.tagName, "SPAN");
    assert.equal(n.textContent, "Saved");
    await m.unmount();
  }
  const m = await mount(h(Notice, { tone: "needs-you", role: "alert", className: "q", children: "Failed" }));
  const n = $(m.root, ".tb-notice");
  assert.equal(n.getAttribute("role"), "alert");
  assert.equal(cls(n), "tb-notice needs-you q");
  await m.unmount();
});

test("EmptyState: h3 title, optional p, optional action", { skip }, async () => {
  const { EmptyState, Button } = await ui();
  const m = await mount(h(EmptyState, { title: "Nothing here", action: h(Button, { variant: "primary" }, "Add one") }, "Create your first item."));
  const e = $(m.root, ".tb-empty");
  assert.equal($(e, "h3").textContent, "Nothing here");
  assert.equal($(e, "p").textContent, "Create your first item.");
  assert.equal($(e, "button").getAttribute("class"), "tb-btn primary");
  assert.deepEqual(
    [...e.children].map((c) => c.tagName),
    ["H3", "P", "BUTTON"],
  );
  await m.rerender(h(EmptyState, { title: "Bare" }));
  const bare = $(m.root, ".tb-empty");
  assert.deepEqual(
    [...bare.children].map((c) => c.tagName),
    ["H3"],
  );
  await m.unmount();
});

test("Table: table.tb-table with className appended and children kept", { skip }, async () => {
  const { Table } = await ui();
  const m = await mount(
    h(
      Table,
      { className: "wide", "aria-label": "Ledger" },
      h("thead", null, h("tr", null, h("th", null, "Name"))),
      h("tbody", null, h("tr", null, h("td", null, "A"))),
    ),
  );
  const t = $(m.root, "table");
  assert.equal(cls(t), "tb-table wide");
  assert.equal(t.getAttribute("aria-label"), "Ledger");
  assert.equal($$(t, "th").length, 1);
  assert.equal($(t, "td").textContent, "A");
  await m.unmount();
});

test("Progress: determinate value rounded and clamped 0..100; indeterminate has no aria-valuenow", { skip }, async () => {
  const { Progress } = await ui();
  const m = await mount(h(Progress, { value: 42.6, label: "Upload" }));
  const p = () => $(m.root, ".tb-progress");
  assert.equal(p().getAttribute("role"), "progressbar");
  assert.equal(p().getAttribute("aria-label"), "Upload");
  assert.equal(p().getAttribute("aria-valuemin"), "0");
  assert.equal(p().getAttribute("aria-valuemax"), "100");
  assert.equal(p().getAttribute("aria-valuenow"), "43");
  assert.equal(p().getAttribute("data-indeterminate"), "false");
  assert.match(p().getAttribute("style") ?? "", /--value:\s*42\.6%/);
  assert.ok(p().querySelector("span"));
  await m.rerender(h(Progress, { value: 150, label: "Upload" }));
  assert.equal(p().getAttribute("aria-valuenow"), "100");
  assert.match(p().getAttribute("style") ?? "", /--value:\s*100%/);
  await m.rerender(h(Progress, { value: -20, label: "Upload" }));
  assert.equal(p().getAttribute("aria-valuenow"), "0");
  assert.match(p().getAttribute("style") ?? "", /--value:\s*0%/);
  await m.rerender(h(Progress, { value: 0, label: "Upload" }));
  assert.equal(p().getAttribute("aria-valuenow"), "0");
  assert.equal(p().getAttribute("data-indeterminate"), "false");
  await m.rerender(h(Progress, { label: "Working" }));
  assert.equal(p().hasAttribute("aria-valuenow"), false);
  assert.equal(p().getAttribute("data-indeterminate"), "true");
  assert.equal(p().getAttribute("aria-label"), "Working");
  assert.equal(p().getAttribute("aria-valuemin"), "0");
  assert.equal(p().getAttribute("aria-valuemax"), "100");
  assert.doesNotMatch(p().getAttribute("style") ?? "", /--value/);
  await m.unmount();
});

test("CopyBlock: code shows the text; Copy button has aria-label 'Copy <label>'; copies via clipboard", { skip }, async () => {
  const { CopyBlock } = await ui();
  const written: string[] = [];
  const nav = globalThis.navigator as unknown as Record<string, unknown>;
  const original = Object.getOwnPropertyDescriptor(nav, "clipboard");
  Object.defineProperty(nav, "clipboard", { configurable: true, value: { writeText: async (t: string) => void written.push(t) } });
  try {
    const m = await mount(h(CopyBlock, { text: "npm i @opt2-tealbrick/ui" }));
    assert.equal($(m.root, "code").textContent, "npm i @opt2-tealbrick/ui");
    const b = $(m.root, "button");
    assert.equal(b.getAttribute("aria-label"), "Copy command");
    assert.equal(b.getAttribute("type"), "button");
    assert.equal(cls(b), "tb-btn sm quiet");
    assert.equal($(b, ".tb-ink").textContent, "Copy");
    await click(b);
    assert.deepEqual(written, ["npm i @opt2-tealbrick/ui"]);
    assert.equal($(m.root, "button .tb-ink").textContent, "Copied");
    await m.rerender(h(CopyBlock, { text: "x", label: "install command" }));
    assert.equal($(m.root, "button").getAttribute("aria-label"), "Copy install command");
    await m.unmount();
  } finally {
    if (original) Object.defineProperty(nav, "clipboard", original);
    else Reflect.deleteProperty(nav, "clipboard");
  }
});

test("CopyBlock: a failing clipboard leaves the label as Copy", { skip }, async () => {
  const { CopyBlock } = await ui();
  const nav = globalThis.navigator as unknown as Record<string, unknown>;
  const original = Object.getOwnPropertyDescriptor(nav, "clipboard");
  Object.defineProperty(nav, "clipboard", {
    configurable: true,
    value: {
      writeText: async () => {
        throw new Error("denied");
      },
    },
  });
  try {
    const m = await mount(h(CopyBlock, { text: "x" }));
    await click($(m.root, "button"));
    assert.equal($(m.root, "button .tb-ink").textContent, "Copy");
    await m.unmount();
  } finally {
    if (original) Object.defineProperty(nav, "clipboard", original);
    else Reflect.deleteProperty(nav, "clipboard");
  }
});

const CHOICES = [
  { value: "a", title: "Alpha", body: "First" },
  { value: "b", title: "Beta", disabled: true, note: "Not available" },
  { value: "c", title: "Gamma" },
  { value: "d", title: "Delta" },
];

test("Choices: radiogroup, radio roles, aria-checked, roving tabindex, title/body/note", { skip }, async () => {
  const { Choices } = await ui();
  const m = await mount(h(Choices, { label: "Plan", options: CHOICES, value: "c", onChange: () => {} }));
  const g = $(m.root, ".tb-choices");
  assert.equal(g.getAttribute("role"), "radiogroup");
  assert.equal(g.getAttribute("aria-label"), "Plan");
  const rs = $$(g, '[role="radio"]');
  assert.equal(rs.length, 4);
  assert.deepEqual(
    rs.map((r) => r.getAttribute("aria-checked")),
    ["false", "false", "true", "false"],
  );
  assert.deepEqual(
    rs.map((r) => r.getAttribute("tabindex")),
    ["-1", "-1", "0", "-1"],
  );
  assert.deepEqual(
    rs.map((r) => r.getAttribute("aria-disabled")),
    [null, "true", null, null],
  );
  assert.equal($(rs[0] as Element, ".tb-choice-title").textContent, "Alpha");
  assert.equal($(rs[0] as Element, ".tb-choice-body").textContent, "First");
  assert.equal($(rs[1] as Element, ".tb-choice-body").textContent, "Not available");
  assert.equal(rs[0]?.getAttribute("type"), "button");
  await m.unmount();
});

test("Choices: with no value, the first enabled option is the tab stop", { skip }, async () => {
  const { Choices } = await ui();
  const opts = [
    { value: "x", title: "X", disabled: true },
    { value: "y", title: "Y" },
    { value: "z", title: "Z" },
  ];
  const m = await mount(h(Choices, { label: "P", options: opts, value: null, onChange: () => {} }));
  assert.deepEqual(
    $$(m.root, '[role="radio"]').map((r) => r.getAttribute("tabindex")),
    ["-1", "0", "-1"],
  );
  assert.deepEqual(
    $$(m.root, '[role="radio"]').map((r) => r.getAttribute("aria-checked")),
    ["false", "false", "false"],
  );
  await m.unmount();
});

test("Choices keyboard: ArrowDown/ArrowRight go to the next ENABLED option and call onChange; ArrowUp/Left wrap", { skip }, async () => {
  const { Choices } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Choices, { label: "Plan", options: CHOICES, value: "a", onChange: (v: string) => seen.push(v) }));
  const rs = () => $$(m.root, '[role="radio"]');
  const first = rs()[0] as HTMLElement;
  first.focus();
  await key(first, "ArrowDown"); // skips disabled b → c
  assert.deepEqual(seen, ["c"]);
  assert.equal(document.activeElement, rs()[2]);
  await key(rs()[2] as Element, "ArrowRight"); // c → d
  assert.deepEqual(seen, ["c", "d"]);
  assert.equal(document.activeElement, rs()[3]);
  await key(rs()[3] as Element, "ArrowDown"); // d wraps to a
  assert.deepEqual(seen, ["c", "d", "a"]);
  assert.equal(document.activeElement, rs()[0]);
  await key(rs()[0] as Element, "ArrowUp"); // a wraps back to d
  assert.deepEqual(seen, ["c", "d", "a", "d"]);
  await key(rs()[3] as Element, "ArrowLeft"); // d → c
  assert.deepEqual(seen, ["c", "d", "a", "d", "c"]);
  await key(rs()[2] as Element, "ArrowUp"); // c → a (skips disabled b)
  assert.deepEqual(seen, ["c", "d", "a", "d", "c", "a"]);
  await key(rs()[0] as Element, "Enter"); // other keys do nothing
  assert.equal(seen.length, 6);
  await m.unmount();
});

test("Choices: arrow keys are default-prevented; a disabled option ignores click, an enabled one calls onChange", { skip }, async () => {
  const { Choices } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Choices, { label: "Plan", options: CHOICES, value: "a", onChange: (v: string) => seen.push(v) }));
  const rs = $$(m.root, '[role="radio"]');
  const ev = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
  const { act } = await import("./dom.ts");
  await act(async () => {
    (rs[0] as Element).dispatchEvent(ev);
  });
  assert.equal(ev.defaultPrevented, true);
  seen.length = 0;
  await click(rs[1] as Element);
  assert.deepEqual(seen, []);
  assert.equal(rs[1]?.getAttribute("aria-disabled"), "true");
  await click(rs[3] as Element);
  assert.deepEqual(seen, ["d"]);
  await m.unmount();
});
