import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil } from 'lucide-react'
import { MOODS, moodById } from '@/lib/constants'
import { useCollection, useWriters } from '@/data/hooks'
import { useCouple } from '@/context/CoupleContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { cn, relativeTime } from '@/lib/utils'
import { friendlyError } from '@/lib/errors'
import type { MoodDoc } from '@/types'

export function MoodCard() {
  const { me, partner, coupleId } = useCouple()
  const { profile } = useAuth()
  const { items } = useCollection<MoodDoc>('moods')
  const { set, notifyPartner } = useWriters()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)

  const mine = items.find((m) => m.uid === me?.uid)
  const theirs = items.find((m) => m.uid === partner?.uid)
  const share = profile?.privacy?.showMood !== false

  const openPicker = () => { setMood(mine?.mood ?? ''); setNote(mine?.note ?? ''); setOpen(true) }
  const save = async () => {
    if (!mood || !me || !coupleId) return
    setBusy(true)
    try {
      await set('moods', `${coupleId}_${me.uid}`, { uid: me.uid, mood, note: note.trim().slice(0, 80) || null, updatedAt: Date.now() })
      const m = moodById(mood)
      if (share) notifyPartner('message', `${me.name} is feeling ${m?.label.toLowerCase()} ${m?.emoji}`, '/home', note.trim() || undefined)
      setOpen(false); toast.show('Mood shared ❤️', 'love')
    } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }

  const Row = ({ doc, name, photo, mineRow }: { doc?: MoodDoc; name?: string; photo?: string; mineRow?: boolean }) => {
    const m = moodById(doc?.mood)
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-blush/40 p-3">
        <Avatar src={photo} name={name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{mineRow ? 'You' : name}{doc ? ` · ${relativeTime(doc.updatedAt)}` : ''}</p>
          {m ? <p className="truncate text-sm font-medium">{m.emoji} {m.label}{doc?.note && <span className="font-normal text-muted"> — “{doc.note}”</span>}</p>
            : <p className="text-sm text-muted">{mineRow ? 'How are you feeling?' : 'Hasn’t shared yet'}</p>}
        </div>
      </div>
    )
  }

  return (
    <div className="card flex h-full flex-col p-5 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><p className="eyebrow mb-1">Today’s mood</p><h3 className="text-2xl font-semibold">How are we feeling?</h3></div>
        <Button variant="soft" size="sm" onClick={openPicker}><Pencil className="h-3.5 w-3.5" /> Update</Button>
      </div>
      <div className="space-y-2">
        <Row doc={theirs} name={partner?.name} photo={partner?.photoURL} />
        <Row doc={mine} name={me?.name} photo={me?.photoURL} mineRow />
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="How are you feeling?" description={`${partner?.name ?? 'Your person'} will see this on their dashboard.`}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MOODS.map((m) => (
            <motion.button key={m.id} whileTap={{ scale: 0.95 }} onClick={() => setMood(m.id)} aria-pressed={mood === m.id}
              className={cn('flex flex-col items-center gap-1 rounded-3xl border px-2 py-4 text-sm transition-colors', mood === m.id ? 'border-wine bg-blush' : 'border-line bg-surface hover:border-rose')}>
              <span className="text-3xl">{m.emoji}</span><span className="text-xs">{m.label}</span>
            </motion.button>
          ))}
        </div>
        <div className="mt-4"><Input label="A little note" optional maxLength={80} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell them why…" /></div>
        <Button className="mt-5 w-full" size="lg" disabled={!mood} loading={busy} onClick={save}>Share my mood</Button>
      </Modal>
    </div>
  )
}
