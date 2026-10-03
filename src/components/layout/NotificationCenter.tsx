import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CalendarHeart, CheckCheck, Gift, Heart, Images, Mail, MessageCircleHeart, PartyPopper } from 'lucide-react'
import { useCollection } from '@/data/hooks'
import { useAuth } from '@/context/AuthContext'
import { useCouple } from '@/context/CoupleContext'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn, nextAnnual, relativeTime } from '@/lib/utils'
import type { AppNotification, NotificationType, SavedDate } from '@/types'

const ICONS: Record<NotificationType, typeof Bell> = {
  message: MessageCircleHeart, memory: Images, letter: Mail, surprise: Gift,
  connection: Heart, anniversary: PartyPopper, date: CalendarHeart,
}

interface Row { id: string; type: NotificationType; title: string; body?: string; link?: string; at: number; unread: boolean; stored?: AppNotification }

export function NotificationBell({ className }: { className?: string }) {
  const { user, profile } = useAuth()
  const { store, couple, incoming } = useCouple()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { items } = useCollection<AppNotification>('notifications', [['toUid', user?.uid ?? '']])
  const { items: dates } = useCollection<SavedDate>('dateIdeas')

  const rows = useMemo<Row[]>(() => {
    const prefs = profile?.notificationPrefs ?? {}
    const on = (t: NotificationType) => prefs[t] !== false
    const out: Row[] = items.filter((n) => on(n.type)).map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, link: n.link, at: n.createdAt, unread: !n.read, stored: n }))
    // derived reminders (not stored)
    const ann = nextAnnual(couple?.anniversary)
    if (on('anniversary') && ann && ann.inDays <= 14) {
      out.push({ id: 'ann', type: 'anniversary', title: ann.inDays === 0 ? 'Happy anniversary! 🎉' : `Your anniversary is in ${ann.inDays} day${ann.inDays > 1 ? 's' : ''}`, body: `${ann.years} year${ann.years === 1 ? '' : 's'} of choosing each other.`, link: '/our-story', at: Date.now(), unread: true })
    }
    if (on('date')) {
      for (const d of dates) {
        if (!d.planned || d.done) continue
        const t = new Date(d.planned + 'T00:00').getTime()
        const diff = Math.ceil((t - Date.now()) / 86_400_000)
        if (diff >= 0 && diff <= 3) out.push({ id: 'date_' + d.id, type: 'date', title: diff === 0 ? `Date night today: ${d.title}` : `Coming up in ${diff} day${diff > 1 ? 's' : ''}: ${d.title}`, link: '/dates', at: Date.now(), unread: true })
      }
    }
    for (const r of incoming.filter((r) => r.status === 'pending')) {
      out.push({ id: 'req_' + r.id, type: 'connection', title: `${r.fromName} wants to connect with you ❤️`, link: '/connect', at: r.createdAt, unread: true })
    }
    return out.sort((a, b) => b.at - a.at)
  }, [items, dates, couple?.anniversary, incoming, profile?.notificationPrefs])

  const unread = rows.filter((r) => r.unread).length

  const markAll = async () => { await Promise.all(rows.filter((r) => r.stored && !r.stored.read).map((r) => store.update('notifications', r.id, { read: true }))) }
  const openRow = async (r: Row) => {
    if (r.stored && !r.stored.read) store.update('notifications', r.id, { read: true }).catch(() => undefined)
    setOpen(false)
    if (r.link) navigate(r.link)
  }

  return (
    <>
      <Button variant="ghost" size="icon" className={cn('relative', className)} onClick={() => setOpen(true)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
        <Bell className="h-5 w-5" />
        <AnimatePresence>
          {unread > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-wine px-1 text-[10px] font-semibold text-white">
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Notifications" description="Little nudges from your world.">
        {rows.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-4xl" aria-hidden>🕊️</p>
            <p className="mt-3 font-serif text-2xl">All quiet in your little world.</p>
            <p className="mt-1 text-sm text-muted">New messages, letters and surprises will show up here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {unread > 0 && <Button variant="soft" size="sm" onClick={markAll}><CheckCheck className="h-4 w-4" /> Mark all as read</Button>}
            <ul className="divide-y divide-line/70">
              {rows.map((r) => {
                const I = ICONS[r.type]
                return (
                  <li key={r.id}>
                    <button onClick={() => openRow(r)} className="flex w-full items-start gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-blush/40">
                      <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', r.unread ? 'bg-wine text-white' : 'bg-blush text-wine')}><I className="h-4 w-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-sm', r.unread && 'font-medium')}>{r.title}</span>
                        {r.body && <span className="block text-xs text-muted">{r.body}</span>}
                        <span className="text-xs text-muted">{relativeTime(r.at)}</span>
                      </span>
                      {r.unread && <span className="mt-2 h-2 w-2 rounded-full bg-wine" aria-label="unread" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </Modal>
    </>
  )
}
