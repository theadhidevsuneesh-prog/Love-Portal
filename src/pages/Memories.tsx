import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarDays, ChevronLeft, ChevronRight, Film, ImagePlus, MapPin, Mic, Plus, Search, Square, Trash2, X } from 'lucide-react'
import { useCollection, useWriters } from '@/data/hooks'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Chip, EmptyState, ErrorState, Skeleton } from '@/components/ui/Feedback'
import { MEMORY_CATEGORIES } from '@/lib/constants'
import { compressImage } from '@/lib/image'
import { fmtSeconds, useRecorder } from '@/lib/useRecorder'
import { cameraErrorMessage, friendlyError } from '@/lib/errors'
import { memorySchema, validateFile, zodErrors, type FieldErrors } from '@/lib/validation'
import { cn, formatDay, today } from '@/lib/utils'
import { INLINE_MEDIA } from '@/lib/storageMode'
import type { Memory, MemoryCategory } from '@/types'

const rid = () => Math.random().toString(36).slice(2, 8)

function MediaView({ m, className, controls }: { m: Memory; className?: string; controls?: boolean }) {
  if (m.mediaType === 'photo' && m.mediaURL) return <img src={m.mediaURL} alt={m.title} loading="lazy" className={cn('w-full object-cover', className)} />
  if (m.mediaType === 'video' && m.mediaURL) return <video src={m.mediaURL} controls={controls} muted={!controls} playsInline preload="metadata" className={cn('w-full object-cover', className)} />
  if (m.mediaType === 'audio' && m.mediaURL) return controls
    ? <div className="flex items-center justify-center bg-blush p-8"><audio src={m.mediaURL} controls className="w-full" /></div>
    : <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-blush to-rose/50 text-5xl">🎙️</div>
  return <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-blush to-rose/40 p-6 text-center font-serif text-2xl italic text-wine">{m.title}</div>
}

