import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, CornerUpLeft, ImagePlus, Mic, Pin, Search, SendHorizonal, Smile, Square, Star, Trash2, X } from 'lucide-react'
import { useCollection, useWriters } from '@/data/hooks'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState, Skeleton } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { moodById } from '@/lib/constants'
import { compressImage } from '@/lib/image'
import { fmtSeconds, useRecorder } from '@/lib/useRecorder'
import { friendlyError } from '@/lib/errors'
import { validateFile } from '@/lib/validation'
import { cn, formatDay, formatTime, toDayString } from '@/lib/utils'
import type { MoodDoc, Message } from '@/types'

const EMOJIS = ['😀', '😍', '🥰', '😘', '😊', '😂', '🥹', '😭', '😴', '😤', '🤗', '🫂', '💋', '❤️', '🧡', '💕', '💞', '💖', '✨', '🔥', '🌹', '🍓', '🍕', '☕', '🎶', '🌙', '☀️', '🎉', '🙈', '😏', '🤍', '👀', '🥺', '🫶', '👏', '🙏']
const REACTIONS = ['❤️', '😂', '😍', '🥹', '👍', '🔥']
const GESTURES = [
  { label: 'Send a hug 🫂', text: 'sent you a hug 🫂' },
  { label: 'Send a kiss 💋', text: 'sent you a kiss 💋' },
  { label: "I'm thinking of you ❤️", text: 'is thinking of you ❤️' },
]

