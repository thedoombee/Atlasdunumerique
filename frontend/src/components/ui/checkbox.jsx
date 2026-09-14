import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

/** Case à cocher minimaliste pour les multi-sélections. */
export function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer flex size-4.5 shrink-0 items-center justify-center rounded-md border border-stone-300 bg-white shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary-600 data-[state=checked]:bg-primary-600 data-[state=checked]:text-white',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <Check className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}
