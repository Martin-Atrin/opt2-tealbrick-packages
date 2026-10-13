/** StepFlow (C126 + C128) and Dialog: one step at a time, the "n-Name" row, Previous/Skip/Next, fade, focus, keyboard. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { $, $$, act, click, h, mount, skip, ui, wait } from "./dom.ts";

const steps = (log: string[] = []) => [
  { name: "Settings", render: () => h("label", null, "Name ", h("input", { id: "f-name", defaultValue: "" })) },
  { name: "Keys", optional: "Skip, add keys later", render: () => h("input", { id: "f-key" }) },
  { name: "Review", nextLabel: "Deploy", onNext: () => (log.push("deploy"), true), render: () => h("p", null, "Cost") },
  { name: "Licence", optional: "Buy later", nextLabel: "Buy licence", render: () => h("p", null, "Licence") },
];

const visible = (root: HTMLElement) => $$(root, ".tb-step").filter((s) => !s.hidden).map((s) => s.dataset.step);
const buttons = (root: HTMLElement) => $$(root, ".tb-stepflow-foot button");
const label = (b: HTMLElement | undefined) => b?.textContent ?? "";

test("renders ONE step, the step row as n-Name with aria-current, Previous disabled, Skip hidden on a required step", { skip }, async () => {
  const { StepFlow } = await ui();
  const m = await mount(h(StepFlow, { open: true, title: "Deploy Task Board", kicker: "Coordination", steps: steps(), onClose: () => {} }));
  const dlg = $(m.root, "dialog.tb-dialog.tb-stepflow");
  assert.equal(dlg.hasAttribute("open"), true);
  assert.equal(dlg.getAttribute("aria-labelledby"), $(m.root, ".tb-dialog-head h2").id);
  assert.deepEqual(
    $$(m.root, ".tb-stepflow-steps li").map((li) => li.textContent),
    ["1-Settings", "2-Keys", "3-Review", "4-Licence"],
  );
  assert.equal($$(m.root, '.tb-stepflow-steps li[aria-current="step"]').length, 1);
  assert.equal($(m.root, '.tb-stepflow-steps li[aria-current="step"]').textContent, "1-Settings");
  assert.deepEqual(visible(m.root), ["0"]);
  const [prev, skipBtn, next] = buttons(m.root);
  assert.equal(label(prev), "Previous");
  assert.equal((prev as HTMLButtonElement).disabled, true);
  assert.equal(skipBtn?.hidden, true); // C126: Skip only on optional steps
  assert.equal(label(next), "Next");
  assert.ok(next?.classList.contains("primary"));
  assert.ok(next?.classList.contains("tb-next"));
  // future steps cannot be clicked
  assert.equal(($$(m.root, ".tb-stepflow-steps button")[2] as HTMLButtonElement).disabled, true);
  await m.unmount();
});

test("Next / Skip / Previous move one step; Next label is the step's action; Previous keeps typed values", { skip }, async () => {
  const { StepFlow } = await ui();
  const log: string[] = [];
  const finished: number[] = [];
  const m = await mount(h(StepFlow, { open: true, title: "Deploy", steps: steps(log), onClose: () => {}, onFinish: () => finished.push(1) }));
  ($(m.root, "#f-name") as HTMLInputElement).value = "Front desk";
  const [prev, skipBtn, next] = buttons(m.root) as [HTMLButtonElement, HTMLButtonElement, HTMLButtonElement];
  await click(next);
  await wait(260); // fade out (--tb-dur-step 200ms) then switch
  assert.deepEqual(visible(m.root), ["1"]);
  assert.equal(skipBtn.hidden, false);
  assert.equal(label(skipBtn), "Skip, add keys later");
  assert.ok($(m.root, ".tb-stepflow-steps li").classList.contains("done"));
  assert.equal(document.activeElement?.id, "f-key"); // focus moves to the first field of the new step
  await click(skipBtn);
  await wait(260);
  assert.deepEqual(visible(m.root), ["2"]);
  assert.equal(label(next), "Deploy");
  assert.equal(skipBtn.hidden, true);
  await click(prev);
  await wait(260);
  await click(prev);
  await wait(260);
  assert.deepEqual(visible(m.root), ["0"]);
  assert.equal(($(m.root, "#f-name") as HTMLInputElement).value, "Front desk"); // all steps stay mounted
  // a done step in the row goes back; then forward to Review, Deploy runs onNext, then the last (optional) step
  await click(next);
  await wait(260);
  await click(next);
  await wait(260);
  await click(next);
  await wait(260);
  assert.deepEqual(log, ["deploy"]);
  assert.deepEqual(visible(m.root), ["3"]);
  assert.equal(label(next), "Buy licence");
  assert.equal(label(skipBtn), "Buy later");
  await click(skipBtn); // Skip on an optional LAST step finishes ("Buy later")
  assert.deepEqual(finished, [1]);
  await click($$(m.root, ".tb-stepflow-steps button")[0] as HTMLElement);
  await wait(260);
  assert.deepEqual(visible(m.root), ["0"]);
  await m.unmount();
});

test("fade: the middle gets .is-leaving during the change; reduced motion switches instantly", { skip }, async () => {
  const { StepFlow } = await ui();
  const m = await mount(h(StepFlow, { open: true, title: "Deploy", steps: steps(), onClose: () => {} }));
  const body = $(m.root, ".tb-dialog-body");
  await click(buttons(m.root)[2] as HTMLElement);
  assert.ok(body.classList.contains("is-leaving"));
  assert.deepEqual(visible(m.root), ["0"]);
  await wait(260);
  assert.equal(body.classList.contains("is-leaving"), false);
  assert.deepEqual(visible(m.root), ["1"]);
  await m.unmount();

  const mm = window.matchMedia;
  (globalThis as { matchMedia: unknown }).matchMedia = (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} });
  try {
    const r = await mount(h(StepFlow, { open: true, title: "Deploy", steps: steps(), onClose: () => {} }));
    await click(buttons(r.root)[2] as HTMLElement);
    assert.equal($(r.root, ".tb-dialog-body").classList.contains("is-leaving"), false);
    assert.deepEqual(visible(r.root), ["1"]);
    await r.unmount();
  } finally {
    (globalThis as { matchMedia: unknown }).matchMedia = mm;
  }
});

test("canNext=false disables Next; onNext=false stays; busy blocks every button and Esc", { skip }, async () => {
  const { StepFlow } = await ui();
  let closed = 0;
  const s = [
    { name: "One", canNext: false, render: () => h("p", null, "1") },
    { name: "Two", render: () => h("p", null, "2") },
  ];
  const m = await mount(h(StepFlow, { open: true, title: "T", steps: s, onClose: () => closed++ }));
  assert.equal((buttons(m.root)[2] as HTMLButtonElement).disabled, true);
  const stay = [{ name: "One", onNext: async () => false, render: () => h("p", null, "1") }, s[1]];
  await m.rerender(h(StepFlow, { open: true, title: "T", steps: stay, onClose: () => closed++ }));
  await click(buttons(m.root)[2] as HTMLElement);
  await wait(260);
  assert.deepEqual(visible(m.root), ["0"]);
  await m.rerender(h(StepFlow, { open: true, title: "T", steps: s, busy: true, onClose: () => closed++ }));
  for (const b of buttons(m.root)) assert.equal((b as HTMLButtonElement).disabled, true);
  assert.equal(($(m.root, ".tb-close") as HTMLButtonElement).disabled, true);
  await act(async () => {
    $(m.root, "dialog").dispatchEvent(new Event("cancel", { cancelable: true }));
  });
  assert.equal(closed, 0);
  await m.rerender(h(StepFlow, { open: true, title: "T", steps: s, onClose: () => closed++ }));
  await act(async () => {
    $(m.root, "dialog").dispatchEvent(new Event("cancel", { cancelable: true }));
  });
  assert.equal(closed, 1);
  await m.unmount();
});

test("controlled step: step + onStepChange", { skip }, async () => {
  const { StepFlow } = await ui();
  const seen: number[] = [];
  const m = await mount(h(StepFlow, { open: true, title: "T", step: 2, onStepChange: (i: number) => seen.push(i), steps: steps(), onClose: () => {} }));
  assert.deepEqual(visible(m.root), ["2"]);
  await click(buttons(m.root)[0] as HTMLElement);
  await wait(260);
  assert.deepEqual(seen, [1]);
  assert.deepEqual(visible(m.root), ["2"]); // the parent owns the step
  await m.unmount();
});

test("Dialog: native modal, kicker + h2 + Close, footer, Esc → onClose, closed = nothing rendered inside", { skip }, async () => {
  const { Dialog } = await ui();
  let closed = 0;
  const m = await mount(h(Dialog, { open: true, title: "Remove agent", kicker: "Front desk", onClose: () => closed++, footer: h("button", null, "OK") }, h("p", null, "body")));
  const dlg = $(m.root, "dialog.tb-dialog");
  assert.equal(dlg.hasAttribute("open"), true);
  assert.equal($(m.root, ".tb-kicker").textContent, "Front desk");
  assert.equal($(m.root, ".tb-dialog-head h2").textContent, "Remove agent");
  assert.equal($(m.root, ".tb-close").textContent, "Close");
  assert.equal($(m.root, ".tb-dialog-foot").textContent, "OK");
  await click($(m.root, ".tb-close"));
  assert.equal(closed, 1);
  await m.rerender(h(Dialog, { open: false, title: "Remove agent", onClose: () => {}, size: "lg" }, h("p", null, "body")));
  assert.equal(dlg.hasAttribute("open"), false);
  assert.equal(dlg.querySelector(".tb-dialog-body"), null);
  assert.ok(dlg.classList.contains("lg"));
  await m.unmount();
});
