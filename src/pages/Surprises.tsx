import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, Film, Gift, Mail, Mic, Plus, Square, Ticket, Lock, X, ImagePlus } from 'lucide-react'
import { useCollection, useWriters } from '@/data/hooks'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Chip, EmptyState, Segmented, Badge } from '@/components/ui/Feedback'
import { HeartBurst } from '@/components/ui/Motion'
import { COUPON_PRESETS } from '@/lib/constants'
import { compressImage } from '@/lib/image'
import { fmtSeconds, useRecorder } from '@/lib/useRecorder'
import { friendlyError } from '@/lib/errors'
import { couponSchema, surpriseSchema, validateFile } from '@/lib/validation'
import { cn, relativeTime } from '@/lib/utils'
import type { Coupon, Surprise, SurpriseType } from '@/types'

const TYPES: { id: SurpriseType; label: string; icon: typeof Gift; hint: string }[] = [
  { id: 'letter', label: 'Love letter', icon: Mail, hint: 'A few heartfelt words' },
  { id: 'photo', label: 'Photo', icon: Camera, hint: 'A picture worth a thousand words' },
  { id: 'video', label: 'Video', icon: Film, hint: 'A little clip, just for them' },
  { id: 'voice', label: 'Voice message', icon: Mic, hint: 'Let them hear you' },
  { id: 'coupon', label: 'Coupon', icon: Ticket, hint: 'A redeemable treat' },
  { id: 'secret', label: 'Secret message', icon: Lock, hint: 'Hidden until they open it' },
]

export default function Surprises() {
  const [tab, setTab] = useState<'surprises' | 'coupons'>('surprises')
  return (
    <div className="space-y-6">
      <div><p className="eyebrow mb-2">Little things, big smiles</p><h1 className="text-5xl font-semibold sm:text-6xl">Surprises</h1></div>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'surprises', label: <><Gift className="h-4 w-4" />Surprise box</> }, { value: 'coupons', label: <><Ticket className="h-4 w-4" />Coupons</> }]} />
      {tab === 'surprises' ? <SurpriseBox /> : <Coupons />}
    </div>
  )
}

