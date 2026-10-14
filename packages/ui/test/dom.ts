/* Test helper: a happy-dom window as the global DOM, React 19 rendering with act(), and the built kit (dist).
   Component tests run against dist/ (what consumers install); `pnpm test` builds first. */
import { existsSync } from "node:fs";
import { Window } from "happy-dom";
import type { ElementType, ReactElement, ReactNode } from "react";

const win = new Window({ url: "http://localhost/", width: 1280, height: 860 });
const g = globalThis as Record<string, unknown>;
for (const k of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLButtonElement",
  "HTMLDialogElement",
  "Element",
  "Node",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
  "PointerEvent",
  "getComputedStyle",
  "matchMedia",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "MutationObserver",
]) {
  const v = (win as unknown as Record<string, unknown>)[k];
  if (v === undefined) continue;
  try {
    g[k] = typeof v === "function" && /^[a-z]/.test(k) ? (v as (...a: unknown[]) => unknown).bind(win) : v;
  } catch {
    Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
  }
}
g.IS_REACT_ACT_ENVIRONMENT = true;

export const dist = new URL("../dist/index.js", import.meta.url);
export const built = existsSync(dist);
export type UI = typeof import("../src/index.ts");
export const ui = async (): Promise<UI> => (await import(dist.href)) as UI;

const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { createElement } = await import("react");
/** createElement with loose typing for tests (components are typed in src; tests pass props + children freely). */
export const h = (type: ElementType | string, props?: object | null, ...children: ReactNode[]): ReactElement =>
  (createElement as (t: unknown, p?: unknown, ...c: unknown[]) => ReactElement)(type, props, ...children);
export { act };

export type Mounted = { root: HTMLElement; rerender: (el: ReactElement) => Promise<void>; unmount: () => Promise<void> };

export async function mount(el: ReactElement): Promise<Mounted> {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const r = createRoot(host);
  await act(async () => r.render(el));
  return {
    root: host,
    rerender: async (next) => act(async () => r.render(next)),
    unmount: async () => {
      await act(async () => r.unmount());
      host.remove();
    },
  };
}

/** Dispatch a key on an element inside act(). */
export async function key(el: Element, k: string, init: KeyboardEventInit = {}): Promise<void> {
  await act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }));
  });
}

export async function click(el: Element): Promise<void> {
  await act(async () => {
    (el as HTMLElement).click();
  });
}

export const $ = (root: ParentNode, sel: string): HTMLElement => {
  const el = root.querySelector<HTMLElement>(sel);
  if (!el) throw new Error(`not found: ${sel}`);
  return el;
};
export const $$ = (root: ParentNode, sel: string): HTMLElement[] => [...root.querySelectorAll<HTMLElement>(sel)];

/** Run timers for a short while (StepFlow fade). */
export const wait = (ms: number) => act(async () => new Promise((r) => setTimeout(r, ms)));

export const skip = !built && "build first (pnpm test builds)";
