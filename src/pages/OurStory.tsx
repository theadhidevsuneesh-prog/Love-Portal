import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ImagePlus, MapPin, Plus, Trash2, X } from 'lucide-react'
import { useCollection, useWriters } from '@/data/hooks'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { EmptyState, Segmented } from '@/components/ui/Feedback'
import { MilestoneStrip } from '@/components/features/Milestones'
import { RelationshipDatesModal } from '@/components/features/RelationshipDatesModal'
import { EVENT_KINDS } from '@/lib/constants'
import { compressImage } from '@/lib/image'
import { friendlyError } from '@/lib/errors'
import { eventSchema, validateFile } from '@/lib/validation'
import { cn, formatDay, today } from '@/lib/utils'
import type { TimelineEvent } from '@/types'

interface Row { id: string; title: string; date: string; description?: string; location?: string; photoURL?: string; kind: string; derived?: boolean; authorId?: string }

export default function OurStory() {
  const { items } = useCollection<TimelineEvent>('timelineEvents')
  const { couple, updateCoupleFields } = useCouple()
  const { remove, uid } = useWriters()
  const toast = useToast()
  const [tab, setTab] = useState<'timeline' | 'milestones'>('timeline')
  const [adding, setAdding] = useState(false)
  const [datesOpen, setDatesOpen] = useState(false)
  const [deleting, setDeleting] = useState<Row | null>(null)
  const [msOpen, setMsOpen] = useState(false)

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = items.map((e) => ({ ...e }))
    const derive = (kind: string, title: string, date?: string) => { if (date && !items.some((e) => e.kind === kind)) out.push({ id: `d_${kind}`, kind, title, date, derived: true }) }
    derive('First meeting', 'We met', couple?.firstMeeting)
    derive('First date', 'Our first date', couple?.firstDate)
    derive('Official relationship', 'Officially us', couple?.relationshipStart)
    return out.sort((a, b) => a.date.localeCompare(b.date))
  }, [items, couple])

  const del = async () => {
    if (!deleting) return
    try { await remove('timelineEvents', deleting.id); setDeleting(null); toast.success('Removed from your story.') } catch (e) { toast.error(friendlyError(e)) }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow mb-2">Chapter by chapter</p><h1 className="text-5xl font-semibold sm:text-6xl">Our Story</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDatesOpen(true)}>Edit dates</Button>
          <Button size="lg" onClick={() => (tab === 'timeline' ? setAdding(true) : setMsOpen(true))}><Plus className="h-4 w-4" /> {tab === 'timeline' ? 'Add moment' : 'Custom milestone'}</Button>
        </div>
      </div>
      <Segmented value={tab} onChange={setTab} options={[{ value: 'timeline', label: 'Timeline' }, { value: 'milestones', label: 'Milestones' }]} />

      {tab === 'milestones' ? (
        couple?.relationshipStart ? <MilestoneStrip grid /> : <EmptyState emoji="✨" title="Milestones start with a date." body="Tell us when your story began and we'll start collecting them for you." action={<Button onClick={() => setDatesOpen(true)}>Add relationship date</Button>} />
      ) : rows.length === 0 ? (
        <EmptyState emoji="📖" title="Your story is waiting for its first chapter. ❤️" body="Start with the first message, the first meeting, the first date…" action={<Button size="lg" onClick={() => setAdding(true)}>Add the first moment</Button>} />
      ) : (
        <ol className="relative mx-auto max-w-4xl">
          <span className="absolute bottom-0 left-4 top-2 w-px bg-gradient-to-b from-rose via-rose/60 to-transparent md:left-1/2" aria-hidden />
          {rows.map((e, i) => {
            const left = i % 2 === 0
            return (
              <li key={e.id} className="relative mb-10 pl-12 md:pl-0">
                <span className="absolute left-4 top-6 z-10 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full border-4 border-paper bg-wine md:left-1/2" aria-hidden />
                <motion.article initial={{ opacity: 0, x: left ? -30 : 30, y: 10 }} whileInView={{ opacity: 1, x: 0, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className={cn('card overflow-hidden md:w-[calc(50%-2rem)]', left ? 'md:mr-auto' : 'md:ml-auto')}>
                  {e.photoURL && <img src={e.photoURL} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" />}
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2"><span className="eyebrow">{e.kind}</span>
                      {!e.derived && e.authorId === uid && <button onClick={() => setDeleting(e)} aria-label="Delete moment" className="text-muted hover:text-wine"><Trash2 className="h-4 w-4" /></button>}</div>
                    <h2 className="mt-1 text-3xl font-semibold leading-tight">{e.title}</h2>
                    <p className="mt-0.5 text-sm text-muted">{formatDay(e.date)}</p>
                    {e.description && <p className="mt-3 leading-relaxed">{e.description}</p>}
                    {e.location && <p className="mt-3 flex items-center gap-1.5 text-sm text-muted"><MapPin className="h-4 w-4" />{e.location}</p>}
                    {e.derived && <p className="mt-3 text-xs text-muted">From your important dates</p>}
                  </div>
                </motion.article>
              </li>
            )
          })}
          <li className="relative pl-12 md:pl-0"><span className="absolute left-4 top-0 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-blush text-wine md:left-1/2" aria-hidden>♥</span>
            <p className="pt-1 text-center font-serif text-2xl italic text-muted md:pt-10">…and the story goes on.</p></li>
        </ol>
      )}

      <AddEvent open={adding} onClose={() => setAdding(false)} />
      <RelationshipDatesModal open={datesOpen} onClose={() => setDatesOpen(false)} />
      <CustomMilestone open={msOpen} onClose={() => setMsOpen(false)} onSave={async (m) => { try { await updateCoupleFields({ customMilestones: [...(couple?.customMilestones ?? []), m] }); toast.show('Milestone added ✨', 'love'); setMsOpen(false) } catch (e) { toast.error(friendlyError(e)) } }} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={del} title="Remove this moment?" body="It will disappear from your timeline for both of you." confirmLabel="Remove" />
    </div>
  )
}

function AddEvent({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { add, upload } = useWriters()
  const { coupleId } = useCouple()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [v, setV] = useState({ kind: 'Custom', title: '', date: today(), description: '', location: '' })
  const [photo, setPhoto] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setV({ kind: 'Custom', title: '', date: today(), description: '', location: '' }); setPhoto(null); setErrors({}) } }, [open])
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo])

  const submit = async () => {
    const p = eventSchema.safeParse(v)
    if (!p.success) { const e: Record<string, string> = {}; p.error.issues.forEach((i) => { e[String(i.path[0])] ||= i.message }); return setErrors(e) }
    setBusy(true)
    try {
      let photoURL: string | undefined
      if (photo) photoURL = await upload(`couples/${coupleId}/timeline/${Date.now()}.jpg`, await compressImage(photo, 1600))
      await add('timelineEvents', { kind: v.kind, title: p.data.title, date: p.data.date, description: p.data.description || undefined, location: p.data.location || undefined, photoURL })
      toast.show('Added to your story ❤️', 'love'); onClose()
    } catch (e) { toast.error(friendlyError(e, "That didn't save. Please try again.")) } finally { setBusy(false) }
  }
  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title="Add a moment" description="Every chapter counts." size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="What kind of moment?" value={v.kind} onChange={(e) => { const k = e.target.value; setV({ ...v, kind: k, title: v.title || (k === 'Custom' ? '' : k) }) }}>{EVENT_KINDS.map((k) => <option key={k}>{k}</option>)}</Select>
          <Input label="Date" type="date" max={today()} value={v.date} error={errors.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
        </div>
        <Input label="Title" value={v.title} error={errors.title} maxLength={80} onChange={(e) => setV({ ...v, title: e.target.value })} />
        <Textarea label="Description" optional value={v.description} maxLength={1000} onChange={(e) => setV({ ...v, description: e.target.value })} />
        <Input label="Location" optional value={v.location} maxLength={80} onChange={(e) => setV({ ...v, location: e.target.value })} />
        <div>
          {preview ? <div className="relative inline-block"><img src={preview} alt="" className="h-32 rounded-2xl object-cover" /><button onClick={() => setPhoto(null)} aria-label="Remove photo" className="absolute -right-2 -top-2 rounded-full bg-wine p-1 text-white"><X className="h-3.5 w-3.5" /></button></div>
            : <Button variant="outline" onClick={() => fileRef.current?.click()}><ImagePlus className="h-4 w-4" /> Add a photo</Button>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; const m = validateFile(f, 'image'); if (m) toast.error(m); else setPhoto(f) }} />
        </div>
        <Button size="lg" className="w-full" onClick={submit} loading={busy}>Add to our story</Button>
      </div>
    </Modal>
  )
}

function CustomMilestone({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (m: { id: string; title: string; date: string }) => Promise<void> }) {
  const [title, setTitle] = useState(''), [date, setDate] = useState(today()), [err, setErr] = useState('')
  useEffect(() => { if (open) { setTitle(''); setDate(today()); setErr('') } }, [open])
  return (
    <Modal open={open} onClose={onClose} title="Custom milestone" description="Something only you two would celebrate." size="sm">
      <div className="space-y-4">
        <Input label="Name it" value={title} error={err} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="Our first apartment" />
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button size="lg" className="w-full" onClick={() => { if (!title.trim()) return setErr('Give it a name.'); onSave({ id: 'cm_' + Date.now(), title: title.trim(), date }) }}>Unlock it ✨</Button>
      </div>
    </Modal>
  )
}
