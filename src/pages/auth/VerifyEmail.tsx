import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { MailCheck } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { friendlyError } from '@/lib/errors'

export default function VerifyEmail() {
  const { user, profile, refreshUser, resendVerification, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Gently poll so the page moves on as soon as they click the link.
  useEffect(() => {
    const id = setInterval(() => { refreshUser().then((ok) => ok && navigate('/connect', { replace: true })).catch(() => undefined) }, 5000)
    return () => clearInterval(id)
  }, [refreshUser, navigate])

  if (user?.emailVerified) return <Navigate to="/connect" replace />

  const check = async () => {
    setChecking(true)
    try {
      if (await refreshUser()) navigate('/connect', { replace: true })
      else toast.show("Not verified yet — click the link in your email first.", 'error')
    } catch (e) { toast.error(friendlyError(e)) } finally { setChecking(false) }
  }
  const resend = async () => {
    setSending(true)
    try { await resendVerification(); toast.success('Verification email sent.'); setCooldown(45) }
    catch (e) { toast.error(friendlyError(e)) } finally { setSending(false) }
  }

  return (
    <AuthLayout title="Verify your email" subtitle={`We sent a link to ${user?.email ?? 'your inbox'}${profile?.name ? `, ${profile.name}` : ''}.`}
      footer={<button onClick={signOut} className="font-medium text-wine hover:underline">Use a different account</button>}>
      <div className="rounded-3xl bg-blush/50 p-6 text-center">
        <MailCheck className="mx-auto h-12 w-12 text-wine" />
        <p className="mt-3 text-sm text-muted">Click the link in that email to keep your little world private and secure. Don't see it? Check spam.</p>
      </div>
      <div className="mt-6 space-y-3">
        <Button size="lg" className="w-full" onClick={check} loading={checking}>I've verified my email</Button>
        <Button size="lg" variant="outline" className="w-full" onClick={resend} loading={sending} disabled={cooldown > 0}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
        </Button>
      </div>
    </AuthLayout>
  )
}
