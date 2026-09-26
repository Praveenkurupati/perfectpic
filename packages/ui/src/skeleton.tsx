import { cn } from "./utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-luxury bg-cream-200", className)}
      {...props}
    />
  )
}

export { Skeleton }
