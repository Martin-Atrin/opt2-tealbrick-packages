import { type ReactNode, useEffect, useRef, useState } from "react";
import { Button } from "./button.tsx";
import { Dialog } from "./dialog.tsx";
import { cx } from "./ink.tsx";

export type FlowStep = {
  /** short name for the step row: shown as "n-Name" */
  name: string;
  /** optional step: shows Skip. `true` = "Skip"; a string = its own Skip label ("Skip, add keys later", "Finish later") */
  optional?: boolean | string;
  /** label of Next on this step: the step's action ("Deploy", "Buy licence", "Add agent", "Done"); default "Next" */
  nextLabel?: string;
  /** false disables Next (e.g. a required field is empty) */
  canNext?: boolean;
  /** runs on Next before moving on; resolve false (or throw) to stay on the step; Next is busy while it runs */
  onNext?: () => boolean | undefined | Promise<boolean | undefined>;
  render: () => ReactNode;
};

export type StepFlowProps = {
  open: boolean;
  title: ReactNode;
  kicker?: ReactNode;
  steps: FlowStep[];
  /** controlled step index */
  step?: number;
  /** start step (uncontrolled) */
  initialStep?: number;
  onStepChange?: (index: number) => void;
  /** Next on the last step (after its onNext), or Skip on an optional last step ("Buy later") */
  onFinish?: () => void;
  onClose: () => void;
  /** blocks Esc, Close and every step button */
  busy?: boolean;
  size?: "md" | "lg";
};

const FOCUSABLE =
  'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [role="combobox"]:not([disabled]), select:not([disabled]), [tabindex="0"]';

/** Reads --tb-dur-step (ms) from the element; 200ms when it cannot be read. */
function stepDuration(el: Element | null): number {
  if (!el || typeof getComputedStyle !== "function") return 200;
  const v = parseFloat(getComputedStyle(el).getPropertyValue("--tb-dur-step"));
  return Number.isFinite(v) && v > 0 ? v : 200;
}
const reducedMotion = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * StepFlow (C126 + C128): every multi-step popup (deploy, onboarding, add agent, authorise/pairing, licence purchase).
 * ONE step at a time in ONE fixed-size dialog (only the middle scrolls). Top: every step as "n-Name", small and
 * semi-transparent, the current one at full opacity; done steps (teal ink, ✓) can be clicked to go back. Middle: the
 * active step only. Bottom: Previous (secondary) · Skip (quiet, optional steps only) · Next (primary, the step's action).
 * A step change fades the middle to the ground (ease-in) and back (ease-out), --tb-dur-step each way; instant under
 * prefers-reduced-motion. Focus moves to the first field of the new step. All steps stay mounted (hidden), so
 * Previous keeps what was typed.
 */
export function StepFlow({ open, title, kicker, steps, step, initialStep = 0, onStepChange, onFinish, onClose, busy = false, size = "md" }: StepFlowProps) {
  const [inner, setInner] = useState(initialStep);
  const index = Math.min(Math.max(step ?? inner, 0), Math.max(steps.length - 1, 0));
  const [leaving, setLeaving] = useState(false);
  const [running, setRunning] = useState(false);
  const body = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const moved = useRef(false);
  useEffect(() => () => clearTimeout(timer.current), []);

  // after a step change: top of the middle, focus the first field of the new step
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    const el = body.current;
    if (!el) return;
    el.scrollTop = 0;
    el.querySelector<HTMLElement>(`[data-step="${index}"]`)?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
  }, [index]);

  const commit = (k: number) => {
    moved.current = true;
    if (step === undefined) setInner(k);
    onStepChange?.(k);
  };
  const go = (k: number) => {
    if (k === index || k < 0 || k >= steps.length || leaving) return;
    if (reducedMotion()) return commit(k);
    setLeaving(true);
    timer.current = setTimeout(() => {
      commit(k);
      setLeaving(false);
    }, stepDuration(body.current));
  };
  const current = steps[index];
  const last = index === steps.length - 1;
  const next = async () => {
    if (!current || running) return;
    if (current.onNext) {
      setRunning(true);
      let ok: boolean | undefined = true;
      try {
        ok = await current.onNext();
      } catch {
        ok = false;
      } finally {
        setRunning(false);
      }
      if (ok === false) return;
    }
    if (last) onFinish?.();
    else go(index + 1);
  };
  const skipLabel = current?.optional ? (typeof current.optional === "string" ? current.optional : "Skip") : "Skip";
  const locked = busy || running || leaving;

  return (
    <Dialog
      open={open}
      title={title}
      kicker={kicker}
      onClose={onClose}
      busy={busy || running}
      size={size}
      className="tb-stepflow"
      bodyRef={body}
      bodyClassName={cx(leaving && "is-leaving")}
      footClassName="tb-stepflow-foot"
      headExtra={
        <ol className="tb-stepflow-steps" aria-label="Steps">
          {steps.map((s, i) => (
            <li key={s.name} className={i < index ? "done" : undefined} aria-current={i === index ? "step" : undefined}>
              <button type="button" disabled={i > index || locked} onClick={() => go(i)}>
                {i + 1}-{s.name}
              </button>
            </li>
          ))}
        </ol>
      }
      footer={
        <>
          <Button onClick={() => go(index - 1)} disabled={index === 0 || locked}>
            Previous
          </Button>
          <Button variant="quiet" hidden={!current?.optional} onClick={() => (last ? onFinish?.() : go(index + 1))} disabled={locked}>
            {skipLabel}
          </Button>
          <Button variant="primary" className="tb-next" onClick={() => void next()} disabled={locked || current?.canNext === false}>
            {current?.nextLabel ?? "Next"}
          </Button>
        </>
      }
    >
      {steps.map((s, i) => (
        <div key={s.name} className="tb-step" data-step={i} hidden={i !== index}>
          {s.render()}
        </div>
      ))}
    </Dialog>
  );
}
