# Tealbrick shared packages (UI kit)

Shared packages. Today only `@opt2-tealbrick/ui` (`packages/ui`): design tokens, self-hosted Nunito, React components, the `check-system` design guard and the Clerk appearance, used by the Portal GUI, Admin, the website, every mini app and TBD. See `packages/ui/README.md` and `packages/ui/CHANGELOG.md`.

- Repository: `Tealbrick/opt2-tealbrick-packages` (GitHub organisation `Tealbrick`)
- Visibility target: PRIVATE. The repo is PUBLIC for now (the flip is held for the org Actions billing). Consumers install from the dist host (`distBaseUrl`, `Tealbrick/opt2-tealbrick-dist`).
- Licence: the package says MIT, but the repo has no root `LICENSE` file. The brand mark and app stills are Tealbrick artwork and are NOT MIT. The target is the Tealbrick SDK licence. Fix the licence files before the repo goes private.
- Status: ui 0.2.4. CI template ci-v9.9. Pull-request based flow (`ui-0.2.x` branches). `tealbrick-ci.json` has `distBaseUrl`, so the ui tarball is mirrored on the dist host.

Do not put secrets, tokens, keys, customer data or personal data in this repository, its issues or its pull requests. This repository is public for now and must stay clean either way: no API keys, tokens, passwords, private keys, `.env` files, connection strings, personal names, private agent configurations or customer data. Every CI run starts with a secret scan (gitleaks, a step in `.woodpecker/ci.yaml`). GitHub secret scanning with push protection is enabled. An optional local guard is `pre-commit install`. If a secret is committed, rotate it first, then remove it from history.

## What this repo is and is not

One design system, one package: same fonts, colours, radii and components on every surface. 0.2.0 broke 0.1.x with no aliases.

`@opt2-tealbrick/buzz` and `@opt2-tealbrick/avm` do not exist in this repo (the code of Buzz stays inside Connect; avm is deferred).

## Quick start

pnpm workspace, TypeScript run directly by Node 24+ (type stripping).

```sh
corepack enable && pnpm install --frozen-lockfile --ignore-scripts
pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @opt2-tealbrick/ui check:rendered   # builds the gallery, runs Chromium checks
```

Use it in an app: `import "@opt2-tealbrick/ui/tokens.css"`, `components.css`, then components from `@opt2-tealbrick/ui`. Run `check-system src` in the consumer. Install by release URL from the dist host plus lockfile integrity (never npm):

```json
"@opt2-tealbrick/ui": "https://github.com/Tealbrick/opt2-tealbrick-dist/releases/download/opt2-tealbrick-packages-ui-v<x>/opt2-tealbrick-ui-<x>.tgz"
```

## Layout

| Path | Purpose |
|---|---|
| `packages/ui/src/components/` | Button, dialog, field, select, nav, pills, shell (AppShell), stepflow, surfaces, identity (BrandMark, AppIcon), ink |
| `packages/ui/src/tokens.css`, `components.css`, `kit.css`, `clerk.css`, `fonts.css` | Tokens and styles. `tokens.css` and `components.css` are synced unchanged from the approved design source (hashes in `DESIGN-SOURCE.json`) |
| `packages/ui/src/tokens.ts`, `clerk-appearance.ts` | Generated tokens and Clerk appearance |
| `packages/ui/src/bin/check-system.ts` | The design guard |
| `packages/ui/assets/` | App stills and brand files (with `PROVENANCE.md`) |
| `packages/ui/gallery/`, `packages/ui/scripts/` | Component gallery and the build, contrast and rendered checks |
| `.woodpecker/rendered.yaml` | Rendered checks pipeline (Chromium, no secrets, nothing published) |
| `tealbrick-ci.json` | Repo-specific CI settings (kind `library`, `distBaseUrl`) |

## Configuration

None at runtime. Peer dependency `react >= 19`.

## CI and release

Woodpecker CI with the shared opt2 pipeline template ci-v9.9 (`.woodpecker/ci.yaml` and `.github/workflows/opt2-release.yml` are generated copies; do not edit them, change `tealbrick-ci.json` or the template in `Tealbrick/opt2-tealbrick-platform`). `.woodpecker/rendered.yaml` runs the rendered checks.

Tag `ui-v<x>` on a green `main`. The release Action attaches `opt2-tealbrick-ui-<x>.tgz`, `.sha256`, `.integrity`. Never npm.

## Language

New code is TypeScript (Node 24+).

## Documentation

- `ARCHITECTURE.md` explains the design.
- `CONTRIBUTING.md` explains how to change it.
- `packages/ui/CHANGELOG.md` lists the ui releases.
- System documentation (overview, environments, runbooks) lives in the private repo Tealbrick/opt2-tealbrick-docs.
