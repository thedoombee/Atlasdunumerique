import { cn } from '../../lib/utils'

export function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-lg bg-stone-200/70', className)}
      {...props}
    />
  )
}
