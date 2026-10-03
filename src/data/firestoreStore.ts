import {
  addDoc, collection, deleteDoc, doc, onSnapshot, query, setDoc, updateDoc, where, type QueryConstraint,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { requireFirebase } from '@/lib/firebase'
import { clean, type CollectionName, type Filter, type Store } from './store'
import type { CoupleDoc } from '@/types'

export const firestoreStore: Store = {
  mode: 'live',
  subscribe<T extends CoupleDoc>(col: CollectionName, coupleId: string, onData: (items: T[]) => void, onError: (e: unknown) => void, filters: Filter[] = []) {
    const { db } = requireFirebase()
    const constraints: QueryConstraint[] = [where('coupleId', '==', coupleId)]
    for (const [f, v] of filters) constraints.push(where(f, '==', v))
    return onSnapshot(
      query(collection(db, col), ...constraints),
      (snap) => onData(snap.docs.map((d) => ({ ...(d.data() as object), id: d.id }) as T)),
      onError,
    )
  },
  async add(col: CollectionName, coupleId: string, data: Record<string, unknown>) {
    const { db } = requireFirebase()
    const ref = await addDoc(collection(db, col), clean({ ...data, coupleId, createdAt: Date.now() }))
    return ref.id
  },
  async set(col: CollectionName, coupleId: string, id: string, data: Record<string, unknown>) {
    const { db } = requireFirebase()
    await setDoc(doc(db, col, id), clean({ createdAt: Date.now(), ...data, coupleId }), { merge: true })
  },
  async update(col: CollectionName, id: string, patch: Record<string, unknown>) {
    const { db } = requireFirebase()
    await updateDoc(doc(db, col, id), clean(patch) as Record<string, never>)
  },
  async remove(col: CollectionName, id: string) {
    const { db } = requireFirebase()
    await deleteDoc(doc(db, col, id))
  },
  async upload(path: string, file: Blob, onProgress?: (pct: number) => void) {
    const { storage } = requireFirebase()
    const task = uploadBytesResumable(ref(storage, path), file, { contentType: file.type })
    await new Promise<void>((resolve, reject) => {
      task.on(
        'state_changed',
        (s) => onProgress?.(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
        reject,
        () => resolve(),
      )
    })
    return getDownloadURL(task.snapshot.ref)
  },
}
