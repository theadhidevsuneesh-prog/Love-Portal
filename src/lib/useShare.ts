import { useCallback } from 'react'
import { useCollection, useWriters } from '@/data/hooks'
import { useAuth } from '@/context/AuthContext'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { AppError, friendlyError } from './errors'
import { copyText } from './utils'
import { sanitizeHtml } from './sanitize'
import type { BouquetSpec, Share } from '@/types'

export const shareUrl = (id: string) => `${window.location.origin}/s/${id}`

type Source =
  | { kind: 'letter'; sourceId: string; title: string; html: string; photoURL?: string }
  | { kind: 'bouquet'; sourceId: string; title: string; message?: string; spec: BouquetSpec }

/**
 * Public, unlisted share links. A link is a `shares` document whose auto-generated id is the secret token;
 * only couple members can create / list / delete (revoke) them.
 */
export function useShareLink() {
  const { items } = useCollection<Share>('shares')
  const { add, remove } = useWriters()
  const { isDemo } = useAuth()
  const { me } = useCouple()
  const toast = useToast()

  const find = useCallback((sourceId: string) => items.find((s) => s.sourceId === sourceId), [items])

  const share = useCallback(async (src: Source) => {
    try {
      if (isDemo) throw new AppError('demo', 'Share links work with a real account — create yours to try it.')
      let existing = find(src.sourceId)
      let id = existing?.id
      if (!id) {
        const base = { kind: src.kind, sourceId: src.sourceId, title: src.title, fromName: me?.name ?? '' }
        const data = src.kind === 'letter'
          ? { ...base, html: sanitizeHtml(src.html), ...(src.photoURL && src.photoURL.length < 500_000 ? { photoURL: src.photoURL } : {}) }
          : { ...base, message: src.message, spec: src.spec }
        id = await add('shares', data)
      }
      existing = undefined
      const url = shareUrl(id)
      const text = src.kind === 'letter' ? `${me?.name} wrote you a letter 💌` : `${me?.name} made you a bouquet 💐`
      if (typeof navigator.share === 'function') {
        try { await navigator.share({ title: src.title, text, url }); return url } catch (e) { if ((e as Error).name === 'AbortError') return url }
      }
      toast.show((await copyText(url)) ? 'Link copied — paste it anywhere 💌' : url, 'love')
      return url
    } catch (e) { toast.error(friendlyError(e, "We couldn't create that link. Please try again.")); return null }
  }, [add, find, isDemo, me?.name, toast])

  const revoke = useCallback(async (sourceId: string) => {
    const s = find(sourceId)
    if (!s) return
    try { await remove('shares', s.id); toast.success('Link turned off. It no longer opens.') } catch (e) { toast.error(friendlyError(e)) }
  }, [find, remove, toast])

  return { find, share, revoke }
}
