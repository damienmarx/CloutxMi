
import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface NeonBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: "win" | "loss" | "pending" | "info";
}

const variantMap: Record<NeonBadgeProps["variant"], string> = {
  win:     "badge-win",
  loss:    "badge-loss",
  pending: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-yellow-900/40 text-yellow-400 border border-yellow-400/50",
  info:    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-900/40 text-neon-blue border border-neon-blue/50",
};

/**
 * NeonBadge
 *
 * A small pill-shaped badge for game result status indicators.
 *
 * @example
 * <NeonBadge variant="win">Won</NeonBadge>
 * <NeonBadge variant="loss">Lost</NeonBadge>
 */
export function NeonBadge({ variant, className, children, ...props }: NeonBadgeProps) {
  return (
    <span className={cn(variantMap[variant], className)} {...props}>
      {children}
    </span>
  );
}
