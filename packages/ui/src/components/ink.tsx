import { Children, Fragment, isValidElement, type ReactNode } from "react";

/** Joins class names, dropping empty ones. */
export function cx(...names: (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}

/**
 * C128: every control label sits in `.tb-ink`, so `text-box: trim-both cap alphabetic` centres the cap height (not
 * Nunito's ascent/descent box) inside the control. The kit's controls render it themselves; use it for custom controls.
 */
export function Ink({ children }: { children: ReactNode }) {
  return <span className="tb-ink">{children}</span>;
}

/** Wraps every text run among `children` in `.tb-ink`; elements (icons, counts, swatches) stay as they are. */
export function inked(children: ReactNode): ReactNode {
  const out: ReactNode[] = [];
  let run: ReactNode[] = [];
  const flush = () => {
    const text = run.join("");
    if (text.trim()) out.push(<Ink key={`ink-${out.length}`}>{text.trim()}</Ink>);
    run = [];
  };
  const visit = (nodes: ReactNode) => {
    Children.forEach(nodes, (c) => {
      if (typeof c === "string" || typeof c === "number") run.push(String(c));
      else if (isValidElement(c) && c.type === Fragment) visit((c.props as { children?: ReactNode }).children);
      else if (c !== null && c !== undefined && typeof c !== "boolean") {
        flush();
        out.push(c);
      }
    });
  };
  visit(children);
  flush();
  return out;
}

/** The arrow that follows a primary action or a link; nudges 4px on hover (components.css .tb-arrow). */
export function ArrowIcon() {
  return (
    <svg className="tb-arrow" viewBox="0 0 20 14" aria-hidden="true">
      <path d="M1 7h16M11 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  );
}

export function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4h2l2.4 11h11.2l2-8H6" />
      <path d="M8.2 19.2h1.6v1.6H8.2zM17.2 19.2h1.6v1.6h-1.6z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="m12.5 12.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
