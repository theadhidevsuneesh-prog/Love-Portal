import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link2, Link2Off, Minus, Plus, Send, Shuffle, Trash2, X } from 'lucide-react'
import { BouquetArt, FlowerIcon } from '@/components/bouquet/BouquetArt'
import { DEFAULT_BOUQUET, FLOWERS, FLOWER_COLORS, GREENERY, MAX_FLOWERS, MAX_STEMS, RIBBON_COLORS, WRAPS, WRAP_COLORS, describeBouquet, totalFlowers } from '@/data/bouquet'
import { useCollection, useWriters } from '@/data/hooks'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Chip, EmptyState, Segmented } from '@/components/ui/Feedback'
import { HeartBurst } from '@/components/ui/Motion'
import { useShareLink } from '@/lib/useShare'
import { friendlyError } from '@/lib/errors'
import { cn, relativeTime } from '@/lib/utils'
import type { Bouquet, BouquetSpec, FlowerType } from '@/types'

const hashSeed = (s: string) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h }

function Swatches({ colors, value, onChange, label }: { colors: string[]; value: string; onChange: (c: string) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {colors.map((c) => (
        <button key={c} type="button" role="radio" aria-checked={value === c} aria-label={c} onClick={() => onChange(c)}
          className={cn('h-7 w-7 rounded-full border-2 transition-transform hover:scale-110', value === c ? 'border-wine ring-2 ring-wine/30' : 'border-line')} style={{ background: c }} />
      ))}
    </div>
  )
}

