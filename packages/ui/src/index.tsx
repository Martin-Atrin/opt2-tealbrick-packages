import { type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, useEffect, useId, useRef, useState } from "react";

export type Tone = "ok" | "progress" | "action" | "blocked" | "neutral";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "accent" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
};
export function Button({ variant = "secondary", size = "md", className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={`tb-btn ${className}`} data-variant={variant} data-size={size} {...rest} />;
}

export function IconButton({ label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" className="tb-icon-btn" aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string; children: ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed as children
    <label className="tb-field">
      <span>{label}</span>
      {children}
      {error ? <small role="alert">{error}</small> : hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="tb-input" {...props} />;
}

export function Select({ options, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string; disabled?: boolean }[] }) {
  return (
    <select className="tb-select" {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export type ChoiceOption<T extends string> = { value: T; title: string; body?: string; disabled?: boolean; note?: string };
/** Radio group drawn as cards. Arrow keys move between enabled options. */
export function Choices<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ChoiceOption<T>[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  const enabled = options.filter((o) => !o.disabled);
  function move(from: T, step: number) {
    const i = enabled.findIndex((o) => o.value === from);
    const next = enabled[(i + step + enabled.length) % enabled.length];
    if (next) onChange(next.value);
  }
  return (
    <div className="tb-choices" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        // biome-ignore lint/a11y/useSemanticElements: card-style radio needs rich content a native radio label cannot hold
        <button
          type="button"
          key={o.value}
          className="tb-choice"
          role="radio"
          aria-checked={value === o.value}
          aria-disabled={o.disabled || undefined}
          tabIndex={value === o.value || (value === null && o === enabled[0]) ? 0 : -1}
          onClick={() => !o.disabled && onChange(o.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || e.key === "ArrowRight") {
              e.preventDefault();
              move(o.value, 1);
            }
            if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
              e.preventDefault();
              move(o.value, -1);
            }
          }}
        >
          <strong>{o.title}</strong>
          {o.body && <span>{o.body}</span>}
          {o.note && <span className="tb-choice-note">{o.note}</span>}
        </button>
      ))}
    </div>
  );
}

