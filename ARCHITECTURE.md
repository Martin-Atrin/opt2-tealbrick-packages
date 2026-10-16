# Tealbrick shared packages (UI kit): architecture

State: verified against the repo on 2026-10-16. Claims cite paths in this repo. Anything not verified is marked UNVERIFIED. For the whole system see the system `ARCHITECTURE.md` and `SYSTEM-OVERVIEW.md`.

## 1. Shape rules (C125, C126)

- One BRICK radius, `--tb-radius-brick: 6px`, for everything you act with or that holds content: buttons, fields, tabs, nav, cards, panels, dialogs, menus, toasts, notices, tables.
- A PILL radius, `--tb-radius-pill: 999px`, only to choose or show a state: tags, chips, badges, counts, switches, segmented controls, the pay pill, status pills.
- `--tb-radius-swatch: 2px` only for the iso swatch. Website-only clamps exist (`--tb-radius-site-*`).

## 2. Tokens

Light base values plus a dark block (`data-theme="dark"`, TBD only for now, C148). Role tokens and state pairs (fill plus on-fill, C128), brick red, teal (fills only; `--tb-teal-ink` for text), Nunito (self-hosted woff2, OFL 1.1), weights 400, 700, 800, 900, per-app header colours `--tb-app-*`. Page root class `tb-root`.

## 3. Components

Button, ButtonLink, IconButton, Avatar; Field, TextInput, Textarea, Select (custom listbox, ARIA select-only combobox), NativeSelect; Tag, Count, Chip, Switch, Segmented, StatusPill; Card, Panel, Notice, Table, Progress, CopyBlock; Dialog, **StepFlow** (one step at a time, fixed modal size, fade between steps), Menu, Toast, PayPill; Tabs, AppHeader, **AppShell** (standard pages: Holds, Receipts, Agents and scopes, Keys, Backups and export); BrandMark, Lockup, AppIcon, AppMark; Ink. `clerkAppearance(theme)` styles Clerk components.

## 4. The guard (`check-system <dir> [--ignore <name>] [--report]`)

Fails with exit 1 on raw colours (hex, rgb, hsl), foreign fonts or font imports, a radius that is not a `--tb-radius-*` token, font weights outside the four allowed, box-shadow that is not `none` or a token, scrollbar restyling, shape violations (a pill radius on a brick element or the reverse; selector-aware), and Swift literals (`Color`, `cornerRadius`, `.font(.system|.custom)`). A reviewed exception carries `check-system: allow` on the same line. Every consumer runs it in lint.

## 5. Rendered checks (CI `rendered.yaml`)

Chromium (Playwright image, no secrets, nothing published): contrast in default, hover, focus and open states; scrollbar thumbs; ink centring at DPR 1 and 2; light and dark; 1280 and 375 wide. The gate is zero failures. Controls must centre their ink within 0.5 px (C172).

## 6. Consumers and pins

ui 0.2.4: admin, connect, evolution, fleet, inbox, kanban, knowledge, rules, portal-gui. 0.2.3: samples and the template. 0.2.1: website. 0.2.0: TBD chat.

## 7. Known gaps

- `src/apps.ts` is an interim product-id lookup for app names, colours and art. It conflicts with "no product id in code" and waits for manifest `display.color` and `ui.art` (spec request MDC-1).
- No root `LICENSE`.
- `.docs-session/context.json` (docs tool state) sits in the repo directory; check that it is not tracked.