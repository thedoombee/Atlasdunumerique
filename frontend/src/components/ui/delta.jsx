/** Pastille d'écart vs référence façon Baqia : +12,4 % vert, -3,1 % rouge. */
export function PillDelta({ valeur, reference, suffixe = 'vs moy.' }) {
  const v = Number(valeur)
  const ref = Number(reference)
  if (!Number.isFinite(v) || !Number.isFinite(ref) || ref === 0) return null
  const ecart = ((v - ref) / Math.abs(ref)) * 100
  const positif = ecart >= 0
  return (
    <span
      className={
        positif
          ? 'inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700'
          : 'inline-flex items-center gap-0.5 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700'
      }
    >
      {positif ? '▲' : '▼'} {Math.abs(ecart).toFixed(1)} % {suffixe}
    </span>
  )
}
