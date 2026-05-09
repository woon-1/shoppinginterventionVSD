/**
 * Pause design-system primitives.
 *
 * Codifies the visual vocabulary used across InterventionModal and the popup:
 * uppercase mono eyebrows, hairline cards, accent square bullets, indigo
 * accent CTA, mono text-links, and tabular currency. Compose these instead
 * of re-typing the same Tailwind chains.
 */

import type {
  ComponentPropsWithoutRef,
  HTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

/* ---------- BrandMark ---------- */

interface BrandMarkProps {
  size?: "sm" | "md";
  className?: string;
  /** Optional trailing slot (e.g. friction Pill). */
  trailing?: ReactNode;
}

/** "Pause" wordmark + the signature accent square. */
export function BrandMark({ size = "md", className, trailing }: BrandMarkProps) {
  const text = size === "sm" ? "text-[14px]" : "text-[15px]";
  return (
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <div className="flex items-center gap-1.5">
        <span className={cn("font-semibold tracking-tight text-ink", text)}>
          Pause
        </span>
        <span
          aria-hidden
          className="size-1 shrink-0 rounded-[1px] bg-accent"
        />
      </div>
      {trailing ?? null}
    </div>
  );
}

/* ---------- Eyebrow ---------- */

interface EyebrowProps extends HTMLAttributes<HTMLElement> {
  size?: "xs" | "sm";
  as?: "div" | "span" | "label" | "p";
}

/**
 * Uppercase mono caption. The recurring "WHY?", "PAUSE STATUS", "GOAL FIRST"
 * pattern. Default size matches the modal's section labels.
 */
export function Eyebrow({
  size = "sm",
  as: Tag = "div",
  className,
  children,
  ...rest
}: EyebrowProps) {
  const sizing =
    size === "xs"
      ? "text-[10px] tracking-[0.08em]"
      : "text-[11px] tracking-[0.06em]";
  const merged = cn(
    "font-mono font-medium uppercase text-ink-3",
    sizing,
    className
  );
  // Polymorphic render without the runtime cost of a generic-poly helper:
  // each branch keeps the per-tag typing accurate for `rest`.
  if (Tag === "span") {
    return (
      <span
        className={merged}
        {...(rest as HTMLAttributes<HTMLSpanElement>)}
      >
        {children}
      </span>
    );
  }
  if (Tag === "label") {
    return (
      <label
        className={merged}
        {...(rest as HTMLAttributes<HTMLLabelElement>)}
      >
        {children}
      </label>
    );
  }
  if (Tag === "p") {
    return (
      <p
        className={merged}
        {...(rest as HTMLAttributes<HTMLParagraphElement>)}
      >
        {children}
      </p>
    );
  }
  return (
    <div className={merged} {...(rest as HTMLAttributes<HTMLDivElement>)}>
      {children}
    </div>
  );
}

/* ---------- Pill ---------- */

type PillVariant = "outline" | "accent" | "negative" | "ink";

interface PillProps extends ComponentPropsWithoutRef<"span"> {
  variant?: PillVariant;
}

/**
 * Small bordered/filled badge. Examples: STANDARD chip in modal header,
 * "Within budget" status in popup, RECOMMENDED inline label.
 */
export function Pill({
  variant = "outline",
  className,
  children,
  ...rest
}: PillProps) {
  const styles: Record<PillVariant, string> = {
    outline: "border border-ink-4 text-ink-2",
    accent: "border border-accent/30 bg-accent-fade text-accent",
    negative: "border border-negative/20 bg-negative/10 text-negative",
    ink: "border border-ink bg-ink text-paper",
  };
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.06em]",
        styles[variant],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

/* ---------- AccentDot ---------- */

interface AccentDotProps {
  className?: string;
}

/** size-1 indigo square used as a lead-in bullet next to body lines. */
export function AccentDot({ className }: AccentDotProps) {
  return (
    <span
      aria-hidden
      className={cn("size-1 shrink-0 rounded-[1px] bg-accent", className)}
    />
  );
}

/* ---------- Money ---------- */

interface MoneyProps extends ComponentPropsWithoutRef<"span"> {
  amount: number;
  /** Render large display numerals (intervention modal hero). */
  display?: boolean;
}

/** Tabular currency. Pair `display` with the modal's hero amount style. */
export function Money({
  amount,
  display = false,
  className,
  ...rest
}: MoneyProps) {
  return (
    <span
      className={cn(
        "font-mono num-tabular",
        display &&
          "text-[28px] font-semibold leading-none tracking-[-0.04em] text-ink",
        className
      )}
      {...rest}
    >
      {formatCurrency(amount)}
    </span>
  );
}

/* ---------- Card ---------- */

interface CardProps extends ComponentPropsWithoutRef<"section"> {
  /** Use `paper` for popup nesting, `surface` (default) elsewhere. */
  tone?: "surface" | "paper";
}

/**
 * Hairline-bordered card. No shadow. Use CardHeader/CardBody/CardFooter slots
 * for the same vertical rhythm the modal uses.
 */
export function Card({
  tone = "surface",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-md border border-ink-4",
        tone === "paper" ? "bg-paper" : "bg-surface",
        className
      )}
      {...rest}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-b border-ink-4 px-4 py-3",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("px-4 py-3", className)} {...rest}>
      {children}
    </div>
  );
}

/** Auto-applies the surface-2 footer strip used across the modal. */
export function CardFooter({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 border-t border-ink-4 bg-surface-2/50 px-4 py-3",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
