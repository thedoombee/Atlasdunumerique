import { cn } from '../../lib/utils'

export function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'rounded-xl border border-stone-200 bg-white text-stone-900 shadow-xs',
        className,
      )}
      {...props}
    />
  )
}

export function CardEntete({ className, ...props }) {
  return (
    <div
      data-slot="card-header"
      className={cn('flex flex-col gap-1.5 p-5 pb-3', className)}
      {...props}
    />
  )
}

export function CardTitre({ className, ...props }) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-sm font-semibold tracking-tight text-stone-900', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }) {
  return (
    <p data-slot="card-description" className={cn('text-xs text-stone-500', className)} {...props} />
  )
}

export function CardContenu({ className, ...props }) {
  return <div data-slot="card-content" className={cn('p-5 pt-0', className)} {...props} />
}
