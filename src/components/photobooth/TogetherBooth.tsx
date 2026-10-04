import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, CameraOff, Check, Hourglass, ImagePlus, Users, X } from 'lucide-react'
import { useCamera } from './useCamera'
import { useCouple } from '@/context/CoupleContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useCollection, useWriters } from '@/data/hooks'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Feedback'
import { cn, placeholderImage } from '@/lib/utils'
import type { BoothFrames, BoothSession } from '@/types'

const SHOTS = 4
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const rid = () => Math.random().toString(36).slice(2, 10)

export interface TogetherResult { frames: string[]; names: [string, string]; sessionId: string }

type Stage = { k: 'lobby' } | { k: 'ready' } | { k: 'count'; n: number; shot: number } | { k: 'waiting' }

/**
 * Long-distance photo booth. Both partners open this screen; presence is a heartbeat in a shared document.
 * When either presses "Start together", the other client sees the new session and both run the *same* local
 * countdown/capture sequence, so the shutters fire within a fraction of a second of each other.
 * Frames are exchanged through short-lived `boothFrames` documents and merged into one strip.
 */
export function TogetherBooth({ onDone }: { onDone: (r: TogetherResult) => void }) {
  const { me, partner, couple, coupleId } = useCouple()
  const { isDemo } = useAuth()
  const toast = useToast()
  const cam = useCamera()
  const { set, notifyPartner, uid } = useWriters()
  const { items: sessions, loading } = useCollection<BoothSession>('booth')
  const [activeSid, setActiveSid] = useState('')
  const { items: frameDocs } = useCollection<BoothFrames>('boothFrames', [['sessionId', activeSid || '-']])

  const [stage, setStage] = useState<Stage>({ k: 'lobby' })
  const [partnerHere, setPartnerHere] = useState(isDemo)
  const [flash, setFlash] = useState(0)
  const [mine, setMine] = useState<string[]>([])
  const [starting, setStarting] = useState(false)
  const cancelRef = useRef(false)
  const handled = useRef<string>('')
  const initialSid = useRef<string | null>(null)
  const lastSeen = useRef<{ v: unknown; at: number }>({ v: undefined, at: 0 })
  const finished = useRef(false)

  const session = sessions.find((s) => s.id === coupleId)
  const partnerUid = partner?.uid ?? ''
  const leftUid = couple?.members[0] ?? uid
  const rightUid = couple?.members[1] ?? partnerUid
  const nameOf = (u: string) => (u === uid ? me?.name : partner?.name) ?? ''

  /* ── presence: heartbeat out, change-detection in (so device clocks never need to agree) ── */
  useEffect(() => {
    if (!coupleId || isDemo) return
    const beat = () => set('booth', coupleId, { [`seen_${uid}`]: Date.now() }).catch(() => undefined)
    beat()
    const t = setInterval(beat, 4000)
    return () => { clearInterval(t); set('booth', coupleId, { [`seen_${uid}`]: 0 }).catch(() => undefined) }
  }, [coupleId, uid, set, isDemo])

  const seenVal = session?.[`seen_${partnerUid}`]
  useEffect(() => {
    if (isDemo) return
    if (seenVal && seenVal !== lastSeen.current.v) lastSeen.current = { v: seenVal, at: Date.now() }
    if (!seenVal) lastSeen.current = { v: seenVal, at: 0 }
  }, [seenVal, isDemo])
  useEffect(() => {
    if (isDemo) { const t = setTimeout(() => setPartnerHere(true), 1800); return () => clearTimeout(t) }
    const t = setInterval(() => setPartnerHere(lastSeen.current.at > 0 && Date.now() - lastSeen.current.at < 12000), 1000)
    return () => clearInterval(t)
  }, [isDemo])

  /* ── camera on while this screen is open ── */
  useEffect(() => { cam.start('user') }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── let the partner know we're waiting (at most once per 10 minutes) ── */
  useEffect(() => {
    if (isDemo || !coupleId) return
    const t = setTimeout(() => {
      if (partnerHere) return
      const key = `lp_booth_ping_${coupleId}`
      let last = 0
      try { last = Number(localStorage.getItem(key) ?? 0) } catch { /* ignore */ }
      if (Date.now() - last < 600_000) return
      try { localStorage.setItem(key, String(Date.now())) } catch { /* ignore */ }
      notifyPartner('message', `${me?.name} is waiting in the Photo Booth 📸`, '/photo-booth', 'Open it to take a strip together.')
      toast.show(`We let ${partner?.name} know you're here ❤️`, 'love')
    }, 2500)
    return () => clearTimeout(t)
  }, [coupleId]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── the shared shooting sequence ── */
  const run = useCallback(async (sid: string) => {
    if (handled.current === sid) return
    handled.current = sid
    cancelRef.current = false
    setActiveSid(sid); setMine([]); setStarting(false)
    setStage({ k: 'ready' })
    await sleep(3000)
    const shots: string[] = []
    for (let i = 0; i < SHOTS; i++) {
      for (let c = 3; c > 0; c--) {
        if (cancelRef.current) return
        setStage({ k: 'count', n: c, shot: i })
        await sleep(1000)
      }
      if (cancelRef.current) return
      const shot = cam.grab(1, 480, 0.72) ?? (isDemo ? placeholderImage(`me${i}`, String(i + 1), 480, 480) : null)
      if (!shot) { toast.error("We couldn't capture that — please try again."); setStage({ k: 'lobby' }); return }
      shots.push(shot); setMine([...shots]); setFlash((f) => f + 1)
      await sleep(900)
    }
    setStage({ k: 'waiting' })
    if (isDemo) {
      const partnerShots = shots.map((_, i) => placeholderImage(`partner${i}`, '♥', 480, 480))
      const ordered = shots.flatMap((s, i) => (leftUid === uid ? [s, partnerShots[i]] : [partnerShots[i], s]))
      await sleep(1200)
      if (!finished.current) { finished.current = true; onDone({ frames: ordered, names: [nameOf(leftUid), nameOf(rightUid)], sessionId: sid }) }
      return
    }
    try { await set('boothFrames', `${sid}_${uid}`, { sessionId: sid, uid, frames: shots }) }
    catch { toast.error("We couldn't send your photos. Please try again."); setStage({ k: 'lobby' }) }
  }, [cam, coupleId, isDemo, leftUid, rightUid, onDone, set, toast, uid]) // eslint-disable-line react-hooks/exhaustive-deps

  // remember what was already in the doc when we arrived — that session is stale
  useEffect(() => { if (!loading && initialSid.current === null) initialSid.current = session?.sessionId ?? '' }, [loading, session?.sessionId])

  // partner started a session → join it
  useEffect(() => {
    if (loading || isDemo || !session || session.phase !== 'shooting' || !session.sessionId) return
    if (session.startedBy === uid || session.sessionId === initialSid.current) return
    if (cam.status !== 'ready') return
    run(session.sessionId)
  }, [session?.sessionId, session?.phase, loading, cam.status]) // eslint-disable-line react-hooks/exhaustive-deps

  // both sets of frames are in → merge
  useEffect(() => {
    if (stage.k !== 'waiting' || isDemo || finished.current) return
    const left = frameDocs.find((f) => f.uid === leftUid), right = frameDocs.find((f) => f.uid === rightUid)
    if (!left || !right || left.frames.length < SHOTS || right.frames.length < SHOTS) return
    finished.current = true
    const frames = Array.from({ length: SHOTS }, (_, i) => [left.frames[i], right.frames[i]]).flat()
    onDone({ frames, names: [nameOf(leftUid), nameOf(rightUid)], sessionId: activeSid })
  }, [frameDocs, stage.k]) // eslint-disable-line react-hooks/exhaustive-deps

  // give up waiting for the partner's photos after a minute
  useEffect(() => {
    if (stage.k !== 'waiting' || isDemo) return
    const t = setTimeout(() => { toast.error(`${partner?.name}'s photos didn't arrive. Check their connection and try again.`); setStage({ k: 'lobby' }) }, 60_000)
    return () => clearTimeout(t)
  }, [stage.k]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = async () => {
    if (!coupleId || cam.status !== 'ready') return
    finished.current = false
    setStarting(true)
    const sid = rid()
    try {
      if (!isDemo) await set('booth', coupleId, { phase: 'shooting', sessionId: sid, startedBy: uid })
      run(sid) // starts after the write is acknowledged, i.e. about when the partner's device hears about it
    } catch { setStarting(false); toast.error("We couldn't start the session. Check your connection.") }
  }

  const cancel = () => {
    cancelRef.current = true
    setStage({ k: 'lobby' }); setStarting(false)
    if (coupleId && !isDemo) set('booth', coupleId, { phase: 'lobby' }).catch(() => undefined)
    handled.current = ''
  }

  const busy = stage.k !== 'lobby'

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center">
      {/* who's here */}
      <div className="card mb-5 flex w-full items-center justify-around gap-3 p-4">
        <Presence name={me?.name} photo={me?.photoURL} here label="You" ready={cam.status === 'ready'} />
        <motion.div animate={{ scale: partnerHere ? [1, 1.2, 1] : 1 }} transition={{ repeat: partnerHere ? Infinity : 0, duration: 1.8 }} className={cn('text-2xl', partnerHere ? 'text-wine' : 'text-line')}>♥</motion.div>
        <Presence name={partner?.name} photo={partner?.photoURL} here={partnerHere} label={partnerHere ? 'Here' : 'Not here yet'} />
      </div>

      {/* camera */}
      <div className="relative aspect-square w-full max-w-[min(100%,28rem)] overflow-hidden rounded-[2rem] bg-wine-deep shadow-lift">
        <video ref={cam.videoRef} playsInline muted autoPlay aria-label="Your camera" className="absolute inset-0 h-full w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
        {cam.status === 'starting' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"><Spinner className="text-white" /><p className="text-sm">Starting your camera…</p></div>}
        {cam.status === 'error' && !isDemo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-wine-deep p-6 text-center text-white" role="alert">
            <CameraOff className="h-10 w-10 text-rose" /><p className="font-serif text-2xl">We can't see the camera</p>
            <p className="max-w-xs text-sm text-blush/80">{cam.error}</p>
            <Button variant="soft" size="sm" onClick={() => cam.start('user')}>Try again</Button>
          </div>
        )}
        {cam.status === 'error' && isDemo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-wine to-wine-deep p-6 text-center text-white">
            <ImagePlus className="h-8 w-8 text-rose" /><p className="font-serif text-xl">Demo mode: no camera needed</p><p className="text-xs text-blush/80">Sample photos will be used.</p>
          </div>
        )}
        {cam.status === 'ready' && stage.k === 'lobby' && <div className="pointer-events-none absolute inset-4 rounded-[1.4rem] border border-white/30" />}
        <AnimatePresence mode="wait">
          {stage.k === 'ready' && (
            <motion.div key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-center text-white">
              <p className="font-serif text-4xl font-semibold">Get ready…</p><p className="mt-1 text-sm">{partner?.name}'s camera is counting down with yours</p>
            </motion.div>
          )}
          {stage.k === 'count' && (
            <motion.div key={`${stage.shot}-${stage.n}`} initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.5 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center font-serif text-[9rem] font-semibold text-white drop-shadow-[0_4px_24px_rgba(0,0,0,.45)]" aria-live="assertive">{stage.n}</motion.div>
          )}
          {stage.k === 'waiting' && (
            <motion.div key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-wine-deep/80 text-center text-white">
              <Hourglass className="h-8 w-8 text-rose" /><p className="font-serif text-2xl">Waiting for {partner?.name}'s photos…</p>
            </motion.div>
          )}
        </AnimatePresence>
        {stage.k === 'count' && <div className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">Shot {stage.shot + 1} of {SHOTS}</div>}
        {flash > 0 && <div key={flash} className="pointer-events-none absolute inset-0 animate-flash bg-white" />}
      </div>

      <div className="mt-3 flex h-12 items-center gap-2">
        {Array.from({ length: SHOTS }, (_, i) => (
          <div key={i} className={cn('h-11 w-11 overflow-hidden rounded-lg border', mine[i] ? 'border-wine' : 'border-dashed border-line bg-blush/30')}>
            {mine[i] && <motion.img initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} src={mine[i]} alt={`Your shot ${i + 1}`} className="h-full w-full object-cover" />}
          </div>
        ))}
      </div>

      <div className="mt-2 w-full max-w-sm text-center">
        {busy ? (
          <Button variant="outline" size="lg" onClick={cancel}><X className="h-4 w-4" /> Cancel</Button>
        ) : (
          <Button size="lg" className="w-full" onClick={start} loading={starting} disabled={!partnerHere || (cam.status !== 'ready' && !isDemo)}>
            {partnerHere ? <><Camera className="h-5 w-5" /> Start together</> : <><Users className="h-5 w-5" /> Waiting for {partner?.name}…</>}
          </Button>
        )}
        <p className="mt-3 text-xs text-muted">
          {partnerHere ? `${partner?.name} is here. Press start and you'll both get a 3-2-1 for four shots at the same moment.` : `We've let ${partner?.name} know. Keep this page open — the button unlocks the moment they join.`}
        </p>
        <p className="mt-1 text-[11px] text-muted">Photos are shared with {partner?.name} only for this strip and deleted when you finish.</p>
      </div>
    </div>
  )
}

function Presence({ name, photo, here, label, ready }: { name?: string; photo?: string; here: boolean; label: string; ready?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <div className="relative">
        <Avatar src={photo} name={name} size="lg" className={cn('transition-opacity', !here && 'opacity-45 grayscale')} />
        <span className={cn('absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface', here ? 'bg-green-500' : 'bg-line')}>{here && <Check className="h-3 w-3 text-white" />}</span>
      </div>
      <p className="text-sm font-medium leading-none">{name}</p>
      <p className={cn('text-xs', here ? 'text-green-600' : 'text-muted')}>{ready === false ? 'Camera off' : label}</p>
    </div>
  )
}

/** Removes the temporary frame documents of a finished/abandoned session (both people's). */
export async function deleteBoothFrames(remove: (col: 'boothFrames', id: string) => Promise<void>, sessionId: string, members: string[]) {
  await Promise.all(members.map((m) => remove('boothFrames', `${sessionId}_${m}`).catch(() => undefined)))
}
