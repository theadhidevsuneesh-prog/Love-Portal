import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  EmailAuthProvider, GoogleAuthProvider, browserLocalPersistence, getRedirectResult, signInWithPopup, signInWithRedirect,
  type User as FirebaseUser, browserSessionPersistence, createUserWithEmailAndPassword,
  deleteUser, onAuthStateChanged, reauthenticateWithCredential, sendEmailVerification,
  sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut as fbSignOut,
  updatePassword, updateProfile as fbUpdateProfile,
} from 'firebase/auth'
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { INLINE_MEDIA, toInlineDataUrl } from '@/lib/storageMode'
import { auth, db, isFirebaseConfigured, requireFirebase, storage } from '@/lib/firebase'
import { AppError } from '@/lib/errors'
import { createUserProfile, deleteUserDocs, syncPublicProfile } from '@/data/connection'
import { clean } from '@/data/store'
import { demoProfile } from '@/data/demoData'
import type { UserProfile } from '@/types'

export interface SessionUser { uid: string; email: string; emailVerified: boolean }

interface AuthApi {
  status: 'loading' | 'signedOut' | 'signedIn'
  user: SessionUser | null
  profile: UserProfile | null
  profileLoading: boolean
  isDemo: boolean
  configured: boolean
  enterDemo: () => void
  exitDemo: () => void
  signUp: (v: { name: string; email: string; password: string; photo?: Blob | null }) => Promise<void>
  signIn: (email: string, password: string, remember: boolean) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
  refreshUser: () => Promise<boolean>
  saveProfile: (patch: Partial<UserProfile>, photo?: Blob | null) => Promise<void>
  changePassword: (current: string, next: string) => Promise<void>
  deleteAccount: (password: string) => Promise<void>
}

