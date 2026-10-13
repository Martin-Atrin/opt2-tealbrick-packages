import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import { ArrowIcon, cx, inked } from "./ink.tsx";

/**
 * Button variants (C125/C126: every button is a 6px brick). `primary` = the one main action per view (ink fill,
 * deep-teal hover); `secondary` = ink ring (default); `quiet` = line ring, muted; `danger` = destructive (brick-red ring;
 * pass `confirm` for the second, filled step). @deprecated 0.1.x names: `accent` → primary, `ghost` → quiet.
 */
export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "destructive" | "accent" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: "primary",
  accent: "primary",
  secondary: "",
  quiet: "quiet",
  ghost: "quiet",
  danger: "danger",
  destructive: "danger",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** danger only: the filled confirm step (the fill appears only after the first click) */
  confirm?: boolean;
  /** full width */
  block?: boolean;
  /** the arrow after the label (primary actions that move on) */
  arrow?: boolean;
};

export function buttonClass({ variant = "secondary", size = "md", confirm, block, className }: Omit<ButtonProps, "children">): string {
  const v = VARIANT_CLASS[variant];
  return cx("tb-btn", v, confirm && v === "danger" && "confirm", size !== "md" && size, block && "block", className);
}

export function Button({ variant, size, confirm, block, arrow, className, type = "button", children, ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass({ variant, size, confirm, block, className })} {...rest}>
      {inked(children)}
      {arrow && <ArrowIcon />}
    </button>
  );
}

/** A link drawn as a button (same variants). Use for navigation; Button for actions. */
export function ButtonLink({
  variant,
  size,
  block,
  arrow,
  className,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & Pick<ButtonProps, "variant" | "size" | "block" | "arrow">) {
  return (
    <a className={buttonClass({ variant, size, block, className })} {...rest}>
      {inked(children)}
      {arrow && <ArrowIcon />}
    </a>
  );
}

/** Inline teal-ink link (800, 2px underline). */
export function TextLink({ arrow, className, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { arrow?: boolean }) {
  return (
    <a className={cx("tb-link", className)} {...rest}>
      {children}
      {arrow && <ArrowIcon />}
    </a>
  );
}

/** Icon-only button: a 44px square brick. `label` is the accessible name (and the tooltip). */
export function IconButton({ label, className, type = "button", children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type={type} className={cx("tb-icon-btn", className)} aria-label={label} title={label} {...rest}>
      {children}
    </button>
  );
}

/** The dialog/inspector "Close" brick button (text label, C126). */
export function CloseButton({ label = "Close", className, type = "button", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label?: string }) {
  return (
    <button type={type} className={cx("tb-close", className)} {...rest}>
      {inked(label)}
    </button>
  );
}

/** Square ink avatar (44px brick) with initials, e.g. the account button. */
export function Avatar({ initials, label, className, type = "button", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { initials: string; label: string }) {
  return (
    <button type={type} className={cx("tb-avatar", className)} aria-label={label} {...rest}>
      {inked(initials)}
    </button>
  );
}

