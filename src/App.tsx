import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { GuestOnly, RequireReady, RequireSession } from '@/components/layout/Guards'
import { AppShell } from '@/components/layout/AppShell'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { ConnectionCeremony } from '@/components/features/ConnectionCeremony'
import { FullScreenLoader } from '@/components/ui/Feedback'
import { useAuth } from '@/context/AuthContext'

const Landing = lazy(() => import('@/pages/Landing'))
const Login = lazy(() => import('@/pages/auth/Login'))
const Signup = lazy(() => import('@/pages/auth/Signup'))
const Forgot = lazy(() => import('@/pages/auth/ForgotPassword'))
const VerifyEmail = lazy(() => import('@/pages/auth/VerifyEmail'))
const SetupProfile = lazy(() => import('@/pages/auth/SetupProfile'))
const Connect = lazy(() => import('@/pages/Connect'))
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Memories = lazy(() => import('@/pages/Memories'))
const PhotoBooth = lazy(() => import('@/pages/PhotoBooth'))
const Chat = lazy(() => import('@/pages/Chat'))
const Letters = lazy(() => import('@/pages/Letters'))
const Dates = lazy(() => import('@/pages/Dates'))
const Games = lazy(() => import('@/pages/Games'))
const Surprises = lazy(() => import('@/pages/Surprises'))
const OurStory = lazy(() => import('@/pages/OurStory'))
const Playlist = lazy(() => import('@/pages/Playlist'))
const Assistant = lazy(() => import('@/pages/Assistant'))
const Settings = lazy(() => import('@/pages/Settings'))
const Legal = lazy(() => import('@/pages/Legal'))
const Bouquets = lazy(() => import('@/pages/Bouquets'))
const SharedView = lazy(() => import('@/pages/SharedView'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const DemoEntry = lazy(() => import('@/pages/DemoEntry'))

function ScrollAndTheme() {
  const { pathname } = useLocation()
  const { profile } = useAuth()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => {
    let local: string | null = null
    try { local = localStorage.getItem('lp_theme') } catch { /* ignore */ }
    const theme = profile?.theme ?? local ?? 'ivory'
    document.documentElement.dataset.theme = theme
  }, [profile?.theme])
  return null
}

export default function App() {
  return (
    <>
      <ScrollAndTheme />
      <OfflineBanner />
      <ConnectionCeremony />
      <Suspense fallback={<FullScreenLoader label="One moment…" />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/privacy" element={<Legal kind="privacy" />} />
          <Route path="/terms" element={<Legal kind="terms" />} />
          <Route path="/contact" element={<Legal kind="contact" />} />
          <Route path="/demo" element={<DemoEntry />} />
          <Route path="/s/:token" element={<SharedView />} />

          <Route element={<GuestOnly />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<Forgot />} />
          </Route>

          <Route element={<RequireSession />}>
            <Route path="/setup-profile" element={<SetupProfile />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route element={<RequireReady />}>
              <Route path="/connect" element={<Connect />} />
              <Route element={<AppShell />}>
                <Route path="/settings" element={<Settings />} />
                <Route element={<RequireReady needCouple />}>
                  <Route path="/home" element={<Dashboard />} />
                  <Route path="/memories" element={<Memories />} />
                  <Route path="/photo-booth" element={<PhotoBooth />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/letters" element={<Letters />} />
                  <Route path="/dates" element={<Dates />} />
                  <Route path="/games" element={<Games />} />
                  <Route path="/our-story" element={<OurStory />} />
                  <Route path="/surprises" element={<Surprises />} />
                  <Route path="/bouquets" element={<Bouquets />} />
                  <Route path="/playlist" element={<Playlist />} />
                  <Route path="/assistant" element={<Assistant />} />
                </Route>
              </Route>
            </Route>
          </Route>

          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  )
}
