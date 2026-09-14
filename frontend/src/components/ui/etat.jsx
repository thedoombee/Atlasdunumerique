import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from './button'
import { Card, CardContenu } from './card'
import { Skeleton } from './skeleton'

export function ChargementCartes({ nombre = 6 }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: nombre }).map((_, index) => (
        <Card key={index}>
          <CardContenu className="space-y-3 pt-5">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </CardContenu>
        </Card>
      ))}
    </div>
  )
}

export function ChargementTable({ lignes = 8 }) {
  return (
    <Card>
      <CardContenu className="space-y-2 pt-5">
        {Array.from({ length: lignes }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-full" />
        ))}
      </CardContenu>
    </Card>
  )
}

export function ErreurCarte({ message, onReessayer }) {
  return (
    <Card>
      <CardContenu className="flex flex-col items-start gap-3 pt-5">
        <p className="flex items-center gap-2 text-sm font-medium text-red-700">
          <AlertTriangle className="size-4" />
          {message}
        </p>
        {onReessayer ? (
          <Button variante="contour" taille="petit" onClick={onReessayer}>
            <RotateCcw />
            Réessayer
          </Button>
        ) : null}
      </CardContenu>
    </Card>
  )
}