export default function Memories() {
  const { items, loading, error } = useCollection<Memory>('memories')
  const { me, partner, coupleId } = useCouple()
  const { add, remove, upload, notifyPartner, uid } = useWriters()
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const [cat, setCat] = useState<MemoryCategory | 'All'>('All')
  const [q, setQ] = useState('')
  const [adding, setAdding] = useState(params.get('new') === '1')
  const [viewing, setViewing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Memory | null>(null)

  useEffect(() => { if (params.get('new')) { setAdding(true); setParams({}, { replace: true }) } }, [params, setParams])

  const sorted = useMemo(() => [...items].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt), [items])
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return sorted.filter((m) => (cat === 'All' || m.category === cat) && (!s || [m.title, m.description, m.location, ...(m.tags ?? [])].join(' ').toLowerCase().includes(s)))
  }, [sorted, cat, q])
  const onThisDay = useMemo(() => {
    const t = new Date()
    return sorted.filter((m) => { const d = new Date(m.date + 'T00:00'); return d.getMonth() === t.getMonth() && d.getDate() === t.getDate() && d.getFullYear() < t.getFullYear() })
  }, [sorted])

  const idx = viewing ? filtered.findIndex((m) => m.id === viewing) : -1
  const current = idx >= 0 ? filtered[idx] : null
  const go = (d: number) => { if (filtered.length) setViewing(filtered[(idx + d + filtered.length) % filtered.length].id) }

  useEffect(() => {
    if (!viewing) return
    const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'Escape') setViewing(null) }
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k)
  })

  const del = async () => {
    if (!deleting) return
    try { await remove('memories', deleting.id); toast.success('Memory removed.'); setDeleting(null); setViewing(null) }
    catch (e) { toast.error(friendlyError(e)) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow mb-2">Our private gallery</p><h1 className="text-5xl font-semibold sm:text-6xl">Memories</h1></div>
        <Button size="lg" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add memory</Button>
      </div>

      {onThisDay.length > 0 && (
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-wine to-wine-deep p-6 text-white">
          <p className="eyebrow text-rose">On this day</p>
          <h2 className="mb-4 text-3xl font-semibold">Look what happened {(() => { const n = new Date().getFullYear() - Number(onThisDay[0].date.slice(0, 4)); return n === 1 ? 'a year ago' : `${n} years ago` })()}</h2>
          <div className="scroll-hide flex gap-3 overflow-x-auto">
            {onThisDay.map((m) => (
              <button key={m.id} onClick={() => setViewing(m.id)} className="w-40 shrink-0 overflow-hidden rounded-2xl bg-white/10 text-left">
                <MediaView m={m} className="aspect-[4/3]" /><p className="truncate p-2.5 text-sm">{m.title}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="space-y-3">
        <Input aria-label="Search memories" icon={<Search className="h-4 w-4" />} placeholder="Search titles, places, tags…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="scroll-hide -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={cat === 'All'} onClick={() => setCat('All')}>All</Chip>
          {MEMORY_CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
        </div>
      </div>

      {error ? <ErrorState />
        : loading ? <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">{[220, 300, 260, 340, 240, 280].map((h, i) => <Skeleton key={i} className="mb-3" style={{ height: h }} />)}</div>
        : items.length === 0 ? <EmptyState emoji="📸" title="Your story is waiting for its first chapter. ❤️" body="Add a photo, a video or a voice note from a moment you never want to forget." action={<Button size="lg" onClick={() => setAdding(true)}>Add your first memory</Button>} />
        : filtered.length === 0 ? <EmptyState emoji="🔍" title="No memories match that." body="Try a different word or category." />
        : (
          <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
            {filtered.map((m, i) => (
              <motion.button key={m.id} layoutId={`mem-${m.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}
                whileHover={{ y: -4 }} onClick={() => setViewing(m.id)}
                className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-3xl bg-surface text-left shadow-soft">
                <MediaView m={m} />
                {m.mediaType === 'video' && <span className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white"><Film className="h-3.5 w-3.5" /></span>}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3 pt-10 text-white opacity-95">
                  <p className="font-serif text-lg font-semibold leading-tight">{m.title}</p>
                  <p className="text-[11px] text-white/80">{formatDay(m.date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </motion.button>
            ))}
          </div>
        )}

      {/* Lightbox */}
      <AnimatePresence>
        {current && (
          <motion.div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-0 backdrop-blur-md sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewing(null)}>
            <motion.div layoutId={`mem-${current.id}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={current.title}
              className="flex max-h-dvh w-full max-w-5xl flex-col overflow-hidden bg-surface sm:max-h-[92dvh] sm:rounded-4xl md:flex-row"
              drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.3}
              onDragEnd={(_, info) => { if (info.offset.x < -80) go(1); else if (info.offset.x > 80) go(-1) }}>
              <div className="flex min-h-0 flex-1 items-center justify-center bg-black">
                <MediaView m={current} className="max-h-[55dvh] w-full object-contain md:max-h-[92dvh]" controls />
              </div>
              <div className="flex w-full flex-col overflow-y-auto p-6 md:w-80">
                <div className="mb-4 flex items-center justify-between">
                  <span className="eyebrow">{current.category}</span>
                  <Button variant="ghost" size="icon" onClick={() => setViewing(null)} aria-label="Close"><X className="h-5 w-5" /></Button>
                </div>
                <h2 className="text-3xl font-semibold leading-tight">{current.title}</h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><CalendarDays className="h-4 w-4" />{formatDay(current.date)}</p>
                {current.location && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin className="h-4 w-4" />{current.location}</p>}
                {current.description && <p className="mt-4 whitespace-pre-wrap leading-relaxed">{current.description}</p>}
                {current.tags?.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{current.tags.map((t) => <span key={t} className="rounded-full bg-blush px-2.5 py-1 text-xs text-wine">#{t}</span>)}</div>}
                <p className="mt-4 text-xs text-muted">Added by {current.authorId === me?.uid ? 'you' : partner?.name}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-6">
                  <div className="flex gap-1"><Button variant="outline" size="icon" onClick={() => go(-1)} aria-label="Previous"><ChevronLeft className="h-5 w-5" /></Button><Button variant="outline" size="icon" onClick={() => go(1)} aria-label="Next"><ChevronRight className="h-5 w-5" /></Button></div>
                  {current.authorId === uid && <Button variant="ghost" size="sm" onClick={() => setDeleting(current)}><Trash2 className="h-4 w-4" /> Delete</Button>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={del} title="Delete this memory?" body="It will be removed for both of you. This can't be undone." confirmLabel="Delete memory" />
      <AddMemory open={adding} onClose={() => setAdding(false)} coupleId={coupleId!} upload={upload}
        onCreate={async (data) => { await add('memories', data); notifyPartner('memory', `${me?.name} added a new memory`, '/memories', String(data.title)) }} />
    </div>
  )
}

function AddMemory({ open, onClose, onCreate, upload, coupleId }: { open: boolean; onClose: () => void; onCreate: (d: Record<string, unknown>) => Promise<void>; upload: (p: string, f: Blob, cb?: (n: number) => void, max?: number) => Promise<string>; coupleId: string }) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const empty = { title: '', description: '', date: today(), location: '', tags: '', category: 'Random Moments' as MemoryCategory }
  const [v, setV] = useState(empty)
  const [files, setFiles] = useState<File[]>([])
  const [voice, setVoice] = useState<Blob | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const recorder = useRecorder()

  useEffect(() => { if (open) { setV(empty); setFiles([]); setVoice(null); setErrors({}); setProgress(0) } }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const previews = useMemo(() => files.map((f) => ({ f, url: URL.createObjectURL(f) })), [files])
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews])
  const voiceUrl = useMemo(() => (voice ? URL.createObjectURL(voice) : null), [voice])

  const pickFiles = (list: FileList | null) => {
    if (!list) return
    const picked = Array.from(list)
    const isVideo = picked.some((f) => f.type.startsWith('video/'))
    const kinds = picked.map((f) => (f.type.startsWith('video/') ? 'video' : f.type.startsWith('audio/') ? 'audio' : 'image') as 'video' | 'audio' | 'image')
    for (let i = 0; i < picked.length; i++) { const e = validateFile(picked[i], kinds[i]); if (e) return toast.error(e) }
    setVoice(null)
    setFiles(isVideo || kinds[0] === 'audio' ? [picked[0]] : picked.slice(0, INLINE_MEDIA ? 3 : 6))
  }

  const toggleRec = async () => {
    if (recorder.recording) { const b = await recorder.stop(); if (b) { setVoice(b); setFiles([]) } return }
    try { await recorder.start() } catch (e) { toast.error(cameraErrorMessage(e).replace(/camera/gi, 'microphone')) }
  }

  const submit = async () => {
    const parsed = memorySchema.safeParse(v)
    if (!parsed.success) return setErrors(zodErrors(parsed.error))
    setErrors({}); setBusy(true)
    try {
      let mediaType: 'photo' | 'video' | 'audio' | 'none' = 'none'
      let mediaURL: string | undefined
      let extra: string[] = []
      if (voice) {
        mediaType = 'audio'
        mediaURL = await upload(`couples/${coupleId}/memories/${Date.now()}_${rid()}.webm`, voice, setProgress)
      } else if (files.length) {
        const first = files[0]
        mediaType = first.type.startsWith('video/') ? 'video' : first.type.startsWith('audio/') ? 'audio' : 'photo'
        const urls: string[] = []
        for (let i = 0; i < files.length; i++) {
          const blob = mediaType === 'photo' ? await compressImage(files[i]) : files[i]
          const ext = (files[i].name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin'
          urls.push(await upload(`couples/${coupleId}/memories/${Date.now()}_${rid()}.${mediaType === 'photo' ? 'jpg' : ext}`, blob, (n) => setProgress(Math.round(((i + n / 100) / files.length) * 100)), INLINE_MEDIA ? Math.floor(850_000 / files.length) : undefined))
        }
        mediaURL = urls[0]; extra = urls.slice(1)
      }
      await onCreate({
        title: parsed.data.title, description: parsed.data.description || undefined, date: parsed.data.date,
        location: parsed.data.location || undefined, category: v.category,
        tags: v.tags.split(/[,#\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 8),
        mediaType, mediaURL, extraPhotos: extra.length ? extra : undefined,
      })
      toast.show('Memory saved ❤️', 'love'); onClose()
    } catch (e) { toast.error(friendlyError(e, "That upload didn't go through. Please try again.")) }
    finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title="Add a memory" description="Photos, videos or a voice note — whatever the moment deserves." size="lg">
      <div className="space-y-4">
        <div className="rounded-3xl border border-dashed border-rose/70 bg-blush/30 p-4">
          {previews.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((p) => (
                <div key={p.url} className="relative aspect-square overflow-hidden rounded-2xl">
                  {p.f.type.startsWith('video/') ? <video src={p.url} className="h-full w-full object-cover" muted /> : p.f.type.startsWith('audio/') ? <div className="flex h-full items-center justify-center bg-blush text-3xl">🎙️</div> : <img src={p.url} alt="" className="h-full w-full object-cover" />}
                  <button onClick={() => setFiles(files.filter((f) => f !== p.f))} aria-label="Remove" className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"><X className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          ) : voiceUrl ? (
            <div className="flex items-center gap-3"><audio src={voiceUrl} controls className="h-10 flex-1" /><Button variant="ghost" size="icon" onClick={() => setVoice(null)} aria-label="Remove recording"><X className="h-4 w-4" /></Button></div>
          ) : (
            <p className="py-3 text-center text-sm text-muted">{INLINE_MEDIA ? 'Add up to 3 photos or record a voice note.' : 'Add photos (up to 6), one video, or record a voice note.'}</p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={recorder.recording}><ImagePlus className="h-4 w-4" /> Photos / video</Button>
            <Button variant={recorder.recording ? 'danger' : 'outline'} size="sm" onClick={toggleRec}>
              {recorder.recording ? <><Square className="h-4 w-4 fill-current" /> Stop {fmtSeconds(recorder.seconds)}</> : <><Mic className="h-4 w-4" /> Record voice</>}
            </Button>
          </div>
          <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" multiple hidden onChange={(e) => { pickFiles(e.target.files); e.target.value = '' }} />
        </div>
        <Input label="Title" value={v.title} error={errors.title} maxLength={80} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Our first sunset" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Date" type="date" max={today()} value={v.date} error={errors.date} onChange={(e) => setV({ ...v, date: e.target.value })} />
          <Select label="Category" value={v.category} onChange={(e) => setV({ ...v, category: e.target.value as MemoryCategory })}>{MEMORY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
        </div>
        <Input label="Location" optional value={v.location} maxLength={80} onChange={(e) => setV({ ...v, location: e.target.value })} placeholder="Where was this?" />
        <Textarea label="Description" optional value={v.description} error={errors.description} maxLength={1500} onChange={(e) => setV({ ...v, description: e.target.value })} placeholder="What do you want to remember?" />
        <Input label="Tags" optional value={v.tags} onChange={(e) => setV({ ...v, tags: e.target.value })} placeholder="sunset, trip, coffee" hint="Separate with commas." />
        {busy && <div className="h-2 overflow-hidden rounded-full bg-line"><motion.div className="h-full bg-wine" animate={{ width: `${Math.max(progress, 6)}%` }} /></div>}
        <Button size="lg" className="w-full" onClick={submit} loading={busy}>{busy ? 'Saving…' : 'Save memory'}</Button>
      </div>
    </Modal>
  )
}
