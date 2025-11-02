import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-[var(--space-4)] py-[var(--space-3)] text-sm grid has-[>svg]:grid-cols-[calc(var(--space-4)*1)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-[var(--space-3)] gap-y-[var(--space-1)] items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-default)]",
        destructive:
          "bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error)] [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--error-text)]/90",
        success:
          "bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success)] [&>svg]:text-current",
        warning:
          "bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning)] [&>svg]:text-current",
        info:
          "bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--info)] [&>svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed opacity-90",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
