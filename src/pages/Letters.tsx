import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, ImagePlus, Lock, Music, PenLine, X } from 'lucide-react'
import { useCollection, useWriters } from '@/data/hooks'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { RichEditor } from '@/components/ui/RichEditor'
import { EmptyState, Segmented } from '@/components/ui/Feedback'
import { HeartBurst } from '@/components/ui/Motion'
import { LETTER_TEMPLATES } from '@/lib/constants'
import { compressImage } from '@/lib/image'
import { sanitizeHtml, htmlToText } from '@/lib/sanitize'
import { friendlyError } from '@/lib/errors'
import { letterSchema, validateFile } from '@/lib/validation'
import { cn, relativeTime } from '@/lib/utils'
import type { Letter } from '@/types'

const localInput = (ms: number) => { const d = new Date(ms - new Date().getTimezoneOffset() * 60_000); return d.toISOString().slice(0, 16) }
const untilText = (ms: number) => {
  const d = Math.ceil((ms - Date.now()) / 86_400_000)
  return d <= 0 ? 'soon' : d === 1 ? 'tomorrow' : `in ${d} days`
}

function Envelope({ letter, mine, locked, onOpen, unread }: { letter: Letter; mine: boolean; locked: boolean; onOpen: () => void; unread: boolean }) {
  return (
    <motion.button layout whileHover={{ y: -5, rotate: locked ? 0 : -0.6 }} whileTap={{ scale: 0.98 }} onClick={onOpen}
      className="group relative block w-full text-left" aria-label={`${letter.title}${locked ? ', locked' : ''}`}>
      <div className={cn('relative overflow-hidden rounded-3xl border p-5 pb-6 shadow-soft transition-shadow group-hover:shadow-lift', locked ? 'border-line bg-surface' : 'border-rose/60 bg-gradient-to-br from-blush to-surface')}>
        {/* envelope flap */}
        <svg className="absolute inset-x-0 top-0 h-20 w-full" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden>
          <path d="M0 0 L50 24 L100 0 Z" className={locked ? 'fill-line/60' : 'fill-rose/40'} />
        </svg>
        <div className="relative pt-12">
          <span className={cn('mx-auto -mt-2 mb-3 flex h-10 w-10 items-center justify-center rounded-full shadow-soft', locked ? 'bg-line text-muted' : 'bg-wine text-white')}>
            {locked ? <Lock className="h-4 w-4" /> : <span aria-hidden>♥</span>}
          </span>
          <p className="text-center font-serif text-2xl font-semibold leading-tight">{letter.title}</p>
          <p className="mt-1.5 text-center text-xs text-muted">
            {locked ? `Locked until ${new Date(letter.unlockAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · ${untilText(letter.unlockAt)}` : `${mine ? 'Sent' : 'Received'} ${relativeTime(letter.createdAt)}`}
          </p>
          {unread && !locked && !mine && <span className="mt-3 block text-center text-[11px] font-semibold uppercase tracking-widest text-wine">New · tap to open</span>}
        </div>
      </div>
    </motion.button>
  )
}

