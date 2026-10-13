/** Select: ARIA select-only combobox (DESIGN-SYSTEM §5a): states, keyboard, ARIA, Field wiring, 0.1.x onChange. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { $, $$, click, h, key, mount, skip, ui } from "./dom.ts";

const OPTIONS = [
  { value: "new", label: "Create new project…" },
  { value: "agents", label: "novak-agents", disabled: true, meta: "used by another workspace" },
  { value: "sandbox", label: "studio-sandbox" },
  { value: "staging", label: "staging" },
];

test("closed: combobox trigger with value, listbox hidden, ARIA wired", { skip }, async () => {
  const { Select } = await ui();
  const m = await mount(h(Select, { options: OPTIONS, value: "sandbox", "aria-label": "Destination" }));
  const t = $(m.root, ".tb-select-trigger");
  const list = $(m.root, '[role="listbox"]');
  assert.equal(t.getAttribute("role"), "combobox");
  assert.equal(t.getAttribute("aria-haspopup"), "listbox");
  assert.equal(t.getAttribute("aria-expanded"), "false");
  assert.equal(t.getAttribute("aria-controls"), list.id);
  assert.equal(t.getAttribute("aria-label"), "Destination");
  assert.equal(t.hasAttribute("aria-activedescendant"), false);
  assert.equal(list.hidden, true);
  assert.equal($(m.root, ".tb-select-value").textContent, "studio-sandbox");
  const opts = $$(m.root, '[role="option"]');
  assert.equal(opts.length, 4);
  assert.deepEqual(
    opts.map((o) => o.getAttribute("aria-selected")),
    ["false", "false", "true", "false"],
  );
  assert.equal(opts[1]?.getAttribute("aria-disabled"), "true");
  assert.match(opts[0]?.innerHTML ?? "", /class="tb-ink"/); // C128 label in .tb-ink
  await m.unmount();
});

test("keyboard: Down opens on the selected option, Down skips disabled, Home/End, Enter chooses, focus stays", { skip }, async () => {
  const { Select } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Select, { options: OPTIONS, defaultValue: "new", onValueChange: (v: string) => seen.push(v), "aria-label": "Destination" }));
  const t = $(m.root, ".tb-select-trigger");
  const active = () => m.root.querySelector(".tb-option.is-active")?.textContent;
  t.focus();
  await key(t, "ArrowDown");
  assert.equal(t.getAttribute("aria-expanded"), "true");
  assert.equal($(m.root, '[role="listbox"]').hidden, false);
  assert.equal(active(), "Create new project…");
  assert.equal(t.getAttribute("aria-activedescendant"), $(m.root, ".tb-option.is-active").id);
  await key(t, "ArrowDown"); // skips the disabled option
  assert.equal(active(), "studio-sandbox");
  await key(t, "End");
  assert.equal(active(), "staging");
  await key(t, "Home");
  assert.equal(active(), "Create new project…");
  await key(t, "ArrowUp"); // stays on the first enabled option
  assert.equal(active(), "Create new project…");
  await key(t, "End");
  await key(t, "Enter");
  assert.deepEqual(seen, ["staging"]);
  assert.equal(t.getAttribute("aria-expanded"), "false");
  assert.equal($(m.root, ".tb-select-value").textContent, "staging");
  assert.equal(document.activeElement, t);
  await m.unmount();
});

test("keyboard: Space opens and chooses, Esc closes without choosing, Tab closes, typing jumps", { skip }, async () => {
  const { Select } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Select, { options: OPTIONS, defaultValue: "new", onValueChange: (v: string) => seen.push(v), "aria-label": "Destination" }));
  const t = $(m.root, ".tb-select-trigger");
  await key(t, " ");
  assert.equal(t.getAttribute("aria-expanded"), "true");
  await key(t, "ArrowDown");
  const esc = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
  const { act } = await import("react");
  await act(async () => {
    t.dispatchEvent(esc);
  });
  assert.equal(t.getAttribute("aria-expanded"), "false");
  assert.equal(esc.defaultPrevented, true); // an open listbox eats Esc (a dialog around it stays open)
  assert.deepEqual(seen, []);
  await key(t, "s"); // type-ahead opens on the first enabled match
  assert.equal(t.getAttribute("aria-expanded"), "true");
  assert.equal(m.root.querySelector(".tb-option.is-active")?.textContent, "studio-sandbox");
  await key(t, "t"); // "st" → still studio-sandbox (first match)
  assert.equal(m.root.querySelector(".tb-option.is-active")?.textContent, "studio-sandbox");
  await key(t, "Tab");
  assert.equal(t.getAttribute("aria-expanded"), "false");
  await key(t, " ");
  await key(t, " ");
  assert.deepEqual(seen, ["new"]);
  await m.unmount();
});

test("mouse: click opens, a click on an option chooses, a disabled option does nothing, outside pointer closes", { skip }, async () => {
  const { Select } = await ui();
  const seen: string[] = [];
  const m = await mount(h(Select, { options: OPTIONS, onValueChange: (v: string) => seen.push(v), placeholder: "Pick one", "aria-label": "Destination" }));
  const t = $(m.root, ".tb-select-trigger");
  assert.equal($(m.root, ".tb-select-value").textContent, "Pick one");
  assert.ok($(m.root, ".tb-select-value").classList.contains("is-placeholder"));
  await click(t);
  assert.equal(t.getAttribute("aria-expanded"), "true");
  await click($$(m.root, '[role="option"]')[1] as HTMLElement); // disabled
  assert.deepEqual(seen, []);
  assert.equal(t.getAttribute("aria-expanded"), "true");
  await click($$(m.root, '[role="option"]')[2] as HTMLElement);
  assert.deepEqual(seen, ["sandbox"]);
  assert.equal(t.getAttribute("aria-expanded"), "false");
  await click(t);
  const { act } = await import("react");
  await act(async () => {
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
  });
  assert.equal(t.getAttribute("aria-expanded"), "false");
  await m.unmount();
});

test("0.1.x onChange(e) still works; name adds a hidden input; disabled trigger does not open", { skip }, async () => {
  const { Select } = await ui();
  const seen: string[] = [];
  const m = await mount(
    h(Select, { options: OPTIONS, value: "new", name: "dest", onChange: (e: { target: { value: string } }) => seen.push(e.target.value), "aria-label": "Destination" }),
  );
  const t = $(m.root, ".tb-select-trigger");
  await key(t, "ArrowDown");
  await key(t, "ArrowDown");
  await key(t, "Enter");
  assert.deepEqual(seen, ["sandbox"]);
  assert.equal(($(m.root, 'input[type="hidden"]') as HTMLInputElement).name, "dest");
  await m.rerender(h(Select, { options: OPTIONS, value: "new", disabled: true, "aria-label": "Destination" }));
  assert.equal((t as HTMLButtonElement).disabled, true);
  await key(t, "ArrowDown");
  assert.equal(t.getAttribute("aria-expanded"), "false");
  await m.unmount();
});

test("inside a Field: labelled by the label + value, described by the hint, invalid on error", { skip }, async () => {
  const { Field, Select } = await ui();
  const m = await mount(h(Field, { label: "Destination", error: "Pick a project." }, h(Select, { options: OPTIONS, value: "new" })));
  const t = $(m.root, ".tb-select-trigger");
  const label = $(m.root, ".tb-label");
  const value = $(m.root, ".tb-select-value");
  assert.equal(t.getAttribute("aria-labelledby"), `${label.id} ${value.id}`);
  assert.equal(t.getAttribute("aria-describedby"), $(m.root, ".tb-error").id);
  assert.equal(t.getAttribute("aria-invalid"), "true");
  assert.equal($(m.root, '[role="listbox"]').getAttribute("aria-labelledby"), label.id);
  // a click on an option inside the <label> chooses once and does not re-open the list (no label activation)
  await click(t);
  await click($$(m.root, '[role="option"]')[3] as HTMLElement);
  assert.equal(t.getAttribute("aria-expanded"), "false");
  await m.unmount();
});
