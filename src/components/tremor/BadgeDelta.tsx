/**
 * BadgeDelta — custom component inspired by Tremor Raw.
 * Shows a value with an up/down arrow indicator.
 */
import React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/ui/icon"
import type { IconName } from "@/lib/icon-map"

type DeltaType = "increase" | "decrease" | "unchanged"

interface BadgeDeltaProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number
  suffix?: string
}

function getDeltaType(value: number): DeltaType {
  if (value > 0) return "increase"
  if (value < 0) return "decrease"
  return "unchanged"
}

const deltaStyles: Record<DeltaType, string> = {
  increase: "bg-emerald-100 text-emerald-800",
  decrease: "bg-red-100 text-red-800",
  unchanged: "bg-gray-100 text-gray-800",
}

const deltaIcons: Record<DeltaType, IconName> = {
  increase: "arrow-up",
  decrease: "arrow-down",
  unchanged: "dash",
}

const BadgeDelta = React.forwardRef<HTMLSpanElement, BadgeDeltaProps>(
  ({ value, suffix = "", className, ...props }, ref) => {
    const deltaType = getDeltaType(value)
    const displayValue = deltaType === "increase" ? `+${value}` : `${value}`

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
          deltaStyles[deltaType],
          className,
        )}
        {...props}
      >
        <Icon name={deltaIcons[deltaType]} size={14} />
        {displayValue}{suffix}
      </span>
    )
  },
)

BadgeDelta.displayName = "BadgeDelta"

export { BadgeDelta, type BadgeDeltaProps }
