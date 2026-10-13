import { createContext, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, useContext, useId } from "react";
import { cx } from "./ink.tsx";

/** What a Field tells the kit control inside it: the ids that name and describe it, and whether it is invalid. */
export type FieldInfo = { controlId: string; labelId: string; describedBy?: string; invalid: boolean };
const FieldContext = createContext<FieldInfo | null>(null);
/** The surrounding Field, if any (for custom controls that want the same label/hint wiring). */
export const useField = (): FieldInfo | null => useContext(FieldContext);

/**
 * A labelled field: label 800/15 above, the control, then a hint (muted) or an error (brick-ink 700; the control gets
 * aria-invalid and a 2px brick ring). Kit controls inside (TextInput, Textarea, Select, NativeSelect) are wired by
 * aria-labelledby / aria-describedby. The wrapper is a <label>, so any other control passed as a child is still named.
 */
export function Field({ label, hint, error, id, className, children }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; id?: string; className?: string; children: ReactNode }) {
  const auto = useId();
  const controlId = id ?? `${auto}c`;
  const labelId = `${auto}l`;
  const noteId = `${auto}n`;
  const note = error ? (
    <span className="tb-error" id={noteId} role="alert">
      {error}
    </span>
  ) : hint ? (
    <span className="tb-hint" id={noteId}>
      {hint}
    </span>
  ) : null;
  return (
    <FieldContext.Provider value={{ controlId, labelId, describedBy: note ? noteId : undefined, invalid: !!error }}>
      {/* biome-ignore lint/a11y/noLabelWithoutControl: the control is passed as children */}
      <label className={cx("tb-field", className)}>
        <span className="tb-label" id={labelId}>
          {label}
        </span>
        {children}
        {note}
      </label>
    </FieldContext.Provider>
  );
}

/** aria wiring a kit control takes from its Field (explicit props win). */
export function fieldAria(
  f: FieldInfo | null,
  props: { id?: string; "aria-labelledby"?: string; "aria-label"?: string; "aria-describedby"?: string; "aria-invalid"?: unknown },
) {
  if (!f) return {};
  return {
    id: props.id ?? f.controlId,
    "aria-labelledby": props["aria-labelledby"] ?? (props["aria-label"] ? undefined : f.labelId),
    "aria-describedby": props["aria-describedby"] ?? f.describedBy,
    "aria-invalid": (props["aria-invalid"] as boolean | undefined) ?? (f.invalid || undefined),
  };
}

/** Single-line input: brick, 44px, 14px text (16px on iOS). `code` = the mono 22px code field. */
export function TextInput({ className, code, ...rest }: InputHTMLAttributes<HTMLInputElement> & { code?: boolean }) {
  const f = useField();
  return <input className={cx("tb-input", code && "code", className)} {...fieldAria(f, rest)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const f = useField();
  return <textarea className={cx("tb-textarea", className)} {...fieldAria(f, rest)} {...rest} />;
}

export type SelectOption = { value: string; label: string; disabled?: boolean; meta?: string };

/** The native <select> fallback (no JavaScript, or very long lists), styled with the same tokens and chevron. */
export function NativeSelect({ options, className, ...rest }: SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  const f = useField();
  return (
    <select className={cx("tb-select-native", className)} {...fieldAria(f, rest)} {...rest}>
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