export default function Bouquets() {
  const [tab, setTab] = useState<'design' | 'received' | 'sent'>('design')
  const { items } = useCollection<Bouquet>('bouquets')
  const { partner } = useCouple()
  const { uid } = useWriters()
  const received = useMemo(() => items.filter((b) => b.toUid === uid).sort((a, b) => b.createdAt - a.createdAt), [items, uid])
  const sent = useMemo(() => items.filter((b) => b.authorId === uid).sort((a, b) => b.createdAt - a.createdAt), [items, uid])
  const unopened = received.filter((b) => !b.openedAt).length
  const [viewing, setViewing] = useState<Bouquet | null>(null)

  return (
    <div className="space-y-6">
      <div><p className="eyebrow mb-2">Say it with flowers</p><h1 className="text-5xl font-semibold sm:text-6xl">Bouquets</h1>
        <p className="mt-2 max-w-xl text-muted">Design a bouquet flower by flower, add a card, and send it to {partner?.name}. They can open it — and share it — from anywhere.</p></div>
      <Segmented value={tab} onChange={setTab} options={[
        { value: 'design', label: 'Design one 💐' }, { value: 'received', label: <>Received{unopened > 0 && <span className="rounded-full bg-wine px-1.5 text-[10px] text-white">{unopened}</span>}</> }, { value: 'sent', label: 'Sent' },
      ]} />

      {tab === 'design' && <Designer onSent={() => setTab('sent')} />}
      {tab !== 'design' && (
        (tab === 'received' ? received : sent).length === 0 ? (
          <EmptyState emoji="💐" title={tab === 'received' ? 'No flowers yet.' : 'You haven’t sent any flowers.'} body={tab === 'received' ? `Maybe ${partner?.name} is picking the perfect ones right now.` : 'A bouquet takes a minute to design and lasts a lot longer in memory.'}
            action={tab === 'sent' ? <Button onClick={() => setTab('design')}>Design a bouquet</Button> : undefined} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(tab === 'received' ? received : sent).map((b) => (
              <motion.button key={b.id} whileHover={{ y: -5 }} onClick={() => setViewing(b)} className={cn('card relative overflow-hidden p-4 text-left transition-shadow hover:shadow-lift', tab === 'received' && !b.openedAt && 'ring-2 ring-rose')}>
                <BouquetArt spec={b.spec} seed={hashSeed(b.id)} className="mx-auto h-56 w-auto" />
                <p className="mt-2 font-serif text-2xl font-semibold leading-tight">{b.title}</p>
                <p className="text-xs text-muted">{describeBouquet(b.spec)} · {relativeTime(b.createdAt)}</p>
                {tab === 'received' && !b.openedAt && <span className="mt-2 block text-[11px] font-semibold uppercase tracking-widest text-wine">New · tap to open</span>}
                {tab === 'sent' && <span className="mt-2 block text-[11px] text-muted">{b.openedAt ? 'Opened ✓' : 'Not opened yet'}</span>}
              </motion.button>
            ))}
          </div>
        )
      )}
      <Viewer bouquet={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

function Designer({ onSent }: { onSent: () => void }) {
  const [spec, setSpec] = useState<BouquetSpec>(DEFAULT_BOUQUET)
  const [seed, setSeed] = useState(11)
  const [title, setTitle] = useState('Flowers for you')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const { partner, me } = useCouple()
  const { add, notifyPartner } = useWriters()
  const toast = useToast()
  const total = totalFlowers(spec)

  const setStem = (i: number, patch: Partial<BouquetSpec['stems'][number]>) => setSpec((s) => ({ ...s, stems: s.stems.map((x, k) => (k === i ? { ...x, ...patch } : x)) }))
  const setCount = (i: number, delta: number) => setSpec((s) => {
    const cur = s.stems[i].count
    const next = Math.max(1, Math.min(cur + delta, cur + (MAX_FLOWERS - s.stems.reduce((n, x) => n + x.count, 0))))
    return { ...s, stems: s.stems.map((x, k) => (k === i ? { ...x, count: next } : x)) }
  })
  const addStem = () => setSpec((s) => {
    const used = new Set(s.stems.map((x) => x.type))
    const f = FLOWERS.find((x) => !used.has(x.type)) ?? FLOWERS[0]
    return { ...s, stems: [...s.stems, { type: f.type, color: f.color, count: 1 }] }
  })
  const removeStem = (i: number) => setSpec((s) => ({ ...s, stems: s.stems.filter((_, k) => k !== i) }))

  const send = async () => {
    if (!partner) return
    if (!total) return toast.error('Add at least one flower.')
    setBusy(true)
    try {
      await add('bouquets', { toUid: partner.uid, title: title.trim().slice(0, 80) || 'Flowers for you', message: message.trim().slice(0, 600) || undefined, spec })
      notifyPartner('surprise', `${me?.name} sent you a bouquet 💐`, '/bouquets', message.trim().slice(0, 80) || undefined)
      toast.show(`Bouquet on its way to ${partner.name} 💐`, 'love')
      setMessage(''); onSent()
    } catch (e) { toast.error(friendlyError(e, "That didn't send. Please try again.")) } finally { setBusy(false) }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-8 lg:self-start">
        <div className="card relative overflow-hidden bg-gradient-to-b from-blush/50 to-surface p-4">
          <BouquetArt spec={spec} seed={seed} className="mx-auto h-[24rem] w-auto max-w-full sm:h-[28rem]" />
          <div className="mt-1 flex items-center justify-between text-xs text-muted">
            <span>{total} flower{total === 1 ? '' : 's'} · {describeBouquet(spec) || 'empty'}</span>
            <button onClick={() => setSeed((s) => s + 1)} className="inline-flex items-center gap-1 text-wine hover:underline"><Shuffle className="h-3.5 w-3.5" /> Rearrange</button>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <section className="card space-y-4 p-5">
          <div className="flex items-end justify-between"><h2 className="text-2xl font-semibold">Flowers</h2><span className={cn('text-xs', total >= MAX_FLOWERS ? 'text-wine' : 'text-muted')}>{total} / {MAX_FLOWERS}</span></div>
          {spec.stems.map((st, i) => (
            <div key={i} className="space-y-3 rounded-2xl bg-blush/30 p-3">
              <div className="scroll-hide -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {FLOWERS.map((f) => (
                  <button key={f.type} type="button" aria-pressed={st.type === f.type} onClick={() => setStem(i, { type: f.type as FlowerType, color: st.type === f.type ? st.color : f.color })} title={f.name}
                    className={cn('flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-2xl border-2 p-1.5 text-[10px] transition-colors', st.type === f.type ? 'border-wine bg-surface' : 'border-transparent hover:bg-surface/70')}>
                    <FlowerIcon type={f.type} color={st.type === f.type ? st.color : f.color} size={38} />{f.name.split(' ')[0]}
                  </button>
                ))}
              </div>
              <Swatches label="Flower colour" colors={FLOWER_COLORS} value={st.color} onChange={(c) => setStem(i, { color: c })} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-full border border-line bg-surface p-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Remove one" onClick={() => setCount(i, -1)} disabled={st.count <= 1}><Minus className="h-4 w-4" /></Button>
                  <span className="w-8 text-center font-serif text-xl font-semibold" aria-live="polite">{st.count}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Add one" onClick={() => setCount(i, 1)} disabled={total >= MAX_FLOWERS}><Plus className="h-4 w-4" /></Button>
                </div>
                {spec.stems.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeStem(i)}><Trash2 className="h-4 w-4" /> Remove</Button>}
              </div>
            </div>
          ))}
          {spec.stems.length < MAX_STEMS && <Button variant="soft" size="sm" onClick={addStem} disabled={total >= MAX_FLOWERS}><Plus className="h-4 w-4" /> Add another kind of flower</Button>}
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-2xl font-semibold">Greenery &amp; wrap</h2>
          <div><p className="mb-1.5 text-sm font-medium">Greenery</p><div className="flex flex-wrap gap-2">{GREENERY.map((g) => <Chip key={g.id} active={spec.greenery === g.id} onClick={() => setSpec({ ...spec, greenery: g.id })}>{g.name}</Chip>)}</div></div>
          <div><p className="mb-1.5 text-sm font-medium">Wrapping</p><div className="flex flex-wrap gap-2">{WRAPS.map((w) => <Chip key={w.id} active={spec.wrap === w.id} onClick={() => setSpec({ ...spec, wrap: w.id })}>{w.name}</Chip>)}</div></div>
          {spec.wrap !== 'none' && <div><p className="mb-1.5 text-sm font-medium">Wrap colour</p><Swatches label="Wrap colour" colors={WRAP_COLORS} value={spec.wrapColor} onChange={(c) => setSpec({ ...spec, wrapColor: c })} /></div>}
          <div><p className="mb-1.5 text-sm font-medium">Ribbon</p><Swatches label="Ribbon colour" colors={RIBBON_COLORS} value={spec.ribbon} onChange={(c) => setSpec({ ...spec, ribbon: c })} /></div>
        </section>

        <section className="card space-y-4 p-5">
          <h2 className="text-2xl font-semibold">The card</h2>
          <Input label="Title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
          <Textarea label="Message" optional value={message} maxLength={600} onChange={(e) => setMessage(e.target.value)} placeholder={`A few words for ${partner?.name}…`} className="min-h-[100px]" />
          <Button size="lg" className="w-full" onClick={send} loading={busy} disabled={!total}><Send className="h-4 w-4" /> Send to {partner?.name} 💐</Button>
        </section>
      </div>
    </div>
  )
}

