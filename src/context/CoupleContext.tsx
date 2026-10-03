import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { firestoreStore } from '@/data/firestoreStore'
import { createMemoryStore } from '@/data/memoryStore'
import { buildDemoCouple, buildDemoSeed } from '@/data/demoData'
import { subscribeCouple, subscribePartnerLink, subscribeRequests, updateCouple } from '@/data/connection'
import type { ConnectionRequest, Couple, MemberInfo } from '@/types'
import type { Store } from '@/data/store'

export interface Person extends MemberInfo { uid: string }

interface CoupleApi {
  status: 'loading' | 'none' | 'ready'
  couple: Couple | null
  coupleId: string | null
  me: Person | null
  partner: Person | null
  store: Store
  incoming: ConnectionRequest[]
  outgoing: ConnectionRequest[]
  updateCoupleFields: (patch: Partial<Couple>) => Promise<void>
}

const Ctx = createContext<CoupleApi | null>(null)

export function CoupleProvider({ children }: { children: ReactNode }) {
  const { user, isDemo, profile } = useAuth()
  const verified = Boolean(user?.emailVerified)
  const uid = user?.uid

  const [coupleId, setCoupleId] = useState<string | null | undefined>(undefined)
  const [liveCouple, setLiveCouple] = useState<Couple | null>(null)
  const [coupleLoaded, setCoupleLoaded] = useState(false)
  const [incoming, setIncoming] = useState<ConnectionRequest[]>([])
  const [outgoing, setOutgoing] = useState<ConnectionRequest[]>([])

  // Demo world is created once per demo session and discarded on exit.
  const demo = useMemo(() => {
    if (!isDemo) return null
    return { couple: buildDemoCouple(), store: createMemoryStore(buildDemoSeed()) }
  }, [isDemo])
  const [demoCouple, setDemoCouple] = useState<Couple | null>(null)
  useEffect(() => setDemoCouple(demo?.couple ?? null), [demo])

  useEffect(() => {
    if (isDemo || !uid || !verified) { setCoupleId(undefined); setLiveCouple(null); setCoupleLoaded(false); return }
    return subscribePartnerLink(uid, (id) => { setCoupleId(id); if (!id) { setLiveCouple(null); setCoupleLoaded(true) } }, () => { setCoupleId(null); setCoupleLoaded(true) })
  }, [isDemo, uid, verified])

  useEffect(() => {
    if (isDemo || !coupleId) return
    setCoupleLoaded(false)
    return subscribeCouple(coupleId, (c) => { setLiveCouple(c); setCoupleLoaded(true) }, () => setCoupleLoaded(true))
  }, [isDemo, coupleId])

  useEffect(() => {
    if (isDemo || !uid || !verified) { setIncoming([]); setOutgoing([]); return }
    return subscribeRequests(uid, (i, o) => { setIncoming(i); setOutgoing(o) }, () => undefined)
  }, [isDemo, uid, verified])

  const couple = isDemo ? demoCouple : liveCouple
  const store = isDemo && demo ? demo.store : firestoreStore

  const api = useMemo<CoupleApi>(() => {
    const myUid = uid ?? ''
    const info = couple?.memberInfo ?? {}
    const partnerUid = couple?.members.find((m) => m !== myUid)
    const mine = couple && info[myUid] ? { uid: myUid, ...info[myUid] } : null
    const theirs = couple && partnerUid && info[partnerUid] ? { uid: partnerUid, ...info[partnerUid] } : null
    // my live profile is the source of truth for my own name/photo
    const me = mine && profile ? { ...mine, name: profile.name, nickname: profile.nickname, photoURL: profile.photoURL ?? mine.photoURL } : mine

    let status: CoupleApi['status'] = 'loading'
    if (isDemo) status = couple ? 'ready' : 'loading'
    else if (!uid || !verified) status = 'none'
    else if (coupleId === undefined) status = 'loading'
    else if (!coupleId) status = 'none'
    else if (!coupleLoaded) status = 'loading'
    else status = couple && couple.status === 'active' ? 'ready' : 'none'

    return {
      status,
      couple: status === 'ready' ? couple : null,
      coupleId: status === 'ready' && couple ? couple.id : null,
      me, partner: theirs, store, incoming, outgoing,
      async updateCoupleFields(patch) {
        if (!couple) return
        if (isDemo) { setDemoCouple((c) => (c ? { ...c, ...patch } : c)); return }
        await updateCouple(couple.id, patch as Record<string, unknown>)
      },
    }
  }, [couple, uid, verified, isDemo, profile, coupleId, coupleLoaded, store, incoming, outgoing])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useCouple() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCouple outside provider')
  return c
}
