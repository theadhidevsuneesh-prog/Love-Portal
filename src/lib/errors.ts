/** Maps any thrown value to a friendly, non-technical message. */
export class AppError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }
}

const MAP: Record<string, string> = {
  'auth/invalid-credential': "That email and password don't match. Please try again.",
  'auth/wrong-password': "That email and password don't match. Please try again.",
  'auth/user-not-found': "We couldn't find an account with that email.",
  'auth/invalid-email': 'That email address looks a little off.',
  'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
  'auth/weak-password': 'Please choose a stronger password (at least 8 characters).',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': "We can't reach the internet right now. Check your connection.",
  'auth/requires-recent-login': 'For your security, please confirm your password to continue.',
  'auth/user-disabled': 'This account has been disabled. Please contact us.',
  'auth/popup-closed-by-user': 'The sign-in window was closed before finishing.',
  'auth/cancelled-popup-request': 'The sign-in window was closed before finishing.',
  'auth/account-exists-with-different-credential': 'An account with this email already exists. Log in with your email and password instead.',
  'auth/unauthorized-domain': "This website address isn't approved for Google sign-in yet. Please contact support.",
  'auth/operation-not-allowed': "This sign-in method isn't switched on yet. Please contact support.",
  'permission-denied': "You don't have access to that. If this seems wrong, try logging in again.",
  'firestore/permission-denied': "You don't have access to that.",
  unavailable: "We can't reach Love Portal right now. Check your connection and try again.",
  'storage/unauthorized': "You don't have permission to upload that.",
  'storage/canceled': 'The upload was cancelled.',
  'storage/quota-exceeded': 'Storage is full right now. Please try again later.',
  'storage/retry-limit-exceeded': 'The upload took too long. Please try again on a better connection.',
  'storage/unknown': "That upload didn't go through. Please try again.",
  'storage/invalid-checksum': "That upload didn't go through. Please try again.",
  'not-configured':
    "Love Portal isn't connected to a database yet. Explore the demo, or add your Firebase keys to go live.",
}

export function friendlyError(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (e instanceof AppError) return e.message
  const code = (e as { code?: string } | null)?.code
  if (code && MAP[code]) return MAP[code]
  if (code?.startsWith('auth/')) return "We couldn't sign you in. Please try again."
  if (typeof navigator !== 'undefined' && !navigator.onLine) return MAP['auth/network-request-failed']
  return fallback
}

export function cameraErrorMessage(e: unknown): string {
  const name = (e as { name?: string } | null)?.name
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Camera access is blocked. Allow the camera for this site in your browser settings, then try again.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return "We couldn't find a camera on this device."
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Your camera seems to be in use by another app. Close it and try again.'
    default:
      return "We couldn't start your camera. Please try again."
  }
}
