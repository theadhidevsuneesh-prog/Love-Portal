import type { CoupleDoc } from '@/types'
import { COUPLE_COLLECTIONS, type CollectionName, type Filter, type Store } from './store'

type Row = CoupleDoc & Record<string, unknown>
type Listener = () => void

/** Ephemeral in-memory store powering the demo. Nothing here touches Firebase. */
export function createMemoryStore(seed: Partial<Record<CollectionName, Row[]>>): Store {
  const data = new Map<CollectionName, Map<string, Row>>()
  const listeners = new Map<CollectionName, Set<Listener>>()
  for (const c of COUPLE_COLLECTIONS) {
    data.set(c, new Map((seed[c] ?? []).map((r) => [r.id, r])))
    listeners.set(c, new Set())
  }
  const emit = (c: CollectionName) => listeners.get(c)!.forEach((l) => l())
  let counter = 0
  const newId = () => `demo_${Date.now().toString(36)}_${counter++}`

  return {
    mode: 'demo',
    subscribe(col: CollectionName, coupleId: string, onData: (items: never[]) => void, _onError: (e: unknown) => void, filters: Filter[] = []) {
      const run = () => {
        const rows = [...data.get(col)!.values()].filter(
          (r) => r.coupleId === coupleId && filters.every(([f, v]) => r[f] === v),
        )
        onData(rows.map((r) => ({ ...r })) as never)
      }
      listeners.get(col)!.add(run)
      queueMicrotask(run)
      return () => listeners.get(col)!.delete(run)
    },
    async add(col: CollectionName, coupleId: string, d: Record<string, unknown>) {
      const id = newId()
      data.get(col)!.set(id, { ...d, id, coupleId, createdAt: Date.now() } as Row)
      emit(col)
      return id
    },
    async set(col: CollectionName, coupleId: string, id: string, d: Record<string, unknown>) {
      const prev = data.get(col)!.get(id)
      data.get(col)!.set(id, { createdAt: Date.now(), ...prev, ...d, id, coupleId } as Row)
      emit(col)
    },
    async update(col: CollectionName, id: string, patch: Record<string, unknown>) {
      const prev = data.get(col)!.get(id)
      if (!prev) return
      data.get(col)!.set(id, { ...prev, ...patch } as Row)
      emit(col)
    },
    async remove(col: CollectionName, id: string) {
      data.get(col)!.delete(id)
      emit(col)
    },
    async upload(_path: string, file: Blob, onProgress?: (pct: number) => void) {
      onProgress?.(100)
      return URL.createObjectURL(file)
    },
  }
}
