import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { fieldAria, type SelectOption, useField } from "./field.tsx";
import { cx, Ink } from "./ink.tsx";

/** The change event shape 0.1.x callers used (`onChange={(e) => set(e.target.value)}`); prefer `onValueChange`. */
export type SelectChangeEvent = { target: { value: string; name?: string }; currentTarget: { value: string; name?: string } };

export type SelectProps = {
  options: SelectOption[];
  /** controlled value */
  value?: string;
  /** uncontrolled start value */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** @deprecated 0.1.x native-select style handler; use onValueChange */
  onChange?: (e: SelectChangeEvent) => void;
  /** shown (muted) while no option is selected */
  placeholder?: string;
  disabled?: boolean;
  /** form field name: a hidden input carries the value */
  name?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

const TYPEAHEAD_MS = 600;

/**
 * Select (C128, DESIGN-SYSTEM §5a): a brick trigger + listbox popover, ARIA select-only combobox.
 * Keys on the trigger: Down/Up open, then move; Home/End; Enter/Space choose (or open); Esc closes; Tab closes;
 * typing jumps to the first option starting with the typed text. Disabled options are skipped.
 * Selected = teal wash + check; keyboard/mouse position = plate + 2px focus outline.
 */
export function Select({
  options,
  value,
  defaultValue,
  onValueChange,
  onChange,
  placeholder,
  disabled,
  name,
  id,
  className,
  ...aria
}: SelectProps) {
  const f = useField();
  const auto = useId();
  const listId = `${auto}list`;
  const valueId = `${auto}value`;
  const [inner, setInner] = useState(defaultValue ?? "");
  const current = value ?? inner;
  const selected = options.findIndex((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });

  const enabled = (i: number) => i >= 0 && i < options.length && !options[i]?.disabled;
  const first = () => options.findIndex((_, i) => enabled(i));
  const last = () => {
    for (let i = options.length - 1; i >= 0; i--) if (enabled(i)) return i;
    return -1;
  };
  const step = (from: number, d: 1 | -1) => {
    for (let i = from + d; i >= 0 && i < options.length; i += d) if (enabled(i)) return i;
    return from;
  };

  const show = () => {
    if (disabled) return;
    setOpen(true);
    setActive(enabled(selected) ? selected : first());
  };
  const hide = () => {
    setOpen(false);
    setActive(-1);
  };
  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.disabled) return;
    if (value === undefined) setInner(o.value);
    onValueChange?.(o.value);
    if (onChange) {
      const t = { value: o.value, name };
      onChange({ target: t, currentTarget: t });
    }
    hide();
    trigger.current?.focus();
  };

  // keep the keyboard position in view
  useEffect(() => {
    if (!open || active < 0) return;
    const el = list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [open, active]);

  // close on a pointer down outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) hide();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const k = e.key;
    if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      if (!open) return show();
      setActive((a) => step(a < 0 ? (k === "ArrowDown" ? -1 : options.length) : a, k === "ArrowDown" ? 1 : -1));
    } else if (k === "Home" && open) {
      e.preventDefault();
      setActive(first());
    } else if (k === "End" && open) {
      e.preventDefault();
      setActive(last());
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      if (open) choose(active);
      else show();
    } else if (k === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation(); // an open listbox eats Esc; the dialog around it stays open
      hide();
    } else if (k === "Tab" && open) {
      hide();
    } else if (k.length === 1 && /\S/.test(k) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = Date.now();
      const text = (now - typed.current.at > TYPEAHEAD_MS ? "" : typed.current.text) + k.toLowerCase();
      typed.current = { text, at: now };
      const hit = options.findIndex((o, i) => enabled(i) && o.label.trim().toLowerCase().startsWith(text));
      if (hit >= 0) {
        if (!open) setOpen(true);
        setActive(hit);
      }
    }
  };

  const wired = fieldAria(f, { id, ...aria });
  const labelledBy = aria["aria-labelledby"] ?? (aria["aria-label"] ? undefined : f?.labelId);
  const shown = options[selected];
  return (
    <div ref={root} className={cx("tb-select", className)} data-open={open || undefined}>
      <button
        ref={trigger}
        type="button"
        className="tb-select-trigger"
        role="combobox"
        id={wired.id ?? id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${auto}o${active}` : undefined}
        aria-label={aria["aria-label"]}
        aria-labelledby={labelledBy ? `${labelledBy} ${valueId}` : undefined}
        aria-describedby={wired["aria-describedby"] ?? aria["aria-describedby"]}
        aria-invalid={wired["aria-invalid"] ?? aria["aria-invalid"]}
        disabled={disabled}
        onClick={() => (open ? hide() : show())}
        onKeyDown={onKeyDown}
      >
        <span className={cx("tb-select-value", !shown && "is-placeholder")} id={valueId}>
          {shown ? shown.label : (placeholder ?? "Choose")}
        </span>
        <span className="tb-chevron" aria-hidden="true" />
      </button>
      {/* the listbox is driven from the trigger (aria-activedescendant); options take pointer input only */}
      <ul ref={list} className="tb-listbox" role="listbox" id={listId} aria-labelledby={labelledBy} aria-label={labelledBy ? undefined : aria["aria-label"]} tabIndex={-1} hidden={!open}>
        {options.map((o, i) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard input goes through the combobox trigger (ARIA select-only combobox)
          <li
            key={o.value}
            id={`${auto}o${i}`}
            data-index={i}
            role="option"
            className={cx("tb-option", i === active && "is-active")}
            aria-selected={i === selected}
            aria-disabled={o.disabled || undefined}
            onMouseMove={() => enabled(i) && active !== i && setActive(i)}
            onMouseDown={(e) => e.preventDefault() /* keep focus on the trigger */}
            onClick={(e) => {
              e.preventDefault(); // inside a Field <label>: no label activation (it would re-open the list)
              choose(i);
            }}
          >
            <Ink>{o.label}</Ink>
            {o.meta && <small>{o.meta}</small>}
          </li>
        ))}
      </ul>
      {name !== undefined && <input type="hidden" name={name} value={current} />}
    </div>
  );
}
