import { cn } from '../../lib/utils'

export function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        'rounded-2xl border border-stone-200/80 bg-white text-stone-900 shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
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
      className={cn('flex flex-col gap-1.5 px-6 pt-6 pb-4', className)}
      {...props}
    />
  )
}

export function CardTitre({ className, ...props }) {
  return (
    <h3
      data-slot="card-title"
      className={cn('text-[15px] font-semibold tracking-tight text-stone-900', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }) {
  return (
    <p data-slot="card-description" className={cn('text-[13px] text-stone-500', className)} {...props} />
  )
}

export function CardContenu({ className, ...props }) {
  return <div data-slot="card-content" className={cn('px-6 pb-6', className)} {...props} />
}