export default function Chat() {
  const { items, loading } = useCollection<Message>('messages')
  const { items: moods } = useCollection<MoodDoc>('moods')
  const { me, partner, coupleId } = useCouple()
  const { add, update, remove, upload, notifyPartner, uid } = useWriters()
  const toast = useToast()
  const recorder = useRecorder()

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<Message | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const [favOnly, setFavOnly] = useState(false)
  const [deleting, setDeleting] = useState<Message | null>(null)
  const [sending, setSending] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  const listRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const sorted = useMemo(() => [...items].sort((a, b) => a.createdAt - b.createdAt), [items])
  const byId = useMemo(() => new Map(sorted.map((m) => [m.id, m])), [sorted])
  const visible = useMemo(() => {
    const s = q.trim().toLowerCase()
    return sorted.filter((m) => (!favOnly || m.favoritedBy?.includes(uid)) && (!s || (m.text ?? '').toLowerCase().includes(s)))
  }, [sorted, q, favOnly, uid])
  const pinned = useMemo(() => [...sorted].reverse().find((m) => m.pinned), [sorted])
  const partnerMood = moodById(moods.find((m) => m.uid === partner?.uid)?.mood)

  const scrollBottom = (smooth = true) => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  useEffect(() => { if (atBottom) scrollBottom(false) }, [sorted.length]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!loading) scrollBottom(false) }, [loading])

  const maybeNotify = (preview: string) => {
    const lastMine = [...sorted].reverse().find((m) => m.authorId === uid)
    if (!lastMine || Date.now() - lastMine.createdAt > 5 * 60_000) notifyPartner('message', `${me?.name}: ${preview.slice(0, 60)}`, '/chat')
  }

  const send = async (payload: Partial<Message>, preview: string) => {
    setSending(true)
    try {
      await add('messages', { ...payload, replyTo: replyTo?.id })
      maybeNotify(preview); setReplyTo(null)
    } catch (e) { toast.error(friendlyError(e, "That message didn't send. Please try again.")); throw e } finally { setSending(false) }
  }

  const sendText = async () => {
    const t = text.trim()
    if (!t || sending) return
    setText(''); setEmojiOpen(false)
    try { await send({ kind: 'text', text: t.slice(0, 2000) }, t) } catch { setText(t) }
    inputRef.current?.focus()
    setTimeout(() => scrollBottom(), 50)
  }

  const sendImage = async (file: File) => {
    const err = validateFile(file, 'image'); if (err) return toast.error(err)
    setSending(true)
    try {
      const blob = await compressImage(file, 1600)
      const url = await upload(`couples/${coupleId}/chat/${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`, blob)
      await add('messages', { kind: 'image', mediaURL: url, replyTo: replyTo?.id }); setReplyTo(null); maybeNotify('📷 Photo')
    } catch (e) { toast.error(friendlyError(e, "That photo didn't upload. Please try again.")) } finally { setSending(false) }
  }

  const toggleRec = async () => {
    if (recorder.recording) {
      const blob = await recorder.stop(); if (!blob) return
      setSending(true)
      try {
        const url = await upload(`couples/${coupleId}/chat/voice_${Date.now()}.webm`, blob)
        await add('messages', { kind: 'voice', mediaURL: url }); maybeNotify('🎙️ Voice message')
      } catch (e) { toast.error(friendlyError(e, "That voice message didn't send.")) } finally { setSending(false) }
      return
    }
    try { await recorder.start() } catch { toast.error('We need microphone access to record. Allow it in your browser settings and try again.') }
  }

  const react = (m: Message, emoji: string) => {
    const r = { ...(m.reactions ?? {}) }
    if (r[uid] === emoji) delete r[uid]; else r[uid] = emoji
    update('messages', m.id, { reactions: r }).catch((e) => toast.error(friendlyError(e)))
    setActive(null)
  }
  const togglePin = (m: Message) => { update('messages', m.id, { pinned: !m.pinned }).catch((e) => toast.error(friendlyError(e))); setActive(null) }
  const toggleFav = (m: Message) => {
    const f = new Set(m.favoritedBy ?? []); if (f.has(uid)) f.delete(uid); else f.add(uid)
    update('messages', m.id, { favoritedBy: [...f] }).catch((e) => toast.error(friendlyError(e))); setActive(null)
  }
  const del = async () => {
    if (!deleting) return
    try { await remove('messages', deleting.id); setDeleting(null) } catch (e) { toast.error(friendlyError(e)) }
  }
  const jumpTo = (id: string) => { document.getElementById(`msg-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }

  // Group by day
  let lastDay = ''

  return (
    <div className="flex h-[calc(100dvh-4.5rem-env(safe-area-inset-bottom))] flex-col overflow-hidden bg-paper md:h-[calc(100dvh-6.5rem)] md:rounded-4xl md:border md:border-line md:bg-surface md:shadow-soft">
      <header className="flex items-center gap-3 border-b border-line/70 bg-surface/90 px-4 py-3 backdrop-blur" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.75rem)' }}>
        <Avatar src={partner?.photoURL} name={partner?.name} size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-serif text-xl font-semibold">{partner?.name}</p>
          <p className="truncate text-xs text-muted">{partnerMood ? `Feeling ${partnerMood.label.toLowerCase()} ${partnerMood.emoji}` : 'Your private chat'}</p>
        </div>
        <Button variant={favOnly ? 'soft' : 'ghost'} size="icon" onClick={() => setFavOnly(!favOnly)} aria-label="Favorites" aria-pressed={favOnly}><Star className={cn('h-5 w-5', favOnly && 'fill-current')} /></Button>
        <Button variant={searchOpen ? 'soft' : 'ghost'} size="icon" onClick={() => { setSearchOpen(!searchOpen); setQ('') }} aria-label="Search messages"><Search className="h-5 w-5" /></Button>
      </header>

      <AnimatePresence initial={false}>
        {searchOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-b border-line/70 bg-surface">
            <div className="p-3"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search messages…" aria-label="Search messages" className="h-10 w-full rounded-full border border-line bg-paper px-4 text-sm focus:border-rose focus:outline-none" /></div>
          </motion.div>
        )}
      </AnimatePresence>

      {pinned && !q && (
        <button onClick={() => jumpTo(pinned.id)} className="flex items-center gap-2 border-b border-line/70 bg-blush/50 px-4 py-2 text-left text-sm">
          <Pin className="h-4 w-4 shrink-0 text-wine" /><span className="truncate"><span className="text-muted">Pinned · </span>{pinned.text ?? 'Photo'}</span>
        </button>
      )}

      <div ref={listRef} onScroll={(e) => { const el = e.currentTarget; setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 120) }}
        className="relative flex-1 space-y-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgb(var(--c-blush)/0.35),transparent_60%)] px-3 py-4 sm:px-6" onClick={() => setActive(null)}>
        {loading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className={cn('h-12 w-2/3', i % 2 && 'ml-auto')} />)}</div>
          : visible.length === 0 ? <EmptyState emoji="💬" title={q || favOnly ? 'Nothing found.' : `Say hi to ${partner?.name}.`} body={q || favOnly ? 'Try a different search.' : 'Your first message is just a tap away.'} className="mt-10 border-0 bg-transparent" />
          : visible.map((m) => {
            const mine = m.authorId === uid
            const day = toDayString(new Date(m.createdAt))
            const showDay = day !== lastDay; lastDay = day
            const rep = m.replyTo ? byId.get(m.replyTo) : undefined
            const reactions = Object.values(m.reactions ?? {})
            const isActive = active === m.id
            if (m.kind === 'gesture') return (
              <div key={m.id} id={`msg-${m.id}`}>
                {showDay && <DayLabel day={day} />}
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="my-2 flex justify-center">
                  <span className="rounded-full bg-blush px-4 py-1.5 text-xs text-wine">{mine ? 'You' : partner?.name} {m.text} · {formatTime(m.createdAt)}</span>
                </motion.div>
              </div>
            )
            return (
              <div key={m.id} id={`msg-${m.id}`}>
                {showDay && <DayLabel day={day} />}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('group relative flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className={cn('flex max-w-[82%] flex-col sm:max-w-[68%]', mine ? 'items-end' : 'items-start')}>
                    <button onClick={(e) => { e.stopPropagation(); setActive(isActive ? null : m.id) }} onDoubleClick={() => react(m, '❤️')}
                      className={cn('relative min-w-0 rounded-3xl px-4 py-2.5 text-left text-[15px] leading-snug shadow-soft', mine ? 'rounded-br-lg bg-wine text-white' : 'rounded-bl-lg border border-line bg-surface text-ink', m.kind === 'image' && 'p-1.5', m.pinned && 'ring-2 ring-rose')}>
                      {rep && (
                        <span onClick={(e) => { e.stopPropagation(); jumpTo(rep.id) }} className={cn('mb-1.5 block rounded-xl border-l-2 px-2.5 py-1 text-xs', mine ? 'border-rose bg-white/15' : 'border-wine bg-blush/50')}>
                          <strong>{rep.authorId === uid ? 'You' : partner?.name}</strong><br />{rep.kind === 'image' ? '📷 Photo' : rep.kind === 'voice' ? '🎙️ Voice message' : rep.text}
                        </span>
                      )}
                      {m.replyTo && !rep && <span className="mb-1 block text-xs italic opacity-70">Message deleted</span>}
                      {m.kind === 'image' && m.mediaURL && <img src={m.mediaURL} alt="Shared" loading="lazy" className="max-h-80 rounded-2xl object-cover" />}
                      {m.kind === 'voice' && m.mediaURL && <audio src={m.mediaURL} controls preload="none" className="h-9 w-56 max-w-full" />}
                      {m.kind === 'text' && <span className="whitespace-pre-wrap break-words">{m.text}</span>}
                    </button>
                    <div className={cn('mt-0.5 flex items-center gap-1.5 px-1.5 text-[10px] text-muted', mine && 'flex-row-reverse')}>
                      <span>{formatTime(m.createdAt)}</span>
                      {m.pinned && <Pin className="h-3 w-3 text-wine" />}
                      {m.favoritedBy?.includes(uid) && <Star className="h-3 w-3 fill-gold text-gold" />}
                      {reactions.length > 0 && <span className="rounded-full bg-surface px-1.5 py-0.5 text-xs shadow-soft">{reactions.join('')}</span>}
                    </div>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div initial={{ opacity: 0, scale: 0.92, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }} onClick={(e) => e.stopPropagation()}
                          className="glass z-10 mt-1 flex flex-col gap-1 rounded-3xl p-1.5 shadow-lift">
                          <div className="flex justify-center gap-0.5">{REACTIONS.map((r) => <button key={r} onClick={() => react(m, r)} className={cn('rounded-full px-1.5 py-1 text-xl hover:bg-blush', m.reactions?.[uid] === r && 'bg-blush')} aria-label={`React ${r}`}>{r}</button>)}</div>
                          <div className="flex justify-center gap-0.5">
                            <ActionBtn label="Reply" onClick={() => { setReplyTo(m); setActive(null); inputRef.current?.focus() }}><CornerUpLeft className="h-4 w-4" /></ActionBtn>
                            <ActionBtn label={m.pinned ? 'Unpin' : 'Pin'} onClick={() => togglePin(m)}><Pin className="h-4 w-4" /></ActionBtn>
                            <ActionBtn label="Favorite" onClick={() => toggleFav(m)}><Star className={cn('h-4 w-4', m.favoritedBy?.includes(uid) && 'fill-current')} /></ActionBtn>
                            {mine && <ActionBtn label="Delete" onClick={() => { setDeleting(m); setActive(null) }}><Trash2 className="h-4 w-4" /></ActionBtn>}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            )
          })}
        <AnimatePresence>
          {!atBottom && (
            <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={() => scrollBottom()} aria-label="Scroll to latest"
              className="sticky bottom-2 left-full ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface shadow-lift"><ArrowDown className="h-4 w-4" /></motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Composer */}
      <div className="border-t border-line/70 bg-surface/95 px-3 pb-3 pt-2 backdrop-blur sm:px-5">
        <AnimatePresence>
          {replyTo && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mb-2 flex items-center gap-2 rounded-2xl border-l-2 border-wine bg-blush/50 px-3 py-1.5 text-xs">
                <span className="min-w-0 flex-1 truncate"><strong>Replying to {replyTo.authorId === uid ? 'yourself' : partner?.name}</strong> · {replyTo.text ?? 'media'}</span>
                <button onClick={() => setReplyTo(null)} aria-label="Cancel reply"><X className="h-4 w-4" /></button>
              </div>
            </motion.div>
          )}
          {emojiOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mb-2 grid grid-cols-9 gap-0.5 rounded-2xl bg-blush/40 p-2 sm:grid-cols-12">
                {EMOJIS.map((e) => <button key={e} className="rounded-lg py-1 text-xl hover:bg-surface" onClick={() => { setText((t) => t + e); inputRef.current?.focus() }}>{e}</button>)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="scroll-hide mb-2 flex gap-1.5 overflow-x-auto">
          {GESTURES.map((g) => (
            <button key={g.label} onClick={() => send({ kind: 'gesture', text: g.text }, g.text).catch(() => undefined)} className="shrink-0 rounded-full border border-rose/60 bg-blush/40 px-3 py-1 text-xs text-wine transition-colors hover:bg-blush">{g.label}</button>
          ))}
        </div>
        {recorder.recording ? (
          <div className="flex items-center gap-3 rounded-full bg-blush/60 px-4 py-2">
            <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="h-3 w-3 rounded-full bg-red-600" />
            <span className="flex-1 text-sm">Recording… {fmtSeconds(recorder.seconds)}</span>
            <Button variant="ghost" size="sm" onClick={recorder.cancel}>Cancel</Button>
            <Button size="icon" onClick={toggleRec} aria-label="Send voice message"><Square className="h-4 w-4 fill-current" /></Button>
          </div>
        ) : (
          <div className="flex items-end gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setEmojiOpen(!emojiOpen)} aria-label="Emoji" aria-pressed={emojiOpen}><Smile className="h-5 w-5" /></Button>
            <Button variant="ghost" size="icon" onClick={() => fileRef.current?.click()} aria-label="Send a photo" disabled={sending}><ImagePlus className="h-5 w-5" /></Button>
            <textarea ref={inputRef} value={text} rows={1} maxLength={2000} placeholder={`Message ${partner?.name ?? ''}…`} aria-label="Message"
              onChange={(e) => { setText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(min-width: 768px)').matches) { e.preventDefault(); sendText() } }}
              className="max-h-[120px] min-h-[44px] flex-1 resize-none rounded-3xl border border-line bg-paper px-4 py-2.5 text-[15px] leading-snug focus:border-rose focus:outline-none" />
            {text.trim() ? (
              <Button size="icon" onClick={sendText} disabled={sending} aria-label="Send" className="h-11 w-11"><SendHorizonal className="h-5 w-5" /></Button>
            ) : (
              <Button variant="soft" size="icon" onClick={toggleRec} aria-label="Record voice message" className="h-11 w-11"><Mic className="h-5 w-5" /></Button>
            )}
          </div>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) sendImage(f) }} />
      </div>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={del} title="Delete this message?" body="It will be removed for both of you." confirmLabel="Delete" />
    </div>
  )
}

function DayLabel({ day }: { day: string }) {
  const t = toDayString(new Date()), y = toDayString(new Date(Date.now() - 86_400_000))
  return <p className="my-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted">{day === t ? 'Today' : day === y ? 'Yesterday' : formatDay(day, { weekday: 'short', day: 'numeric', month: 'short' })}</p>
}
function ActionBtn({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} className="flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs hover:bg-blush" aria-label={label}>{children}<span className="hidden sm:inline">{label}</span></button>
}
