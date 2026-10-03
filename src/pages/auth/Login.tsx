import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { AuthLayout, ConfigNotice } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAuth } from '@/context/AuthContext'
import { loginSchema, zodErrors, type FieldErrors } from '@/lib/validation'
import { friendlyError } from '@/lib/errors'

export default function Login() {
  const { signIn, configured } = useAuth()
  const navigate = useNavigate()
  const loc = useLocation()
  const [v, setV] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    const parsed = loginSchema.safeParse(v)
    if (!parsed.success) return setErrors(zodErrors(parsed.error))
    setErrors({})
    setBusy(true)
    try {
      await signIn(parsed.data.email, parsed.data.password, remember)
      navigate((loc.state as { from?: string } | null)?.from || '/home', { replace: true })
    } catch (err) {
      setFormError(friendlyError(err))
    } finally { setBusy(false) }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Your person has been waiting."
      footer={<>New here? <Link to="/signup" className="font-medium text-wine hover:underline">Create your Love Portal</Link></>}>
      {!configured && <ConfigNotice />}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" inputMode="email" icon={<Mail className="h-4 w-4" />} value={v.email}
          onChange={(e) => setV({ ...v, email: e.target.value })} error={errors.email} placeholder="you@example.com" />
        <Input label="Password" type="password" autoComplete="current-password" icon={<Lock className="h-4 w-4" />} value={v.password}
          onChange={(e) => setV({ ...v, password: e.target.value })} error={errors.password} placeholder="••••••••" />
        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-[rgb(var(--c-wine))]" /> Remember me
          </label>
          <Link to="/forgot-password" className="text-wine hover:underline">Forgot password?</Link>
        </div>
        {formError && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{formError}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>Login</Button>
      </form>
    </AuthLayout>
  )
}
