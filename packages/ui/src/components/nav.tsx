import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { buttonClass } from "./button.tsx";
import { CartIcon, cx, Ink, inked } from "./ink.tsx";
import { Count } from "./pills.tsx";

/**
 * Tabs (C126: 6px brick, 44px; current = ink fill). ARIA tabs: Left/Right (and Up/Down) move and select, Home/End,
 * roving tabindex. Pass `panelId` to point each tab at its panel (`${panelId}-${value}`).
 */
export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange,
  panelId,
  className,
}: {
  label: string;
  tabs: { value: T; label: string; badge?: number | string }[];
  value: T;
  onChange: (v: T) => void;
  panelId?: string;
  className?: string;
}) {
  const refs = useRef(new Map<T, HTMLButtonElement>());
  const pick = (i: number) => {
    const t = tabs[(i + tabs.length) % tabs.length];
    if (!t) return;
    onChange(t.value);
    refs.current.get(t.value)?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowDown") pick(i + 1);
    else if (k === "ArrowLeft" || k === "ArrowUp") pick(i - 1);
    else if (k === "Home") pick(0);
    else if (k === "End") pick(tabs.length - 1);
    else return;
    e.preventDefault();
  };
  return (
    <div className={cx("tb-tabs", className)} role="tablist" aria-label={label}>
      {tabs.map((t, i) => (
        <button
          type="button"
          role="tab"
          key={t.value}
          ref={(el) => {
            if (el) refs.current.set(t.value, el);
            else refs.current.delete(t.value);
          }}
          className="tb-tab"
          aria-selected={value === t.value}
          aria-controls={panelId ? `${panelId}-${t.value}` : undefined}
          tabIndex={value === t.value ? 0 : -1}
          onClick={() => onChange(t.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          <Ink>{t.label}</Ink>
          {t.badge !== undefined && t.badge !== 0 && t.badge !== "" && <Count>{t.badge}</Count>}
        </button>
      ))}
    </div>
  );
}

/**
 * Menu: a trigger button and a brick popover of actions (float shadow). Esc closes and returns focus to the trigger;
 * Up/Down move between items; an outside pointer closes. Children are the items (<button> or <a>); a click on any of
 * them closes the menu. `align="start"` opens to the right of the trigger's left edge. An <hr> separates groups.
 */
export function Menu({
  label,
  trigger,
  children,
  variant = "quiet",
  size = "md",
  align = "end",
}: {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
  size?: "sm" | "md";
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();
  const items = () => [...(ref.current?.querySelectorAll<HTMLElement>(".tb-menu > a, .tb-menu > button") ?? [])];
  useEffect(() => {
    if (!open) return;
    items()[0]?.focus();
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      btn.current?.focus();
      return;
    }
    if (!open || (e.key !== "ArrowDown" && e.key !== "ArrowUp")) return;
    e.preventDefault();
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    list[(at + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length]?.focus();
  };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: key handling for the trigger and its items (Esc, Up/Down), not an own control
    <span className="tb-menu-anchor" ref={ref} onKeyDown={onKey}>
      <button
        ref={btn}
        type="button"
        className={buttonClass({ variant, size })}
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {inked(trigger)}
      </button>
      {open && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: items are buttons/links (keyboard handled on the anchor); the click only closes the menu
        <nav id={id} className={cx("tb-menu", align === "start" && "start")} aria-label={label} onClick={() => setOpen(false)}>
          {children}
        </nav>
      )}
    </span>
  );
}

/**
 * Toast: a brick tile with the float shadow, 700/15, bottom centre (under the header below 960px). role=status, so
 * screen readers hear it without moving focus. Optional action (teal-ink link). Closes itself after `duration` ms
 * (default 6000; 0 = stays) unless it has an action.
 */
export function Toast({
  open,
  children,
  actionLabel,
  onAction,
  onClose,
  duration = 6000,
}: {
  open: boolean;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!open || !onClose || !duration || actionLabel) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [open, onClose, duration, actionLabel]);
  if (!open) return null;
  return (
    <div className="tb-toast" role="status" aria-live="polite">
      <span>{children}</span>
      {(actionLabel || onClose) && (
        <span className="tb-toast-actions">
          {actionLabel && (
            <button type="button" className="tb-link" onClick={onAction}>
              {actionLabel}
            </button>
          )}
          {onClose && (
            <button type="button" className={buttonClass({ variant: "quiet", size: "sm" })} onClick={onClose}>
              <Ink>Close</Ink>
            </button>
          )}
        </span>
      )}
    </div>
  );
}

/**
 * The pay pill (C148: a system pill, a steady brick-red ring while a licence is unpaid; no glow). Floats bottom right
 * with the one float shadow. Rendered only when there is something to pay.
 */
export function PayPill({ count, unpaid, onOpen, label = "Review licences" }: { count: number; unpaid: boolean; onOpen: () => void; label?: string }) {
  if (count <= 0) return null;
  const apps = `${count} ${count === 1 ? "app" : "apps"}`;
  return (
    <button
      type="button"
      className={cx("tb-paypill", unpaid && "unpaid")}
      aria-haspopup="dialog"
      aria-label={`${label}, ${apps} in cart${unpaid ? ", unpaid" : ""}`}
      onClick={onOpen}
    >
      <CartIcon />
      <span>
        {label}
        <small>{apps} in your workspace</small>
      </span>
      <Count>{count}</Count>
    </button>
  );
}
