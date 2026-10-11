/** AppShell renders the brand, the page nav with the current page and badges, and the content (runs on the built dist). */
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

const dist = new URL("../dist/index.js", import.meta.url);

test("AppShell renders title, pages, current page, badge and content", { skip: !existsSync(dist) && "build first" }, async () => {
  const { createElement } = await import("react");
  const { renderToStaticMarkup } = await import("react-dom/server");
  const ui = (await import(dist.href)) as typeof import("../src/index.tsx");
  const pages = [{ id: "services", label: "Services" }, ...ui.STANDARD_PAGES.map((p) => (p.id === "holds" ? { ...p, badge: 2 } : p))];
  const html = renderToStaticMarkup(
    createElement(ui.AppShell, { title: "Example", pages, current: "holds", onNavigate: () => undefined, children: createElement("p", null, "page body") }),
  );
  assert.match(html, /<h1>Example<\/h1>/);
  assert.match(html, /aria-current="page"[^>]*><span>Holds<\/span><span class="tb-shell-badge">2<\/span>/);
  assert.match(html, /Backups &amp; export/);
  assert.match(html, /page body/);
  assert.doesNotMatch(html, /<img/); // mark is inline SVG: works under any base path
});
