/**
 * ProgressCircle — adapted from Tremor Raw (tremor.so)
 * Simplified to use cn() instead of tailwind-variants.
 */
import React from "react"
import { cn } from "@/lib/utils"

type ProgressCircleVariant = "default" | "neutral" | "warning" | "error" | "success"

const variantStyles: Record<ProgressCircleVariant, { bg: string; circle: string }> = {
  default: {
    bg: "stroke-blue-200",
    circle: "stroke-blue-500",
  },
  neutral: {
    bg: "stroke-gray-200",
    circle: "stroke-gray-500",
  },
  warning: {
    bg: "stroke-yellow-200",
    circle: "stroke-yellow-500",
  },
  error: {
    bg: "stroke-red-200",
    circle: "stroke-red-500",
  },
  success: {
    bg: "stroke-emerald-200",
    circle: "stroke-emerald-500",
  },
}

interface ProgressCircleProps extends Omit<React.SVGProps<SVGSVGElement>, "value"> {
  value?: number
  max?: number
  showAnimation?: boolean
  radius?: number
  strokeWidth?: number
  variant?: ProgressCircleVariant
  children?: React.ReactNode
}

const ProgressCircle = React.forwardRef<SVGSVGElement, ProgressCircleProps>(
  (
    {
      value = 0,
      max = 100,
      radius = 32,
      strokeWidth = 6,
      showAnimation = true,
      variant = "default",
      className,
      children,
      ...props
    },
    forwardedRef,
  ) => {
    const safeValue = Math.min(max, Math.max(value, 0))
    const normalizedRadius = radius - strokeWidth / 2
    const circumference = normalizedRadius * 2 * Math.PI
    const offset = circumference - (safeValue / max) * circumference

    const styles = variantStyles[variant]

    return (
      <div
        className="relative"
        role="progressbar"
        aria-label="Progress circle"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <svg
          ref={forwardedRef}
          width={radius * 2}
          height={radius * 2}
          viewBox={`0 0 ${radius * 2} ${radius * 2}`}
          className={cn("-rotate-90 transform", className)}
          {...props}
        >
          <circle
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            stroke=""
            strokeLinecap="round"
            className={cn("transition-colors ease-linear", styles.bg)}
          />
          {safeValue >= 0 ? (
            <circle
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={offset}
              fill="transparent"
              stroke=""
              strokeLinecap="round"
              className={cn(
                "transition-colors ease-linear",
                styles.circle,
                showAnimation && "transform-gpu transition-all duration-300 ease-in-out",
              )}
            />
          ) : null}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      </div>
    )
  },
)

ProgressCircle.displayName = "ProgressCircle"

export { ProgressCircle, type ProgressCircleProps }
