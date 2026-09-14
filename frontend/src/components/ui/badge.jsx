import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const variantesBadge = cva(
  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&_svg]:size-3',
  {
    variants: {
      variante: {
        defaut: 'border-transparent bg-primary-600 text-white',
        secondaire: 'border-transparent bg-stone-100 text-stone-700',
        succes: 'border-transparent bg-emerald-100 text-emerald-800',
        alerte: 'border-transparent bg-amber-100 text-amber-800',
        danger: 'border-transparent bg-red-100 text-red-800',
        contour: 'border-stone-200 bg-white text-stone-600',
      },
    },
    defaultVariants: { variante: 'defaut' },
  },
)

export function Badge({ variante, commeEnfant = false, className, ...props }) {
  const Composant = commeEnfant ? Slot : 'span'
  return (
    <Composant data-slot="badge" className={cn(variantesBadge({ variante }), className)} {...props} />
  )
}