function SurpriseBox() {
  const { items } = useCollection<Surprise>('surprises')
  const { partner } = useCouple()
  const { update, uid } = useWriters()
  const [creating, setCreating] = useState(false)
  const [opening, setOpening] = useState<Surprise | null>(null)
  const forMe = useMemo(() => items.filter((s) => s.toUid === uid).sort((a, b) => Number(!!a.openedAt) - Number(!!b.openedAt) || b.createdAt - a.createdAt), [items, uid])
  const fromMe = useMemo(() => items.filter((s) => s.authorId === uid).sort((a, b) => b.createdAt - a.createdAt), [items, uid])
  const unopened = forMe.filter((s) => !s.openedAt)

  return (
    <div className="space-y-8">
      {unopened.length > 0 && (
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-wine to-wine-deep p-7 text-white sm:p-10">
          <p className="eyebrow text-rose">For you</p>
          <h2 className="text-3xl font-semibold sm:text-5xl">You have a surprise from your person 🎁</h2>
          <div className="mt-6 flex flex-wrap gap-4">
            {unopened.map((s) => (
              <motion.button key={s.id} whileHover={{ y: -6, rotate: -2 }} whileTap={{ scale: 0.95 }} onClick={() => setOpening(s)} className="group flex w-36 flex-col items-center rounded-3xl bg-white/10 p-4 backdrop-blur" aria-label={`Open surprise: ${s.title}`}>
                <motion.span animate={{ rotate: [-4, 4, -4], y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }} className="text-6xl">🎁</motion.span>
                <span className="mt-2 text-center text-sm font-medium">{s.title}</span>
                <span className="mt-1 text-[11px] text-blush/70">{relativeTime(s.createdAt)}</span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-semibold">Surprise {partner?.name}</h2>
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> Create surprise</Button>
      </div>

      {forMe.length === 0 && fromMe.length === 0 ? (
        <EmptyState emoji="🎁" title="Nothing hidden here yet." body={`Hide a secret message, a photo or a voice note for ${partner?.name} to find.`} action={<Button onClick={() => setCreating(true)}>Create the first surprise</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <List title="Opened gifts" rows={forMe.filter((s) => s.openedAt)} onOpen={setOpening} empty="Nothing opened yet." />
          <List title="Sent by you" rows={fromMe} onOpen={setOpening} empty="You haven’t sent any surprises yet." sent />
        </div>
      )}

      <Reveal s={opening} onClose={() => setOpening(null)} mine={opening?.authorId === uid} onOpened={(s) => { if (s.toUid === uid && !s.openedAt) update('surprises', s.id, { openedAt: Date.now() }).catch(() => undefined) }} fromName={opening?.authorId === uid ? 'you' : partner?.name} />
      <CreateSurprise open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}

function List({ title, rows, onOpen, empty, sent }: { title: string; rows: Surprise[]; onOpen: (s: Surprise) => void; empty: string; sent?: boolean }) {
  const t = (id: SurpriseType) => TYPES.find((x) => x.id === id)!
  return (
    <section>
      <h3 className="mb-3 text-2xl font-semibold">{title}</h3>
      {rows.length === 0 ? <p className="rounded-2xl bg-line/40 p-5 text-sm text-muted">{empty}</p> : (
        <ul className="space-y-2">
          {rows.map((s) => { const T = t(s.type); return (
            <li key={s.id}><button onClick={() => onOpen(s)} className="card flex w-full items-center gap-3 p-4 text-left transition-shadow hover:shadow-lift">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blush text-wine"><T.icon className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1"><span className="block truncate font-medium">{s.title}</span><span className="text-xs text-muted">{T.label} · {relativeTime(s.createdAt)}</span></span>
              {sent && <Badge tone={s.openedAt ? 'wine' : 'gold'}>{s.openedAt ? 'Opened' : 'Waiting'}</Badge>}
            </button></li>
          ) })}
        </ul>
      )}
    </section>
  )
}

function Reveal({ s, onClose, onOpened, fromName, mine }: { s: Surprise | null; onClose: () => void; onOpened: (s: Surprise) => void; fromName?: string; mine: boolean }) {
  const [stage, setStage] = useState<'box' | 'open'>('box')
  useEffect(() => { if (s) setStage(s.openedAt || mine ? 'open' : 'box') }, [s?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (s && stage === 'open') onOpened(s) }, [stage, s?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <AnimatePresence>
      {s && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-wine-deep/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          {stage === 'box' ? (
            <motion.div onClick={(e) => e.stopPropagation()} className="text-center" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <button onClick={() => setStage('open')} className="text-[9rem] leading-none active:scale-90" aria-label="Open your gift"><motion.span animate={{ rotate: [-3, 3, -3] }} transition={{ repeat: Infinity, duration: 1.6 }} className="inline-block">🎁</motion.span></button>
              <p className="mt-4 font-serif text-3xl text-white">A surprise from {fromName}</p>
              <p className="mt-1 text-sm uppercase tracking-[0.25em] text-rose">Tap to unwrap</p>
            </motion.div>
          ) : (
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ scale: 0.5, y: 80, opacity: 0, rotate: -6 }} animate={{ scale: 1, y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 140, damping: 14 }}
              className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-[2rem] bg-surface p-7 text-center shadow-lift sm:p-9">
              <HeartBurst show />
              <Button variant="ghost" size="icon" className="absolute right-3 top-3" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></Button>
              <p className="eyebrow mb-2">{TYPES.find((t) => t.id === s.type)?.label}</p>
              <h2 className="text-4xl font-semibold leading-tight">{s.title}</h2>
              {s.mediaURL && s.type === 'photo' && <img src={s.mediaURL} alt="" className="mt-5 w-full rounded-3xl" />}
              {s.mediaURL && s.type === 'video' && <video src={s.mediaURL} controls playsInline className="mt-5 w-full rounded-3xl" />}
              {s.mediaURL && s.type === 'voice' && <audio src={s.mediaURL} controls className="mt-5 w-full" />}
              {s.type === 'coupon' && <div className="mx-auto mt-5 flex w-56 flex-col items-center rounded-3xl border-2 border-dashed border-wine bg-blush/50 p-5"><span className="text-4xl">🎟️</span><span className="mt-1 font-serif text-2xl">{s.title}</span><span className="text-xs text-muted">Find it in your Coupons</span></div>}
              {s.message && <p className={cn('mt-5 whitespace-pre-wrap leading-relaxed', s.type === 'letter' || s.type === 'secret' ? 'font-serif text-2xl' : 'text-muted')}>{s.message}</p>}
              <p className="mt-6 font-script text-2xl text-wine">— {fromName}</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function CreateSurprise({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { partner, coupleId } = useCouple()
  const { add, upload, notifyPartner } = useWriters()
  const toast = useToast()
  const rec = useRecorder()
  const fileRef = useRef<HTMLInputElement>(null)
  const [type, setType] = useState<SurpriseType>('secret')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<Blob | null>(null)
  const [fileName, setFileName] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setType('secret'); setTitle(''); setMessage(''); setFile(null); setFileName(''); setErr('') } }, [open])

  const needsMedia = type === 'photo' || type === 'video' || type === 'voice'
  const pickFile = (f: File) => {
    const kind = type === 'photo' ? 'image' : type === 'video' ? 'video' : 'audio'
    const e = validateFile(f, kind); if (e) return toast.error(e)
    setFile(f); setFileName(f.name)
  }
  const toggleRec = async () => {
    if (rec.recording) { const b = await rec.stop(); if (b) { setFile(b); setFileName('Voice recording') } return }
    try { await rec.start() } catch { toast.error('We need microphone access. Allow it in your browser settings.') }
  }

  const submit = async () => {
    const p = surpriseSchema.safeParse({ title, message })
    if (!p.success) return setErr(p.error.issues[0].message)
    if (needsMedia && !file) return setErr(type === 'photo' ? 'Choose a photo to hide inside.' : type === 'video' ? 'Choose a video to hide inside.' : 'Record or choose a voice message.')
    if ((type === 'letter' || type === 'secret') && !p.data.message) return setErr('Write the message that will be revealed.')
    setErr(''); setBusy(true)
    try {
      let mediaURL: string | undefined
      if (file) {
        const body = type === 'photo' ? await compressImage(file as File, 1600) : file
        mediaURL = await upload(`couples/${coupleId}/surprises/${Date.now()}.${type === 'photo' ? 'jpg' : type === 'video' ? 'mp4' : 'webm'}`, body)
      }
      await add('surprises', { toUid: partner!.uid, type, title: p.data.title, message: p.data.message || undefined, mediaURL })
      if (type === 'coupon') await add('coupons', { toUid: partner!.uid, title: p.data.title, description: p.data.message || undefined, emoji: '🎟️' })
      notifyPartner('surprise', 'You have a surprise from your person 🎁', '/surprises')
      toast.show('Surprise hidden away 🎁', 'love'); onClose()
    } catch (e) { toast.error(friendlyError(e, "That didn't upload. Please try again.")) } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title="Create a surprise" description={`Hide something sweet for ${partner?.name} to unwrap.`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TYPES.map((t) => (
            <button key={t.id} onClick={() => { setType(t.id); setFile(null); setFileName('') }} aria-pressed={type === t.id}
              className={cn('flex flex-col items-start gap-1 rounded-3xl border-2 p-3 text-left transition-colors', type === t.id ? 'border-wine bg-blush' : 'border-line bg-surface hover:border-rose')}>
              <t.icon className="h-5 w-5 text-wine" /><span className="text-sm font-medium">{t.label}</span><span className="text-[11px] leading-tight text-muted">{t.hint}</span>
            </button>
          ))}
        </div>
        <Input label="Title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder={type === 'coupon' ? 'One free back rub' : 'A small something'} />
        {needsMedia && (
          <div className="rounded-3xl border border-dashed border-rose/70 bg-blush/30 p-4 text-center">
            {fileName ? <p className="mb-3 flex items-center justify-center gap-2 text-sm">✅ {fileName} <button onClick={() => { setFile(null); setFileName('') }} aria-label="Remove file"><X className="h-4 w-4" /></button></p> : null}
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" /> Choose {type === 'photo' ? 'photo' : type === 'video' ? 'video' : 'audio file'}</Button>
              {type === 'voice' && <Button variant={rec.recording ? 'danger' : 'outline'} size="sm" onClick={toggleRec}>{rec.recording ? <><Square className="h-4 w-4 fill-current" />Stop {fmtSeconds(rec.seconds)}</> : <><Mic className="h-4 w-4" />Record now</>}</Button>}
            </div>
            <input ref={fileRef} type="file" hidden accept={type === 'photo' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*'} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) pickFile(f) }} />
          </div>
        )}
        <Textarea label={type === 'coupon' ? 'What do they get?' : 'Message'} optional={needsMedia} value={message} maxLength={2000} onChange={(e) => setMessage(e.target.value)} placeholder="Write something they’ll smile at…" />
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <Button size="lg" className="w-full" onClick={submit} loading={busy}>Wrap it up 🎁</Button>
      </div>
    </Modal>
  )
}

function Coupons() {
  const { items } = useCollection<Coupon>('coupons')
  const { partner } = useCouple()
  const { add, update, notifyPartner, uid } = useWriters()
  const toast = useToast()
  const [view, setView] = useState<'mine' | 'given'>('mine')
  const [status, setStatus] = useState<'available' | 'redeemed'>('available')
  const [creating, setCreating] = useState(false)
  const [redeeming, setRedeeming] = useState<Coupon | null>(null)

  const rows = items.filter((c) => (view === 'mine' ? c.toUid === uid : c.authorId === uid) && (status === 'available' ? !c.redeemedAt : !!c.redeemedAt)).sort((a, b) => b.createdAt - a.createdAt)
  const count = (s: boolean) => items.filter((c) => (view === 'mine' ? c.toUid === uid : c.authorId === uid) && !!c.redeemedAt === s).length

  const redeem = async () => {
    if (!redeeming) return
    try { await update('coupons', redeeming.id, { redeemedAt: Date.now() }); notifyPartner('surprise', `Coupon redeemed: ${redeeming.title} ${redeeming.emoji}`, '/surprises'); toast.show('Redeemed! Go collect 😘', 'love'); setRedeeming(null) }
    catch (e) { toast.error(friendlyError(e)) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={view} onChange={setView} options={[{ value: 'mine', label: 'My coupons' }, { value: 'given', label: `Given to ${partner?.name}` }]} />
        <Button onClick={() => setCreating(true)}><Plus className="h-4 w-4" /> New coupon</Button>
      </div>
      <div className="flex gap-2">
        <Chip active={status === 'available'} onClick={() => setStatus('available')}>Available ({count(false)})</Chip>
        <Chip active={status === 'redeemed'} onClick={() => setStatus('redeemed')}>Redeemed ({count(true)})</Chip>
      </div>
      {rows.length === 0 ? (
        <EmptyState emoji="🎟️" title={status === 'available' ? 'No coupons to spend.' : 'Nothing redeemed yet.'} body={view === 'mine' ? `Hint ${partner?.name} to make you one.` : `Make ${partner?.name} a coupon they’ll actually use.`} action={view === 'given' || status === 'available' ? <Button onClick={() => setCreating(true)}>Create a coupon</Button> : undefined} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((c, i) => (
            <motion.div key={c.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={cn('relative flex overflow-hidden rounded-3xl border shadow-soft', c.redeemedAt ? 'border-line bg-surface opacity-60' : 'border-rose bg-gradient-to-br from-blush to-surface')}>
              <div className="flex w-20 shrink-0 items-center justify-center bg-wine/90 text-4xl text-white" style={{ background: c.redeemedAt ? 'rgb(var(--c-muted))' : undefined }}>{c.emoji}</div>
              <div className="absolute left-[4.85rem] top-[-10px] h-5 w-5 rounded-full bg-paper" /><div className="absolute bottom-[-10px] left-[4.85rem] h-5 w-5 rounded-full bg-paper" />
              <div className="min-w-0 flex-1 border-l-2 border-dashed border-rose/60 p-4">
                <p className="font-serif text-2xl font-semibold leading-tight">{c.title}</p>
                {c.description && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{c.description}</p>}
                <p className="mt-2 text-[11px] text-muted">{c.authorId === uid ? `From you` : `From ${partner?.name}`}{c.redeemedAt ? ` · redeemed ${relativeTime(c.redeemedAt)}` : ''}</p>
                {!c.redeemedAt && c.toUid === uid && <Button size="sm" className="mt-3" onClick={() => setRedeeming(c)}>Redeem</Button>}
                {!c.redeemedAt && c.authorId === uid && <Badge tone="gold" className="mt-3">Available</Badge>}
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <ConfirmDialog open={!!redeeming} onClose={() => setRedeeming(null)} onConfirm={redeem} danger={false} title="Redeem this coupon?" body={<>Use “{redeeming?.title}” now? {partner?.name} will be notified.</>} confirmLabel="Redeem 🎟️" />
      <NewCoupon open={creating} onClose={() => setCreating(false)} onSave={async (d) => { try { await add('coupons', { ...d, toUid: partner!.uid }); notifyPartner('surprise', 'You have a new coupon 🎟️', '/surprises', String(d.title)); toast.show('Coupon created 🎟️', 'love'); setCreating(false) } catch (e) { toast.error(friendlyError(e)) } }} />
    </div>
  )
}

function NewCoupon({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const { partner } = useCouple()
  const [emoji, setEmoji] = useState('🎟️')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [err, setErr] = useState('')
  useEffect(() => { if (open) { setEmoji('🎟️'); setTitle(''); setDesc(''); setErr('') } }, [open])
  return (
    <Modal open={open} onClose={onClose} title="Make a coupon" description={`A promise ${partner?.name} can redeem.`}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">{COUPON_PRESETS.map((p) => <Chip key={p.title} active={title === p.title} onClick={() => { setTitle(p.title); setEmoji(p.emoji) }}>{p.emoji} {p.title}</Chip>)}</div>
        <div className="grid grid-cols-[4.5rem_1fr] gap-3"><Input label="Emoji" value={emoji} maxLength={4} onChange={(e) => setEmoji(e.target.value)} className="text-center text-2xl" /><Input label="Coupon title" value={title} error={err} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="Or write your own…" /></div>
        <Textarea label="Fine print" optional value={desc} maxLength={200} onChange={(e) => setDesc(e.target.value)} placeholder="Valid forever. No refunds on cuddles." className="min-h-[80px]" />
        <Button size="lg" className="w-full" onClick={() => { const p = couponSchema.safeParse({ title, description: desc }); if (!p.success) return setErr(p.error.issues[0].message); onSave({ title: p.data.title, description: p.data.description || undefined, emoji: emoji.trim() || '🎟️' }) }}>Create coupon</Button>
      </div>
    </Modal>
  )
}
