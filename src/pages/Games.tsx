import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, RefreshCw, Shuffle } from 'lucide-react'
import { useCollection, useWriters } from '@/data/hooks'
import { useCouple } from '@/context/CoupleContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Textarea } from '@/components/ui/Input'
import { friendlyError } from '@/lib/errors'
import { cn, pick } from '@/lib/utils'
import { DARES, FINISH_SENTENCE, GAMES, GUESS_PROMPTS, NEVER_HAVE_I_EVER, THIS_OR_THAT, TRIVIA, TRUTHS, WHO_KNOWS, WOULD_YOU_RATHER, type GameMeta } from '@/data/gameContent'
import type { GameState } from '@/types'

type Ctx = { state: GameState | undefined; me: string; partnerUid: string; meName: string; partnerName: string; patch: (p: Record<string, unknown>) => Promise<void>; next: (extra?: Record<string, unknown>) => Promise<void>; total: number }

export default function Games() {
  const [sel, setSel] = useState<GameMeta | null>(null)
  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {sel ? (
          <motion.div key={sel.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button onClick={() => setSel(null)} className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> All games</button>
            <GameRoom game={sel} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="eyebrow mb-2">Playful, never serious</p>
            <h1 className="text-5xl font-semibold sm:text-6xl">Couple Games</h1>
            <p className="mt-2 max-w-lg text-muted">Play together in real time, from the same sofa or opposite sides of the world. No scores to judge you — just fun.</p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {GAMES.map((g, i) => (
                <motion.button key={g.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }} onClick={() => setSel(g)}
                  className="card flex flex-col items-start p-6 text-left transition-shadow hover:shadow-lift">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blush text-3xl">{g.emoji}</span>
                  <h2 className="text-2xl font-semibold leading-tight">{g.title}</h2>
                  <p className="mt-1 text-sm text-muted">{g.blurb}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GameRoom({ game }: { game: GameMeta }) {
  const { items } = useCollection<GameState>('games')
  const { me, partner, coupleId } = useCouple()
  const { set, update } = useWriters()
  const toast = useToast()
  const docId = `${coupleId}_${game.id}`
  const state = items.find((g) => g.id === docId)
  const total = { wyr: WOULD_YOU_RATHER.length, tot: THIS_OR_THAT.length, who: WHO_KNOWS.length, trivia: TRIVIA.length, guess: GUESS_PROMPTS.length, nhie: NEVER_HAVE_I_EVER.length, finish: FINISH_SENTENCE.length, tod: 0 }[game.id] ?? 1

  const write = async (p: Record<string, unknown>) => {
    try { if (state) await update('games', docId, p); else await set('games', docId, { game: game.id, promptIdx: 0, picks: {}, matches: 0, rounds: 0, subject: me!.uid, ...p }) }
    catch (e) { toast.error(friendlyError(e)) }
  }
  const ctx: Ctx = {
    state, me: me!.uid, partnerUid: partner!.uid, meName: me!.name, partnerName: partner!.name, total, patch: write,
    next: async (extra = {}) => {
      let idx = Math.floor(Math.random() * total)
      if (total > 1 && state && idx === state.promptIdx) idx = (idx + 1) % total
      await write({ promptIdx: idx, picks: {}, answer: null, guess: null, verdict: null, subject: state ? (game.id === 'who' || game.id === 'guess' ? (state.subject === me!.uid ? partner!.uid : me!.uid) : me!.uid) : me!.uid, ...extra })
    },
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blush text-4xl">{game.emoji}</span>
        <div><h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{game.title}</h1><p className="text-muted">{game.blurb}</p></div>
      </div>
      {game.id === 'wyr' && <Duel ctx={ctx} items={WOULD_YOU_RATHER.map(([a, b]) => ({ q: 'Would you rather…', options: [a, b] }))} />}
      {game.id === 'tot' && <Duel ctx={ctx} items={THIS_OR_THAT.map(([a, b]) => ({ q: 'This or that?', options: [a, b] }))} compact />}
      {game.id === 'nhie' && <Duel ctx={ctx} items={NEVER_HAVE_I_EVER.map((q) => ({ q, options: ['I have 🙋', 'Never 😇'] }))} />}
      {game.id === 'trivia' && <Duel ctx={ctx} items={TRIVIA.map((t) => ({ q: t.q, options: t.options, answer: t.answer }))} />}
      {game.id === 'who' && <Subject ctx={ctx} mode="who" />}
      {game.id === 'guess' && <Subject ctx={ctx} mode="guess" />}
      {game.id === 'finish' && <Finish ctx={ctx} />}
      {game.id === 'tod' && <TruthOrDare />}
    </div>
  )
}

function Tally({ ctx, label }: { ctx: Ctx; label: string }) {
  if (!ctx.state || !ctx.state.rounds) return null
  return <p className="mt-6 text-center text-sm text-muted">{label.replace('{m}', String(ctx.state.matches)).replace('{r}', String(ctx.state.rounds))}</p>
}

function Duel({ ctx, items, compact, }: { ctx: Ctx; items: { q: string; options: string[]; answer?: number }[]; compact?: boolean }) {
  const { state, me, partnerUid } = ctx
  const idx = state?.promptIdx ?? 0
  const item = items[idx % items.length]
  const mine = state?.picks?.[me]
  const theirs = state?.picks?.[partnerUid]
  const both = mine !== undefined && theirs !== undefined
  const trivia = item.answer !== undefined

  const choose = async (opt: string) => {
    if (mine !== undefined) return
    const picks = { ...(state?.picks ?? {}), [me]: opt }
    const bothNow = picks[partnerUid] !== undefined
    const matched = bothNow && picks[partnerUid] === opt && !trivia
    await ctx.patch({ picks, ...(bothNow ? { rounds: (state?.rounds ?? 0) + 1, matches: (state?.matches ?? 0) + (matched ? 1 : 0) } : {}) })
  }

  const same = both && mine === theirs
  return (
    <div className="mx-auto max-w-2xl">
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="card p-6 text-center sm:p-10">
          <p className="eyebrow mb-3">{state ? `Question ${(state.rounds ?? 0) + (both ? 0 : 1)}` : 'Ready when you are'}</p>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{item.q}</h2>
          <div className={cn('mt-8 grid grid-cols-1 gap-3', compact || item.options.length > 2 ? 'sm:grid-cols-2' : '')}>
            {item.options.map((o, i) => {
              const iPicked = mine === o, theyPicked = theirs === o
              const correct = both && trivia && i === item.answer
              return (
                <motion.button key={o} whileTap={{ scale: 0.98 }} whileHover={{ scale: mine === undefined ? 1.02 : 1 }} disabled={mine !== undefined} onClick={() => choose(o)}
                  className={cn('relative rounded-3xl border-2 px-5 py-5 text-lg font-medium leading-snug transition-colors', iPicked ? 'border-wine bg-blush' : 'border-line bg-surface hover:border-rose', correct && 'border-green-600 bg-green-50 dark:bg-green-950/30')}>
                  {o}
                  {both && (iPicked || theyPicked) && (
                    <span className="mt-2 flex justify-center gap-1">
                      {iPicked && <span className="rounded-full bg-wine px-2 py-0.5 text-[11px] text-white">You</span>}
                      {theyPicked && <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] text-wine-deep">{ctx.partnerName}</span>}
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
          <div className="mt-6 min-h-[3.5rem]">
            {!both && mine !== undefined && <p className="animate-pulse text-sm text-muted">Waiting for {ctx.partnerName} to choose…</p>}
            {!both && mine === undefined && theirs !== undefined && <p className="text-sm text-wine">{ctx.partnerName} has chosen. Your turn!</p>}
            {both && (
              <motion.p initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-serif text-2xl text-wine">
                {trivia ? (mine === item.options[item.answer!] && theirs === item.options[item.answer!] ? 'You both know your stuff 🧠' : mine === item.options[item.answer!] ? 'You got it! 🎉' : theirs === item.options[item.answer!] ? `${ctx.partnerName} got it! 🎉` : 'Neither of you — we won’t tell 🙈') : same ? 'Same answer — you two are in sync ✨' : 'Different picks. Time to talk it out 😏'}
              </motion.p>
            )}
          </div>
          {both && <Button size="lg" onClick={() => ctx.next()}><Shuffle className="h-4 w-4" /> Next one</Button>}
        </motion.div>
      </AnimatePresence>
      {!trivia && <Tally ctx={ctx} label="You’ve matched on {m} of {r} so far ❤️" />}
      {trivia && <Tally ctx={ctx} label="{r} questions played together" />}
      {!state && <p className="mt-4 text-center text-xs text-muted">Both of you open this game to play at the same time.</p>}
      {state && !both && <div className="mt-4 text-center"><Button variant="ghost" size="sm" onClick={() => ctx.next()}><RefreshCw className="h-4 w-4" /> Skip this one</Button></div>}
    </div>
  )
}

/** Two-step games: the "subject" answers privately, the other guesses. */
function Subject({ ctx, mode }: { ctx: Ctx; mode: 'who' | 'guess' }) {
  const { state, me } = ctx
  const subject = (state?.subject as string | undefined) ?? me
  const iAmSubject = subject === me
  const idx = state?.promptIdx ?? 0
  const subjectName = iAmSubject ? 'you' : ctx.partnerName
  const q = mode === 'who' ? WHO_KNOWS[idx % WHO_KNOWS.length] : null
  const prompt = mode === 'guess' ? GUESS_PROMPTS[idx % GUESS_PROMPTS.length] : q!.q
  const answer = state?.answer as string | undefined | null
  const guess = state?.guess as string | undefined | null
  const verdict = state?.verdict as string | undefined | null
  const [text, setText] = useState('')

  const revealed = mode === 'who' ? !!answer && !!guess : !!answer && !!guess && !!verdict
  const hit = mode === 'who' ? answer === guess : verdict === 'yes'

  const submitAnswer = (a: string) => ctx.patch({ answer: a, subject })
  const submitGuess = (g: string) => ctx.patch({ guess: g, ...(mode === 'who' ? { rounds: (state?.rounds ?? 0) + 1, matches: (state?.matches ?? 0) + (g === answer ? 1 : 0) } : {}) })
  const judge = (v: string) => ctx.patch({ verdict: v, rounds: (state?.rounds ?? 0) + 1, matches: (state?.matches ?? 0) + (v === 'yes' ? 1 : 0) })

  let body: React.ReactNode
  if (!answer) {
    body = iAmSubject ? (
      <>
        <p className="mb-5 text-sm text-muted">Your answer stays hidden until {ctx.partnerName} has guessed.</p>
        {mode === 'who' ? <Options options={q!.options} onPick={submitAnswer} /> : (
          <div className="space-y-3"><Textarea aria-label="Your answer" value={text} onChange={(e) => setText(e.target.value)} maxLength={120} placeholder="Type your secret answer…" /><Button size="lg" className="w-full" disabled={!text.trim()} onClick={() => submitAnswer(text.trim())}>Lock it in 🔒</Button></div>
        )}
      </>
    ) : <Waiting text={`${ctx.partnerName} is choosing their answer…`} />
  } else if (!guess) {
    body = !iAmSubject ? (
      <>
        <p className="mb-5 text-sm text-muted">{ctx.partnerName} has answered. What do you think they said?</p>
        {mode === 'who' ? <Options options={q!.options} onPick={submitGuess} /> : (
          <div className="space-y-3"><Textarea aria-label="Your guess" value={text} onChange={(e) => setText(e.target.value)} maxLength={120} placeholder="Your best guess…" /><Button size="lg" className="w-full" disabled={!text.trim()} onClick={() => submitGuess(text.trim())}>Guess 🎯</Button></div>
        )}
      </>
    ) : <Waiting text={`Locked in. Waiting for ${ctx.partnerName} to guess…`} />
  } else if (mode === 'guess' && !verdict) {
    body = iAmSubject ? (
      <>
        <p className="text-sm text-muted">{ctx.partnerName} guessed:</p>
        <p className="my-3 font-serif text-3xl">“{guess}”</p>
        <p className="mb-4 text-sm text-muted">Your answer was “{answer}”. How close?</p>
        <div className="grid grid-cols-3 gap-2">{[['yes', 'Yes! 🎉'], ['close', 'So close 🤏'], ['no', 'Nope 😅']].map(([v, l]) => <Button key={v} variant="outline" onClick={() => judge(v)}>{l}</Button>)}</div>
      </>
    ) : <Waiting text={`${ctx.partnerName} is judging your guess…`} />
  } else {
    body = (
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-blush/60 p-4"><p className="eyebrow mb-1">{iAmSubject ? 'You said' : `${ctx.partnerName} said`}</p><p className="font-serif text-2xl">{answer}</p></div>
          <div className="rounded-3xl bg-blush/60 p-4"><p className="eyebrow mb-1">{iAmSubject ? `${ctx.partnerName} guessed` : 'You guessed'}</p><p className="font-serif text-2xl">{guess}</p></div>
        </div>
        <p className="mt-6 font-serif text-3xl text-wine">
          {hit ? (iAmSubject ? `${ctx.partnerName} knows you so well 🥹` : 'You know them so well 🥹') : mode === 'guess' && verdict === 'close' ? 'So close — almost mind-readers 🤏' : 'Not this time — plenty to learn about each other 😄'}
        </p>
        <Button size="lg" className="mt-6" onClick={() => ctx.next()}><Shuffle className="h-4 w-4" /> Next round (switch roles)</Button>
      </motion.div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6 text-center sm:p-10">
        <div className="mb-5 flex items-center justify-center gap-2 text-sm text-muted"><Avatar name={iAmSubject ? 'You' : ctx.partnerName} size="xs" /> This round is about <strong className="text-ink">{subjectName}</strong></div>
        <h2 className="mb-6 text-3xl font-semibold leading-tight sm:text-4xl">{mode === 'who' && !iAmSubject ? <><span className="mb-2 block text-base font-normal text-muted">How did {ctx.partnerName} answer…</span>{q!.q}</> : prompt}</h2>
        {body}
        {!revealed && state && <div className="mt-6"><Button variant="ghost" size="sm" onClick={() => ctx.next()}><RefreshCw className="h-4 w-4" /> Skip this question</Button></div>}
      </div>
      <Tally ctx={ctx} label="{m} nailed out of {r} rounds so far ❤️" />
    </div>
  )
}

const Waiting = ({ text }: { text: string }) => <p className="animate-pulse py-6 text-muted">{text}</p>
function Options({ options, onPick }: { options: string[]; onPick: (o: string) => void }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{options.map((o) => <motion.button key={o} whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }} onClick={() => onPick(o)} className="rounded-3xl border-2 border-line bg-surface px-4 py-4 text-left font-medium hover:border-rose">{o}</motion.button>)}</div>
}

function Finish({ ctx }: { ctx: Ctx }) {
  const { state, me, partnerUid } = ctx
  const idx = state?.promptIdx ?? 0
  const prompt = FINISH_SENTENCE[idx % FINISH_SENTENCE.length]
  const mine = state?.picks?.[me], theirs = state?.picks?.[partnerUid]
  const both = mine !== undefined && theirs !== undefined
  const [text, setText] = useState('')
  return (
    <div className="mx-auto max-w-2xl"><div className="card p-6 text-center sm:p-10">
      <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{prompt}</h2>
      <div className="mt-6">
        {mine === undefined ? (
          <div className="space-y-3 text-left"><Textarea aria-label="Your ending" value={text} onChange={(e) => setText(e.target.value)} maxLength={200} placeholder="Finish the sentence…" /><Button size="lg" className="w-full" disabled={!text.trim()} onClick={async () => { await ctx.patch({ picks: { ...(state?.picks ?? {}), [me]: text.trim() } }); setText('') }}>Lock it in 🔒</Button></div>
        ) : !both ? <Waiting text={`Waiting for ${ctx.partnerName}…`} /> : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 text-left">
            <div className="rounded-3xl bg-blush/60 p-4"><p className="eyebrow mb-1">You</p><p className="font-serif text-2xl">{mine}</p></div>
            <div className="rounded-3xl bg-blush/60 p-4"><p className="eyebrow mb-1">{ctx.partnerName}</p><p className="font-serif text-2xl">{theirs}</p></div>
            <div className="pt-2 text-center"><Button size="lg" onClick={() => ctx.next()}><Check className="h-4 w-4" /> Next sentence</Button></div>
          </motion.div>
        )}
      </div>
    </div></div>
  )
}

function TruthOrDare() {
  const [card, setCard] = useState<{ kind: 'truth' | 'dare'; text: string } | null>(null)
  const draw = (kind: 'truth' | 'dare') => setCard((c) => ({ kind, text: pick(kind === 'truth' ? TRUTHS : DARES, c?.kind === kind ? c.text : undefined) }))
  const seed = useMemo(() => Math.random(), [])
  return (
    <div className="mx-auto max-w-xl text-center" data-seed={seed}>
      <AnimatePresence mode="wait">
        <motion.div key={card?.text ?? 'empty'} initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -90, opacity: 0 }} transition={{ duration: 0.35 }}
          className={cn('flex min-h-[18rem] flex-col items-center justify-center rounded-[2rem] p-8 shadow-lift', card?.kind === 'dare' ? 'bg-gradient-to-br from-wine to-wine-deep text-white' : 'card')}>
          {card ? (<><p className={cn('eyebrow mb-4', card.kind === 'dare' && 'text-rose')}>{card.kind}</p><p className="font-serif text-3xl font-semibold leading-snug sm:text-4xl">{card.text}</p></>)
            : <p className="font-serif text-3xl text-muted">Truth… or dare? 😏</p>}
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Button size="lg" variant="outline" onClick={() => draw('truth')}>Truth</Button>
        <Button size="lg" onClick={() => draw('dare')}>Dare</Button>
      </div>
      <p className="mt-4 text-xs text-muted">Play out loud, together. Skip anything that doesn’t feel right.</p>
    </div>
  )
}
