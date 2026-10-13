/* App identity: name, group, header colour and art by opt2 product id (C139, C143, C148; DESIGN-SYSTEM §5b).
   Derived from the design lead's assets/apps.ts. The stills are byte copies of production (Tealbrick/Website-martin
   @ c544ef9, public/images/miniapps/<slug>@{1x,2x}.webp, 1200×540 / 2400×1080); the kit ships the 7 that have an opt2
   app, in assets/apps/. The colours are the generated --tb-app-* tokens (white text >= 4.6:1, check-contrast).

   TODO(spec request 2026-10-13, specs/REQUESTS.md "ui.art"): the art and colour belong in each app's manifest
   (`ui.art: { still, still2x, colour }`) and reach the GUI through the catalog, because the GUI owns no app list
   (PRD §7.3). Until the manifests carry it, this lookup by product id is the fallback. Pass catalog art to
   AppIcon/AppMark (`art` prop) as soon as it exists; this table goes away then. */

export type AppGroup = "memory" | "coordination" | "control" | "connections" | "creation";

/** Same field names as the requested manifest `ui.art` (still, still2x, colour), resolved to URLs. */
export type AppArt = {
  /** 1x still URL (1200×540 webp) */
  still: string;
  /** 2x still URL (2400×1080 webp) */
  still2x?: string;
  /** header colour: a CSS colour or var(--tb-app-*) */
  colour?: string;
};

export type AppIdentity = { id: string; name: string; group: AppGroup; slug: string; colour: string };

/** opt2 product id → identity. Public names (production); one exception: the Marketplace art is our Connect app. */
export const APPS: Readonly<Record<string, AppIdentity>> = {
  knowledge: { id: "knowledge", name: "Knowledge", group: "memory", slug: "knowledge", colour: "var(--tb-app-knowledge)" },
  kanban: { id: "kanban", name: "Task Board", group: "coordination", slug: "work-ethic-kanban", colour: "var(--tb-app-kanban)" },
  inbox: { id: "inbox", name: "Operator Inbox", group: "coordination", slug: "operator-inbox", colour: "var(--tb-app-inbox)" },
  evolution: { id: "evolution", name: "Evolving Workflows", group: "coordination", slug: "evolution-workflow-runtime", colour: "var(--tb-app-evolution)" },
  rules: { id: "rules", name: "Rules & Approvals", group: "control", slug: "rules-approvals", colour: "var(--tb-app-rules)" },
  fleet: { id: "fleet", name: "Organization Plane", group: "control", slug: "organization-plane", colour: "var(--tb-app-fleet)" },
  connect: { id: "connect", name: "Connect", group: "connections", slug: "marketplace", colour: "var(--tb-app-connect)" },
};

/** Header colour per app id: every --tb-app-* token (13, incl. the six stills that have no opt2 app yet). */
export const APP_COLOUR_IDS = ["knowledge", "scribe", "inbox", "kanban", "evolution", "rules", "fleet", "mesh", "connect", "bridge", "setup", "design", "artifacts"] as const;

/** `var(--tb-app-<id>)` when the kit has a colour for the id, else undefined (use a neutral header). */
export function appColour(id: string): string | undefined {
  return (APP_COLOUR_IDS as readonly string[]).includes(id) ? `var(--tb-app-${id})` : undefined;
}

/**
 * Art for a product id from the kit's own stills. `base` is where the consumer serves the kit's `assets/apps/`
 * folder (e.g. copy `node_modules/@opt2-tealbrick/ui/assets/apps` into the app's public dir, then base = "/kit/apps/").
 * Returns null for an unknown id (render AppIcon without art: a plate square with the initial).
 */
export function appArt(id: string, base: string): AppArt | null {
  const a = APPS[id];
  if (!a) return null;
  const b = base.endsWith("/") ? base : `${base}/`;
  return { still: `${b}${a.slug}@1x.webp`, still2x: `${b}${a.slug}@2x.webp`, colour: a.colour };
}

/** AppIcon crop: >= 48px shows the full centre square; 24–32px scales to 125%; 16px to 150% (with the 2px swatch corner). */
export const iconCrop = (size: number): number => (size >= 48 ? 100 : size >= 24 ? 125 : 150);
