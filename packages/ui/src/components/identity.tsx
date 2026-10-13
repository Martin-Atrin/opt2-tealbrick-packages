import type { AnchorHTMLAttributes, CSSProperties, ReactNode } from "react";
import { type AppArt, APPS } from "../apps.ts";
import { BRAND_MARK_HEIGHT, BRAND_MARK_SRC, BRAND_MARK_WIDTH } from "../brand-mark.ts";
import { cx, Ink } from "./ink.tsx";

/**
 * The drawn two-brick mark (production PNG, 108×88; no vector exists). Rendered from a data: URI, so it works under any
 * base path. `width` is the shown width in px (36 in the lockup, 30 at <=374px).
 */
export function BrandMark({ width = 36, size, className }: { width?: number; /** @deprecated 0.1.x prop (was the SVG box) */ size?: number; className?: string }) {
  const w = size ?? width;
  return <img className={cx("tb-mark", className)} src={BRAND_MARK_SRC} width={w} height={Math.round((w * BRAND_MARK_HEIGHT) / BRAND_MARK_WIDTH)} alt="" />;
}

/**
 * Lockup: mark + "Tealbrick" 900 (+ an optional sub-label after a hairline, e.g. "Portal"). Under 420px only the mark
 * shows; the link keeps its accessible name.
 */
export function Lockup({ sub, href = "/", label, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { sub?: ReactNode; label?: string }) {
  return (
    <a className={cx("tb-brand", className)} href={href} aria-label={label ?? (typeof sub === "string" ? `Tealbrick ${sub} home` : "Tealbrick home")} {...rest}>
      <BrandMark />
      <span className="tb-wordmark">Tealbrick</span>
      {sub && <span className="tb-brand-sub">{sub}</span>}
    </a>
  );
}

export type IconSize = 16 | 24 | 32 | 48 | 64;

/**
 * AppIcon: a square brick crop of the app's production still on its spot paper (sizes 16/24/32/48/64; 16 has the 2px
 * swatch corner). `art` comes from the catalog (manifest `ui.art`); see apps.ts appArt() for the interim lookup.
 * Without art it shows a plate square with the name's initial. `animated` is an optional muted loop (hidden under
 * reduced motion; no production app has one today). Decorative unless `label` is given.
 */
export function AppIcon({
  art,
  name,
  size = 48,
  label,
  animated,
  className,
}: {
  art?: AppArt | null;
  name?: string;
  size?: IconSize;
  label?: string;
  animated?: { src: string; type?: string };
  className?: string;
}) {
  const cls = cx("tb-app-icon", size !== 48 && `s${size}`, !art && "is-blank", className);
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  if (!art) {
    return (
      <i className={cls} {...a11y}>
        <Ink>{(name ?? "").trim().charAt(0).toUpperCase()}</Ink>
      </i>
    );
  }
  const image = art.still2x ? `image-set(url("${art.still}") 1x, url("${art.still2x}") 2x)` : `url("${art.still}")`;
  return (
    <i className={cls} style={{ backgroundImage: image } as CSSProperties} {...a11y}>
      {animated && <video src={animated.src} muted autoPlay loop playsInline aria-hidden="true" />}
    </i>
  );
}

/** AppMark: AppIcon + the app's name (900). Headers, the deploy StepFlow title, licence rows, canvas cards, search results. */
export function AppMark({ name, art, size = 32, className }: { name: string; art?: AppArt | null; size?: IconSize; className?: string }) {
  return (
    <span className={cx("tb-app-mark", className)}>
      <AppIcon art={art} name={name} size={size} />
      <span>{name}</span>
    </span>
  );
}

/** Public name of an opt2 app id from the interim lookup (apps.ts), else the id itself. */
export function appName(id: string): string {
  return APPS[id]?.name ?? id;
}
