import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage'

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null
let storage: FirebaseStorage | null = null

if (isFirebaseConfigured) {
  app = initializeApp(cfg)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  // Fail fast (instead of retrying for 10 minutes) so we can show a friendly upload error.
  storage.maxUploadRetryTime = 60_000
  storage.maxOperationRetryTime = 30_000
  // Local development against the Firebase Emulator Suite (see README): VITE_USE_EMULATORS=true
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    connectStorageEmulator(storage, '127.0.0.1', 9199)
  }
}

export { app, auth, db, storage }

export function requireFirebase() {
  if (!auth || !db || !storage) {
    const e = new Error('Firebase is not configured') as Error & { code: string }
    e.code = 'not-configured'
    throw e
  }
  return { auth, db, storage }
}
