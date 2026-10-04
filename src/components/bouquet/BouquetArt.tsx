import { useId, useMemo } from 'react'
import { motion } from 'framer-motion'
import type { BouquetSpec, FlowerType } from '@/types'
import { sanitizeSpec } from '@/data/bouquet'

/* ───────── colour helpers ───────── */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
const mix = (a: string, b: string, t: number) => { const x = rgb(a), y = rgb(b); return toHex(x.map((v, i) => v + (y[i] - v) * t)) }
const lighten = (c: string, t: number) => mix(c, '#ffffff', t)
const darken = (c: string, t: number) => mix(c, '#1a0a10', t)

function rng(seed: number) {
  let a = seed >>> 0
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/* ───────── one flower, centred on (0,0), nominal radius r ───────── */
function Petals({ n, r, rx, ry, fill, stroke, rot = 0, offset }: { n: number; r: number; rx: number; ry: number; fill: string; stroke: string; rot?: number; offset: number }) {
  return (
    <>{Array.from({ length: n }, (_, i) => (
      <ellipse key={i} cx={0} cy={-r * offset} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={0.6} transform={`rotate(${rot + (360 / n) * i})`} />
    ))}</>
  )
}

function Flower({ type, color, r }: { type: FlowerType; color: string; r: number }) {
  const d1 = darken(color, 0.18), d2 = darken(color, 0.34), l1 = lighten(color, 0.25)
  const edge = darken(color, 0.28)
  switch (type) {
    case 'rose':
      return (
        <g>
          <circle r={r} fill={d1} stroke={edge} strokeWidth={0.7} />
          <Petals n={7} r={r} rx={r * 0.5} ry={r * 0.42} fill={color} stroke={edge} offset={0.5} rot={10} />
          <Petals n={5} r={r} rx={r * 0.42} ry={r * 0.36} fill={l1} stroke={edge} offset={0.3} rot={40} />
          <circle r={r * 0.34} fill={color} stroke={edge} strokeWidth={0.6} />
          <path d={`M ${-r * 0.2} ${r * 0.02} Q 0 ${-r * 0.3} ${r * 0.2} ${-r * 0.02} Q ${r * 0.02} ${r * 0.2} ${-r * 0.12} ${-r * 0.04}`} fill="none" stroke={d2} strokeWidth={r * 0.06} strokeLinecap="round" />
        </g>
      )
    case 'peony':
      return (
        <g>
          <circle r={r} fill={d1} />
          <Petals n={9} r={r} rx={r * 0.46} ry={r * 0.5} fill={l1} stroke={edge} offset={0.52} />
          <Petals n={8} r={r} rx={r * 0.44} ry={r * 0.44} fill={color} stroke={edge} offset={0.34} rot={20} />
          <Petals n={6} r={r} rx={r * 0.38} ry={r * 0.36} fill={lighten(color, 0.4)} stroke={edge} offset={0.18} rot={5} />
          <circle r={r * 0.14} fill={d1} />
        </g>
      )
    case 'tulip':
      return (
        <g>
          <path d={`M ${-r * 0.7} ${-r * 0.15} Q ${-r * 0.9} ${r * 0.7} 0 ${r * 0.85} Q ${r * 0.9} ${r * 0.7} ${r * 0.7} ${-r * 0.15} Q ${r * 0.5} ${-r * 0.85} 0 ${-r * 0.55} Q ${-r * 0.5} ${-r * 0.85} ${-r * 0.7} ${-r * 0.15} Z`} fill={color} stroke={edge} strokeWidth={0.7} />
          <path d={`M ${-r * 0.35} ${-r * 0.6} Q ${-r * 0.1} ${r * 0.5} 0 ${r * 0.85} Q ${r * 0.1} ${r * 0.5} ${r * 0.35} ${-r * 0.6} Q 0 ${-r * 0.25} ${-r * 0.35} ${-r * 0.6} Z`} fill={l1} stroke={edge} strokeWidth={0.5} />
          <path d={`M ${-r * 0.7} ${-r * 0.15} Q ${-r * 0.45} ${r * 0.35} 0 ${r * 0.85}`} fill="none" stroke={d1} strokeWidth={r * 0.05} />
          <path d={`M ${r * 0.7} ${-r * 0.15} Q ${r * 0.45} ${r * 0.35} 0 ${r * 0.85}`} fill="none" stroke={d1} strokeWidth={r * 0.05} />
        </g>
      )
    case 'sunflower':
      return (
        <g>
          <Petals n={18} r={r} rx={r * 0.17} ry={r * 0.46} fill={darken(color, 0.12)} stroke={edge} offset={0.72} rot={10} />
          <Petals n={18} r={r} rx={r * 0.17} ry={r * 0.44} fill={color} stroke={edge} offset={0.68} />
          <circle r={r * 0.42} fill="#5b3418" stroke="#3a210f" strokeWidth={0.8} />
          <circle r={r * 0.3} fill="#7a4a22" />
          {Array.from({ length: 14 }, (_, i) => { const a = i * 2.4, rr = r * 0.3 * Math.sqrt((i + 1) / 14); return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr} r={r * 0.03} fill="#3a210f" /> })}
        </g>
      )
    case 'daisy':
      return (
        <g>
          <Petals n={14} r={r} rx={r * 0.13} ry={r * 0.46} fill={color} stroke={darken(color, 0.25)} offset={0.64} />
          <circle r={r * 0.26} fill="#f6c21b" stroke="#c99a0c" strokeWidth={0.8} />
          <circle r={r * 0.1} cx={-r * 0.06} cy={-r * 0.06} fill="#ffe27a" />
        </g>
      )
    case 'lily':
      return (
        <g>
          {Array.from({ length: 6 }, (_, i) => (
            <path key={i} transform={`rotate(${i * 60 + 15})`} d={`M 0 0 Q ${r * 0.42} ${-r * 0.35} 0 ${-r * 1.05} Q ${-r * 0.42} ${-r * 0.35} 0 0 Z`} fill={i % 2 ? l1 : color} stroke={edge} strokeWidth={0.6} />
          ))}
          {Array.from({ length: 6 }, (_, i) => <line key={i} x1={0} y1={0} x2={0} y2={-r * 0.6} stroke={d1} strokeWidth={0.5} transform={`rotate(${i * 60 + 15})`} />)}
          {Array.from({ length: 5 }, (_, i) => { const a = (i / 5) * Math.PI * 2; return <circle key={i} cx={Math.cos(a) * r * 0.22} cy={Math.sin(a) * r * 0.22} r={r * 0.045} fill="#c26a1a" /> })}
        </g>
      )
    case 'blossom':
      return (
        <g>
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 72})`}>
              <path d={`M 0 0 C ${-r * 0.55} ${-r * 0.3} ${-r * 0.5} ${-r * 0.95} ${-r * 0.1} ${-r * 0.92} L 0 ${-r * 0.78} L ${r * 0.1} ${-r * 0.92} C ${r * 0.5} ${-r * 0.95} ${r * 0.55} ${-r * 0.3} 0 0 Z`} fill={color} stroke={edge} strokeWidth={0.6} />
            </g>
          ))}
          <circle r={r * 0.2} fill={darken(color, 0.15)} />
          {Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * Math.PI * 2; return <circle key={i} cx={Math.cos(a) * r * 0.3} cy={Math.sin(a) * r * 0.3} r={r * 0.04} fill="#d9486f" /> })}
        </g>
      )
    case 'lavender':
      return (
        <g>
          {Array.from({ length: 11 }, (_, i) => { const y = r * 0.85 - i * r * 0.19; const w = r * 0.34 * (1 - i / 17); return (
            <g key={i}><ellipse cx={-w} cy={y} rx={r * 0.13} ry={r * 0.09} fill={i % 2 ? color : l1} transform={`rotate(-30 ${-w} ${y})`} /><ellipse cx={w} cy={y} rx={r * 0.13} ry={r * 0.09} fill={i % 2 ? l1 : color} transform={`rotate(30 ${w} ${y})`} /></g>
          ) })}
          <ellipse cx={0} cy={-r * 1.0} rx={r * 0.1} ry={r * 0.14} fill={color} />
        </g>
      )
  }
}

/* ───────── composition ───────── */
interface Placed { x: number; y: number; r: number; type: FlowerType; color: string; rot: number }

function arrange(spec: BouquetSpec, seed: number): Placed[] {
  const list: { type: FlowerType; color: string }[] = []
  spec.stems.forEach((s) => { for (let i = 0; i < s.count; i++) list.push({ type: s.type, color: s.color }) })
  const rand = rng(seed)
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [list[i], list[j]] = [list[j], list[i]] }
  const n = list.length
  if (!n) return []
  const rf = Math.max(15, Math.min(36, (150 / Math.sqrt(n)) * 0.82))
  const R = n === 1 ? 0 : rf * Math.sqrt(n) * 0.92
  return list
    .map((f, i) => {
      const rr = R * Math.sqrt((i + 0.5) / n), th = i * 2.39996 + rand() * 0.25
      const lav = f.type === 'lavender'
      return { ...f, x: 200 + Math.cos(th) * rr, y: 188 + Math.sin(th) * rr * 0.72 - (lav ? rf * 0.55 : 0), r: lav ? rf * 1.05 : rf * (0.92 + rand() * 0.16), rot: (rand() - 0.5) * 40 }
    })
    .sort((a, b) => a.y - b.y)
}

function Greenery({ kind, seed, R }: { kind: BouquetSpec['greenery']; seed: number; R: number }) {
  const rand = useMemo(() => rng(seed + 7), [seed])
  if (kind === 'none') return null
  const items = Array.from({ length: kind === 'gypsophila' ? 46 : 15 }, (_, i) => {
    const a = (-Math.PI * 0.95) + (i / (kind === 'gypsophila' ? 45 : 14)) * Math.PI * 0.9 + (rand() - 0.5) * 0.15
    const dist = R + 12 + rand() * 26
    return { x: 200 + Math.cos(a) * dist * 1.05, y: 188 + Math.sin(a) * dist * 0.85 + 8, a: (a * 180) / Math.PI + 90, s: 0.8 + rand() * 0.5 }
  })
  if (kind === 'gypsophila') return <g>{items.map((it, i) => (<g key={i}><line x1={200} y1={330} x2={it.x} y2={it.y} stroke="#6f9a6a" strokeWidth={0.8} />{[0, 1, 2, 3].map((k) => <circle key={k} cx={it.x + Math.cos(k * 1.6) * 5} cy={it.y + Math.sin(k * 1.6) * 5} r={3.2 * it.s} fill="#fff" stroke="#e7dfe2" strokeWidth={0.4} />)}</g>))}</g>
  if (kind === 'fern') return <g>{items.map((it, i) => (<g key={i} transform={`translate(${it.x} ${it.y}) rotate(${it.a})`}><path d={`M 0 22 Q 3 0 0 ${-52 * it.s}`} stroke="#3f7a4d" strokeWidth={1.4} fill="none" />{Array.from({ length: 9 }, (_, k) => <g key={k}><ellipse cx={-6} cy={14 - k * 7.5 * it.s} rx={9} ry={2.4} fill={k % 2 ? '#4f9560' : '#3f7a4d'} transform={`rotate(-35 -6 ${14 - k * 7.5 * it.s})`} /><ellipse cx={6} cy={14 - k * 7.5 * it.s} rx={9} ry={2.4} fill={k % 2 ? '#3f7a4d' : '#4f9560'} transform={`rotate(35 6 ${14 - k * 7.5 * it.s})`} /></g>)}</g>))}</g>
  return <g>{items.map((it, i) => (<g key={i} transform={`translate(${it.x} ${it.y}) rotate(${it.a})`}><path d="M 0 24 Q 2 0 0 -40" stroke="#6d8f78" strokeWidth={1.2} fill="none" />{Array.from({ length: 6 }, (_, k) => <g key={k}><ellipse cx={-7} cy={16 - k * 10} rx={7} ry={8} fill={k % 2 ? '#8db39a' : '#a7c7ae'} stroke="#6d8f78" strokeWidth={0.4} /><ellipse cx={7} cy={11 - k * 10} rx={7} ry={8} fill={k % 2 ? '#a7c7ae' : '#8db39a'} stroke="#6d8f78" strokeWidth={0.4} /></g>)}</g>))}</g>
}

function Bow({ color }: { color: string }) {
  const d = darken(color, 0.22)
  return (
    <g transform="translate(200 338)">
      <path d="M 0 0 C -48 -34 -64 -2 -46 14 C -34 24 -12 8 0 0 Z" fill={color} stroke={d} strokeWidth={0.8} />
      <path d="M 0 0 C 48 -34 64 -2 46 14 C 34 24 12 8 0 0 Z" fill={color} stroke={d} strokeWidth={0.8} />
      <path d="M 0 2 L -22 56 L -9 50 L -2 62 L 6 6 Z" fill={d} />
      <path d="M 0 2 L 24 54 L 11 49 L 5 60 L -4 6 Z" fill={color} stroke={d} strokeWidth={0.6} />
      <ellipse cx={0} cy={2} rx={9} ry={8} fill={color} stroke={d} strokeWidth={0.8} />
    </g>
  )
}

export function BouquetArt({ spec: rawSpec, seed = 11, animate = false, className }: { spec: BouquetSpec; seed?: number; animate?: boolean; className?: string }) {
  const spec = useMemo(() => sanitizeSpec(rawSpec), [rawSpec])
  const uid = useId().replace(/:/g, '')
  const flowers = useMemo(() => arrange(spec, seed), [spec, seed])
  const n = flowers.length
  const rf = n ? Math.max(15, Math.min(36, (150 / Math.sqrt(n)) * 0.82)) : 30
  const R = n <= 1 ? 0 : rf * Math.sqrt(n) * 0.92
  const wc = spec.wrapColor, wd = darken(wc, 0.2), wl = lighten(wc, 0.3)
  const stemsTo = flowers.map((f) => ({ x: f.x, y: f.y }))
  const hasWrap = spec.wrap !== 'none'

  return (
    <svg viewBox="0 0 400 480" className={className} role="img" aria-label="A bouquet of flowers">
      <defs>
        <pattern id={`dots-${uid}`} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="4" cy="4" r="2.2" fill={lighten(wc, 0.55)} /><circle cx="12" cy="12" r="1.6" fill={darken(wc, 0.25)} opacity="0.6" />
        </pattern>
        <filter id={`sh-${uid}`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#2a0a14" floodOpacity="0.25" /></filter>
      </defs>
      <ellipse cx={200} cy={466} rx={90} ry={9} fill="#2a0a14" opacity={0.12} />
      <Greenery kind={spec.greenery} seed={seed} R={R} />
      {/* stems */}
      <g stroke="#4f8a58" strokeWidth={3.2} strokeLinecap="round" fill="none">
        {stemsTo.map((p, i) => <path key={i} d={`M ${p.x} ${p.y} Q ${(p.x + 200) / 2} ${(p.y + 400) / 2} 200 410`} />)}
      </g>
      {/* flowers */}
      <g filter={`url(#sh-${uid})`}>
        {flowers.map((f, i) => (
          <g key={i} transform={`translate(${f.x} ${f.y}) rotate(${f.rot})`}>
            <motion.g
              {...(animate ? { initial: { scale: 0, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { delay: 0.4 + i * 0.07, type: 'spring', stiffness: 150, damping: 11 } } : {})}
              style={{ transformOrigin: '0px 0px' }}>
              <Flower type={f.type} color={f.color} r={f.r} />
            </motion.g>
          </g>
        ))}
      </g>
      {/* wrap */}
      {hasWrap && (
        <g filter={`url(#sh-${uid})`}>
          {spec.wrap === 'tissue' ? (
            <>
              <path d="M 92 300 Q 200 262 308 300 L 232 452 Q 200 462 168 452 Z" fill={wc} opacity={0.82} stroke={wd} strokeWidth={0.8} />
              <path d="M 120 282 Q 200 268 280 282 L 218 450 Q 200 456 182 450 Z" fill={wl} opacity={0.78} stroke={wd} strokeWidth={0.6} />
              <path d="M 150 292 L 196 448 M 250 292 L 204 448 M 200 284 L 200 450" stroke={wd} strokeWidth={0.8} opacity={0.5} />
            </>
          ) : spec.wrap === 'cone' ? (
            <>
              <path d="M 96 286 Q 200 252 304 286 L 214 460 Q 200 466 186 460 Z" fill={wc} stroke={wd} strokeWidth={1} />
              <path d="M 96 286 Q 200 252 304 286 Q 200 314 96 286 Z" fill={wl} stroke={wd} strokeWidth={0.8} />
              <path d="M 140 300 L 192 458 M 260 300 L 208 458" stroke={wd} strokeWidth={0.8} opacity={0.45} />
            </>
          ) : (
            <>
              <path d="M 88 282 Q 200 248 312 282 L 222 458 Q 200 466 178 458 Z" fill={wc} stroke={wd} strokeWidth={1} />
              {spec.wrap === 'floral' && <path d="M 88 282 Q 200 248 312 282 L 222 458 Q 200 466 178 458 Z" fill={`url(#dots-${uid})`} />}
              <path d="M 88 282 Q 200 248 312 282 Q 200 322 88 282 Z" fill={wl} stroke={wd} strokeWidth={0.8} />
              <path d="M 128 304 L 190 456 M 272 304 L 210 456 M 200 316 L 200 462" stroke={wd} strokeWidth={0.9} opacity={0.4} />
              {spec.wrap === 'kraft' && <path d="M 88 282 Q 200 248 312 282" stroke={wd} strokeWidth={2} fill="none" strokeDasharray="1 5" />}
            </>
          )}
        </g>
      )}
      {!hasWrap && <g stroke="#4f8a58" strokeWidth={9} strokeLinecap="round" opacity={0.9}><path d="M 188 330 L 196 440 M 212 330 L 204 440" /></g>}
      {/* ribbon */}
      <path d="M 163 332 Q 200 346 237 332 L 232 350 Q 200 364 168 350 Z" fill={spec.ribbon} stroke={darken(spec.ribbon, 0.25)} strokeWidth={0.8} />
      <Bow color={spec.ribbon} />
    </svg>
  )
}

/** Small round icon of a single flower (used in the designer's picker). */
export function FlowerIcon({ type, color, size = 44 }: { type: FlowerType; color: string; size?: number }) {
  return (
    <svg viewBox="-42 -42 84 84" width={size} height={size} aria-hidden>
      <g transform={type === 'lavender' ? 'translate(0 4)' : undefined}><Flower type={type} color={color} r={type === 'lavender' ? 32 : 34} /></g>
    </svg>
  )
}
