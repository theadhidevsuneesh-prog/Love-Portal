import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, ImagePlus, Music2, Plus, Trash2, X } from 'lucide-react'
import { useCollection, useWriters } from '@/data/hooks'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Chip, EmptyState } from '@/components/ui/Feedback'
import { SONG_CATEGORIES } from '@/lib/constants'
import { compressImage, squareAvatar } from '@/lib/image'
import { friendlyError } from '@/lib/errors'
import { songSchema, validateFile } from '@/lib/validation'
import { cn, placeholderImage } from '@/lib/utils'
import type { Song, SongCategory } from '@/types'

function platform(link?: string) {
  if (!link) return null
  try {
    const h = new URL(link).hostname
    if (h.includes('spotify')) return 'Spotify'
    if (h.includes('youtu')) return 'YouTube'
    if (h.includes('apple')) return 'Apple Music'
    if (h.includes('saavn')) return 'JioSaavn'
    return h.replace('www.', '')
  } catch { return null }
}

export default function Playlist() {
  const { items } = useCollection<Song>('playlist')
  const { partner, me } = useCouple()
  const { remove, uid } = useWriters()
  const toast = useToast()
  const [cat, setCat] = useState<SongCategory | 'All'>('All')
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState<Song | null>(null)
  const songs = useMemo(() => items.filter((s) => cat === 'All' || s.category === cat).sort((a, b) => b.createdAt - a.createdAt), [items, cat])
  const ours = items.find((s) => s.category === 'Our Song')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="eyebrow mb-2">The soundtrack to us</p><h1 className="text-5xl font-semibold sm:text-6xl">Our Playlist</h1></div>
        <Button size="lg" onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add a song</Button>
      </div>

      {ours && cat === 'All' && (
        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col items-center gap-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-wine to-wine-deep p-7 text-white shadow-lift sm:flex-row sm:p-10">
          <motion.img animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 24, ease: 'linear' }} src={ours.coverURL ?? placeholderImage(ours.title, '♪', 400, 400)} alt="" className="h-40 w-40 shrink-0 rounded-full border-[10px] border-black/80 object-cover shadow-lift" />
          <div className="text-center sm:text-left">
            <p className="eyebrow text-rose">Our song</p>
            <h2 className="text-4xl font-semibold leading-tight sm:text-5xl">{ours.title}</h2>
            <p className="text-blush/80">{ours.artist}</p>
            {ours.why && <p className="mt-3 max-w-lg font-serif text-xl italic text-blush">“{ours.why}”</p>}
            {ours.link && <a href={ours.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm hover:bg-white/25"><ExternalLink className="h-4 w-4" />Listen on {platform(ours.link)}</a>}
          </div>
        </motion.section>
      )}

      <div className="scroll-hide -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Chip active={cat === 'All'} onClick={() => setCat('All')}>All songs</Chip>
        {SONG_CATEGORIES.map((c) => <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>

      {songs.length === 0 ? (
        <EmptyState emoji="🎶" title="No songs yet — what plays when you think of them?" body="Add the songs that mean something. Links to Spotify, YouTube and more." action={<Button onClick={() => setAdding(true)}>Add your first song</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {songs.map((s, i) => (
            <motion.article key={s.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }} whileHover={{ y: -4 }} className="card flex gap-4 p-4">
              <img src={s.coverURL ?? placeholderImage(s.title, '♪', 300, 300)} alt="" loading="lazy" className="h-24 w-24 shrink-0 rounded-2xl object-cover shadow-soft" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="eyebrow mb-0.5 truncate">{s.category}</span>
                <h3 className="truncate font-serif text-2xl font-semibold leading-tight">{s.title}</h3>
                <p className="truncate text-sm text-muted">{s.artist}</p>
                {s.why && <p className="mt-1.5 line-clamp-2 text-xs italic text-muted">“{s.why}”</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="text-[11px] text-muted">Added by {s.authorId === me?.uid ? 'you' : partner?.name}</span>
                  <span className="flex gap-1">
                    {s.link && <a href={s.link} target="_blank" rel="noopener noreferrer" aria-label={`Open ${s.title} on ${platform(s.link)}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-blush text-wine hover:bg-rose/50"><ExternalLink className="h-4 w-4" /></a>}
                    {s.authorId === uid && <button onClick={() => setDeleting(s)} aria-label="Remove song" className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-blush"><Trash2 className="h-4 w-4" /></button>}
                  </span>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted"><Music2 className="h-3.5 w-3.5" /> Love Portal stores links only — songs play in your own music app.</p>

      <AddSong open={adding} onClose={() => setAdding(false)} defaultCat={cat === 'All' ? 'Our Song' : cat} />
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} title="Remove this song?" body="It will be removed from your shared playlist." confirmLabel="Remove" onConfirm={async () => { try { await remove('playlist', deleting!.id); setDeleting(null) } catch (e) { toast.error(friendlyError(e)) } }} />
    </div>
  )
}

function AddSong({ open, onClose, defaultCat }: { open: boolean; onClose: () => void; defaultCat: SongCategory }) {
  const { add, upload } = useWriters()
  const { coupleId } = useCouple()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [v, setV] = useState({ title: '', artist: '', link: '', why: '', category: defaultCat })
  const [cover, setCover] = useState<Blob | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (open) { setV({ title: '', artist: '', link: '', why: '', category: defaultCat }); setCover(null); setErrors({}) } }, [open, defaultCat])
  const preview = useMemo(() => (cover ? URL.createObjectURL(cover) : null), [cover])

  const submit = async () => {
    const p = songSchema.safeParse(v)
    if (!p.success) { const e: Record<string, string> = {}; p.error.issues.forEach((i) => { e[String(i.path[0])] ||= i.message }); return setErrors(e) }
    setBusy(true)
    try {
      const coverURL = cover ? await upload(`couples/${coupleId}/playlist/${Date.now()}.jpg`, cover) : undefined
      await add('playlist', { title: p.data.title, artist: p.data.artist, link: p.data.link || undefined, why: p.data.why || undefined, category: v.category, coverURL })
      toast.show('Added to your playlist 🎶', 'love'); onClose()
    } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onClose={busy ? () => undefined : onClose} title="Add a song" description="A song and the reason it matters.">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button onClick={() => fileRef.current?.click()} className={cn('relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-rose bg-blush/40 text-muted')} aria-label="Choose cover image">
            {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6" />}
          </button>
          {cover && <Button variant="ghost" size="sm" onClick={() => setCover(null)}><X className="h-4 w-4" /> Remove</Button>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; const m = validateFile(f, 'image'); if (m) return toast.error(m); try { setCover(await squareAvatar(await compressImage(f, 800), 600)) } catch { toast.error('We couldn’t read that image.') } }} />
          <p className="text-xs text-muted">Cover image (optional)</p>
        </div>
        <Input label="Song title" value={v.title} error={errors.title} maxLength={100} onChange={(e) => setV({ ...v, title: e.target.value })} />
        <Input label="Artist" value={v.artist} error={errors.artist} maxLength={100} onChange={(e) => setV({ ...v, artist: e.target.value })} />
        <Select label="Category" value={v.category} onChange={(e) => setV({ ...v, category: e.target.value as SongCategory })}>{SONG_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
        <Input label="Link" optional value={v.link} error={errors.link} maxLength={300} onChange={(e) => setV({ ...v, link: e.target.value })} placeholder="https://open.spotify.com/…" />
        <Textarea label="Why this song matters" optional value={v.why} maxLength={500} onChange={(e) => setV({ ...v, why: e.target.value })} className="min-h-[90px]" />
        <Button size="lg" className="w-full" onClick={submit} loading={busy}>Add song</Button>
      </div>
    </Modal>
  )
}
