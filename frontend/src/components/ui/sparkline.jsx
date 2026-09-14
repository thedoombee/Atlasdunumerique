import { useMemo } from 'react'
import { Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer } from 'recharts'

function preparer(donnees) {
  const valeurs = (donnees || []).map(Number).filter((v) => Number.isFinite(v))
  return valeurs.map((valeur, index) => ({ index, valeur }))
}

/** Mini-barres sans axes, esprit Tufte : forme seule, max en vert. */
export function SparklineBarres({ donnees, couleur = '#0c7a3e', couleurMax = '#0c7a3e', className = 'h-9 w-24' }) {
  const points = useMemo(() => preparer(donnees), [donnees])
  if (points.length === 0) return null
  const max = Math.max(...points.map((p) => p.valeur))
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Bar dataKey="valeur" radius={[2, 2, 0, 0]}>
            {points.map((p, i) => (
              <Cell key={i} fill={p.valeur === max ? couleurMax : couleur} fillOpacity={p.valeur === max ? 1 : 0.28} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Mini-aire lissée sans axes, avec dégradé. */
export function SparklineAire({ donnees, couleur = '#0c7a3e', className = 'h-9 w-24', idGradient }) {
  const points = useMemo(() => preparer(donnees), [donnees])
  if (points.length === 0) return null
  const gid = idGradient || `spark-${couleur.replace('#', '')}-${points.length}`
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={couleur} stopOpacity={0.45} />
              <stop offset="100%" stopColor={couleur} stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="valeur" stroke={couleur} strokeWidth={1.6} fill={`url(#${gid})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