export default function Letters() {
  const { items } = useCollection<Letter>('letters')
  const { me, partner } = useCouple()
  const { update, uid } = useWriters()
  const [tab, setTab] = useState<'for' | 'from'>('for')
  const [composing, setComposing] = useState(false)
  const [reading, setReading] = useState<Letter | null>(null)
  const toast = useToast()

  const forMe = useMemo(() => items.filter((l) => l.toUid === uid).sort((a, b) => b.createdAt - a.createdAt), [items, uid])
  const fromMe = useMemo(() => items.filter((l) => l.authorId === uid).sort((a, b) => b.createdAt - a.createdAt), [items, uid])
  const list = tab === 'for' ? forMe : fromMe

  const open = (l: Letter) => {
    const mine = l.authorId === uid
    if (!mine && l.unlockAt > Date.now()) {
      toast.show(`This one is sealed until ${new Date(l.unlockAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}. Patience, love 💌`, 'love')
      return
    }
    setReading(l)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow mb-2">Sealed with love</p><h1 className="text-5xl font-semibold sm:text-6xl">Love Letters</h1></div>
        <Button size="lg" onClick={() => setComposing(true)}><PenLine className="h-4 w-4" /> Write a letter</Button>
      </div>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'for', label: `For you (${forMe.length})` }, { value: 'from', label: `From you (${fromMe.length})` }]} />

      {list.length === 0 ? (
        tab === 'for'
          ? <EmptyState emoji="💌" title="Someone should probably write you a love letter." body={`Maybe nudge ${partner?.name} — or write one first.`} action={<Button onClick={() => setComposing(true)}>Write the first letter</Button>} />
          : <EmptyState emoji="🖋️" title="Your pen is waiting." body={`Write something ${partner?.name} can keep forever.`} action={<Button onClick={() => setComposing(true)}>Start writing</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((l) => <Envelope key={l.id} letter={l} mine={l.authorId === uid} locked={l.authorId !== uid && l.unlockAt > Date.now()} unread={!l.openedAt} onOpen={() => open(l)} />)}
        </div>
      )}

      <Reader letter={reading} onClose={() => setReading(null)} fromName={reading?.authorId === uid ? me?.name : partner?.name} mine={reading?.authorId === uid}
        onOpened={(l) => { if (l.authorId !== uid && !l.openedAt) update('letters', l.id, { openedAt: Date.now() }).catch(() => undefined) }} />
      <Composer open={composing} onClose={() => setComposing(false)} />
    </div>
  )
}

