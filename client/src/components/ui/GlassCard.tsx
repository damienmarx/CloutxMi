
import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional neon accent colour for the hover glow. */
  accent?: "red" | "gold" | "green" | "blue" | "purple";
  /** Render without the default padding. */
  noPadding?: boolean;
}

const accentMap: Record<NonNullable<GlassCardProps["accent"]>, string> = {
  red:    "hover:border-neon-red hover:shadow-[0_4px_48px_oklch(0_0_0/0.6),0_0_16px_var(--neon-red)]",
  gold:   "hover:border-neon-gold hover:shadow-[0_4px_48px_oklch(0_0_0/0.6),0_0_16px_var(--neon-gold)]",
  green:  "hover:border-neon-green hover:shadow-[0_4px_48px_oklch(0_0_0/0.6),0_0_16px_var(--neon-green)]",
  blue:   "hover:border-neon-blue hover:shadow-[0_4px_48px_oklch(0_0_0/0.6),0_0_16px_var(--neon-blue)]",
  purple: "hover:border-neon-purple hover:shadow-[0_4px_48px_oklch(0_0_0/0.6),0_0_16px_var(--neon-purple)]",
};

/**
 * GlassCard
 *
 * A frosted-glass surface card that forms the primary container primitive
 * across the CloutScape UI.  Drop it in anywhere you would use a plain `<div>`
 * or shadcn `<Card>` and it will automatically adopt the glassmorphism style
 * defined in index.css.
 *
 * @example
 * <GlassCard accent="gold" className="p-6">
 *   <h2 className="text-neon-gold">Your Balance</h2>
 * </GlassCard>
 */
const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, accent = "red", noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-card",
          accentMap[accent],
          !noPadding && "p-4",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
