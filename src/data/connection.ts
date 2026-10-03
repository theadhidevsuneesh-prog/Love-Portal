import {
  collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, runTransaction, setDoc, where, writeBatch,
} from 'firebase/firestore'
import { requireFirebase } from '@/lib/firebase'
import { AppError } from '@/lib/errors'
import { clean, COUPLE_COLLECTIONS } from './store'
import { randomCode, normalizeCode } from '@/lib/utils'
import type { CodeEntry, ConnectionRequest, Couple, UserProfile } from '@/types'

const REQUEST_TTL = 7 * 86_400_000

/** Create profile + a unique connection code atomically (code docs can't be overwritten by others). */
export async function createUserProfile(
  base: Omit<UserProfile, 'connectionCode' | 'createdAt'>,
): Promise<UserProfile> {
  const { db } = requireFirebase()
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode()
    try {
      const profile: UserProfile = { ...base, connectionCode: code, createdAt: Date.now() }
      await runTransaction(db, async (tx) => {
        const codeRef = doc(db, 'connectionCodes', code)
        if ((await tx.get(codeRef)).exists()) throw new AppError('code-taken', 'retry')
        tx.set(codeRef, clean({ code, uid: base.uid, name: base.name, photoURL: base.photoURL }))
        tx.set(doc(db, 'users', base.uid), clean(profile as unknown as Record<string, unknown>))
      })
      return profile
    } catch (e) {
      if (e instanceof AppError && e.code === 'code-taken') continue
      throw e
    }
  }
  throw new AppError('code-failed', "We couldn't create your connection code. Please try again.")
}

export async function regenerateCode(profile: UserProfile): Promise<string> {
  const { db } = requireFirebase()
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode()
    try {
      await runTransaction(db, async (tx) => {
        const codeRef = doc(db, 'connectionCodes', code)
        if ((await tx.get(codeRef)).exists()) throw new AppError('code-taken', 'retry')
        tx.set(codeRef, clean({ code, uid: profile.uid, name: profile.name, photoURL: profile.photoURL }))
        tx.update(doc(db, 'users', profile.uid), { connectionCode: code })
        tx.delete(doc(db, 'connectionCodes', profile.connectionCode))
      })
      return code
    } catch (e) {
      if (e instanceof AppError && e.code === 'code-taken') continue
      throw e
    }
  }
  throw new AppError('code-failed', "We couldn't refresh your code. Please try again.")
}

export async function syncPublicProfile(profile: UserProfile) {
  const { db } = requireFirebase()
  await setDoc(
    doc(db, 'connectionCodes', profile.connectionCode),
    clean({ code: profile.connectionCode, uid: profile.uid, name: profile.name, photoURL: profile.photoURL }),
  )
}

export async function lookupCode(raw: string, myUid: string): Promise<CodeEntry> {
  const { db } = requireFirebase()
  const code = normalizeCode(raw)
  if (!/^LOVE-[A-Z0-9]{4}$/.test(code)) {
    throw new AppError('invalid-code', "That code doesn't look right. Codes look like LOVE-7X92.")
  }
  const snap = await getDoc(doc(db, 'connectionCodes', code))
  if (!snap.exists()) {
    throw new AppError('invalid-code', "We couldn't find anyone with that code. Double-check it with your person.")
  }
  const entry = snap.data() as CodeEntry
  if (entry.uid === myUid) throw new AppError('self', "That's your own code — you'll need your person's code.")
  return entry
}

export async function sendRequest(me: UserProfile, target: CodeEntry): Promise<void> {
  const { db } = requireFirebase()
  if (target.uid === me.uid) throw new AppError('self', "You can't connect with yourself.")
  const id = `${me.uid}_${target.uid}`
  const reverse = await getDoc(doc(db, 'connectionRequests', `${target.uid}_${me.uid}`))
  if (reverse.exists() && (reverse.data() as ConnectionRequest).status === 'pending') {
    throw new AppError('reverse', `${target.name} has already sent you a request — accept it below!`)
  }
  const existing = await getDoc(doc(db, 'connectionRequests', id))
  if (existing.exists()) {
    const r = existing.data() as ConnectionRequest
    if (r.status === 'pending' && r.expiresAt > Date.now()) {
      throw new AppError('duplicate', `You've already sent ${target.name} a request. Hang tight ❤️`)
    }
  }
  const req: Omit<ConnectionRequest, 'id'> = {
    fromUid: me.uid,
    toUid: target.uid,
    fromName: me.name,
    fromPhoto: me.photoURL,
    toName: target.name,
    toPhoto: target.photoURL,
    status: 'pending',
    createdAt: Date.now(),
    expiresAt: Date.now() + REQUEST_TTL,
  }
  await setDoc(doc(db, 'connectionRequests', id), clean(req as unknown as Record<string, unknown>))
}

export function subscribeRequests(
  uid: string,
  onData: (incoming: ConnectionRequest[], outgoing: ConnectionRequest[]) => void,
  onError: (e: unknown) => void,
) {
  const { db } = requireFirebase()
  let inc: ConnectionRequest[] = []
  let out: ConnectionRequest[] = []
  const map = (s: { docs: { id: string; data(): unknown }[] }) =>
    s.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as ConnectionRequest)
  const u1 = onSnapshot(query(collection(db, 'connectionRequests'), where('toUid', '==', uid)), (s) => {
    inc = map(s)
    onData(inc, out)
  }, onError)
  const u2 = onSnapshot(query(collection(db, 'connectionRequests'), where('fromUid', '==', uid)), (s) => {
    out = map(s)
    onData(inc, out)
  }, onError)
  return () => { u1(); u2() }
}

