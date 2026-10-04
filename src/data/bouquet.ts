import type { BouquetSpec, FlowerType } from '@/types'

export const FLOWERS: { type: FlowerType; name: string; blurb: string; color: string }[] = [
  { type: 'rose', name: 'Rose', blurb: 'Classic love', color: '#c0213f' },
  { type: 'peony', name: 'Peony', blurb: 'Soft & lush', color: '#f19ab0' },
  { type: 'tulip', name: 'Tulip', blurb: 'Perfect love', color: '#e8587a' },
  { type: 'sunflower', name: 'Sunflower', blurb: 'My sunshine', color: '#f6c21b' },
  { type: 'daisy', name: 'Daisy', blurb: 'Pure & playful', color: '#ffffff' },
  { type: 'lily', name: 'Lily', blurb: 'Devotion', color: '#fff0f3' },
  { type: 'blossom', name: 'Cherry blossom', blurb: 'Gentle & fleeting', color: '#f9c3d2' },
  { type: 'lavender', name: 'Lavender', blurb: 'Calm & devoted', color: '#9b7fd1' },
]

export const FLOWER_COLORS = ['#c0213f', '#e8587a', '#f19ab0', '#f9d0d8', '#ffffff', '#fff0c2', '#f6c21b', '#f28c3a', '#b58be0', '#7a9cf0', '#6b1d2e', '#2b1a3a']

export const GREENERY: { id: BouquetSpec['greenery']; name: string }[] = [
  { id: 'eucalyptus', name: 'Eucalyptus' }, { id: 'fern', name: 'Fern' }, { id: 'gypsophila', name: 'Baby’s breath' }, { id: 'none', name: 'None' },
]

export const WRAPS: { id: BouquetSpec['wrap']; name: string }[] = [
  { id: 'kraft', name: 'Kraft paper' }, { id: 'tissue', name: 'Tissue' }, { id: 'cone', name: 'Cone' }, { id: 'floral', name: 'Floral print' }, { id: 'none', name: 'Just ribbon' },
]

export const WRAP_COLORS = ['#c9a27a', '#fbf1e6', '#f7c6d0', '#6b1d2e', '#2f4a3a', '#cfd8f0', '#2b1a3a', '#ffffff']
export const RIBBON_COLORS = ['#6b1d2e', '#e8587a', '#f6c21b', '#ffffff', '#2f4a3a', '#2b1a3a', '#9b7fd1', '#c9a27a']

export const MAX_FLOWERS = 30
export const MAX_STEMS = 4

export const DEFAULT_BOUQUET: BouquetSpec = {
  stems: [{ type: 'rose', color: '#c0213f', count: 7 }, { type: 'peony', color: '#f19ab0', count: 3 }],
  greenery: 'eucalyptus', wrap: 'kraft', wrapColor: '#c9a27a', ribbon: '#6b1d2e',
}

export const totalFlowers = (s: BouquetSpec) => s.stems.reduce((n, x) => n + x.count, 0)

const PLURAL: Record<FlowerType, [string, string]> = {
  rose: ['rose', 'roses'], peony: ['peony', 'peonies'], tulip: ['tulip', 'tulips'], sunflower: ['sunflower', 'sunflowers'],
  daisy: ['daisy', 'daisies'], lily: ['lily', 'lilies'], blossom: ['cherry blossom', 'cherry blossoms'], lavender: ['lavender sprig', 'lavender sprigs'],
}

export function describeBouquet(s: BouquetSpec): string {
  return s.stems.filter((x) => x.count > 0).map((x) => `${x.count} ${PLURAL[x.type]?.[x.count === 1 ? 0 : 1] ?? x.type}`).join(', ')
}

/** Validates a bouquet spec read from the database/URL before rendering (never trust remote data). */
export function sanitizeSpec(s: unknown): BouquetSpec {
  const d = DEFAULT_BOUQUET
  const o = (s ?? {}) as Partial<BouquetSpec>
  const hex = (v: unknown, fb: string) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fb)
  const types = FLOWERS.map((f) => f.type)
  const stems = (Array.isArray(o.stems) ? o.stems : d.stems).slice(0, MAX_STEMS).map((x) => ({
    type: types.includes(x?.type) ? x.type : 'rose',
    color: hex(x?.color, '#c0213f'),
    count: Math.max(0, Math.min(MAX_FLOWERS, Math.floor(Number(x?.count) || 0))),
  }))
  let left = MAX_FLOWERS
  for (const st of stems) { st.count = Math.min(st.count, left); left -= st.count }
  return {
    stems: stems.length ? stems : d.stems,
    greenery: GREENERY.some((g) => g.id === o.greenery) ? (o.greenery as BouquetSpec['greenery']) : 'none',
    wrap: WRAPS.some((w) => w.id === o.wrap) ? (o.wrap as BouquetSpec['wrap']) : 'kraft',
    wrapColor: hex(o.wrapColor, d.wrapColor),
    ribbon: hex(o.ribbon, d.ribbon),
  }
}
