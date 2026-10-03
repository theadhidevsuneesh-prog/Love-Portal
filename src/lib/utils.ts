import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

const DAY = 86_400_000

/** Parse YYYY-MM-DD as local midnight (avoids UTC off-by-one). */
export function parseDay(s?: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

export function toDayString(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const today = () => toDayString(new Date())

export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ub - ua) / DAY)
}

export function daysSince(s?: string): number | null {
  const d = parseDay(s)
  return d ? daysBetween(d, new Date()) : null
}

/** Years / months / days breakdown between a start date and now. */
export function ymd(s?: string) {
  const start = parseDay(s)
  if (!start) return null
  const now = new Date()
  let years = now.getFullYear() - start.getFullYear()
  let months = now.getMonth() - start.getMonth()
  let days = now.getDate() - start.getDate()
  if (days < 0) {
    months -= 1
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate()
  }
  if (months < 0) {
    years -= 1
    months += 12
  }
  return { years: Math.max(years, 0), months: Math.max(months, 0), days: Math.max(days, 0) }
}

/** Next occurrence (today counts) of an annual date given as YYYY-MM-DD. */
export function nextAnnual(s?: string): { date: Date; inDays: number; years: number } | null {
  const base = parseDay(s)
  if (!base) return null
  const now = new Date()
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let next = new Date(t0.getFullYear(), base.getMonth(), base.getDate())
  if (next < t0) next = new Date(t0.getFullYear() + 1, base.getMonth(), base.getDate())
  return { date: next, inDays: daysBetween(t0, next), years: next.getFullYear() - base.getFullYear() }
}

export function formatDay(s?: string, opts?: Intl.DateTimeFormatOptions): string {
  const d = parseDay(s)
  return d
    ? d.toLocaleDateString(undefined, opts ?? { day: 'numeric', month: 'long', year: 'numeric' })
    : ''
}

export function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export function relativeTime(ms: number): string {
  const diff = Date.now() - ms
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

export function firstName(name?: string) {
  return (name ?? '').trim().split(/\s+/)[0] || ''
}

export function initials(name?: string) {
  return (name ?? '?').trim().charAt(0).toUpperCase() || '?'
}

export function pick<T>(arr: readonly T[], avoid?: T): T {
  if (arr.length === 1) return arr[0]
  let v = arr[Math.floor(Math.random() * arr.length)]
  while (avoid !== undefined && v === avoid) v = arr[Math.floor(Math.random() * arr.length)]
  return v
}

export function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export function randomCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return 'LOVE-' + Array.from(bytes, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('')
}

export function normalizeCode(raw: string): string {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '')
  return v.startsWith('LOVE-') ? v : v.length === 4 ? `LOVE-${v}` : v
}

/** Deterministic SVG gradient "photo" for demo content (no external requests). */
export function placeholderImage(seed: string, label = '', w = 800, h = 600): string {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const palettes = [
    ['#6b1d2e', '#e8a5b0'],
    ['#b88a6a', '#f7dde0'],
    ['#3d1220', '#c0566e'],
    ['#8a5a44', '#f3d9c4'],
    ['#4a1220', '#e6b8a2'],
    ['#7a2e44', '#f4cdd3'],
  ]
  const [a, b] = palettes[hash % palettes.length]
  const cx = 20 + (hash % 60)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${a}'/><stop offset='1' stop-color='${b}'/></linearGradient><radialGradient id='r' cx='${cx}%' cy='30%' r='60%'><stop offset='0' stop-color='#fff' stop-opacity='.45'/><stop offset='1' stop-color='#fff' stop-opacity='0'/></radialGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><rect width='100%' height='100%' fill='url(#r)'/><text x='50%' y='54%' text-anchor='middle' font-family='Georgia,serif' font-size='${Math.round(h / 9)}' fill='#fff' fill-opacity='.85' font-style='italic'>${label.replace(/[<>&']/g, '')}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export function downloadDataUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}
