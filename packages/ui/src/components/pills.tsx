import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode } from "react";
import { cx, Ink, inked } from "./ink.tsx";

/** Status roles (DESIGN-SYSTEM §4 Three Roles): live (teal wash) · busy (teal ink + moving bar) · needs-you (brick wash)
 * · idle (line ring, muted) · open (dashed: not made yet) · default (line ring). */
export type Status = "live" | "busy" | "needs-you" | "idle" | "open" | "default";

/** Tag / status badge: a 28px pill (you see a state). */
export function Tag({ status = "default", children, title, className }: { status?: Status; children: ReactNode; title?: string; className?: string }) {
  const s = status;
  return (
    <span className={cx("tb-tag", s !== "default" && s, className)} title={title}>
      {inked(children)}
    </span>
  );
}

/** Counter pill (24px): brick-red fill for "waiting" counts, `ink` for neutral counts. */
export function Count({ children, tone = "brick", label, className }: { children: ReactNode; tone?: "brick" | "ink"; label?: string; className?: string }) {
  return (
    <span className={cx("tb-count", tone === "ink" && "ink", className)}>
      {label ? (
        <>
          <span aria-hidden="true">
            <Ink>{children}</Ink>
          </span>
          <span className="tb-sr">{label}</span>
        </>
      ) : (
        <Ink>{children}</Ink>
      )}
    </span>
  );
}

/** Filter chip (36px pill, 44px hit area): a toggle button; `pressed` = ink fill. */
export function Chip({ pressed = false, className, type = "button", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }) {
  return (
    <button type={type} className={cx("tb-chip", className)} aria-pressed={pressed} {...rest}>
      {inked(children)}
    </button>
  );
}

/** A row of filter chips with one accessible name. */
export function ChipGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a group of toggle buttons, not a form fieldset
    <div className={cx("tb-chips", className)} role="group" aria-label={label}>
      {children}
    </div>
  );
}

/** On/off switch (44×26 pill, teal-ink when on) with its visible label. */
export function Switch({
  label,
  checked,
  defaultChecked,
  onCheckedChange,
  onChange,
  className,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role"> & { label: ReactNode; onCheckedChange?: (on: boolean) => void }) {
  return (
    <label className={cx("tb-switch-row", className)}>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        className="tb-switch"
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.currentTarget.checked);
        }}
        {...rest}
      />
      <span>{label}</span>
    </label>
  );
}

/** Segmented toggle (pill track, one choice pressed), e.g. Canvas | List. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: a segmented group of toggle buttons
    <div className={cx("tb-segmented", className)} role="group" aria-label={label}>
      {options.map((o) => (
        <button type="button" key={o.value} className="tb-seg" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          <Ink>{o.label}</Ink>
        </button>
      ))}
    </div>
  );
}

/** Small floating status indicator (ink pill + swatch), e.g. "Recording · 12:04". */
export function StatusPill({ children, tone = "brick", className }: { children: ReactNode; tone?: "brick" | "teal"; className?: string }) {
  const style = { "--tone": tone === "brick" ? "var(--tb-brick)" : "var(--tb-teal)" } as CSSProperties;
  return (
    <span className={cx("tb-status-pill", className)} role="status">
      <span className="tb-swatch" style={style} aria-hidden="true" />
      <Ink>{children}</Ink>
    </span>
  );
}
