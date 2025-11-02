"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-[var(--space-2)]", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px] bg-[var(--bg-muted)] text-[var(--text-secondary)]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-[calc(100%-1px)] flex-1 min-h-[44px] items-center justify-center gap-[var(--space-1)] rounded-md border border-transparent px-[var(--space-2)] py-1 text-sm font-medium whitespace-nowrap",
        "text-[var(--text-primary)] transition-[color,background,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out)]",
        "hover:bg-[var(--bg-subtle)]/50",
        "focus-visible:outline-[2px] focus-visible:outline-[var(--primary-600)] focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-[var(--bg-base)] data-[state=active]:shadow-sm data-[state=active]:border-[var(--border-subtle)]",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
