
import { GlassCard, GlassCardProps } from "./GlassCard";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export interface StatCardProps extends GlassCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
}

/**
 * StatCard
 *
 * A specialised GlassCard for displaying a single key metric (e.g. balance,
 * total wagered, win-rate).  Renders a label, a large value, and an optional
 * trend indicator.
 *
 * @example
 * <StatCard label="Balance" value="$1,234.56" accent="gold" icon={<WalletIcon />} />
 */
export function StatCard({ label, value, icon, trend, trendValue, className, ...props }: StatCardProps) {
  const trendColour =
    trend === "up" ? "text-neon-green" :
    trend === "down" ? "text-neon-red" :
    "text-muted-foreground";

  return (
    <GlassCard className={cn("stat-card", className)} {...props}>
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <span className="stat-value">{value}</span>
      {trendValue && (
        <span className={cn("text-xs font-medium", trendColour)}>
          {trend === "up" ? "▲" : trend === "down" ? "▼" : "–"} {trendValue}
        </span>
      )}
    </GlassCard>
  );
}
