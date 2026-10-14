import type { CSSProperties, MouseEvent, ReactNode } from "react";
import type { AppArt } from "../apps.ts";
import { AppMark, BrandMark, Lockup } from "./identity.tsx";
import { cx, Ink } from "./ink.tsx";
import { Count } from "./pills.tsx";

export type ShellPage = { id: string; label: string; badge?: number | string | null };

const hasBadge = (p: ShellPage) => p.badge !== undefined && p.badge !== null && p.badge !== 0 && p.badge !== "";

/** Accessible name of a nav item (C61): the visible label (or the page id when a label is empty) plus its badge. */
export function shellPageName(p: ShellPage): string {
  const label = typeof p.label === "string" && p.label.trim() ? p.label.trim() : p.id;
  return hasBadge(p) ? `${label}, ${p.badge}` : label;
}

/** The SDK's standard app pages (SDK-API §14). Apps add their own pages before or after these. */
export const STANDARD_PAGES: readonly ShellPage[] = [
  { id: "holds", label: "Holds" },
  { id: "receipts", label: "Receipts" },
  { id: "agents", label: "Agents & scopes" },
  { id: "keys", label: "Keys" },
  { id: "backups", label: "Backups & export" },
];

/**
 * App header (64px, one header for the Portal and every mini app): the lockup, a slot (search, breadcrumbs) and the
 * actions on the right (account avatar last). Sticky, paper ground, hairline below.
 */
export function AppHeader({ brand, children, actions, className }: { brand?: ReactNode; children?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cx("tb-head", className)}>
      {brand ?? <Lockup sub="Portal" />}
      <div className="tb-head-slot">{children}</div>
      {actions && <div className="tb-head-actions">{actions}</div>}
    </header>
  );
}

const plainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

/**
 * The ONE app shell for mini apps (SDK-API §14, D113: no per-app copies). Header in the app's own colour with white
 * text (C148, `.tb-shell.is-app`): the Tealbrick mark chip (links to the Portal), a divider and the AppMark; then the
 * actions. A 248px side nav of brick tabs (current = app colour, pill count chip); on phone a scrolling row.
 * Without `colour` the header is the neutral paper header with the lockup. Router-agnostic: pass `current` and handle
 * `onNavigate`; nav items are real links (`pageHref`, default `?page=<id>`), so open-in-new-tab still works.
 */
export function AppShell({
  title,
  art,
  colour,
  portalHref = "/",
  pages,
  current,
  onNavigate,
  pageHref = (id) => `?page=${encodeURIComponent(id)}`,
  actions,
  banner,
  footer,
  children,
}: {
  title: string;
  /** the app's art (catalog `ui.art`; interim: appArt(id, base)) */
  art?: AppArt | null;
  /** header colour (catalog `ui.art.colour`; interim: appColour(id)); omit for the neutral header */
  colour?: string;
  /** where the mark chip links (the Portal) */
  portalHref?: string;
  pages: readonly ShellPage[];
  current: string;
  onNavigate: (id: string) => void;
  pageHref?: (id: string) => string;
  actions?: ReactNode;
  banner?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const mark = <AppMark name={title} art={art} size={32} />;
  const style = colour ? ({ "--app": colour } as CSSProperties) : undefined;
  return (
    <div className={cx("tb-shell", colour && "is-app")} style={style}>
      <header className="tb-head">
        {colour ? (
          <>
            <a className="tb-brand" href={portalHref} aria-label="Tealbrick Portal">
              <span className="tb-mark-tile">
                <BrandMark />
              </span>
            </a>
            <span className="tb-divider" aria-hidden="true" />
          </>
        ) : (
          <Lockup href={portalHref} label="Tealbrick Portal" />
        )}
        <h1 className="tb-shell-title">{mark}</h1>
        <div className="tb-head-slot" />
        {actions && <div className="tb-head-actions">{actions}</div>}
      </header>
      <nav className="tb-shell-nav" aria-label={`${title} pages`}>
        {pages.map((p) => (
          <a
            key={p.id}
            className="tb-tab"
            href={pageHref(p.id)}
            aria-label={shellPageName(p)}
            aria-current={p.id === current ? "page" : undefined}
            onClick={(e) => {
              if (!plainClick(e)) return;
              e.preventDefault();
              onNavigate(p.id);
            }}
          >
            <Ink>{p.label || p.id}</Ink>
            {hasBadge(p) && (
              <span aria-hidden="true">
                <Count>{p.badge}</Count>
              </span>
            )}
          </a>
        ))}
      </nav>
      <main className="tb-shell-main">
        {banner && <div className="tb-shell-banner">{banner}</div>}
        {children}
        {footer && <footer className="tb-shell-foot">{footer}</footer>}
      </main>
    </div>
  );
}