function Reader({ letter, onClose, fromName, mine, onOpened }: { letter: Letter | null; onClose: () => void; fromName?: string; mine?: boolean; onOpened: (l: Letter) => void }) {
  const [stage, setStage] = useState<'sealed' | 'open'>('sealed')
  useEffect(() => { if (letter) { setStage(mine || letter.openedAt ? 'open' : 'sealed') } }, [letter?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!letter || stage !== 'open') return
    onOpened(letter)
  }, [stage, letter?.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const html = useMemo(() => sanitizeHtml(letter?.html ?? ''), [letter?.html])

  return (
    <AnimatePresence>
      {letter && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-wine-deep/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          {stage === 'sealed' ? (
            <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm text-center">
              <button onClick={() => setStage('open')} className="group relative mx-auto block h-52 w-72 max-w-full" aria-label="Open the envelope">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blush to-rose shadow-lift" />
                <motion.div className="absolute inset-x-0 top-0 h-28 origin-top rounded-t-3xl" style={{ background: 'linear-gradient(160deg, rgb(var(--c-rose)), rgb(var(--c-blush)))', clipPath: 'polygon(0 0,100% 0,50% 100%)' }} whileHover={{ rotateX: 25 }} />
                <span className="absolute left-1/2 top-[3.6rem] flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-wine text-2xl text-blush shadow-lift transition-transform group-hover:scale-110">♥</span>
              </button>
              <p className="mt-6 font-serif text-3xl text-white">{letter.title}</p>
              <p className="mt-1 text-sm text-blush/80">From {fromName}</p>
              <p className="mt-5 text-xs uppercase tracking-[0.25em] text-rose">Tap the seal to open</p>
            </motion.div>
          ) : (
            <motion.div onClick={(e) => e.stopPropagation()} className="relative flex max-h-[92dvh] w-full max-w-xl flex-col" initial={{ y: 120, opacity: 0, rotate: -2 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 18 }}>
              <HeartBurst show />
              <div className="overflow-y-auto rounded-3xl bg-[#fffaf2] p-7 text-[#3a2229] shadow-lift sm:p-10 dark:bg-[#2b191f] dark:text-[#f6ece9]" style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 31px, rgb(0 0 0 / 0.04) 31px 32px)' }}>
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div><p className="eyebrow">{letter.template ? 'Open when…' : 'A letter for you'}</p><h2 className="mt-1 text-4xl font-semibold leading-tight">{letter.title}</h2></div>
                  <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></Button>
                </div>
                {letter.photoURL && <img src={letter.photoURL} alt="" className="mb-5 max-h-72 w-full rounded-2xl object-cover" />}
                <div className="rich-content font-serif text-xl leading-[2rem]" dangerouslySetInnerHTML={{ __html: html }} />
                <p className="mt-6 text-right font-script text-3xl text-wine">— {fromName}</p>
                {letter.musicURL && <a href={letter.musicURL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-wine px-4 py-2 text-sm text-white"><Music className="h-4 w-4" /> Play our song</a>}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Composer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { partner, coupleId } = useCouple()
  const { add, upload, notifyPartner } = useWriters()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [tpl, setTpl] = useState('blank')
  const [title, setTitle] = useState('')
  const [html, setHtml] = useState('')
  const [music, setMusic] = useState('')
  const [lock, setLock] = useState(false)
  const [unlock, setUnlock] = useState(localInput(Date.now() + 86_400_000))
  const [photo, setPhoto] = useState<File | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { if (open) { setTpl('blank'); setTitle(''); setHtml(''); setMusic(''); setLock(false); setPhoto(null); setErr('') } }, [open])
  const pickTemplate = (id: string) => {
    setTpl(id); const t = LETTER_TEMPLATES.find((x) => x.id === id)!
    setHtml(t.body); setTitle(id === 'blank' ? '' : t.title)
    if (id === 'anniversary') setLock(true)
  }
  const photoUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])

  const send = async () => {
    const p = letterSchema.safeParse({ title })
    if (!p.success) return setErr(p.error.issues[0].message)
    if (!htmlToText(html)) return setErr('Your letter is empty — write something from the heart.')
    if (music && !/^https?:\/\//i.test(music)) return setErr('Music links should start with https://')
    const unlockAt = lock ? new Date(unlock).getTime() : Date.now()
    if (lock && (!unlockAt || unlockAt < Date.now())) return setErr('Pick a delivery date in the future.')
    setErr(''); setBusy(true)
    try {
      let photoURL: string | undefined
      if (photo) photoURL = await upload(`couples/${coupleId}/letters/${Date.now()}.jpg`, await compressImage(photo, 1600))
      await add('letters', { toUid: partner!.uid, title: p.data.title, template: tpl === 'blank' ? undefined : tpl, html: sanitizeHtml(html), photoURL, musicURL: music || undefined, unlockAt })
      notifyPartner('letter', 'You have a new love letter 💌', '/letters', lock ? `It opens on ${new Date(unlockAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}` : undefined)
      toast.show(lock ? 'Letter sealed until the big day 💌' : 'Letter sent 💌', 'love'); onClose()
    } catch (e) { toast.error(friendlyError(e, "Your letter didn't send. Please try again.")) } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title="Write a love letter" description={`For ${partner?.name}. Only they can read it.`} size="lg">
      <div className="space-y-4">
        <Select label="Start from a template" value={tpl} onChange={(e) => pickTemplate(e.target.value)}>
          {LETTER_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
        </Select>
        <Input label="Title" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="Open when you miss me" />
        <RichEditor value={html} onChange={setHtml} placeholder="My love…" />
        {photoUrl && <div className="relative inline-block"><img src={photoUrl} alt="" className="h-28 rounded-2xl object-cover" /><button onClick={() => setPhoto(null)} aria-label="Remove photo" className="absolute -right-2 -top-2 rounded-full bg-wine p-1 text-white"><X className="h-3.5 w-3.5" /></button></div>}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" /> Add photo</Button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; const m = validateFile(f, 'image'); if (m) toast.error(m); else setPhoto(f) }} />
        </div>
        <Input label="Add music" optional icon={<Music className="h-4 w-4" />} value={music} onChange={(e) => setMusic(e.target.value)} placeholder="Paste a Spotify or YouTube link" />
        <div className="rounded-2xl bg-blush/40 p-4">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium"><CalendarClock className="h-4 w-4 text-wine" /> Lock until a specific date</span>
            <input type="checkbox" checked={lock} onChange={(e) => setLock(e.target.checked)} className="h-5 w-5 accent-[rgb(var(--c-wine))]" />
          </label>
          {lock && <div className="mt-3"><Input type="datetime-local" aria-label="Delivery date" value={unlock} min={localInput(Date.now())} onChange={(e) => setUnlock(e.target.value)} hint={`${partner?.name} will see the sealed envelope, but can't read it until then.`} /></div>}
        </div>
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
        <Button size="lg" className="w-full" onClick={send} loading={busy}>{lock ? 'Seal & schedule' : 'Send letter'} 💌</Button>
      </div>
    </Modal>
  )
}
