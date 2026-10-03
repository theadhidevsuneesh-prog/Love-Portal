import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Cake, Heart } from 'lucide-react'
import { AuthLayout } from './AuthLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { profileSchema, zodErrors, type FieldErrors } from '@/lib/validation'
import { friendlyError } from '@/lib/errors'
import { FullScreenLoader } from '@/components/ui/Feedback'

export default function SetupProfile() {
  const { profile, profileLoading, saveProfile, user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [v, setV] = useState({ name: profile?.name ?? '', nickname: profile?.nickname ?? '', birthday: profile?.birthday ?? '' })
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  if (profileLoading) return <FullScreenLoader />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = profileSchema.safeParse(v)
    if (!parsed.success) return setErrors(zodErrors(parsed.error))
    setErrors({}); setBusy(true)
    try {
      await saveProfile({ name: parsed.data.name, nickname: parsed.data.nickname || undefined, birthday: parsed.data.birthday || undefined, profileComplete: true }, photo?.blob)
      setDone(true)
      setTimeout(() => navigate(user?.emailVerified ? '/connect' : '/verify-email', { replace: true }), 2200)
    } catch (err) { toast.error(friendlyError(err)) } finally { setBusy(false) }
  }

  return (
    <AuthLayout title={done ? "Now let's find your person ❤️" : 'What should we call you?'} subtitle={done ? 'One more step…' : 'Just a few details to make this place feel like yours.'}>
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="d" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}><Heart className="h-16 w-16 fill-wine text-wine" /></motion.div>
          </motion.div>
        ) : (
          <motion.form key="f" onSubmit={submit} className="space-y-4" noValidate exit={{ opacity: 0 }}>
            <PhotoPicker name={v.name} value={photo?.url ?? profile?.photoURL} onChange={(blob, url) => setPhoto({ blob, url })} onError={toast.error} />
            <Input label="Display name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={errors.name} autoComplete="given-name" />
            <Input label="Birthday" type="date" icon={<Cake className="h-4 w-4" />} value={v.birthday} onChange={(e) => setV({ ...v, birthday: e.target.value })} error={errors.birthday} max={new Date().toISOString().slice(0, 10)} optional />
            <Input label="Nickname" value={v.nickname} onChange={(e) => setV({ ...v, nickname: e.target.value })} error={errors.nickname} placeholder="What your person calls you" optional />
            <Button type="submit" size="lg" className="w-full" loading={busy}>Continue</Button>
          </motion.form>
        )}
      </AnimatePresence>
    </AuthLayout>
  )
}
