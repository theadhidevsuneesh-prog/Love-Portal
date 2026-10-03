import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { MailCheck, Mail } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { forgotSchema } from '@/lib/validation'
import { friendlyError } from '@/lib/errors'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = forgotSchema.safeParse({ email })
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setError(''); setBusy(true)
    try { await resetPassword(parsed.data.email); setSent(true) }
    catch (err) {
      // Don't reveal whether an address has an account.
      if ((err as { code?: string }).code === 'auth/user-not-found') setSent(true)
      else setError(friendlyError(err))
    } finally { setBusy(false) }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="It happens to the best of us. We'll send you a link."
      footer={<Link to="/login" className="font-medium text-wine hover:underline">← Back to login</Link>}>
      {sent ? (
        <div className="rounded-3xl bg-blush/50 p-6 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-wine" />
          <p className="mt-3 font-serif text-2xl">Check your inbox</p>
          <p className="mt-1 text-sm text-muted">If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input label="Email" type="email" icon={<Mail className="h-4 w-4" />} value={email} onChange={(e) => setEmail(e.target.value)} error={error} autoComplete="email" />
          <Button type="submit" size="lg" className="w-full" loading={busy}>Send reset link</Button>
        </form>
      )}
    </AuthLayout>
  )
}
