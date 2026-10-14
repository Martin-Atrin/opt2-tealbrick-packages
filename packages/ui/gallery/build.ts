/* gallery/build.ts — bundles gallery/entry.tsx (which imports the BUILT kit from dist/) with esbuild into gallery/out/,
   next to the kit's dist CSS, fonts and the app stills, so the page loads only local files (no network, no Google
   Fonts). Run after the package build: node gallery/build.ts. Serve gallery/out/ (scripts/check-rendered.ts does). */
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

const ui = join(import.meta.dirname, "..");
const out = join(import.meta.dirname, "out");
if (!existsSync(join(ui, "dist/index.js"))) throw new Error("build the package first (node scripts/build.ts)");
if (existsSync(out)) rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [join(import.meta.dirname, "entry.tsx")],
  bundle: true,
  format: "esm",
  outfile: join(out, "app.js"),
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  minify: false,
  logLevel: "warning",
});
cpSync(join(ui, "dist/tokens.css"), join(out, "tokens.css"));
cpSync(join(ui, "dist/components.css"), join(out, "components.css"));
cpSync(join(ui, "dist/fonts"), join(out, "fonts"), { recursive: true });
cpSync(join(ui, "assets/apps"), join(out, "assets/apps"), { recursive: true });
cpSync(join(import.meta.dirname, "gallery.css"), join(out, "gallery.css"));
writeFileSync(
  join(out, "index.html"),
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>@opt2-tealbrick/ui gallery</title>
<link rel="stylesheet" href="tokens.css"><link rel="stylesheet" href="components.css"><link rel="stylesheet" href="gallery.css">
</head>
<body class="tb-root">
<div id="root"></div>
<script type="module" src="app.js"></script>
</body>
</html>
`,
);
console.log(`gallery built: ${out}`);
