import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border-none px-[12px] py-[4px] text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-[var(--space-1)] [&>svg]:pointer-events-none transition-[color,background] duration-[var(--duration-fast)] ease-[var(--ease-out)] overflow-hidden max-w-full text-ellipsis leading-[1.4]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary-600)] text-white [a&]:hover:bg-[var(--primary-700)]",
        secondary:
          "bg-[var(--bg-emphasis)] text-[var(--text-secondary)] [a&]:hover:bg-[var(--bg-muted)]",
        destructive:
          "bg-[var(--error-bg)] text-[var(--error-text)] [a&]:hover:bg-[var(--error-bg)]/80",
        success:
          "bg-[var(--success-bg)] text-[var(--success-text)] [a&]:hover:bg-[var(--success-bg)]/80",
        warning:
          "bg-[var(--warning-bg)] text-[var(--warning-text)] [a&]:hover:bg-[var(--warning-bg)]/80",
        info:
          "bg-[var(--info-bg)] text-[var(--info-text)] [a&]:hover:bg-[var(--info-bg)]/80",
        outline:
          "border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] [a&]:hover:bg-[var(--bg-subtle)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
