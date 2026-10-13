import { type ReactNode, type RefObject, useEffect, useId, useRef } from "react";
import { CloseButton } from "./button.tsx";
import { cx } from "./ink.tsx";
import { Kicker } from "./surfaces.tsx";

export type DialogProps = {
  open: boolean;
  title: ReactNode;
  /** the kicker line above the title */
  kicker?: ReactNode;
  /** @deprecated 0.1.x name of `kicker` */
  eyebrow?: ReactNode;
  onClose: () => void;
  /** blocks Esc and Close so an in-flight action cannot be abandoned half way */
  busy?: boolean;
  size?: "md" | "lg";
  footer?: ReactNode;
  className?: string;
  /** extra head content under the title (StepFlow puts its step row here) */
  headExtra?: ReactNode;
  bodyRef?: RefObject<HTMLDivElement | null>;
  bodyClassName?: string;
  footClassName?: string;
  children: ReactNode;
};

/**
 * Dialog on a native modal <dialog> (showModal): platform focus trap, Esc, and the page behind is inert (C128).
 * Brick tile with the one float shadow; head = kicker, h2 26/900 and a "Close" brick button; foot under a hairline with
 * the buttons on the right (primary last). Width 560 (`lg` 820); a bottom sheet on phone.
 */
export function Dialog({
  open,
  title,
  kicker,
  eyebrow,
  onClose,
  busy = false,
  size = "md",
  footer,
  className,
  headExtra,
  bodyRef,
  bodyClassName,
  footClassName,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      if (typeof el.showModal === "function") el.showModal();
      else el.setAttribute("open", "");
    }
    if (!open && el.open) {
      if (typeof el.close === "function") el.close();
      else el.removeAttribute("open");
    }
  }, [open]);
  const k = kicker ?? eyebrow;
  return (
    <dialog
      ref={ref}
      className={cx("tb-dialog", size === "lg" && "lg", className)}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      {open && (
        <>
          <div className="tb-dialog-head">
            {k && <Kicker>{k}</Kicker>}
            <CloseButton onClick={onClose} disabled={busy} />
            <h2 id={titleId}>{title}</h2>
            {headExtra}
          </div>
          <div className={cx("tb-dialog-body", bodyClassName)} ref={bodyRef}>
            {children}
          </div>
          {footer && <div className={cx("tb-dialog-foot", footClassName)}>{footer}</div>}
        </>
      )}
    </dialog>
  );
}
