import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const variantesBouton = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variante: {
        defaut: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700',
        secondaire: 'bg-stone-100 text-stone-900 hover:bg-stone-200',
        contour: 'border border-stone-200 bg-white text-stone-700 shadow-xs hover:bg-stone-50',
        fantome: 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
      },
      taille: {
        defaut: 'h-9 px-4 py-2',
        petit: 'h-8 px-3 text-xs',
        icone: 'h-9 w-9',
      },
    },
    defaultVariants: { variante: 'defaut', taille: 'defaut' },
  },
)

export function Button({ variante, taille, commeEnfant = false, className, ...props }) {
  const Composant = commeEnfant ? Slot : 'button'
  return (
    <Composant
      data-slot="button"
      className={cn(variantesBouton({ variante, taille }), className)}
      {...props}
    />
  )
}
