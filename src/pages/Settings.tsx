import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, Heart, Lock, LogOut, Palette, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { PhotoPicker } from '@/components/ui/PhotoPicker'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Badge, Segmented } from '@/components/ui/Feedback'
import { RelationshipDatesModal } from '@/components/features/RelationshipDatesModal'
import { NOTIFICATION_LABELS } from '@/lib/constants'
import { changePasswordSchema, profileSchema, zodErrors, type FieldErrors } from '@/lib/validation'
import { deleteCoupleData, disconnectCouple } from '@/data/connection'
import { friendlyError } from '@/lib/errors'
import { cn, formatDay } from '@/lib/utils'
import type { NotificationType } from '@/types'

type Section = 'profile' | 'couple' | 'notifications' | 'privacy' | 'security' | 'appearance'
const SECTIONS: { id: Section; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User }, { id: 'couple', label: 'Couple', icon: Heart }, { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: ShieldCheck }, { id: 'security', label: 'Security', icon: Lock }, { id: 'appearance', label: 'Appearance', icon: Palette },
]

function Panel({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return <section className="card space-y-5 p-6 sm:p-8"><div><h2 className="text-3xl font-semibold">{title}</h2>{desc && <p className="mt-1 text-sm text-muted">{desc}</p>}</div>{children}</section>
}
function Switch({ checked, onChange, label, desc, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 rounded-2xl px-1 py-2 text-left disabled:opacity-50">
      <span><span className="block text-[15px]">{label}</span>{desc && <span className="block text-xs text-muted">{desc}</span>}</span>
      <span className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-wine' : 'bg-line')}><span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} /></span>
    </button>
  )
}

export default function Settings() {
  const { profile, user, saveProfile, signOut, changePassword, resendVerification, isDemo } = useAuth()
  const { couple, partner, status } = useCouple()
  const toast = useToast()
  const navigate = useNavigate()
  const [section, setSection] = useState<Section>('profile')
  const hasCouple = status === 'ready'

  return (
    <div className="space-y-6">
      <div><p className="eyebrow mb-2">Make it yours</p><h1 className="text-5xl font-semibold sm:text-6xl">Settings</h1></div>
      <Segmented value={section} onChange={setSection} options={SECTIONS.map((s) => ({ value: s.id, label: <><s.icon className="h-3.5 w-3.5" />{s.label}</> }))} />
      {isDemo && <p className="rounded-2xl bg-gold/15 px-4 py-3 text-sm">You're in the demo — changes here aren't saved anywhere.</p>}
      <div className="space-y-6">
        {section === 'profile' && <ProfilePanel />}
        {section === 'couple' && (hasCouple ? <CouplePanel /> : <Panel title="Couple"><p className="text-muted">You're not connected yet.</p><Button onClick={() => navigate('/connect')}>Find your person</Button></Panel>)}
        {section === 'notifications' && (
          <Panel title="Notifications" desc="Choose what shows up in your notification center.">
            <div className="divide-y divide-line/70">
              {(Object.keys(NOTIFICATION_LABELS) as NotificationType[]).map((t) => (
                <Switch key={t} label={NOTIFICATION_LABELS[t]} checked={profile?.notificationPrefs?.[t] !== false}
                  onChange={(v) => saveProfile({ notificationPrefs: { ...(profile?.notificationPrefs ?? {}), [t]: v } }).catch((e) => toast.error(friendlyError(e)))} />
              ))}
            </div>
            <p className="text-xs text-muted">Notifications appear inside Love Portal. Push and email notifications aren’t available yet.</p>
          </Panel>
        )}
        {section === 'privacy' && (
          <Panel title="Privacy" desc="Your world is private to the two of you.">
            <Switch label="Share my mood with my partner" desc="When off, your mood updates won't send a notification." checked={profile?.privacy?.showMood !== false}
              onChange={(v) => saveProfile({ privacy: { showMood: v, showReadReceipts: profile?.privacy?.showReadReceipts ?? true } }).catch((e) => toast.error(friendlyError(e)))} />
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
              <li>Only you and {partner?.name ?? 'your partner'} can read your messages, memories, letters and photos — enforced by database security rules.</li>
              <li>Photo Booth images stay on your device until you save or share them.</li>
              <li>Your partner’s code and profile are only visible to people who have it.</li>
            </ul>
          </Panel>
        )}
        {section === 'security' && <SecurityPanel email={user?.email ?? ''} verified={!!user?.emailVerified} onResend={async () => { try { await resendVerification(); toast.success('Verification email sent.') } catch (e) { toast.error(friendlyError(e)) } }} onChange={changePassword} onLogout={signOut} isDemo={isDemo} />}
        {section === 'appearance' && (
          <Panel title="Appearance" desc="Pick the mood of your portal.">
            <div className="grid grid-cols-2 gap-3">
              {([['ivory', 'Ivory', 'Warm cream & burgundy'], ['dusk', 'Dusk', 'Deep, candle-lit evening']] as const).map(([id, name, d]) => {
                const active = (profile?.theme ?? (typeof localStorage !== 'undefined' ? localStorage.getItem('lp_theme') : null) ?? 'ivory') === id
                return (
                  <button key={id} aria-pressed={active} onClick={() => { try { localStorage.setItem('lp_theme', id) } catch { /* ignore */ } document.documentElement.dataset.theme = id; saveProfile({ theme: id }).catch(() => undefined) }}
                    className={cn('rounded-3xl border-2 p-4 text-left transition-colors', active ? 'border-wine' : 'border-line hover:border-rose')}>
                    <span className="mb-3 flex h-20 items-end gap-1.5 rounded-2xl p-3" style={{ background: id === 'ivory' ? '#fbf6ef' : '#180e12' }}>
                      <span className="h-8 w-8 rounded-full" style={{ background: id === 'ivory' ? '#6b1d2e' : '#c14e68' }} /><span className="h-5 w-12 rounded-full" style={{ background: id === 'ivory' ? '#f7dde0' : '#44232d' }} />
                    </span>
                    <span className="block font-medium">{name}</span><span className="text-xs text-muted">{d}</span>
                  </button>
                )
              })}
            </div>
          </Panel>
        )}
        {hasCouple && couple && <DangerZone />}
        {!hasCouple && <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4" /> Log out</Button>}
      </div>
    </div>
  )
}

function ProfilePanel() {
  const { profile, saveProfile } = useAuth()
  const toast = useToast()
  const [v, setV] = useState({ name: '', nickname: '', birthday: '' })
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (profile) setV({ name: profile.name, nickname: profile.nickname ?? '', birthday: profile.birthday ?? '' }) }, [profile?.uid]) // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    const p = profileSchema.safeParse(v); if (!p.success) return setErrors(zodErrors(p.error))
    setErrors({}); setBusy(true)
    try { await saveProfile({ name: p.data.name, nickname: p.data.nickname || undefined, birthday: p.data.birthday || undefined }, photo?.blob); toast.show('Profile updated ❤️', 'love') }
    catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }
  return (
    <Panel title="Profile">
      <PhotoPicker name={v.name} value={photo?.url ?? profile?.photoURL} onChange={(blob, url) => setPhoto({ blob, url })} onError={toast.error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Display name" value={v.name} error={errors.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        <Input label="Nickname" optional value={v.nickname} error={errors.nickname} onChange={(e) => setV({ ...v, nickname: e.target.value })} />
        <Input label="Birthday" type="date" optional value={v.birthday} error={errors.birthday} onChange={(e) => setV({ ...v, birthday: e.target.value })} />
        <Input label="Email" value={profile?.email ?? ''} disabled readOnly />
      </div>
      <Button onClick={save} loading={busy}>Save changes</Button>
    </Panel>
  )
}

function CouplePanel() {
  const { couple, me, partner } = useCouple()
  const [dates, setDates] = useState(false)
  if (!couple) return null
  const rows: [string, string | undefined][] = [['Relationship started', couple.relationshipStart], ['First meeting', couple.firstMeeting], ['First date', couple.firstDate], ['Anniversary', couple.anniversary]]
  return (
    <Panel title="Couple" desc="Your shared world.">
      <div className="flex items-center gap-4 rounded-3xl bg-blush/40 p-4">
        <Avatar src={partner?.photoURL} name={partner?.name} size="lg" />
        <div><p className="eyebrow">Your person</p><p className="font-serif text-3xl font-semibold leading-tight">{partner?.name}</p>{partner?.birthday && <p className="text-sm text-muted">Birthday · {formatDay(partner.birthday, { day: 'numeric', month: 'long' })}</p>}</div>
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map(([k, val]) => <div key={k} className="rounded-2xl border border-line p-4"><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{val ? formatDay(val) : <span className="text-muted">Not set</span>}</dd></div>)}
      </dl>
      <div className="flex flex-wrap items-center gap-3"><Button onClick={() => setDates(true)}>Edit dates</Button><Badge tone="muted">Couple ID · {couple.id.slice(0, 10).toUpperCase()}</Badge></div>
      <p className="text-xs text-muted">{me?.name} &amp; {partner?.name} · connected {formatDay(new Date(couple.createdAt).toISOString().slice(0, 10))}</p>
      <RelationshipDatesModal open={dates} onClose={() => setDates(false)} />
    </Panel>
  )
}

function SecurityPanel({ email, verified, onResend, onChange, onLogout, isDemo }: { email: string; verified: boolean; onResend: () => void; onChange: (c: string, n: string) => Promise<void>; onLogout: () => Promise<void>; isDemo: boolean }) {
  const toast = useToast()
  const [v, setV] = useState({ current: '', password: '', confirm: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    const p = changePasswordSchema.safeParse(v); if (!p.success) return setErrors(zodErrors(p.error))
    setErrors({}); setBusy(true)
    try { await onChange(p.data.current, p.data.password); toast.success('Password updated.'); setV({ current: '', password: '', confirm: '' }) }
    catch (e) { const code = (e as { code?: string }).code; if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') setErrors({ current: 'That isn’t your current password.' }); else toast.error(friendlyError(e)) }
    finally { setBusy(false) }
  }
  return (
    <>
      <Panel title="Security">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4">
          <div><p className="text-sm text-muted">Email</p><p className="font-medium">{email}</p></div>
          {verified ? <Badge tone="wine">Verified</Badge> : <Button size="sm" variant="outline" onClick={onResend}>Verify email</Button>}
        </div>
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-line p-4">
          <div><p className="font-medium">Two-factor authentication</p><p className="text-sm text-muted">Coming soon — we’ll let you know when it’s ready.</p></div><Badge tone="muted">Not available</Badge>
        </div>
      </Panel>
      {!isDemo && (
        <Panel title="Change password">
          <div className="grid grid-cols-1 gap-4 sm:max-w-md">
            <Input label="Current password" type="password" autoComplete="current-password" value={v.current} error={errors.current} onChange={(e) => setV({ ...v, current: e.target.value })} />
            <Input label="New password" type="password" autoComplete="new-password" value={v.password} error={errors.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
            <Input label="Confirm new password" type="password" autoComplete="new-password" value={v.confirm} error={errors.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} />
            <div><Button onClick={submit} loading={busy}>Update password</Button></div>
          </div>
        </Panel>
      )}
      <Button variant="outline" onClick={onLogout}><LogOut className="h-4 w-4" /> Log out</Button>
    </>
  )
}

function DangerZone() {
  const { couple } = useCouple()
  const { profile, deleteAccount, isDemo, signOut } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [dlg, setDlg] = useState<'disconnect' | 'data' | 'account' | null>(null)
  const [typed, setTyped] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { setTyped(''); setPw('') }, [dlg])
  if (!couple) return null

  const run = async (fn: () => Promise<void>, ok: string) => {
    if (isDemo) { toast.show('Disabled in the demo.', 'error'); setDlg(null); return }
    setBusy(true)
    try { await fn(); toast.success(ok); setDlg(null) }
    catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }

  return (
    <section className="rounded-3xl border border-red-300/70 bg-red-50/50 p-6 dark:bg-red-950/10 sm:p-8">
      <h2 className="flex items-center gap-2 text-3xl font-semibold text-red-700 dark:text-red-400"><AlertTriangle className="h-6 w-6" /> Danger zone</h2>
      <p className="mt-1 text-sm text-muted">These actions can’t be undone. We’ll always ask you to confirm.</p>
      <div className="mt-5 divide-y divide-red-200/70">
        {[
          ['disconnect', 'Disconnect partner', 'Ends your connection. Shared content becomes inaccessible to both of you.', 'Disconnect'],
          ['data', 'Delete couple data', 'Permanently deletes all messages, memories, letters and more — for both of you.', 'Delete data'],
          ['account', 'Delete account', 'Permanently deletes your account and profile.', 'Delete account'],
        ].map(([id, t, d, b]) => (
          <div key={id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1"><p className="font-medium">{t}</p><p className="text-sm text-muted">{d}</p></div>
            <Button variant="danger" size="sm" onClick={() => setDlg(id as 'disconnect')}>{b}</Button>
          </div>
        ))}
      </div>

      <ConfirmDialog open={dlg === 'disconnect'} onClose={() => setDlg(null)} loading={busy} confirmLabel="Disconnect" title="Disconnect from your partner?"
        body="You’ll both lose access to the shared space and can connect with someone new. Your shared content becomes inaccessible to both of you — delete it first if you want it gone for good." onConfirm={() => run(async () => { await disconnectCouple(couple); navigate('/connect') }, 'You’re disconnected.')} />
      <ConfirmDialog open={dlg === 'data'} onClose={() => setDlg(null)} loading={busy} confirmLabel="Delete everything" confirmDisabled={typed !== 'DELETE'} title="Delete all couple data?"
        body="Every message, memory, letter, surprise, coupon, playlist song and timeline event will be permanently deleted for both of you." onConfirm={() => run(() => deleteCoupleData(couple.id), 'Couple data deleted.')}>
        <Input label="Type DELETE to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </ConfirmDialog>
      <ConfirmDialog open={dlg === 'account'} onClose={() => setDlg(null)} loading={busy} confirmLabel="Delete my account" confirmDisabled={typed !== 'DELETE' || !pw} title="Delete your account?"
        body={<>This permanently deletes <strong>{profile?.name}</strong>’s account. If you’re connected, your partner is disconnected. Enter your password to continue.</>}
        onConfirm={() => run(async () => { await disconnectCouple(couple).catch(() => undefined); await deleteAccount(pw); await signOut().catch(() => undefined); navigate('/') }, 'Your account is deleted.')}>
        <Input label="Password" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        <Input label="Type DELETE to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </ConfirmDialog>
    </section>
  )
}
