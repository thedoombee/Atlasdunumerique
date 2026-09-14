import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

/** Tiroir latéral droit façon shadcn Sheet, pour les détails au clic. */
export function Sheet({ ouvert, onFermer, titre, description, children, className }) {
  return (
    <Dialog.Root open={ouvert} onOpenChange={(v) => { if (!v) onFermer?.() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/25" />
        <Dialog.Content
          className={cn(
            'fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl outline-none',
            className,
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-6 py-5">
            <div>
              <Dialog.Title className="text-base font-semibold tracking-tight">{titre}</Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-0.5 text-sm text-stone-500">{description}</Dialog.Description>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onFermer}
              aria-label="Fermer"
              className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
