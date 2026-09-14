import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

export default function Pagination({ page, pages, total, onPage, perPage = 15 }) {
  if (!total) return null
  const debut = (page - 1) * perPage + 1
  const fin = Math.min(page * perPage, total)
  const numeros = []
  for (let numero = 1; numero <= pages; numero += 1) {
    if (numero === 1 || numero === pages || Math.abs(numero - page) <= 1) {
      numeros.push(numero)
    }
  }
  const lignes = []
  numeros.forEach((numero, index) => {
    if (index > 0 && numero - numeros[index - 1] > 1) lignes.push('…')
    lignes.push(numero)
  })
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
      <span className="text-xs text-stone-500">
        {debut.toLocaleString('fr-FR')}–{fin.toLocaleString('fr-FR')} sur{' '}
        {total.toLocaleString('fr-FR')}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variante="contour"
          taille="petit"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft />
          Précédent
        </Button>
        {lignes.map((element, index) =>
          element === '…' ? (
            <span key={`trou-${index}`} className="px-1 text-xs text-stone-400">
              …
            </span>
          ) : (
            <Button
              key={`page-${element}`}
              variante={element === page ? 'defaut' : 'fantome'}
              taille="petit"
              className={cn(element === page && 'min-w-8')}
              onClick={() => onPage(element)}
            >
              {element}
            </Button>
          ),
        )}
        <Button
          variante="contour"
          taille="petit"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Suivant
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}
