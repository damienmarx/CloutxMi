
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ChipButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/**
 * ChipButton
 *
 * A circular casino-chip styled button used for bet amount selectors.
 * Adopts the `.chip-btn` utility class from index.css.
 *
 * @example
 * <ChipButton active={selectedBet === 10} onClick={() => setSelectedBet(10)}>
 *   $10
 * </ChipButton>
 */
export function ChipButton({ active, className, children, ...props }: ChipButtonProps) {
  return (
    <button
      className={cn("chip-btn", active && "active", className)}
      {...props}
    >
      {children}
    </button>
  );
}
