import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-[var(--space-2)] whitespace-nowrap rounded-lg text-sm font-semibold transition-[transform,background,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[var(--primary-600)] text-white hover:bg-[var(--primary-700)] hover:-translate-y-[1px] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] focus-visible:outline-[2px] focus-visible:outline-[var(--primary-600)] focus-visible:outline-offset-2",
        destructive:
          "bg-[var(--error)] text-white hover:bg-[var(--error)]/90 hover:-translate-y-[1px] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] focus-visible:outline-[2px] focus-visible:outline-[var(--error)] focus-visible:outline-offset-2",
        outline:
          "border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] hover:border-[var(--border-strong)] focus-visible:outline-[2px] focus-visible:outline-[var(--primary-600)] focus-visible:outline-offset-2",
        secondary:
          "bg-[var(--bg-emphasis)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] focus-visible:outline-[2px] focus-visible:outline-[var(--primary-600)] focus-visible:outline-offset-2",
        ghost:
          "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] focus-visible:outline-[2px] focus-visible:outline-[var(--primary-600)] focus-visible:outline-offset-2",
        link: "text-[var(--primary-600)] underline-offset-4 hover:underline focus-visible:outline-[2px] focus-visible:outline-[var(--primary-600)] focus-visible:outline-offset-2",
      },
      size: {
        default: "min-h-[44px] px-[var(--space-6)] py-[12px] has-[>svg]:px-[var(--space-4)]",
        sm: "min-h-[36px] rounded-md gap-[var(--space-1)] px-[var(--space-4)] py-[8px] has-[>svg]:px-[var(--space-3)]",
        lg: "min-h-[52px] rounded-md px-[var(--space-8)] py-[16px] text-base has-[>svg]:px-[var(--space-6)]",
        icon: "size-[44px]",
        "icon-sm": "size-[36px]",
        "icon-lg": "size-[52px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