export function Tag({ tone = "neutral", children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span className="tb-tag" data-tone={tone} title={title}>
      {children}
    </span>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <span className="tb-eyebrow">{children}</span>;
}

export function Progress({ value, label }: { value?: number; label: string }) {
  const indeterminate = value === undefined;
  return (
    <div
      className="tb-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(value)}
      data-indeterminate={indeterminate}
    >
      <span style={indeterminate ? undefined : { width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/**
 * Native modal dialog (harvested rule: platform focus trap, Esc, ::backdrop; no custom trap).
 * `busy` blocks Esc so an in-flight action cannot be abandoned half way.
 */
export function Dialog({
  open,
  title,
  eyebrow,
  onClose,
  busy = false,
  size = "md",
  footer,
  children,
}: {
  open: boolean;
  title: string;
  eyebrow?: ReactNode;
  onClose: () => void;
  busy?: boolean;
  size?: "md" | "lg";
  footer?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="tb-dialog"
      data-size={size}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      {open && (
        <div className="tb-dialog-inner">
          <header>
            <div className="tb-stack" style={{ gap: 4 }}>
              {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
              <h2 id={titleId}>{title}</h2>
            </div>
            <IconButton label="Close" onClick={onClose} disabled={busy}>
              <CloseIcon />
            </IconButton>
          </header>
          <div className="tb-dialog-body">{children}</div>
          {footer && <footer>{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}

export type StepState = "done" | "current" | "todo";
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="tb-steps" aria-label="Progress">
      {steps.map((s, i) => {
        const state: StepState = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={s} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Harvested SetupOverlay: real controls dimmed under a veil, one panel with the next action. */
export function SetupOverlay({ active, panel, children }: { active: boolean; panel: ReactNode; children: ReactNode }) {
  if (!active) return <>{children}</>;
  return (
    <div className="tb-overlay">
      <div className="tb-overlay-content" inert aria-hidden="true">
        {children}
      </div>
      <div className="tb-overlay-veil">{panel}</div>
    </div>
  );
}

/** Harvested CopyCommand: copy button, `user-select: all` fallback when the clipboard is unavailable. */
export function CopyBlock({ text, label = "command" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="tb-copy">
      <pre>{text}</pre>
      <button type="button" aria-label={`Copy ${label}`} onClick={() => void copy()}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export type SetupStep = { title: string; detail?: string; command?: string };
export function SetupSteps({ steps }: { steps: SetupStep[] }) {
  return (
    <ol className="tb-setup-steps">
      {steps.map((s) => (
        <li key={s.title}>
          <strong>{s.title}</strong>
          {s.detail && <p>{s.detail}</p>}
          {s.command && <CopyBlock text={s.command} label={s.title.toLowerCase()} />}
        </li>
      ))}
    </ol>
  );
}

export function Notice({ tone = "ok", children, role = "status" }: { tone?: "ok" | "action"; children: ReactNode; role?: "status" | "alert" }) {
  return (
    <div className="tb-notice" data-tone={tone} role={role}>
      {children}
    </div>
  );
}

export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
}: {
  label: string;
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="tb-tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button type="button" role="tab" key={t.value} aria-selected={value === t.value} onClick={() => onChange(t.value)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/** Disclosure menu (button + list). Closes on Escape and outside click. */
export function Menu({ label, trigger, children }: { label: string; trigger: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div className="tb-menu" ref={ref}>
      <button
        type="button"
        className="tb-btn"
        data-variant="ghost"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>
      {open && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: items are buttons/links; the click only closes the menu after selection
        <ul className="tb-menu-list" onClick={() => setOpen(false)}>
          {children}
        </ul>
      )}
    </div>
  );
}

/**
 * The pay pill. Position, shape and content are v1 AS IS (LicenseCart.tsx:47, license-cart.css:3-9).
 * opt2 adds `unpaid` glow. Rendered only when there is something to pay and no dialog covers it.
 */
export function PayPill({ count, unpaid, onOpen }: { count: number; unpaid: boolean; onOpen: () => void }) {
  if (count <= 0) return null;
  const apps = `${count} ${count === 1 ? "app" : "apps"}`;
  return (
    <button type="button" className="tb-paypill" data-unpaid={unpaid} aria-haspopup="dialog" aria-label={`Review licences, ${apps} in cart`} onClick={onOpen}>
      <CartIcon />
      <span>
        <strong>Review licences</strong>
        <small>{apps} in your workspace</small>
      </span>
      <span className="tb-paypill-count">{count}</span>
    </button>
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
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4h2l2.4 11h11.2l2-8H6" />
      <path d="M8.2 19.2h1.6v1.6H8.2zM17.2 19.2h1.6v1.6h-1.6z" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
    </svg>
  );
}

/**
 * The brand mark (two bricks, rose + teal) as inline SVG, so it renders under any base path
 * (Portal at `/`, apps at `/a/<product>/`). The PNG stays available as `@opt2-tealbrick/ui/assets/…`.
 */
export function BrandMark({ size = 32 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="#173f3c" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M3 9.5 9 6l9 4.5-6 3.5z" fill="#e7b3b3" />
      <path d="M3 9.5v7l9 4.5v-7z" fill="#c98585" />
      <path d="M12 14v7l6-3.5v-7z" fill="#b06f72" />
      <path d="M14 18.5 20 15l9 4.5-6 3.5z" fill="#9fdcd5" />
      <path d="M14 18.5v7l9 4.5v-7z" fill="#5fbfb5" />
      <path d="M23 23v7l6-3.5v-7z" fill="#3e9f96" />
    </svg>
  );
}

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
 * The ONE app shell for miniapps (SDK-API §14, D113: no per-app copies): brand header with the app's name and icon,
 * a page nav (sidebar on wide screens, scrolling tabs on narrow ones), an optional banner, and the page content.
 * Router-agnostic: the app passes `current` and handles `onNavigate`.
 */
export function AppShell({
  title,
  icon,
  pages,
  current,
  onNavigate,
  actions,
  banner,
  footer,
  children,
}: {
  title: string;
  icon?: ReactNode;
  pages: readonly ShellPage[];
  current: string;
  onNavigate: (id: string) => void;
  actions?: ReactNode;
  banner?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="tb-shell">
      <header className="tb-shell-head">
        <div className="tb-shell-brand">
          <BrandMark size={24} />
          <span className="tb-shell-maker">teal brick</span>
          <span className="tb-shell-sep" aria-hidden="true">
            /
          </span>
          {icon && <span className="tb-shell-icon">{icon}</span>}
          <h1>{title}</h1>
        </div>
        {actions && <div className="tb-shell-actions">{actions}</div>}
      </header>
      <nav className="tb-shell-nav" aria-label={`${title} pages`}>
        {pages.map((p) => (
          <button type="button" key={p.id} aria-label={shellPageName(p)} aria-current={p.id === current ? "page" : undefined} onClick={() => onNavigate(p.id)}>
            <span>{p.label}</span>
            {hasBadge(p) && (
              <span className="tb-shell-badge" aria-hidden="true">
                {p.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
      <main className="tb-shell-main">
        {banner}
        {children}
        {footer && <footer className="tb-shell-foot">{footer}</footer>}
      </main>
    </div>
  );
}
