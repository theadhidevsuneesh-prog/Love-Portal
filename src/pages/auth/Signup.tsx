import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, User } from 'lucide-react'
import { AuthLayout, ConfigNotice } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { signupSchema, zodErrors, type FieldErrors } from '@/lib/validation'
import { friendlyError } from '@/lib/errors'

export default function Signup() {
  const { signUp, configured } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [v, setV] = useState({ name: '', email: '', password: '', confirm: '' })
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError('')
    const parsed = signupSchema.safeParse(v)
    if (!parsed.success) return setErrors(zodErrors(parsed.error))
    setErrors({})
    setBusy(true)
    try {
      await signUp({ name: parsed.data.name, email: parsed.data.email, password: parsed.data.password, photo: photo?.blob })
      navigate('/setup-profile', { replace: true })
    } catch (err) {
      setFormError(friendlyError(err))
    } finally { setBusy(false) }
  }

  return (
    <AuthLayout title="Create your Love Portal" subtitle="Two minutes to set up. A lifetime of little moments."
      footer={<>Already have an account? <Link to="/login" className="font-medium text-wine hover:underline">Login</Link></>}>
      {!configured && <ConfigNotice />}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <PhotoPicker name={v.name} value={photo?.url} onChange={(blob, url) => setPhoto({ blob, url })} onError={toast.error} />
        <Input label="Name" autoComplete="name" icon={<User className="h-4 w-4" />} value={v.name} onChange={set('name')} error={errors.name} placeholder="Your name" />
        <Input label="Email" type="email" autoComplete="email" inputMode="email" icon={<Mail className="h-4 w-4" />} value={v.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
        <Input label="Password" type="password" autoComplete="new-password" icon={<Lock className="h-4 w-4" />} value={v.password} onChange={set('password')} error={errors.password} hint="At least 8 characters, with a letter and a number." />
        <Input label="Confirm password" type="password" autoComplete="new-password" icon={<Lock className="h-4 w-4" />} value={v.confirm} onChange={set('confirm')} error={errors.confirm} />
        {formError && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{formError}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>Create account</Button>
        <p className="text-center text-xs text-muted">By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
      </form>
    </AuthLayout>
  )
}
