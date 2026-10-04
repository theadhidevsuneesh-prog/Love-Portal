import type { CoupleDoc } from '@/types'

export type CollectionName =
  | 'messages' | 'memories' | 'letters' | 'dateIdeas' | 'games' | 'surprises'
  | 'coupons' | 'timelineEvents' | 'playlist' | 'moods' | 'notifications' | 'bouquets' | 'shares' | 'booth' | 'boothFrames'

export const COUPLE_COLLECTIONS: CollectionName[] = [
  'messages', 'memories', 'letters', 'dateIdeas', 'games', 'surprises',
  'coupons', 'timelineEvents', 'playlist', 'moods', 'notifications', 'bouquets', 'shares', 'booth', 'boothFrames',
]

export type Filter = [field: string, value: string]

/** Storage backend abstraction: Firestore (live) or in-memory (demo). */
export interface Store {
  mode: 'live' | 'demo'
  subscribe<T extends CoupleDoc>(
    col: CollectionName,
    coupleId: string,
    onData: (items: T[]) => void,
    onError: (e: unknown) => void,
    filters?: Filter[],
  ): () => void
  add(col: CollectionName, coupleId: string, data: Record<string, unknown>): Promise<string>
  set(col: CollectionName, coupleId: string, id: string, data: Record<string, unknown>): Promise<void>
  update(col: CollectionName, id: string, patch: Record<string, unknown>): Promise<void>
  remove(col: CollectionName, id: string): Promise<void>
  upload(path: string, file: Blob, onProgress?: (pct: number) => void, maxBytes?: number): Promise<string>
}

/** Firestore rejects `undefined`; strip it (and keep nulls out of our model). */
export function clean<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? clean(v as Record<string, unknown>) : v
  }
  return out as T
}
