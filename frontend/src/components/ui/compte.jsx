import { useEffect, useRef, useState } from 'react'

/** Nombre animé (compte progressif) pour les KPI. */
export function Compte({ valeur = 0, format = (v) => String(Math.round(v)), duree = 900 }) {
  const [affiche, setAffiche] = useState(0)
  const precedent = useRef(0)
  const raf = useRef(0)

  useEffect(() => {
    const debut = precedent.current
    const fin = Number(valeur) || 0
    if (debut === fin) {
      setAffiche(fin)
      return undefined
    }
    const t0 = performance.now()
    const animer = (t) => {
      const ratio = Math.min(1, (t - t0) / duree)
      const adouci = 1 - (1 - ratio) * (1 - ratio)
      const courant = debut + (fin - debut) * adouci
      setAffiche(courant)
      if (ratio < 1) {
        raf.current = requestAnimationFrame(animer)
      } else {
        precedent.current = fin
      }
    }
    raf.current = requestAnimationFrame(animer)
    return () => {
      cancelAnimationFrame(raf.current)
      precedent.current = fin
    }
  }, [valeur, duree])

  return <span className="tabular-nums">{format(affiche)}</span>
}
