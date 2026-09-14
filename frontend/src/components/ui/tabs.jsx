import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../lib/utils'

export function Tabs({ className, ...props }) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col gap-5', className)} {...props} />
}

export function TabsListe({ className, ...props }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex h-10 w-fit items-center justify-center gap-1 rounded-xl bg-stone-100 p-1',
        className,
      )}
      {...props}
    />
  )
}

export function TabsDeclencheur({ className, ...props }) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-1 text-sm font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-stone-900 data-[state=active]:shadow-xs data-[state=inactive]:text-stone-500 [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContenu({ className, ...props }) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}
