import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 min-h-[44px] px-[var(--space-4)] py-[12px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-base text-[var(--text-primary)] shadow-sm transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] outline-none",
        "placeholder:text-[var(--text-tertiary)]",
        "hover:border-[var(--border-strong)]",
        "focus:border-[var(--primary-600)] focus:outline-[2px] focus:outline-[var(--primary-600)] focus:outline-offset-0",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--text-primary)]",
        "selection:bg-[var(--primary-600)] selection:text-white",
        "aria-[invalid=true]:border-[var(--error)] aria-[invalid=true]:focus:outline-[var(--error)]",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
