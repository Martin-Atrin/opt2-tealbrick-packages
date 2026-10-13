import { type CSSProperties, type HTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";
import { cx, Ink } from "./ink.tsx";

export type Group = "memory" | "coordination" | "control" | "connections" | "creation";

/** Card: a 6px brick tile with a line ring (flat; One Lift Rule). */
export function Card({ as: Tag = "div", className, ...rest }: HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "article" | "aside" }) {
  return <Tag className={cx("tb-card", className)} {...rest} />;
}

/** Tinted panel (teal wash): at most one per page. */
export function Panel({ as: Tag = "div", className, ...rest }: HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "aside" }) {
  return <Tag className={cx("tb-panel-tint", className)} {...rest} />;
}

/** Settings section: ruled by a hairline on top (`first` = the ink rule that starts a sequence); `danger` = brick-ink head. */
export function Section({ title, first, danger, className, children }: { title: ReactNode; first?: boolean; danger?: boolean; className?: string; children: ReactNode }) {
  return (
    <section className={cx("tb-section", first && "first", danger && "danger", className)}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/** Kicker: the one swatch label that opens a page, dialog or card. Its swatch tone follows the group. */
export function Kicker({ children, group, person, open, className }: { children: ReactNode; group?: Group; person?: boolean; open?: boolean; className?: string }) {
  return <p className={cx("tb-kicker", group && `tone-${group}`, person && "is-person", open && "is-open", className)}>{children}</p>;
}

/** @deprecated 0.1.x name of Kicker (removed in 0.3.0). */
export const Eyebrow = ({ children }: { children: ReactNode }) => <Kicker>{children}</Kicker>;

/** Iso swatch (the 2px brick motif): marks the material/group, or "not made yet" when `open`. */
export function Swatch({ group, open, className }: { group?: Group; open?: boolean; className?: string }) {
  return <span className={cx("tb-swatch", group && `tone-${group}`, open && "is-open", className)} aria-hidden="true" />;
}

/**
 * Notice: neutral (tile + ring), `live` (teal wash) or `needs-you` (brick wash). No side bar.
 * @deprecated 0.1.x tones: ok → live, action → needs-you.
 */
export type NoticeTone = "neutral" | "live" | "needs-you" | "ok" | "action";
export function Notice({ tone = "neutral", role = "status", className, children }: { tone?: NoticeTone; role?: "status" | "alert"; className?: string; children: ReactNode }) {
  const t = tone === "ok" ? "live" : tone === "action" ? "needs-you" : tone;
  return (
    <div className={cx("tb-notice", t !== "neutral" && t, className)} role={role}>
      <span>{children}</span>
    </div>
  );
}

/** Empty state: the dashed mould, a short head, one line and at most one primary action. */
export function EmptyState({ title, children, action, className }: { title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx("tb-empty", className)}>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

/** Ledger table: muted 800 heads over an ink rule, hairline rows, last column right-aligned. */
export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cx("tb-table", className)} {...rest} />;
}

/** Thin 6px progress bar (in-row progress only, never the step indicator). No value = indeterminate. */
export function Progress({ value, label }: { value?: number; label: string }) {
  const indeterminate = value === undefined;
  const pct = indeterminate ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      className="tb-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(pct)}
      data-indeterminate={indeterminate}
      style={indeterminate ? undefined : ({ "--value": `${pct}%` } as CSSProperties)}
    >
      <span />
    </div>
  );
}

/** Copy block: mono value in a brick field with a Copy button; falls back to select-all when the clipboard is unavailable. */
export function CopyBlock({ text, label = "command" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }
  return (
    <div className="tb-copy">
      <code>{text}</code>
      <button type="button" className="tb-btn sm quiet" aria-label={`Copy ${label}`} onClick={() => void copy()}>
        <Ink>{copied ? "Copied" : "Copy"}</Ink>
      </button>
    </div>
  );
}

export type ChoiceOption<T extends string> = { value: T; title: string; body?: string; disabled?: boolean; note?: string };
/** Radio group drawn as brick choice cards. Arrow keys move between enabled options (roving tabindex). */
export function Choices<T extends string>({ label, options, value, onChange }: { label: string; options: ChoiceOption<T>[]; value: T | null; onChange: (v: T) => void }) {
  const enabled = options.filter((o) => !o.disabled);
  const refs = useRef(new Map<T, HTMLButtonElement>());
  function move(from: T, step: number) {
    const i = enabled.findIndex((o) => o.value === from);
    const next = enabled[(i + step + enabled.length) % enabled.length];
    if (next) {
      onChange(next.value);
      refs.current.get(next.value)?.focus();
    }
  }
  return (
    <div className="tb-choices" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        // biome-ignore lint/a11y/useSemanticElements: card-style radio needs rich content a native radio label cannot hold
        <button
          type="button"
          key={o.value}
          ref={(el) => {
            if (el) refs.current.set(o.value, el);
            else refs.current.delete(o.value);
          }}
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
            } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
              e.preventDefault();
              move(o.value, -1);
            }
          }}
        >
          <span className="tb-choice-title">{o.title}</span>
          {o.body && <span className="tb-choice-body">{o.body}</span>}
          {o.note && <span className="tb-choice-body">{o.note}</span>}
        </button>
      ))}
    </div>
  );
}

/** @deprecated 0.1.x: real controls dimmed under a veil with one panel (removed in 0.3.0). */
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

export type SetupStep = { title: string; detail?: string; command?: string };
/** @deprecated 0.1.x numbered setup list; use StepFlow for multi-step popups (C126). Removed in 0.3.0. */
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

export type StepState = "done" | "current" | "todo";
/** @deprecated 0.1.x step row; StepFlow draws the "n-Name" row itself (C126). Removed in 0.3.0. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="tb-stepflow-steps" aria-label="Progress">
      {steps.map((s, i) => (
        <li key={s} className={i < current ? "done" : undefined} aria-current={i === current ? "step" : undefined}>
          {i + 1}-{s}
        </li>
      ))}
    </ol>
  );
}
