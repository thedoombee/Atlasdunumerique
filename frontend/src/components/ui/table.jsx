import { cn } from '../../lib/utils'

export function Table({ className, ...props }) {
  return (
    <div data-slot="table-wrapper" className="w-full overflow-x-auto">
      <table data-slot="table" className={cn('w-full caption-bottom text-sm', className)} {...props} />
    </div>
  )
}

export function TableEntete({ className, ...props }) {
  return <thead data-slot="table-header" className={cn('[&_tr]:border-b', className)} {...props} />
}

export function TableCorps({ className, ...props }) {
  return (
    <tbody data-slot="table-body" className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  )
}

export function TableLigne({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        'border-b border-stone-100 transition-colors hover:bg-stone-50/70',
        className,
      )}
      {...props}
    />
  )
}

export function TableCelluleEntete({ className, aligneeDroite = false, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'h-10 px-3 font-medium whitespace-nowrap text-stone-500 [&:has([role=checkbox])]:pr-0',
        aligneeDroite ? 'text-right' : 'text-left',
        className,
      )}
      {...props}
    />
  )
}

export function TableCellule({ className, aligneeDroite = false, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        'px-3 py-2.5 whitespace-nowrap text-stone-700 [&:has([role=checkbox])]:pr-0',
        aligneeDroite && 'text-right tabular-nums',
        className,
      )}
      {...props}
    />
  )
}
