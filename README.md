# opt2-tealbrick-packages

Tealbrick opt2: shared packages (the ui design system).

**Status: opt2 build (clean-room v2 of Teal Brick), work in progress.** This repository is part of the opt2 build and lives under `Martin-Atrin` during the build; it moves to the Teal Brick organisation as one clean commit when opt2 is released. It is not the current production system.

Owner lane: Lane A · UI build (ui).

## No secrets policy

This repository is public. It must never contain secrets or personal data:

- No API keys, tokens, passwords, private keys, deployment secrets, `.env` files or connection strings. Use `.env.example` with placeholder values only.
- Runtime secrets live in the deployment platform (Railway variables, Woodpecker secrets) and are copied between services without printing them.
- No personal names, private agent configurations or customer data.
- Every push runs a secret scan (`.woodpecker/secret-scan.yaml`, gitleaks). GitHub secret scanning with push protection is enabled. Optional local guard: `pre-commit install`.
- If a secret is committed anyway: rotate it first, then remove it from history.

## CI

Woodpecker CI (shared opt2 pipeline template from `opt2-tealbrick-platform`).

## Language

New code is TypeScript (Node 24+). Swift only where the macOS app requires it.

## Packages

| Package | Owner lane | What |
|---|---|---|
| `@opt2-tealbrick/ui` (`packages/ui`) | UI build | Tealbrick design system: tokens, self-hosted Nunito, React components, the `check-system` guard. See `packages/ui/README.md` and `CHANGELOG.md`. |

Release: tag `ui-v<version>` on a green main; the GitHub Actions release workflow (template ci-v9.5, C72/C76) builds and attaches the tarball + `.sha256` + `.integrity`. `.woodpecker/rendered.yaml` runs the rendered checks.
