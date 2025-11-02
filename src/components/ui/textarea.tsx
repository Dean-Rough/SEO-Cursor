import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "w-full min-h-[64px] px-[var(--space-4)] py-[12px] rounded-lg border border-[var(--border-default)] bg-[var(--bg-base)] text-base text-[var(--text-primary)] shadow-sm transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)] outline-none resize-y",
        "placeholder:text-[var(--text-tertiary)]",
        "hover:border-[var(--border-strong)]",
        "focus:border-[var(--primary-600)] focus:outline-[2px] focus:outline-[var(--primary-600)] focus:outline-offset-0",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "selection:bg-[var(--primary-600)] selection:text-white",
        "aria-[invalid=true]:border-[var(--error)] aria-[invalid=true]:focus:outline-[var(--error)]",
        "md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
