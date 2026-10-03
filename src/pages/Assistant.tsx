import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, RefreshCw, SendHorizonal, Sparkles } from 'lucide-react'
import { useCouple } from '@/context/CoupleContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { ACTIONS, askAssistant, sampleReply, type ChatTurn } from '@/lib/assistant'
import { copyText, daysSince } from '@/lib/utils'

interface Msg extends ChatTurn { id: number; sample?: boolean }
let seq = 0

export default function Assistant() {
  const { me, partner, couple } = useCouple()
  const { isDemo } = useAuth()
  const toast = useToast()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const ctx = { you: me?.name ?? 'Me', partner: partner?.name ?? 'my partner', days: daysSince(couple?.relationshipStart) ?? undefined }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs, busy])

  const send = async (text: string, history = msgs) => {
    const t = text.trim(); if (!t || busy) return
    const next: Msg[] = [...history, { id: ++seq, role: 'user', content: t }]
    setMsgs(next); setInput(''); setBusy(true)
    try {
      if (isDemo) throw new Error('demo')
      const reply = await askAssistant(next.map(({ role, content }) => ({ role, content })), ctx)
      setMsgs((m) => [...m, { id: ++seq, role: 'assistant', content: reply }])
    } catch (e) {
      const friendly = (e as { friendly?: string }).friendly
      if (friendly && /try again in a few minutes|log in|verify/i.test(friendly)) toast.error(friendly)
      await new Promise((r) => setTimeout(r, 600))
      setMsgs((m) => [...m, { id: ++seq, role: 'assistant', content: sampleReply(t, ctx), sample: true }])
    } finally { setBusy(false) }
  }

  const regenerate = () => {
    const lastUser = [...msgs].reverse().find((m) => m.role === 'user'); if (!lastUser) return
    const idx = msgs.findIndex((m) => m.id === lastUser.id)
    send(lastUser.content, msgs.slice(0, idx))
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-9rem)] max-w-3xl flex-col md:h-[calc(100dvh-7rem)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-wine text-blush shadow-soft"><Sparkles className="h-5 w-5" /></span>
        <div><h1 className="text-4xl font-semibold leading-none">Love Assistant</h1><p className="mt-1 text-xs text-muted">Here to help you find the words — never to speak as {partner?.name}.</p></div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto rounded-[2rem] border border-line bg-surface/60 p-4 sm:p-6">
        {msgs.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="mb-4 text-5xl" aria-hidden>✨</motion.div>
            <h2 className="text-3xl font-semibold sm:text-4xl">How can I help you love {partner?.name} today?</h2>
            <div className="mt-6 flex max-w-xl flex-wrap justify-center gap-2">
              {ACTIONS.map((a) => <button key={a.id} onClick={() => send(a.prompt)} className="rounded-full border border-rose/60 bg-surface px-3.5 py-2 text-sm transition-colors hover:bg-blush">{a.emoji} {a.label}</button>)}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {msgs.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={m.role === 'user' ? 'flex justify-end' : 'flex gap-3'}>
              {m.role === 'assistant' && <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-wine text-blush"><Sparkles className="h-4 w-4" /></span>}
              <div className={m.role === 'user' ? 'max-w-[85%] rounded-3xl rounded-br-lg bg-wine px-4 py-2.5 text-white' : 'max-w-[90%]'}>
                {m.role === 'user' ? m.content : (
                  <>
                    <div className="whitespace-pre-wrap rounded-3xl rounded-tl-lg border border-line bg-surface px-5 py-4 leading-relaxed [&_strong]:font-semibold" dangerouslySetInnerHTML={{ __html: m.content.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
                    <div className="mt-1.5 flex items-center gap-1 px-1">
                      <Button variant="ghost" size="sm" onClick={async () => { await copyText(m.content); setCopied(m.id); setTimeout(() => setCopied(null), 1600) }}>{copied === m.id ? <><Check className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}</Button>
                      {i === msgs.length - 1 && <Button variant="ghost" size="sm" onClick={regenerate}><RefreshCw className="h-3.5 w-3.5" />Another</Button>}
                      {m.sample && <span className="ml-auto text-[10px] text-muted">Sample reply · {isDemo ? 'demo mode' : 'AI not connected'}</span>}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && <div className="flex gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-wine text-blush"><Sparkles className="h-4 w-4" /></span><div className="flex items-center gap-1 rounded-3xl border border-line bg-surface px-5 py-4" aria-label="Thinking">{[0, 1, 2].map((d) => <motion.span key={d} className="h-2 w-2 rounded-full bg-rose" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: d * 0.15 }} />)}</div></div>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="mt-3 flex items-end gap-2">
        <textarea value={input} rows={1} maxLength={800} aria-label="Ask the Love Assistant" placeholder="Ask for a letter, a poem, a plan…" onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
          className="max-h-32 min-h-[48px] flex-1 resize-none rounded-3xl border border-line bg-surface px-5 py-3 focus:border-rose focus:shadow-glow focus:outline-none" />
        <Button type="submit" size="icon" className="h-12 w-12" disabled={!input.trim() || busy} aria-label="Send"><SendHorizonal className="h-5 w-5" /></Button>
      </form>
    </div>
  )
}
