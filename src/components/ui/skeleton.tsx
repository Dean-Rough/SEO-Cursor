import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md bg-gradient-to-r from-[var(--bg-muted)] via-[var(--bg-emphasis)] to-[var(--bg-muted)] bg-[length:200%_100%] animate-[skeleton_1.5s_ease-in-out_infinite]",
        className
      )}
      style={{
        animation: "skeleton 1.5s ease-in-out infinite",
      }}
      {...props}
    />
  )
}

export { Skeleton }
