import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCouple } from '@/context/CoupleContext'
import { FullScreenLoader } from '@/components/ui/Feedback'

/** Any signed-in user (including mid-onboarding). */
export function RequireSession() {
  const { status } = useAuth()
  const loc = useLocation()
  if (status === 'loading') return <FullScreenLoader />
  if (status === 'signedOut') return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />
  return <Outlet />
}

/** Signed-in user who finished profile + verified email. Optionally needs an active couple. */
export function RequireReady({ needCouple }: { needCouple?: boolean }) {
  const { profile, profileLoading, user, isDemo } = useAuth()
  const { status } = useCouple()
  const loc = useLocation()
  if (profileLoading) return <FullScreenLoader />
  if (!isDemo) {
    if (!profile || !profile.profileComplete) return <Navigate to="/setup-profile" replace />
    if (!user?.emailVerified) return <Navigate to="/verify-email" replace />
  }
  if (needCouple) {
    if (status === 'loading') return <FullScreenLoader />
    if (status === 'none') return <Navigate to="/connect" replace state={{ from: loc.pathname }} />
  }
  return <Outlet />
}

export function GuestOnly() {
  const { status } = useAuth()
  if (status === 'loading') return <FullScreenLoader />
  if (status === 'signedIn') return <Navigate to="/home" replace />
  return <Outlet />
}