function Viewer({ bouquet, onClose }: { bouquet: Bouquet | null; onClose: () => void }) {
  const { partner, me } = useCouple()
  const { update, uid } = useWriters()
  const { find, share, revoke } = useShareLink()
  const fromName = bouquet?.authorId === uid ? me?.name : partner?.name
  const [opened, setOpened] = useState(false)
  const shared = bouquet ? find(bouquet.id) : undefined

  const open = () => {
    setOpened(true)
    if (bouquet && bouquet.toUid === uid && !bouquet.openedAt) update('bouquets', bouquet.id, { openedAt: Date.now() }).catch(() => undefined)
  }
  const close = () => { setOpened(false); onClose() }
  const mine = bouquet?.authorId === uid
  const show = opened || mine || !!bouquet?.openedAt

  return (
    <AnimatePresence>
      {bouquet && (
        <motion.div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-wine-deep/70 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div onClick={(e) => e.stopPropagation()} initial={{ y: 40, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} className="relative my-auto w-full max-w-md rounded-[2rem] bg-surface p-6 text-center shadow-lift">
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 z-10" onClick={close} aria-label="Close"><X className="h-5 w-5" /></Button>
            {!show ? (
              <div className="py-8">
                <p className="eyebrow">A bouquet from {fromName}</p>
                <button onClick={open} className="my-6 text-[8rem] leading-none active:scale-95" aria-label="Unwrap the bouquet"><motion.span animate={{ rotate: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-block">💐</motion.span></button>
                <p className="font-serif text-3xl">{bouquet.title}</p><p className="mt-2 text-xs uppercase tracking-[0.25em] text-wine">Tap to unwrap</p>
              </div>
            ) : (
              <>
                <HeartBurst show />
                <p className="eyebrow">From {fromName}</p>
                <h2 className="text-4xl font-semibold leading-tight">{bouquet.title}</h2>
                <BouquetArt spec={bouquet.spec} seed={hashSeed(bouquet.id)} animate className="mx-auto mt-2 h-80 w-auto max-w-full" />
                <p className="text-xs text-muted">{describeBouquet(bouquet.spec)}</p>
                {bouquet.message && <div className="mx-auto mt-4 max-w-sm rounded-2xl border border-rose/60 bg-[#fffaf2] p-4 text-left dark:bg-blush/20"><p className="whitespace-pre-wrap font-serif text-xl leading-snug">{bouquet.message}</p><p className="mt-2 text-right font-script text-2xl text-wine">— {fromName}</p></div>}
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  <Button onClick={() => share({ kind: 'bouquet', sourceId: bouquet.id, title: bouquet.title, message: bouquet.message, spec: bouquet.spec })}><Link2 className="h-4 w-4" /> {shared ? 'Share link' : 'Create share link'}</Button>
                  {shared && <Button variant="outline" onClick={() => revoke(bouquet.id)}><Link2Off className="h-4 w-4" /> Turn link off</Button>}
                </div>
                <p className="mt-2 text-[11px] text-muted">Anyone with the link can view this bouquet until you turn it off.</p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