export async function declineRequest(req: ConnectionRequest) {
  const { db } = requireFirebase()
  await setDoc(doc(db, 'connectionRequests', req.id), { status: 'declined' }, { merge: true })
}

export async function cancelRequest(req: ConnectionRequest) {
  const { db } = requireFirebase()
  await setDoc(doc(db, 'connectionRequests', req.id), { status: 'cancelled' }, { merge: true })
}

/** Recipient accepts: request→accepted, couple created, both partnerLinks created — one atomic batch. */
export async function acceptRequest(req: ConnectionRequest, me: UserProfile): Promise<string> {
  const { db } = requireFirebase()
  if (req.expiresAt < Date.now()) {
    throw new AppError('expired', 'This invitation has expired. Ask your person to send a new one.')
  }
  // We can only read our own partnerLink; the other person's is enforced by the security rules
  // (the batch below is rejected atomically if either of you is already connected).
  const mine = await getDoc(doc(db, 'partnerLinks', me.uid))
  if (mine.exists()) throw new AppError('already', "You're already connected with someone.")

  const coupleRef = doc(collection(db, 'couples'))
  const couple: Omit<Couple, 'id'> = {
    members: [req.fromUid, me.uid],
    memberInfo: {
      [req.fromUid]: clean({ name: req.fromName, photoURL: req.fromPhoto }),
      [me.uid]: clean({ name: me.name, nickname: me.nickname, photoURL: me.photoURL, birthday: me.birthday }),
    },
    requestId: req.id,
    status: 'active',
    createdAt: Date.now(),
  }
  const batch = writeBatch(db)
  batch.update(doc(db, 'connectionRequests', req.id), { status: 'accepted', coupleId: coupleRef.id })
  batch.set(coupleRef, clean(couple as unknown as Record<string, unknown>))
  batch.set(doc(db, 'partnerLinks', req.fromUid), { coupleId: coupleRef.id, partnerId: me.uid })
  batch.set(doc(db, 'partnerLinks', me.uid), { coupleId: coupleRef.id, partnerId: req.fromUid })
  try {
    await batch.commit()
  } catch (e) {
    if ((e as { code?: string }).code === 'permission-denied') {
      throw new AppError('taken', 'This connection is no longer available — one of you may already be connected.')
    }
    throw e
  }
  return coupleRef.id
}

/** Re-subscribes a few times when a listener dies (e.g. a read raced a write that hadn't committed yet). */
function resilient<T>(
  start: (onData: (v: T) => void, onError: (e: unknown) => void) => () => void,
  onData: (v: T) => void,
  onError: (e: unknown) => void,
): () => void {
  let stopped = false
  let attempts = 0
  let unsub: () => void = () => undefined
  let timer: ReturnType<typeof setTimeout> | undefined
  const run = () => {
    unsub = start(
      (v) => { attempts = 0; onData(v) },
      (e) => {
        if (stopped) return
        if (attempts++ < 4) timer = setTimeout(run, 600 * attempts)
        else onError(e)
      },
    )
  }
  run()
  return () => { stopped = true; clearTimeout(timer); unsub() }
}

export function subscribePartnerLink(
  uid: string,
  onData: (coupleId: string | null) => void,
  onError: (e: unknown) => void,
) {
  const { db } = requireFirebase()
  return resilient<string | null>(
    (ok, err) => onSnapshot(doc(db, 'partnerLinks', uid), (s) => ok(s.exists() ? (s.data().coupleId as string) : null), err),
    onData, onError,
  )
}

export function subscribeCouple(id: string, onData: (c: Couple | null) => void, onError: (e: unknown) => void) {
  const { db } = requireFirebase()
  return resilient<Couple | null>(
    (ok, err) => onSnapshot(doc(db, 'couples', id), (s) => ok(s.exists() ? ({ ...(s.data() as object), id: s.id } as Couple) : null), err),
    onData, onError,
  )
}

export async function updateCouple(id: string, patch: Record<string, unknown>) {
  const { db } = requireFirebase()
  await setDoc(doc(db, 'couples', id), clean(patch), { merge: true })
}

/** Deletes every couple-owned document (messages, memories, …) for this couple. */
export async function deleteCoupleData(coupleId: string) {
  const { db } = requireFirebase()
  for (const name of COUPLE_COLLECTIONS) {
    const snap = await getDocs(query(collection(db, name), where('coupleId', '==', coupleId)))
    for (let i = 0; i < snap.docs.length; i += 400) {
      const batch = writeBatch(db)
      snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  }
}

/** Ends the relationship link for both people. Couple data is kept unless deleted separately. */
export async function disconnectCouple(couple: Couple) {
  const { db } = requireFirebase()
  const batch = writeBatch(db)
  couple.members.forEach((uid) => batch.delete(doc(db, 'partnerLinks', uid)))
  batch.update(doc(db, 'couples', couple.id), { status: 'disconnected' })
  await batch.commit()
}

export async function deleteUserDocs(profile: UserProfile) {
  const { db } = requireFirebase()
  const batch = writeBatch(db)
  batch.delete(doc(db, 'connectionCodes', profile.connectionCode))
  batch.delete(doc(db, 'users', profile.uid))
  await batch.commit()
  await deleteDoc(doc(db, 'partnerLinks', profile.uid)).catch(() => undefined)
}