const Ctx = createContext<AuthApi | null>(null)
const DEMO_KEY = 'lp_demo'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(() => {
    try { return sessionStorage.getItem(DEMO_KEY) === '1' } catch { return false }
  })
  const [user, setUser] = useState<SessionUser | null>(null)
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [demoProfileState, setDemoProfile] = useState<UserProfile>(demoProfile)

  // First Google sign-in has no profile yet: create it (with a connection code) from the Google account.
  const ensureProfile = async (u: FirebaseUser) => {
    if (!db) return
    const snap = await getDoc(doc(db, 'users', u.uid))
    if (snap.exists()) return
    await createUserProfile({
      uid: u.uid, name: (u.displayName ?? u.email?.split('@')[0] ?? 'Me').slice(0, 40), email: u.email ?? '',
      photoURL: u.photoURL ?? undefined, profileComplete: false,
    })
  }

  // Completes a Google sign-in that used the redirect fallback (e.g. popup blocked on mobile).
  useEffect(() => {
    if (!auth) return
    getRedirectResult(auth).then((r) => (r?.user ? ensureProfile(r.user) : undefined)).catch(() => undefined)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!auth) return
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, email: u.email ?? '', emailVerified: u.emailVerified } : null)
      if (!u) { setProfile(null); setProfileLoading(false) } else setProfileLoading(true)
      setAuthReady(true)
    })
  }, [])

  useEffect(() => {
    if (!user || !db) return
    return onSnapshot(
      doc(db, 'users', user.uid),
      (s) => { setProfile(s.exists() ? ({ ...(s.data() as UserProfile), uid: user.uid }) : null); setProfileLoading(false) },
      () => setProfileLoading(false),
    )
  }, [user?.uid]) // eslint-disable-line react-hooks/exhaustive-deps

  const enterDemo = useCallback(() => {
    try { sessionStorage.setItem(DEMO_KEY, '1') } catch { /* private mode */ }
    setIsDemo(true)
  }, [])
  const exitDemo = useCallback(() => {
    try { sessionStorage.removeItem(DEMO_KEY) } catch { /* ignore */ }
    setIsDemo(false)
  }, [])

  const uploadAvatar = async (uid: string, blob: Blob): Promise<string> => {
    if (INLINE_MEDIA) return toInlineDataUrl(blob, 45_000) // small: it is copied into the public code card and couple card
    const { storage: st } = requireFirebase()
    const r = ref(st, `users/${uid}/avatar.jpg`)
    await uploadBytes(r, blob, { contentType: blob.type || 'image/jpeg' })
    return getDownloadURL(r)
  }

  const api = useMemo<AuthApi>(() => {
    const demoUser: SessionUser = { uid: demoProfile.uid, email: demoProfile.email, emailVerified: true }
    return {
      status: isDemo ? 'signedIn' : !authReady ? 'loading' : user ? 'signedIn' : 'signedOut',
      user: isDemo ? demoUser : user,
      profile: isDemo ? demoProfileState : profile,
      profileLoading: isDemo ? false : profileLoading,
      isDemo,
      configured: isFirebaseConfigured,
      enterDemo,
      exitDemo,

      async signUp({ name, email, password, photo }) {
        const { auth: a } = requireFirebase()
        await setPersistence(a, browserLocalPersistence)
        const cred = await createUserWithEmailAndPassword(a, email, password)
        await fbUpdateProfile(cred.user, { displayName: name }).catch(() => undefined)
        let photoURL: string | undefined
        if (photo) {
          try { photoURL = await uploadAvatar(cred.user.uid, photo) } catch { /* non-fatal; they can add it later */ }
        }
        await createUserProfile({
          uid: cred.user.uid, name, email, photoURL, profileComplete: false,
        })
        await sendEmailVerification(cred.user).catch(() => undefined)
      },

      async signIn(email, password, remember) {
        const { auth: a } = requireFirebase()
        await setPersistence(a, remember ? browserLocalPersistence : browserSessionPersistence)
        await signInWithEmailAndPassword(a, email, password)
      },

      async signInWithGoogle() {
        const { auth: a } = requireFirebase()
        await setPersistence(a, browserLocalPersistence)
        const provider = new GoogleAuthProvider()
        provider.setCustomParameters({ prompt: 'select_account' })
        try {
          const cred = await signInWithPopup(a, provider)
          await ensureProfile(cred.user)
        } catch (e) {
          if ((e as { code?: string }).code === 'auth/popup-blocked') { await signInWithRedirect(a, provider); return }
          throw e
        }
      },

      async signOut() {
        if (isDemo) { exitDemo(); return }
        if (auth) await fbSignOut(auth)
      },

      async resetPassword(email) {
        const { auth: a } = requireFirebase()
        await sendPasswordResetEmail(a, email)
      },

      async resendVerification() {
        const u = auth?.currentUser
        if (!u) throw new AppError('no-user', 'Please log in again.')
        await sendEmailVerification(u)
      },

      async refreshUser() {
        const u = auth?.currentUser
        if (!u) return false
        await u.reload()
        if (u.emailVerified) await u.getIdToken(true)
        setUser({ uid: u.uid, email: u.email ?? '', emailVerified: u.emailVerified })
        return u.emailVerified
      },

      async saveProfile(patch, photo) {
        if (isDemo) {
          setDemoProfile((p) => ({ ...p, ...patch, profileComplete: true }))
          return
        }
        if (!user || !db) throw new AppError('no-user', 'Please log in again.')
        const next: Partial<UserProfile> = { ...patch }
        if (photo) next.photoURL = await uploadAvatar(user.uid, photo)
        await setDoc(doc(db, 'users', user.uid), clean(next as Record<string, unknown>), { merge: true })
        const merged = { ...(profile as UserProfile), ...next }
        if (merged.connectionCode) await syncPublicProfile(merged).catch(() => undefined)
        // keep my card in the shared couple document current (the partner reads names/photos from there)
        const link = await getDoc(doc(db, 'partnerLinks', user.uid)).catch(() => null)
        if (link?.exists()) {
          await updateDoc(doc(db, 'couples', link.data().coupleId as string), {
            [`memberInfo.${user.uid}`]: clean({ name: merged.name, nickname: merged.nickname, photoURL: merged.photoURL, birthday: merged.birthday }),
          }).catch(() => undefined)
        }
        if (auth?.currentUser && next.name) await fbUpdateProfile(auth.currentUser, { displayName: next.name }).catch(() => undefined)
      },

      async changePassword(current, next) {
        const u = auth?.currentUser
        if (!u || !u.email) throw new AppError('no-user', 'Please log in again.')
        await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, current))
        await updatePassword(u, next)
      },

      async deleteAccount(password) {
        const u = auth?.currentUser
        if (!u || !u.email || !profile) throw new AppError('no-user', 'Please log in again.')
        await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, password))
        await deleteUserDocs(profile).catch(() => undefined)
        if (storage && !INLINE_MEDIA) await import('firebase/storage').then(({ deleteObject }) => deleteObject(ref(storage!, `users/${u.uid}/avatar.jpg`))).catch(() => undefined)
        await deleteUser(u)
      },
    }
  }, [isDemo, authReady, user, profile, profileLoading, demoProfileState, enterDemo, exitDemo])

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useAuth() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAuth outside provider')
  return c
}
