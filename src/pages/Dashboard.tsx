import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarHeart, Camera, Gamepad2, Mail, Pencil, Plus, Sparkles, Hand } from 'lucide-react'
import { useCouple } from '@/context/CoupleContext'
import { useCollection, useWriters } from '@/data/hooks'
import { CoupleAvatars } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { CountUp, FloatingHearts } from '@/components/ui/Motion'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { MoodCard } from '@/components/features/MoodCard'
import { MilestoneStrip } from '@/components/features/Milestones'
import { RelationshipDatesModal } from '@/components/features/RelationshipDatesModal'
import { useToast } from '@/context/ToastContext'
import { daysSince, formatDay, formatTime, nextAnnual, parseDay, relativeTime, ymd, cn } from '@/lib/utils'
import type { Memory, Message, SavedDate } from '@/types'

function greeting() {
  const h = new Date().getHours()
  return h < 5 ? 'Still up' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { couple, me, partner } = useCouple()
  const navigate = useNavigate()
  const toast = useToast()
  const { add, notifyPartner, uid } = useWriters()
  const { items: memories, loading: memLoading } = useCollection<Memory>('memories')
  const { items: messages } = useCollection<Message>('messages')
  const { items: dates } = useCollection<SavedDate>('dateIdeas')
  const [editDates, setEditDates] = useState(false)

  const days = daysSince(couple?.relationshipStart)
  const breakdown = ymd(couple?.relationshipStart)

  const recentMemories = useMemo(() => [...memories].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4), [memories])
  const recentMessages = useMemo(() => [...messages].filter((m) => !m.deleted).sort((a, b) => b.createdAt - a.createdAt).slice(0, 3).reverse(), [messages])
  const upcomingDate = useMemo(
    () => dates.filter((d) => d.planned && !d.done && parseDay(d.planned)! >= parseDay(new Date().toISOString().slice(0, 10))!).sort((a, b) => a.planned!.localeCompare(b.planned!))[0],
    [dates],
  )

  // Next important date among anniversary, birthdays, and custom milestones.
  const nextImportant = useMemo(() => {
    const cands: { label: string; inDays: number; date: Date }[] = []
    const a = nextAnnual(couple?.anniversary); if (a) cands.push({ label: `Anniversary · ${a.years} year${a.years === 1 ? '' : 's'}`, inDays: a.inDays, date: a.date })
    for (const p of [me, partner]) {
      const b = nextAnnual(p?.birthday); if (b && p) cands.push({ label: `${p.name}’s birthday`, inDays: b.inDays, date: b.date })
    }
    return cands.sort((x, y) => x.inDays - y.inDays)[0]
  }, [couple?.anniversary, me, partner])

  const sendGesture = async (text: string, toastMsg: string) => {
    try {
      await add('messages', { kind: 'gesture', text, authorId: uid })
      notifyPartner('message', `${me?.name} ${text}`, '/chat')
      toast.show(toastMsg, 'love')
    } catch { toast.error("That didn't send. Please try again.") }
  }

  const quick = [
    { icon: Mail, label: 'Write a letter', to: '/letters' },
    { icon: Camera, label: 'Photo booth', to: '/photo-booth' },
    { icon: Plus, label: 'Add a memory', to: '/memories?new=1' },
    { icon: CalendarHeart, label: 'Plan a date', to: '/dates' },
    { icon: Gamepad2, label: 'Play a game', to: '/games' },
    { icon: Sparkles, label: 'Ask Love Assistant', to: '/assistant' },
  ]

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow mb-2">{greeting()} · {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="text-4xl font-semibold leading-[1.05] sm:text-6xl">Welcome back, {me?.name} <span className="text-wine">&amp;</span> {partner?.name} <span className="text-wine">❤️</span></h1>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Together counter */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-wine via-wine-deep to-[#35101d] p-7 text-white shadow-lift sm:p-9 min-w-0 lg:col-span-3" aria-label="Together counter">
          <FloatingHearts count={7} />
          <div className="relative flex items-center justify-between">
            <CoupleAvatars a={me ?? undefined} b={partner ?? undefined} size="md" />
            <Button variant="soft" size="sm" onClick={() => setEditDates(true)}><Pencil className="h-3.5 w-3.5" /> Dates</Button>
          </div>
          {days !== null && days >= 0 ? (
            <div className="relative mt-8">
              <p className="font-serif text-xl italic text-blush/90 sm:text-2xl">You’ve been choosing each other for</p>
              <div className="flex items-end gap-3">
                <CountUp to={days} className="font-serif text-[6rem] font-semibold leading-[0.9] tracking-tight sm:text-[9rem]" />
                <span className="pb-3 text-sm font-medium uppercase tracking-[0.3em] text-rose sm:pb-6">days</span>
              </div>
              {breakdown && (
                <div className="mt-6 grid grid-cols-3 gap-2 sm:max-w-sm" aria-label="Breakdown">
                  {([[breakdown.years === 1 ? 'Year' : 'Years', breakdown.years], [breakdown.months === 1 ? 'Month' : 'Months', breakdown.months], [breakdown.days === 1 ? 'Day' : 'Days', breakdown.days]] as const).map(([l, n]) => (
                    <div key={l} className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur"><p className="font-serif text-3xl font-semibold leading-none">{n}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-blush/70">{l}</p></div>
                  ))}
                </div>
              )}
              <p className="mt-5 text-xs text-blush/70">Since {formatDay(couple?.relationshipStart)}</p>
            </div>
          ) : (
            <div className="relative mt-8">
              <p className="font-serif text-4xl font-semibold leading-tight">When did your story begin?</p>
              <p className="mt-2 max-w-sm text-sm text-blush/80">Add your relationship start date and watch the days count up — automatically, every day.</p>
              <Button variant="soft" className="mt-5" onClick={() => setEditDates(true)}>Add our dates</Button>
            </div>
          )}
        </section>

        <div className="grid min-w-0 grid-cols-1 gap-5 lg:col-span-2">
          <MoodCard />
          <div className="grid grid-cols-2 gap-5">
            <Card className="p-5">
              <p className="eyebrow mb-2">Next important date</p>
              {nextImportant ? (<>
                <p className="font-serif text-4xl font-semibold leading-none">{nextImportant.inDays === 0 ? 'Today' : nextImportant.inDays}</p>
                <p className="mt-0.5 text-xs text-muted">{nextImportant.inDays === 0 ? '🎉' : nextImportant.inDays === 1 ? 'day to go' : 'days to go'}</p>
                <p className="mt-2 text-sm">{nextImportant.label}</p>
              </>) : <button onClick={() => setEditDates(true)} className="text-sm text-wine underline underline-offset-2">Add your anniversary</button>}
            </Card>
            <Card className="p-5">
              <p className="eyebrow mb-2">Upcoming date</p>
              {upcomingDate ? (<>
                <p className="font-serif text-xl font-semibold leading-tight">{upcomingDate.title}</p>
                <p className="mt-1 text-xs text-muted">{formatDay(upcomingDate.planned, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
              </>) : <><p className="text-sm text-muted">Nothing planned yet.</p><Link to="/dates" className="mt-1 inline-block text-sm text-wine underline underline-offset-2">Find a date idea</Link></>}
            </Card>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <section aria-label="Quick actions">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {quick.map((q) => (
            <motion.button key={q.label} whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }} onClick={() => navigate(q.to)}
              className="card flex flex-col items-center gap-2 px-2 py-4 text-center text-xs font-medium transition-shadow hover:shadow-lift sm:text-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blush text-wine"><q.icon className="h-[18px] w-[18px]" /></span>{q.label}
            </motion.button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="soft" size="sm" onClick={() => sendGesture('sent you a hug 🫂', 'Hug sent 🫂')}><Hand className="h-4 w-4" /> Send a hug 🫂</Button>
          <Button variant="soft" size="sm" onClick={() => sendGesture('sent you a kiss 💋', 'Kiss sent 💋')}>Send a kiss 💋</Button>
          <Button variant="soft" size="sm" onClick={() => sendGesture('is thinking of you ❤️', 'They’ll know you’re thinking of them ❤️')}>I’m thinking of you ❤️</Button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <section className="min-w-0 lg:col-span-3">
          <SectionTitle eyebrow="Recent" title="Memories" action={<Link to="/memories" className="text-sm text-wine hover:underline">See all</Link>} />
          {memLoading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-square" />)}</div>
            : recentMemories.length === 0 ? <EmptyState emoji="📷" title="Your story is waiting for its first chapter. ❤️" action={<Button onClick={() => navigate('/memories?new=1')}>Add a memory</Button>} />
            : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {recentMemories.map((m, i) => (
                  <motion.button key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -4 }}
                    onClick={() => navigate('/memories')} className={cn('group relative aspect-square overflow-hidden rounded-3xl bg-blush shadow-soft')}>
                    {m.mediaURL && m.mediaType === 'photo' ? <img src={m.mediaURL} alt={m.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-3xl">{m.mediaType === 'video' ? '🎞️' : m.mediaType === 'audio' ? '🎙️' : '📝'}</div>}
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-left text-xs font-medium text-white">{m.title}</span>
                  </motion.button>
                ))}
              </div>
            )}
        </section>
        <section className="min-w-0 lg:col-span-2">
          <SectionTitle eyebrow="Latest" title="Messages" action={<Link to="/chat" className="text-sm text-wine hover:underline">Open chat</Link>} />
          <Card className="space-y-2 p-4">
            {recentMessages.length === 0 ? <p className="py-6 text-center text-sm text-muted">Say hi — your first message is just a tap away.</p>
              : recentMessages.map((m) => {
                const mine = m.authorId === uid
                return (
                  <div key={m.id} className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
                    <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2 text-sm', mine ? 'rounded-br-md bg-wine text-white' : 'rounded-bl-md bg-blush text-ink')}>
                      {m.kind === 'image' ? '📷 Photo' : m.kind === 'voice' ? '🎙️ Voice message' : m.kind === 'gesture' ? `${mine ? 'You' : partner?.name} ${m.text}` : m.text}
                    </div>
                    <span className="mt-0.5 px-1 text-[10px] text-muted">{formatTime(m.createdAt)} · {relativeTime(m.createdAt)}</span>
                  </div>
                )
              })}
            <Link to="/chat"><Button variant="soft" size="sm" className="mt-2 w-full">Reply</Button></Link>
          </Card>
        </section>
      </div>

      <section>
        <SectionTitle eyebrow="Collect them all" title="Milestones" action={<Link to="/our-story" className="text-sm text-wine hover:underline">Our story</Link>} />
        <MilestoneStrip limit={6} />
      </section>
      <RelationshipDatesModal open={editDates} onClose={() => setEditDates(false)} />
    </div>
  )
}
