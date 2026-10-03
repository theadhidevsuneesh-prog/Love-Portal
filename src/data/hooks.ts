import { useCallback, useEffect, useState } from 'react'
import { useCouple } from '@/context/CoupleContext'
import { useAuth } from '@/context/AuthContext'
import type { CollectionName, Filter } from './store'
import type { CoupleDoc, NotificationType } from '@/types'

/** Realtime, couple-scoped collection. Safe to call when no couple is active. */
export function useCollection<T extends CoupleDoc>(col: CollectionName, filters?: Filter[]) {
  const { store, coupleId } = useCouple()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const key = JSON.stringify(filters ?? [])

  useEffect(() => {
    if (!coupleId) return
    setLoading(true)
    setError(false)
    return store.subscribe<T>(
      col, coupleId,
      (rows) => { setItems(rows); setLoading(false) },
      () => { setError(true); setLoading(false) },
      filters,
    )
  }, [store, coupleId, col, key]) // eslint-disable-line react-hooks/exhaustive-deps

  return { items, loading, error }
}

/** Convenience writers bound to the active couple. */
export function useWriters() {
  const { store, coupleId, partner } = useCouple()
  const { user } = useAuth()
  const uid = user?.uid ?? ''

  const add = useCallback(
    (col: CollectionName, data: Record<string, unknown>) => {
      if (!coupleId) throw new Error('no couple')
      return store.add(col, coupleId, { authorId: uid, ...data })
    },
    [store, coupleId, uid],
  )
  const set = useCallback(
    (col: CollectionName, id: string, data: Record<string, unknown>) => {
      if (!coupleId) throw new Error('no couple')
      return store.set(col, coupleId, id, data)
    },
    [store, coupleId],
  )
  const notifyPartner = useCallback(
    async (type: NotificationType, title: string, link: string, body?: string) => {
      if (!coupleId || !partner) return
      try {
        await store.add('notifications', coupleId, { toUid: partner.uid, fromUid: uid, type, title, body, link, read: false })
      } catch { /* notifications are best-effort */ }
    },
    [store, coupleId, partner, uid],
  )
  return { add, set, update: store.update, remove: store.remove, upload: store.upload, notifyPartner, uid, coupleId }
}
