import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Banknote, CalendarPlus, Check, Clock, Dices, Heart, MapPin, Plus, Trash2 } from 'lucide-react'
import { DATE_FILTERS, DATE_IDEAS, type DateIdea, type DateTag } from '@/data/dateIdeas'
import { useCollection, useWriters } from '@/data/hooks'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Chip, EmptyState } from '@/components/ui/Feedback'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { SectionTitle } from '@/components/ui/Card'
import { friendlyError } from '@/lib/errors'
import { cn, formatDay, pick, today } from '@/lib/utils'
import type { SavedDate } from '@/types'

export default function Dates() {
  const { items: saved } = useCollection<SavedDate>('dateIdeas')
  const { add, update, remove, notifyPartner } = useWriters()
  const toast = useToast()
  const [filters, setFilters] = useState<DateTag[]>([])
  const [idea, setIdea] = useState<DateIdea>(() => pick(DATE_IDEAS))
  const [roll, setRoll] = useState(0)
  const [planFor, setPlanFor] = useState<DateIdea | null>(null)
  const [planDate, setPlanDate] = useState(today())
  const [custom, setCustom] = useState(false)

  const pool = useMemo(() => DATE_IDEAS.filter((d) => filters.every((f) => d.tags.includes(f))), [filters])
  const savedIds = new Set(saved.map((s) => s.ideaId))

  const reroll = (list = pool) => { if (!list.length) return; setIdea((cur) => pick(list, list.length > 1 ? cur : undefined)); setRoll((r) => r + 1) }
  const toggle = (f: DateTag) => {
    const next = filters.includes(f) ? filters.filter((x) => x !== f) : [...filters, f]
    setFilters(next)
    const list = DATE_IDEAS.filter((d) => next.every((x) => d.tags.includes(x)))
    if (list.length && !list.includes(idea)) setIdea(pick(list)); setRoll((r) => r + 1)
  }
  const noMatch = pool.length === 0
  const shown = noMatch ? null : pool.includes(idea) ? idea : pool[0]

  const toRecord = (d: DateIdea, planned?: string) => ({ ideaId: d.id, title: d.title, description: d.description, cost: d.cost === 'Free' ? 'Free' : d.costNote, duration: d.duration, place: d.place, planned })
  const save = async (d: DateIdea, planned?: string) => {
    try {
      const existing = saved.find((s) => s.ideaId === d.id)
      if (existing) { if (planned) await update('dateIdeas', existing.id, { planned }); else await remove('dateIdeas', existing.id) }
      else { await add('dateIdeas', toRecord(d, planned)); if (planned) notifyPartner('date', `New date planned: ${d.title}`, '/dates', formatDay(planned)) }
      toast.show(planned ? 'Date planned 📅' : existing ? 'Removed from saved' : 'Saved for later ❤️', 'love')
    } catch (e) { toast.error(friendlyError(e)) }
  }

  const sortedSaved = [...saved].sort((a, b) => Number(!!a.done) - Number(!!b.done) || (a.planned ?? '9').localeCompare(b.planned ?? '9'))

  return (
    <div className="space-y-8">
      <div><p className="eyebrow mb-2">Never ask “what should we do?” again</p><h1 className="text-5xl font-semibold sm:text-6xl">Date Night</h1></div>

      <div className="scroll-hide -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {DATE_FILTERS.map((f) => <Chip key={f.id} active={filters.includes(f.id)} onClick={() => toggle(f.id)}>{f.label}</Chip>)}
        {filters.length > 0 && <button onClick={() => setFilters([])} className="shrink-0 px-2 text-sm text-wine underline underline-offset-2">Clear</button>}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          {shown ? (
            <motion.article key={shown.id + roll} initial={{ opacity: 0, y: 24, rotate: -1.5 }} animate={{ opacity: 1, y: 0, rotate: 0 }} exit={{ opacity: 0, y: -16, rotate: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }}
              className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-wine via-wine-deep to-[#35101d] p-7 text-white shadow-lift sm:p-12">
              <span className="pointer-events-none absolute -right-8 -top-10 font-serif text-[16rem] leading-none text-white/5" aria-hidden>♥</span>
              <div className="relative">
                <div className="mb-4 flex flex-wrap gap-2">{shown.tags.slice(0, 3).map((t) => <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize">{DATE_FILTERS.find((f) => f.id === t)?.label}</span>)}</div>
                <h2 className="max-w-2xl text-4xl font-semibold leading-[1.05] sm:text-6xl">{shown.title}</h2>
                <p className="mt-4 max-w-xl text-lg text-blush/90">{shown.description}</p>
                <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                  <div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-rose" /><dt className="sr-only">Estimated cost</dt><dd>{shown.cost === 'Free' ? 'Free' : `${shown.cost} · ${shown.costNote}`}</dd></div>
                  <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-rose" /><dt className="sr-only">Duration</dt><dd>{shown.duration}</dd></div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-rose" /><dt className="sr-only">Location</dt><dd>{shown.place}</dd></div>
                </dl>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button size="lg" variant="soft" onClick={() => reroll()}><motion.span key={roll} initial={{ rotate: -180 }} animate={{ rotate: 0 }} className="inline-flex"><Dices className="h-5 w-5" /></motion.span> Give us another date 🎲</Button>
                  <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => save(shown)}><Heart className={cn('h-5 w-5', savedIds.has(shown.id) && 'fill-current')} /> {savedIds.has(shown.id) ? 'Saved' : 'Save'}</Button>
                  <Button size="lg" variant="ghost" className="text-white hover:bg-white/10" onClick={() => { setPlanFor(shown); setPlanDate(today()) }}><CalendarPlus className="h-5 w-5" /> Plan it</Button>
                </div>
              </div>
            </motion.article>
          ) : (
            <EmptyState key="none" emoji="🤔" title="No date matches all of those." body="That’s a very specific evening. Try removing a filter or two." action={<Button onClick={() => setFilters([])}>Clear filters</Button>} />
          )}
        </AnimatePresence>
      </div>

      <section>
        <SectionTitle eyebrow="Your list" title="Saved dates" action={<Button variant="soft" size="sm" onClick={() => setCustom(true)}><Plus className="h-4 w-4" /> Your own idea</Button>} />
        {sortedSaved.length === 0 ? (
          <EmptyState emoji="🗓️" title="Your next adventure hasn't been planned yet." body="Save the ideas you like and plan one for this weekend." />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {sortedSaved.map((s) => (
              <motion.li layout key={s.id} className={cn('card flex items-start gap-3 p-4', s.done && 'opacity-60')}>
                <button onClick={() => update('dateIdeas', s.id, { done: !s.done }).catch((e) => toast.error(friendlyError(e)))} aria-label={s.done ? 'Mark as not done' : 'Mark as done'} aria-pressed={!!s.done}
                  className={cn('mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2', s.done ? 'border-wine bg-wine text-white' : 'border-rose')}>{s.done && <Check className="h-3.5 w-3.5" />}</button>
                <div className="min-w-0 flex-1">
                  <p className={cn('font-serif text-xl font-semibold leading-tight', s.done && 'line-through')}>{s.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted">{s.description}</p>
                  <p className="mt-1.5 text-xs text-muted">{s.cost} · {s.duration} · {s.place}</p>
                  {s.planned && <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blush px-2.5 py-1 text-xs text-wine"><CalendarPlus className="h-3 w-3" />{formatDay(s.planned, { weekday: 'short', day: 'numeric', month: 'short' })}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove('dateIdeas', s.id).catch((e) => toast.error(friendlyError(e)))} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button>
              </motion.li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={!!planFor} onClose={() => setPlanFor(null)} title="Plan this date" description={planFor?.title} size="sm">
        <div className="space-y-4">
          <Input label="When?" type="date" min={today()} value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
          <Button size="lg" className="w-full" onClick={async () => { if (planFor) await save(planFor, planDate); setPlanFor(null) }}>Add to our calendar</Button>
        </div>
      </Modal>
      <CustomIdea open={custom} onClose={() => setCustom(false)} onSave={async (d) => { try { await add('dateIdeas', d); toast.show('Saved ❤️', 'love'); setCustom(false) } catch (e) { toast.error(friendlyError(e)) } }} />
    </div>
  )
}

function CustomIdea({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (d: Record<string, unknown>) => Promise<void> }) {
  const [v, setV] = useState({ title: '', description: '', cost: '', duration: '', place: 'At home', planned: '' })
  const [err, setErr] = useState('')
  const submit = async () => {
    if (!v.title.trim()) return setErr('Give your idea a name.')
    await onSave({ ideaId: 'custom_' + Date.now(), title: v.title.trim().slice(0, 80), description: v.description.trim().slice(0, 300), cost: v.cost.trim().slice(0, 20) || 'Free', duration: v.duration.trim().slice(0, 20) || '—', place: v.place, planned: v.planned || undefined })
    setV({ title: '', description: '', cost: '', duration: '', place: 'At home', planned: '' }); setErr('')
  }
  return (
    <Modal open={open} onClose={onClose} title="Your own date idea">
      <div className="space-y-4">
        <Input label="Title" value={v.title} error={err} maxLength={80} onChange={(e) => setV({ ...v, title: e.target.value })} placeholder="Midnight pancakes" />
        <Textarea label="Description" optional value={v.description} maxLength={300} onChange={(e) => setV({ ...v, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-3"><Input label="Cost" optional value={v.cost} onChange={(e) => setV({ ...v, cost: e.target.value })} placeholder="$10" /><Input label="Duration" optional value={v.duration} onChange={(e) => setV({ ...v, duration: e.target.value })} placeholder="2 hrs" /></div>
        <Select label="Where" value={v.place} onChange={(e) => setV({ ...v, place: e.target.value })}><option>At home</option><option>Outside</option><option>Online</option></Select>
        <Input label="Plan it for" type="date" optional min={today()} value={v.planned} onChange={(e) => setV({ ...v, planned: e.target.value })} />
        <Button size="lg" className="w-full" onClick={submit}>Save idea</Button>
      </div>
    </Modal>
  )
}
