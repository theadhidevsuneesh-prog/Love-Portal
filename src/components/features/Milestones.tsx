import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Sparkles } from 'lucide-react'
import { MILESTONE_DEFS } from '@/lib/constants'
import { cn, daysSince, formatDay, parseDay, toDayString } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { HeartBurst } from '@/components/ui/Motion'
import { useCouple } from '@/context/CoupleContext'
import type { Couple } from '@/types'

export interface Milestone { id: string; title: string; blurb: string; date: string; unlocked: boolean; daysAway: number; custom?: boolean }

export function computeMilestones(couple: Couple | null): Milestone[] {
  const start = parseDay(couple?.relationshipStart)
  if (!start) return []
  const elapsed = daysSince(couple?.relationshipStart) ?? 0
  const list: Milestone[] = MILESTONE_DEFS.map((d) => {
    const dt = new Date(start); dt.setDate(dt.getDate() + d.days)
    return { id: d.id, title: d.title, blurb: d.blurb, date: toDayString(dt), unlocked: elapsed >= d.days, daysAway: d.days - elapsed }
  })
  for (const c of couple?.customMilestones ?? []) {
    const dd = daysSince(c.date)
    list.push({ id: c.id, title: c.title, blurb: 'A moment only you two understand.', date: c.date, unlocked: dd !== null && dd >= 0, daysAway: -(dd ?? 0), custom: true })
  }
  return list.sort((a, b) => a.date.localeCompare(b.date))
}

function Card({ m, onClick }: { m: Milestone; onClick: () => void }) {
  return (
    <motion.button onClick={onClick} whileHover={{ y: -5, rotate: m.unlocked ? -1 : 0 }} whileTap={{ scale: 0.97 }}
      aria-label={`${m.title} — ${m.unlocked ? 'unlocked' : 'locked'}`}
      className={cn('group relative aspect-[3/4] w-40 shrink-0 snap-start overflow-hidden rounded-3xl p-4 text-left shadow-soft sm:w-44',
        m.unlocked ? 'bg-gradient-to-br from-wine via-wine-deep to-[#2a0a14] text-white' : 'border border-dashed border-line bg-surface/60 text-muted')}>
      {m.unlocked && <span className="pointer-events-none absolute -inset-full rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />}
      <div className="flex h-full flex-col justify-between">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', m.unlocked ? 'bg-white/15 text-rose' : 'bg-line/60')}>
          {m.unlocked ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
        </span>
        <div>
          <p className={cn('font-serif text-2xl font-semibold leading-tight', !m.unlocked && 'text-ink/60')}>{m.title}</p>
          <p className={cn('mt-1 text-[11px]', m.unlocked ? 'text-blush/70' : 'text-muted')}>{m.unlocked ? formatDay(m.date, { day: 'numeric', month: 'short', year: 'numeric' }) : `in ${m.daysAway} days`}</p>
        </div>
      </div>
    </motion.button>
  )
}

export function MilestoneStrip({ limit, grid }: { limit?: number; grid?: boolean }) {
  const { couple, coupleId } = useCouple()
  const all = useMemo(() => computeMilestones(couple), [couple])
  const [selected, setSelected] = useState<Milestone | null>(null)
  const [celebrate, setCelebrate] = useState<Milestone | null>(null)

  // Celebrate a freshly unlocked milestone once (reached within the last 3 days).
  useEffect(() => {
    if (!coupleId) return
    const fresh = [...all].reverse().find((m) => m.unlocked && !m.custom && m.daysAway <= 0 && m.daysAway >= -3)
    if (!fresh) return
    const key = `lp_ms_${coupleId}_${fresh.id}`
    try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1') } catch { return }
    const t = setTimeout(() => setCelebrate(fresh), 900)
    return () => clearTimeout(t)
  }, [all, coupleId])

  if (!all.length) return null
  // Show the last unlocked ones plus what's next.
  const firstLocked = all.findIndex((m) => !m.unlocked)
  const idx = firstLocked === -1 ? all.length : firstLocked
  const shown = grid ? all : limit ? all.slice(Math.max(0, idx - Math.ceil(limit / 2)), Math.max(0, idx - Math.ceil(limit / 2)) + limit) : all

  return (
    <>
      <div className={grid ? 'grid grid-cols-2 justify-items-center gap-4 sm:grid-cols-3 lg:grid-cols-5' : 'scroll-hide -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0'}>
        {shown.map((m) => <Card key={m.id} m={m} onClick={() => (m.unlocked ? setCelebrate(m) : setSelected(m))} />)}
      </div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.title} size="sm">
        <p className="text-muted">{selected?.blurb}</p>
        <p className="mt-3 font-serif text-3xl">Unlocks in {selected?.daysAway} days</p>
        <p className="text-sm text-muted">{selected && formatDay(selected.date)}</p>
      </Modal>
      <AnimatePresence>
        {celebrate && (
          <motion.div className="fixed inset-0 z-[110] flex items-center justify-center bg-wine-deep/70 p-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCelebrate(null)}>
            <motion.div initial={{ scale: 0.6, rotate: -8, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 14 }}
              onClick={(e) => e.stopPropagation()} className="relative w-full max-w-xs rounded-[2rem] bg-gradient-to-br from-wine via-wine-deep to-[#2a0a14] p-8 text-center text-white shadow-lift">
              <HeartBurst show />
              <p className="eyebrow text-rose">Milestone unlocked</p>
              <Sparkles className="mx-auto my-4 h-10 w-10 text-rose" />
              <p className="font-serif text-5xl font-semibold leading-none">{celebrate.title}</p>
              <p className="mt-3 text-sm text-blush/80">{celebrate.blurb}</p>
              <p className="mt-4 text-xs text-blush/60">{formatDay(celebrate.date)}</p>
              <Button variant="soft" className="mt-6" onClick={() => setCelebrate(null)}>Lovely</Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
