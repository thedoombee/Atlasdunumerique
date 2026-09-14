import { cn } from '../../lib/utils'

export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        'h-10 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-1 text-sm text-stone-900 transition-colors outline-none placeholder:text-stone-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      data-slot="select"
      className={cn(
        'h-10 rounded-xl border border-stone-200 bg-white px-3.5 py-1 text-sm text-stone-900 transition-colors outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ className, ...props }) {
  return (
    <label
      data-slot="label"
      className={cn('text-xs font-medium text-stone-500', className)}
      {...props}
    />
  )
}
