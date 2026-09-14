import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '../../lib/utils'

/** Curseur minimaliste pour les seuils (score, population…). */
export function Slider({ className, ...props }) {
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn('relative flex w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-stone-200">
        <SliderPrimitive.Range className="absolute h-full bg-primary-600" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label="Seuil"
        className="block size-4 shrink-0 rounded-full border-2 border-primary-600 bg-white shadow-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 disabled:pointer-events-none disabled:opacity-50"
      />
    </SliderPrimitive.Root>
  )
}
